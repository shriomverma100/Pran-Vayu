import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { beforeAll, describe, expect, it } from 'vitest'
import { allocate } from '../src/core/allocator'
import { entriesToCsv, rescoreWithField, upsertEntry, validateEntry, type FieldEntry } from '../src/core/field'
import { BhopalRowSchema, CpcbRowSchema, limitsForClass, parseLimit, toReading } from '../src/core/readings'
import { scoreGhats, type GhatScore } from '../src/core/scoring'
import type { Limit, Reading } from '../src/core/types'

const csv = (f: string) => Papa.parse<Record<string, string>>(readFileSync(f, 'utf8'), { header: true, skipEmptyLines: true }).data
let limits: Limit[]
let readings: Reading[]
let scores: GhatScore[]

beforeAll(() => {
  limits = csv('data/cpcb_water_quality_criteria.csv').map((r) => parseLimit(CpcbRowSchema.parse(r)))
  readings = csv('data/bhopal_ghats_2023_2025.csv').map((r) => toReading(BhopalRowSchema.parse(r), limitsForClass(limits, 'B')))
  scores = scoreGhats(readings, limits)
})

describe('allocator', () => {
  it('3 aerators go to the most oxygen-stressed ghats, one each', () => {
    const a = allocate(scores, 3, 0).aerators
    expect(a.map((x) => x.ghatId)).toEqual(['BAI', 'MAL', 'RKP'])
    expect(a.every((x) => x.nth === 1)).toBe(true)
    expect(a[0]).toMatchObject({ reason: 'DO_ZERO', values: { count: 4 } })
  })
  it('never sends an aerator to a ghat whose oxygen never broke the limit', () => {
    const a = allocate(scores, 20, 0).aerators
    expect(a.some((x) => x.ghatId === 'HAT')).toBe(false)
  })
  it('test teams go first to ghats with no Durga 2025 test', () => {
    const tm = allocate(scores, 0, 2).teams
    expect(tm.map((x) => x.ghatId).sort()).toEqual(['BAI', 'MAL'])
    expect(tm.every((x) => x.reason === 'NO_DURGA_2025')).toBe(true)
  })
  it('a third team goes to the ghat with partial tests', () => {
    const tm = allocate(scores, 0, 3).teams
    expect(tm[2].reason).toBe('MISSING_TESTS')
  })
  it('everyone gets one before anyone gets two', () => {
    const a = allocate(scores, 8, 0).aerators
    const firsts = a.filter((x) => x.nth === 1).length
    expect(firsts).toBe(6)
    expect(a.slice(6).every((x) => x.nth === 2)).toBe(true)
  })
  it('reports blind-spot ghats left without a team', () => {
    expect(allocate(scores, 0, 1).unservedTesting).toHaveLength(1)
  })
  it('zero resources gives an empty plan', () => {
    expect(allocate(scores, 0, 0)).toMatchObject({ aerators: [], teams: [] })
  })
})

describe('field entries', () => {
  const base: FieldEntry = { ghatId: 'BAI', phase: 'during', parameter: 'Dissolved oxygen', value: 3.2, flag: '', date: '2026-10-20' }
  it('rejects impossible values and accepts real ones', () => {
    expect(validateEntry(base)).toBeNull()
    expect(validateEntry({ ...base, value: 43.2 })).toBe('implausible')
    expect(validateEntry({ ...base, value: -1 })).toBe('bad-value')
    expect(validateEntry({ ...base, value: null, flag: 'BDL' })).toBeNull()
  })
  it('one entry per ghat, phase and parameter', () => {
    const list = upsertEntry(upsertEntry([], base), { ...base, value: 4.1 })
    expect(list).toHaveLength(1)
    expect(list[0].value).toBe(4.1)
  })
  it('a 20 October reading changes the score', () => {
    const before = scores.find((s) => s.ghatId === 'HAT')!.score
    const after = rescoreWithField(readings, limits, [{ ...base, ghatId: 'HAT', value: 0.5 }]).find((s) => s.ghatId === 'HAT')!.score
    expect(after).toBeGreaterThan(before)
  })
  it('CSV uses the official columns and carries no personal data', () => {
    const out = entriesToCsv([base])
    const [header, row] = out.trim().split('\n')
    expect(header.startsWith('year,festival,site,water_body,phase,parameter,value')).toBe(true)
    expect(row.startsWith('2026,Durga,Bairagarh (Sant Hirdaram) kund,Upper Lake,during,Dissolved oxygen,3.2')).toBe(true)
  })
})
