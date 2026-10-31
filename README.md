# Masar Logistics Dashboard

## Neon Postgres

The Neon project configuration is in `neon.ts` and `.neon`. From the `first`
directory, sign in and deploy the declared Postgres service:

```powershell
npm install --global neon@latest
neon login
neon deploy
```

`neon deploy` writes the pooled `DATABASE_URL` and direct
`DATABASE_URL_UNPOOLED` to `.env.local` (or `.env` if that file already
exists). The backend loads that file without overriding environment variables.
It uses the pooled URL for application requests; use the direct URL for
migrations and administrative operations. These env files are ignored by Git.

## Deploy the complete app to Vercel

The project is configured as one Vercel deployment: Vercel builds the React
frontend and serves it alongside the FastAPI function. Shipment data and
sessions require a persistent PostgreSQL database; the local SQLite file is
not used or uploaded in production.

1. Push the `first` directory to a GitHub repository. The `.gitignore` keeps
   virtual environments, build output, secrets, and local SQLite databases
   out of Git.
2. Create a persistent PostgreSQL database with a provider such as Neon. Copy
   its SQLAlchemy connection string; do not commit it or share it in chat.
3. Import the repository into Vercel and set **Root Directory** to `first`.
   Leave the Vercel build command at its default so the FastAPI build script
   in `pyproject.toml` can build the frontend.
4. Add these environment variables in the Vercel project settings for
   Production, Preview, and Development:

   ```text
   DATABASE_URL=postgresql://...
   LOGISTICS_COOKIE_SECURE=true
   ```

   Use Neon's pooled connection string for `DATABASE_URL`. The app also
   accepts `LOGISTICS_DATABASE_URL`; both `postgresql://` and `postgres://`
   URLs are configured to use the Psycopg driver.
5. Deploy. The database tables are initialized automatically. Open `/register`
   on the deployed site to create your account, then sign in at `/login`.
   Vercel provides HTTPS, and the session cookie is restricted to HTTPS.

`vercel.json` sends `/api/...` requests to FastAPI; the remaining requests serve
the React app. Vercel uses `BackEnd.main:app` as its Python entrypoint and
`build_frontend.py` to install the locked npm dependencies and build
`FrontEnd/dist`.

**Existing local data is not copied to the hosted database automatically.**
The account and five shipments in `BackEnd/logistics.db` remain local. If you
want them in production, migrate them to PostgreSQL before creating production
accounts; never upload `logistics.db` to Git.

## Run locally

From the `first` directory in PowerShell:

```powershell
# Use the local SQLite database:
$env:LOGISTICS_DATABASE_URL = "sqlite:///./BackEnd/logistics.db"
.\BackEnd\venv\Scripts\python.exe -m pip install -r requirements.txt
.\BackEnd\venv\Scripts\python.exe -m uvicorn BackEnd.main:app --reload
```

To run locally against Neon instead, deploy/pull the Neon environment first and
leave `LOGISTICS_DATABASE_URL` unset; the backend loads `DATABASE_URL` from
`.env.local` or `.env`.

In another terminal:

```powershell
cd FrontEnd
npm ci
npm run dev
```

The Vite development server proxies `/api` to `http://127.0.0.1:8000`.
For a fresh local database, set
`LOGISTICS_DATABASE_URL=sqlite:///./BackEnd/logistics.db` before starting the
backend, then create the initial account securely:

```powershell
.\BackEnd\venv\Scripts\python.exe -m BackEnd.create_admin
```

The command prompts for an email and a password of at least 12 characters
without echoing the password. It assigns any existing shipments without an
owner to the new account.
