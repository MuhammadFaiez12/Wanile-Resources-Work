import { db, init } from '../_lib/db.js';
import { json, blockedWithoutPin } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return json(res, 405, { error: 'Method not allowed' });
  if (blockedWithoutPin(req, res)) return;
  await init();
  await db.execute({ sql: 'DELETE FROM employees WHERE id = ?', args: [req.query.id] });
  return json(res, 200, { ok: true });
}
