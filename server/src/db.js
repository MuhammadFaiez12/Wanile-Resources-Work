import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS reports (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name  TEXT    NOT NULL,
    date           TEXT    NOT NULL,          -- YYYY-MM-DD
    project        TEXT    NOT NULL,
    work_done      TEXT    NOT NULL,
    hours          REAL    NOT NULL,          -- 1..12
    blockers       TEXT    NOT NULL DEFAULT 'None',
    tomorrow_plan  TEXT    NOT NULL,
    mood           INTEGER NOT NULL,          -- 1..5
    progress       INTEGER NOT NULL,          -- 0..100
    created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_reports_date     ON reports(date);
  CREATE INDEX IF NOT EXISTS idx_reports_employee ON reports(employee_name);
`);

// Seed a starter employee list once, only if the table is empty.
const count = db.prepare('SELECT COUNT(*) AS c FROM employees').get().c;
if (count === 0) {
  const insert = db.prepare('INSERT INTO employees (name) VALUES (?)');
  ['Alice Johnson', 'Bob Smith', 'Carlos Diaz', 'Diana Lee'].forEach((n) =>
    insert.run(n)
  );
}

export default db;
