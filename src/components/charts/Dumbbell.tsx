import { scaleLinear } from 'd3-scale'
import { motion, useReducedMotion } from 'motion/react'
import { immersionSummary } from '../../core/derive'
import { DATA, GHAT_BY_ID } from '../../data'
import { useLang } from '../../i18n'
import type { StringKey } from '../../i18n/strings'
import { ghatName } from '../../lib/labels'
import { useMeasure } from '../../lib/useMeasure'
import { useChartTip } from './ChartTip'

const ROW = 54
const TOP = 26
const BOTTOM = 26
const MAX = 10

/**
 * Before → after immersion, per ghat: mean oxygen before (○) and mean lowest
 * oxygen during or one week after (●), over festivals that have both.
 * Names and pattern labels are HTML columns so they wrap in any language.
 */
export function Dumbbell({ onOpen }: { onOpen: (ghatId: string) => void }) {
  const { lang, t } = useLang()
  const reduce = useReducedMotion()
  const [ref, width, ready] = useMeasure<HTMLDivElement>()
  const { bind, node } = useChartTip()
  const rows = DATA.scores.map((s) => ({ s, sum: immersionSummary(s.signals.events) }))
  const x = scaleLinear().domain([0, MAX]).range([12, Math.max(200, width) - 70])
  const plotH = rows.length * ROW
  const height = TOP + plotH + BOTTOM
  const ticks = [0, 2, 4, 5, 6, 8, 10]

  return (
    <div>
      <div className="grid grid-cols-[minmax(160px,220px)_minmax(0,1fr)_minmax(150px,240px)] gap-x-4">
        {/* names */}
        <div style={{ paddingTop: TOP }}>
          {rows.map(({ s }) => (
            <button
              key={s.ghatId}
              type="button"
              onClick={() => onOpen(s.ghatId)}
              style={{ height: ROW }}
              className="flex w-full items-center text-left text-[0.86rem] leading-tight font-bold hover:text-orange-deep"
            >
              <span className="nums mr-1.5">{s.rank}.</span>
              {ghatName(GHAT_BY_ID.get(s.ghatId)!, lang)}
            </button>
          ))}
        </div>

        {/* plot */}
        <div ref={ref} className="relative min-w-0">
          {ready && (
            <svg width={width} height={height} role="img" aria-label={t('ov.dumbbell.title')} className="block overflow-visible">
              <rect x={x(0)} y={TOP - 4} width={x(5) - x(0)} height={plotH + 4} fill="#FFF4EB" />
              <text x={x(2.5)} y={TOP - 10} textAnchor="middle" className="fill-orange-deep text-[11px] font-bold">
                {t('status.breach')} · &lt; 5 mg/l
              </text>
              {ticks.map((v) => (
                <g key={v}>
                  <line x1={x(v)} x2={x(v)} y1={TOP - 4} y2={TOP + plotH} stroke={v === 5 ? '#111111' : '#E5E5E3'} strokeWidth={v === 5 ? 2 : 1} />
                  <text x={x(v)} y={TOP + plotH + 17} textAnchor="middle" className="nums fill-grey-600 text-[11px]">
                    {v}
                  </text>
                </g>
              ))}
              <text x={x(MAX) + 12} y={TOP + plotH + 17} className="fill-grey-600 text-[11px]">
                mg/l
              </text>

              {rows.map(({ s, sum }, i) => {
                const g = GHAT_BY_ID.get(s.ghatId)!
                const cy = TOP + i * ROW + ROW / 2
                const b = sum.meanBefore
                const a = sum.meanLowestAfter
                if (b === null || a === null) return null
                const tip = (
                  <span className="block">
                    <b>{ghatName(g, lang)}</b>
                    <br />
                    {t('ov.dumbbell.before')}: {b} mg/l
                    <br />
                    {t('ov.dumbbell.after')}: {a} mg/l
                    <br />
                    <span className="text-grey-300">{t('ov.dumbbell.events', { n: sum.events })}</span>
                  </span>
                )
                const ease = { duration: 0.9, delay: 0.25 + i * 0.07, ease: [0.22, 1, 0.36, 1] as const }
                return (
                  <g key={s.ghatId} className="cursor-pointer outline-none" onClick={() => onOpen(s.ghatId)} role="button" aria-label={`${ghatName(g, lang)}: ${b} → ${a} mg/l`} {...bind(tip)}>
                    <rect x={0} y={cy - ROW / 2} width={width} height={ROW} fill="transparent" />
                    <motion.line
                      x1={x(b)}
                      y1={cy}
                      y2={cy}
                      initial={reduce ? false : { x2: x(b) }}
                      animate={{ x2: x(a) }}
                      transition={ease}
                      stroke="#111111"
                      strokeWidth={2.5}
                    />
                    <circle cx={x(b)} cy={cy} r={7} fill="#FFFFFF" stroke="#111111" strokeWidth={2.5} />
                    <motion.circle
                      cy={cy}
                      r={7}
                      initial={reduce ? false : { cx: x(b), opacity: 0 }}
                      animate={{ cx: x(a), opacity: 1 }}
                      transition={ease}
                      fill={a < 5 ? '#EA6A0A' : '#111111'}
                      stroke="#111111"
                      strokeWidth={2}
                    />
                    <text x={x(Math.max(a, b))} dx={14} y={cy} dy="0.35em" className="nums fill-grey-700 text-[11px] font-semibold">
                      {b} → {a}
                    </text>
                  </g>
                )
              })}
            </svg>
          )}
        </div>

        {/* pattern */}
        <div style={{ paddingTop: TOP }}>
          {rows.map(({ s }) => (
            <p key={s.ghatId} style={{ height: ROW }} className="flex items-center text-[0.8rem] leading-snug font-semibold text-grey-800">
              {t(`pattern.${s.signals.pattern}` as StringKey)}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-5 text-xs text-grey-700">
        <span className="inline-flex items-center gap-2">
          <svg width="16" height="16" aria-hidden>
            <circle cx="8" cy="8" r="6" fill="#fff" stroke="#111" strokeWidth="2.5" />
          </svg>
          {t('ov.dumbbell.before')}
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="16" height="16" aria-hidden>
            <circle cx="8" cy="8" r="6" fill="#EA6A0A" stroke="#111" strokeWidth="2" />
          </svg>
          {t('ov.dumbbell.after')} · {t('status.breach')}
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="16" height="16" aria-hidden>
            <circle cx="8" cy="8" r="6" fill="#111" />
          </svg>
          {t('ov.dumbbell.after')} · {t('status.within')}
        </span>
      </div>
      {node}
    </div>
  )
}
