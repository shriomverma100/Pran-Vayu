import type { GhatInfo } from '../core/constants'
import type { Reading } from '../core/types'
import type { Lang } from '../i18n'
import type { StringKey } from '../i18n/strings'

type T = (key: StringKey, vars?: Record<string, string | number>) => string

export const ghatName = (g: GhatInfo, lang: Lang) => (lang === 'hi' ? g.nameHi : g.name)

export const testLabel = (r: Pick<Reading, 'year' | 'festival' | 'phase'>, t: T) =>
  `${r.year} ${t(`festival.${r.festival}` as StringKey)} · ${t(`phase.${r.phase}` as StringKey)}`

export const paramLabel = (p: string, t: T) => {
  const key = `param.${p}` as StringKey
  const label = t(key)
  return label === key ? p : label
}

/** A reading's value as shown: number + unit, BDL/ND as printed, or a dash when missing. */
export function valueLabel(r: Reading): string {
  if (r.kind === 'measured') return r.unit ? `${r.value} ${r.unit}` : String(r.value)
  if (r.kind === 'below-detection') return r.printed
  return '—'
}

/** Number only, for tight cells. */
export function valueShort(r: Reading | undefined): string {
  if (!r) return ''
  if (r.kind === 'measured') return String(r.value)
  if (r.kind === 'below-detection') return r.printed
  return ''
}
