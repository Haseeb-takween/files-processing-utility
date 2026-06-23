# File Processing Utility

Internal PDF processing tool — Express + TypeScript backend, Next.js frontend with Brief 2-style cookie auth.

## Structure

```
file_processing_utility/
├── backend/     # Express API (PDF tools, usage logs, JWT validation)
└── frontend/    # Next.js app (auth, UI, BFF proxy to Express)
```

## Auth architecture

- **Register / login / logout** live in Next.js (`/api/auth/*`) with httpOnly `token` cookie
- **`proxy.ts`** protects `/` and `/tools/*` (no admin routes)
- **Express** validates `Authorization: Bearer` tokens from the Next.js BFF
- **PDF requests** go to `/api/pdf/[tool]` on Next.js, which forwards to Express

## Setup

### 1. Environment

Use the **same** `MONGODB_URI` and `JWT_SECRET` for both apps.

**Backend** (`backend/.env`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/file-processing
JWT_SECRET=your-secret
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):

```env
MONGODB_URI=mongodb://localhost:27017/file-processing
JWT_SECRET=your-secret
EXPRESS_API_URL=http://localhost:5000
```

### 2. Run locally

```bash
# Terminal 1
cd backend && npm install && npm run dev

# Terminal 2
cd frontend && npm install && npm run dev
```

- Frontend: http://localhost:3000
- Backend health: http://localhost:5000/health

### 3. Test auth flow

1. Open `/register` and create an account
2. Sign in at `/login`
3. Access `/` and any `/tools/*` page
4. Log out from the navbar
5. Visit `/` while logged out — should redirect to `/login`

## Render deployment

Deploy as **two Web Services**:

| Service | Root | Start |
|---------|------|-------|
| API | `backend` | `npm start` |
| Frontend | `frontend` | `npm start` |

Set `FRONTEND_URL` on the backend to your frontend Render URL.  
Set `EXPRESS_API_URL` on the frontend to your backend Render URL.

## API routes

**Next.js (frontend)**

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/pdf/[tool]` — BFF proxy to Express

**Express (backend)**

- `GET /health`
- `POST /api/pdf/*` — requires JWT (stubs ready)
- `GET /api/usage` — requires JWT
