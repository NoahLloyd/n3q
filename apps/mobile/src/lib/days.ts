/** Returns the number of days since a given date (inclusive of day 1). */
export function daysSince(dateString: string): number {
  const created = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}
