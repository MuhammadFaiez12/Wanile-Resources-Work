import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import db from './db.js';
import { buildAnalytics } from './analytics.js';
import {
  notifySubmission,
  startReminderJob,
  sendReminderNow,
  slackEnabled,
} from './slack.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;
const PM_PIN = process.env.PM_PIN || '1234';

app.use(cors());
app.use(express.json());

/* ------------------------------------------------------------------ *
 * PM auth — intentionally lightweight (single shared PIN).
 * The PIN is sent in an `x-pm-pin` header on protected routes.
 * ------------------------------------------------------------------ */
function requirePin(req, res, next) {
  const pin = req.get('x-pm-pin') || req.query.pin;
  if (pin !== PM_PIN) {
    return res.status(401).json({ error: 'Invalid PM PIN' });
  }
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, slackEnabled });
});

// Verify the PM PIN (used by the dashboard login screen)
app.post('/api/auth', (req, res) => {
  const { pin } = req.body || {};
  if (pin === PM_PIN) return res.json({ ok: true });
  res.status(401).json({ ok: false, error: 'Incorrect PIN' });
});

/* ----------------------------- Employees ----------------------------- */
app.get('/api/employees', (_req, res) => {
  const rows = db.prepare('SELECT id, name FROM employees ORDER BY name').all();
  res.json(rows);
});

app.post('/api/employees', requirePin, (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const info = db.prepare('INSERT INTO employees (name) VALUES (?)').run(name);
    res.status(201).json({ id: info.lastInsertRowid, name });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Employee already exists' });
    }
    res.status(500).json({ error: 'Could not add employee' });
  }
});

app.delete('/api/employees/:id', requirePin, (req, res) => {
  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ------------------------------ Reports ------------------------------ */
function validateReport(b) {
  const errors = [];
  const name = (b.employee_name || '').trim();
  const date = (b.date || '').trim();
  const project = (b.project || '').trim();
  const work_done = (b.work_done || '').trim();
  const tomorrow_plan = (b.tomorrow_plan || '').trim();
  const hours = Number(b.hours);
  const mood = Number(b.mood);
  const progress = Number(b.progress);

  if (!name) errors.push('Employee name is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('Valid date (YYYY-MM-DD) is required');
  if (!project) errors.push('Project / task name is required');
  if (!work_done) errors.push('Work done is required');
  if (!tomorrow_plan) errors.push("Tomorrow's plan is required");
  if (!(hours >= 1 && hours <= 12)) errors.push('Hours must be between 1 and 12');
  if (!(mood >= 1 && mood <= 5)) errors.push('Mood must be between 1 and 5');
  if (!(progress >= 0 && progress <= 100)) errors.push('Progress must be 0–100');

  return {
    errors,
    value: {
      employee_name: name,
      date,
      project,
      work_done,
      tomorrow_plan,
      blockers: (b.blockers || '').trim() || 'None',
      hours,
      mood,
      progress,
    },
  };
}

// Submit a daily report (public)
app.post('/api/reports', async (req, res) => {
  const { errors, value } = validateReport(req.body || {});
  if (errors.length) return res.status(400).json({ errors });

  const info = db
    .prepare(
      `INSERT INTO reports
         (employee_name, date, project, work_done, hours, blockers, tomorrow_plan, mood, progress)
       VALUES
         (@employee_name, @date, @project, @work_done, @hours, @blockers, @tomorrow_plan, @mood, @progress)`
    )
    .run(value);

  // Fire-and-forget Slack notification — never blocks the response.
  notifySubmission(value.employee_name, value.date).catch(() => {});

  res.status(201).json({ id: info.lastInsertRowid, ...value });
});

// List reports (PM only) with optional filters
app.get('/api/reports', requirePin, (req, res) => {
  const { from, to, employee } = req.query;
  const where = [];
  const params = {};
  if (from) { where.push('date >= @from'); params.from = from; }
  if (to) { where.push('date <= @to'); params.to = to; }
  if (employee) { where.push('employee_name = @employee'); params.employee = employee; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db
    .prepare(`SELECT * FROM reports ${whereSql} ORDER BY date DESC, id DESC`)
    .all(params);
  res.json(rows);
});

// Aggregated analytics (PM only)
app.get('/api/analytics', requirePin, (req, res) => {
  const { from, to, employee } = req.query;
  res.json(buildAnalytics({ from, to, employee }));
});

// Manually trigger the Slack reminder (PM only) — handy for testing
app.post('/api/reminder/test', requirePin, async (_req, res) => {
  const result = await sendReminderNow();
  res.json(result);
});

/* --------------------- Serve built frontend (prod) -------------------- */
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  startReminderJob();
});
