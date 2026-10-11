import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { useLang } from '../../i18n'

// Opening animation: प्राण-वायु is written in brush strokes.
//
// 1. A saffron headline stroke (the Devanagari शिरोरेखा) is drawn across the page.
// 2. The name is traced in white ink from left to right (stroke draw + pen reveal).
// 3. Ink floods the letters; ripples spread like water; one oxygen bubble rises.
// 4. The name flies into its exact place in the header and the dashboard appears.
//
// Text shaping is done by the browser with Yatra One, so every conjunct
// (प्रा, ण, यु) is formed exactly as in the rest of the platform.
// Plays once per session. Any click or key skips it. Reduced motion: no intro.

const SESSION_KEY = 'pran-vayu:intro-seen'
const EASE = [0.22, 1, 0.36, 1] as const

export function shouldPlayIntro() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (new URLSearchParams(window.location.search).has('nointro')) return false
  return window.sessionStorage.getItem(SESSION_KEY) !== '1'
}

interface IntroProps {
  /** The header's brand element; the name lands exactly on it */
  targetRef: RefObject<HTMLElement | null>
  onDone: () => void
}

type Stage = 'loading' | 'write' | 'fill' | 'fly'

export function IntroSplash({ targetRef, onDone }: IntroProps) {
  const { t } = useLang()
  const reduce = useReducedMotion()
  const [stage, setStage] = useState<Stage>('loading')
  const nameRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<SVGTextElement>(null)
  const finished = useRef(false)

  // Gentle parallax: the name follows the mouse a few pixels, springy.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const px = useSpring(useTransform(mx, (v) => v * 14), { stiffness: 120, damping: 20 })
  const py = useSpring(useTransform(my, (v) => v * 10), { stiffness: 120, damping: 20 })

  // Flight to the header
  const fx = useMotionValue(0)
  const fy = useMotionValue(0)
  const fs = useMotionValue(1)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    window.sessionStorage.setItem(SESSION_KEY, '1')
    onDone()
  }

  // Wait for the font so the first stroke is drawn with the real glyphs.
  useEffect(() => {
    let alive = true
    const ready = document.fonts.load('120px "Yatra One"', 'प्राण-वायु').catch(() => undefined)
    const timeout = new Promise((r) => setTimeout(r, 1500))
    Promise.race([ready, timeout]).then(() => alive && setStage('write'))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (stage === 'write') {
      const id = setTimeout(() => setStage('fill'), 2300)
      return () => clearTimeout(id)
    }
    if (stage === 'fill') {
      const id = setTimeout(() => setStage('fly'), 1000)
      return () => clearTimeout(id)
    }
    if (stage === 'fly') {
      // Measure the drawn letters and the header name; match their widths.
      const from = textRef.current?.getBoundingClientRect()
      const to = targetRef.current?.getBoundingClientRect()
      if (!from || !to || to.width === 0) {
        finish()
        return
      }
      const box = nameRef.current!.getBoundingClientRect()
      const scale = to.width / from.width
      // The box scales about its own centre; the text centre sits slightly off it.
      const offX = from.left + from.width / 2 - (box.left + box.width / 2)
      const offY = from.top + from.height / 2 - (box.top + box.height / 2)
      const dx = to.left + to.width / 2 - (box.left + box.width / 2) - offX * scale
      const dy = to.top + to.height / 2 - (box.top + box.height / 2) - offY * scale
      const opts = { duration: 0.85, ease: EASE }
      animate(fx, dx, opts)
      animate(fy, dy, opts)
      const c = animate(fs, scale, opts)
      c.then(finish)
      return () => c.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  // Skip on any key or click
  useEffect(() => {
    const skip = () => finish()
    window.addEventListener('keydown', skip)
    return () => window.removeEventListener('keydown', skip)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (reduce) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce])
  if (reduce) return null

  const writing = stage !== 'loading'
  const filled = stage === 'fill' || stage === 'fly'
  const flying = stage === 'fly'

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex cursor-default flex-col items-center justify-center overflow-hidden"
      onClick={finish}
      onMouseMove={(e) => {
        if (flying) return // freeze parallax so the measured flight stays exact
        mx.set(e.clientX / window.innerWidth - 0.5)
        my.set(e.clientY / window.innerHeight - 0.5)
      }}
      aria-label="प्राण-वायु"
      role="presentation"
    >
      {/* Ink backdrop with a faint dot grid; fades away as the name flies */}
      <motion.div
        className="absolute inset-0 bg-ink"
        style={{ backgroundImage: 'radial-gradient(#2E2E2C 0.9px, transparent 0.9px)', backgroundSize: '22px 22px' }}
        animate={{ opacity: flying ? 0 : 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: flying ? 0.15 : 0 }}
      />

      {/* Ripples: water spreading out from the letters */}
      {filled && !flying && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {[0, 0.35, 0.7].map((d) => (
            <motion.span
              key={d}
              className="absolute rounded-full border-2 border-orange/60"
              style={{ width: 220, height: 220 }}
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 4.2, opacity: 0 }}
              transition={{ duration: 1.8, delay: d, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}

      <motion.div style={{ x: px, y: py }} className="relative">
        <motion.div ref={nameRef} style={{ x: fx, y: fy, scale: fs }} className="relative origin-center">
          <svg viewBox="0 0 1000 300" className="block h-auto w-[min(86vw,980px)] overflow-visible" aria-hidden>
            <defs>
              <clipPath id="pv-pen">
                <motion.rect
                  x="0"
                  y="0"
                  height="300"
                  initial={{ width: 0 }}
                  animate={{ width: writing ? 1000 : 0 }}
                  transition={{ duration: 2.1, ease: [0.45, 0.05, 0.25, 1] }}
                />
              </clipPath>
            </defs>

            {/* शिरोरेखा: the headline stroke, drawn first */}
            <motion.line
              x1="70"
              x2="930"
              y1="118"
              y2="118"
              stroke="#EA6A0A"
              strokeWidth="5"
              strokeLinecap="square"
              initial={{ pathLength: 0, opacity: 1 }}
              animate={{ pathLength: writing ? 1 : 0, opacity: filled ? 0 : 1 }}
              transition={{ pathLength: { duration: 0.75, ease: EASE }, opacity: { duration: 0.5 } }}
            />

            <g clipPath="url(#pv-pen)">
              <motion.text
                ref={textRef}
                x="500"
                y="205"
                textAnchor="middle"
                fontFamily='"Yatra One", serif'
                fontSize="210"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeDasharray="2600"
                initial={{ strokeDashoffset: 2600, fillOpacity: 0, fill: '#FFFFFF' }}
                animate={{
                  strokeDashoffset: writing ? 0 : 2600,
                  fillOpacity: filled ? 1 : 0,
                  strokeOpacity: filled ? 0 : 1,
                  // White ink on the dark stage turns to black ink as it lands on the white header.
                  fill: flying ? '#111111' : '#FFFFFF',
                }}
                transition={{
                  strokeDashoffset: { duration: 2.2, ease: [0.4, 0.1, 0.2, 1] },
                  fillOpacity: { duration: 0.7, ease: EASE },
                  strokeOpacity: { duration: 0.7 },
                  fill: { duration: 0.6, ease: EASE, delay: 0.1 },
                }}
              >
                प्राण
                <tspan fill="#EA6A0A" stroke="#EA6A0A">-</tspan>
                वायु
              </motion.text>
            </g>
          </svg>

          {/* One oxygen bubble rising past the name */}
          {filled && !flying && (
            <motion.span
              className="absolute right-[9%] bottom-[18%] block h-4 w-4 rounded-full border-2 border-orange"
              initial={{ y: 0, opacity: 0, scale: 0.6 }}
              animate={{ y: -150, opacity: [0, 1, 1, 0], scale: 1 }}
              transition={{ duration: 1.3, ease: 'easeOut' }}
            />
          )}
        </motion.div>
      </motion.div>

      <motion.p
        className="relative mt-4 px-6 text-center text-lg font-semibold tracking-wide text-grey-300"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: filled && !flying ? 1 : 0, y: filled ? 0 : 12 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {t('intro.line')}
      </motion.p>

      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          finish()
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: flying ? 0 : 1 }}
        transition={{ delay: flying ? 0 : 0.6 }}
        whileHover={{ x: -2, y: -2, boxShadow: '4px 4px 0 0 #EA6A0A' }}
        whileTap={{ x: 2, y: 2, boxShadow: '0px 0px 0 0 #EA6A0A' }}
        className="absolute right-6 bottom-6 border-2 border-white px-3 py-1.5 text-sm font-bold text-white"
        style={{ boxShadow: '2px 2px 0 0 #EA6A0A' }}
      >
        {t('intro.skip')} →
      </motion.button>
    </motion.div>
  )
}
