// Data pipeline: official CSVs -> checked readings -> src/generated/data.json
//
// 1. Read every CSV and check every row against its schema.
// 2. Turn each Bhopal row into a reading with a receipt (printed value, report, page).
// 3. Compare each reading with the CPCB Class B limit.
// 4. Run the guards: facts from the problem statement the data must reproduce.
// 5. Fingerprint the source files so anyone can confirm what the output came from.
//
// Any failure stops the build with a non-zero exit code.

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import Papa from 'papaparse'
import { z } from 'zod'
import { GHATS, REPORTS, SLOTS_PER_GHAT } from '../src/core/constants'
import { runGuards } from '../src/core/guards'
import {
  BhopalRowSchema,
  CpcbRowSchema,
  coverageForGhat,
  limitsForClass,
  parseLimit,
  toReading,
} from '../src/core/readings'
import type { FileFingerprint } from '../src/core/types'

const FILES = {
  bhopal: 'data/bhopal_ghats_2023_2025.csv',
  cpcb: 'data/cpcb_water_quality_criteria.csv',
  statewide: 'data/mp_immersion_sites_2023_2025.csv',
}
const OUT_DIR = 'src/generated'
const OUT_FILE = `${OUT_DIR}/data.json`

const fail = (msg: string): never => {
  console.error(`\n✗ ${msg}\n`)
  process.exit(1)
}

function readCsv(file: string): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(readFileSync(file, 'utf8'), { header: true, skipEmptyLines: true })
  if (parsed.errors.length) fail(`${file}: ${parsed.errors.length} CSV parse errors, first: ${parsed.errors[0].message}`)
  return parsed.data
}

function validate<T>(file: string, rows: Record<string, string>[], schema: z.ZodType<T>): T[] {
  const out: T[] = []
  const errors: string[] = []
  rows.forEach((row, i) => {
    const r = schema.safeParse(row)
    if (r.success) out.push(r.data)
    else errors.push(`row ${i + 2}: ${r.error.issues.map((e) => `${e.path.join('.') || 'row'} ${e.message}`).join('; ')}`)
  })
  if (errors.length) fail(`${file}: ${errors.length} invalid rows\n  ${errors.slice(0, 10).join('\n  ')}`)
  return out
}

function fingerprint(file: string): FileFingerprint {
  const buf = readFileSync(file)
  return { file, sha256: createHash('sha256').update(buf).digest('hex'), bytes: buf.length }
}

// --- CPCB limits ---------------------------------------------------------
const limits = validate(FILES.cpcb, readCsv(FILES.cpcb), CpcbRowSchema).map(parseLimit)
const bathing = limitsForClass(limits, 'B')

// --- Bhopal readings -----------------------------------------------------
const readings = validate(FILES.bhopal, readCsv(FILES.bhopal), BhopalRowSchema).map((r) => toReading(r, bathing))

// --- Statewide file: structure check only (used as background in Phase 3) --
const StatewideRowSchema = z
  .object({
    year: z.enum(['2023', '2024', '2025']),
    festival: z.enum(['Ganesh', 'Durga']),
    regional_office: z.string(),
    phase: z.enum(['pre', 'during', 'after']),
    parameter: z.string().min(1),
    value: z.union([z.literal(''), z.string().regex(/^-?\d+(\.\d+)?$/)]),
    unit_assumed: z.string(),
    flag: z.enum(['', 'BDL', 'ND', 'not sampled', 'DRY', 'NA', 'na', '*', '**']),
    value_as_printed: z.string(),
    parameter_as_printed: z.string(),
    site_as_printed: z.string(),
    needs_check: z.enum(['', 'yes']),
    source_page: z.string().regex(/^\d+$/),
  })
  .refine((r) => (r.value === '') === (r.flag !== ''), 'a value must be present exactly when there is no flag')
const statewideRows = validate(FILES.statewide, readCsv(FILES.statewide), StatewideRowSchema)

// --- Guards --------------------------------------------------------------
const guards = runGuards(readings, limits)
console.log('\nData checks')
for (const g of guards) console.log(`  ${g.ok ? '✓' : '✗'} ${g.name}: ${g.actual}${g.ok ? '' : ` (expected ${g.expected})`}`)
const failed = guards.filter((g) => !g.ok)
if (failed.length) fail(`${failed.length} data check(s) failed. The data or the parsing changed; fix before building.`)

// --- Coverage ------------------------------------------------------------
const coverage = Object.fromEntries(GHATS.map((g) => [g.id, coverageForGhat(readings, g.id)]))
console.log('\nTests per ghat (of 18 year × festival × phase slots)')
for (const g of GHATS) {
  const slots = coverage[g.id]
  const tested = slots.filter((s) => s.status !== 'not-tested').length
  const partial = slots.filter((s) => s.status === 'partial').length
  console.log(`  ${g.name.padEnd(40)} ${tested}/${SLOTS_PER_GHAT}${partial ? `  (${partial} partial)` : ''}`)
}

// --- Fingerprint and output ----------------------------------------------
const files = [fingerprint(FILES.bhopal), fingerprint(FILES.cpcb), fingerprint(FILES.statewide)]
const combined = createHash('sha256').update(files.map((f) => f.sha256).join('')).digest('hex')

const output = {
  meta: {
    fingerprint: combined,
    files,
    counts: {
      readings: readings.length,
      statewideRows: statewideRows.length,
      statewideNeedsCheck: statewideRows.filter((r) => r.needs_check === 'yes').length,
    },
    reports: REPORTS,
    bathingClass: 'B',
  },
  guards,
  ghats: GHATS,
  limits,
  readings,
  coverage,
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_FILE, JSON.stringify(output))
console.log(`\n✓ ${readings.length} readings, ${guards.length} checks passed`)
console.log(`✓ Source fingerprint ${combined.slice(0, 16)}…`)
console.log(`✓ Wrote ${OUT_FILE}`)
