import { motion } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'
import { DATA, GHAT_BY_ID } from '../../data'
import { LangProvider, useLang, type Lang } from '../../i18n'
import type { StringKey } from '../../i18n/strings'
import { briefMessage } from '../../lib/brief'
import { ghatName } from '../../lib/labels'
import { Icon, type IconName } from '../icons'
import { AllocationOrderDoc, BriefDoc, GhatReportsDoc, MethodDoc } from '../print/Docs'
import { usePrintDoc } from '../print/PrintDoc'
import { Button, LinkButton } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { rise, stagger } from '../ui/motion'
import { FieldSheetPages, usePlan } from './Plan'

// Report dashboard: three choices (report, language, ghats), a live A4
// preview, and one button. Ready-made PDFs download at once; any other
// choice opens the browser's Save as PDF with the same template.

type Kind = 'brief' | 'profiles' | 'method' | 'order' | 'sheets'
type LangChoice = 'en' | 'hi' | 'both'

const KINDS: { id: Kind; icon: IconName; title: StringKey; desc: StringKey }[] = [
  { id: 'brief', icon: 'receipt', title: 'rep.brief', desc: 'rep.brief.desc' },
  { id: 'profiles', icon: 'pin', title: 'rep.ghats', desc: 'rep.ghats.desc' },
  { id: 'method', icon: 'book', title: 'rep.method', desc: 'rep.method.desc' },
  { id: 'order', icon: 'aerator', title: 'order.title', desc: 'rd.order.desc' },
  { id: 'sheets', icon: 'flask', title: 'sheet.title', desc: 'rd.sheets.desc' },
]

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`press-sm border-2 border-ink px-3 py-2 text-left text-sm font-bold ${active ? 'bg-ink text-white' : 'bg-white text-ink'}`}
    >
      {children}
    </button>
  )
}

