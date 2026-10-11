import emblemIndia from '../../assets/brand/emblem-india.svg'
import emblemMp from '../../assets/brand/emblem-mp.svg'

// The BMC logo is optional: drop bmc-logo.svg or bmc-logo.png into
// src/assets/brand/ and it is picked up at build time.
const bmcFiles = import.meta.glob<string>('../../assets/brand/bmc-logo.{svg,png}', { eager: true, query: '?url', import: 'default' })
const bmcLogo = Object.values(bmcFiles)[0]

interface EmblemsProps {
  height?: number
  /** Separator rules between emblems */
  divided?: boolean
}

/** Ashoka emblem · MP Government emblem · BMC logo (when provided), in their official colours. */
export function Emblems({ height = 44, divided = true }: EmblemsProps) {
  const items = [
    { src: emblemIndia, alt: 'State Emblem of India' },
    { src: emblemMp, alt: 'Emblem of the Government of Madhya Pradesh' },
    ...(bmcLogo ? [{ src: bmcLogo, alt: 'Bhopal Municipal Corporation' }] : []),
  ]
  return (
    <div className="flex items-center gap-3">
      {items.map((e, i) => (
        <div key={e.src} className="flex items-center gap-3">
          {divided && i > 0 && <span className="h-8 w-[2px] bg-ink/80" aria-hidden />}
          <img src={e.src} alt={e.alt} style={{ height }} className="w-auto object-contain" draggable={false} />
        </div>
      ))}
    </div>
  )
}

export const HAS_BMC_LOGO = Boolean(bmcLogo)
