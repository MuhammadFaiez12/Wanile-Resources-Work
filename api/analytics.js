import { init } from './_lib/db.js';
import { json, blockedWithoutPin } from './_lib/http.js';
import { buildAnalytics } from './_lib/analytics.js';

export default async function handler(req, res) {
  if (blockedWithoutPin(req, res)) return;
  await init();
  const { from, to, employee } = req.query;
  const data = await buildAnalytics({ from, to, employee });
  return json(res, 200, data);
}
