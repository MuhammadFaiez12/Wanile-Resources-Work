# Daily Work Report & PM Analytics System

A full-stack platform for collecting daily work reports from your team, nudging
them on Slack, and analysing performance from a private PM dashboard.

## What's inside

| Part | Route | Who | Description |
|------|-------|-----|-------------|
| **Employee Report Form** | `/submit` | Whole team (share the link) | Clean daily report form. |
| **PM Analytics Dashboard** | `/dashboard` | You (PIN protected) | KPIs, charts, blockers feed, employee management. |
| **Slack Reminder Bot** | — | Automated | Posts a reminder at **4:30 PM, Mon–Fri**, and notifies you whenever someone submits. |

### Tech stack
- **Frontend:** React + Tailwind CSS (Vite) + Recharts
- **Backend:** Node.js + Express
- **Database:** SQLite (`better-sqlite3`) — zero external setup
- **Slack:** Slack Bolt SDK + `node-cron` for scheduling

---

## Quick start

You need **Node 18+** (developed on Node 22).

### 1. Backend
```bash
cd server
cp .env.example .env        # edit values (PIN, Slack tokens) as needed
npm install
npm run seed                # optional: load sample data so charts aren't empty
npm start                   # → http://localhost:4000
```

### 2. Frontend (dev)
In a second terminal:
```bash
cd client
npm install
npm run dev                 # → http://localhost:5173 (proxies /api to :4000)
```

Open:
- Employee form → http://localhost:5173/submit
- PM dashboard → http://localhost:5173/dashboard  (default PIN: `1234`)

### 3. Production (single server)
Build the frontend; Express serves it from `client/dist`:
```bash
cd client && npm install && npm run build
cd ../server && npm install && npm start   # serves API + UI on :4000
```

---

## Configuration (`server/.env`)

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server port | `4000` |
| `PM_PIN` | Dashboard access PIN | `1234` |
| `SLACK_BOT_TOKEN` | Bot token (`xoxb-…`) | — |
| `SLACK_SIGNING_SECRET` | App signing secret | — |
| `SLACK_CHANNEL_ID` | Channel for reminders + notifications | — |
| `REMINDER_TIMEZONE` | IANA tz for the 4:30 PM cron | `Asia/Karachi` |
| `REMINDER_ENABLED` | `false` to disable the schedule | `true` |
| `PUBLIC_FORM_URL` | Base URL put inside the reminder message | — |

**Slack is optional.** With no tokens set, reports still save and the app runs
fine — Slack calls just log instead of posting.

### Setting up Slack
1. Go to <https://api.slack.com/apps> → **Create New App → From an app manifest**.
2. Paste [`slack-app-manifest.yml`](./slack-app-manifest.yml).
3. Install to your workspace; copy the **Bot User OAuth Token** (`xoxb-…`) and
   **Signing Secret** into `.env`.
4. Invite the bot to your channel and copy the channel ID into `SLACK_CHANNEL_ID`.
5. Use the **Test Slack Reminder** button on the dashboard to verify.

---

## API reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | — | Health + whether Slack is enabled |
| `POST` | `/api/auth` | — | Verify PM PIN |
| `GET` | `/api/employees` | — | List employees (for the dropdown) |
| `POST` | `/api/employees` | PIN | Add an employee |
| `DELETE` | `/api/employees/:id` | PIN | Remove an employee |
| `POST` | `/api/reports` | — | Submit a daily report (+ Slack notify) |
| `GET` | `/api/reports` | PIN | List reports (`?from&to&employee`) |
| `GET` | `/api/analytics` | PIN | Aggregated analytics (same filters) |
| `POST` | `/api/reminder/test` | PIN | Send the reminder to Slack right now |

Protected routes expect the PIN in an `x-pm-pin` header.

---

## How the reminder schedule works
`node-cron` expression `30 16 * * 1-5` → 16:30 on Mon–Fri, in `REMINDER_TIMEZONE`.
Adjust the time by editing the cron string in `server/src/slack.js`.
