import { GHATS, PARAMETERS } from './constants'
import type { Limit, Reading } from './types'

export interface GuardResult {
  name: string
  expected: string
  actual: string
  ok: boolean
}

const check = (name: string, expected: unknown, actual: unknown): GuardResult => ({
  name,
  expected: String(expected),
  actual: String(actual),
  ok: String(expected) === String(actual),
})

/**
 * Facts the build must reproduce exactly. They come from the Track 2 problem
 * statement and data dictionary. If any fails, the data or the parsing changed
 * and nothing downstream can be trusted.
 */
export function runGuards(readings: Reading[], limits: Limit[]): GuardResult[] {
  const measured = (p: string) => readings.filter((r) => r.parameter === p && r.kind === 'measured')
  const doReadings = measured('Dissolved oxygen')
  const bod = measured('BOD')
  const zeroDo = doReadings.filter((r) => r.value === 0)
  const ids = new Set(readings.map((r) => r.id))
  const classB = limits.filter((l) => l.cpcbClass === 'B')

  return [
    check('Bhopal readings', 1524, readings.length),
    check('Unique reading IDs', readings.length, ids.size),
    check('Ghats', GHATS.length, new Set(readings.map((r) => r.ghatId)).size),
    check('Parameters', PARAMETERS.length, new Set(readings.map((r) => r.parameter)).size),
    check('Dissolved-oxygen readings with a number', 116, doReadings.length),
    check('Dissolved oxygen below 5 mg/l', 42, doReadings.filter((r) => (r.value as number) < 5).length),
    check('BOD readings with a number', 112, bod.length),
    check('BOD above 3 mg/l', 100, bod.filter((r) => (r.value as number) > 3).length),
    check('Zero-oxygen readings', 4, zeroDo.length),
    check('Zero-oxygen readings all at Bairagarh', true, zeroDo.every((r) => r.ghatId === 'BAI')),
    check('Zero-oxygen years', '2023,2025', [...new Set(zeroDo.map((r) => r.year))].sort().join(',')),
    check('Below-detection (BDL) readings', 174, readings.filter((r) => r.kind === 'below-detection').length),
    check('Missing readings (not sampled, *, **)', 61, readings.filter((r) => r.kind === 'missing').length),
    check('CPCB limits', 19, limits.length),
    check('CPCB Class B limits', 4, classB.length),
    check('Class B dissolved oxygen minimum', 5, classB.find((l) => l.parameter === 'Dissolved oxygen')?.min),
    check('Class B BOD maximum', 3, classB.find((l) => l.parameter === 'BOD')?.max),
    check('Class B pH range', '6.5-8.5', `${classB.find((l) => l.parameter === 'pH')?.min}-${classB.find((l) => l.parameter === 'pH')?.max}`),
  ]
}
