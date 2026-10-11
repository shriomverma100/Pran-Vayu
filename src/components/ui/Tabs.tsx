import { motion } from 'motion/react'
import { useId, useRef, type KeyboardEvent } from 'react'
import { Icon, type IconName } from '../icons'
import { SPRING_SNAPPY } from './motion'

export interface TabItem<T extends string> {
  id: T
  label: string
  icon?: IconName
  badge?: string | number
  /** Step number in the officer loop */
  step?: number
  /** Visual gap before this tab */
  gapBefore?: boolean
}

/**
 * Main navigation tabs. The active marker slides between tabs (shared layout
 * animation). Arrow keys move between tabs, as the WAI-ARIA tabs pattern expects.
 */
export function Tabs<T extends string>({ items, value, onChange, idPrefix }: { items: TabItem<T>[]; value: T; onChange: (id: T) => void; idPrefix: string }) {
  const layoutId = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKey = (e: KeyboardEvent, i: number) => {
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : null
    if (next === null) return
    e.preventDefault()
    const j = (next + items.length) % items.length
    refs.current[j]?.focus()
    onChange(items[j].id)
  }

  return (
    <div role="tablist" aria-label="Sections" className="flex gap-1 overflow-x-auto">
      {items.map((item, i) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`group relative flex shrink-0 items-center gap-2 px-4 py-3 text-[0.95rem] font-bold transition-colors duration-100 ${item.gapBefore ? 'ml-4 before:absolute before:-left-2.5 before:top-1/2 before:h-6 before:w-[2px] before:-translate-y-1/2 before:bg-grey-300' : ''} ${active ? 'text-ink' : 'text-grey-600 hover:text-ink'}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING_SNAPPY}
                className="absolute inset-0 -z-0 border-2 border-b-0 border-ink bg-white"
                style={{ borderRadius: 0 }}
              />
            )}
            {active && <motion.span layoutId={`${layoutId}-bar`} transition={SPRING_SNAPPY} className="absolute inset-x-0 -bottom-[2.5px] z-10 h-[5px] bg-orange" />}
            <span className="relative z-10 flex items-center gap-2">
              {item.step !== undefined ? (
                <span className={`nums grid h-6 w-6 place-items-center border-2 border-ink text-xs font-extrabold ${active ? 'bg-orange' : 'bg-white'}`}>{item.step}</span>
              ) : (
                item.icon && <Icon name={item.icon} size={18} className="transition-transform duration-150 group-hover:-translate-y-0.5" />
              )}
              {item.label}
              {item.badge !== undefined && (
                <span className={`ml-0.5 border-2 border-ink px-1.5 text-[0.7rem] leading-4 ${active ? 'bg-orange' : 'bg-grey-100'}`}>{item.badge}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Two- or three-way switch, e.g. English | हिंदी. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string }[]; value: T; onChange: (id: T) => void; label: string }) {
  const layoutId = useId()
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex border-2 border-ink bg-white p-0.5">
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={`relative px-2.5 py-1 text-sm font-bold transition-colors duration-200 ${active ? 'text-white' : 'text-ink hover:bg-grey-100'}`}
          >
            {active && <motion.span layoutId={layoutId} transition={SPRING_SNAPPY} className="absolute inset-0 bg-ink" />}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
