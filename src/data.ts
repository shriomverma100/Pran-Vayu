// Typed access to the checked data written by scripts/build-data.ts.
// Nothing in the interface computes its own numbers from the CSVs: every
// figure on screen and in the PDFs comes from this one file.

import raw from './generated/data.json'
import type { GhatInfo, Year } from './core/constants'
import type { GuardResult } from './core/guards'
import type { RankStability } from './core/robustness'
import type { GhatScore, ScoringConfig } from './core/scoring'
import type { GhatComparison, StatewideSummary } from './core/statewide'
import type { FileFingerprint, Limit, Reading, SlotCoverage } from './core/types'

export interface AppData {
  meta: {
    fingerprint: string
    files: FileFingerprint[]
    counts: { readings: number; statewideRows: number; statewideNeedsCheck: number }
    reports: Record<Year, { file: string; title: string; url: string }>
    bathingClass: string
  }
  guards: GuardResult[]
  ghats: GhatInfo[]
  limits: Limit[]
  readings: Reading[]
  coverage: Record<string, SlotCoverage[]>
  config: ScoringConfig
  scores: GhatScore[]
  robustness: {
    options: {
      classes: { cpcbClass: string; label: string }[]
      festivals: { id: string; label: string }[]
      years: { id: string; label: string }[]
      parameters: { id: string; label: string }[]
    }
    scenarios: string[]
    ghats: RankStability[]
    ranksByScenario: Record<string, Record<string, number>>
  }
  statewide: { summary: StatewideSummary; ghats: GhatComparison[] }
}

export const DATA = raw as unknown as AppData

export const READING_BY_ID = new Map(DATA.readings.map((r) => [r.id, r]))
export const GHAT_BY_ID = new Map(DATA.ghats.map((g) => [g.id, g]))
export const SCORE_BY_ID = new Map(DATA.scores.map((s) => [s.ghatId, s]))
export const STABILITY_BY_ID = new Map(DATA.robustness.ghats.map((s) => [s.ghatId, s]))
export const STATEWIDE_BY_ID = new Map(DATA.statewide.ghats.map((s) => [s.ghatId, s]))

/** Link that opens the cited page of the MPPCB report. */
export function reportLink(year: Year, page: number) {
  return `${DATA.meta.reports[year].file}#page=${page}`
}
