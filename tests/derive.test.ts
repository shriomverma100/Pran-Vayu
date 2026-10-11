import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { immersionSummary } from '../src/core/derive'
import { BhopalRowSchema, CpcbRowSchema, limitsForClass, parseLimit, toReading } from '../src/core/readings'
import { scoreGhats } from '../src/core/scoring'

const csv = (f: string) => Papa.parse<Record<string, string>>(readFileSync(f, 'utf8'), { header: true, skipEmptyLines: true }).data

describe('immersionSummary', () => {
  const limits = csv('data/cpcb_water_quality_criteria.csv').map((r) => parseLimit(CpcbRowSchema.parse(r)))
  const readings = csv('data/bhopal_ghats_2023_2025.csv').map((r) => toReading(BhopalRowSchema.parse(r), limitsForClass(limits, 'B')))
  const bai = scoreGhats(readings, limits).find((s) => s.ghatId === 'BAI')!

  // Bairagarh festivals with a before reading: 2023 G (5.6 → min(4.5, 0) = 0), 2023 D (0 → 0),
  // 2024 G (5.2 → 4.1), 2024 D (4.2 → 2.2). 2025 G has no before reading and is left out.
  // Before mean (5.6 + 0 + 5.2 + 4.2) / 4 = 3.75; lowest-after mean (0 + 0 + 4.1 + 2.2) / 4 = 1.575
  it('Bairagarh by hand: 4 festivals, before 3.75, lowest after 1.58', () => {
    expect(immersionSummary(bai.signals.events)).toEqual({ events: 4, meanBefore: 3.75, meanLowestAfter: 1.58 })
  })
  it('difference matches the mean drop used in scoring', () => {
    const s = immersionSummary(bai.signals.events)
    expect(Math.round(((s.meanBefore as number) - (s.meanLowestAfter as number)) * 10) / 10).toBe(bai.signals.meanDrop)
  })
})
