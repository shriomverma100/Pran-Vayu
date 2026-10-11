import { motion } from 'motion/react'
import { forwardRef, useEffect, useState } from 'react'
import { VISARJAN_DATE } from '../../core/constants'
import { daysUntil } from '../../core/dates'
import { DATA } from '../../data'
import { useLang, type Lang } from '../../i18n'
import { Icon } from '../icons'
import { Emblems } from '../ui/Emblems'
import { SPRING_SNAPPY } from '../ui/motion'
import { Segmented } from '../ui/Tabs'
import { Tooltip } from '../ui/Tooltip'

// ---------------------------------------------------------------------------
// Utility bar, in the pattern of Indian government websites (GIGW):
// skip link · text size · language.
// ---------------------------------------------------------------------------

const TEXT_SIZES = [
  { id: 'sm', scale: '93.75%', key: 'text.smaller', label: 'A-' },
  { id: 'md', scale: '100%', key: 'text.default', label: 'A' },
  { id: 'lg', scale: '112.5%', key: 'text.larger', label: 'A+' },
] as const
type TextSize = (typeof TEXT_SIZES)[number]['id']
const TEXT_KEY = 'pran-vayu:text-size'

function useTextSize() {
  const [size, setSize] = useState<TextSize>(() => (window.localStorage.getItem(TEXT_KEY) as TextSize) || 'md')
  useEffect(() => {
    document.documentElement.style.fontSize = TEXT_SIZES.find((s) => s.id === size)!.scale
    window.localStorage.setItem(TEXT_KEY, size)
  }, [size])
  return [size, setSize] as const
}

