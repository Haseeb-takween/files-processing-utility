# File Processing Utility

Initial project setup — Express + TypeScript backend, Next.js frontend.

## Structure

```
file_processing_utility/
├── backend/          # Express + TypeScript (health route only)
└── frontend/         # Next.js default app
```

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Health check: `GET http://localhost:5000/health`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:3000`

## Backend folders (ready for implementation)

```
backend/src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── jobs/
├── utils/
└── types/
```
