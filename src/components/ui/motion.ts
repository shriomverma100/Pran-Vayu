import type { Transition } from 'motion/react'

// Motion language: quick, springy, never bouncy enough to distract.
// Every interactive element uses one of these, so the whole platform moves
// with one feel. Reduced-motion users get instant changes (MotionConfig).

export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 520, damping: 32, mass: 0.7 }
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }
export const SPRING_PANEL: Transition = { type: 'spring', stiffness: 320, damping: 36 }
export const EASE_OUT: Transition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] }

/** The brutalist press: lift on hover, sink into the shadow on press. */
export const pressable = (shadow = 4) => ({
  rest: { x: 0, y: 0, boxShadow: `${shadow}px ${shadow}px 0 0 #111111` },
  hover: { x: -2, y: -2, boxShadow: `${shadow + 2}px ${shadow + 2}px 0 0 #111111` },
  press: { x: shadow, y: shadow, boxShadow: '0px 0px 0 0 #111111' },
})

/** Children rise into place one after another. */
export const stagger = (step = 0.06, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
})
export const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: EASE_OUT },
}
