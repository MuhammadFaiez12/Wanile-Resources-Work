import { json } from './_lib/http.js';
import { slackEnabled } from './_lib/slack.js';

export default function handler(_req, res) {
  json(res, 200, { ok: true, slackEnabled });
}
