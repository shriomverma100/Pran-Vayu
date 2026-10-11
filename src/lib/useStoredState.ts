import { useEffect, useState } from 'react'

const EVENT = 'pran-vayu:store'

/** Write a stored value from anywhere (e.g. the assistant); every screen using it updates. */
export function writeStored<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }))
}

function read<T>(key: string, initial: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : initial
  } catch {
    return initial
  }
}

/** State kept in localStorage, so it survives closing the page. Never leaves the browser. */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => read(key, initial))
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  useEffect(() => {
    const onStore = (e: Event) => {
      if ((e as CustomEvent<{ key: string }>).detail.key === key) setValue(read(key, initial))
    }
    window.addEventListener(EVENT, onStore)
    return () => window.removeEventListener(EVENT, onStore)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return [value, setValue] as const
}
