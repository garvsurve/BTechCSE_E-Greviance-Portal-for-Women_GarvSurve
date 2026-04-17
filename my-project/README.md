# Rural Women Grievance System – Full Stack Prototype

This repository contains a working end-to-end prototype of a state-level grievance system for rural women, with:

- **Flutter mobile app** (`mobile_app`) – complaint submission and tracking UI for women.
- **React web admin dashboard** (`web_app`) – state/block/district-level monitoring UI for officials.
- **Node.js backend API + WebSocket server** (`backend`) – central complaint store and realtime updates.

The system is currently using an **in-memory backend store** (no external DB required) but is structured so a real database can be plugged in later.

---

## 1. Backend (API + WebSockets)

**Path:** `backend`

### Run backend in dev mode

```bash
cd backend
npm install        # first time only
npm run dev        # starts http://localhost:4000 with Socket.IO
```

### Key endpoints

- `GET /api/health` – quick health check.
- `GET /api/complaints` – list complaints.
  - Optional query params: `status`, `search`.
- `GET /api/complaints/:id` – fetch a single complaint.
- `POST /api/complaints` – create a new complaint.
- `PATCH /api/complaints/:id` – update status/priority/assignment/resolution notes.
- `GET /api/stats/summary` – aggregated counts by status and priority.

### WebSocket events (Socket.IO)

All events are emitted on the same origin as the API (`http://localhost:4000`).

- `complaint:created` – fired when a new complaint is created.
- `complaint:updated` – fired when an existing complaint is updated.

The React admin dashboard already connects to these events for live updates.

---

## 2. React Web Admin Dashboard

**Path:** `web_app`

### Install & run in dev mode

```bash
cd web_app
npm install        # first time only
npm run dev        # Vite dev server (usually http://localhost:5173/)
```

Make sure the **backend is running on `http://localhost:4000`** before starting the dashboard.

### What it does

- Loads complaints from `GET http://localhost:4000/api/complaints`.
- Subscribes to Socket.IO events from `http://localhost:4000`:
  - `complaint:created` – inserts new complaints live.
  - `complaint:updated` – updates rows when status/priority change.
- Shows:
  - Overview stats (Total, New, In Progress, Resolved).
  - Filters by **status** and **search text** (ID, village, category, district).
  - Table view with: ID, category, village, block, district, channel, priority, status, submitted at.

To preview the **production build**:

```bash
npm run build
npm run preview
```

---

## 3. Flutter Mobile App

**Path:** `mobile_app`

### Install dependencies & run (web / Chrome)

```bash
cd mobile_app
flutter pub get
flutter run -d chrome
```

Make sure the **backend is running on `http://localhost:4000`** first.

### What it does

- On startup, loads complaints from `GET http://localhost:4000/api/complaints` and displays them:
  - **Dashboard** – counts by status + recent complaints list.
  - **My Complaints** – card list of all complaints with status and timestamps.
- On **New Complaint** form submit:
  - Sends `POST http://localhost:4000/api/complaints` with category, description, village, anonymous flag.
  - On success, updates local list and shows a confirmation Snackbar.

> Note (Android emulator / physical device):
> - `kApiBaseUrl` is currently `http://localhost:4000`, which works for **Flutter web (Chrome)**.
> - For Android emulator, you may need to change this to `http://10.0.2.2:4000`.
> - For a physical phone on the same Wi‑Fi, set it to your PC’s LAN IP (e.g. `http://192.168.x.y:4000`).

---

## 4. Current Status & Next Steps

Right now you have a **fully wired prototype**:

- Backend API + realtime events (Socket.IO).
- Web admin dashboard consuming the backend + WebSockets.
- Flutter app consuming the backend for both **read** and **create** operations.

Planned next enhancements to move closer to a production/state deployment:

- Swap in a real database (e.g. PostgreSQL) instead of in-memory storage.
- Add authentication/roles (citizen vs. block/district/state officials).
- Add more channels: SMS, WhatsApp bot, and voice/IVR integration.
- Extend workflow: escalation rules, SLAs, resolution tracking, audit logs.
- Multilingual + low-literacy UX refinements (icons, voice prompts, local language bundles).
