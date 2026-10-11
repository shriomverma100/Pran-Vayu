import type { Festival, Parameter, Phase, Year } from './constants'

/**
 * How a reading's value must be treated.
 * - measured: a number printed in the report
 * - below-detection: BDL or ND. Very low, but not zero and not missing
 * - missing: not sampled (blank, _, -, *, **). Never counted as clean
 */
export type ValueKind = 'measured' | 'below-detection' | 'missing'

/** Result of comparing one reading with the CPCB Class B (outdoor bathing) limit. */
export type LimitResult = 'within' | 'breach' | 'no-limit' | 'not-tested'

export interface Reading {
  /** Stable ID, e.g. 2025-G-BAI-during-DO */
  id: string
  year: Year
  festival: Festival
  ghatId: string
  phase: Phase
  parameter: Parameter
  value: number | null
  unit: string
  kind: ValueKind
  /** Exactly as the report prints it: the receipt */
  printed: string
  parameterAsPrinted: string
  siteAsPrinted: string
  /** Page in that year's MPPCB report PDF */
  page: number
  limit: LimitResult
}

export type LimitType = 'min' | 'max' | 'range'

export interface Limit {
  cpcbClass: string
  bestUse: string
  /** Parameter name as used in the readings, or the CPCB name if the readings don't test it */
  parameter: string
  cpcbParameter: string
  type: LimitType
  min?: number
  max?: number
  unit: string
}

export interface FileFingerprint {
  file: string
  sha256: string
  bytes: number
}

export interface SlotCoverage {
  year: Year
  festival: Festival
  phase: Phase
  /** tested: at least one measured or BDL value. partial: some parameters missing */
  status: 'tested' | 'partial' | 'not-tested'
  /** Why it is missing, in plain words */
  reason?: 'no-table' | 'marked-not-sampled'
  measured: number
  missing: number
}
