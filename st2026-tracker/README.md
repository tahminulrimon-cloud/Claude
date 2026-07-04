# ST-2026 Tracker

A personal training-schedule tracker for Exercise BOJRO AGHAT (Summer Training 2026, 05-14 Jul 2026): a timeline/checklist of key dates and deadlines, viewable chronologically or grouped by appointment (CO, 2IC, Adjutant, QM, FB Commanders, Signal Officer, MTO), with a countdown to deployment.

Content is deliberately scoped to scheduling data (dates, tasks, phases, responsible appointments). Tactical/operational specifics (code words, passwords, grid references, ammunition counts, radio frequencies, personnel names) from the source instructions are intentionally left out.

## Run locally

Backend (Express API, persists to `backend/data/timeline.json`):

```
cd backend
npm install
npm run dev   # http://localhost:4026
```

Frontend (React + Vite, proxies `/api` to the backend):

```
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## API

- `GET /api/timeline` - exercise metadata + all timeline items
- `PATCH /api/timeline/items/:id` - update `{ done, notes }` on one item
