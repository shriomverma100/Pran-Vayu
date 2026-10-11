import { FESTIVALS, PHASES, YEARS } from '../core/constants'
import { readingId } from '../core/readings'
import { DATA, GHAT_BY_ID, READING_BY_ID, STABILITY_BY_ID, STATEWIDE_BY_ID } from '../data'
import { ACTION_TEXT, reasonText } from '../i18n/reasons'
import { translate } from '../i18n'
import type { StringKey } from '../i18n/strings'

const PARAMS = [
  ['DO', 'Dissolved oxygen', 'mg/l, limit 5 or more'],
  ['BOD', 'BOD', 'mg/l organic waste, limit 3 or less'],
  ['pH', 'pH', 'limit 6.5 to 8.5'],
] as const

/**
 * Compact, plain-text summary of the checked data for the assistant: every
 * ghat's rank, action, reasons, coverage, and every oxygen/BOD/pH reading with
 * its report page. Built from the same data as the screens.
 */
export function buildAssistantContext(): string {
  const t = (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => translate('en', k, v)
  const lines: string[] = []
  const doM = DATA.readings.filter((r) => r.parameter === 'Dissolved oxygen' && r.kind === 'measured')
  const bodM = DATA.readings.filter((r) => r.parameter === 'BOD' && r.kind === 'measured')
  lines.push(
    'Data: MPPCB Ganesh and Durga visarjan water tests 2023, 2024, 2025 at 7 Bhopal ghats. Reading lines use: 23G = 2023 Ganesh, 24D = 2024 Durga; values are before/during/one-week-after immersion; "-" = not tested; p26 = page 26 of that year\'s MPPCB report (cite as "2023 report, p.26"); no-table = the report has no table for it.',
    `Overall: oxygen below 5 mg/l in ${doM.filter((r) => (r.value as number) < 5).length} of ${doM.length} readings; BOD above 3 in ${bodM.filter((r) => (r.value as number) > 3).length} of ${bodM.length}; oxygen 0 in 4 readings, all at Bairagarh. Every ghat broke the BOD limit.`,
    'Scoring: risk score 0-100 = 50% oxygen + 30% BOD + 20% pH; a breach scores 50 plus up to 50 for how far past the limit; Durga x1.5, 2024 x1.25, 2025 x1.5. Act now = score 55+ or any oxygen below 2; High = 30+; Moderate below 30.',
    'Robustness: ranking recomputed under 24 scoring choices (CPCB classes B/C/D, Durga weight, year weight, parameter weights).',
    `Statewide: ${DATA.statewide.summary.readings} oxygen readings at other MP immersion sites, ${Math.round(DATA.statewide.summary.below5Share * 100)}% below 5, median ${DATA.statewide.summary.median}.`,
    'Limits of the data: no bacteria tests (no health claims); units assumed; Rani Kamlapati / Kamla Park may be two places; only 4 metals tested, not scored; Bairagarh and Malikhedi have no Durga 2025 table; NGT has banned immersion in Upper and Lower Lakes.',
    'Allocator rule: aerators go to the most oxygen-stressed ghats needing aeration, one each before any gets two; sampling teams go first to ghats with no Durga 2025 test, then partial tests, then highest risk.',
    'Visarjan: Tuesday 20 October 2026. Field stages: before immersion (by morning of 20 Oct), during (20 Oct), one week after (27 Oct).',
    '',
  )
  for (const s of DATA.scores) {
    const g = GHAT_BY_ID.get(s.ghatId)!
    const stab = STABILITY_BY_ID.get(s.ghatId)!
    const cmp = STATEWIDE_BY_ID.get(s.ghatId)!
    lines.push(
      `## #${s.rank} ${g.name} [id ${g.id}] (Hindi: ${g.nameHi}), on ${g.waterBody}${g.note ? `. Note: ${g.note}` : ''}`,
      `Level: ${t(`tier.${s.tier}` as StringKey)}. Score ${s.score}. Action: ${ACTION_TEXT.en[s.action].title} (${ACTION_TEXT.en[s.action].detail})${s.alsoDo.length ? `. Also: ${s.alsoDo.map((a) => ACTION_TEXT.en[a].title).join(', ')}` : ''}.`,
      `Tests present: ${s.blindSpot.tested} of 18${s.blindSpot.latestDurgaMissing ? '; NO Durga 2025 test' : ''}. Rank across 24 scorings: ${stab.bestRank}-${stab.worstRank}. Typical oxygen ${cmp.median} mg/l, lower than ${Math.round(cmp.worseThanShare * 100)}% of other MP readings.`,
      `Reasons: ${s.reasons.map((r) => reasonText(r, 'en')).join(' ')}`,
    )
    for (const [code, param, unit] of PARAMS) {
      const parts: string[] = []
      for (const y of YEARS)
        for (const f of FESTIVALS) {
          const rs = PHASES.map((p) => READING_BY_ID.get(readingId(y, f, s.ghatId, p, param)))
          const page = rs.find((r) => r)?.page
          const vals = rs.map((r) => (!r || r.kind === 'missing' ? '-' : r.kind === 'below-detection' ? r.printed : String(r.value)))
          parts.push(`${String(y).slice(2)}${f[0]} ${vals.join('/')}${page ? ` p${page}` : ' no-table'}`)
        }
      lines.push(`${code} [${unit}]: ${parts.join('; ')}`)
    }
    lines.push('')
  }
  lines.push('Reports available to download: brief (English + Hindi), ghat profiles (English or Hindi), method and limits (English or Hindi).')
  return lines.join('\n')
}
