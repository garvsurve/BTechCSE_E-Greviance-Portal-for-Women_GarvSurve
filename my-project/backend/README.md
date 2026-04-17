# Rural Women Grievance Backend

Node.js + Express + SQLite + Socket.IO backend for the rural women grievance & complaint system.

## Running locally

```bash
cd backend
npm install
npm run dev
```

The API will start on `http://localhost:4000` with WebSocket events on the same origin.

### Key endpoints

- `GET /api/health` – health check
- `GET /api/complaints` – list complaints (supports `status` and `search` query params)
- `GET /api/complaints/:id` – get single complaint
- `POST /api/complaints` – create complaint
- `PATCH /api/complaints/:id` – update status / priority / assignment / resolution notes
- `GET /api/stats/summary` – summary counts by status and priority

WebSocket events (Socket.IO):

- `complaint:created` – emitted with the created complaint object
- `complaint:updated` – emitted with the updated complaint object
