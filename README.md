# File Processing Utility

Internal PDF processing tool — Express + TypeScript API, Next.js frontend.

## Architecture

```
Browser
  │
  ├─► Next.js (UI + proxy.ts + thin BFF routes)
  │     • Sets httpOnly cookie on login (same domain — works on Render)
  │     • Proxies auth requests to Express
  │
  └─► Express (MongoDB — auth only for now)
        • Register, login, me
        • PDF tools to be added later
```

**MongoDB lives on Express only.** Next.js never connects to the database.

## Setup

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/file-processing
JWT_SECRET=your-secret
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
JWT_SECRET=your-secret
EXPRESS_API_URL=http://localhost:5000
```

`JWT_SECRET` must match on both apps.

### Run locally

```bash
# Terminal 1 — start API first
cd backend && npm install && npm run dev

# Terminal 2
cd frontend && npm install && npm run dev
```

- Frontend: http://localhost:3000
- Backend health: http://localhost:5000/health

## Backend API (current)

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)

## Next.js BFF (browser calls these)

- `POST /api/auth/register` → Express
- `POST /api/auth/login` → Express + sets cookie
- `POST /api/auth/logout` → clears cookie
- `GET /api/auth/me` → reads cookie locally
