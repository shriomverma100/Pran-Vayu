import { GHATS, PHASES, SLOTS_PER_GHAT, type Festival, type Year } from './constants'
import { checkLimit, coverageForGhat, limitsForClass } from './readings'
import type { Limit, Reading, SlotCoverage } from './types'

// ---------------------------------------------------------------------------
// The scoring rule, in plain words (shown on the Method card):
//
// 1. Only the three parameters with a CPCB bathing limit are scored:
//    dissolved oxygen (5 or more), BOD (3 or less) and pH (6.5 to 8.5).
// 2. Each tested reading gets points: 0 if within the limit; if it breaks the
//    limit, 50 points plus up to 50 more for how far past the limit it is.
// 3. Missing readings get no points and are never counted as clean. They are
//    reported separately as blind spots.
// 4. Durga readings and recent years count more, because the decision is for
//    Durga visarjan 2026.
// 5. Ghat risk score (0 to 100) = 50% oxygen + 30% BOD + 20% pH.
// ---------------------------------------------------------------------------

export type ScoredParameter = 'Dissolved oxygen' | 'BOD' | 'pH'
export const SCORED_PARAMETERS: ScoredParameter[] = ['Dissolved oxygen', 'BOD', 'pH']

export interface ScoringConfig {
  id: string
  cpcbClass: string
  festivalWeight: Record<Festival, number>
  yearWeight: Record<Year, number>
  parameterWeight: Record<ScoredParameter, number>
}

export const DEFAULT_CONFIG: ScoringConfig = {
  id: 'default',
  cpcbClass: 'B',
  festivalWeight: { Ganesh: 1, Durga: 1.5 },
  yearWeight: { 2023: 1, 2024: 1.25, 2025: 1.5 },
  parameterWeight: { 'Dissolved oxygen': 0.5, BOD: 0.3, pH: 0.2 },
}

/** Oxygen below this is "severe": far below the 5 mg/l bathing minimum. */
export const SEVERE_DO = 2
/** BOD at or above this multiple of the limit is "severe". */
export const SEVERE_BOD_MULTIPLE = 2

