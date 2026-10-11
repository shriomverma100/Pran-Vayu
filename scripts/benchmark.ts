// Benchmark the production build in headless Chromium:  npm run bench
// Serves dist/ with vite preview, then measures first paint, largest paint,
// tab-switch and panel-open latency (click to next painted frame), and the
// gzipped size of the JavaScript and CSS the first screen loads.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { preview } from 'vite'

const server = await preview({ preview: { port: 5188, strictPort: true }, logLevel: 'error' })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })

await page.goto('http://localhost:5188/?nointro#todo', { waitUntil: 'networkidle' })
const paint = await page.evaluate(
  () =>
    new Promise<{ fcp: number; lcp: number; dcl: number }>((resolve) => {
      let lcp = 0
      new PerformanceObserver((l) => l.getEntries().forEach((e) => (lcp = Math.max(lcp, e.startTime)))).observe({ type: 'largest-contentful-paint', buffered: true })
      setTimeout(() => {
        const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        resolve({ fcp, lcp, dcl: nav.domContentLoadedEventEnd })
      }, 300)
    }),
)

/** Time from click to the next painted frame after the target appears. */
async function clickToPaint(selector: string, ready: string, runs = 5) {
  const times: number[] = []
  for (let i = 0; i < runs; i++) {
    // Plain JavaScript string: the measurement runs in the page as written.
    times.push(
      await page.evaluate(`new Promise((resolve) => {
        const t0 = performance.now()
        document.querySelector(${JSON.stringify(selector)}).click()
        function check() {
          if (document.querySelector(${JSON.stringify(ready)})) requestAnimationFrame(() => resolve(performance.now() - t0))
          else requestAnimationFrame(check)
        }
        check()
      })`),
    )
    await page.goto('http://localhost:5188/?nointro#todo', { waitUntil: 'networkidle' })
  }
  times.sort((a, b) => a - b)
  return times[Math.floor(times.length / 2)]
}

const tabSwitch = await clickToPaint('#pv-tab-send', '#pv-panel-send')
const evidence = await clickToPaint('#pv-tab-evidence', '#pv-panel-evidence')
const drawer = await clickToPaint('main li .press button', '[role=dialog]')

const assets = readdirSync('dist/assets')
const gz = (f: string) => gzipSync(readFileSync(`dist/assets/${f}`)).length / 1024
const firstJs = assets.filter((f) => /^index-.*\.js$/.test(f)).reduce((a, f) => a + gz(f), 0)
const css = assets.filter((f) => f.endsWith('.css')).reduce((a, f) => a + gz(f), 0)
const lazyJs = assets.filter((f) => f.endsWith('.js') && !/^index-/.test(f)).reduce((a, f) => a + gz(f), 0)
const pdfs = readdirSync('public/pdfs').reduce((a, f) => a + statSync(`public/pdfs/${f}`).size, 0) / 1024 / 1024

const rows = [
  ['First contentful paint', `${paint.fcp.toFixed(0)} ms`],
  ['Largest contentful paint', `${paint.lcp.toFixed(0)} ms`],
  ['DOM ready', `${paint.dcl.toFixed(0)} ms`],
  ['Tab switch (click → painted)', `${tabSwitch.toFixed(1)} ms`],
  ['Open Evidence tab (lazy, pre-fetched)', `${evidence.toFixed(1)} ms`],
  ['Open ghat proof panel', `${drawer.toFixed(1)} ms`],
  ['First-load JavaScript (gzip)', `${firstJs.toFixed(0)} kB`],
  ['Lazy JavaScript (gzip, fetched after first paint)', `${lazyJs.toFixed(0)} kB`],
  ['CSS (gzip)', `${css.toFixed(0)} kB`],
  ['Generated PDFs (5 files)', `${pdfs.toFixed(1)} MB`],
]
console.log('| Measure | Result |\n|---|---|\n' + rows.map(([a, b]) => `| ${a} | ${b} |`).join('\n'))
await browser.close()
await server.close()
