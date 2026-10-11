import type { GhatInfo } from '../core/constants'
import type { GhatScore } from '../core/scoring'
import { translate, type Lang } from '../i18n'
import { ACTION_TEXT, reasonText } from '../i18n/reasons'
import { ghatName } from './labels'

/**
 * The brief as a short plain-text message for WhatsApp. Built from the same
 * scores as the screens and the PDF, never typed by hand.
 */
export function briefMessage(lang: Lang, scores: GhatScore[], ghats: Map<string, GhatInfo>): string {
  const t = (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => translate(lang, k, v)
  const top = scores.slice(0, 3).map((s) => {
    const g = ghats.get(s.ghatId)!
    return `${s.rank}. ${ghatName(g, lang)}: ${ACTION_TEXT[lang][s.action].title}. ${reasonText(s.reasons[0], lang)}`
  })
  const blind = scores.filter((s) => s.blindSpot.latestDurgaMissing).map((s) => ghatName(ghats.get(s.ghatId)!, lang))
  return [
    `*${t('wa.head')}*`,
    t('wa.basis'),
    '',
    `*${t('wa.act')}*`,
    ...top,
    '',
    blind.length ? t('wa.blind', { list: blind.join(', ') }) : '',
    t('wa.limits'),
  ]
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .join('\n')
    .trim()
}
