import { json, PM_PIN } from './_lib/http.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const { pin } = req.body || {};
  if (pin === PM_PIN) return json(res, 200, { ok: true });
  return json(res, 401, { ok: false, error: 'Incorrect PIN' });
}
