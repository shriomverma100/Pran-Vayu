import { motion } from 'motion/react'
import { useState } from 'react'
import { daysUntil } from '../core/dates'
import { VISARJAN_DATE } from '../core/constants'
import { displayStatus, type DisplayStatus } from '../core/status'
import { DATA, GHAT_BY_ID, READING_BY_ID, SCORE_BY_ID, STABILITY_BY_ID } from '../data'
import { useLang, type Lang } from '../i18n'
import { reasonText } from '../i18n/reasons'
import type { StringKey } from '../i18n/strings'
import { Icon, ICON_NAMES } from './icons'
import { ActionBadge, StabilityBadge, StatusChip, TierBadge } from './ui/Badges'
import { Button, IconButton } from './ui/Button'
import { Card, CardHeader, SectionTitle } from './ui/Card'
import { CoverageBar } from './ui/CoverageBar'
import { Drawer } from './ui/Drawer'
import { Emblems, HAS_BMC_LOGO } from './ui/Emblems'
import { rise, stagger } from './ui/motion'
import { StatTile } from './ui/StatTile'
import { Segmented, Tabs } from './ui/Tabs'
import { VerifyLink } from './ui/VerifyLink'

// Design system reference: every building block of प्राण-वायु, rendered
// with real data from the checked pipeline. Open with #design.

const SWATCHES = [
  { name: 'Ink', hex: '#111111', use: 'Text, borders, shadows, "severe"', cls: 'bg-ink' },
  { name: 'Paper', hex: '#FAFAF7', use: 'Page surface', cls: 'bg-paper' },
  { name: 'White', hex: '#FFFFFF', use: 'Cards, "within limit"', cls: 'bg-white' },
  { name: 'Orange', hex: '#EA6A0A', use: '"Breaks limit", highlights', cls: 'bg-orange' },
  { name: 'Orange deep', hex: '#9A3F00', use: 'Orange text (AA contrast)', cls: 'bg-orange-deep' },
  { name: 'Orange tint', hex: '#FFF4EB', use: 'Soft emphasis, "moderate"', cls: 'bg-orange-tint' },
  { name: 'Grey 500', hex: '#8A8A88', use: '"Not tested" stripes, chart context', cls: 'bg-grey-500' },
  { name: 'Grey 200', hex: '#E5E5E3', use: '"Below detection", gridlines', cls: 'bg-grey-200' },
]

const STATUSES: DisplayStatus[] = ['severe', 'breach', 'within', 'not-tested', 'bdl', 'no-limit']

function Section({ id, title, children, note }: { id: string; title: string; children: React.ReactNode; note?: string }) {
  return (
    <motion.section id={id} variants={rise} className="scroll-mt-6">
      <div className="mb-4 flex items-baseline gap-3 border-b-2 border-ink pb-2">
        <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
        {note && <p className="text-sm text-grey-600">{note}</p>}
      </div>
      {children}
    </motion.section>
  )
}

