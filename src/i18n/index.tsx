import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { STRINGS, type StringKey } from './strings'

export type Lang = 'en' | 'hi'

const STORAGE_KEY = 'pran-vayu:lang'

/** English by default. ?lang=hi in the link wins, then the saved choice. */
function initialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (fromUrl === 'hi' || fromUrl === 'en') return fromUrl
  const saved = window.localStorage.getItem(STORAGE_KEY)
  return saved === 'hi' ? 'hi' : 'en'
}

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: StringKey, vars?: Record<string, string | number>) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function interpolate(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}

export function translate(lang: Lang, key: StringKey, vars?: Record<string, string | number>) {
  return interpolate(STRINGS[lang][key] ?? STRINGS.en[key] ?? key, vars)
}

export function LangProvider({ children, forceLang }: { children: ReactNode; forceLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => forceLang ?? initialLang())

  useEffect(() => {
    if (!forceLang) document.documentElement.lang = lang
  }, [lang, forceLang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    window.localStorage.setItem(STORAGE_KEY, l)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', l)
    window.history.replaceState(null, '', url)
  }, [])

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang],
  )
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}
