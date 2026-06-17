// Small helpers shared across the serverless functions.

const PM_PIN = process.env.PM_PIN || '1234';

/** Sends a JSON response with the given status code. */
export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
}

/**
 * Returns true when the request carries the correct PM PIN
 * (sent in the `x-pm-pin` header or `?pin=` query param).
 */
export function hasPin(req) {
  const pin = req.headers['x-pm-pin'] || req.query?.pin;
  return pin === PM_PIN;
}

/** Guard for PM-only routes. Returns true if it already sent a 401. */
export function blockedWithoutPin(req, res) {
  if (!hasPin(req)) {
    json(res, 401, { error: 'Invalid PM PIN' });
    return true;
  }
  return false;
}

export { PM_PIN };
