import type { Allocation } from '../../core/allocator'
import { FESTIVALS, PHASES, YEARS, type Parameter } from '../../core/constants'
import { VISARJAN_DATE } from '../../core/constants'
import { daysUntil } from '../../core/dates'
import { readingId } from '../../core/readings'
import { displayStatus } from '../../core/status'
import { DATA, GHAT_BY_ID, READING_BY_ID, SCORE_BY_ID, STABILITY_BY_ID, STATEWIDE_BY_ID } from '../../data'
import { LangProvider, useLang, type Lang } from '../../i18n'
import { ACTION_TEXT, reasonText } from '../../i18n/reasons'
import type { StringKey } from '../../i18n/strings'
import { ghatName, paramLabel, valueShort } from '../../lib/labels'
import { Icon } from '../icons'
import { ACTION_ICON, STATUS_STYLE } from '../ui/Badges'
import { HONESTY, METHOD } from '../views/Trust'
import { PrintPage } from './PrintDoc'

// Every printed document of the platform. Each page is a PrintPage, so all of
// them share one template. Numbers come only from the checked data.

const TIER_CELL: Record<string, string> = { 'act-now': 'bg-ink text-white', high: 'bg-orange', moderate: 'bg-orange-tint' }

function stabilityText(id: string, t: ReturnType<typeof useLang>['t']) {
  const s = STABILITY_BY_ID.get(id)!
  return s.bestRank === s.worstRank ? t('stability.always', { rank: s.baseRank, n: s.scenarios }) : t('stability.detail', { best: s.bestRank, worst: s.worstRank, n: s.scenarios })
}

// ---------------------------------------------------------------------------
// Visarjan risk brief: one page per language
// ---------------------------------------------------------------------------

