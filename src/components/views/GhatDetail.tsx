import { motion } from 'motion/react'
import { useState } from 'react'
import { PARAMETERS, type Parameter } from '../../core/constants'
import { SCORED_PARAMETERS } from '../../core/scoring'
import { displayStatus } from '../../core/status'
import { DATA, GHAT_BY_ID, READING_BY_ID, SCORE_BY_ID, STABILITY_BY_ID, STATEWIDE_BY_ID } from '../../data'
import { useLang } from '../../i18n'
import { ACTION_TEXT, reasonText } from '../../i18n/reasons'
import type { StringKey } from '../../i18n/strings'
import { ghatName, paramLabel, testLabel, valueLabel } from '../../lib/labels'
import { StatewideStrip, TrendMultiples } from '../charts/Detail'
import { OxygenStrip } from '../charts/Small'
import { Icon } from '../icons'
import { ACTION_ICON, ActionBadge, StabilityBadge, StatusChip, TierBadge } from '../ui/Badges'
import { CoverageBar } from '../ui/CoverageBar'
import { rise, stagger } from '../ui/motion'
import { Segmented } from '../ui/Tabs'
import { VerifyLink } from '../ui/VerifyLink'

/** Evidence order: the scored tests first, in score-weight order, then the rest. */
const ORDER: string[] = [...SCORED_PARAMETERS, ...PARAMETERS.filter((p) => !(SCORED_PARAMETERS as string[]).includes(p))]

function Block({ title, icon, children }: { title: string; icon: Parameters<typeof Icon>[0]['name']; children: React.ReactNode }) {
  return (
    <motion.section variants={rise} className="space-y-3">
      <h3 className="flex items-center gap-2 border-b-2 border-ink pb-1.5 text-lg font-extrabold">
        <Icon name={icon} size={18} />
        {title}
      </h3>
      {children}
    </motion.section>
  )
}

