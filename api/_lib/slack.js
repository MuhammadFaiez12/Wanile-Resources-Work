import { WebClient } from '@slack/web-api';

// Stateless Slack posting via the Web API — ideal for serverless (no
// long-running socket). The Bolt SDK's App needs a persistent process, so on
// Vercel we use WebClient directly. Slack stays optional: with no token set,
// calls log instead of throwing so reports still save.
const {
  SLACK_BOT_TOKEN,
  SLACK_CHANNEL_ID,
  PUBLIC_FORM_URL,
} = process.env;

const enabled = Boolean(SLACK_BOT_TOKEN && SLACK_CHANNEL_ID);
const client = enabled ? new WebClient(SLACK_BOT_TOKEN) : null;

export async function postMessage(text) {
  if (!enabled) {
    console.log(`[slack:disabled] would post → ${text}`);
    return { ok: false, disabled: true };
  }
  try {
    await client.chat.postMessage({ channel: SLACK_CHANNEL_ID, text });
    return { ok: true };
  } catch (err) {
    const msg = err?.data?.error || err.message;
    console.error('[slack] postMessage failed:', msg);
    return { ok: false, error: msg };
  }
}

export function notifySubmission(employeeName, date) {
  return postMessage(`✅ *${employeeName}* submitted their daily report for *${date}*`);
}

export function reminderText() {
  const link = PUBLIC_FORM_URL ? `${PUBLIC_FORM_URL.replace(/\/$/, '')}/submit` : 'your form link';
  return (
    '👋 *Daily Work Report reminder*\n' +
    "It's 4:30 PM — please submit your work report before you log off.\n" +
    `Takes 2 minutes ➡️ ${link}`
  );
}

export function sendReminder() {
  return postMessage(reminderText());
}

export { enabled as slackEnabled };
