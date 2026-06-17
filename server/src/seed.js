// Optional: populate the DB with sample reports so the dashboard has data.
// Run with:  npm run seed
import db from './db.js';

const employees = db.prepare('SELECT name FROM employees').all().map((r) => r.name);
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

const insert = db.prepare(
  `INSERT INTO reports
     (employee_name, date, project, work_done, hours, blockers, tomorrow_plan, mood, progress, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
);

db.prepare('DELETE FROM reports').run();

const today = new Date();
let inserted = 0;
for (let d = 13; d >= 0; d--) {
  const day = new Date(today);
  day.setDate(today.getDate() - d);
  if (day.getDay() === 0 || day.getDay() === 6) continue; // skip weekends
  const dateStr = day.toISOString().slice(0, 10);
  for (const emp of employees) {
    if (Math.random() < 0.15) continue; // some days people miss reports
    insert.run(
      emp,
      dateStr,
      rand(projects),
      rand(works),
      Math.round((4 + Math.random() * 6) * 10) / 10,
      rand(blockers),
      rand(plans),
      1 + Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 101)
    );
    inserted++;
  }
}

console.log(`Seeded ${inserted} sample reports across ${employees.length} employees.`);