export default function DesignSystem() {
  const { lang, setLang, t } = useLang()
  const [tab, setTab] = useState<'overview' | 'ghats' | 'plan' | 'reports'>('overview')
  const [drawer, setDrawer] = useState(false)
  const bai = SCORE_BY_ID.get('BAI')!
  const baiStab = STABILITY_BY_ID.get('BAI')!
  const sha = SCORE_BY_ID.get('SHA')!
  const shaStab = STABILITY_BY_ID.get('SHA')!
  const doRows = DATA.readings.filter((r) => r.ghatId === 'BAI' && r.parameter === 'Dissolved oxygen')
  const zeroDo = DATA.readings.filter((r) => r.parameter === 'Dissolved oxygen' && r.value === 0).length
  const doMeasured = DATA.readings.filter((r) => r.parameter === 'Dissolved oxygen' && r.kind === 'measured')
  const bodMeasured = DATA.readings.filter((r) => r.parameter === 'BOD' && r.kind === 'measured')
  const days = daysUntil(VISARJAN_DATE)

  return (
    <motion.main initial="hidden" animate="show" variants={stagger(0.07)} className="mx-auto max-w-6xl space-y-14 px-6 py-10">
      <motion.header variants={rise} className="brut bg-white p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Emblems height={56} />
          <Segmented<Lang> label={t('ui.language')} value={lang} onChange={setLang} options={[{ id: 'en', label: 'English' }, { id: 'hi', label: 'हिंदी' }]} />
        </div>
        <h1 className="mt-6 font-brand text-[5.5rem] leading-[1.05] text-ink">
          प्राण<span className="text-orange">-</span>वायु
        </h1>
        <p className="mt-2 eyebrow text-grey-700">Design system · Bhopal visarjan ghat risk &amp; action planner</p>
        {!HAS_BMC_LOGO && (
          <p className="mt-4 inline-flex items-center gap-2 border-2 border-dashed border-grey-600 bg-grey-50 px-3 py-1.5 text-sm text-grey-800">
            <Icon name="info" size={16} /> BMC logo slot is empty: add <code className="font-bold">src/assets/brand/bmc-logo.svg</code> to show it.
          </p>
        )}
      </motion.header>

      <Section id="colour" title="Colour" note="Orange, white, black and greys only. Colour-blind separation checked with the palette validator.">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {SWATCHES.map((s) => (
            <div key={s.hex} className="brut-sm bg-white">
              <div className={`h-20 border-b-2 border-ink ${s.cls}`} />
              <div className="p-3">
                <p className="font-bold">{s.name}</p>
                <p className="nums text-sm text-grey-700">{s.hex}</p>
                <p className="mt-1 text-xs text-grey-600">{s.use}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="type" title="Type" note="Yatra One for the name only · Inter for English · Noto Sans Devanagari for Hindi">
        <Card className="space-y-4 p-6">
          <p className="font-brand text-6xl">प्राण-वायु</p>
          <p className="text-[2.5rem] leading-tight font-extrabold tracking-tight">Which ghats need action before 20 October</p>
          <p className="text-[1.75rem] font-extrabold tracking-tight">Section title · अनुभाग शीर्षक</p>
          <p className="max-w-2xl leading-relaxed">Body text at 16px. Oxygen fell to 0 mg/l in 4 tests at Bairagarh. विसर्जन से पहले, सही घाट पर सही कदम।</p>
          <p className="eyebrow text-orange-deep">Eyebrow label · small capitals</p>
          <p className="nums text-sm text-grey-700">Table numbers line up: 0.6 · 4.1 · 11.0 · 177.84</p>
        </Card>
      </Section>

      <Section id="buttons" title="Buttons" note="Hover lifts, press sinks into the shadow. Try them.">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary" icon="download">{t('ui.download')}</Button>
          <Button variant="ink" icon="chat">{t('ui.share')}</Button>
          <Button variant="paper" icon="print">{t('ui.print')}</Button>
          <Button variant="paper" icon="copy" size="sm">{t('ui.copy')}</Button>
          <Button variant="ghost" iconRight="arrowRight">View evidence</Button>
          <IconButton icon="close" label={t('ui.close')} />
          <Button variant="paper" disabled>Disabled</Button>
        </div>
      </Section>

      <Section id="status" title="Status of a reading" note="Every status has a fill, an icon and a word. Hover for the meaning.">
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((s) => (
            <StatusChip key={s} status={s} />
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <TierBadge tier="act-now" />
          <TierBadge tier="high" />
          <TierBadge tier="moderate" />
          <ActionBadge action={bai.action} detail />
          <ActionBadge action="TEST_FIRST" detail />
          <ActionBadge action="AERATE" detail />
          <ActionBadge action="CLEAN_RETEST" detail />
          <StabilityBadge best={baiStab.bestRank} worst={baiStab.worstRank} rank={baiStab.baseRank} n={baiStab.scenarios} />
          <StabilityBadge best={shaStab.bestRank} worst={shaStab.worstRank} rank={shaStab.baseRank} n={shaStab.scenarios} />
        </div>
      </Section>

      <Section id="tiles" title="Headline numbers" note="Count up once when they scroll into view. All from the checked data.">
        <div className="grid gap-5 md:grid-cols-4">
          <StatTile tone="ink" icon="hourglass" label="Durga visarjan" value={Math.max(days, 0)} suffix={days === 1 ? 'day' : 'days'} detail="20 October 2026" />
          <StatTile tone="orange" icon="oxygen" label="Zero oxygen" value={zeroDo} suffix="readings" detail="All at Bairagarh kund. No fish can live at 0 mg/l." />
          <StatTile icon="drop" label="Oxygen below 5" value={doMeasured.filter((r) => (r.value as number) < 5).length} suffix={`/ ${doMeasured.length}`} detail="Bathing standard: 5 mg/l or more" />
          <StatTile icon="layers" label="BOD above 3" value={bodMeasured.filter((r) => (r.value as number) > 3).length} suffix={`/ ${bodMeasured.length}`} detail="Bathing standard: 3 mg/l or less" />
        </div>
      </Section>

      <Section id="coverage" title="Test coverage" note="18 tests per ghat. Stripes = not tested, never clean.">
        <Card className="space-y-4 p-6">
          {[bai, sha].map((s) => (
            <div key={s.ghatId} className="flex flex-wrap items-center justify-between gap-4">
              <p className="w-72 font-bold">{GHAT_BY_ID.get(s.ghatId)!.name}</p>
              <CoverageBar slots={DATA.coverage[s.ghatId]} />
            </div>
          ))}
        </Card>
      </Section>

      <Section id="nav" title="Navigation" note="Arrow keys move between tabs; the marker slides.">
        <div className="border-b-[2.5px] border-ink">
          <Tabs
            idPrefix="ds"
            value={tab}
            onChange={setTab}
            items={[
              { id: 'overview', label: 'Overview', icon: 'grid' },
              { id: 'ghats', label: 'Ghats', icon: 'pin', badge: 7 },
              { id: 'plan', label: 'Plan for 20 Oct', icon: 'calendar' },
              { id: 'reports', label: 'Reports', icon: 'receipt' },
            ]}
          />
        </div>
      </Section>

      <Section id="cards" title="Cards and evidence" note="Every number links to its page in the MPPCB report.">
        <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <Card interactive onClick={() => setDrawer(true)} className="flex flex-col">
            <CardHeader icon="alert" label={`#${bai.rank} · ${t(`tier.${bai.tier}` as StringKey)}`} tone="ink" right={<Icon name="arrowRight" size={18} />} />
            <div className="space-y-3 p-5">
              <h3 className="text-xl font-extrabold">{lang === 'hi' ? GHAT_BY_ID.get('BAI')!.nameHi : GHAT_BY_ID.get('BAI')!.name}</h3>
              <ActionBadge action={bai.action} />
              <ul className="space-y-1.5 text-[0.92rem]">
                {bai.reasons.slice(0, 3).map((r) => (
                  <li key={r.code} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-orange" />
                    {reasonText(r, lang)}
                  </li>
                ))}
              </ul>
              <p className="text-sm font-bold text-orange-deep">Click to open the detail panel →</p>
            </div>
          </Card>
          <Card>
            <CardHeader icon="receipt" label="Bairagarh · dissolved oxygen · every reading" />
            <div className="max-h-80 overflow-auto" data-lenis-prevent>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-grey-50 text-left">
                  <tr className="border-b-2 border-ink">
                    <th className="px-3 py-2 eyebrow">Test</th>
                    <th className="px-3 py-2 eyebrow text-right">mg/l</th>
                    <th className="px-3 py-2 eyebrow">Status</th>
                    <th className="px-3 py-2 eyebrow">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {doRows.map((r) => (
                    <tr key={r.id} className="border-b border-grey-300 transition-colors hover:bg-orange-tint">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {r.year} {t(`festival.${r.festival}` as StringKey)} · {t(`phase.${r.phase}` as StringKey)}
                      </td>
                      <td className="nums px-3 py-2 text-right font-bold">{r.value ?? '—'}</td>
                      <td className="px-3 py-2">
                        <StatusChip status={displayStatus(r)} compact withHint={false} />
                      </td>
                      <td className="px-3 py-2">
                        <VerifyLink year={r.year} page={r.page} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Section>

      <Section id="icons" title="Icons" note={`${ICON_NAMES.length} custom icons · 24px grid · 2px stroke · square caps`}>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-9">
          {ICON_NAMES.map((n) => (
            <motion.div key={n} whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="brut-flat flex flex-col items-center gap-2 bg-white p-3">
              <Icon name={n} size={26} />
              <span className="text-[0.66rem] text-grey-600">{n}</span>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section id="data" title="Data checks" note="Run at every build. The build stops if any fails.">
        <Card className="p-0">
          <ul className="grid divide-y divide-grey-300 md:grid-cols-2 md:divide-y-0">
            {DATA.guards.map((g) => (
              <li key={g.name} className="flex items-center justify-between gap-3 border-grey-300 px-4 py-2 text-sm md:border-b">
                <span className="flex items-center gap-2">
                  <Icon name={g.ok ? 'checkCircle' : 'alert'} size={16} />
                  {g.name}
                </span>
                <span className="nums font-bold">{g.actual}</span>
              </li>
            ))}
          </ul>
        </Card>
        <p className="mt-3 nums text-xs text-grey-600">Source fingerprint (SHA-256) {DATA.meta.fingerprint}</p>
      </Section>

      <Drawer open={drawer} onClose={() => setDrawer(false)} eyebrow="Ghat detail · preview" title={GHAT_BY_ID.get('BAI')!.name}>
        <SectionTitle eyebrow="Why this rank" title={`#${bai.rank} of 7 · score ${bai.score}`} lede="The full detail panel is built in Phase 6." />
        <ul className="mt-6 space-y-3">
          {bai.reasons.map((r) => (
            <li key={r.code} className="brut-sm bg-white p-4">
              <p>{reasonText(r, lang)}</p>
              {r.evidence.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.evidence.slice(0, 6).map((id) => {
                    const rd = READING_BY_ID.get(id)!
                    return <VerifyLink key={id} year={rd.year} page={rd.page} />
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Drawer>
    </motion.main>
  )
}
