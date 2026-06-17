import { json, hasPin } from './_lib/http.js';
import { sendReminder } from './_lib/slack.js';

// Posts the 4:30 PM reminder to Slack.
//
// Two ways to authorise:
//   1. External cron service → send `Authorization: Bearer <CRON_SECRET>`
//      (or `?key=<CRON_SECRET>`). Configure the schedule "30 16 * * 1-5"
//      at e.g. cron-job.org pointing here.
//   2. PM dashboard "Test Reminder" button → sends the PM PIN.
//
// Accepts GET and POST so any cron provider works.
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  const auth = req.headers['authorization'] || '';
  const bearer = auth.replace(/^Bearer\s+/i, '');
  const validCron = secret && (bearer === secret || req.query?.key === secret);

  if (!validCron && !hasPin(req)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const result = await sendReminder();
  return json(res, 200, result);
}
