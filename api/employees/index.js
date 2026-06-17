import { db, init } from '../_lib/db.js';
import { json, blockedWithoutPin } from '../_lib/http.js';

export default async function handler(req, res) {
  await init();

  if (req.method === 'GET') {
    const { rows } = await db.execute('SELECT id, name FROM employees ORDER BY name');
    return json(res, 200, rows);
  }

  if (req.method === 'POST') {
    if (blockedWithoutPin(req, res)) return;
    const name = (req.body?.name || '').trim();
    if (!name) return json(res, 400, { error: 'Name is required' });
    try {
      const r = await db.execute({ sql: 'INSERT INTO employees (name) VALUES (?)', args: [name] });
      return json(res, 201, { id: Number(r.lastInsertRowid), name });
    } catch (e) {
      if (String(e.message).includes('UNIQUE')) {
        return json(res, 409, { error: 'Employee already exists' });
      }
      return json(res, 500, { error: 'Could not add employee' });
    }
  }

  return json(res, 405, { error: 'Method not allowed' });
}
