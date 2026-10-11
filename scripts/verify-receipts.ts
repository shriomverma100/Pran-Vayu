// Receipt check: open each MPPCB report PDF and confirm that, for every Bhopal
// reading, the cited page contains (a) the ghat's name and (b) the value exactly
// as printed. This proves every Verify link in the app lands on the right page.

import { readFileSync } from 'node:fs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { Reading } from '../src/core/types'

/** A word that appears in every printed variant of each ghat's name. */
export const GHAT_KEYWORDS: Record<string, RegExp> = {
  BAI: /hirdaram/i,
  KHA: /khatlapura/i,
  PRE: /prempura/i,
  RKP: /kamlapati/i,
  HAT: /hathaikheda/i,
  MAL: /maalikhedi/i,
  SHA: /shahpura/i,
}

export interface ReceiptFailure {
  id: string
  page: number
  printed: string
  problem: string
}

async function pageTexts(file: string, pages: number[]): Promise<Map<number, string>> {
  const task = getDocument({ data: new Uint8Array(readFileSync(file)), verbosity: 0 })
  const doc = await task.promise
  const out = new Map<number, string>()
  for (const n of pages) {
    const content = await (await doc.getPage(n)).getTextContent()
    out.set(n, content.items.map((i) => ('str' in i ? i.str : '')).join(' '))
  }
  await task.destroy()
  return out
}

/**
 * Differences between the participant-pack CSV and the PDF, found by this check.
 * Each is listed openly in the README instead of being silently ignored.
 */
export const KNOWN_DIFFERENCES: Record<string, { pdfShows: string; note: string }> = {
  '2025-G-BAI-after-PH': {
    pdfShows: '*',
    note: 'CSV has "**", the PDF prints "*". Both mean not sampled at that stage, so the reading is missing either way.',
  },
}

/** Readings whose printed value is blank or "_" have nothing to find on the page. */
const hasPrintedValue = (r: Reading) => r.printed !== '' && r.printed !== '_'

export async function verifyReceipts(readings: Reading[], reportFile: (year: number) => string) {
  const failures: ReceiptFailure[] = []
  let checked = 0
  for (const year of [...new Set(readings.map((r) => r.year))]) {
    const own = readings.filter((r) => r.year === year)
    const texts = await pageTexts(reportFile(year), [...new Set(own.map((r) => r.page))])
    for (const r of own) {
      const text = texts.get(r.page) ?? ''
      const tokens = new Set(text.split(/\s+/))
      if (!GHAT_KEYWORDS[r.ghatId].test(text)) failures.push({ id: r.id, page: r.page, printed: r.printed, problem: 'ghat name not on page' })
      if (hasPrintedValue(r)) {
        checked++
        const expected = KNOWN_DIFFERENCES[r.id]?.pdfShows ?? r.printed
        if (!tokens.has(expected)) failures.push({ id: r.id, page: r.page, printed: r.printed, problem: 'printed value not on page' })
      }
    }
  }
  return { checked, failures }
}

// Run directly: npm run verify
if (process.argv[1]?.endsWith('verify-receipts.ts')) {
  const data = JSON.parse(readFileSync('src/generated/data.json', 'utf8')) as { readings: Reading[] }
  const { checked, failures } = await verifyReceipts(data.readings, (y) => `public/reports/mppcb-visarjan-${y}.pdf`)
  console.log(`Checked ${checked} printed values and ${data.readings.length} page citations against the MPPCB PDFs`)
  if (failures.length) {
    console.error(`✗ ${failures.length} receipt problems`)
    for (const f of failures.slice(0, 30)) console.error(`  ${f.id} p${f.page} "${f.printed}": ${f.problem}`)
    process.exit(1)
  }
  console.log('✓ Every reading found on its cited page')
  for (const [id, d] of Object.entries(KNOWN_DIFFERENCES)) console.log(`  note ${id}: ${d.note}`)
}
