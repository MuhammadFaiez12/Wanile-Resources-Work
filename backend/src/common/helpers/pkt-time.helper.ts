const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

export function getPKTDate(): string {
  return new Date(Date.now() + PKT_OFFSET_MS).toISOString().slice(0, 10);
}

export function getPKTDateTime(): string {
  return (
    new Date(Date.now() + PKT_OFFSET_MS)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19) + ' PKT'
  );
}
