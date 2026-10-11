import { motion } from 'motion/react'
import { useMemo } from 'react'
import type { FieldEntry } from '../../core/field'
import { toFieldReading } from '../../core/field'
import { limitsForClass } from '../../core/readings'
import { displayStatus } from '../../core/status'
import { DATA, GHAT_BY_ID } from '../../data'
import { useLang } from '../../i18n'
import { ACTION_TEXT, reasonText } from '../../i18n/reasons'
import type { StringKey } from '../../i18n/strings'
import { ghatName, paramLabel } from '../../lib/labels'
import { useStoredState } from '../../lib/useStoredState'
import { Icon, type IconName } from '../icons'
import { ACTION_ICON, StatusChip } from '../ui/Badges'
import { rise, stagger } from '../ui/motion'

const TIER_TILE: Record<string, string> = { 'act-now': 'bg-ink text-white', high: 'bg-orange text-ink', moderate: 'bg-orange-tint text-ink' }
const LOOP: { step: number; key: StringKey; lede: StringKey; icon: IconName; tab: 'todo' | 'send' | 'test' | 'update' }[] = [
  { step: 1, key: 'step.1', lede: 'step.1.lede', icon: 'grid', tab: 'todo' },
  { step: 2, key: 'step.2', lede: 'step.2.lede', icon: 'aerator', tab: 'send' },
  { step: 3, key: 'step.3', lede: 'step.3.lede', icon: 'flask', tab: 'test' },
  { step: 4, key: 'step.4', lede: 'step.4.lede', icon: 'shuffle', tab: 'update' },
]

/**
 * ① What to do: the one screen an officer needs. Seven rows, each with the
 * action and the reason in plain words. Proof is one click away.
 * The "Today" column follows the UK bathing-water idea of a same-day status:
 * it appears once 20 October readings are entered.
 */
