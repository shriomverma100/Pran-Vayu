import { describe, expect, it } from 'vitest'
import { checkLimit, FLAG_KIND, parseLimit } from '../src/core/readings'

const doMin = parseLimit({ class: 'B', designated_best_use: 'Outdoor bathing', parameter: 'Dissolved oxygen', limit_type: 'min', limit: '5', unit: 'mg/l' })
const bodMax = parseLimit({ class: 'B', designated_best_use: 'Outdoor bathing', parameter: 'BOD (5 days 20C)', limit_type: 'max', limit: '3', unit: 'mg/l' })
const phRange = parseLimit({ class: 'B', designated_best_use: 'Outdoor bathing', parameter: 'pH', limit_type: 'range', limit: '6.5-8.5', unit: '' })

describe('flag handling', () => {
  it('treats blanks, *, ** and not sampled as missing, never clean', () => {
    for (const f of ['not sampled', '*', '**']) expect(FLAG_KIND[f]).toBe('missing')
  })
  it('treats BDL and ND as below detection, not zero and not missing', () => {
    expect(FLAG_KIND.BDL).toBe('below-detection')
    expect(FLAG_KIND.ND).toBe('below-detection')
  })
})

describe('CPCB limit parsing', () => {
  it('maps CPCB names to reading parameters', () => {
    expect(bodMax.parameter).toBe('BOD')
    expect(phRange).toMatchObject({ min: 6.5, max: 8.5, type: 'range' })
  })
})

describe('checkLimit', () => {
  it('missing is never within the limit', () => {
    expect(checkLimit('missing', null, doMin)).toBe('not-tested')
  })
  it('dissolved oxygen: 5 or more passes, below 5 breaches, 0 breaches', () => {
    expect(checkLimit('measured', 5, doMin)).toBe('within')
    expect(checkLimit('measured', 4.99, doMin)).toBe('breach')
    expect(checkLimit('measured', 0, doMin)).toBe('breach')
  })
  it('BOD: 3 or less passes, above 3 breaches', () => {
    expect(checkLimit('measured', 3, bodMax)).toBe('within')
    expect(checkLimit('measured', 3.1, bodMax)).toBe('breach')
  })
  it('pH: inside 6.5 to 8.5 passes, outside breaches', () => {
    expect(checkLimit('measured', 6.5, phRange)).toBe('within')
    expect(checkLimit('measured', 6.49, phRange)).toBe('breach')
    expect(checkLimit('measured', 9.2, phRange)).toBe('breach')
  })
  it('below detection passes a maximum but fails a minimum', () => {
    expect(checkLimit('below-detection', null, bodMax)).toBe('within')
    expect(checkLimit('below-detection', null, doMin)).toBe('breach')
  })
  it('parameters without a Class B limit are reported as no limit', () => {
    expect(checkLimit('measured', 1.77, undefined)).toBe('no-limit')
  })
})
