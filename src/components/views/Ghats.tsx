import { motion } from 'motion/react'
import { DATA, GHAT_BY_ID, STABILITY_BY_ID } from '../../data'
import { useLang } from '../../i18n'
import { reasonText } from '../../i18n/reasons'
import { ghatName } from '../../lib/labels'
import { OxygenStrip, RankRange, ScoreBar } from '../charts/Small'
import { Icon } from '../icons'
import { ActionBadge, StabilityBadge, TierBadge } from '../ui/Badges'
import { Card, SectionTitle } from '../ui/Card'
import { CoverageBar } from '../ui/CoverageBar'
import { rise, stagger } from '../ui/motion'

export function Ghats({ onOpen }: { onOpen: (ghatId: string) => void }) {
  const { lang, t } = useLang()

  return (
    <motion.div initial="hidden" animate="show" variants={stagger(0.07)} className="space-y-14">
      <motion.div variants={rise}>
        <SectionTitle eyebrow={t('ov.eyebrow')} title={<span className="text-[2.1rem]">{t('gh.title')}</span>} lede={t('gh.lede')} />
      </motion.div>

      {/* Ranked list */}
      <motion.div variants={stagger(0.06)} className="space-y-4">
        {DATA.scores.map((s) => {
          const g = GHAT_BY_ID.get(s.ghatId)!
          const stab = STABILITY_BY_ID.get(s.ghatId)!
          return (
            <motion.div key={s.ghatId} variants={rise}>
              <div
                onClick={() => onOpen(s.ghatId)}
                className="press grid w-full cursor-pointer items-center gap-x-6 gap-y-4 border-[2.5px] border-ink bg-white p-5 text-left md:grid-cols-[64px_minmax(220px,1.3fr)_minmax(200px,1fr)_minmax(320px,1.2fr)]"
              >
                {/* rank */}
                <div className={`grid h-16 w-16 place-items-center border-[2.5px] border-ink text-3xl font-extrabold ${s.tier === 'act-now' ? 'bg-ink text-white' : s.tier === 'high' ? 'bg-orange' : 'bg-orange-tint'}`}>
                  <span className="nums">{s.rank}</span>
                </div>
                {/* name + action */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl leading-tight font-extrabold">{ghatName(g, lang)}</h3>
                    {g.confidence === 'medium' && (
                      <span className="inline-flex items-center gap-1 border-2 border-dashed border-ink px-1.5 py-0.5 text-[0.7rem] font-bold">
                        <Icon name="info" size={12} />
                        {t('gh.medium')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-grey-600">{lang === 'hi' ? g.waterBodyHi : g.waterBody}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <TierBadge tier={s.tier} size="sm" />
                    <ActionBadge action={s.action} />
                  </div>
                  <p className="text-sm text-grey-800">{reasonText(s.reasons[0], lang)}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpen(s.ghatId)
                    }}
                    className="inline-flex items-center gap-1 text-sm font-bold text-orange-deep underline-offset-4 hover:underline"
                  >
                    {t('ov.open')} <Icon name="arrowRight" size={15} />
                  </button>
                </div>
                {/* score + stability */}
                <div className="space-y-3">
                  <div>
                    <p className="eyebrow mb-1 text-grey-600">{t('gh.col.score')}</p>
                    <ScoreBar score={s.score} />
                  </div>
                  <div>
                    <p className="eyebrow mb-1 text-grey-600">{t('gh.col.stability')}</p>
                    <div className="flex items-center gap-3">
                      <RankRange best={stab.bestRank} worst={stab.worstRank} rank={stab.baseRank} width={150} />
                      <StabilityBadge best={stab.bestRank} worst={stab.worstRank} rank={stab.baseRank} n={stab.scenarios} />
                    </div>
                  </div>
                </div>
                {/* oxygen + coverage */}
                <div className="space-y-3">
                  <div>
                    <p className="eyebrow mb-1 text-grey-600">{t('gh.col.oxygen')}</p>
                    <OxygenStrip ghatId={s.ghatId} width={250} />
                  </div>
                  <div>
                    <p className="eyebrow mb-1 text-grey-600">{t('gh.col.coverage')}</p>
                    <CoverageBar slots={DATA.coverage[s.ghatId]} size="sm" />
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Rank stability */}
      <motion.section variants={rise} className="space-y-5">
        <SectionTitle title={t('gh.stability.title')} lede={t('gh.stability.lede')} />
        <Card className="p-5">
          <ul className="divide-y-2 divide-grey-200">
            {DATA.robustness.ghats.map((r) => {
              const g = GHAT_BY_ID.get(r.ghatId)!
              return (
                <li key={r.ghatId} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
                  <span className="w-72 font-bold">
                    <span className="nums">{r.baseRank}.</span> {ghatName(g, lang)}
                  </span>
                  <RankRange best={r.bestRank} worst={r.worstRank} rank={r.baseRank} width={260} />
                  <span className="nums text-sm text-grey-700">
                    {r.bestRank === r.worstRank ? t('stability.always', { rank: r.baseRank, n: r.scenarios }) : t('stability.detail', { best: r.bestRank, worst: r.worstRank, n: r.scenarios })}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-xs text-grey-600">{t('gh.stability.axis')}</p>
        </Card>
      </motion.section>
    </motion.div>
  )
}
