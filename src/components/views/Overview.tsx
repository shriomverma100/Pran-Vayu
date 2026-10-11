import { motion } from 'motion/react'
import { VISARJAN_DATE } from '../../core/constants'
import { daysUntil } from '../../core/dates'
import { DATA, GHAT_BY_ID, STABILITY_BY_ID } from '../../data'
import { useLang } from '../../i18n'
import { ACTION_TEXT, reasonText } from '../../i18n/reasons'
import type { StringKey } from '../../i18n/strings'
import { ghatName } from '../../lib/labels'
import { Dumbbell } from '../charts/Dumbbell'
import { Matrix } from '../charts/Matrix'
import { Icon } from '../icons'
import { ACTION_ICON, StabilityBadge, TierBadge } from '../ui/Badges'
import { Card, CardHeader, SectionTitle } from '../ui/Card'
import { CoverageBar } from '../ui/CoverageBar'
import { rise, stagger } from '../ui/motion'
import { StatTile } from '../ui/StatTile'
import { HonestyBox } from './Trust'

export function Overview({ onOpen }: { onOpen: (ghatId: string) => void }) {
  const { lang, t } = useLang()
  const days = Math.max(0, daysUntil(VISARJAN_DATE))
  const doM = DATA.readings.filter((r) => r.parameter === 'Dissolved oxygen' && r.kind === 'measured')
  const bodM = DATA.readings.filter((r) => r.parameter === 'BOD' && r.kind === 'measured')
  const zero = doM.filter((r) => r.value === 0).length
  const tiers = { act: DATA.scores.filter((s) => s.tier === 'act-now').length, high: DATA.scores.filter((s) => s.tier === 'high').length, mod: DATA.scores.filter((s) => s.tier === 'moderate').length }
  const top = DATA.scores.slice(0, 3)
  const blind = DATA.scores.filter((s) => s.blindSpot.latestDurgaMissing || s.blindSpot.tested < s.blindSpot.total)

  return (
    <motion.div initial="hidden" animate="show" variants={stagger(0.08)} className="space-y-14">
      <motion.div variants={rise}>
        <SectionTitle eyebrow={t('ov.eyebrow')} title={<span className="text-[2.1rem]">{t('ov.title')}</span>} lede={t('ov.lede')} />
        <p className="mt-4 inline-flex items-center gap-2 border-2 border-ink bg-orange-tint px-3 py-2 font-bold">
          <Icon name="alert" size={18} />
          {t('ov.summary', tiers)}
        </p>
      </motion.div>

      {/* Headline numbers */}
      <motion.div variants={rise} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile tone="ink" icon="hourglass" label={t('ov.kpi.days')} value={days} suffix={days === 1 ? t('days.one') : t('days.left')} detail={t('shell.visarjanDate')} />
        <StatTile tone="orange" icon="oxygen" label={t('ov.kpi.zero')} value={zero} suffix={t('ov.kpi.zero.unit')} detail={t('ov.kpi.zero.detail')} source={t('ov.kpi.source')} />
        <StatTile icon="drop" label={t('ov.kpi.do')} value={doM.filter((r) => (r.value as number) < 5).length} suffix={`/ ${doM.length}`} detail={t('ov.kpi.do.detail')} source={t('ov.kpi.source')} />
        <StatTile icon="layers" label={t('ov.kpi.bod')} value={bodM.filter((r) => (r.value as number) > 3).length} suffix={`/ ${bodM.length}`} detail={t('ov.kpi.bod.detail')} source={t('ov.kpi.source')} />
      </motion.div>

      {/* Act first */}
      <motion.section variants={rise} className="space-y-5">
        <SectionTitle title={t('ov.act.title')} lede={t('ov.act.lede')} />
        <div className="grid gap-6 lg:grid-cols-3">
          {top.map((s) => {
            const g = GHAT_BY_ID.get(s.ghatId)!
            const stab = STABILITY_BY_ID.get(s.ghatId)!
            const a = ACTION_TEXT[lang][s.action]
            return (
              <Card key={s.ghatId} interactive onClick={() => onOpen(s.ghatId)} className="flex flex-col">
                <CardHeader
                  tone={s.tier === 'act-now' ? 'ink' : 'orange'}
                  icon={s.tier === 'act-now' ? 'alert' : 'exclaim'}
                  label={`#${s.rank} · ${t(`tier.${s.tier}` as StringKey)}`}
                  right={<span className="nums text-sm font-extrabold">{s.score.toFixed(1)}</span>}
                />
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <h3 className="text-xl leading-tight font-extrabold">{ghatName(g, lang)}</h3>
                    <p className="mt-0.5 text-sm text-grey-600">{lang === 'hi' ? g.waterBodyHi : g.waterBody}</p>
                  </div>
                  <div className="border-2 border-ink bg-orange-tint p-3">
                    <p className="flex items-center gap-2 font-extrabold">
                      <Icon name={ACTION_ICON[s.action]} size={20} />
                      {a.title}
                    </p>
                    <p className="mt-1 text-sm text-grey-800">{a.detail}</p>
                  </div>
                  <ul className="space-y-1.5 text-[0.92rem]">
                    {s.reasons.slice(0, 3).map((r) => (
                      <li key={r.code} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-orange" />
                        {reasonText(r, lang)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto space-y-3 border-t-2 border-dashed border-grey-300 pt-3">
                    <CoverageBar slots={DATA.coverage[s.ghatId]} size="sm" />
                    <div className="flex items-center justify-between">
                      <StabilityBadge best={stab.bestRank} worst={stab.worstRank} rank={stab.baseRank} n={stab.scenarios} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpen(s.ghatId)
                        }}
                        className="inline-flex items-center gap-1 text-sm font-bold text-orange-deep underline-offset-4 hover:underline"
                      >
                        {t('ov.open')} <Icon name="arrowRight" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </motion.section>

      {/* Blind spots */}
      <motion.section variants={rise}>
        <Card tone="white" className="overflow-hidden">
          <CardHeader icon="flask" label={t('ov.blind.title')} tone="ink" />
          <div className="grid gap-0 md:grid-cols-[1fr_1.6fr]">
            <p className="border-b-2 border-ink p-5 text-[0.95rem] md:border-r-2 md:border-b-0">{t('ov.blind.lede')}</p>
            <ul className="divide-y-2 divide-grey-200">
              {blind.length === 0 && <li className="p-5">{t('ov.blind.none')}</li>}
              {blind.map((s) => {
                const g = GHAT_BY_ID.get(s.ghatId)!
                const missing = s.blindSpot.missingSlots.map((m) => `${m.year} ${t(`festival.${m.festival}` as StringKey)} ${t(`phase.short.${m.phase}` as StringKey)}`)
                return (
                  <li key={s.ghatId}>
                    <div onClick={() => onOpen(s.ghatId)} className="group flex w-full cursor-pointer flex-wrap items-center gap-4 p-4 text-left transition-colors hover:bg-orange-tint">
                      <span className="hatch grid h-10 w-10 shrink-0 place-items-center border-2 border-ink">
                        <span className="bg-white p-0.5">
                          <Icon name="flask" size={18} />
                        </span>
                      </span>
                      <span className="min-w-48 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpen(s.ghatId)
                          }}
                          className="block text-left font-extrabold underline-offset-4 hover:underline"
                        >
                          {ghatName(g, lang)}
                        </button>
                        <span className="block text-sm text-grey-700">{t('ov.blind.missing', { list: missing.join(' · ') })}</span>
                      </span>
                      <CoverageBar slots={DATA.coverage[s.ghatId]} size="sm" />
                      <TierBadge tier={s.tier} size="sm" />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </Card>
      </motion.section>

      {/* Matrix */}
      <motion.section variants={rise} className="space-y-5">
        <SectionTitle title={t('ov.matrix.title')} lede={t('ov.matrix.lede')} />
        <Card className="p-5">
          <Matrix onOpen={onOpen} />
        </Card>
      </motion.section>

      {/* Dumbbell */}
      <motion.section variants={rise} className="space-y-5">
        <SectionTitle title={t('ov.dumbbell.title')} lede={t('ov.dumbbell.lede')} />
        <Card className="p-5">
          <Dumbbell onOpen={onOpen} />
        </Card>
      </motion.section>

      <motion.section variants={rise}>
        <HonestyBox compact />
      </motion.section>
    </motion.div>
  )
}
