import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { beforeAll, describe, expect, it } from 'vitest'
import { BhopalRowSchema, CpcbRowSchema, limitsForClass, parseLimit, toReading } from '../src/core/readings'
import { chooseActions, scoreGhats, severity, type GhatScore, type Signals, type BlindSpot } from '../src/core/scoring'
import type { Limit } from '../src/core/types'

const csv = (f: string) => Papa.parse<Record<string, string>>(readFileSync(f, 'utf8'), { header: true, skipEmptyLines: true }).data
let limits: Limit[]
let scores: GhatScore[]
const ghat = (id: string) => scores.find((s) => s.ghatId === id)!
const param = (id: string, p: string) => ghat(id).parameters.find((x) => x.parameter === p)!

beforeAll(() => {
  limits = csv('data/cpcb_water_quality_criteria.csv').map((r) => parseLimit(CpcbRowSchema.parse(r)))
  const bathing = limitsForClass(limits, 'B')
  const readings = csv('data/bhopal_ghats_2023_2025.csv').map((r) => toReading(BhopalRowSchema.parse(r), bathing))
  scores = scoreGhats(readings, limits)
})

describe('severity', () => {
  const doMin = { cpcbClass: 'B', bestUse: '', parameter: 'Dissolved oxygen', cpcbParameter: '', type: 'min' as const, min: 5, unit: 'mg/l' }
  const bodMax = { cpcbClass: 'B', bestUse: '', parameter: 'BOD', cpcbParameter: '', type: 'max' as const, max: 3, unit: 'mg/l' }
  it('oxygen: 0 at the limit, 1 at zero', () => {
    expect(severity(5, doMin)).toBe(0)
    expect(severity(2.5, doMin)).toBe(0.5)
    expect(severity(0, doMin)).toBe(1)
  })
  it('BOD: 0 at the limit, 1 at four times the limit and beyond', () => {
    expect(severity(3, bodMax)).toBe(0)
    expect(severity(12, bodMax)).toBe(1)
    expect(severity(22, bodMax)).toBe(1)
  })
})

describe('hand-worked scores', () => {
  // Bairagarh oxygen, weight = festival (Ganesh 1, Durga 1.5) × year (1, 1.25, 1.5).
  // A breach scores 100 - 10 × value (50 + 50 × (5 - v) / 5).
  // 2023 G (w 1):     5.6 ok, 4.5 → 55, 0 → 100                     = 155
  // 2023 D (w 1.5):   0 → 100, 0 → 100, 4.2 → 58          × 1.5     = 387
  // 2024 G (w 1.25):  5.2 ok, 4.1 → 59, 4.2 → 58          × 1.25    = 146.25
  // 2024 D (w 1.875): 4.2 → 58, 2.2 → 78, 2.4 → 76        × 1.875   = 397.5
  // 2025 G (w 1.5):   during 0 → 100                      × 1.5     = 150
  // total 1235.75 / total weight 18.375 = 67.25 → 67.3
  it('Bairagarh oxygen score is 67.3', () => {
    expect(param('BAI', 'Dissolved oxygen').score).toBe(67.3)
    expect(param('BAI', 'Dissolved oxygen').breaches).toBe(11)
    expect(param('BAI', 'Dissolved oxygen').tested).toBe(13)
  })
  // Hathaikheda: oxygen 0 (no breach), BOD 66.7, pH 11.4 → 0.5×0 + 0.3×66.7 + 0.2×11.4 = 22.3
  it('Hathaikheda total is 0.5 × DO + 0.3 × BOD + 0.2 × pH', () => {
    const h = ghat('HAT')
    expect(param('HAT', 'Dissolved oxygen').score).toBe(0)
    expect(h.score).toBe(Math.round((0.3 * param('HAT', 'BOD').score! + 0.2 * param('HAT', 'pH').score!) * 10) / 10)
    expect(h.score).toBe(22.3)
  })
})

describe('ranking on the official data', () => {
  it('ranks all 7 ghats once', () => {
    expect(scores.map((s) => s.rank)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
  it('puts Bairagarh first: 4 zero-oxygen readings, act now', () => {
    expect(scores[0].ghatId).toBe('BAI')
    expect(scores[0].tier).toBe('act-now')
    expect(scores[0].signals.zeroDo).toHaveLength(4)
  })
  it('sends test teams where Durga 2025 is missing', () => {
    for (const id of ['BAI', 'MAL']) {
      expect(ghat(id).blindSpot.latestDurgaMissing).toBe(true)
      expect(ghat(id).action).toBe('AERATE_TEST')
    }
    for (const id of ['KHA', 'PRE', 'RKP', 'HAT', 'SHA']) expect(ghat(id).blindSpot.latestDurgaMissing).toBe(false)
  })
  it('every reason with numbers carries receipts', () => {
    for (const s of scores)
      for (const r of s.reasons) if (!['DURGA_2025_MISSING', 'SLOTS_MISSING'].includes(r.code)) expect(r.evidence.length).toBeGreaterThan(0)
  })
  it('separates already-low water from immersion-driven drops', () => {
    expect(ghat('RKP').signals.pattern).toBe('already-low')
    expect(ghat('HAT').signals.pattern).toBe('none')
    expect(ghat('BAI').signals.lowBefore.map((e) => `${e.year}${e.festival}`)).toEqual(['2023Durga', '2024Durga'])
  })
  it('missing readings never add to or subtract from a score', () => {
    // Bairagarh has 24 missing readings + 5 absent tests; only the 13 tested oxygen readings count
    expect(param('BAI', 'Dissolved oxygen').tested).toBe(13)
  })
})

describe('action rule', () => {
  const sig = (o: Partial<Signals>): Signals => ({
    doMin: 6, doMinId: null, zeroDo: [], severeDo: [], severeBod: [], events: [], meanDrop: null,
    pushedBelow: [], lowBefore: [], pattern: 'none', notRecovered: [], afterTested: 0, phOutside: [], bodDuringAfterBreach: [], ...o,
  })
  const blind = (latestDurgaMissing: boolean): BlindSpot => ({ tested: 18, total: 18, missingSlots: [], latestDurgaMissing, partialSlots: 0 })
  it('severe oxygen + missing Durga → aerate and test', () => {
    expect(chooseActions(sig({ severeDo: ['x'] }), blind(true)).action).toBe('AERATE_TEST')
  })
  it('missing Durga alone → test first', () => {
    expect(chooseActions(sig({}), blind(true)).action).toBe('TEST_FIRST')
  })
  it('oxygen still low a week later → aerate', () => {
    expect(chooseActions(sig({ notRecovered: ['x'] }), blind(false)).action).toBe('AERATE')
  })
  it('only BOD or pH breaches → clean and re-test', () => {
    expect(chooseActions(sig({ bodDuringAfterBreach: ['x'] }), blind(false)).action).toBe('CLEAN_RETEST')
  })
  it('nothing broken → routine', () => {
    expect(chooseActions(sig({}), blind(false)).action).toBe('ROUTINE')
  })
})
