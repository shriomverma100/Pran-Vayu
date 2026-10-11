import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Width of an element, kept up to date with a ResizeObserver. `ready` stays
 * false until the real width is known, so charts never draw (and animate)
 * at a guessed width first.
 */
export function useMeasure<T extends HTMLElement>(initial = 800) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(initial)
  const [ready, setReady] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.getBoundingClientRect().width)
    setReady(true)
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width, ready] as const
}
