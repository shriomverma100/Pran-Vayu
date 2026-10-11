import { GHATS, PARAMETERS, PARAMETER_CODES, type Parameter, type Phase } from './constants'
import { checkLimit, limitsForClass } from './readings'
import { DEFAULT_CONFIG, scoreGhats, type GhatScore, type ScoringConfig } from './scoring'
import type { Limit, Reading } from './types'

// Readings entered on 20 October 2026. They stay in the officer's browser,
// export as CSV in the same columns as the official file, and can re-rank
// the ghats with the new evidence added to three years of history.

export const FIELD_YEAR = 2026
export const FIELD_FESTIVAL = 'Durga' as const

export interface FieldEntry {
  ghatId: string
  phase: Phase
  parameter: Parameter
  /** null when flagged BDL or not sampled */
  value: number | null
  flag: '' | 'BDL' | 'not sampled'
  /** Sample date, YYYY-MM-DD */
  date: string
}

export const FIELD_UNITS: Record<Parameter, string> = {
  pH: '',
  'Dissolved oxygen': 'mg/l',
  BOD: 'mg/l',
  COD: 'mg/l',
  'Total solids': 'mg/l',
  'Dissolved solids': 'mg/l',
  'Suspended solids': 'mg/l',
  Turbidity: 'NTU',
  Conductivity: 'µS/cm',
  Chromium: 'mg/l',
  Lead: 'mg/l',
  Zinc: 'mg/l',
  Copper: 'mg/l',
}

/** Physically possible ranges, to catch typing mistakes before they are saved. */
export const PLAUSIBLE: Partial<Record<Parameter, [number, number]>> = {
  pH: [0, 14],
  'Dissolved oxygen': [0, 20],
  BOD: [0, 500],
  COD: [0, 2000],
}

export function validateEntry(e: FieldEntry): string | null {
  if (!GHATS.some((g) => g.id === e.ghatId)) return 'unknown-ghat'
  if (!(PARAMETERS as readonly string[]).includes(e.parameter)) return 'unknown-parameter'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return 'bad-date'
  if (e.flag === '') {
    if (e.value === null || !Number.isFinite(e.value) || e.value < 0) return 'bad-value'
    const range = PLAUSIBLE[e.parameter]
    if (range && (e.value < range[0] || e.value > range[1])) return 'implausible'
  } else if (e.value !== null) return 'bad-value'
  return null
}

/** One entry per ghat × phase × parameter: a new entry replaces the old one. */
export const entryKey = (e: Pick<FieldEntry, 'ghatId' | 'phase' | 'parameter'>) => `${e.ghatId}|${e.phase}|${e.parameter}`

export function upsertEntry(list: FieldEntry[], e: FieldEntry): FieldEntry[] {
  return [...list.filter((x) => entryKey(x) !== entryKey(e)), e]
}

export function toFieldReading(e: FieldEntry, bathing: Map<string, Limit>): Reading {
  const kind = e.flag === 'not sampled' ? 'missing' : e.flag === 'BDL' ? 'below-detection' : 'measured'
  return {
    id: `${FIELD_YEAR}-D-${e.ghatId}-${e.phase}-${PARAMETER_CODES[e.parameter]}`,
    year: FIELD_YEAR as Reading['year'],
    festival: FIELD_FESTIVAL,
    ghatId: e.ghatId,
    phase: e.phase,
    parameter: e.parameter,
    value: e.value,
    unit: FIELD_UNITS[e.parameter],
    kind,
    printed: e.flag || String(e.value),
    parameterAsPrinted: e.parameter,
    siteAsPrinted: 'Field entry, 20 October 2026',
    page: 0,
    limit: checkLimit(kind, e.value, bathing.get(e.parameter)),
  }
}

/** Field readings count most: they are the newest Durga evidence. */
export const FIELD_CONFIG: ScoringConfig = {
  ...DEFAULT_CONFIG,
  id: 'with-field',
  yearWeight: { ...DEFAULT_CONFIG.yearWeight, [FIELD_YEAR]: 1.75 } as ScoringConfig['yearWeight'],
}

export function rescoreWithField(history: Reading[], limits: Limit[], entries: FieldEntry[]): GhatScore[] {
  const bathing = limitsForClass(limits, 'B')
  return scoreGhats([...history, ...entries.map((e) => toFieldReading(e, bathing))], limits, FIELD_CONFIG)
}

const CSV_HEADER = [
  'year', 'festival', 'site', 'water_body', 'phase', 'parameter', 'value', 'unit_assumed', 'flag',
  'value_as_printed', 'parameter_as_printed', 'site_as_printed', 'site_match_confidence', 'source_page', 'sample_date',
]

const csvCell = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))

/** CSV in the official file's columns, plus the sample date. No personal data. */
export function entriesToCsv(entries: FieldEntry[]): string {
  const rows = entries.map((e) => {
    const g = GHATS.find((x) => x.id === e.ghatId)!
    return [
      FIELD_YEAR, FIELD_FESTIVAL, g.name, g.waterBody, e.phase, e.parameter, e.value ?? '', FIELD_UNITS[e.parameter], e.flag,
      e.flag || String(e.value), e.parameter, 'Field entry in प्राण-वायु', g.confidence, '', e.date,
    ].map(csvCell).join(',')
  })
  return [CSV_HEADER.join(','), ...rows].join('\n') + '\n'
}
