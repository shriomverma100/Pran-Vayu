import DesignSystem from './components/DesignSystem'
import { useSmoothScroll } from './lib/useSmoothScroll'

// Phase 4: the design system reference. Phase 5 adds the opening animation
// and the platform shell; the reference stays available at #design.
export default function App() {
  useSmoothScroll()
  return <DesignSystem />
}