export function UtilityBar() {
  const { lang, setLang, t } = useLang()
  const [size, setSize] = useTextSize()
  return (
    <div className="no-print bg-ink text-white">
      <a
        href="#main"
        onClick={(e) => {
          // Move focus to the content without changing the hash, which holds the current tab.
          e.preventDefault()
          const main = document.getElementById('main')
          main?.focus()
          main?.scrollIntoView({ block: 'start' })
        }}
        className="absolute left-3 top-2 z-[60] -translate-y-20 border-2 border-white bg-orange px-3 py-1.5 text-sm font-bold text-ink transition-transform focus:translate-y-0"
      >
        {t('ui.skip')}
      </a>
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-1.5 text-[0.8rem]">
        <p className="flex items-center gap-2 font-medium text-grey-300">
          <Icon name="pin" size={14} />
          {t('shell.for')}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1" role="group" aria-label={t('ui.textSize')}>
            {TEXT_SIZES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSize(s.id)}
                aria-pressed={size === s.id}
                aria-label={t(s.key)}
                title={t(s.key)}
                className={`min-w-7 border px-1.5 py-0.5 font-bold transition-colors duration-200 ${
                  size === s.id ? 'border-white bg-white text-ink' : 'border-grey-600 text-white hover:border-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <span className="h-4 w-px bg-grey-600" aria-hidden />
          <div className="[&_[role=radiogroup]]:border-white [&_[role=radiogroup]]:bg-ink [&_button]:text-white [&_button[aria-checked=true]]:text-ink [&_span.absolute]:bg-white">
            <Segmented<Lang> label={t('ui.language')} value={lang} onChange={setLang} options={[{ id: 'en', label: 'English' }, { id: 'hi', label: 'हिंदी' }]} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Countdown to Durga visarjan
// ---------------------------------------------------------------------------

export function Countdown() {
  const { t } = useLang()
  const days = daysUntil(VISARJAN_DATE)
  const label = days > 1 ? t('days.left') : days === 1 ? t('days.one') : days === 0 ? t('days.today') : t('days.past')
  return (
    <div className="flex items-stretch border-[2.5px] border-ink bg-white shadow-brut">
      <div className="grid place-items-center bg-orange px-3">
        <Icon name="hourglass" size={22} />
      </div>
      <div className="px-4 py-2">
        {days > 0 ? (
          <p className="flex items-baseline gap-2">
            <span className="text-[2rem] leading-none font-extrabold tracking-tight">{days}</span>
            <span className="text-sm font-bold">{label}</span>
          </p>
        ) : (
          <p className="text-base font-extrabold">{label}</p>
        )}
        <p className="mt-0.5 text-xs text-grey-700">{t('shell.visarjanDate')}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header: emblems · प्राण-वायु · tagline · countdown
// ---------------------------------------------------------------------------

/** The platform name. Always Devanagari, always Yatra One, in every language. */
export const BrandName = forwardRef<HTMLSpanElement, { className?: string; visible?: boolean }>(function BrandName({ className = '', visible = true }, ref) {
  return (
    <span ref={ref} className={`font-brand inline-block leading-none whitespace-nowrap ${className}`} style={{ opacity: visible ? 1 : 0 }}>
      प्राण<span className="text-orange">-</span>वायु
    </span>
  )
})

export const Header = forwardRef<HTMLSpanElement, { brandVisible: boolean }>(function Header({ brandVisible }, brandRef) {
  const { t } = useLang()
  return (
    <header className="border-b-[2.5px] border-ink bg-white/95">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-6 px-6 py-5">
        <div className="flex items-center gap-5">
          <Emblems height={52} />
          <span className="hidden h-12 w-[2.5px] bg-ink sm:block" aria-hidden />
          <div>
            <h1 className="m-0">
              <BrandName ref={brandRef} visible={brandVisible} className="text-[2.6rem] text-ink" />
              <span className="sr-only"> · {t('shell.tagline')}</span>
            </h1>
            <p className="mt-1.5 eyebrow text-grey-700" aria-hidden>
              {t('shell.tagline')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Tooltip content={t('footer.checks', { n: DATA.guards.length })}>
            <span className="hidden items-center gap-2 border-2 border-ink bg-paper px-3 py-2 text-xs font-bold lg:inline-flex">
              <Icon name="shield" size={16} />
              {t('shell.data')}
            </span>
          </Tooltip>
          <Countdown />
        </div>
      </div>
    </header>
  )
})

// ---------------------------------------------------------------------------
// Footer: credits, data source, fingerprint
// ---------------------------------------------------------------------------

export function Footer() {
  const { t } = useLang()
  const [copied, setCopied] = useState(false)
  return (
    <footer className="mt-20 border-t-[2.5px] border-ink bg-ink text-white">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-6 py-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <BrandName className="text-4xl text-white" />
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-grey-300">{t('footer.data')}</p>
          <p className="mt-4 text-sm font-bold">{t('footer.built')}</p>
          <p className="text-sm text-grey-400">{t('footer.licence')}</p>
          <p className="mt-1 text-xs text-grey-500">{t('footer.track')}</p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2 font-bold">
            <Icon name="shield" size={16} />
            {t('footer.checks', { n: DATA.guards.length })}
          </p>
          <div>
            <p className="eyebrow text-grey-400">{t('footer.fingerprint')}</p>
            <motion.button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(DATA.meta.fingerprint)
                setCopied(true)
                setTimeout(() => setCopied(false), 1600)
              }}
              whileHover={{ x: -1, y: -1 }}
              whileTap={{ x: 1, y: 1 }}
              transition={SPRING_SNAPPY}
              className="nums mt-1 block max-w-full break-all border border-grey-700 px-2 py-1 text-left text-xs text-grey-300 hover:border-white"
            >
              {DATA.meta.fingerprint}
              <span className="ml-2 font-bold text-orange">{copied ? t('ui.copied') : t('ui.copy')}</span>
            </motion.button>
          </div>
          <ul className="space-y-1 text-grey-300">
            {Object.values(DATA.meta.reports).map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 underline decoration-grey-600 underline-offset-4 hover:text-white hover:decoration-orange">
                  <Icon name="external" size={13} />
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
