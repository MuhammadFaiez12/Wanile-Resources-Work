# Daily Work Report & PM Analytics System

A full-stack platform for collecting daily work reports from your team, nudging
them on Slack, and analysing performance from a private PM dashboard.
**Deploys to Vercel** (frontend + serverless API) on the free Hobby plan.

## What's inside

| Part | Route | Who | Description |
|------|-------|-----|-------------|
| **Employee Report Form** | `/submit` | Whole team (share the link) | Clean daily report form. |
| **PM Analytics Dashboard** | `/dashboard` | You (PIN protected) | KPIs, charts, blockers feed, employee management. |
| **Slack Reminder** | `/api/reminder` | Automated | An external cron hits this at 4:30 PM Mon–Fri; also notifies you on each submission. |

### Tech stack
- **Frontend:** React + Tailwind CSS (Vite) + Recharts
- **API:** Vercel serverless functions (`/api/*`)
- **Database:** [Turso](https://turso.tech) (libSQL — SQLite-compatible, serverless-friendly)
- **Slack:** `@slack/web-api` (stateless, ideal for serverless)
- **Scheduling:** any external cron service hitting `/api/reminder`

---

## Architecture (why it's built this way)

Vercel runs serverless functions on an **ephemeral, read-only filesystem** with
**no always-on process**, so the original Express + `better-sqlite3` + `node-cron`
stack was adapted:

| Concern | Local server version | Vercel version |
|---------|----------------------|----------------|
| API | Long-running Express app | Stateless functions in `/api` |
| Database | SQLite file on disk | Turso (libSQL) over the network |
| 4:30 PM reminder | `node-cron` in-process | External cron → `POST /api/reminder` |
| Slack | Bolt SDK (socket) | `@slack/web-api` (stateless) |

```
client/                 React app (Vite) → built to client/dist (static)
api/
  _lib/                 shared db, analytics, slack, validation, http helpers
  health.js             GET  /api/health
  auth.js               POST /api/auth
  employees/index.js    GET/POST /api/employees
  employees/[id].js     DELETE   /api/employees/:id
  reports/index.js      GET (PIN) / POST (public) /api/reports
  analytics.js          GET  /api/analytics
  reminder.js           GET/POST /api/reminder   (cron secret or PM PIN)
scripts/seed.js         sample data loader
vercel.json             build + SPA-fallback config
```

---

## Deploy to Vercel

### 1. Create a Turso database (free)
```bash
# https://docs.turso.tech/quickstart
turso db create dwr
turso db show dwr --url            # → TURSO_DATABASE_URL (libsql://…)
turso db tokens create dwr         # → TURSO_AUTH_TOKEN
```

### 2. Import the repo into Vercel
- Vercel → **Add New… → Project** → import this Git repo.
- Framework preset: **Other** (the included `vercel.json` handles build & routing).

### 3. Set environment variables (Project → Settings → Environment Variables)

| Variable | Required | Purpose |
|----------|:--------:|---------|
| `TURSO_DATABASE_URL` | ✅ | libSQL connection URL |
| `TURSO_AUTH_TOKEN` | ✅ | libSQL auth token |
| `PM_PIN` | ✅ | Dashboard access PIN |
| `CRON_SECRET` | ✅ | Shared secret the cron must send to `/api/reminder` |
| `SLACK_BOT_TOKEN` | optional | Bot token `xoxb-…` (`chat:write`, `chat:write.public`) |
| `SLACK_CHANNEL_ID` | optional | Channel for reminders + submission notifications |
| `PUBLIC_FORM_URL` | optional | Your deployed URL, embedded in the reminder message |

> Slack is optional — with no token set, reports still save and Slack calls just log.

### 4. Deploy & seed
Click **Deploy**. Then load sample data into Turso (optional):
```bash
TURSO_DATABASE_URL=libsql://… TURSO_AUTH_TOKEN=… npm run seed
```

### 5. Schedule the 4:30 PM reminder (external cron)
On the free plan, use a free scheduler such as **cron-job.org**:
- **URL:** `https://your-app.vercel.app/api/reminder`
- **Schedule:** `30 16 * * 1-5` (4:30 PM, Mon–Fri) in your timezone
- **Header:** `Authorization: Bearer <your CRON_SECRET>` (or append `?key=<CRON_SECRET>`)

---

## Local development

Uses the Vercel CLI so functions + frontend run together. With no Turso vars set,
the DB falls back to a local `local.db` file — zero setup.

```bash
npm install            # function deps (@libsql/client, @slack/web-api)
npm run seed           # optional sample data into local.db
npx vercel dev         # serves UI + /api on http://localhost:3000
```

- Employee form → http://localhost:3000/submit
- PM dashboard → http://localhost:3000/dashboard  (default PIN: `1234`)

---

## API reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | — | Health + whether Slack is enabled |
| `POST` | `/api/auth` | — | Verify PM PIN |
| `GET` | `/api/employees` | — | List employees (dropdown) |
| `POST` | `/api/employees` | PIN | Add an employee |
| `DELETE` | `/api/employees/:id` | PIN | Remove an employee |
| `POST` | `/api/reports` | — | Submit a daily report (+ Slack notify) |
| `GET` | `/api/reports` | PIN | List reports (`?from&to&employee`) |
| `GET` | `/api/analytics` | PIN | Aggregated analytics (same filters) |
| `GET/POST` | `/api/reminder` | CRON_SECRET **or** PIN | Send the Slack reminder now |

PM-protected routes accept the PIN in an `x-pm-pin` header (or `?pin=`).
`/api/reminder` accepts the cron secret as `Authorization: Bearer …` / `?key=…`.

### Setting up Slack
Create an app from [`slack-app-manifest.yml`](./slack-app-manifest.yml) at
<https://api.slack.com/apps>, install it, copy the Bot Token + channel ID into
the Vercel env vars, and use the dashboard's **Test Slack Reminder** button to verify.
