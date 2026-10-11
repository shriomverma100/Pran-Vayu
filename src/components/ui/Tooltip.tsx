import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SPRING_SNAPPY } from './motion'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  /** Render the trigger as a block instead of inline */
  block?: boolean
  className?: string
}

/**
 * Hover and keyboard-focus tooltip. Rendered in a portal with fixed
 * positioning so it is never clipped by scrolling tables or cards.
 * Tooltips add detail; they are never the only way to read a value.
 */
export function Tooltip({ content, children, block, className = '' }: TooltipProps) {
  const id = useId()
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean }>({ left: 0, top: 0, below: false })

  const place = useCallback(() => {
    const t = triggerRef.current?.getBoundingClientRect()
    const tip = tipRef.current?.getBoundingClientRect()
    if (!t) return
    const w = tip?.width ?? 240
    const h = tip?.height ?? 60
    const below = t.top - h - 12 < 8
    const left = Math.min(Math.max(8, t.left + t.width / 2 - w / 2), window.innerWidth - w - 8)
    setPos({ left, top: below ? t.bottom + 10 : t.top - h - 10, below })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    place()
    const onScroll = () => place()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, place])

  const Tag = block ? 'div' : 'span'
  return (
    <>
      <Tag
        ref={triggerRef as never}
        className={`${block ? 'block' : 'inline-flex'} ${className}`}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        {children}
      </Tag>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={tipRef}
              id={id}
              role="tooltip"
              initial={{ opacity: 0, y: pos.below ? -6 : 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: pos.below ? -4 : 4, scale: 0.98, transition: { duration: 0.12 } }}
              transition={SPRING_SNAPPY}
              onAnimationStart={place}
              style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 80 }}
              className="pointer-events-none max-w-[300px] border-2 border-ink bg-ink px-3 py-2 text-[0.82rem] leading-snug text-white shadow-brut-orange"
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
