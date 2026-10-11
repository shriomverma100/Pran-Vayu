import { describe, expect, it } from 'vitest'
import { displayStatus, worstStatus } from '../src/core/status'

const r = (parameter: string, kind: 'measured' | 'below-detection' | 'missing', limit: 'within' | 'breach' | 'no-limit' | 'not-tested', value: number | null) =>
  ({ parameter, kind, limit, value }) as Parameters<typeof displayStatus>[0]

describe('displayStatus', () => {
  it('missing is shown as not tested, never as within', () => {
    expect(displayStatus(r('Dissolved oxygen', 'missing', 'not-tested', null))).toBe('not-tested')
  })
  it('oxygen below 2 is severe, 2 to 5 breaks the limit', () => {
    expect(displayStatus(r('Dissolved oxygen', 'measured', 'breach', 0))).toBe('severe')
    expect(displayStatus(r('Dissolved oxygen', 'measured', 'breach', 1.99))).toBe('severe')
    expect(displayStatus(r('Dissolved oxygen', 'measured', 'breach', 2))).toBe('breach')
  })
  it('BOD at twice the limit (6) or more is severe', () => {
    expect(displayStatus(r('BOD', 'measured', 'breach', 6))).toBe('severe')
    expect(displayStatus(r('BOD', 'measured', 'breach', 5.9))).toBe('breach')
  })
  it('below detection on a parameter without a limit shows as below detection', () => {
    expect(displayStatus(r('Lead', 'below-detection', 'no-limit', null))).toBe('bdl')
  })
  it('worst status of a group puts not-tested above within', () => {
    expect(worstStatus(['within', 'not-tested'])).toBe('not-tested')
    expect(worstStatus(['within', 'breach', 'severe'])).toBe('severe')
  })
})
