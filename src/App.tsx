import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import DesignSystem from './components/DesignSystem'
import { IntroSplash, shouldPlayIntro } from './components/shell/IntroSplash'
import { Footer, Header, UtilityBar } from './components/shell/Shell'
import { EASE_OUT } from './components/ui/motion'
import { Tabs } from './components/ui/Tabs'
import { Drawer } from './components/ui/Drawer'
import { GhatDetail } from './components/views/GhatDetail'
import { Ghats } from './components/views/Ghats'
import { Overview } from './components/views/Overview'
import { Plan } from './components/views/Plan'
import { Reports } from './components/views/Reports'
import { PrintRoute } from './components/print/PrintRoute'
import { GHAT_BY_ID, SCORE_BY_ID } from './data'
import { ghatName } from './lib/labels'
import { useLang } from './i18n'
import { useHashRoute, type TabId } from './lib/useHashRoute'
import { useSmoothScroll } from './lib/useSmoothScroll'

export default function App() {
  useSmoothScroll()
  const { lang, t } = useLang()
  const [route, go] = useHashRoute()
  const [intro, setIntro] = useState(() => route.tab !== 'design' && shouldPlayIntro())
  const brandRef = useRef<HTMLSpanElement>(null)

  if (route.tab === 'design') return <DesignSystem />
  if (route.tab === 'print') return <PrintRoute doc={route.detail} />
  const tab = route.tab as TabId
  const openGhat = (id: string) => go(tab, id)
  const detail = route.detail && GHAT_BY_ID.has(route.detail) ? route.detail : null

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
            {tab === 'overview' && <Overview onOpen={openGhat} />}
            {tab === 'ghats' && <Ghats onOpen={openGhat} />}
            {tab === 'plan' && <Plan />}
            {tab === 'reports' && <Reports onPlan={() => go('plan')} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      <Drawer
        open={!!detail}
        onClose={() => go(tab)}
        eyebrow={detail ? t('dt.eyebrow', { rank: SCORE_BY_ID.get(detail)!.rank }) : ''}
        title={detail ? ghatName(GHAT_BY_ID.get(detail)!, lang) : ''}
      >
        {detail && <GhatDetail ghatId={detail} />}
      </Drawer>

      <AnimatePresence>{intro && <IntroSplash targetRef={brandRef} onDone={() => setIntro(false)} />}</AnimatePresence>
    </>
  )
}
