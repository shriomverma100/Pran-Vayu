import { describe, expect, it } from 'vitest'
import data from '../src/generated/data.json'
import type { GhatInfo } from '../src/core/constants'
import type { GhatScore } from '../src/core/scoring'
import { briefMessage } from '../src/lib/brief'

const scores = data.scores as unknown as GhatScore[]
const ghats = new Map((data.ghats as GhatInfo[]).map((g) => [g.id, g]))

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
