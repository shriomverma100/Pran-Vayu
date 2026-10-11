import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SPRING_SNAPPY } from '../ui/motion'

interface TipState {
  x: number
  y: number
  content: ReactNode
}

/**
 * Tooltip for SVG chart marks. Each mark calls bind(content) to get hover and
 * focus handlers; the tip is placed above the mark in a portal. Tooltips add
 * detail only: every value is also in the evidence table.
 */
export function useChartTip() {
  const [tip, setTip] = useState<TipState | null>(null)
  const show = useCallback((el: Element, content: ReactNode) => {
    const r = el.getBoundingClientRect()
    setTip({ x: r.left + r.width / 2, y: r.top, content })
  }, [])
  const hide = useCallback(() => setTip(null), [])
  const bind = useCallback(
    (content: ReactNode) => ({
      onMouseEnter: (e: MouseEvent<Element>) => show(e.currentTarget, content),
      onMouseLeave: hide,
      onFocus: (e: FocusEvent<Element>) => show(e.currentTarget, content),
      onBlur: hide,
      tabIndex: 0,
    }),
    [show, hide],
  )
  const node = createPortal(
    <AnimatePresence>
      {tip && (
        <motion.div
          key={`${Math.round(tip.x)}-${Math.round(tip.y)}`}
          role="tooltip"
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={SPRING_SNAPPY}
          style={{ position: 'fixed', left: Math.min(Math.max(tip.x, 160), window.innerWidth - 160), top: tip.y - 10, translateX: '-50%', translateY: '-100%', zIndex: 80 }}
          className="pointer-events-none w-max max-w-[300px] border-2 border-ink bg-ink px-3 py-2 text-[0.82rem] leading-snug text-white shadow-brut-orange"
        >
          {tip.content}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
  return { bind, node }
}
