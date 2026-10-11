import type { ImmersionEvent } from './scoring'

export interface ImmersionSummary {
  /** Festivals with oxygen measured both before and during/after immersion */
  events: number
  /** Mean oxygen before immersion over those festivals */
  meanBefore: number | null
  /** Mean of the lowest oxygen during or one week after immersion, same festivals */
  meanLowestAfter: number | null
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * The dumbbell chart's two points per ghat. Uses only festivals that have a
 * before reading and at least one later reading, so the two means compare
 * the same festivals.
 */
export function immersionSummary(events: ImmersionEvent[]): ImmersionSummary {
  const paired = events.filter((e) => e.pre !== null && (e.during !== null || e.after !== null))
  if (!paired.length) return { events: 0, meanBefore: null, meanLowestAfter: null }
  const before = paired.map((e) => e.pre as number)
  const lowest = paired.map((e) => Math.min(...[e.during, e.after].filter((v): v is number => v !== null)))
  const mean = (xs: number[]) => round2(xs.reduce((a, b) => a + b, 0) / xs.length)
  return { events: paired.length, meanBefore: mean(before), meanLowestAfter: mean(lowest) }
}
