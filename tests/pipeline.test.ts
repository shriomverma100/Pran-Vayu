import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import { runGuards } from '../src/core/guards'
import { BhopalRowSchema, coverageForGhat, CpcbRowSchema, limitsForClass, parseLimit, toReading } from '../src/core/readings'
import type { Limit, Reading } from '../src/core/types'
import { KNOWN_DIFFERENCES, verifyReceipts } from '../scripts/verify-receipts'

const csv = (f: string) => Papa.parse<Record<string, string>>(readFileSync(f, 'utf8'), { header: true, skipEmptyLines: true }).data

let limits: Limit[]
let readings: Reading[]

beforeAll(() => {
  limits = csv('data/cpcb_water_quality_criteria.csv').map((r) => parseLimit(CpcbRowSchema.parse(r)))
  const bathing = limitsForClass(limits, 'B')
  readings = csv('data/bhopal_ghats_2023_2025.csv').map((r) => toReading(BhopalRowSchema.parse(r), bathing))
})

describe('pipeline on the official data', () => {
  it('reproduces every fact in the problem statement', () => {
    const failed = runGuards(readings, limits).filter((g) => !g.ok)
    expect(failed).toEqual([])
  })

  it('shows Bairagarh and Malikhedi with 13 of 18 tests, Durga 2025 as no table', () => {
    for (const id of ['BAI', 'MAL']) {
      const slots = coverageForGhat(readings, id)
      expect(slots.filter((s) => s.status !== 'not-tested')).toHaveLength(13)
      const durga25 = slots.filter((s) => s.year === 2025 && s.festival === 'Durga')
      expect(durga25.every((s) => s.status === 'not-tested' && s.reason === 'no-table')).toBe(true)
      const ganesh25 = slots.filter((s) => s.year === 2025 && s.festival === 'Ganesh' && s.phase !== 'during')
      expect(ganesh25.every((s) => s.status === 'not-tested' && s.reason === 'marked-not-sampled')).toBe(true)
    }
  })

  it('never marks a missing reading as within the limit', () => {
    expect(readings.filter((r) => r.kind === 'missing' && r.limit !== 'not-tested')).toEqual([])
  })

  it('keeps a receipt on every reading', () => {
    for (const r of readings) {
      expect(r.page).toBeGreaterThan(0)
      expect(r.siteAsPrinted.length).toBeGreaterThan(0)
    }
  })
})

describe('receipts against the MPPCB PDFs', () => {
  it('finds every printed value and ghat name on its cited page', async () => {
    const { checked, failures } = await verifyReceipts(readings, (y) => `public/reports/mppcb-visarjan-${y}.pdf`)
    expect(checked).toBe(1467)
    expect(failures).toEqual([])
    expect(Object.keys(KNOWN_DIFFERENCES)).toHaveLength(1)
  }, 120_000)
})
