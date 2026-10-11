import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { allocate, type Allocation } from '../../core/allocator'
import { FESTIVALS, PARAMETERS, PHASES, type Parameter, type Phase } from '../../core/constants'
import { entriesToCsv, FIELD_UNITS, rescoreWithField, toFieldReading, upsertEntry, validateEntry, type FieldEntry } from '../../core/field'
import { limitsForClass } from '../../core/readings'
import { displayStatus } from '../../core/status'
import { DATA, GHAT_BY_ID, SCORE_BY_ID } from '../../data'
import { useLang } from '../../i18n'
import type { StringKey } from '../../i18n/strings'
import { ghatName, paramLabel } from '../../lib/labels'
import { useStoredState } from '../../lib/useStoredState'
import { Icon } from '../icons'
import { AllocationOrderDoc } from '../print/Docs'
import { PrintPage, usePrintDoc } from '../print/PrintDoc'
import { ACTION_ICON, StatusChip, TierBadge } from '../ui/Badges'
import { Button, IconButton } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { rise, SPRING_SNAPPY, stagger } from '../ui/motion'
import { Segmented } from '../ui/Tabs'

const LIMIT_TEXT: Partial<Record<Parameter, string>> = { 'Dissolved oxygen': '≥ 5', BOD: '≤ 3', pH: '6.5–8.5' }
const PHASE_ORDER: Phase[] = ['pre', 'during', 'after']

/** Latest non-missing reading of one test at one ghat, for the field sheet. */
function lastReading(ghatId: string, parameter: Parameter) {
  const key = (r: (typeof DATA.readings)[number]) => r.year * 100 + FESTIVALS.indexOf(r.festival) * 10 + PHASE_ORDER.indexOf(r.phase)
  return DATA.readings
    .filter((r) => r.ghatId === ghatId && r.parameter === parameter && r.kind !== 'missing')
    .sort((a, b) => key(b) - key(a))[0]
}

function Stepper({ label, value, onChange, icon }: { label: string; value: number; onChange: (n: number) => void; icon: 'aerator' | 'team' }) {
  return (
    <div className="flex items-center gap-4 border-[2.5px] border-ink bg-white p-3 shadow-brut">
      <span className="grid h-12 w-12 place-items-center border-2 border-ink bg-orange">
        <Icon name={icon} size={26} />
      </span>
      <span className="min-w-28 font-extrabold">{label}</span>
      <div className="ml-auto flex items-center gap-2">
        <IconButton icon="minus" label={`${label} −1`} onClick={() => onChange(Math.max(0, value - 1))} />
        <motion.span key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={SPRING_SNAPPY} className="nums w-10 text-center text-3xl font-extrabold">
          {value}
        </motion.span>
        <IconButton icon="plus" label={`${label} +1`} onClick={() => onChange(Math.min(10, value + 1))} />
      </div>
    </div>
  )
}