/** How far past the limit a breaching value is, from 0 (at the limit) to 1. */
export function severity(value: number | null, limit: Limit): number {
  if (value === null) return 1 // below detection on a minimum limit: as low as it gets
  if (limit.type === 'min' && limit.min !== undefined) return clamp01((limit.min - value) / limit.min)
  if (limit.type === 'max' && limit.max !== undefined) return clamp01((value - limit.max) / (3 * limit.max))
  if (limit.min !== undefined && value < limit.min) return clamp01(limit.min - value)
  if (limit.max !== undefined && value > limit.max) return clamp01(value - limit.max)
  return 0
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const round1 = (n: number) => Math.round(n * 10) / 10

export interface ParameterSummary {
  parameter: ScoredParameter
  tested: number
  breaches: number
  /** Weighted 0-100 score for this parameter, null if no limit or no tests */
  score: number | null
  /** IDs of breaching readings, worst first */
  breachIds: string[]
  worstId: string | null
}

export interface ImmersionEvent {
  year: Year
  festival: Festival
  pre: number | null
  during: number | null
  after: number | null
  /** Oxygen lost between before immersion and the lowest later reading */
  drop: number | null
  pushedBelowLimit: boolean
  ids: string[]
}

export interface Signals {
  doMin: number | null
  doMinId: string | null
  zeroDo: string[]
  severeDo: string[]
  severeBod: string[]
  /** Immersion events with oxygen before and after */
  events: ImmersionEvent[]
  /** Mean oxygen drop across events with a before reading */
  meanDrop: number | null
  pushedBelow: ImmersionEvent[]
  /** Festivals where oxygen was already below the limit before immersion began */
  lowBefore: ImmersionEvent[]
  /** already-low: the water is stressed before visarjan; immersion-driven: visarjan pulls it down */
  pattern: 'already-low' | 'immersion-driven' | 'both' | 'none'
  /** One week after immersion, oxygen still below the limit */
  notRecovered: string[]
  afterTested: number
  phOutside: string[]
  bodDuringAfterBreach: string[]
}

export interface BlindSpot {
  tested: number
  total: number
  missingSlots: SlotCoverage[]
  /** The most recent Durga visarjan (2025) has no test at all */
  latestDurgaMissing: boolean
  partialSlots: number
}

export type ActionCode = 'AERATE_TEST' | 'TEST_FIRST' | 'AERATE' | 'CLEAN_RETEST' | 'ROUTINE'
/** Every ghat breaks the BOD limit, so no tier means "clean". */
export type Tier = 'act-now' | 'high' | 'moderate'

export interface Reason {
  code: string
  values: Record<string, string | number>
  evidence: string[]
}

export interface GhatScore {
  ghatId: string
  rank: number
  score: number
  tier: Tier
  action: ActionCode
  /** Supporting actions beyond the main one */
  alsoDo: ActionCode[]
  parameters: ParameterSummary[]
  signals: Signals
  blindSpot: BlindSpot
  reasons: Reason[]
}

function weightOf(r: Reading, c: ScoringConfig) {
  return c.festivalWeight[r.festival] * c.yearWeight[r.year]
}

function summariseParameter(own: Reading[], parameter: ScoredParameter, limit: Limit | undefined, c: ScoringConfig): ParameterSummary {
  const tested = own.filter((r) => r.parameter === parameter && r.kind !== 'missing')
  if (!limit || tested.length === 0) return { parameter, tested: tested.length, breaches: 0, score: null, breachIds: [], worstId: null }
  let points = 0
  let weights = 0
  const breaching: { id: string; sev: number }[] = []
  for (const r of tested) {
    const w = weightOf(r, c)
    weights += w
    if (checkLimit(r.kind, r.value, limit) === 'breach') {
      const sev = severity(r.value, limit)
      points += w * (50 + 50 * sev)
      breaching.push({ id: r.id, sev })
    }
  }
  breaching.sort((a, b) => b.sev - a.sev)
  return {
    parameter,
    tested: tested.length,
    breaches: breaching.length,
    score: round1(points / weights),
    breachIds: breaching.map((b) => b.id),
    worstId: breaching[0]?.id ?? null,
  }
}

const doValue = (own: Reading[], year: Year, festival: Festival, phase: string) =>
  own.find((r) => r.parameter === 'Dissolved oxygen' && r.year === year && r.festival === festival && r.phase === phase && r.kind === 'measured')

function signalsFor(own: Reading[], doLimit: Limit | undefined, bodLimit: Limit | undefined, phLimit: Limit | undefined): Signals {
  const doReadings = own.filter((r) => r.parameter === 'Dissolved oxygen' && r.kind === 'measured')
  const doMinR = doReadings.reduce<Reading | null>((m, r) => (m === null || (r.value as number) < (m.value as number) ? r : m), null)
  const doMinLimit = doLimit?.min ?? 5

  const events: ImmersionEvent[] = []
  for (const year of [2023, 2024, 2025] as Year[])
    for (const festival of ['Ganesh', 'Durga'] as Festival[]) {
      const [pre, during, after] = PHASES.map((p) => doValue(own, year, festival, p))
      if (!pre && !during && !after) continue
      const later = [during, after].filter(Boolean) as Reading[]
      const lowestLater = later.length ? Math.min(...later.map((r) => r.value as number)) : null
      const drop = pre && lowestLater !== null ? round1((pre.value as number) - lowestLater) : null
      events.push({
        year,
        festival,
        pre: pre ? (pre.value as number) : null,
        during: during ? (during.value as number) : null,
        after: after ? (after.value as number) : null,
        drop,
        pushedBelowLimit: !!pre && (pre.value as number) >= doMinLimit && lowestLater !== null && lowestLater < doMinLimit,
        ids: [pre, during, after].filter(Boolean).map((r) => (r as Reading).id),
      })
    }
  const drops = events.map((e) => e.drop).filter((d): d is number => d !== null)
  const pushedBelow = events.filter((e) => e.pushedBelowLimit)
  const lowBefore = events.filter((e) => e.pre !== null && e.pre < doMinLimit)
  const pattern = pushedBelow.length && lowBefore.length ? 'both' : lowBefore.length ? 'already-low' : pushedBelow.length ? 'immersion-driven' : 'none'

  const afterDo = doReadings.filter((r) => r.phase === 'after')
  const bod = own.filter((r) => r.parameter === 'BOD' && r.kind === 'measured')
  const ph = own.filter((r) => r.parameter === 'pH' && r.kind === 'measured')

  return {
    doMin: doMinR ? (doMinR.value as number) : null,
    doMinId: doMinR?.id ?? null,
    zeroDo: doReadings.filter((r) => r.value === 0).map((r) => r.id),
    severeDo: doReadings.filter((r) => (r.value as number) < SEVERE_DO).map((r) => r.id),
    severeBod: bodLimit?.max ? bod.filter((r) => (r.value as number) >= SEVERE_BOD_MULTIPLE * bodLimit.max!).map((r) => r.id) : [],
    events,
    meanDrop: drops.length ? round1(drops.reduce((a, b) => a + b, 0) / drops.length) : null,
    pushedBelow,
    lowBefore,
    pattern,
    notRecovered: afterDo.filter((r) => (r.value as number) < doMinLimit).map((r) => r.id),
    afterTested: afterDo.length,
    phOutside: phLimit ? ph.filter((r) => checkLimit(r.kind, r.value, phLimit) === 'breach').map((r) => r.id) : [],
    bodDuringAfterBreach: bodLimit
      ? bod.filter((r) => r.phase !== 'pre' && checkLimit(r.kind, r.value, bodLimit) === 'breach').map((r) => r.id)
      : [],
  }
}

function blindSpotFor(slots: SlotCoverage[]): BlindSpot {
  const missingSlots = slots.filter((s) => s.status === 'not-tested')
  return {
    tested: slots.length - missingSlots.length,
    total: SLOTS_PER_GHAT,
    missingSlots,
    latestDurgaMissing: slots.filter((s) => s.year === 2025 && s.festival === 'Durga').every((s) => s.status === 'not-tested'),
    partialSlots: slots.filter((s) => s.status === 'partial').length,
  }
}

/**
 * The action rule. One main action per ghat, chosen in this order:
 * - AERATE_TEST  oxygen has been severe (below 2) AND the latest Durga was not tested
 * - TEST_FIRST   the latest Durga was not tested (we are blind where it matters)
 * - AERATE       immersion pushed oxygen below 5, or it stayed below 5 a week later
 * - CLEAN_RETEST BOD or pH broke the limit during or after immersion
 * - ROUTINE      none of the above
 */
export function chooseActions(s: Signals, b: BlindSpot): { action: ActionCode; alsoDo: ActionCode[] } {
  const all: ActionCode[] = []
  if (s.severeDo.length && b.latestDurgaMissing) all.push('AERATE_TEST')
  if (b.latestDurgaMissing) all.push('TEST_FIRST')
  if (s.pushedBelow.length || s.notRecovered.length || s.severeDo.length) all.push('AERATE')
  if (s.bodDuringAfterBreach.length || s.phOutside.length) all.push('CLEAN_RETEST')
  if (!all.length) all.push('ROUTINE')
  const action = all[0]
  const covered: Record<ActionCode, ActionCode[]> = {
    AERATE_TEST: ['TEST_FIRST', 'AERATE'],
    TEST_FIRST: [],
    AERATE: [],
    CLEAN_RETEST: [],
    ROUTINE: [],
  }
  return { action, alsoDo: all.slice(1).filter((a) => !covered[action].includes(a)) }
}

function reasonsFor(params: ParameterSummary[], s: Signals, b: BlindSpot): Reason[] {
  const out: Reason[] = []
  const p = (name: ScoredParameter) => params.find((x) => x.parameter === name)!
  const dox = p('Dissolved oxygen')
  const bod = p('BOD')
  const ph = p('pH')

  if (s.zeroDo.length) out.push({ code: 'DO_ZERO', values: { count: s.zeroDo.length }, evidence: s.zeroDo })
  else if (s.severeDo.length) out.push({ code: 'DO_SEVERE', values: { count: s.severeDo.length, min: s.doMin ?? 0 }, evidence: s.severeDo })
  if (dox.breaches) out.push({ code: 'DO_BELOW', values: { count: dox.breaches, tested: dox.tested }, evidence: dox.breachIds })
  else if (dox.tested) out.push({ code: 'DO_OK', values: { tested: dox.tested, min: s.doMin ?? 0 }, evidence: s.doMinId ? [s.doMinId] : [] })
  if (s.pushedBelow.length)
    out.push({ code: 'DO_PUSHED_BELOW', values: { count: s.pushedBelow.length }, evidence: s.pushedBelow.flatMap((e) => e.ids) })
  if (s.lowBefore.length)
    out.push({ code: 'DO_LOW_BEFORE', values: { count: s.lowBefore.length }, evidence: s.lowBefore.flatMap((e) => e.ids) })
  if (s.notRecovered.length)
    out.push({ code: 'DO_NOT_RECOVERED', values: { count: s.notRecovered.length, tested: s.afterTested }, evidence: s.notRecovered })
  if (bod.breaches) out.push({ code: 'BOD_ABOVE', values: { count: bod.breaches, tested: bod.tested }, evidence: bod.breachIds })
  if (ph.breaches) out.push({ code: 'PH_OUTSIDE', values: { count: ph.breaches, tested: ph.tested }, evidence: ph.breachIds })
  if (b.latestDurgaMissing) out.push({ code: 'DURGA_2025_MISSING', values: { tested: b.tested, total: b.total }, evidence: [] })
  else if (b.tested < b.total) out.push({ code: 'SLOTS_MISSING', values: { tested: b.tested, total: b.total }, evidence: [] })
  return out
}

/** Tier from the score and the severe signals. */
function tierFor(score: number, s: Signals): Tier {
  if (score >= 55 || s.severeDo.length) return 'act-now'
  if (score >= 30) return 'high'
  return 'moderate'
}

export function scoreGhats(readings: Reading[], limits: Limit[], config: ScoringConfig = DEFAULT_CONFIG): GhatScore[] {
  const classLimits = limitsForClass(limits, config.cpcbClass)
  const doLimit = classLimits.get('Dissolved oxygen')
  const bodLimit = classLimits.get('BOD')
  const phLimit = classLimits.get('pH')

  const scored = GHATS.map((g) => {
    const own = readings.filter((r) => r.ghatId === g.id)
    const parameters = SCORED_PARAMETERS.map((p) => summariseParameter(own, p, classLimits.get(p), config))
    // Parameters without a limit in this class drop out; the rest are reweighted to 100%.
    const usable = parameters.filter((p) => p.score !== null)
    const totalWeight = usable.reduce((a, p) => a + config.parameterWeight[p.parameter], 0)
    const score = round1(usable.reduce((a, p) => a + config.parameterWeight[p.parameter] * (p.score as number), 0) / totalWeight)
    const signals = signalsFor(own, doLimit, bodLimit, phLimit)
    const blindSpot = blindSpotFor(coverageForGhat(readings, g.id))
    const { action, alsoDo } = chooseActions(signals, blindSpot)
    return {
      ghatId: g.id,
      rank: 0,
      score,
      tier: tierFor(score, signals),
      action,
      alsoDo,
      parameters,
      signals,
      blindSpot,
      reasons: reasonsFor(parameters, signals, blindSpot),
    }
  })

  // Highest score first; ties broken by the lowest oxygen reading.
  scored.sort((a, b) => b.score - a.score || (a.signals.doMin ?? 99) - (b.signals.doMin ?? 99))
  scored.forEach((s, i) => (s.rank = i + 1))
  return scored
}
