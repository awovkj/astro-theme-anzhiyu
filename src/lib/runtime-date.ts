/** Parse legacy local-time strings while preserving ISO offsets when supplied. */
export function parseLaunchTime(value: unknown): Date {
  const raw = String(value ?? "").trim();
  const local = raw.match(/^(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!local) return new Date(raw);
  const [, a, b, c, hours = "0", minutes = "0", seconds = "0"] = local;
  const [year, month, day] = a.length === 4 ? [+a, +b, +c] : [+c, +a, +b];
  return new Date(year, month - 1, day, +hours, +minutes, +seconds);
}
