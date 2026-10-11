import { z } from 'zod'
import {
  FESTIVALS,
  GHAT_BY_NAME,
  PARAMETERS,
  PARAMETER_CODES,
  PHASES,
  YEARS,
  type Festival,
  type Phase,
  type Year,
} from './constants'
import type { Limit, LimitResult, Reading, SlotCoverage, ValueKind } from './types'

/** Flags in the Bhopal file and how each must be treated (data dictionary, "Codes you will see"). */
export const FLAG_KIND: Record<string, ValueKind> = {
  '': 'measured',
  BDL: 'below-detection',
  ND: 'below-detection',
  'not sampled': 'missing',
  '*': 'missing',
  '**': 'missing',
}

const numberString = z.string().regex(/^-?\d+(\.\d+)?$/)

/** One row of data/bhopal_ghats_2023_2025.csv, checked column by column. */
export const BhopalRowSchema = z
  .object({
    year: z.enum(YEARS.map(String) as [string, ...string[]]),
    festival: z.enum(FESTIVALS),
    site: z.string().refine((s) => GHAT_BY_NAME.has(s), 'unknown ghat'),
    water_body: z.string().min(1),
    phase: z.enum(PHASES),
    parameter: z.enum(PARAMETERS),
    value: z.union([z.literal(''), numberString]),
    unit_assumed: z.string(),
    flag: z.string().refine((f) => f in FLAG_KIND, 'unknown flag'),
    value_as_printed: z.string(),
    parameter_as_printed: z.string().min(1),
    site_as_printed: z.string().min(1),
    site_match_confidence: z.enum(['high', 'medium']),
    source_page: z.string().regex(/^\d+$/),
  })
  .refine((r) => (r.value === '') === (r.flag !== ''), 'a value must be present exactly when there is no flag')
  .refine((r) => r.value === '' || Number(r.value) === Number(r.value_as_printed), 'value differs from value_as_printed')

export type BhopalRow = z.infer<typeof BhopalRowSchema>

const CPCB_PARAMETER_MAP: Record<string, string> = {
  pH: 'pH',
  'Dissolved oxygen': 'Dissolved oxygen',
  'BOD (5 days 20C)': 'BOD',
  'Electrical conductivity at 25C': 'Conductivity',
}

export const CpcbRowSchema = z.object({
  class: z.enum(['A', 'B', 'C', 'D', 'E']),
  designated_best_use: z.string().min(1),
  parameter: z.string().min(1),
  limit_type: z.enum(['min', 'max', 'range']),
  limit: z.string().regex(/^\d+(\.\d+)?(-\d+(\.\d+)?)?$/),
  unit: z.string(),
})

export type CpcbRow = z.infer<typeof CpcbRowSchema>

export function parseLimit(row: CpcbRow): Limit {
  const base = {
    cpcbClass: row.class,
    bestUse: row.designated_best_use,
    parameter: CPCB_PARAMETER_MAP[row.parameter] ?? row.parameter,
    cpcbParameter: row.parameter,
    type: row.limit_type,
    unit: row.unit,
  }
  if (row.limit_type === 'range') {
    const [min, max] = row.limit.split('-').map(Number)
    return { ...base, min, max }
  }
  const n = Number(row.limit)
  return row.limit_type === 'min' ? { ...base, min: n } : { ...base, max: n }
}

/** Limits of one CPCB class, keyed by reading parameter name. */
export function limitsForClass(limits: Limit[], cpcbClass: string): Map<string, Limit> {
  return new Map(limits.filter((l) => l.cpcbClass === cpcbClass).map((l) => [l.parameter, l]))
}

/**
 * Compare one value with one limit.
 * A below-detection value is very low: it passes a maximum and fails a minimum.
 * Boundary values pass: the limits read "5 or more" and "3 or less".
 */
export function checkLimit(kind: ValueKind, value: number | null, limit: Limit | undefined): LimitResult {
  if (kind === 'missing') return 'not-tested'
  if (!limit) return 'no-limit'
  if (kind === 'below-detection') {
    if (limit.type === 'max') return 'within'
    if (limit.type === 'min') return 'breach'
    return 'no-limit'
  }
  const v = value as number
  if (limit.min !== undefined && v < limit.min) return 'breach'
  if (limit.max !== undefined && v > limit.max) return 'breach'
  return 'within'
}

const FESTIVAL_CODE: Record<Festival, string> = { Ganesh: 'G', Durga: 'D' }

export function readingId(year: number, festival: Festival, ghatId: string, phase: Phase, parameter: (typeof PARAMETERS)[number]) {
  return `${year}-${FESTIVAL_CODE[festival]}-${ghatId}-${phase}-${PARAMETER_CODES[parameter]}`
}

export function toReading(row: BhopalRow, bathingLimits: Map<string, Limit>): Reading {
  const ghat = GHAT_BY_NAME.get(row.site)!
  const kind = FLAG_KIND[row.flag]
  const value = kind === 'measured' ? Number(row.value) : null
  const year = Number(row.year) as Year
  return {
    id: readingId(year, row.festival, ghat.id, row.phase, row.parameter),
    year,
    festival: row.festival,
    ghatId: ghat.id,
    phase: row.phase,
    parameter: row.parameter,
    value,
    unit: row.unit_assumed,
    kind,
    printed: row.value_as_printed,
    parameterAsPrinted: row.parameter_as_printed,
    siteAsPrinted: row.site_as_printed,
    page: Number(row.source_page),
    limit: checkLimit(kind, value, bathingLimits.get(row.parameter)),
  }
}

/**
 * All 18 year × festival × phase slots for one ghat.
 * A slot with no rows at all means the report has no table for it.
 */
export function coverageForGhat(readings: Reading[], ghatId: string): SlotCoverage[] {
  const own = readings.filter((r) => r.ghatId === ghatId)
  const slots: SlotCoverage[] = []
  for (const year of YEARS)
    for (const festival of FESTIVALS)
      for (const phase of PHASES) {
        const rows = own.filter((r) => r.year === year && r.festival === festival && r.phase === phase)
        const missing = rows.filter((r) => r.kind === 'missing').length
        const measured = rows.length - missing
        if (rows.length === 0) slots.push({ year, festival, phase, status: 'not-tested', reason: 'no-table', measured, missing })
        else if (measured === 0) slots.push({ year, festival, phase, status: 'not-tested', reason: 'marked-not-sampled', measured, missing })
        else if (missing > 0) slots.push({ year, festival, phase, status: 'partial', measured, missing })
        else slots.push({ year, festival, phase, status: 'tested', measured, missing })
      }
  return slots
}
