import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { Icon, type IconName } from '../icons'

type Tone = 'white' | 'paper' | 'ink' | 'orange' | 'tint'

const TONE: Record<Tone, string> = {
  white: 'bg-white text-ink',
  paper: 'bg-paper text-ink',
  ink: 'bg-ink text-white',
  orange: 'bg-orange text-ink',
  tint: 'bg-orange-tint text-ink',
}

interface CardProps extends Omit<HTMLMotionProps<'section'>, 'children' | 'title'> {
  tone?: Tone
  /** Lifts on hover and sinks on press, for cards that open something */
  interactive?: boolean
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  children?: ReactNode
}

const SHADOW = { none: 'shadow-none', sm: 'shadow-brut-sm', md: 'shadow-brut', lg: 'shadow-brut-lg' }

/** The brutalist frame. Static by default; `interactive` adds the press physics. */
export function Card({ tone = 'white', interactive, shadow = 'md', className = '', children, ...rest }: CardProps) {
  if (interactive) {
    return (
      <motion.section
        className={`press border-[2.5px] border-ink cursor-pointer ${TONE[tone]} ${className}`}
        {...rest}
      >
        {children}
      </motion.section>
    )
  }
  return (
    <motion.section className={`border-[2.5px] border-ink ${SHADOW[shadow]} ${TONE[tone]} ${className}`} {...rest}>
      {children}
    </motion.section>
  )
}

/** Header strip for a card: icon, small capitals label, optional right slot. */
export function CardHeader({ icon, label, right, tone = 'paper' }: { icon?: IconName; label: ReactNode; right?: ReactNode; tone?: 'paper' | 'ink' | 'orange' }) {
  const toneClass = tone === 'ink' ? 'bg-ink text-white' : tone === 'orange' ? 'bg-orange text-ink' : 'bg-grey-50 text-ink'
  return (
    <header className={`flex items-center justify-between gap-3 border-b-[2.5px] border-ink px-4 py-2.5 ${toneClass}`}>
      <div className="flex items-center gap-2 eyebrow">
        {icon && <Icon name={icon} size={16} />}
        <span>{label}</span>
      </div>
      {right}
    </header>
  )
}

/** Section title used across tabs. */
export function SectionTitle({ eyebrow, title, lede, right }: { eyebrow?: ReactNode; title: ReactNode; lede?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow text-orange-deep">{eyebrow}</p>}
        <h2 className="mt-1 text-[1.75rem] leading-tight font-extrabold tracking-tight">{title}</h2>
        {lede && <p className="mt-2 text-grey-700 leading-relaxed">{lede}</p>}
      </div>
      {right}
    </div>
  )
}
