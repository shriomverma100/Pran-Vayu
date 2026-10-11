import { DEFAULT_CONFIG, scoreGhats, type ScoringConfig } from './scoring'
import type { Limit, Reading } from './types'

// Robustness check: re-run the ranking under every reasonable scoring choice.
// 3 CPCB classes × 2 festival weightings × 2 year weightings × 2 parameter
// weightings = 24 scenarios. A rank that holds across all 24 does not depend
// on any single judgement call in the scoring rule.

export const CLASS_OPTIONS = [
  { cpcbClass: 'B', label: 'Class B: outdoor bathing (DO ≥ 5, BOD ≤ 3, pH 6.5–8.5)' },
  { cpcbClass: 'C', label: 'Class C: drinking source after treatment (DO ≥ 4, BOD ≤ 3, pH 6–9)' },
  { cpcbClass: 'D', label: 'Class D: wildlife and fisheries (DO ≥ 4, pH 6.5–8.5, no BOD limit)' },
]
export const FESTIVAL_OPTIONS = [
  { id: 'durga', label: 'Durga counts 1.5×', weight: { Ganesh: 1, Durga: 1.5 } },
  { id: 'equal', label: 'Ganesh and Durga equal', weight: { Ganesh: 1, Durga: 1 } },
]
export const YEAR_OPTIONS = [
  { id: 'recent', label: 'Recent years count more (1, 1.25, 1.5)', weight: { 2023: 1, 2024: 1.25, 2025: 1.5 } },
  { id: 'equal', label: 'All years equal', weight: { 2023: 1, 2024: 1, 2025: 1 } },
]
export const PARAMETER_OPTIONS = [
  { id: 'oxygen-led', label: 'Oxygen 50%, BOD 30%, pH 20%', weight: { 'Dissolved oxygen': 0.5, BOD: 0.3, pH: 0.2 } },
  { id: 'equal', label: 'Oxygen, BOD and pH equal', weight: { 'Dissolved oxygen': 1, BOD: 1, pH: 1 } },
]

export function scenarios(): ScoringConfig[] {
  const out: ScoringConfig[] = []
  for (const c of CLASS_OPTIONS)
    for (const f of FESTIVAL_OPTIONS)
      for (const y of YEAR_OPTIONS)
        for (const p of PARAMETER_OPTIONS)
          out.push({
            id: `${c.cpcbClass}-${f.id}-${y.id}-${p.id}`,
            cpcbClass: c.cpcbClass,
            festivalWeight: f.weight,
            yearWeight: y.weight,
            parameterWeight: p.weight,
          })
  return out
}

export interface RankStability {
  ghatId: string
  baseRank: number
  bestRank: number
  worstRank: number
  /** How many scenarios put the ghat at each rank (index 0 = rank 1) */
  rankCounts: number[]
  scenarios: number
  timesTop3: number
  /** stable: rank moves by at most 1 place across all scenarios */
  stability: 'stable' | 'varies'
}

export function rankStability(readings: Reading[], limits: Limit[]): { scenarios: string[]; ghats: RankStability[]; ranksByScenario: Record<string, Record<string, number>> } {
  const configs = scenarios()
  const base = scoreGhats(readings, limits, DEFAULT_CONFIG)
  const ranksByScenario: Record<string, Record<string, number>> = {}
  for (const c of configs) ranksByScenario[c.id] = Object.fromEntries(scoreGhats(readings, limits, c).map((s) => [s.ghatId, s.rank]))

  const ghats = base.map((b) => {
    const ranks = configs.map((c) => ranksByScenario[c.id][b.ghatId])
    const rankCounts = base.map((_, i) => ranks.filter((r) => r === i + 1).length)
    const bestRank = Math.min(...ranks)
    const worstRank = Math.max(...ranks)
    return {
      ghatId: b.ghatId,
      baseRank: b.rank,
      bestRank,
      worstRank,
      rankCounts,
      scenarios: configs.length,
      timesTop3: ranks.filter((r) => r <= 3).length,
      stability: (worstRank - bestRank <= 1 ? 'stable' : 'varies') as RankStability['stability'],
    }
  })
  return { scenarios: configs.map((c) => c.id), ghats, ranksByScenario }
}
