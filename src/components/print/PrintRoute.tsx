import { useEffect } from 'react'
import { BriefDoc, GhatReportsDoc, MethodDoc } from './Docs'

export const DOCS = ['brief', 'ghats', 'method'] as const
export type DocId = (typeof DOCS)[number]

/**
 * #print/<doc>: the document alone, A4 pages on grey for preview. The PDF
 * builder (scripts/build-pdfs.ts) opens this route and prints it to PDF.
 */
export function PrintRoute({ doc }: { doc?: string }) {
  useEffect(() => {
    document.body.classList.add('print-route')
    return () => document.body.classList.remove('print-route')
  }, [])
  return (
    <div className="flex flex-col items-center gap-6 bg-grey-300 py-6 print:block print:gap-0 print:bg-white print:py-0 [&_.print-page]:shadow-brut-lg print:[&_.print-page]:shadow-none">
      {doc === 'ghats' ? <GhatReportsDoc /> : doc === 'method' ? <MethodDoc /> : <BriefDoc />}
      <span id="print-ready" />
    </div>
  )
}
