# Masar Logistics Dashboard

A web dashboard for managing shipments and tracking logistics operations. The
interface is in Arabic, and each account only has access to its own shipments.

## Features

- Create, edit, and delete shipments.
- Search by tracking number or recipient, filter by status, and browse results
  with pagination.
- View shipment totals, status breakdowns, and activity from the last seven
  days.
- Register and sign in with secure, cookie-based sessions.
- Run locally with SQLite or deploy with a persistent PostgreSQL database.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** SQLite for local development; PostgreSQL for production
- **Deployment:** Vercel

## Run locally

You will need Python 3.12 or 3.13 and Node.js with npm.

Open a terminal in the project directory (the directory containing this
README), then create and activate a Python virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

In that terminal, configure a local SQLite database and start the API:

```powershell
$env:LOGISTICS_DATABASE_URL = "sqlite:///./BackEnd/logistics.db"
python -m uvicorn BackEnd.main:app --reload
```

Open a second terminal in the project directory and start the frontend:

```powershell
cd FrontEnd
npm ci
npm run dev
```

Open the local address printed by Vite (usually `http://localhost:5173`). The
frontend proxies API requests to the backend at `http://127.0.0.1:8000`.
FastAPI's interactive API documentation is available at
`http://127.0.0.1:8000/docs`.

Create an account at `/register`. New accounts must use a password of at least
12 characters.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `LOGISTICS_DATABASE_URL` | Database connection string; takes precedence over `DATABASE_URL`. |
| `DATABASE_URL` | Alternative database connection string, commonly set by the deployment platform. |
| `LOGISTICS_COOKIE_SECURE` | Set to `true` in production to send session cookies only over HTTPS. |
| `VITE_API_BASE_URL` | Optional frontend API base URL; defaults to `/api`. |

Do not commit database credentials or `.env` files. For local development,
SQLite is used automatically if no database URL is set. To use PostgreSQL,
provide a PostgreSQL connection string through `LOGISTICS_DATABASE_URL` or
`DATABASE_URL`.

## Deploy to Vercel

The Vercel configuration builds the frontend and serves it with the FastAPI
backend. Shipment and session data in production require a persistent
PostgreSQL database; the local SQLite database is not deployed.

1. Push this project to GitHub. If the repository contains this project inside
   a `first` subdirectory, set Vercel's **Root Directory** to `first`. If the
   project files are at the repository root, use `.`.
2. Connect the GitHub repository to Vercel and add these environment variables
   in the Vercel project settings:

   ```text
   DATABASE_URL=postgresql://...
   LOGISTICS_COOKIE_SECURE=true
   ```

   Use a persistent PostgreSQL database and keep its connection string secret.
3. Deploy. The database tables are initialized automatically. Open `/register`
   on the deployed site to create an account.

Existing local accounts and shipment records are not copied to the production
database. Do not upload `BackEnd/logistics.db` to GitHub.
