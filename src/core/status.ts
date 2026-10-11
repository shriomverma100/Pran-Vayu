import { SEVERE_BOD_MULTIPLE, SEVERE_DO } from './scoring'
import type { Reading } from './types'

/** How one reading is shown everywhere: screen, charts, tables and PDFs. */
export type DisplayStatus = 'severe' | 'breach' | 'within' | 'not-tested' | 'bdl' | 'no-limit'

/** Class B limits used to mark a breach as severe. */
const BOD_LIMIT = 3

export function displayStatus(r: Pick<Reading, 'kind' | 'limit' | 'parameter' | 'value'>): DisplayStatus {
  if (r.kind === 'missing') return 'not-tested'
  if (r.limit === 'breach') {
    if (r.parameter === 'Dissolved oxygen' && (r.value === null || r.value < SEVERE_DO)) return 'severe'
    if (r.parameter === 'BOD' && r.value !== null && r.value >= SEVERE_BOD_MULTIPLE * BOD_LIMIT) return 'severe'
    return 'breach'
  }
  if (r.kind === 'below-detection') return 'bdl'
  if (r.limit === 'within') return 'within'
  return 'no-limit'
}

/** Severity order for sorting and for summarising a group of readings. */
export const STATUS_ORDER: DisplayStatus[] = ['severe', 'breach', 'not-tested', 'within', 'bdl', 'no-limit']

/** The worst status in a group, e.g. one cell of the ghat × test matrix. */
export function worstStatus(statuses: DisplayStatus[]): DisplayStatus {
  for (const s of STATUS_ORDER) if (statuses.includes(s)) return s
  return 'no-limit'
}
