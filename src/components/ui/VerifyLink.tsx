import type { Year } from '../../core/constants'
import { DATA, reportLink } from '../../data'
import { useLang } from '../../i18n'
import { Icon } from '../icons'
import { Tooltip } from './Tooltip'

/** Opens the MPPCB report at the exact page a number came from. */
export function VerifyLink({ year, page, compact }: { year: Year; page: number; compact?: boolean }) {
  const { t } = useLang()
  const report = DATA.meta.reports[year]
  return (
    <Tooltip content={t('ui.verify.page', { report: report.title, page })}>
      <a
        href={reportLink(year, page)}
        target="_blank"
        rel="noopener"
        className="press-xs nums inline-flex items-center gap-1 whitespace-nowrap border-2 border-ink bg-white px-1.5 py-0.5 text-xs font-bold text-ink no-underline"
      >
        <Icon name="verify" size={14} />
        {compact ? `p.${page}` : `${year} · p.${page}`}
      </a>
    </Tooltip>
  )
}
