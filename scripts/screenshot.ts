// Screenshot the built app with headless Chromium: npm run shot -- [hash] [out] [width]
// Used for visual checks during development and for README images.
import { createServer } from 'vite'
import { chromium } from 'playwright'

const [hash = '', out = 'screenshot.png', width = '1440', clip = ''] = process.argv.slice(2)
const server = await createServer({ server: { port: 5199 }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(process.env.H ?? 900) }, deviceScaleFactor: Number(process.env.DPR ?? 1), reducedMotion: 'reduce' })
const errors: string[] = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(`http://localhost:5199/${hash}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
if (clip) {
  const [x, y, w, h] = clip.split(',').map(Number)
  await page.screenshot({ path: out, fullPage: true, clip: { x, y, width: w, height: h } })
} else await page.screenshot({ path: out, fullPage: !process.env.H })
console.log(`saved ${out}`)
if (errors.length) console.log('page errors:\n  ' + errors.join('\n  '))
await browser.close()
await server.close()
