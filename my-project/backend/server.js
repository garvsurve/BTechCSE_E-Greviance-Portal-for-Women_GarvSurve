const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 4000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  },
});

app.use(cors());
app.use(express.json());

const DEV_FIXED_OTP = '7532';

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore() {
  ensureDataDir();
  if (!fs.existsSync(STORE_PATH)) {
    return { users: [], complaints: [], sessions: [] };
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      complaints: Array.isArray(parsed.complaints) ? parsed.complaints : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch (e) {
    return { users: [], complaints: [], sessions: [] };
  }
}

function writeStore(nextStore) {
  ensureDataDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(nextStore, null, 2), 'utf8');
}

const store = readStore();

const sessions = new Map(
  (Array.isArray(store.sessions) ? store.sessions : [])
    .filter((s) => s && typeof s === 'object' && s.token && s.userId)
    .map((s) => [String(s.token), { token: String(s.token), userId: String(s.userId), createdAt: s.createdAt }])
);

function sanitizePhone(phone) {
  return String(phone || '')
    .trim()
    .replace(/\s+/g, '');
}

function getBearerToken(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const [type, value] = String(auth).split(' ');
  if (!type || type.toLowerCase() !== 'bearer') return null;
  return value || null;
}

function optionalAuth(req, _res, next) {
  const token = getBearerToken(req);
  if (!token) {
    req.user = null;
    return next();
  }
  const session = sessions.get(token);
  if (!session) {
    req.user = null;
    return next();
  }
  const user = store.users.find((u) => u.id === session.userId) || null;
  req.user = user;
  req.authToken = token;
  next();
}

function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });
}