export function Reports({ onPlan }: { onPlan: () => void }) {
  const { lang, t } = useLang()
  const { print, node } = usePrintDoc()
  const { plan, aerators, teams } = usePlan()
  const [kind, setKind] = useState<Kind>('brief')
  const [langChoice, setLangChoice] = useState<LangChoice>('both')
  const [ghats, setGhats] = useState<string[]>(DATA.scores.map((s) => s.ghatId))
  const [copied, setCopied] = useState(false)
  const message = useMemo(() => briefMessage(lang, DATA.scores, GHAT_BY_ID), [lang])
  const sheetGhats = [...new Set(plan.teams.map((x) => x.ghatId))]

  const langs: Lang[] = langChoice === 'both' ? ['en', 'hi'] : [langChoice]
  const allGhats = ghats.length === DATA.scores.length

  /** The pages for the current choice, in each chosen language. */
  const doc = (
    <>
      {kind === 'brief' && <BriefDoc langs={langs} />}
      {kind !== 'brief' &&
        langs.map((l) => (
          <LangProvider key={l} forceLang={l}>
            {kind === 'profiles' && <GhatReportsDoc ghatIds={ghats} />}
            {kind === 'method' && <MethodDoc />}
            {kind === 'order' && <AllocationOrderDoc plan={plan} aerators={aerators} teams={teams} />}
            {kind === 'sheets' && <FieldSheetPages ghatIds={sheetGhats} plan={plan} />}
          </LangProvider>
        ))}
    </>
  )

  /** A ready-made PDF when the choice matches one exactly. */
  const ready: string | null =
    kind === 'brief' && langChoice === 'both'
      ? 'pdfs/pran-vayu-brief-en-hi.pdf'
      : kind === 'profiles' && allGhats && langChoice !== 'both'
        ? `pdfs/pran-vayu-ghat-reports-${langChoice}.pdf`
        : kind === 'method' && langChoice !== 'both'
          ? `pdfs/pran-vayu-method-${langChoice}.pdf`
          : null
  const empty = (kind === 'profiles' && ghats.length === 0) || (kind === 'sheets' && sheetGhats.length === 0) || (kind === 'order' && !plan.aerators.length && !plan.teams.length)

  return (
    <motion.div initial="hidden" animate="show" variants={stagger()} className="space-y-10">
      <motion.div variants={rise} className="max-w-3xl">
        <p className="eyebrow text-orange-deep">{t('ov.eyebrow')}</p>
        <h2 className="mt-1 text-[2.1rem] leading-tight font-extrabold tracking-tight">{t('rep.title')}</h2>
        <p className="mt-2 text-grey-700">{t('rd.lede')}</p>
      </motion.div>

      <motion.div variants={rise} className="grid gap-6 xl:grid-cols-[minmax(340px,1fr)_1.25fr]">
        {/* Choices */}
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <CardHeader icon="receipt" label={`1 · ${t('rd.what')}`} tone="ink" />
            <div className="grid gap-2 p-4">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKind(k.id)}
                  aria-pressed={kind === k.id}
                  className={`press-sm flex items-start gap-3 border-2 border-ink p-3 text-left ${kind === k.id ? 'bg-orange-tint' : 'bg-white'}`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center border-2 border-ink ${kind === k.id ? 'bg-orange' : 'bg-white'}`}>
                    <Icon name={k.icon} size={18} />
                  </span>
                  <span>
                    <span className="block font-extrabold">{t(k.title)}</span>
                    <span className="block text-[0.82rem] leading-snug text-grey-700">{t(k.desc)}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader icon="globe" label={`2 · ${t('ui.language')}`} tone="ink" />
            <div className="flex flex-wrap gap-2 p-4">
              <ChoiceButton active={langChoice === 'en'} onClick={() => setLangChoice('en')}>English</ChoiceButton>
              <ChoiceButton active={langChoice === 'hi'} onClick={() => setLangChoice('hi')}>हिंदी</ChoiceButton>
              <ChoiceButton active={langChoice === 'both'} onClick={() => setLangChoice('both')}>English + हिंदी</ChoiceButton>
            </div>
          </Card>

          {kind === 'profiles' && (
            <Card className="overflow-hidden">
              <CardHeader icon="pin" label={`3 · ${t('rd.ghats')}`} tone="ink" right={<button type="button" className="text-xs font-bold underline" onClick={() => setGhats(allGhats ? [] : DATA.scores.map((s) => s.ghatId))}>{allGhats ? t('rd.none') : t('rd.all')}</button>} />
              <div className="grid gap-2 p-4 sm:grid-cols-2">
                {DATA.scores.map((s) => {
                  const on = ghats.includes(s.ghatId)
                  return (
                    <label key={s.ghatId} className={`flex cursor-pointer items-center gap-2 border-2 border-ink px-3 py-2 text-sm font-semibold transition-colors duration-100 ${on ? 'bg-orange-tint' : 'bg-white'}`}>
                      <input type="checkbox" checked={on} onChange={() => setGhats((g) => (on ? g.filter((x) => x !== s.ghatId) : [...g, s.ghatId]))} className="h-4 w-4 accent-[#EA6A0A]" />
                      <span className="nums font-extrabold">{s.rank}.</span> {ghatName(GHAT_BY_ID.get(s.ghatId)!, lang)}
                    </label>
                  )
                })}
              </div>
            </Card>
          )}
          {(kind === 'order' || kind === 'sheets') && (
            <p className="flex flex-wrap items-center gap-2 border-2 border-dashed border-ink bg-white p-3 text-sm">
              <Icon name="info" size={16} />
              {t('rd.fromPlan', { a: aerators, t: teams })}
              <button type="button" onClick={onPlan} className="font-bold text-orange-deep underline-offset-4 hover:underline">
                {t('rep.open.plan')} →
              </button>
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {ready ? (
              <LinkButton href={ready} download variant="primary" size="lg" icon="download">
                {t('ui.download')}
              </LinkButton>
            ) : (
              <Button variant="primary" size="lg" icon="download" disabled={empty} onClick={() => print(doc)}>
                {t('rd.save')}
              </Button>
            )}
            <Button variant="paper" size="lg" icon="print" disabled={empty} onClick={() => print(doc)}>
              {t('ui.print')}
            </Button>
          </div>
          <p className="text-xs text-grey-600">{ready ? t('rd.readyNote') : t('rd.saveNote')}</p>
        </div>

        {/* Live preview */}
        <Card className="overflow-hidden">
          <CardHeader icon="verify" label={t('rd.preview')} tone="paper" />
          <div className="h-[760px] overflow-y-auto bg-grey-200 p-4" data-lenis-prevent>
            {empty ? (
              <p className="p-6 text-center text-grey-700">{kind === 'sheets' ? t('sheet.none') : kind === 'order' ? t('alloc.empty.team') : t('rd.pick')}</p>
            ) : (
              <div className="mx-auto w-[397px] [zoom:0.5] sm:w-auto sm:[zoom:0.62] [&_.print-page]:mb-6 [&_.print-page]:shadow-brut-lg">{doc}</div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* WhatsApp */}
      <motion.div variants={rise}>
        <Card className="overflow-hidden">
          <CardHeader icon="chat" label={t('rep.whatsapp')} tone="ink" />
          <div className="grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr]">
            <pre className="max-h-64 overflow-auto border-2 border-ink bg-grey-50 p-4 font-sans text-[0.9rem] leading-relaxed whitespace-pre-wrap" data-lenis-prevent>
              {message}
            </pre>
            <div className="space-y-3">
              <p className="text-sm text-grey-700">{t('rep.whatsapp.desc')}</p>
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
          </div>
        </Card>
      </motion.div>
      {node}
    </motion.div>
  )
}
