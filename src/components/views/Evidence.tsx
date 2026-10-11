import { motion } from 'motion/react'
import { DATA } from '../../data'
import { useLang } from '../../i18n'
import { Icon } from '../icons'
import { Card, CardHeader, SectionTitle } from '../ui/Card'
import { rise, stagger } from '../ui/motion'
import { Ghats } from './Ghats'
import { Overview } from './Overview'
import { HonestyBox, MethodCard } from './Trust'

/** For organisers, MPPCB and the jury: everything the ranking rests on, re-checkable. */
function CheckPanel() {
  const { t } = useLang()
  return (
    <Card className="overflow-hidden">
      <CardHeader icon="shield" label={t('check.title')} tone="ink" />
      <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
        <div className="border-b-2 border-ink p-5 lg:border-r-2 lg:border-b-0">
          <p className="text-[0.95rem]">{t('check.lede')}</p>
          <ul className="mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {DATA.guards.map((g) => (
              <li key={g.name} className="flex items-start justify-between gap-3 border-b border-grey-200 pb-1">
                <span className="flex items-start gap-1.5">
                  <Icon name={g.ok ? 'checkCircle' : 'alert'} size={15} className="mt-0.5 shrink-0" />
                  {g.name}
                </span>
                <span className="nums font-bold">{g.actual}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 p-5 text-sm">
          <p className="flex items-start gap-2 font-bold">
            <Icon name="receipt" size={16} className="mt-0.5 shrink-0" />
            {t('check.receipts')}
          </p>
          <div>
            <p className="eyebrow text-grey-600">{t('check.cmd')}</p>
            <pre className="nums mt-1 border-2 border-ink bg-ink p-3 text-[0.8rem] whitespace-pre-wrap text-white">
              git clone https://github.com/shriomverma100/Pran-Vayu.git{'\n'}cd Pran-Vayu{'\n'}npm install{'\n'}npm run verify:all
            </pre>
          </div>
          <div>
            <p className="eyebrow text-grey-600">{t('footer.fingerprint')}</p>
            <p className="nums mt-1 break-all text-xs">{DATA.meta.fingerprint}</p>
          </div>
          <ul className="space-y-1">
            {Object.values(DATA.meta.reports).map((r) => (
              <li key={r.file}>
                <a href={r.file} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 font-semibold underline decoration-grey-400 underline-offset-4 hover:decoration-orange">
                  <Icon name="verify" size={14} />
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

/** Evidence: the proof behind the action list, kept apart from the officer's screens. */
export function Evidence({ onOpen }: { onOpen: (ghatId: string) => void }) {
  const { t } = useLang()
  return (
    <motion.div initial="hidden" animate="show" variants={stagger()} className="space-y-14">
      <motion.div variants={rise}>
        <SectionTitle eyebrow={t('ov.eyebrow')} title={<span className="text-[2.1rem]">{t('ev.title')}</span>} lede={t('ev.lede')} />
      </motion.div>
      <Overview onOpen={onOpen} evidence />
      <Ghats onOpen={onOpen} />
      <motion.div variants={rise}>
        <CheckPanel />
      </motion.div>
      <motion.div variants={rise}>
        <HonestyBox />
      </motion.div>
      <motion.div variants={rise}>
        <MethodCard />
      </motion.div>
    </motion.div>
  )
}
