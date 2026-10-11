import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../../i18n'
import { IconButton } from './Button'
import { SPRING_PANEL } from './motion'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: ReactNode
  children: ReactNode
  width?: number
}

/** Side panel for ghat detail. Esc closes; focus moves in and returns on close. */
export function Drawer({ open, onClose, title, eyebrow, children, width = 920 }: DrawerProps) {
  const { t } = useLang()
  const panelRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  // Keep the latest onClose without re-running the open/close effect on every render.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    const id = window.setTimeout(() => panelRef.current?.focus(), 60)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      window.clearTimeout(id)
      returnFocus.current?.focus?.()
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" data-lenis-prevent>
          <motion.div
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
            transition={SPRING_PANEL}
            style={{ width: `min(${width}px, 100vw)` }}
            className="absolute inset-y-0 right-0 flex flex-col border-l-[2.5px] border-ink bg-paper shadow-[-8px_0_0_0_#111111] outline-none"
          >
            <header className="flex items-start justify-between gap-4 border-b-[2.5px] border-ink bg-white px-6 py-4">
              <div>
                {eyebrow && <p className="eyebrow text-orange-deep">{eyebrow}</p>}
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{title}</h2>
              </div>
              <IconButton icon="close" label={t('ui.close')} onClick={onClose} />
            </header>
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
