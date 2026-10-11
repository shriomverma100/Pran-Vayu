import type { Transition, Variants } from 'motion/react'

// Motion language: instant response, short and light. Press feedback is pure
// CSS (transform only, see .press in index.css) so every click answers on the
// next frame. JS animation is kept for entrances and panels, and is short.

export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 700, damping: 40, mass: 0.6 }
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 400, damping: 36, mass: 0.8 }
export const SPRING_PANEL: Transition = { type: 'spring', stiffness: 520, damping: 44 }
export const EASE_OUT: Transition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] }

/** Children fade in almost together: content is readable from the first frame. */
export const stagger = (step = 0.02, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: Math.min(step, 0.025), delayChildren: delay } },
})
export const rise: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.16, ease: 'easeOut' } },
}
