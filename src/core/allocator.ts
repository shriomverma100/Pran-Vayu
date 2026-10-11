import type { GhatScore } from './scoring'

// Resource allocator: the officer says how many aerators and sampling teams
// they have; each one is sent to a ghat, with the reason.
//
// Aerators go where oxygen is the problem: ghats whose action includes
// aeration, most oxygen-stressed first (oxygen score, then lowest reading).
// Every such ghat gets one before any ghat gets a second.
//
// Test teams go where we are blind first: ghats with no Durga 2025 test,
// then the ghats with the most missing tests, then the highest risk score
// (to confirm the ranking on the day). One team per ghat; a second team
// goes to the same order again only after every ghat has one.

export type AerateReason = 'DO_ZERO' | 'DO_SEVERE' | 'DO_PUSHED' | 'DO_NOT_RECOVERED' | 'DO_BELOW'
export type TestReason = 'NO_DURGA_2025' | 'MISSING_TESTS' | 'CONFIRM_RISK'

export interface Assignment<R> {
  unit: number
  ghatId: string
  /** 1 for the first unit at this ghat, 2 for a second, ... */
  nth: number
  reason: R
  values: Record<string, number>
  evidence: string[]
}

export interface Allocation {
  aerators: Assignment<AerateReason>[]
  teams: Assignment<TestReason>[]
  /** Ghats that need aeration but got none, because there were too few aerators */
  unservedAeration: string[]
  unservedTesting: string[]
}

const needsAeration = (s: GhatScore) => s.action === 'AERATE_TEST' || s.action === 'AERATE' || s.alsoDo.includes('AERATE')

function aerateReason(s: GhatScore): Pick<Assignment<AerateReason>, 'reason' | 'values' | 'evidence'> {
  const sig = s.signals
  const dox = s.parameters.find((p) => p.parameter === 'Dissolved oxygen')!
  if (sig.zeroDo.length) return { reason: 'DO_ZERO', values: { count: sig.zeroDo.length }, evidence: sig.zeroDo }
  if (sig.severeDo.length) return { reason: 'DO_SEVERE', values: { min: sig.doMin ?? 0, count: sig.severeDo.length }, evidence: sig.severeDo }
  if (sig.pushedBelow.length) return { reason: 'DO_PUSHED', values: { count: sig.pushedBelow.length }, evidence: sig.pushedBelow.flatMap((e) => e.ids) }
  if (sig.notRecovered.length) return { reason: 'DO_NOT_RECOVERED', values: { count: sig.notRecovered.length, tested: sig.afterTested }, evidence: sig.notRecovered }
  return { reason: 'DO_BELOW', values: { count: dox.breaches, tested: dox.tested }, evidence: dox.breachIds }
}

function testReason(s: GhatScore): Pick<Assignment<TestReason>, 'reason' | 'values' | 'evidence'> {
  const b = s.blindSpot
  if (b.latestDurgaMissing) return { reason: 'NO_DURGA_2025', values: { tested: b.tested, total: b.total }, evidence: [] }
  if (b.tested < b.total || b.partialSlots) return { reason: 'MISSING_TESTS', values: { tested: b.tested, total: b.total, partial: b.partialSlots }, evidence: [] }
  return { reason: 'CONFIRM_RISK', values: { rank: s.rank, score: s.score }, evidence: [] }
}

/** Round-robin over a priority list: everyone gets one before anyone gets two. */
function spread<R>(count: number, order: GhatScore[], why: (s: GhatScore) => Pick<Assignment<R>, 'reason' | 'values' | 'evidence'>): Assignment<R>[] {
  const out: Assignment<R>[] = []
  if (!order.length) return out
  for (let unit = 1; unit <= count; unit++) {
    const s = order[(unit - 1) % order.length]
    out.push({ unit, ghatId: s.ghatId, nth: Math.floor((unit - 1) / order.length) + 1, ...why(s) })
  }
  return out
}

export function allocate(scores: GhatScore[], aerators: number, teams: number): Allocation {
  const aerationOrder = scores
    .filter(needsAeration)
    .sort((a, b) => {
      const da = a.parameters.find((p) => p.parameter === 'Dissolved oxygen')!.score ?? 0
      const db = b.parameters.find((p) => p.parameter === 'Dissolved oxygen')!.score ?? 0
      return db - da || (a.signals.doMin ?? 99) - (b.signals.doMin ?? 99)
    })

  const testOrder = [...scores].sort((a, b) => {
    const blind = Number(b.blindSpot.latestDurgaMissing) - Number(a.blindSpot.latestDurgaMissing)
    const missing = a.blindSpot.tested - b.blindSpot.tested || b.blindSpot.partialSlots - a.blindSpot.partialSlots
    return blind || missing || b.score - a.score
  })

  const aer = spread(aerators, aerationOrder, aerateReason)
  const tm = spread(teams, testOrder, testReason)
  const servedA = new Set(aer.map((a) => a.ghatId))
  const servedT = new Set(tm.map((a) => a.ghatId))
  return {
    aerators: aer,
    teams: tm,
    unservedAeration: aerationOrder.filter((s) => !servedA.has(s.ghatId)).map((s) => s.ghatId),
    unservedTesting: testOrder.filter((s) => s.blindSpot.latestDurgaMissing && !servedT.has(s.ghatId)).map((s) => s.ghatId),
  }
}
