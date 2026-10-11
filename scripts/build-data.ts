// Phase 1 replaces this with the full pipeline: read CSVs, check every row,
// score the ghats and write src/generated/data.json.
import { existsSync } from 'node:fs'

const required = [
  'data/bhopal_ghats_2023_2025.csv',
  'data/cpcb_water_quality_criteria.csv',
  'data/mp_immersion_sites_2023_2025.csv',
]
const missing = required.filter((f) => !existsSync(f))
if (missing.length) {
  console.error('Missing data files:', missing.join(', '))
  process.exit(1)
}
console.log('Data files present.')
