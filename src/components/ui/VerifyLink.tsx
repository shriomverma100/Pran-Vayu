import { motion } from 'motion/react'
import type { Year } from '../../core/constants'
import { DATA, reportLink } from '../../data'
import { useLang } from '../../i18n'
import { Icon } from '../icons'
import { SPRING_SNAPPY } from './motion'
import { Tooltip } from './Tooltip'

/** Opens the MPPCB report at the exact page a number came from. */
export function VerifyLink({ year, page, compact }: { year: Year; page: number; compact?: boolean }) {
  const { t } = useLang()
  const report = DATA.meta.reports[year]
  return (
    <Tooltip content={t('ui.verify.page', { report: report.title, page })}>
      <motion.a
        href={reportLink(year, page)}
        target="_blank"
        rel="noopener"
        whileHover={{ x: -1, y: -1, boxShadow: '3px 3px 0 0 #111111' }}
        whileTap={{ x: 1, y: 1, boxShadow: '0px 0px 0 0 #111111' }}
        transition={SPRING_SNAPPY}
        className="nums inline-flex items-center gap-1 whitespace-nowrap border-2 border-ink bg-white px-1.5 py-0.5 text-xs font-bold text-ink no-underline"
        style={{ boxShadow: '2px 2px 0 0 #111111' }}
      >
        <Icon name="verify" size={14} />
        {compact ? `p.${page}` : `${year} · p.${page}`}
      </motion.a>
    </Tooltip>
  )
}
