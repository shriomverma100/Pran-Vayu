import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type ReactNode } from 'react'
import DesignSystem from './components/DesignSystem'
import { IntroSplash, shouldPlayIntro } from './components/shell/IntroSplash'
import { Footer, Header, UtilityBar } from './components/shell/Shell'
import { Card, SectionTitle } from './components/ui/Card'
import { EASE_OUT } from './components/ui/motion'
import { Tabs } from './components/ui/Tabs'
import { useLang } from './i18n'
import { useHashRoute, type TabId } from './lib/useHashRoute'
import { useSmoothScroll } from './lib/useSmoothScroll'

export default function App() {
  useSmoothScroll()
  const { t } = useLang()
  const [route, go] = useHashRoute()
  const [intro, setIntro] = useState(() => route.tab !== 'design' && shouldPlayIntro())
  const brandRef = useRef<HTMLSpanElement>(null)

  if (route.tab === 'design') return <DesignSystem />
  const tab = route.tab as TabId

  return (
    <>
      <UtilityBar />
      <Header ref={brandRef} brandVisible={!intro} />

      <nav className="no-print sticky top-0 z-40 border-b-[2.5px] border-ink bg-paper/90 backdrop-blur-md" aria-label="Main">
        <div className="mx-auto max-w-[1400px] px-6 pt-2">
          <Tabs<TabId>
            idPrefix="pv"
            value={tab}
            onChange={(id) => go(id)}
            items={[
              { id: 'overview', label: t('tab.overview'), icon: 'grid' },
              { id: 'ghats', label: t('tab.ghats'), icon: 'pin', badge: 7 },
              { id: 'plan', label: t('tab.plan'), icon: 'calendar' },
              { id: 'reports', label: t('tab.reports'), icon: 'receipt' },
            ]}
          />
        </div>
      </nav>

      <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] px-6 py-10 outline-none">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            role="tabpanel"
            id={`pv-panel-${tab}`}
            aria-labelledby={`pv-tab-${tab}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: EASE_OUT }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
          >
            {tab === 'overview' && <Placeholder title={t('tab.overview')} phase={6} />}
            {tab === 'ghats' && <Placeholder title={t('tab.ghats')} phase={6} />}
            {tab === 'plan' && <Placeholder title={t('tab.plan')} phase={7} />}
            {tab === 'reports' && <Placeholder title={t('tab.reports')} phase={8} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      <AnimatePresence>{intro && <IntroSplash targetRef={brandRef} onDone={() => setIntro(false)} />}</AnimatePresence>
    </>
  )
}

function Placeholder({ title, phase }: { title: ReactNode; phase: number }) {
  return (
    <div className="space-y-6">
      <SectionTitle eyebrow={`Phase ${phase}`} title={title} lede="This tab's content is built in its phase. The shell, navigation, language and text size already work." />
      <Card tone="paper" shadow="sm" className="grid min-h-48 place-items-center border-dashed p-8 text-grey-600">
        Phase {phase}
      </Card>
    </div>
  )
}
