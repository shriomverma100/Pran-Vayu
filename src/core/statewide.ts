import type { Reading } from './types'

// Statewide comparison: how does each Bhopal ghat's oxygen compare with the
// other immersion sites across Madhya Pradesh?
//
// The statewide file is less checked than the Bhopal file, so it is cleaned
// reading by reading, and every exclusion is counted:
// - rows marked needs_check (site name unreadable)
// - duplicate entries (tables split across two pages) that disagree
// - physically impossible oxygen (above 20 mg/l; water holds about 15 at most)
// - Bhopal's own 7 ghats, so a ghat is never compared with itself
// Site names are spelled differently across years, so comparison is per
// reading, not per site.

export interface StatewideRow {
  year: string
  festival: string
  regional_office: string
  phase: string
  parameter: string
  value: string
  flag: string
  site_as_printed: string
  needs_check: string
}

export const MAX_PLAUSIBLE_DO = 20
const BHOPAL_GHAT_NAMES = /hirdaram|khatlapura|prempura|kamlapati|kamla park|hathaikheda|maalikhedi|malikhedi|shahpura/i
export const HISTOGRAM_BIN = 0.5
export const HISTOGRAM_MAX = 15

export interface StatewideSummary {
  readings: number
  below5: number
  below5Share: number
  zero: number
  median: number
  /** Count of readings per 0.5 mg/l bin from 0 to 15 (last bin is 15 and above) */
  histogram: number[]
  excluded: { needsCheck: number; conflictingDuplicates: number; implausible: number; bhopalGhats: number; notMeasured: number }
}

export interface GhatComparison {
  ghatId: string
  median: number
  below5Share: number
  /** Share of MP readings with more oxygen than this ghat's median */
  worseThanShare: number
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const round3 = (n: number) => Math.round(n * 1000) / 1000

export function statewideOxygen(rows: StatewideRow[]): { values: number[]; summary: StatewideSummary } {
  const excluded = { needsCheck: 0, conflictingDuplicates: 0, implausible: 0, bhopalGhats: 0, notMeasured: 0 }
  const groups = new Map<string, StatewideRow[]>()
  for (const r of rows) {
    if (r.parameter !== 'Dissolved oxygen') continue
    if (r.needs_check === 'yes') {
      excluded.needsCheck++
      continue
    }
    if (BHOPAL_GHAT_NAMES.test(r.site_as_printed)) {
      excluded.bhopalGhats++
      continue
    }
    const key = [r.year, r.festival, r.regional_office, r.site_as_printed, r.phase].join('|')
    groups.set(key, [...(groups.get(key) ?? []), r])
  }
  const values: number[] = []
  for (const group of groups.values()) {
    if (new Set(group.map((r) => `${r.value}|${r.flag}`)).size > 1) {
      excluded.conflictingDuplicates += group.length
      continue
    }
    const r = group[0]
    if (r.value === '') {
      excluded.notMeasured++
      continue
    }
    const v = Number(r.value)
    if (v > MAX_PLAUSIBLE_DO) {
      excluded.implausible++
      continue
    }
    values.push(v)
  }
  const bins = Math.round(HISTOGRAM_MAX / HISTOGRAM_BIN) + 1
  const histogram = new Array(bins).fill(0)
  for (const v of values) histogram[Math.min(bins - 1, Math.floor(v / HISTOGRAM_BIN))]++
  const below5 = values.filter((v) => v < 5).length
  return {
    values,
    summary: {
      readings: values.length,
      below5,
      below5Share: round3(below5 / values.length),
      zero: values.filter((v) => v === 0).length,
      median: median(values),
      histogram,
      excluded,
    },
  }
}

export function compareGhat(ghatId: string, readings: Reading[], mpValues: number[]): GhatComparison {
  const own = readings.filter((r) => r.ghatId === ghatId && r.parameter === 'Dissolved oxygen' && r.kind === 'measured').map((r) => r.value as number)
  const m = median(own)
  return {
    ghatId,
    median: m,
    below5Share: round3(own.filter((v) => v < 5).length / own.length),
    worseThanShare: round3(mpValues.filter((v) => v > m).length / mpValues.length),
  }
}
