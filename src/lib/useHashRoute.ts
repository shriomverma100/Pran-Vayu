import { useCallback, useEffect, useState } from 'react'

export const TABS = ['overview', 'ghats', 'plan', 'reports'] as const
export type TabId = (typeof TABS)[number]

export interface Route {
  tab: TabId | 'design' | 'print'
  /** Optional sub-path, e.g. #ghats/BAI opens one ghat */
  detail?: string
}

function parse(hash: string): Route {
  const [head, detail] = hash.replace(/^#\/?/, '').split('/')
  if (head === 'design') return { tab: 'design' }
  if (head === 'print') return { tab: 'print', detail: detail || undefined }
  const tab = (TABS as readonly string[]).includes(head) ? (head as TabId) : 'overview'
  return { tab, detail: detail || undefined }
}

/** Tabs live in the URL hash so links can be shared and the back button works. */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))
  useEffect(() => {
    const onHash = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const go = useCallback((tab: TabId, detail?: string) => {
    window.location.hash = detail ? `${tab}/${detail}` : tab
  }, [])
  return [route, go] as const
}
