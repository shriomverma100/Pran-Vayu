import { motion } from 'motion/react'
import { DATA } from '../../data'
import { useLang } from '../../i18n'
import type { StringKey } from '../../i18n/strings'
import { Icon, type IconName } from '../icons'
import { Card, CardHeader } from '../ui/Card'
import { rise, stagger } from '../ui/motion'

export const HONESTY: { key: StringKey; icon: IconName }[] = [
  { key: 'hon.no-health', icon: 'alert' },
  { key: 'hon.missing', icon: 'notTested' },
  { key: 'hon.durga25', icon: 'flask' },
  { key: 'hon.rkp', icon: 'pin' },
  { key: 'hon.units', icon: 'info' },
  { key: 'hon.metals', icon: 'layers' },
  { key: 'hon.snapshot', icon: 'hourglass' },
  { key: 'hon.class', icon: 'book' },
  { key: 'hon.ngt', icon: 'drop' },
  { key: 'hon.statewide', icon: 'globe' },
  { key: 'hon.pdfdiff', icon: 'receipt' },
  { key: 'hon.tool', icon: 'shield' },
]

export const METHOD: StringKey[] = ['method.1', 'method.2', 'method.3', 'method.4', 'method.5', 'method.6', 'method.7', 'method.8']

/** What the data does not cover. Shown in full on Reports and in every brief. */
export function HonestyBox({ compact }: { compact?: boolean }) {
  const { t } = useLang()
  const items = compact ? HONESTY.slice(0, 4) : HONESTY
  return (
    <Card className="overflow-hidden">
      <CardHeader icon="info" label={t('hon.title')} tone="orange" />
      <motion.ul initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger(0.04)} className={`grid gap-0 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
        {items.map((h) => (
          <motion.li key={h.key} variants={rise} className="flex gap-3 border-b-2 border-grey-200 p-4 md:border-r-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center border-2 border-ink bg-white">
              <Icon name={h.icon} size={16} />
            </span>
            <p className="text-[0.92rem] leading-snug">{t(h.key)}</p>
          </motion.li>
        ))}
      </motion.ul>
    </Card>
  )
}

/** The scoring rule in plain words, step by step. */
export function MethodCard() {
  const { t } = useLang()
  return (
    <Card className="overflow-hidden">
      <CardHeader icon="book" label={t('method.title')} tone="ink" />
      <ol className="divide-y-2 divide-grey-200">
        {METHOD.map((k, i) => (
          <li key={k} className="flex gap-4 p-4">
            <span className="nums grid h-8 w-8 shrink-0 place-items-center border-2 border-ink bg-orange text-sm font-extrabold">{i + 1}</span>
            <p className="text-[0.95rem] leading-snug">{t(k, { guards: DATA.guards.length })}</p>
          </li>
        ))}
      </ol>
    </Card>
  )
}
