import { createClient } from '@libsql/client';

// In production set TURSO_DATABASE_URL (libsql://…) + TURSO_AUTH_TOKEN.
// Without them: use /tmp (writable on Vercel) or a local file in dev.
const url =
  process.env.TURSO_DATABASE_URL ||
  (process.env.VERCEL ? 'file:/tmp/local.db' : 'file:local.db');
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const db = createClient({ url, authToken });

let initPromise = null;

/**
 * Lazily creates the schema (idempotent) and seeds a starter employee list
 * the first time the table is empty. Serverless instances each run this once
 * on cold start; `IF NOT EXISTS` keeps it safe to repeat.
 */
export function init() {
  if (!initPromise) initPromise = doInit();
  return initPromise;
}

async function doInit() {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS employees (
         id   INTEGER PRIMARY KEY AUTOINCREMENT,
         name TEXT NOT NULL UNIQUE
       )`,
      `CREATE TABLE IF NOT EXISTS reports (
         id             INTEGER PRIMARY KEY AUTOINCREMENT,
         employee_name  TEXT    NOT NULL,
         date           TEXT    NOT NULL,
         project        TEXT    NOT NULL,
         work_done      TEXT    NOT NULL,
         hours          REAL    NOT NULL,
         blockers       TEXT    NOT NULL DEFAULT 'None',
         tomorrow_plan  TEXT    NOT NULL,
         mood           INTEGER NOT NULL,
         progress       INTEGER NOT NULL,
         created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
       )`,
      `CREATE INDEX IF NOT EXISTS idx_reports_date     ON reports(date)`,
      `CREATE INDEX IF NOT EXISTS idx_reports_employee ON reports(employee_name)`,
    ],
    'write'
  );

  const { rows } = await db.execute('SELECT COUNT(*) AS c FROM employees');
  if (Number(rows[0].c) === 0) {
    await db.batch(
      ['Alice Johnson', 'Bob Smith', 'Carlos Diaz', 'Diana Lee'].map((name) => ({
        sql: 'INSERT INTO employees (name) VALUES (?)',
        args: [name],
      })),
      'write'
    );
  }
}
