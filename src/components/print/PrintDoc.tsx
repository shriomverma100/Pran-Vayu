import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { DATA } from '../../data'
import { useLang } from '../../i18n'
import { BrandName } from '../shell/Shell'
import { Emblems } from '../ui/Emblems'

// The प्राण-वायु document template. Every printed page and every PDF uses it:
// emblems and the name in the header, a heavy rule, the document title and
// reference, brutalist content, and a footer with sources, the source
// fingerprint, credits and page number.

const today = (lang: string) =>
  new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

export function PrintPage({ title, docRef, page, total, children }: { title: string; docRef: string; page: number; total: number; children: ReactNode }) {
  const { lang, t } = useLang()
  return (
    <section className="print-page relative mx-auto flex h-[297mm] w-[210mm] flex-col bg-white px-[14mm] pt-[11mm] pb-[9mm] text-ink">
      <header className="flex items-center justify-between border-b-[3px] border-ink pb-3">
        <div className="flex items-center gap-4">
          <Emblems height={40} />
          <span className="h-10 w-[2.5px] bg-ink" />
          <div>
            <BrandName className="text-[2rem]" />
            <p className="eyebrow mt-1 !text-[0.62rem]">{t('shell.tagline')}</p>
          </div>
        </div>
        <div className="text-right text-[0.7rem] leading-snug">
          <p className="font-extrabold">{docRef}</p>
          <p>{today(lang)}</p>
        </div>
      </header>
      <h1 className="mt-4 border-l-[6px] border-orange pl-3 text-[1.35rem] leading-tight font-extrabold">{title}</h1>
      <div className="mt-4 flex-1 overflow-hidden">{children}</div>
      <footer className="mt-3 border-t-2 border-ink pt-2 text-[0.6rem] leading-snug text-grey-700">
        <div className="flex justify-between gap-4">
          <p>{t('footer.data')}</p>
          <p className="shrink-0 font-bold text-ink">{t('print.page', { n: page, total })}</p>
        </div>
        <p className="nums mt-0.5">{t('print.generated', { date: today(lang), fp: DATA.meta.fingerprint.slice(0, 16) + '…' })}</p>
        <p className="mt-0.5">{t('footer.built')} · {t('footer.licence')}</p>
      </footer>
    </section>
  )
}

/**
 * Print a document built from PrintPage elements. The pages render into a
 * portal that only shows in print; the app hides while printing.
 */
export function usePrintDoc() {
  const [doc, setDoc] = useState<ReactNode>(null)
  const print = useCallback((pages: ReactNode) => setDoc(pages), [])
  useEffect(() => {
    if (!doc) return
    document.body.dataset.printing = '1'
    const done = () => {
      delete document.body.dataset.printing
      setDoc(null)
    }
    window.addEventListener('afterprint', done, { once: true })
    // Wait one frame so the pages are in the DOM before the print dialog opens.
    const id = requestAnimationFrame(() => requestAnimationFrame(() => window.print()))
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('afterprint', done)
    }
  }, [doc])
  const node = doc ? createPortal(<div className="print-root">{doc}</div>, document.body) : null
  return { print, node }
}
