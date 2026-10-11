import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { beforeAll, describe, expect, it } from 'vitest'
import { GHATS } from '../src/core/constants'
import { BhopalRowSchema, CpcbRowSchema, limitsForClass, parseLimit, toReading } from '../src/core/readings'
import { scoreGhats, type GhatScore } from '../src/core/scoring'
import { briefMessage } from '../src/lib/brief'

// Built from the official CSVs, like every other test, so it runs in a fresh clone.
const csv = (f: string) => Papa.parse<Record<string, string>>(readFileSync(f, 'utf8'), { header: true, skipEmptyLines: true }).data
const ghats = new Map(GHATS.map((g) => [g.id, g]))
let scores: GhatScore[]

beforeAll(() => {
  const limits = csv('data/cpcb_water_quality_criteria.csv').map((r) => parseLimit(CpcbRowSchema.parse(r)))
  const readings = csv('data/bhopal_ghats_2023_2025.csv').map((r) => toReading(BhopalRowSchema.parse(r), limitsForClass(limits, 'B')))
  scores = scoreGhats(readings, limits)
})

describe('WhatsApp brief', () => {
  it('English: top 3 in rank order, blind spots, and the honesty line', () => {
    const m = briefMessage('en', scores, ghats)
    expect(m).toContain('1. Bairagarh (Sant Hirdaram) kund: Aerate + send test team. Oxygen fell to 0 mg/l in 4 tests.')
    expect(m).toContain('2. Malikhedi kund')
    expect(m).toContain('3. Shahpura lake ghat')
    expect(m).toContain('Bairagarh (Sant Hirdaram) kund, Malikhedi kund')
    expect(m).toContain('no health claims')
    expect(m.length).toBeLessThan(1200)
  })
  it('Hindi uses Hindi ghat names', () => {
    const m = briefMessage('hi', scores, ghats)
    expect(m).toContain('बैरागढ़ (संत हिरदाराम) कुंड')
    expect(m).toContain('स्वास्थ्य')
  })
})