/** Everything behind one ghat's rank, every number linked to its report page. */
export function GhatDetail({ ghatId }: { ghatId: string }) {
  const { lang, t } = useLang()
  const g = GHAT_BY_ID.get(ghatId)!
  const s = SCORE_BY_ID.get(ghatId)!
  const stab = STABILITY_BY_ID.get(ghatId)!
  const cmp = STATEWIDE_BY_ID.get(ghatId)!
  const [trendParam, setTrendParam] = useState<Parameter>('Dissolved oxygen')
  const [scope, setScope] = useState<'scored' | 'all'>('scored')
  const action = ACTION_TEXT[lang][s.action]
  const weights = DATA.config.parameterWeight

  const evidence = DATA.readings
    .filter((r) => r.ghatId === ghatId && (scope === 'all' || (SCORED_PARAMETERS as string[]).includes(r.parameter)))
    .sort((a, b) => ORDER.indexOf(a.parameter) - ORDER.indexOf(b.parameter) || a.year - b.year || (a.festival === b.festival ? 0 : a.festival === 'Ganesh' ? -1 : 1))
  const limitText = (p: string) => (['Dissolved oxygen', 'BOD', 'pH'].includes(p) ? t(`param.limit.${p}` as StringKey).replace(/^[^:]+:\s*/, '') : t('dt.noLimit'))

  return (
    <motion.div initial="hidden" animate="show" variants={stagger(0.06)} className="space-y-9">
      {/* Summary */}
      <motion.div variants={rise} className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <TierBadge tier={s.tier} />
          <StabilityBadge best={stab.bestRank} worst={stab.worstRank} rank={stab.baseRank} n={stab.scenarios} />
          <span className="text-sm text-grey-700">{t('dt.waterBody', { body: lang === 'hi' ? g.waterBodyHi : g.waterBody })}</span>
          {g.confidence === 'medium' && (
            <span className="inline-flex items-center gap-1.5 border-2 border-dashed border-ink bg-orange-tint px-2 py-0.5 text-xs font-bold">
              <Icon name="info" size={14} />
              {t('gh.medium')}
            </span>
          )}
        </div>
        {g.note && <p className="border-l-4 border-orange bg-white px-3 py-2 text-sm">{lang === 'hi' ? g.noteHi : g.note}</p>}
        <div className="brut bg-white p-4">
          <p className="flex items-center gap-2 text-lg font-extrabold">
            <Icon name={ACTION_ICON[s.action]} size={22} />
            {action.title}
          </p>
          <p className="mt-1 text-[0.95rem] text-grey-800">{action.detail}</p>
          {s.alsoDo.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="eyebrow text-grey-600">{t('dt.also')}</span>
              {s.alsoDo.map((a) => (
                <ActionBadge key={a} action={a} detail />
              ))}
            </div>
          )}
        </div>
        <CoverageBar slots={DATA.coverage[ghatId]} />
      </motion.div>

      {/* Why */}
      <Block title={t('dt.why')} icon="receipt">
        <ul className="space-y-2.5">
          {s.reasons.map((r) => (
            <li key={r.code} className="border-2 border-ink bg-white p-3.5">
              <p className="font-medium">{reasonText(r, lang)}</p>
              {r.evidence.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {r.evidence.map((id) => {
                    const rd = READING_BY_ID.get(id)!
                    return (
                      <span key={id} className="inline-flex items-center gap-1 border border-grey-300 bg-grey-50 pl-1.5 text-xs">
                        <span className="nums font-bold">{rd.value ?? rd.printed}</span>
                        <span className="text-grey-600">
                          {rd.year} {t(`festival.${rd.festival}` as StringKey)} {t(`phase.short.${rd.phase}` as StringKey)}
                        </span>
                        <VerifyLink year={rd.year} page={rd.page} compact />
                      </span>
                    )
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Block>

      {/* Score, shown as a sum the officer can redo by hand */}
      <Block title={t('dt.score')} icon="layers">
        <div className="grid gap-3 sm:grid-cols-3">
          {s.parameters.map((p) => (
            <div key={p.parameter} className="border-2 border-ink bg-white p-3">
              <p className="eyebrow text-grey-700">
                {paramLabel(p.parameter, t)} × {Math.round(weights[p.parameter] * 100)}%
              </p>
              <p className="nums mt-1 text-3xl font-extrabold">{p.score?.toFixed(1) ?? '—'}</p>
              <p className="text-xs text-grey-700">{t('dt.score.param', { tested: p.tested, breaches: p.breaches })}</p>
            </div>
          ))}
        </div>
        <p className="nums border-2 border-ink bg-ink px-4 py-3 text-white">
          {s.parameters.map((p, i) => (
            <span key={p.parameter}>
              {i > 0 && ' + '}
              {weights[p.parameter]} × {p.score?.toFixed(1)}
            </span>
          ))}{' '}
          = <b className="text-orange">{s.score.toFixed(1)}</b>
          <span className="ml-3 text-xs text-grey-300">{t('dt.score.formula')}</span>
        </p>
      </Block>

      {/* Trend */}
      <Block title={t('dt.trend')} icon="trendDown">
        <Segmented<Parameter>
          label="Parameter"
          value={trendParam}
          onChange={setTrendParam}
          options={(['Dissolved oxygen', 'BOD', 'pH'] as Parameter[]).map((p) => ({ id: p, label: p === 'Dissolved oxygen' ? t('param.short.Dissolved oxygen') : paramLabel(p, t) }))}
        />
        <p className="text-sm font-semibold">{t(`pattern.${s.signals.pattern}` as StringKey)}</p>
        <TrendMultiples ghatId={ghatId} parameter={trendParam} />
      </Block>

      {/* Statewide */}
      <Block title={t('dt.statewide')} icon="globe">
        <p>{t('dt.statewide.text', { median: cmp.median, share: Math.round(cmp.worseThanShare * 100), n: DATA.statewide.summary.readings.toLocaleString('en-IN') })}</p>
        <StatewideStrip ghatId={ghatId} />
        <p className="text-xs text-grey-600">
          {t('dt.mpLine', { v: DATA.statewide.summary.median })} mg/l · {t('dt.statewide.note', { n: DATA.statewide.summary.readings.toLocaleString('en-IN') })}
        </p>
        <OxygenStrip ghatId={ghatId} width={300} />
      </Block>

      {/* Evidence table */}
      <Block title={t('dt.evidence')} icon="verify">
        <Segmented<'scored' | 'all'>
          label={t('dt.evidence')}
          value={scope}
          onChange={setScope}
          options={[
            { id: 'scored', label: t('dt.evidence.scored') },
            { id: 'all', label: t('dt.evidence.all') },
          ]}
        />
        <div className="max-h-[520px] overflow-auto border-2 border-ink bg-white" data-lenis-prevent>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-grey-100 text-left">
              <tr className="border-b-2 border-ink">
                <th className="px-3 py-2 eyebrow">{t('dt.col.test')}</th>
                <th className="px-3 py-2 eyebrow">{t('dt.col.parameter')}</th>
                <th className="px-3 py-2 text-right eyebrow">{t('dt.col.value')}</th>
                <th className="px-3 py-2 eyebrow">{t('dt.col.limit')}</th>
                <th className="px-3 py-2 eyebrow">{t('dt.col.status')}</th>
                <th className="px-3 py-2 eyebrow">{t('dt.col.source')}</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((r) => (
                <tr key={r.id} className="border-b border-grey-200 transition-colors duration-150 hover:bg-orange-tint">
                  <td className="px-3 py-1.5 whitespace-nowrap">{testLabel(r, t)}</td>
                  <td className="px-3 py-1.5">{paramLabel(r.parameter, t)}</td>
                  <td className="nums px-3 py-1.5 text-right font-bold whitespace-nowrap" title={t('dt.printed', { p: r.printed || '(blank)' })}>
                    {valueLabel(r)}
                  </td>
                  <td className="px-3 py-1.5 text-xs text-grey-700">{limitText(r.parameter)}</td>
                  <td className="px-3 py-1.5">
                    <StatusChip status={displayStatus(r)} compact withHint={false} />
                  </td>
                  <td className="px-3 py-1.5">
                    <VerifyLink year={r.year} page={r.page} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-grey-600">
          {ghatName(g, lang)} · {evidence.length} rows · {g.name !== ghatName(g, lang) ? g.name : ''}
        </p>
      </Block>
    </motion.div>
  )
}
