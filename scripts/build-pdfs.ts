// Render the platform's documents to PDF with headless Chromium, using the
// same React templates as the screens. Chromium shapes Hindi correctly and
// embeds the fonts, so the PDFs match the platform exactly.
//
//   npm run pdf   → public/pdfs/*.pdf
//
// Run it after any change to the data or the templates.

import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const OUT = 'public/pdfs'
const JOBS = [
  { file: 'pran-vayu-brief-en-hi.pdf', hash: 'print/brief', lang: 'en' },
  { file: 'pran-vayu-ghat-reports-en.pdf', hash: 'print/ghats', lang: 'en' },
  { file: 'pran-vayu-ghat-reports-hi.pdf', hash: 'print/ghats', lang: 'hi' },
  { file: 'pran-vayu-method-en.pdf', hash: 'print/method', lang: 'en' },
  { file: 'pran-vayu-method-hi.pdf', hash: 'print/method', lang: 'hi' },
]

mkdirSync(OUT, { recursive: true })
const server = await createServer({ server: { port: 5195 }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch()

for (const job of JOBS) {
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`http://localhost:5195/?nointro&lang=${job.lang}#${job.hash}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('#print-ready', { state: 'attached' })
  await page.evaluate(() => document.fonts.ready)
  await page.emulateMedia({ media: 'print' })
  await page.pdf({ path: `${OUT}/${job.file}`, preferCSSPageSize: true, printBackground: true })
  const pages = await page.locator('.print-page').count()
  if (errors.length) {
    console.error(`✗ ${job.file}: ${errors.join('; ')}`)
    process.exitCode = 1
  } else console.log(`✓ ${job.file} (${pages} pages)`)
  await page.close()
}

await browser.close()
await server.close()
