import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { DATA, GHAT_BY_ID } from '../../data'
import { useLang } from '../../i18n'
import type { StringKey } from '../../i18n/strings'
import { briefMessage } from '../../lib/brief'
import { Icon, type IconName } from '../icons'
import { BriefDoc, GhatReportsDoc, MethodDoc } from '../print/Docs'
import { usePrintDoc } from '../print/PrintDoc'
import { Button, LinkButton } from '../ui/Button'
import { Card, CardHeader, SectionTitle } from '../ui/Card'
import { rise, stagger } from '../ui/motion'
import { HonestyBox, MethodCard } from './Trust'

interface DocCard {
  id: string
  icon: IconName
  title: StringKey
  desc: StringKey
  pages: number
  files: { label: string; href: string }[]
  print: () => React.ReactNode
}

/** A live, scaled-down first page of a document: the PDF preview. */
function Thumb({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[250px] overflow-hidden border-2 border-ink bg-grey-200" aria-hidden>
      <div className="pointer-events-none absolute top-3 left-1/2 origin-top -translate-x-1/2 scale-[0.3] shadow-brut-lg [&>*:not(:first-child)]:hidden [&>section:not(:first-of-type)]:hidden">{children}</div>
    </div>
  )
}

export function Reports({ onPlan }: { onPlan: () => void }) {
  const { lang, t } = useLang()
  const { print, node } = usePrintDoc()
  const [copied, setCopied] = useState(false)
  const message = useMemo(() => briefMessage(lang, DATA.scores, GHAT_BY_ID), [lang])

  const cards: DocCard[] = [
    {
      id: 'brief',
      icon: 'receipt',
      title: 'rep.brief',
      desc: 'rep.brief.desc',
      pages: 2,
      files: [{ label: t('rep.lang.both'), href: 'pdfs/pran-vayu-brief-en-hi.pdf' }],
      print: () => <BriefDoc />,
    },
    {
      id: 'ghats',
      icon: 'pin',
      title: 'rep.ghats',
      desc: 'rep.ghats.desc',
      pages: DATA.scores.length,
      files: [
        { label: 'English', href: 'pdfs/pran-vayu-ghat-reports-en.pdf' },
        { label: 'हिंदी', href: 'pdfs/pran-vayu-ghat-reports-hi.pdf' },
      ],
      print: () => <GhatReportsDoc />,
    },
    {
      id: 'method',
      icon: 'book',
      title: 'rep.method',
      desc: 'rep.method.desc',
      pages: 2,
      files: [
        { label: 'English', href: 'pdfs/pran-vayu-method-en.pdf' },
        { label: 'हिंदी', href: 'pdfs/pran-vayu-method-hi.pdf' },
      ],
      print: () => <MethodDoc />,
    },
  ]

  return (
    <motion.div initial="hidden" animate="show" variants={stagger(0.08)} className="space-y-14">
      <motion.div variants={rise}>
        <SectionTitle eyebrow={t('ov.eyebrow')} title={<span className="text-[2.1rem]">{t('rep.title')}</span>} lede={t('rep.lede')} />
      </motion.div>

      <motion.div variants={rise} className="grid gap-6 lg:grid-cols-3">
        {cards.map((c, i) => (
          <Card key={c.id} tone={i === 0 ? 'white' : 'white'} className={`flex flex-col overflow-hidden ${i === 0 ? 'ring-4 ring-orange ring-offset-0' : ''}`}>
            <CardHeader icon={c.icon} label={t(c.title)} tone={i === 0 ? 'orange' : 'ink'} right={<span className="text-xs font-bold">{t('rep.pages', { n: c.pages })}</span>} />
            <div className="flex flex-1 flex-col gap-4 p-4">
              <Thumb>{c.print()}</Thumb>
              <p className="text-sm text-grey-800">{t(c.desc)}</p>
              <div className="mt-auto flex flex-wrap gap-2">
                {c.files.map((f) => (
                  <LinkButton key={f.href} href={f.href} download variant={i === 0 ? 'primary' : 'paper'} size="sm" icon="download">
                    {f.label}
                  </LinkButton>
                ))}
                <Button size="sm" variant="ghost" icon="print" onClick={() => print(c.print())}>
                  {t('rep.printLive')}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={rise} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader icon="chat" label={t('rep.whatsapp')} tone="ink" />
          <div className="space-y-4 p-5">
            <p className="text-sm text-grey-700">{t('rep.whatsapp.desc')}</p>
            <pre className="max-h-72 overflow-auto border-2 border-ink bg-grey-50 p-4 font-sans text-[0.9rem] leading-relaxed whitespace-pre-wrap" data-lenis-prevent>
              {message}
            </pre>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="paper"
                icon={copied ? 'check' : 'copy'}
                onClick={() => {
                  navigator.clipboard?.writeText(message)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1800)
                }}
              >
                {copied ? t('ui.copied') : t('rep.copy')}
              </Button>
              <LinkButton variant="ink" icon="chat" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener">
                {t('ui.share')}
              </LinkButton>
            </div>
          </div>
        </Card>
        <Card className="flex flex-col overflow-hidden">
          <CardHeader icon="calendar" label={t('rep.live')} tone="paper" />
          <div className="flex flex-1 flex-col gap-4 p-5">
            <p className="text-sm text-grey-800">{t('rep.live.desc')}</p>
            <ul className="space-y-2 text-sm font-bold">
              <li className="flex items-center gap-2">
                <Icon name="flask" size={16} />
                {t('sheet.title')}
              </li>
              <li className="flex items-center gap-2">
                <Icon name="aerator" size={16} />
                {t('order.title')}
              </li>
            </ul>
            <div className="mt-auto">
              <Button variant="primary" iconRight="arrowRight" onClick={onPlan}>
                {t('rep.open.plan')}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={rise}>
        <HonestyBox />
      </motion.div>
      <motion.div variants={rise}>
        <MethodCard />
      </motion.div>
      {node}
    </motion.div>
  )
}