function AllocationLists({ plan }: { plan: Allocation }) {
  const { lang, t } = useLang()
  const names = (ids: string[]) => ids.map((id) => ghatName(GHAT_BY_ID.get(id)!, lang)).join(', ')
  const column = (kind: 'aer' | 'team') => {
    const items = kind === 'aer' ? plan.aerators : plan.teams
    return (
      <Card className="overflow-hidden">
        <CardHeader icon={kind === 'aer' ? 'aerator' : 'flask'} label={kind === 'aer' ? t('alloc.aerators') : t('alloc.teams')} tone="ink" right={<span className="nums font-extrabold">{items.length}</span>} />
        <LayoutGroup>
          <ul className="divide-y-2 divide-grey-200">
            <AnimatePresence initial={false}>
              {items.map((a) => {
                const g = GHAT_BY_ID.get(a.ghatId)!
                const s = SCORE_BY_ID.get(a.ghatId)!
                return (
                  <motion.li
                    layout
                    key={`${kind}-${a.unit}`}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
                    transition={SPRING_SNAPPY}
                    className="flex items-start gap-3 p-4"
                  >
                    <span className="nums grid h-9 min-w-9 place-items-center border-2 border-ink bg-orange px-1 text-sm font-extrabold">{a.unit}</span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-extrabold">
                        {ghatName(g, lang)}
                        <TierBadge tier={s.tier} size="sm" />
                        {a.nth > 1 && <span className="border-2 border-ink px-1.5 text-[0.7rem] font-bold">{t('alloc.second', { n: a.nth })}</span>}
                      </p>
                      <p className="mt-0.5 text-sm text-grey-800">{t(`${kind === 'aer' ? 'aer' : 'test'}.${a.reason}` as StringKey, a.values)}</p>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </LayoutGroup>
        {items.length === 0 && <p className="p-4 text-sm text-grey-600">{kind === 'aer' ? t('alloc.empty.aer') : t('alloc.empty.team')}</p>}
        {kind === 'aer' && plan.unservedAeration.length > 0 && (
          <p className="flex items-center gap-2 border-t-2 border-dashed border-ink bg-orange-tint p-3 text-sm font-bold">
            <Icon name="alert" size={16} />
            {t('alloc.unserved.aer', { list: names(plan.unservedAeration) })}
          </p>
        )}
        {kind === 'team' && plan.unservedTesting.length > 0 && (
          <p className="flex items-center gap-2 border-t-2 border-dashed border-ink bg-orange-tint p-3 text-sm font-bold">
            <Icon name="alert" size={16} />
            {t('alloc.unserved.test', { list: names(plan.unservedTesting) })}
          </p>
        )}
        <p className="border-t-2 border-grey-200 bg-grey-50 p-3 text-xs text-grey-700">{kind === 'aer' ? t('alloc.rule.aer') : t('alloc.rule.test')}</p>
      </Card>
    )
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {column('aer')}
      {column('team')}
    </div>
  )
}

/** One A4 field sheet per ghat with a sampling team. */
export function FieldSheetPages({ ghatIds, plan }: { ghatIds: string[]; plan: Allocation }) {
  const { lang, t } = useLang()
  return (
    <>
      {ghatIds.map((id, i) => {
        const g = GHAT_BY_ID.get(id)!
        const team = plan.teams.find((x) => x.ghatId === id)!
        return (
          <PrintPage key={id} title={`${t('sheet.title')} · ${ghatName(g, lang)}`} docRef={`PV-2026-FS-${id}`} page={i + 1} total={ghatIds.length}>
            <div className="space-y-3 text-[0.72rem]">
              <div className="border-2 border-ink bg-orange-tint p-2">
                <p className="font-extrabold">{t('sheet.why')}</p>
                <p>{t(`test.${team.reason}` as StringKey, team.values)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PHASES.map((p) => (
                  <p key={p} className="border-2 border-ink p-1.5 font-bold">
                    {t(`sheet.stage.${p}` as StringKey)}
                  </p>
                ))}
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-ink text-white">
                    <th className="border border-ink p-1 text-left">{t('sheet.col.test')}</th>
                    <th className="border border-ink p-1">{t('sheet.col.unit')}</th>
                    <th className="border border-ink p-1">{t('sheet.col.limit')}</th>
                    <th className="border border-ink p-1">{t('sheet.col.last')}</th>
                    {PHASES.map((p) => (
                      <th key={p} className="w-[19mm] border border-ink p-1">
                        {t(`phase.short.${p}` as StringKey)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PARAMETERS.map((p) => {
                    const last = lastReading(id, p)
                    return (
                      <tr key={p}>
                        <td className="border border-ink p-1 font-bold">{paramLabel(p, t)}</td>
                        <td className="border border-ink p-1 text-center">{FIELD_UNITS[p] || '—'}</td>
                        <td className="border border-ink p-1 text-center">{LIMIT_TEXT[p] ?? '—'}</td>
                        <td className="nums border border-ink p-1 text-center">
                          {last ? `${last.value ?? last.printed} (${last.year} ${t(`festival.${last.festival}` as StringKey)})` : '—'}
                        </td>
                        {PHASES.map((ph) => (
                          <td key={ph} className="h-[8.2mm] border border-ink" />
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="grid grid-cols-3 gap-2">
                {PHASES.map((p) => (
                  <div key={p} className="h-[13mm] border-2 border-dashed border-ink p-1 text-[0.62rem] text-grey-700">
                    {t(`phase.short.${p}` as StringKey)} · {t('sheet.sign')}
                  </div>
                ))}
              </div>
              <p className="text-[0.62rem] text-grey-700">{t('hon.missing')}</p>
            </div>
          </PrintPage>
        )
      })}
    </>
  )
}

export function FieldEntryPanel() {
  const { lang, t } = useLang()
  const [entries, setEntries] = useStoredState<FieldEntry[]>('pran-vayu:field-2026', [])
  const [ghatId, setGhatId] = useState(DATA.scores[0].ghatId)
  const [phase, setPhase] = useState<Phase>('during')
  const [parameter, setParameter] = useState<Parameter>('Dissolved oxygen')
  const [kind, setKind] = useState<'number' | 'bdl' | 'ns'>('number')
  const [value, setValue] = useState('')
  const [date, setDate] = useState('2026-10-20')
  const [error, setError] = useState<string | null>(null)
  const bathing = useMemo(() => limitsForClass(DATA.limits, 'B'), [])

  const add = () => {
    const e: FieldEntry = {
      ghatId,
      phase,
      parameter,
      value: kind === 'number' ? (value.trim() === '' ? NaN : Number(value)) : null,
      flag: kind === 'bdl' ? 'BDL' : kind === 'ns' ? 'not sampled' : '',
      date,
    }
    if (kind === 'number' && Number.isNaN(e.value)) e.value = null
    const err = validateEntry(kind === 'number' && e.value === null ? { ...e, value: -1 } : e)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setEntries((list) => upsertEntry(list, e))
    setValue('')
  }

  const exportCsv = () => {
    const blob = new Blob([entriesToCsv(entries)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'pran-vayu-durga-2026-field-readings.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const reranked = useMemo(() => (entries.length ? rescoreWithField(DATA.readings, DATA.limits, entries) : null), [entries])
  const field = 'h-11 w-full border-2 border-ink bg-white px-3 font-semibold outline-none focus-visible:outline-3 focus-visible:outline-orange'

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
      <Card className="overflow-hidden">
        <CardHeader icon="plus" label={t('entry.title')} tone="ink" />
        <div className="space-y-4 p-5">
          <p className="text-sm text-grey-700">{t('entry.lede')}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1 text-sm font-bold">
              <span>{t('entry.ghat')}</span>
              <select className={field} value={ghatId} onChange={(e) => setGhatId(e.target.value)}>
                {DATA.scores.map((s) => (
                  <option key={s.ghatId} value={s.ghatId}>
                    {s.rank}. {ghatName(GHAT_BY_ID.get(s.ghatId)!, lang)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-bold">
              <span>{t('entry.phase')}</span>
              <select className={field} value={phase} onChange={(e) => setPhase(e.target.value as Phase)}>
                {PHASES.map((p) => (
                  <option key={p} value={p}>
                    {t(`phase.${p}` as StringKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-bold">
              <span>{t('entry.parameter')}</span>
              <select className={field} value={parameter} onChange={(e) => setParameter(e.target.value as Parameter)}>
                {PARAMETERS.map((p) => (
                  <option key={p} value={p}>
                    {paramLabel(p, t)} {FIELD_UNITS[p] ? `(${FIELD_UNITS[p]})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-1 text-sm font-bold">
              <span>{t('entry.kind')}</span>
              <Segmented<'number' | 'bdl' | 'ns'>
                label={t('entry.kind')}
                value={kind}
                onChange={setKind}
                options={[
                  { id: 'number', label: t('entry.kind.number') },
                  { id: 'bdl', label: t('entry.kind.bdl') },
                  { id: 'ns', label: t('entry.kind.ns') },
                ]}
              />
            </div>
            <label className="space-y-1 text-sm font-bold">
              <span>{t('entry.value')}</span>
              <input
                className={`${field} nums disabled:bg-grey-100 disabled:text-grey-500`}
                inputMode="decimal"
                disabled={kind !== 'number'}
                value={kind === 'number' ? value : ''}
                onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder={FIELD_UNITS[parameter] || 'pH'}
              />
            </label>
            <label className="space-y-1 text-sm font-bold">
              <span>{t('entry.date')}</span>
              <input type="date" className={`${field} nums`} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="flex items-center gap-2 border-2 border-ink bg-orange-tint p-2 text-sm font-bold">
                <Icon name="alert" size={16} />
                {t(`entry.err.${error}` as StringKey)}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" icon="plus" onClick={add}>
              {t('entry.add')}
            </Button>
            <Button variant="paper" icon="download" onClick={exportCsv} disabled={!entries.length}>
              {t('entry.export')}
            </Button>
            <Button variant="ghost" icon="close" onClick={() => setEntries([])} disabled={!entries.length}>
              {t('entry.clear')}
            </Button>
          </div>

          <div className="border-2 border-ink">
            <p className="border-b-2 border-ink bg-grey-50 px-3 py-1.5 text-xs font-bold">{entries.length ? t('entry.count', { n: entries.length }) : t('entry.empty')}</p>
            <ul className="max-h-72 divide-y divide-grey-200 overflow-auto" data-lenis-prevent>
              <AnimatePresence initial={false}>
                {entries.map((e) => {
                  const r = toFieldReading(e, bathing)
                  return (
                    <motion.li key={`${e.ghatId}${e.phase}${e.parameter}`} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                      <span className="min-w-40 flex-1 font-bold">{ghatName(GHAT_BY_ID.get(e.ghatId)!, lang)}</span>
                      <span>{t(`phase.short.${e.phase}` as StringKey)}</span>
                      <span>{paramLabel(e.parameter, t)}</span>
                      <span className="nums font-extrabold">{e.flag || `${e.value} ${FIELD_UNITS[e.parameter]}`}</span>
                      <StatusChip status={displayStatus(r)} compact withHint={false} />
                      <IconButton icon="close" size={30} label={t('entry.remove')} onClick={() => setEntries((l) => l.filter((x) => x !== e))} />
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader icon="shuffle" label={t('entry.rerank.title')} tone="orange" />
        <div className="space-y-3 p-5">
          <p className="text-sm text-grey-700">{t('entry.rerank.lede')}</p>
          <LayoutGroup>
            <ol className="space-y-2">
              {(reranked ?? DATA.scores).map((s) => {
                const before = SCORE_BY_ID.get(s.ghatId)!
                const moved = before.rank - s.rank
                return (
                  <motion.li layout transition={SPRING_SNAPPY} key={s.ghatId} className="flex items-center gap-3 border-2 border-ink bg-white px-3 py-2">
                    <span className={`nums grid h-8 w-8 place-items-center border-2 border-ink text-sm font-extrabold ${s.tier === 'act-now' ? 'bg-ink text-white' : s.tier === 'high' ? 'bg-orange' : 'bg-orange-tint'}`}>{s.rank}</span>
                    <span className="flex-1 text-sm font-bold">{ghatName(GHAT_BY_ID.get(s.ghatId)!, lang)}</span>
                    <span className="nums text-sm font-extrabold">{s.score.toFixed(1)}</span>
                    <span className="nums w-24 text-right text-xs font-bold text-grey-700">
                      {reranked ? (moved === 0 ? t('entry.rerank.same') : `${before.rank} → ${s.rank} ${moved > 0 ? '▲' : '▼'}`) : ''}
                    </span>
                  </motion.li>
                )
              })}
            </ol>
          </LayoutGroup>
        </div>
      </Card>
    </div>
  )
}

/** Shared aerator and team counts: chosen in step 2, used by step 3 and the reports. */
export function usePlan() {
  const [aerators, setAerators] = useStoredState('pran-vayu:aerators', 3)
  const [teams, setTeams] = useStoredState('pran-vayu:teams', 2)
  const plan = useMemo(() => allocate(DATA.scores, aerators, teams), [aerators, teams])
  return { aerators, setAerators, teams, setTeams, plan }
}

/** Step header: the step number, what this screen does, and the one next step. */
export function StepHeader({ step, title, lede, next, onNext }: { step: number; title: string; lede: string; next?: string; onNext?: () => void }) {
  const { t } = useLang()
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        <span className="nums grid h-14 w-14 shrink-0 place-items-center border-[2.5px] border-ink bg-orange text-2xl font-extrabold shadow-brut-sm">{step}</span>
        <div className="max-w-3xl">
          <p className="eyebrow text-orange-deep">{t('plan.eyebrow')}</p>
          <h2 className="mt-0.5 text-[2rem] leading-tight font-extrabold tracking-tight">{title}</h2>
          <p className="mt-1.5 text-grey-700">{lede}</p>
        </div>
      </div>
      {next && onNext && (
        <Button variant="ink" iconRight="arrowRight" onClick={onNext}>
          {t('step.next', { step: next })}
        </Button>
      )}
    </div>
  )
}

/** ② Send teams: aerators and sampling teams to ghats, with the reason. */
export function SendTeams({ onNext }: { onNext: () => void }) {
  const { t } = useLang()
  const { aerators, setAerators, teams, setTeams, plan } = usePlan()
  const { print, node } = usePrintDoc()
  return (
    <motion.div initial="hidden" animate="show" variants={stagger()} className="space-y-8">
      <motion.div variants={rise}>
        <StepHeader step={2} title={t('step.2')} lede={t('step.2.lede')} next={t('step.3')} onNext={onNext} />
      </motion.div>
      <motion.div variants={rise} className="grid gap-4 md:grid-cols-2">
        <Stepper label={t('alloc.aerators')} value={aerators} onChange={setAerators} icon="aerator" />
        <Stepper label={t('alloc.teams')} value={teams} onChange={setTeams} icon="team" />
      </motion.div>
      <motion.div variants={rise}>
        <AllocationLists plan={plan} />
      </motion.div>
      <motion.div variants={rise} className="flex flex-wrap gap-3">
        <Button variant="primary" icon="print" disabled={!plan.aerators.length && !plan.teams.length} onClick={() => print(<AllocationOrderDoc plan={plan} aerators={aerators} teams={teams} />)}>
          {t('order.print')}
        </Button>
      </motion.div>
      {node}
    </motion.div>
  )
}

/** ③ Test on 20 October: field sampling sheets for the ghats with a team. */
export function TestDay({ onNext }: { onNext: () => void }) {
  const { lang, t } = useLang()
  const { plan } = usePlan()
  const sheetGhats = [...new Set(plan.teams.map((x) => x.ghatId))]
  const { print, node } = usePrintDoc()
  return (
    <motion.div initial="hidden" animate="show" variants={stagger()} className="space-y-8">
      <motion.div variants={rise}>
        <StepHeader step={3} title={t('step.3')} lede={t('step.3.lede')} next={t('step.4')} onNext={onNext} />
      </motion.div>
      <motion.div variants={rise}>
        <Button variant="primary" size="lg" icon="print" disabled={!sheetGhats.length} onClick={() => print(<FieldSheetPages ghatIds={sheetGhats} plan={plan} />)}>
          {t('sheet.print')}
        </Button>
      </motion.div>
      {sheetGhats.length === 0 ? (
        <Card tone="paper" className="p-5 text-grey-700">
          {t('sheet.none')}
        </Card>
      ) : (
        <motion.div variants={rise} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sheetGhats.map((id) => {
            const g = GHAT_BY_ID.get(id)!
            const s = SCORE_BY_ID.get(id)!
            const team = plan.teams.find((x) => x.ghatId === id)!
            return (
              <Card key={id} className="p-4">
                <p className="flex items-center gap-2 font-extrabold">
                  <Icon name={ACTION_ICON[s.action]} size={18} />
                  {ghatName(g, lang)}
                </p>
                <p className="mt-1 text-sm text-grey-800">{t(`test.${team.reason}` as StringKey, team.values)}</p>
                <ul className="mt-3 space-y-1 text-xs">
                  {PHASES.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <Icon name="calendar" size={14} />
                      {t(`sheet.stage.${p}` as StringKey)}
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })}
        </motion.div>
      )}
      <p className="text-sm text-grey-700">{t('sheet.lede')}</p>
      {node}
    </motion.div>
  )
}

/** ④ Update: enter the 20 October readings; the ranking updates. */
export function UpdateDay({ onNext }: { onNext: () => void }) {
  const { t } = useLang()
  return (
    <motion.div initial="hidden" animate="show" variants={stagger()} className="space-y-8">
      <motion.div variants={rise}>
        <StepHeader step={4} title={t('step.4')} lede={t('step.4.lede')} next={t('step.1')} onNext={onNext} />
      </motion.div>
      <motion.div variants={rise}>
        <FieldEntryPanel />
      </motion.div>
    </motion.div>
  )
}
