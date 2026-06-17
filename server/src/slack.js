import pkg from '@slack/bolt';
import cron from 'node-cron';

const { App } = pkg;

const {
  SLACK_BOT_TOKEN,
  SLACK_SIGNING_SECRET,
  SLACK_CHANNEL_ID,
  REMINDER_TIMEZONE = 'Asia/Karachi',
  REMINDER_ENABLED = 'true',
} = process.env;

const slackEnabled = Boolean(SLACK_BOT_TOKEN && SLACK_CHANNEL_ID);

let app = null;
if (slackEnabled) {
  // Bolt app is initialised in HTTP-less mode — we only use it to post
  // messages (WebClient under app.client). No incoming events are wired up,
  // so it never opens a port and stays out of the way of Express.
  app = new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET || 'unused-no-incoming-events',
  });
} else {
  console.warn(
    '[slack] SLACK_BOT_TOKEN / SLACK_CHANNEL_ID not set — Slack features disabled (reports still save).'
  );
}

/**
 * Posts a plain-text message to the configured PM channel.
 * No-ops (and logs) when Slack isn't configured so the rest of the app
 * keeps working in local/dev setups.
 */
export async function postMessage(text) {
  if (!slackEnabled) {
    console.log(`[slack:disabled] would post → ${text}`);
    return { ok: false, disabled: true };
  }
  try {
    await app.client.chat.postMessage({ channel: SLACK_CHANNEL_ID, text });
    return { ok: true };
  } catch (err) {
    console.error('[slack] postMessage failed:', err?.data?.error || err.message);
    return { ok: false, error: err?.data?.error || err.message };
  }
}

/** Notification fired when an employee submits a report. */
export function notifySubmission(employeeName, date) {
  return postMessage(`✅ *${employeeName}* submitted their daily report for *${date}*`);
}

const REMINDER_TEXT =
  '👋 *Daily Work Report reminder*\n' +
  "It's 4:30 PM — please submit your work report before you log off.\n" +
  'Takes 2 minutes ➡️ fill it in here: ' +
  (process.env.PUBLIC_FORM_URL || 'your form link') +
  '/submit';

/**
 * Schedules the weekday 4:30 PM reminder. Cron expression:
 *   "30 16 * * 1-5"  → minute 30, hour 16, Mon–Fri.
 */
export function startReminderJob() {
  if (REMINDER_ENABLED !== 'true') {
    console.log('[slack] reminder disabled via REMINDER_ENABLED.');
    return;
  }
  if (!slackEnabled) return;

  cron.schedule(
    '30 16 * * 1-5',
    () => {
      console.log('[slack] sending scheduled 4:30pm reminder');
      postMessage(REMINDER_TEXT);
    },
    { timezone: REMINDER_TIMEZONE }
  );
  console.log(
    `[slack] reminder scheduled for 16:30 Mon–Fri (${REMINDER_TIMEZONE}).`
  );
}

/** Manual trigger so the PM can test the reminder from the dashboard. */
export function sendReminderNow() {
  return postMessage(REMINDER_TEXT);
}

export { slackEnabled };
