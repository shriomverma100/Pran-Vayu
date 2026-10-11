import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { beforeAll, describe, expect, it } from 'vitest'
import { BhopalRowSchema, CpcbRowSchema, limitsForClass, parseLimit, toReading } from '../src/core/readings'
import { rankStability, scenarios } from '../src/core/robustness'
import { compareGhat, statewideOxygen, type StatewideRow } from '../src/core/statewide'
import type { Limit, Reading } from '../src/core/types'

const csv = <T = Record<string, string>>(f: string) => Papa.parse<T>(readFileSync(f, 'utf8'), { header: true, skipEmptyLines: true }).data
let limits: Limit[]
let readings: Reading[]

beforeAll(() => {
  limits = csv('data/cpcb_water_quality_criteria.csv').map((r) => parseLimit(CpcbRowSchema.parse(r)))
  readings = csv('data/bhopal_ghats_2023_2025.csv').map((r) => toReading(BhopalRowSchema.parse(r), limitsForClass(limits, 'B')))
})

describe('robustness', () => {
  it('builds 24 distinct scenarios', () => {
    const s = scenarios()
    expect(s).toHaveLength(24)
    expect(new Set(s.map((c) => c.id)).size).toBe(24)
  })
  it('Bairagarh is #1 in every scenario', () => {
    const bai = rankStability(readings, limits).ghats.find((g) => g.ghatId === 'BAI')!
    expect(bai.rankCounts[0]).toBe(24)
    expect(bai.stability).toBe('stable')
  })
  it('every scenario ranks all 7 ghats exactly once', () => {
    const { ranksByScenario } = rankStability(readings, limits)
    for (const ranks of Object.values(ranksByScenario)) expect(Object.values(ranks).sort()).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})

describe('statewide comparison', () => {
  let sw: ReturnType<typeof statewideOxygen>
  beforeAll(() => {
    sw = statewideOxygen(csv<StatewideRow>('data/mp_immersion_sites_2023_2025.csv'))
  })
  it('never compares a Bhopal ghat with itself', () => {
    expect(sw.summary.excluded.bhopalGhats).toBe(120)
  })
  it('drops impossible oxygen values above 20 mg/l', () => {
    expect(sw.summary.excluded.implausible).toBe(14)
    expect(Math.max(...sw.values)).toBeLessThanOrEqual(20)
  })
  it('accounts for every statewide oxygen row', () => {
    const doRows = csv<StatewideRow>('data/mp_immersion_sites_2023_2025.csv').filter((r) => r.parameter === 'Dissolved oxygen').length
    const e = sw.summary.excluded
    const kept = sw.summary.readings
    // conflicting duplicates are counted per row; agreeing duplicates collapse to one reading
    expect(kept + e.needsCheck + e.conflictingDuplicates + e.implausible + e.bhopalGhats + e.notMeasured).toBeLessThanOrEqual(doRows)
    expect(sw.summary.histogram.reduce((a, b) => a + b, 0)).toBe(kept)
  })
  it('Bairagarh: typical oxygen lower than 92% of other MP readings', () => {
    const c = compareGhat('BAI', readings, sw.values)
    expect(c.median).toBe(4.1)
    expect(c.worseThanShare).toBeCloseTo(0.923, 3)
  })
})
