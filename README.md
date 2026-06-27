# File Processing Utility

Internal PDF processing tool — Express + TypeScript API, Next.js frontend.

## Architecture

```
Browser
  │
  ├─► Next.js (UI + proxy + BFF routes)
  │     • Sets httpOnly cookie on login (same domain — works on Render)
  │     • Proxies auth and PDF tool requests to Express
  │
  └─► Express (MongoDB — auth, usage logging, PDF processing)
        • Auth (register, login, me)
        • PDF tools (merge, split, compress, convert, pages, watermark)
        • Per-request upload dirs, cleanup job, rate limiting
```

**MongoDB lives on Express only.** Next.js never connects to the database.

## PDF Tools

| Tool | Route | Description |
|------|-------|-------------|
| Merge | `POST /api/pdf/merge` | Combine 2+ PDFs into one |
| Split | `POST /api/pdf/split` | Split by page range or extract pages |
| Compress | `POST /api/pdf/compress` | Reduce PDF file size |
| Convert | `POST /api/pdf/convert` | PDF ↔ Word, images ↔ PDF |
| Pages | `POST /api/pdf/pages` | Add blank page or remove a page |
| Watermark | `POST /api/pdf/watermark` | Add text watermark |

All tool endpoints require authentication (Bearer token). The browser calls Next.js BFF routes at `/api/pdf/[tool]`, which forward to Express.

## Upload Limits

| Limit | Value |
|-------|-------|
| Max file size | **15 MB** per file (`MAX_FILE_SIZE_MB`) |
| Max files per request | **10** |
| Allowed types | PDF, JPEG, PNG |

Oversized files return **413** with a clear message. Unsupported types return **400**. Invalid, corrupt, or password-protected PDFs return **422** — the server does not crash.

## Reliability Under Concurrent Use

- **Isolated uploads** — each request gets its own UUID folder under `uploads/`, so concurrent users never overwrite each other's files.
- **Immediate cleanup** — upload folders are deleted after every request (success or failure).
- **Rate limiting** — per-IP limit (default 1000 requests per 15 minutes) to reduce abuse.
- **Graceful errors** — bad uploads and bad PDFs return structured JSON errors via the global error handler.

**Note:** PDF processing is CPU-bound on a single Node.js process. Many concurrent jobs can increase response times on a small server; a load test (below) measures real behaviour.

## Cleanup & Temporary File Management

Files are **not stored permanently**.

1. **Per request** — after processing, the upload directory is removed in a `finally` block (even if processing fails).
2. **Scheduled sweep** — on server start, a background job runs every 5 minutes and deletes any folders in `uploads/` or `outputs/` older than **30 minutes** (`FILE_TTL_MINUTES`). This catches orphans from crashes or partial failures.
3. **Streamed output** — processed files are sent in the HTTP response; they are not kept on disk for later download.

This prevents disk from filling up over weeks of normal use.

## Setup

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/file-processing
JWT_SECRET=your-secret
FRONTEND_URL=http://localhost:3000

# File processing
MAX_FILE_SIZE_MB=15
UPLOAD_DIR=uploads
OUTPUT_DIR=outputs
FILE_TTL_MINUTES=30

# Rate limiting (per IP). Raise RATE_LIMIT_MAX when running load tests.
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
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

## Backend API

### Health & auth

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)

### PDF tools (auth required)

- `POST /api/pdf/:tool` — `tool` is one of: `merge`, `split`, `compress`, `convert`, `pages`, `watermark`
- Multipart form field: `files` (array, up to 10 files)

### Usage

- `GET /api/usage/me` (Bearer token) — current user's tool usage history

## Next.js BFF (browser calls these)

- `POST /api/auth/register` → Express
- `POST /api/auth/login` → Express + sets cookie
- `POST /api/auth/logout` → clears cookie
- `GET /api/auth/me` → reads cookie locally
- `POST /api/pdf/[tool]` → Express (forwards upload + cookie as Bearer token)
- `GET /api/usage/me` → Express

## Load Test

A load test script simulates concurrent PDF merge requests (default: 100 requests, 50 concurrent workers).

```bash
cd backend
npm run load-test

# Against a deployed server:
npm run load-test -- --url https://your-backend.onrender.com --requests 100 --concurrency 50
```

The script reports success/failure counts, HTTP status codes, throughput, and latency (min, avg, p50, p95, p99).

**Before load testing a deployed server**, ensure `RATE_LIMIT_MAX` is high enough to avoid 429 responses from the rate limiter.

Run this against your **deployed** backend and record the results (and a Loom video) for your submission.
