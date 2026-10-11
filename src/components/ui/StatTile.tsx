import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { Icon, type IconName } from '../icons'

/** Counts up from 0 the first time it scrolls into view. */
export function CountUp({ value, decimals = 0, duration = 1.1 }: { value: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduce = useReducedMotion()
  const mv = useMotionValue(reduce ? value : 0)
  const text = useTransform(mv, (v) => v.toFixed(decimals))
  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] })
    return () => c.stop()
  }, [inView, reduce, value, duration, mv])
  return <motion.span ref={ref}>{text}</motion.span>
}

type Tone = 'white' | 'ink' | 'orange'
const TONE: Record<Tone, { box: string; sub: string }> = {
  white: { box: 'bg-white text-ink', sub: 'text-grey-700' },
  ink: { box: 'bg-ink text-white', sub: 'text-grey-300' },
  orange: { box: 'bg-orange text-ink', sub: 'text-ink/80' },
}

interface StatTileProps {
  icon?: IconName
  label: ReactNode
  value: number
  /** e.g. "/ 116" shown after the number */
  suffix?: ReactNode
  decimals?: number
  detail?: ReactNode
  tone?: Tone
  source?: ReactNode
}

/** Headline number. Proportional figures at display size (no tabular-nums). */
export function StatTile({ icon, label, value, suffix, decimals, detail, tone = 'white', source }: StatTileProps) {
  const s = TONE[tone]
  return (
    <div className={`flex h-full flex-col border-[2.5px] border-ink p-5 shadow-brut ${s.box}`}>
      <div className="flex items-center gap-2 eyebrow">
        {icon && <Icon name={icon} size={16} />}
        <span>{label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[3.25rem] leading-none font-extrabold tracking-tight">
          <CountUp value={value} decimals={decimals} />
        </span>
        {suffix && <span className="text-xl font-bold opacity-80">{suffix}</span>}
      </div>
      {detail && <p className={`mt-3 text-[0.92rem] leading-snug ${s.sub}`}>{detail}</p>}
      {source && <p className={`mt-auto pt-3 text-[0.72rem] ${s.sub}`}>{source}</p>}
    </div>
  )
}
