// Local-only runner. Mounts the same Vercel serverless functions on a plain
// Express server and serves the built client, so the whole app runs on one
// localhost port without the Vercel CLI. Not used in production.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Adapt a Vercel function handler (req.query/req.body, res.status/send) to an
// Express route. Express already provides those, so we just forward.
const h = (mod) => async (req, res) => {
  try {
    const handler = (await import(mod)).default;
    await handler(req, res);
  } catch (err) {
    console.error(`[api] ${req.method} ${req.path} failed:`, err);
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
  }
};

// Routes mirror the file-based /api structure exactly.
app.get('/api/health', h('./api/health.js'));
app.post('/api/auth', h('./api/auth.js'));
app.all('/api/employees', h('./api/employees/index.js'));
app.delete('/api/employees/:id', (req, res, next) => {
  req.query.id = req.params.id; // [id].js reads req.query.id
  return h('./api/employees/[id].js')(req, res, next);
});
app.all('/api/reports', h('./api/reports/index.js'));
app.get('/api/analytics', h('./api/analytics.js'));
app.all('/api/reminder', h('./api/reminder.js'));

// Serve the built client + SPA fallback (mirrors vercel.json rewrites).
const dist = path.join(__dirname, 'client', 'dist');
app.use(express.static(dist));
app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(PORT, () => {
  console.log(`\n  ▶ Daily Work Report running at http://localhost:${PORT}`);
  console.log(`     Form      → http://localhost:${PORT}/submit`);
  console.log(`     Dashboard → http://localhost:${PORT}/dashboard  (PIN: ${process.env.PM_PIN || '1234'})\n`);
});