function computeSummary(items) {
  const summary = {
    total: items.length,
    byStatus: {
      New: 0,
      'In Progress': 0,
      Resolved: 0,
      Escalated: 0,
      Closed: 0,
    },
    byPriority: {
      Low: 0,
      Medium: 0,
      High: 0,
    },
  };

  for (const c of items) {
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

io.on('connection', (socket) => {
  console.log('WebSocket client connected', socket.id);
  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected', socket.id);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/auth/request-otp', (req, res) => {
  const body = req.body || {};
  const phone = sanitizePhone(body.phone);
  if (!phone) {
    return res.status(400).json({ error: 'Phone is required' });
  }
  res.json({ success: true, devOtp: DEV_FIXED_OTP });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const body = req.body || {};
  const phone = sanitizePhone(body.phone);
  const otp = String(body.otp || '').trim();
  if (!phone) {
    return res.status(400).json({ error: 'Phone is required' });
  }
  if (!otp) {
    return res.status(400).json({ error: 'OTP is required' });
  }
  if (otp !== DEV_FIXED_OTP) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  const nowIso = new Date().toISOString();

  let user = store.users.find((u) => u.phone === phone) || null;
  const profile = body.profile && typeof body.profile === 'object' ? body.profile : {};

  if (!user) {
    user = {
      id: `U-${uuidv4()}`,
      phone,
      name: profile.name ? String(profile.name).trim() : '',
      village: profile.village ? String(profile.village).trim() : '',
      block: profile.block ? String(profile.block).trim() : '',
      district: profile.district ? String(profile.district).trim() : '',
      state: profile.state ? String(profile.state).trim() : '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.users.unshift(user);
  } else {
    const updated = {
      ...user,
      name: profile.name ? String(profile.name).trim() : user.name,
      village: profile.village ? String(profile.village).trim() : user.village,
      block: profile.block ? String(profile.block).trim() : user.block,
      district: profile.district ? String(profile.district).trim() : user.district,
      state: profile.state ? String(profile.state).trim() : user.state,
      updatedAt: nowIso,
    };
    const idx = store.users.findIndex((u) => u.id === user.id);
    store.users[idx] = updated;
    user = updated;
  }

  writeStore(store);

  const token = uuidv4();
  const session = { token, userId: user.id, createdAt: nowIso };
  sessions.set(token, session);
  store.sessions = Array.isArray(store.sessions) ? store.sessions : [];
  store.sessions.unshift(session);
  writeStore(store);
  res.json({ token, user });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.patch('/api/me', requireAuth, (req, res) => {
  const body = req.body || {};
  const profile = body.profile && typeof body.profile === 'object' ? body.profile : body;

  const idx = store.users.findIndex((u) => u.id === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const nowIso = new Date().toISOString();
  const updated = {
    ...store.users[idx],
    name: profile.name !== undefined ? String(profile.name).trim() : store.users[idx].name,
    village:
      profile.village !== undefined ? String(profile.village).trim() : store.users[idx].village,
    block: profile.block !== undefined ? String(profile.block).trim() : store.users[idx].block,
    district:
      profile.district !== undefined
        ? String(profile.district).trim()
        : store.users[idx].district,
    state: profile.state !== undefined ? String(profile.state).trim() : store.users[idx].state,
    updatedAt: nowIso,
  };

  store.users[idx] = updated;
  writeStore(store);
  res.json({ user: updated });
});

app.get('/api/complaints', (req, res) => {
  const { status, search } = req.query;

  let result = [...store.complaints];

  const mine = String(req.query.mine || '').toLowerCase();
  if (mine === '1' || mine === 'true' || mine === 'yes') {
    const token = getBearerToken(req);
    const session = token ? sessions.get(token) : null;
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    result = result.filter((c) => c.reporterUserId === session.userId);
  }

  if (status && status !== 'All') {
    const statusLower = String(status).toLowerCase();
    result = result.filter((c) => c.status.toLowerCase() === statusLower);
  }

  if (search && String(search).trim() !== '') {
    const q = String(search).trim().toLowerCase();
    result = result.filter((c) => {
      return (
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.village && c.village.toLowerCase().includes(q)) ||
        (c.block && c.block.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q))
      );
    });
  }

  res.json(result);
});

app.get('/api/complaints/:id', (req, res) => {
  const { id } = req.params;
  const complaint = store.complaints.find((c) => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  res.json(complaint);
});

app.post('/api/complaints', (req, res) => {
  const body = req.body || {};

  const anonymous = !!body.anonymous;
  const token = getBearerToken(req);
  const session = token ? sessions.get(token) : null;
  const user = session ? store.users.find((u) => u.id === session.userId) : null;

  if (!user) {
    return res.status(401).json({ error: 'Login required' });
  }

  const errors = [];

  if (!body.category || String(body.category).trim() === '') {
    errors.push('Category is required');
  }
  if (!body.description || String(body.description).trim() === '') {
    errors.push('Description is required');
  }
  if (!body.village || String(body.village).trim() === '') {
    errors.push('Village is required');
  }
  if (!body.block || String(body.block).trim() === '') {
    errors.push('Block is required');
  }
  if (!body.district || String(body.district).trim() === '') {
    errors.push('District is required');
  }
  if (!body.priority || String(body.priority).trim() === '') {
    errors.push('Priority is required');
  }
  if (!body.channel || String(body.channel).trim() === '') {
    errors.push('Channel is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('; ') });
  }

  const nowIso = new Date().toISOString();
  const id = body.id || `C-${Date.now()}`;

  const complaint = {
    id,
    category: String(body.category).trim(),
    description: String(body.description).trim(),
    village: String(body.village).trim(),
    block: String(body.block).trim(),
    district: String(body.district).trim(),
    state: body.state || '',
    channel: String(body.channel).trim(),
    priority: String(body.priority).trim(),
    status: body.status || 'New',
    anonymous,
    reporterUserId: user ? user.id : null,
    reporterName: anonymous ? null : user ? user.name || null : null,
    reporterPhone: anonymous ? null : user ? user.phone || null : null,
    assignedTo: body.assignedTo || null,
    resolutionNotes: body.resolutionNotes || null,
    forwardedTo:
      Object.prototype.hasOwnProperty.call(body, 'forwardedTo')
        ? body.forwardedTo
        : null,
    forwardHistory: [],
    latitude:
      typeof body.latitude === 'number' ? body.latitude : null,
    longitude:
      typeof body.longitude === 'number' ? body.longitude : null,
    createdAt: nowIso,
    updatedAt: nowIso,
    submittedAt: nowIso,
  };

  store.complaints = [complaint, ...store.complaints];
  writeStore(store);

  io.emit('complaint:created', complaint);

  res.status(201).json(complaint);
});

app.patch('/api/complaints/:id', (req, res) => {
  const { id } = req.params;
  const body = req.body || {};

  const index = store.complaints.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const existing = store.complaints[index];

  const token = getBearerToken(req);
  const session = token ? sessions.get(token) : null;
  const actorUser = session ? store.users.find((u) => u.id === session.userId) : null;

  const updated = {
    ...existing,
    status: body.status || existing.status,
    priority: body.priority || existing.priority,
    assignedTo:
      Object.prototype.hasOwnProperty.call(body, 'assignedTo')
        ? body.assignedTo
        : existing.assignedTo,
    resolutionNotes:
      Object.prototype.hasOwnProperty.call(body, 'resolutionNotes')
        ? body.resolutionNotes
        : existing.resolutionNotes,
    forwardedTo:
      Object.prototype.hasOwnProperty.call(body, 'forwardedTo')
        ? body.forwardedTo
        : existing.forwardedTo,
    updatedAt: new Date().toISOString(),
  };

  if (
    Object.prototype.hasOwnProperty.call(body, 'forwardedTo') &&
    body.forwardedTo !== existing.forwardedTo
  ) {
    const at = new Date().toISOString();
    const nextHistory = Array.isArray(existing.forwardHistory)
      ? [...existing.forwardHistory]
      : [];
    nextHistory.push({
      from: existing.forwardedTo || null,
      to: body.forwardedTo || null,
      at,
      byUserId: actorUser ? actorUser.id : null,
      byName: actorUser ? actorUser.name || actorUser.phone : null,
    });
    updated.forwardHistory = nextHistory;
  }

  store.complaints[index] = updated;
  writeStore(store);

  io.emit('complaint:updated', updated);

  res.json(updated);
});

app.delete('/api/complaints/:id', (req, res) => {
  const { id } = req.params;
  const index = store.complaints.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const [removed] = store.complaints.splice(index, 1);
  writeStore(store);

  io.emit('complaint:deleted', removed);

  res.json({ success: true });
});

app.delete('/api/complaints', (req, res) => {
  store.complaints = [];
  writeStore(store);

  io.emit('complaint:cleared');

  res.json({ success: true });
});

app.get('/api/stats/summary', (req, res) => {
  const summary = computeSummary(store.complaints);
  res.json(summary);
});

server.listen(PORT, () => {
  console.log(`Backend API and WebSocket server running on http://localhost:${PORT}`);
});
