import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { useLang } from '../../i18n'

// Opening: minimal and quick (about 2.5 s), on the same paper as the platform.
// 1. प्राण-वायु is written in ink, left to right, as a pen would.
// 2. One saffron stroke draws under it; the tagline appears.
// 3. The name glides into its exact place in the header.
// Text shaping is done by the browser with Yatra One, so every conjunct is
// formed correctly. Plays once per session; any click or key skips it.

const SESSION_KEY = 'pran-vayu:intro-seen'
const EASE = [0.22, 1, 0.36, 1] as const

export function shouldPlayIntro() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (new URLSearchParams(window.location.search).has('nointro')) return false
  return window.sessionStorage.getItem(SESSION_KEY) !== '1'
}

type Stage = 'loading' | 'write' | 'fly'

export function IntroSplash({ targetRef, onDone }: { targetRef: RefObject<HTMLElement | null>; onDone: () => void }) {
  const { t } = useLang()
  const reduce = useReducedMotion()
  const [stage, setStage] = useState<Stage>('loading')
  const boxRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<SVGTextElement>(null)
  const finished = useRef(false)
  const fx = useMotionValue(0)
  const fy = useMotionValue(0)
  const fs = useMotionValue(1)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    window.sessionStorage.setItem(SESSION_KEY, '1')
    onDone()
  }

  useEffect(() => {
    if (reduce) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce])

  // Start once the brand font is ready, so the first stroke uses the real glyphs.
  useEffect(() => {
    let alive = true
    const ready = document.fonts.load('120px "Yatra One"', 'प्राण-वायु').catch(() => undefined)
    Promise.race([ready, new Promise((r) => setTimeout(r, 1200))]).then(() => alive && setStage('write'))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (stage === 'write') {
      const id = setTimeout(() => setStage('fly'), 1850)
      return () => clearTimeout(id)
    }
    if (stage === 'fly') {
      const from = textRef.current?.getBoundingClientRect()
      const to = targetRef.current?.getBoundingClientRect()
      const box = boxRef.current?.getBoundingClientRect()
      if (!from || !to || !box || to.width === 0) {
        finish()
        return
      }
      const scale = to.width / from.width
      const offX = from.left + from.width / 2 - (box.left + box.width / 2)
      const offY = from.top + from.height / 2 - (box.top + box.height / 2)
      const opts = { duration: 0.6, ease: EASE }
      animate(fx, to.left + to.width / 2 - (box.left + box.width / 2) - offX * scale, opts)
      animate(fy, to.top + to.height / 2 - (box.top + box.height / 2) - offY * scale, opts)
      const c = animate(fs, scale, opts)
      c.then(finish)
      return () => c.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  useEffect(() => {
    const skip = () => finish()
    window.addEventListener('keydown', skip)
    return () => window.removeEventListener('keydown', skip)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (reduce) return null
  const writing = stage !== 'loading'
  const flying = stage === 'fly'

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center" onClick={finish} role="presentation">
      <motion.div
        className="absolute inset-0 bg-paper"
        style={{ backgroundImage: 'radial-gradient(#D4D4D2 0.8px, transparent 0.8px)', backgroundSize: '22px 22px' }}
        animate={{ opacity: flying ? 0 : 1 }}
        transition={{ duration: 0.45, ease: EASE, delay: flying ? 0.12 : 0 }}
      />

      <motion.div ref={boxRef} style={{ x: fx, y: fy, scale: fs }} className="relative origin-center will-change-transform">
        <svg viewBox="0 0 1000 300" className="block h-auto w-[min(78vw,860px)] overflow-visible" aria-hidden>
          <defs>
            <clipPath id="pv-pen">
              <motion.rect x="0" y="0" height="300" initial={{ width: 0 }} animate={{ width: writing ? 1000 : 0 }} transition={{ duration: 1.15, ease: [0.5, 0.05, 0.2, 1] }} />
            </clipPath>
          </defs>
          <g clipPath="url(#pv-pen)">
            <motion.text
              ref={textRef}
              x="500"
              y="200"
              textAnchor="middle"
              fontFamily='"Yatra One", serif'
              fontSize="200"
              fill="#111111"
              stroke="#111111"
              strokeWidth="1.6"
              strokeDasharray="2400"
              initial={{ strokeDashoffset: 2400, fillOpacity: 0 }}
              animate={{ strokeDashoffset: writing ? 0 : 2400, fillOpacity: writing ? 1 : 0 }}
              transition={{ strokeDashoffset: { duration: 1.1, ease: [0.4, 0.1, 0.2, 1] }, fillOpacity: { duration: 0.45, delay: 0.75, ease: 'easeOut' } }}
            >
              प्राण
              <tspan fill="#EA6A0A" stroke="#EA6A0A">-</tspan>
              वायु
            </motion.text>
          </g>
        </svg>
      </motion.div>

      <motion.span
        aria-hidden
        className="relative mt-1 block h-[4px] w-[min(40vw,340px)] origin-left bg-orange"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: writing && !flying ? 1 : 0, opacity: flying ? 0 : 1 }}
        transition={{ scaleX: { duration: 0.55, delay: 0.7, ease: EASE }, opacity: { duration: 0.2 } }}
      />
      <motion.p
        className="relative mt-4 eyebrow text-grey-700"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: writing && !flying ? 1 : 0, y: writing ? 0 : 6 }}
        transition={{ duration: 0.35, delay: flying ? 0 : 1.0, ease: EASE }}
      >
        {t('shell.tagline')}
      </motion.p>

      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          finish()
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: flying ? 0 : 1 }}
        transition={{ delay: flying ? 0 : 0.5, duration: 0.2 }}
        className="absolute right-6 bottom-6 text-sm font-semibold text-grey-600 underline-offset-4 hover:text-ink hover:underline"
      >
        {t('intro.skip')} →
      </motion.button>
    </div>
  )
}
