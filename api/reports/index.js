import { db, init } from '../_lib/db.js';
import { json, blockedWithoutPin } from '../_lib/http.js';
import { validateReport } from '../_lib/validate.js';
import { notifySubmission } from '../_lib/slack.js';

export default async function handler(req, res) {
  await init();

  // Submit a daily report (public — no PIN required)
  if (req.method === 'POST') {
    const { errors, value } = validateReport(req.body || {});
    if (errors.length) return json(res, 400, { errors });

    const r = await db.execute({
      sql: `INSERT INTO reports
              (employee_name, date, project, work_done, hours, blockers, tomorrow_plan, mood, progress)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        value.employee_name, value.date, value.project, value.work_done,
        value.hours, value.blockers, value.tomorrow_plan, value.mood, value.progress,
      ],
    });

    // Await the Slack notification — the serverless function may be frozen
    // the instant we respond, so we can't fire-and-forget it.
    await notifySubmission(value.employee_name, value.date).catch(() => {});

    return json(res, 201, { id: Number(r.rows[0].id), ...value });
  }

  // List reports (PM only) with optional filters
  if (req.method === 'GET') {
    if (blockedWithoutPin(req, res)) return;
    const { from, to, employee } = req.query;
    const where = [];
    const args = [];
    if (from) { where.push('date >= ?'); args.push(from); }
    if (to) { where.push('date <= ?'); args.push(to); }
    if (employee) { where.push('employee_name = ?'); args.push(employee); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const { rows } = await db.execute({
      sql: `SELECT * FROM reports ${whereSql} ORDER BY date DESC, id DESC`,
      args,
    });
    return json(res, 200, rows);
  }

  return json(res, 405, { error: 'Method not allowed' });
}
