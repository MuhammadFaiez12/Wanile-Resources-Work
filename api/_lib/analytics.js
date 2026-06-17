import { db } from './db.js';

/**
 * Builds the aggregate analytics payload for the PM dashboard.
 * Accepts optional { from, to, employee } filters (YYYY-MM-DD / name).
 */
export async function buildAnalytics({ from, to, employee } = {}) {
  const where = [];
  const args = [];
  if (from) { where.push('date >= ?'); args.push(from); }
  if (to) { where.push('date <= ?'); args.push(to); }
  if (employee) { where.push('employee_name = ?'); args.push(employee); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const run = (sql, extra = []) => db.execute({ sql, args: [...args, ...extra] });

  const [totalsR, byEmpR, byDateR, moodR, byProjR] = await Promise.all([
    run(
      `SELECT COUNT(*) AS total_reports,
              COALESCE(SUM(hours),0)    AS total_hours,
              COALESCE(AVG(hours),0)    AS avg_hours,
              COALESCE(AVG(mood),0)     AS avg_mood,
              COALESCE(AVG(progress),0) AS avg_progress,
              COUNT(DISTINCT employee_name) AS active_employees
       FROM reports ${whereSql}`
    ),
    run(
      `SELECT employee_name AS name, COUNT(*) AS reports,
              ROUND(SUM(hours),1) AS hours, ROUND(AVG(mood),2) AS mood,
              ROUND(AVG(progress),0) AS progress
       FROM reports ${whereSql}
       GROUP BY employee_name ORDER BY hours DESC`
    ),
    run(
      `SELECT date, ROUND(SUM(hours),1) AS hours, COUNT(*) AS reports,
              ROUND(AVG(mood),2) AS mood
       FROM reports ${whereSql}
       GROUP BY date ORDER BY date ASC`
    ),
    run(`SELECT mood, COUNT(*) AS count FROM reports ${whereSql} GROUP BY mood`),
    run(
      `SELECT project AS name, ROUND(SUM(hours),1) AS hours, COUNT(*) AS reports
       FROM reports ${whereSql}
       GROUP BY project ORDER BY hours DESC LIMIT 12`
    ),
  ]);

  const blockersR = await db.execute({
    sql: `SELECT id, employee_name, date, project, blockers
          FROM reports
          ${whereSql ? whereSql + ' AND' : 'WHERE'} LOWER(TRIM(blockers)) NOT IN ('none','n/a','')
          ORDER BY date DESC LIMIT 50`,
    args,
  });

  const t = totalsR.rows[0];
  const moodDistribution = [1, 2, 3, 4, 5].map((m) => ({
    mood: m,
    count: Number(moodR.rows.find((r) => Number(r.mood) === m)?.count || 0),
  }));

  const num = (v) => Number(v) || 0;
  return {
    totals: {
      total_reports: num(t.total_reports),
      total_hours: Math.round(num(t.total_hours) * 10) / 10,
      avg_hours: Math.round(num(t.avg_hours) * 10) / 10,
      avg_mood: Math.round(num(t.avg_mood) * 100) / 100,
      avg_progress: Math.round(num(t.avg_progress)),
      active_employees: num(t.active_employees),
    },
    hoursByEmployee: byEmpR.rows,
    hoursByDate: byDateR.rows,
    moodDistribution,
    hoursByProject: byProjR.rows,
    blockers: blockersR.rows,
  };
}
