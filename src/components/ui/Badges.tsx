import type { ActionCode, Tier } from '../../core/scoring'
import type { DisplayStatus } from '../../core/status'
import { ACTION_TEXT } from '../../i18n/reasons'
import { useLang } from '../../i18n'
import type { StringKey } from '../../i18n/strings'
import { Icon, type IconName } from '../icons'
import { Tooltip } from './Tooltip'

// Status is never colour alone: every chip has a fill, an icon and a word.

export const STATUS_STYLE: Record<DisplayStatus, { chip: string; cell: string; icon: IconName; label: StringKey; hint: StringKey }> = {
  severe: { chip: 'bg-ink text-white border-ink', cell: 'bg-ink', icon: 'alert', label: 'status.severe', hint: 'status.severe.hint' },
  breach: { chip: 'bg-orange text-ink border-ink', cell: 'bg-orange', icon: 'exclaim', label: 'status.breach', hint: 'status.breach.hint' },
  within: { chip: 'bg-white text-ink border-ink', cell: 'bg-white', icon: 'checkCircle', label: 'status.within', hint: 'status.within.hint' },
  'not-tested': { chip: 'hatch text-ink border-ink', cell: 'hatch', icon: 'notTested', label: 'status.notTested', hint: 'status.notTested.hint' },
  bdl: { chip: 'bg-grey-200 text-ink border-ink', cell: 'bg-grey-200', icon: 'bdl', label: 'status.bdl', hint: 'status.bdl.hint' },
  'no-limit': { chip: 'bg-grey-50 text-grey-700 border-grey-500', cell: 'bg-grey-50', icon: 'info', label: 'status.noLimit', hint: 'status.noLimit.hint' },
}

export function StatusChip({ status, compact, withHint = true }: { status: DisplayStatus; compact?: boolean; withHint?: boolean }) {
  const { t } = useLang()
  const s = STATUS_STYLE[status]
  const chip = (
    <span
      className={`inline-flex items-center gap-1.5 border-2 font-bold uppercase tracking-wide ${s.chip} ${
        compact ? 'px-1.5 py-0.5 text-[0.66rem]' : 'px-2 py-1 text-[0.72rem]'
      } ${status === 'not-tested' ? '[&>span]:bg-grey-100 [&>span]:px-1' : ''}`}
    >
      <Icon name={s.icon} size={compact ? 12 : 14} strokeWidth={2.4} />
      <span>{t(s.label)}</span>
    </span>
  )
  return withHint ? <Tooltip content={t(s.hint)}>{chip}</Tooltip> : chip
}

const TIER_STYLE: Record<Tier, { cls: string; icon: IconName }> = {
  'act-now': { cls: 'bg-ink text-white', icon: 'alert' },
  high: { cls: 'bg-orange text-ink', icon: 'exclaim' },
  moderate: { cls: 'bg-orange-tint text-ink', icon: 'info' },
}

export function TierBadge({ tier, size = 'md' }: { tier: Tier; size?: 'sm' | 'md' }) {
  const { t } = useLang()
  const s = TIER_STYLE[tier]
  return (
    <span className={`inline-flex items-center gap-1.5 border-2 border-ink font-extrabold uppercase tracking-wider ${s.cls} ${size === 'sm' ? 'px-1.5 py-0.5 text-[0.66rem]' : 'px-2.5 py-1 text-xs'}`}>
      <Icon name={s.icon} size={size === 'sm' ? 12 : 14} strokeWidth={2.4} />
      {t(`tier.${tier}` as StringKey)}
    </span>
  )
}

export const ACTION_ICON: Record<ActionCode, IconName> = {
  AERATE_TEST: 'aerator',
  TEST_FIRST: 'flask',
  AERATE: 'aerator',
  CLEAN_RETEST: 'broom',
  ROUTINE: 'checkCircle',
}

export function ActionBadge({ action, detail }: { action: ActionCode; detail?: boolean }) {
  const { lang } = useLang()
  const a = ACTION_TEXT[lang][action]
  const badge = (
    <span className="inline-flex items-center gap-2 border-2 border-ink bg-white px-2.5 py-1 text-sm font-bold">
      <Icon name={ACTION_ICON[action]} size={16} />
      {a.title}
    </span>
  )
  return detail ? <Tooltip content={a.detail}>{badge}</Tooltip> : badge
}

export function StabilityBadge({ best, worst, rank, n }: { best: number; worst: number; rank: number; n: number }) {
  const { t } = useLang()
  const stable = worst - best <= 1
  const text = best === worst ? t('stability.always', { rank, n }) : t('stability.detail', { best, worst, n })
  return (
    <Tooltip content={text}>
      <span className={`inline-flex items-center gap-1.5 border-2 px-2 py-0.5 text-xs font-bold ${stable ? 'border-ink bg-white' : 'border-dashed border-grey-600 bg-grey-50 text-grey-800'}`}>
        <Icon name={stable ? 'shield' : 'shuffle'} size={14} />
        {t(stable ? 'stability.stable' : 'stability.varies')}
      </span>
    </Tooltip>
  )
}