function BriefBody() {
  const { lang, t } = useLang()
  const days = Math.max(0, daysUntil(VISARJAN_DATE))
  const doM = DATA.readings.filter((r) => r.parameter === 'Dissolved oxygen' && r.kind === 'measured')
  const tiers = {
    act: DATA.scores.filter((s) => s.tier === 'act-now').length,
    high: DATA.scores.filter((s) => s.tier === 'high').length,
    mod: DATA.scores.filter((s) => s.tier === 'moderate').length,
  }
  const blind = DATA.scores.filter((s) => s.blindSpot.latestDurgaMissing).map((s) => ghatName(GHAT_BY_ID.get(s.ghatId)!, lang))
  return (
    <div className="space-y-3 text-[0.74rem] leading-snug">
      <p className="font-bold">{t('brief.for', { days })}</p>
      <p className="text-grey-800">{t('brief.basis')}</p>
      <p className="flex items-center gap-2 border-2 border-ink bg-orange-tint px-2 py-1.5 font-extrabold">
        <Icon name="alert" size={14} />
        {t('ov.summary', tiers)}
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-ink text-left text-white">
            <th className="w-7 border border-ink p-1 text-center">{t('brief.col.rank')}</th>
            <th className="border border-ink p-1">{t('brief.col.ghat')}</th>
            <th className="border border-ink p-1">{t('brief.col.level')}</th>
            <th className="border border-ink p-1">{t('brief.col.action')}</th>
            <th className="border border-ink p-1">{t('brief.col.why')}</th>
            <th className="w-12 border border-ink p-1 text-center">{t('brief.col.tests')}</th>
          </tr>
        </thead>
        <tbody>
          {DATA.scores.map((s) => (
            <tr key={s.ghatId} className="align-top">
              <td className={`nums border border-ink p-1 text-center text-[0.9rem] font-extrabold ${TIER_CELL[s.tier]}`}>{s.rank}</td>
              <td className="border border-ink p-1 font-bold">{ghatName(GHAT_BY_ID.get(s.ghatId)!, lang)}</td>
              <td className="border border-ink p-1 whitespace-nowrap">
                {t(`tier.${s.tier}` as StringKey)} · <span className="nums">{s.score.toFixed(1)}</span>
              </td>
              <td className="border border-ink p-1 font-bold">
                <span className="inline-flex items-start gap-1">
                  <Icon name={ACTION_ICON[s.action]} size={12} className="mt-0.5 shrink-0" />
                  {ACTION_TEXT[lang][s.action].title}
                </span>
              </td>
              <td className="border border-ink p-1">{reasonText(s.reasons[0], lang)}</td>
              <td className="nums border border-ink p-1 text-center">
                {s.blindSpot.tested}/{s.blindSpot.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {blind.length > 0 && (
        <p className="hatch border-2 border-ink p-0">
          <span className="block bg-white/95 px-2 py-1.5 font-bold">
            <Icon name="flask" size={13} className="mr-1 inline" />
            {t('brief.blind', { list: blind.join(', ') })}
          </span>
        </p>
      )}
      <p>{t('brief.facts', { do: doM.filter((r) => (r.value as number) < 5).length, doN: doM.length })}</p>
      <div className="border-2 border-ink">
        <p className="border-b-2 border-ink bg-orange px-2 py-1 font-extrabold">{t('brief.limits')}</p>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 p-2">
          {(['hon.no-health', 'hon.missing', 'hon.durga25', 'hon.rkp', 'hon.ngt', 'hon.tool'] as StringKey[]).map((k) => (
            <li key={k} className="flex gap-1.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 bg-ink" />
              {t(k)}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[0.66rem] text-grey-700">{t('brief.verify')}</p>
    </div>
  )
}

export function BriefDoc({ langs = ['en', 'hi'] }: { langs?: Lang[] }) {
  return (
    <>
      {langs.map((l, i) => (
        <LangProvider key={l} forceLang={l}>
          <BriefPage page={i + 1} total={langs.length} />
        </LangProvider>
      ))}
    </>
  )
}

function BriefPage({ page, total }: { page: number; total: number }) {
  const { t } = useLang()
  return (
    <PrintPage title={t('brief.title')} docRef="PV-2026-BRIEF" page={page} total={total}>
      <BriefBody />
    </PrintPage>
  )
}

// ---------------------------------------------------------------------------
// Ghat reports: one page per ghat
// ---------------------------------------------------------------------------

const REPORT_PARAMS: Parameter[] = ['Dissolved oxygen', 'BOD', 'pH']
const CELL: Record<string, string> = {
  severe: 'bg-ink text-white',
  breach: 'bg-orange',
  within: 'bg-white',
  'not-tested': 'hatch',
  bdl: 'bg-grey-200',
  'no-limit': 'bg-white',
}

function GhatReportPage({ ghatId, page, total }: { ghatId: string; page: number; total: number }) {
  const { lang, t } = useLang()
  const g = GHAT_BY_ID.get(ghatId)!
  const s = SCORE_BY_ID.get(ghatId)!
  const cmp = STATEWIDE_BY_ID.get(ghatId)!
  const action = ACTION_TEXT[lang][s.action]
  const sources = (ids: string[]) => {
    const byYear = new Map<number, Set<number>>()
    for (const id of ids) {
      const r = READING_BY_ID.get(id)!
      byYear.set(r.year, (byYear.get(r.year) ?? new Set()).add(r.page))
    }
    return [...byYear.entries()].sort((a, b) => a[0] - b[0]).map(([y, ps]) => `${y} p.${[...ps].sort((a, b) => a - b).join(', ')}`).join(' · ')
  }
  return (
    <PrintPage title={t('report.title', { name: ghatName(g, lang) })} docRef={`PV-2026-GR-${ghatId}`} page={page} total={total}>
      <div className="space-y-3 text-[0.72rem] leading-snug">
        <div className="flex items-stretch gap-3">
          <div className={`grid w-16 shrink-0 place-items-center border-[2.5px] border-ink text-3xl font-extrabold ${TIER_CELL[s.tier]}`}>
            <span className="nums">{s.rank}</span>
          </div>
          <div className="flex-1 border-2 border-ink p-2">
            <p className="flex items-center gap-1.5 text-[0.9rem] font-extrabold">
              <Icon name={ACTION_ICON[s.action]} size={16} />
              {action.title}
            </p>
            <p>{action.detail}</p>
            <p className="mt-1 font-bold">
              {t('report.score', { score: s.score.toFixed(1), rank: s.rank, stability: stabilityText(ghatId, t) })} · {t(`tier.${s.tier}` as StringKey)} ·{' '}
              {t('coverage.label', { tested: s.blindSpot.tested, total: s.blindSpot.total })}
            </p>
            {g.note && <p className="mt-1 border-l-4 border-orange pl-2">{lang === 'hi' ? g.noteHi : g.note}</p>}
          </div>
        </div>

        <div>
          <p className="mb-1 font-extrabold">{t('dt.why')}</p>
          <ul className="space-y-1">
            {s.reasons.map((r) => (
              <li key={r.code} className="border-l-4 border-ink pl-2">
                {reasonText(r, lang)}
                {r.evidence.length > 0 && <span className="nums text-grey-700"> · {t('report.sources', { list: sources(r.evidence) })}</span>}
              </li>
            ))}
          </ul>
        </div>

        <p className="nums border-2 border-ink bg-ink px-2 py-1 text-white">
          {s.parameters.map((p, i) => `${i ? ' + ' : ''}${DATA.config.parameterWeight[p.parameter]} × ${p.score?.toFixed(1)} (${paramLabel(p.parameter, t)})`).join('')} ={' '}
          <b className="text-orange">{s.score.toFixed(1)}</b>
        </p>

        <div>
          <p className="mb-1 font-extrabold">{t('report.readings')}</p>
          <table className="w-full border-collapse text-center text-[0.62rem]">
            <thead>
              <tr>
                <th className="border border-ink bg-ink p-0.5 text-white" />
                {YEARS.map((y) => (
                  <th key={y} colSpan={6} className="border border-ink bg-ink p-0.5 text-white">
                    {y}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="border border-ink p-0.5" />
                {YEARS.flatMap((y) =>
                  FESTIVALS.map((f) => (
                    <th key={`${y}${f}`} colSpan={3} className="border border-ink bg-grey-100 p-0.5">
                      {t(`festival.${f}` as StringKey)}
                    </th>
                  )),
                )}
              </tr>
              <tr>
                <th className="border border-ink p-0.5" />
                {YEARS.flatMap((y) => FESTIVALS.flatMap((f) => PHASES.map((p) => <th key={`${y}${f}${p}`} className="border border-ink p-0.5 font-semibold">{t(`phase.short.${p}` as StringKey)}</th>)))}
              </tr>
            </thead>
            <tbody>
              {REPORT_PARAMS.map((p) => (
                <tr key={p}>
                  <td className="border border-ink p-0.5 text-left font-bold">{paramLabel(p, t)}</td>
                  {YEARS.flatMap((y) =>
                    FESTIVALS.flatMap((f) =>
                      PHASES.map((ph) => {
                        const r = READING_BY_ID.get(readingId(y, f, ghatId, ph, p))
                        const st = r ? displayStatus(r) : 'not-tested'
                        return (
                          <td key={`${y}${f}${ph}`} className={`nums border border-ink p-0.5 font-bold ${CELL[st]}`}>
                            <span className={st === 'not-tested' ? 'bg-white px-0.5' : ''}>{valueShort(r) || '—'}</span>
                          </td>
                        )
                      }),
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 flex flex-wrap gap-3 text-[0.6rem]">
            {(['severe', 'breach', 'within', 'not-tested', 'bdl'] as const).map((st) => (
              <span key={st} className="inline-flex items-center gap-1">
                <span className={`inline-block h-2.5 w-3.5 border border-ink ${CELL[st]}`} />
                {t(STATUS_STYLE[st].label)}
              </span>
            ))}
            <span>· {REPORT_PARAMS.map((p) => `${paramLabel(p, t)}: ${t(`param.limit.${p}` as StringKey)}`).join(' · ')}</span>
          </p>
        </div>

        <p>
          <b>{t('report.statewide')}:</b> {t('dt.statewide.text', { median: cmp.median, share: Math.round(cmp.worseThanShare * 100), n: DATA.statewide.summary.readings.toLocaleString('en-IN') })}
        </p>
        <p className="text-[0.62rem] text-grey-700">{t('hon.missing')}</p>
      </div>
    </PrintPage>
  )
}

export function GhatReportsDoc({ ghatIds }: { ghatIds?: string[] }) {
  const list = DATA.scores.filter((s) => !ghatIds || ghatIds.includes(s.ghatId))
  return (
    <>
      {list.map((s, i) => (
        <GhatReportPage key={s.ghatId} ghatId={s.ghatId} page={i + 1} total={list.length} />
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Method and limits
// ---------------------------------------------------------------------------

export function MethodDoc() {
  const { lang, t } = useLang()
  return (
    <>
      <PrintPage title={t('methoddoc.title')} docRef="PV-2026-METHOD" page={1} total={2}>
        <ol className="space-y-2 text-[0.8rem] leading-snug">
          {METHOD.map((k, i) => (
            <li key={k} className="flex gap-2.5 border-2 border-ink p-2">
              <span className="nums grid h-6 w-6 shrink-0 place-items-center border-2 border-ink bg-orange font-extrabold">{i + 1}</span>
              {t(k, { guards: DATA.guards.length })}
            </li>
          ))}
        </ol>
        <div className="mt-3 border-2 border-ink p-2 text-[0.68rem]">
          <p className="font-extrabold">{t('gh.stability.title')}</p>
          <ul className="nums mt-1 grid grid-cols-2 gap-x-4">
            {DATA.robustness.ghats.map((r) => (
              <li key={r.ghatId}>
                {r.baseRank}. {ghatName(GHAT_BY_ID.get(r.ghatId)!, lang)}: {stabilityText(r.ghatId, t)}
              </li>
            ))}
          </ul>
        </div>
      </PrintPage>
      <PrintPage title={t('hon.title')} docRef="PV-2026-METHOD" page={2} total={2}>
        <ul className="space-y-1.5 text-[0.78rem] leading-snug">
          {HONESTY.map((h) => (
            <li key={h.key} className="flex gap-2.5 border-b border-grey-300 pb-1.5">
              <Icon name={h.icon} size={15} className="mt-0.5 shrink-0" />
              {t(h.key)}
            </li>
          ))}
        </ul>
        <div className="mt-3 border-2 border-ink p-2 text-[0.66rem]">
          <p className="font-extrabold">{t('footer.checks', { n: DATA.guards.length })}</p>
          <ul className="nums mt-1 grid grid-cols-2 gap-x-4">
            {DATA.guards.map((g) => (
              <li key={g.name}>
                ✓ {g.name}: {g.actual}
              </li>
            ))}
          </ul>
          <p className="nums mt-1 break-all">SHA-256 {DATA.meta.fingerprint}</p>
        </div>
      </PrintPage>
    </>
  )
}

// ---------------------------------------------------------------------------
// Allocation order (from the Plan tab)
// ---------------------------------------------------------------------------

export function AllocationOrderDoc({ plan, aerators, teams }: { plan: Allocation; aerators: number; teams: number }) {
  const { lang, t } = useLang()
  const names = (ids: string[]) => ids.map((id) => ghatName(GHAT_BY_ID.get(id)!, lang)).join(', ')
  const list = (kind: 'aer' | 'team') => {
    const items = kind === 'aer' ? plan.aerators : plan.teams
    return (
      <div className="border-2 border-ink">
        <p className="flex items-center gap-2 border-b-2 border-ink bg-ink px-2 py-1 font-extrabold text-white">
          <Icon name={kind === 'aer' ? 'aerator' : 'flask'} size={14} />
          {kind === 'aer' ? t('alloc.aerators') : t('alloc.teams')} · {items.length}
        </p>
        <table className="w-full border-collapse text-[0.75rem]">
          <tbody>
            {items.map((a) => (
              <tr key={a.unit} className="align-top">
                <td className="nums w-16 border-b border-grey-300 p-1.5 font-extrabold">{kind === 'aer' ? t('alloc.aerator.unit', { n: a.unit }) : t('alloc.team.unit', { n: a.unit })}</td>
                <td className="border-b border-grey-300 p-1.5 font-bold">{ghatName(GHAT_BY_ID.get(a.ghatId)!, lang)}</td>
                <td className="border-b border-grey-300 p-1.5">{t(`${kind === 'aer' ? 'aer' : 'test'}.${a.reason}` as StringKey, a.values)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="bg-grey-50 p-1.5 text-[0.62rem] text-grey-700">{kind === 'aer' ? t('alloc.rule.aer') : t('alloc.rule.test')}</p>
      </div>
    )
  }
  return (
    <PrintPage title={t('order.title')} docRef="PV-2026-ORDER" page={1} total={1}>
      <div className="space-y-3 text-[0.75rem]">
        <p className="font-bold">
          {t('plan.eyebrow')} · {t('order.made', { a: aerators, t: teams })}
        </p>
        {list('aer')}
        {plan.unservedAeration.length > 0 && <p className="border-2 border-dashed border-ink bg-orange-tint p-1.5 font-bold">{t('alloc.unserved.aer', { list: names(plan.unservedAeration) })}</p>}
        {list('team')}
        {plan.unservedTesting.length > 0 && <p className="border-2 border-dashed border-ink bg-orange-tint p-1.5 font-bold">{t('alloc.unserved.test', { list: names(plan.unservedTesting) })}</p>}
        <p className="text-[0.62rem] text-grey-700">{t('hon.tool')}</p>
      </div>
    </PrintPage>
  )
}
