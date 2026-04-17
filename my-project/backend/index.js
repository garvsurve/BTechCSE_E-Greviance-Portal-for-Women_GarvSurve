const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;

// --- Database setup ---
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'complaints.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    village TEXT,
    block TEXT,
    district TEXT,
    state TEXT,
    channel TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    anonymous INTEGER NOT NULL,
    reporterName TEXT,
    reporterPhone TEXT,
    assignedTo TEXT,
    resolutionNotes TEXT,
    latitude REAL,
    longitude REAL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

// Ensure latitude/longitude columns exist for older databases
const complaintColumns = db.prepare('PRAGMA table_info(complaints)').all();
const hasLatitude = complaintColumns.some((col) => col.name === 'latitude');
if (!hasLatitude) {
  db.exec('ALTER TABLE complaints ADD COLUMN latitude REAL');
}
const hasLongitude = complaintColumns.some((col) => col.name === 'longitude');
if (!hasLongitude) {
  db.exec('ALTER TABLE complaints ADD COLUMN longitude REAL');
}

const insertComplaintStmt = db.prepare(`
  INSERT INTO complaints (
    id, category, description, village, block, district, state,
    channel, priority, status, anonymous,
    reporterName, reporterPhone, assignedTo, resolutionNotes,
    latitude, longitude,
    createdAt, updatedAt
  ) VALUES (
    @id, @category, @description, @village, @block, @district, @state,
    @channel, @priority, @status, @anonymous,
    @reporterName, @reporterPhone, @assignedTo, @resolutionNotes,
    @latitude, @longitude,
    @createdAt, @updatedAt
  );
`);

const selectAllComplaintsStmt = db.prepare(
  'SELECT * FROM complaints ORDER BY datetime(createdAt) DESC'
);

const selectComplaintByIdStmt = db.prepare(
  'SELECT * FROM complaints WHERE id = ?'
);

const deleteComplaintByIdStmt = db.prepare(
  'DELETE FROM complaints WHERE id = ?'
);

const deleteAllComplaintsStmt = db.prepare(
  'DELETE FROM complaints'
);

function rowToComplaint(row) {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    village: row.village,
    block: row.block,
    district: row.district,
    state: row.state,
    channel: row.channel,
    priority: row.priority,
    status: row.status,
    anonymous: !!row.anonymous,
    reporterName: row.reporterName,
    reporterPhone: row.reporterPhone,
    assignedTo: row.assignedTo,
    resolutionNotes: row.resolutionNotes,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    // For compatibility with existing web dashboard field name
    submittedAt: row.createdAt
  };
}

function computeSummary(complaints) {
  const summary = {
    total: complaints.length,
    byStatus: {
      New: 0,
      'In Progress': 0,
      Resolved: 0,
      Escalated: 0,
      Closed: 0
    },
    byPriority: {
      Low: 0,
      Medium: 0,
      High: 0
    }
  };

  for (const c of complaints) {
    const st = c.status || 'New';
    if (summary.byStatus[st] === undefined) {
      summary.byStatus[st] = 0;
    }
    summary.byStatus[st] += 1;

    const pr = c.priority || 'Medium';
    if (summary.byPriority[pr] === undefined) {
      summary.byPriority[pr] = 0;
    }
    summary.byPriority[pr] += 1;
  }

  return summary;
}

// --- HTTP + WebSocket setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS']
  }
});

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
  console.log('WebSocket client connected', socket.id);
  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected', socket.id);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/complaints', (req, res) => {
  const { status, search } = req.query;

  let rows = selectAllComplaintsStmt.all();
  let complaints = rows.map(rowToComplaint);

  if (status && status !== 'All') {
    const statusLower = String(status).toLowerCase();
    complaints = complaints.filter((c) => c.status.toLowerCase() === statusLower);
  }

  if (search && String(search).trim() !== '') {
    const q = String(search).trim().toLowerCase();
    complaints = complaints.filter((c) => {
      return (
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.village && c.village.toLowerCase().includes(q)) ||
        (c.block && c.block.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q))
      );
    });
  }

  res.json(complaints);
});

app.get('/api/complaints/:id', (req, res) => {
  const { id } = req.params;
  const row = selectComplaintByIdStmt.get(id);
  if (!row) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  res.json(rowToComplaint(row));
});

app.post('/api/complaints', (req, res) => {
  const body = req.body || {};

  if (!body.description || String(body.description).trim() === '') {
    return res.status(400).json({ error: 'Description is required' });
  }

  const now = new Date();
  const id = body.id || `C-${now.getTime()}`;

  const record = {
    id,
    category: body.category || 'Uncategorized',
    description: String(body.description).trim(),
    village: body.village || null,
    block: body.block || null,
    district: body.district || null,
    state: body.state || null,
    channel: body.channel || 'MobileApp',
    priority: body.priority || 'Medium',
    status: body.status || 'New',
    anonymous: body.anonymous ? 1 : 0,
    reporterName: body.reporterName || null,
    reporterPhone: body.reporterPhone || null,
    assignedTo: body.assignedTo || null,
    resolutionNotes: body.resolutionNotes || null,
    latitude:
      typeof body.latitude === 'number' ? body.latitude : null,
    longitude:
      typeof body.longitude === 'number' ? body.longitude : null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  insertComplaintStmt.run(record);

  const complaint = rowToComplaint(record);
  io.emit('complaint:created', complaint);

  res.status(201).json(complaint);
});

app.patch('/api/complaints/:id', (req, res) => {
  const { id } = req.params;
  const body = req.body || {};

  const updates = {};

  if (body.status) updates.status = body.status;
  if (body.priority) updates.priority = body.priority;
  if (Object.prototype.hasOwnProperty.call(body, 'assignedTo')) {
    updates.assignedTo = body.assignedTo;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'resolutionNotes')) {
    updates.resolutionNotes = body.resolutionNotes;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided' });
  }

  const existing = selectComplaintByIdStmt.get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const now = new Date().toISOString();
  updates.updatedAt = now;

  const setClause = Object.keys(updates)
    .map((key) => `${key} = @${key}`)
    .join(', ');

  const stmt = db.prepare(`UPDATE complaints SET ${setClause} WHERE id = @id`);
  stmt.run({ ...updates, id });

  const updated = selectComplaintByIdStmt.get(id);
  const complaint = rowToComplaint(updated);
  io.emit('complaint:updated', complaint);

  res.json(complaint);
});

app.delete('/api/complaints/:id', (req, res) => {
  const { id } = req.params;

  const existing = selectComplaintByIdStmt.get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  deleteComplaintByIdStmt.run(id);

  io.emit('complaint:deleted', { id });

  res.json({ success: true });
});

app.delete('/api/complaints', (req, res) => {
  deleteAllComplaintsStmt.run();

  io.emit('complaint:cleared');

  res.json({ success: true });
});

app.get('/api/stats/summary', (req, res) => {
  const rows = selectAllComplaintsStmt.all();
  const complaints = rows.map(rowToComplaint);
  const summary = computeSummary(complaints);
  res.json(summary);
});

server.listen(PORT, () => {
  console.log(`Backend API and WebSocket server running on http://localhost:${PORT}`);
});