export function WhatToDo({ onOpen, onGo }: { onOpen: (ghatId: string) => void; onGo: (tab: 'todo' | 'send' | 'test' | 'update' | 'evidence') => void }) {
  const { lang, t } = useLang()
  const [entries] = useStoredState<FieldEntry[]>('pran-vayu:field-2026', [])
  const bathing = useMemo(() => limitsForClass(DATA.limits, 'B'), [])
  const today = useMemo(() => {
    const byGhat = new Map<string, ReturnType<typeof toFieldReading>[]>()
    for (const e of entries) byGhat.set(e.ghatId, [...(byGhat.get(e.ghatId) ?? []), toFieldReading(e, bathing)])
    return byGhat
  }, [entries, bathing])
  const tiers = {
    act: DATA.scores.filter((s) => s.tier === 'act-now').length,
    high: DATA.scores.filter((s) => s.tier === 'high').length,
    mod: DATA.scores.filter((s) => s.tier === 'moderate').length,
  }

  return (
    <motion.div initial="hidden" animate="show" variants={stagger()} className="space-y-8">
      <motion.div variants={rise} className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="eyebrow text-orange-deep">{t('ov.eyebrow')}</p>
          <h2 className="mt-1 text-[2.2rem] leading-tight font-extrabold tracking-tight">{t('todo.title')}</h2>
          <p className="mt-2 text-lg text-grey-800">{t('ov.summary', tiers)}</p>
        </div>
      </motion.div>

      {/* The loop: how to use the platform, in four steps */}
      <motion.ol variants={rise} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LOOP.map((l) => (
          <li key={l.step}>
            <button
              type="button"
              onClick={() => onGo(l.tab)}
              className={`press-sm flex h-full w-full items-start gap-3 border-2 border-ink p-3 text-left ${l.step === 1 ? 'bg-ink text-white' : 'bg-white'}`}
            >
              <span className={`nums grid h-9 w-9 shrink-0 place-items-center border-2 text-lg font-extrabold ${l.step === 1 ? 'border-white bg-orange text-ink' : 'border-ink bg-orange-tint'}`}>{l.step}</span>
              <span>
                <span className="flex items-center gap-1.5 font-extrabold">
                  <Icon name={l.icon} size={16} />
                  {t(l.key)}
                </span>
                <span className={`mt-0.5 block text-[0.82rem] leading-snug ${l.step === 1 ? 'text-grey-300' : 'text-grey-700'}`}>{t(l.lede)}</span>
              </span>
            </button>
          </li>
        ))}
      </motion.ol>

      {/* The action list */}
      <motion.ul variants={stagger()} className="space-y-3">
        {DATA.scores.map((s) => {
          const g = GHAT_BY_ID.get(s.ghatId)!
          const a = ACTION_TEXT[lang][s.action]
          const todays = today.get(s.ghatId) ?? []
          const latest = todays.filter((r) => ['Dissolved oxygen', 'BOD', 'pH'].includes(r.parameter))
          return (
            <motion.li key={s.ghatId} variants={rise}>
              <div
                onClick={() => onOpen(s.ghatId)}
                className="press grid cursor-pointer items-center gap-x-5 gap-y-3 border-[2.5px] border-ink bg-white p-4 md:grid-cols-[56px_minmax(200px,1fr)_minmax(260px,1.6fr)_auto]"
              >
                <span className={`nums grid h-14 w-14 place-items-center border-[2.5px] border-ink text-2xl font-extrabold ${TIER_TILE[s.tier]}`}>{s.rank}</span>
                <div>
                  <p className="text-lg leading-tight font-extrabold">{ghatName(g, lang)}</p>
                  <p className="text-sm text-grey-600">
                    {t(`tier.${s.tier}` as StringKey)} · {lang === 'hi' ? g.waterBodyHi : g.waterBody}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-2 text-[1.05rem] font-extrabold">
                    <Icon name={ACTION_ICON[s.action]} size={20} />
                    {a.title}
                  </p>
                  <p className="mt-0.5 text-[0.92rem] text-grey-800">{reasonText(s.reasons[0], lang)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {s.blindSpot.latestDurgaMissing && (
                      <span className="inline-flex items-center gap-1.5 border-2 border-ink bg-white text-[0.75rem] font-bold">
                        <span className="hatch block h-5 w-3 border-r-2 border-ink" />
                        <Icon name="flask" size={13} />
                        <span className="pr-2">{t('todo.blind')}</span>
                      </span>
                    )}
                    {latest.length > 0 && (
                      <span className="inline-flex flex-wrap items-center gap-1.5 border-2 border-ink bg-orange-tint px-2 py-0.5 text-[0.75rem] font-bold">
                        <Icon name="calendar" size={13} />
                        {t('todo.today')}:
                        {latest.slice(0, 3).map((r) => (
                          <span key={r.id} className="inline-flex items-center gap-1">
                            {r.parameter === 'Dissolved oxygen' ? t('param.short.Dissolved oxygen') : paramLabel(r.parameter, t)} {r.value ?? r.printed}
                            <StatusChip status={displayStatus(r)} compact withHint={false} />
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpen(s.ghatId)
                  }}
                  className="press-sm inline-flex items-center gap-1.5 justify-self-start border-2 border-ink bg-white px-3 py-2 text-sm font-bold md:justify-self-end"
                >
                  <Icon name="verify" size={16} />
                  {t('todo.proof')}
                </button>
              </div>
            </motion.li>
          )
        })}
      </motion.ul>

      <motion.p variants={rise} className="flex flex-wrap items-center gap-2 border-2 border-dashed border-ink bg-white px-4 py-3 text-[0.92rem]">
        <Icon name="info" size={16} />
        {t('todo.honest')}
        <button type="button" onClick={() => onGo('evidence')} className="font-bold text-orange-deep underline-offset-4 hover:underline">
          {t('hon.title')} →
        </button>
      </motion.p>
    </motion.div>
  )
}
