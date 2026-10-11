import { describe, expect, it } from 'vitest'
import { daysUntil } from '../src/core/dates'

describe('daysUntil', () => {
  it('11 October to 20 October is 9 days, morning or night', () => {
    expect(daysUntil('2026-10-20', new Date(2026, 9, 11, 0, 5))).toBe(9)
    expect(daysUntil('2026-10-20', new Date(2026, 9, 11, 23, 55))).toBe(9)
  })
  it('is 0 on the day and negative after', () => {
    expect(daysUntil('2026-10-20', new Date(2026, 9, 20, 12))).toBe(0)
    expect(daysUntil('2026-10-20', new Date(2026, 9, 22, 12))).toBe(-2)
  })
})
