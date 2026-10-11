import { AnimatePresence } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { IntroSplash, shouldPlayIntro } from './components/shell/IntroSplash'
import { Footer, Header, UtilityBar } from './components/shell/Shell'
import { Drawer } from './components/ui/Drawer'
import { Tabs } from './components/ui/Tabs'
import { GhatDetail } from './components/views/GhatDetail'
import { SendTeams, TestDay, UpdateDay } from './components/views/Plan'
import { WhatToDo } from './components/views/WhatToDo'
import { GHAT_BY_ID, SCORE_BY_ID } from './data'
import { useLang } from './i18n'
import { ghatName } from './lib/labels'
import { useHashRoute, type TabId } from './lib/useHashRoute'

// Heavier screens load on demand, and are fetched in the background right
// after the first paint so that opening them is instant.
const loadEvidence = () => import('./components/views/Evidence')
const loadReports = () => import('./components/views/Reports')
const loadAssistant = () => import('./components/assistant/Assistant')
const Evidence = lazy(() => loadEvidence().then((m) => ({ default: m.Evidence })))
const Reports = lazy(() => loadReports().then((m) => ({ default: m.Reports })))
const Assistant = lazy(() => loadAssistant().then((m) => ({ default: m.Assistant })))
const DesignSystem = lazy(() => import('./components/DesignSystem'))
const PrintRoute = lazy(() => import('./components/print/PrintRoute').then((m) => ({ default: m.PrintRoute })))

export default function App() {
  const { lang, t } = useLang()
  const [route, go] = useHashRoute()
  const [intro, setIntro] = useState(() => route.tab !== 'design' && route.tab !== 'print' && shouldPlayIntro())
  const brandRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const warm = () => {
      loadEvidence()
      loadReports()
      loadAssistant()
    }
    const id = window.setTimeout(warm, 250)
    return () => window.clearTimeout(id)
  }, [])

  if (route.tab === 'design')
    return (
      <Suspense fallback={null}>
        <DesignSystem />
      </Suspense>
    )
  if (route.tab === 'print')
    return (
      <Suspense fallback={null}>
        <PrintRoute doc={route.detail} />
      </Suspense>
    )

  const tab = route.tab as TabId
  const openGhat = (id: string) => go(tab, id)
  const detail = route.detail && GHAT_BY_ID.has(route.detail) ? route.detail : null

  return (
    <>
      <UtilityBar />
      <Header ref={brandRef} brandVisible={!intro} />

      <nav className="no-print sticky top-0 z-40 border-b-[2.5px] border-ink bg-paper" aria-label="Main">
        <div className="mx-auto max-w-[1400px] px-6 pt-2">
          <Tabs<TabId>
            idPrefix="pv"
            value={tab}
            onChange={(id) => go(id)}
            items={[
              { id: 'todo', label: t('step.1'), step: 1 },
              { id: 'send', label: t('step.2'), step: 2 },
              { id: 'test', label: t('step.3'), step: 3 },
              { id: 'update', label: t('step.4'), step: 4 },
              { id: 'evidence', label: t('tab.evidence'), icon: 'verify', gapBefore: true },
              { id: 'reports', label: t('tab.reports'), icon: 'receipt' },
            ]}
          />
        </div>
      </nav>

      <main id="main" tabIndex={-1} className="mx-auto min-h-[60vh] max-w-[1400px] px-6 py-10 outline-none">
        <div key={tab} role="tabpanel" id={`pv-panel-${tab}`} aria-labelledby={`pv-tab-${tab}`} className="tab-enter">
          <Suspense fallback={null}>
            {tab === 'todo' && <WhatToDo onOpen={openGhat} onGo={(id) => go(id)} />}
            {tab === 'send' && <SendTeams onNext={() => go('test')} />}
            {tab === 'test' && <TestDay onNext={() => go('update')} />}
            {tab === 'update' && <UpdateDay onNext={() => go('todo')} />}
            {tab === 'evidence' && <Evidence onOpen={openGhat} />}
            {tab === 'reports' && <Reports onPlan={() => go('send')} />}
          </Suspense>
        </div>
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

      {!intro && (
        <Suspense fallback={null}>
          <Assistant go={go} openGhat={openGhat} />
        </Suspense>
      )}

      <AnimatePresence>{intro && <IntroSplash targetRef={brandRef} onDone={() => setIntro(false)} />}</AnimatePresence>
    </>
  )
}
