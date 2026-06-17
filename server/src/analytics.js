import db from './db.js';

/**
 * Builds the aggregate analytics payload for the PM dashboard.
 * Accepts optional { from, to, employee } filters (all YYYY-MM-DD / name).
 */
export function buildAnalytics({ from, to, employee } = {}) {
  const where = [];
  const params = {};
  if (from) {
    where.push('date >= @from');
    params.from = from;
  }
  if (to) {
    where.push('date <= @to');
    params.to = to;
  }
  if (employee) {
    where.push('employee_name = @employee');
    params.employee = employee;
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // ---- Headline KPIs ----
  const totals = db
    .prepare(
      `SELECT
         COUNT(*)            AS total_reports,
         COALESCE(SUM(hours),0)   AS total_hours,
         COALESCE(AVG(hours),0)   AS avg_hours,
         COALESCE(AVG(mood),0)    AS avg_mood,
         COALESCE(AVG(progress),0) AS avg_progress,
         COUNT(DISTINCT employee_name) AS active_employees
       FROM reports ${whereSql}`
    )
    .get(params);

  // ---- Hours per employee ----
  const hoursByEmployee = db
    .prepare(
      `SELECT employee_name AS name,
              COUNT(*)            AS reports,
              ROUND(SUM(hours),1) AS hours,
              ROUND(AVG(mood),2)  AS mood,
              ROUND(AVG(progress),0) AS progress
       FROM reports ${whereSql}
       GROUP BY employee_name
       ORDER BY hours DESC`
    )
    .all(params);

  // ---- Hours over time (by date) ----
  const hoursByDate = db
    .prepare(
      `SELECT date,
              ROUND(SUM(hours),1) AS hours,
              COUNT(*)            AS reports,
              ROUND(AVG(mood),2)  AS mood
       FROM reports ${whereSql}
       GROUP BY date
       ORDER BY date ASC`
    )
    .all(params);

  // ---- Mood distribution (1..5) ----
  const moodRows = db
    .prepare(
      `SELECT mood, COUNT(*) AS count
       FROM reports ${whereSql}
       GROUP BY mood`
    )
    .all(params);
  const moodDistribution = [1, 2, 3, 4, 5].map((m) => ({
    mood: m,
    count: moodRows.find((r) => r.mood === m)?.count || 0,
  }));

  // ---- Hours spent per project ----
  const hoursByProject = db
    .prepare(
      `SELECT project AS name, ROUND(SUM(hours),1) AS hours, COUNT(*) AS reports
       FROM reports ${whereSql}
       GROUP BY project
       ORDER BY hours DESC
       LIMIT 12`
    )
    .all(params);

  // ---- Blockers feed (anything that isn't "none") ----
  const blockers = db
    .prepare(
      `SELECT id, employee_name, date, project, blockers
       FROM reports
       ${whereSql ? whereSql + ' AND' : 'WHERE'} LOWER(TRIM(blockers)) NOT IN ('none','n/a','')
       ORDER BY date DESC
       LIMIT 50`
    )
    .all(params);

  return {
    totals: {
      ...totals,
      total_hours: Math.round(totals.total_hours * 10) / 10,
      avg_hours: Math.round(totals.avg_hours * 10) / 10,
      avg_mood: Math.round(totals.avg_mood * 100) / 100,
      avg_progress: Math.round(totals.avg_progress),
    },
    hoursByEmployee,
    hoursByDate,
    moodDistribution,
    hoursByProject,
    blockers,
  };
}
