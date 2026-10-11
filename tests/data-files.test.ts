import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const lines = (f: string) => readFileSync(f, 'utf8').trim().split(/\r?\n/).length - 1

describe('official data files', () => {
  it('Bhopal ghat file has 1,524 readings', () => {
    expect(lines('data/bhopal_ghats_2023_2025.csv')).toBe(1524)
  })
  it('CPCB criteria file has 19 limits', () => {
    expect(lines('data/cpcb_water_quality_criteria.csv')).toBe(19)
  })
})
