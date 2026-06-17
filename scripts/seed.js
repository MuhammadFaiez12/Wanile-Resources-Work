// Populate the database with sample reports so the dashboard has data.
//   Local file DB:   npm run seed
//   Against Turso:   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run seed
import { db, init } from '../api/_lib/db.js';

await init();

const { rows: empRows } = await db.execute('SELECT name FROM employees');
const employees = empRows.map((r) => r.name);

const projects = ['Website Redesign', 'Mobile App', 'API Platform', 'Data Pipeline'];
const works = [
  'Implemented login flow and fixed validation bugs.',
  'Wrote unit tests and refactored the payment module.',
  'Designed dashboard layout and built chart components.',
  'Reviewed PRs and deployed staging environment.',
  'Investigated production incident and patched root cause.',
];
const blockers = ['None', 'None', 'Waiting on design assets', 'None', 'Blocked by API rate limits'];
const plans = [
  'Finish remaining endpoints.',
  'Start integration tests.',
  'Polish UI and ship to staging.',
  'Pair with QA on edge cases.',
];
const rand = (a) => a[Math.floor(Math.random() * a.length)];

await db.execute('DELETE FROM reports');

const stmts = [];
const today = new Date();
for (let d = 13; d >= 0; d--) {
  const day = new Date(today);
  day.setDate(today.getDate() - d);
  if (day.getDay() === 0 || day.getDay() === 6) continue; // skip weekends
  const dateStr = day.toISOString().slice(0, 10);
  for (const emp of employees) {
    if (Math.random() < 0.15) continue; // some missed days
    stmts.push({
      sql: `INSERT INTO reports
              (employee_name, date, project, work_done, hours, blockers, tomorrow_plan, mood, progress)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        emp, dateStr, rand(projects), rand(works),
        Math.round((4 + Math.random() * 6) * 10) / 10,
        rand(blockers), rand(plans),
        1 + Math.floor(Math.random() * 5),
        Math.floor(Math.random() * 101),
      ],
    });
  }
}

await db.batch(stmts, 'write');
console.log(`Seeded ${stmts.length} sample reports across ${employees.length} employees.`);
