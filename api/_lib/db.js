import postgres from 'postgres';

// --- Supabase Postgres connection ---------------------------------------
// The Vercel ↔ Supabase integration injects a pooled connection string. We
// accept any of the common names so it works whether the env var came from
// that integration, Supabase's dashboard, or a manual setting.
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error(
    '[db] No Supabase/Postgres connection string found. Set POSTGRES_URL ' +
      '(provided by the Vercel–Supabase integration) or DATABASE_URL.'
  );
}

// `prepare: false` is required for Supabase's transaction-mode pooler (pgBouncer).
// `max: 1` keeps each serverless instance to a single connection.
const sql = postgres(connectionString || '', {
  max: 1,
  idle_timeout: 20,
  prepare: false,
  onnotice: () => {}, // silence "relation already exists, skipping" on idempotent DDL
  // Supabase requires TLS in production; local Postgres (no sslmode) skips it.
  ssl: /sslmode=require|supabase\.(co|com)/i.test(connectionString || '')
    ? 'require'
    : false,
});

// Convert SQLite-style `?` placeholders to Postgres `$1, $2, …`.
function toPg(text) {
  let i = 0;
  return text.replace(/\?/g, () => `$${++i}`);
}

// Thin adapter so existing handlers keep using db.execute({ sql, args }).
export const db = {
  async execute(arg) {
    const text = typeof arg === 'string' ? arg : arg.sql;
    const args = typeof arg === 'string' ? [] : arg.args || [];
    const rows = await sql.unsafe(toPg(text), args);
    return { rows: Array.from(rows) };
  },
  raw: sql,
};

let initPromise = null;

/** Lazily creates the schema (idempotent) and seeds starter employees once. */
export function init() {
  if (!initPromise) initPromise = doInit();
  return initPromise;
}

async function doInit() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS employees (
      id   SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS reports (
      id             SERIAL PRIMARY KEY,
      employee_name  TEXT             NOT NULL,
      date           TEXT             NOT NULL,
      project        TEXT             NOT NULL,
      work_done      TEXT             NOT NULL,
      hours          DOUBLE PRECISION NOT NULL,
      blockers       TEXT             NOT NULL DEFAULT 'None',
      tomorrow_plan  TEXT             NOT NULL,
      mood           INTEGER          NOT NULL,
      progress       INTEGER          NOT NULL,
      created_at     TIMESTAMPTZ      NOT NULL DEFAULT now()
    );
  `);
  await sql.unsafe('CREATE INDEX IF NOT EXISTS idx_reports_date     ON reports(date);');
  await sql.unsafe('CREATE INDEX IF NOT EXISTS idx_reports_employee ON reports(employee_name);');

  const rows = await sql.unsafe('SELECT COUNT(*)::int AS c FROM employees');
  if (Number(rows[0].c) === 0) {
    for (const name of ['Alice Johnson', 'Bob Smith', 'Carlos Diaz', 'Diana Lee']) {
      await sql.unsafe('INSERT INTO employees (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
    }
  }
}
