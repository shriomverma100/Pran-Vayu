/**
 * Whole calendar days from `now` to a YYYY-MM-DD date, counted on the local
 * calendar (an officer in Bhopal on 11 October sees 9 days to 20 October,
 * whatever the hour). Negative once the date has passed.
 */
export function daysUntil(isoDate: string, now: Date = new Date()): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  const target = Date.UTC(y, m - 1, d)
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target - today) / 86_400_000)
}
