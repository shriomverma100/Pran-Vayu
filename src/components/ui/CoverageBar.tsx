import { motion, useReducedMotion } from 'motion/react'
import type { SlotCoverage } from '../../core/types'
import { useLang } from '../../i18n'
import type { StringKey } from '../../i18n/strings'
import { Tooltip } from './Tooltip'

/**
 * 18 blocks, one per year × festival × phase test. Solid ink = tested,
 * grey = partly tested, stripes = not tested. Grouped by festival-year.
 */
export function CoverageBar({ slots, size = 'md', animateIn = true }: { slots: SlotCoverage[]; size?: 'sm' | 'md'; animateIn?: boolean }) {
  const { t } = useLang()
  // Animate on mount, not on scroll-into-view, so bars are never left blank (print, PDF).
  const grow = animateIn && !useReducedMotion()
  const tested = slots.filter((s) => s.status !== 'not-tested').length
  const groups: SlotCoverage[][] = []
  for (let i = 0; i < slots.length; i += 3) groups.push(slots.slice(i, i + 3))
  const h = size === 'sm' ? 'h-3.5' : 'h-5'
  const w = size === 'sm' ? 'w-2.5' : 'w-3.5'

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1" role="img" aria-label={t('coverage.label', { tested, total: slots.length })}>
        {groups.map((g, gi) => (
          <div key={gi} className="flex gap-[2px]">
            {g.map((s, si) => {
              const label =
                s.status === 'tested' ? t('coverage.tested') : s.status === 'partial' ? t('coverage.partial') : s.reason === 'no-table' ? t('coverage.noTable') : t('coverage.notSampled')
              const cls = s.status === 'tested' ? 'bg-ink' : s.status === 'partial' ? 'bg-grey-500' : 'hatch'
              return (
                <Tooltip
                  key={si}
                  content={
                    <span>
                      <b>
                        {s.year} {t(`festival.${s.festival}` as StringKey)} · {t(`phase.${s.phase}` as StringKey)}
                      </b>
                      <br />
                      {label}
                    </span>
                  }
                >
                  <motion.span
                    tabIndex={0}
                    initial={grow ? { scaleY: 0 } : false}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: (gi * 3 + si) * 0.025, type: 'spring', stiffness: 420, damping: 26 }}
                    style={{ originY: 1 }}
                    className={`block ${h} ${w} border-[1.5px] border-ink ${cls} outline-offset-2`}
                  />
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>
      <span className="nums text-sm font-bold whitespace-nowrap">{t('coverage.label', { tested, total: slots.length })}</span>
    </div>
  )
}
