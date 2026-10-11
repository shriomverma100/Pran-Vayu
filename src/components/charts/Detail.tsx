import { scaleLinear } from 'd3-scale'
import { motion, useReducedMotion } from 'motion/react'
import { FESTIVALS, PHASES, YEARS, type Parameter } from '../../core/constants'
import { readingId } from '../../core/readings'
import { displayStatus } from '../../core/status'
import { HISTOGRAM_BIN } from '../../core/statewide'
import { DATA, READING_BY_ID, reportLink } from '../../data'
import { useLang } from '../../i18n'
import type { StringKey } from '../../i18n/strings'
import { paramLabel, valueLabel } from '../../lib/labels'
import { useMeasure } from '../../lib/useMeasure'
import { STATUS_STYLE } from '../ui/Badges'
import { useChartTip } from './ChartTip'

const DOMAIN: Record<string, [number, number]> = {
  'Dissolved oxygen': [0, 12],
  BOD: [0, 24],
  pH: [6, 9.5],
}
const FILL: Record<string, string> = { severe: '#111111', breach: '#EA6A0A', within: '#FFFFFF', bdl: '#E5E5E3', 'no-limit': '#FFFFFF' }

/**
 * Six small charts, one per festival-year: before → during → after, with the
 * Class B limit. Same scale in all six. Each point opens its report page.
 */
export function TrendMultiples({ ghatId, parameter }: { ghatId: string; parameter: Parameter }) {
  const { t } = useLang()
  const reduce = useReducedMotion()
  const { bind, node } = useChartTip()
  const [ref, width, ready] = useMeasure<HTMLDivElement>(700)
  const cols = width < 520 ? 2 : 3
  const w = Math.floor((width - (cols - 1) * 12) / cols)
  const h = 150
  const pad = { l: 30, r: 12, t: 26, b: 22 }
  const [lo, hi] = DOMAIN[parameter]
  const y = scaleLinear().domain([lo, hi]).range([h - pad.b, pad.t])
  const x = scaleLinear().domain([0, 2]).range([pad.l + 14, w - pad.r - 14])
  const slots = DATA.coverage[ghatId]

  const limitBand =
    parameter === 'Dissolved oxygen'
      ? { y1: y(5), y2: y(lo), label: '5' }
      : parameter === 'BOD'
        ? { y1: y(hi), y2: y(3), label: '3' }
        : null

  return (
    <div ref={ref}>
      {ready && (<div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {YEARS.flatMap((year) =>
          FESTIVALS.map((festival) => {
            const rs = PHASES.map((phase) => READING_BY_ID.get(readingId(year, festival, ghatId, phase, parameter)))
            const noTable = slots.filter((s) => s.year === year && s.festival === festival).every((s) => s.reason === 'no-table')
            const pts = rs.map((r, i) => ({ r, i })).filter((p) => p.r && p.r.kind === 'measured') as { r: NonNullable<(typeof rs)[number]>; i: number }[]
            return (
              <div key={`${year}${festival}`} className="border-2 border-ink bg-white">
                <p className="flex items-center justify-between border-b-2 border-ink bg-grey-50 px-2 py-1 text-xs font-bold">
                  <span>
                    {year} · {t(`festival.${festival}` as StringKey)}
                  </span>
                </p>
                <svg width={w - 4} height={h} className="block overflow-visible">
                  {noTable ? (
                    <>
                      <rect x={0} y={0} width={w - 4} height={h} fill="url(#pv-hatch)" />
                      <rect x={(w - 4) / 2 - 92} y={h / 2 - 14} width={184} height={28} fill="#fff" stroke="#111" strokeWidth={1.5} />
                      <text x={(w - 4) / 2} y={h / 2} dy="0.35em" textAnchor="middle" className="fill-ink text-[11px] font-bold">
                        {t('coverage.noTable')}
                      </text>
                    </>
                  ) : (
                    <>
                      {limitBand && <rect x={pad.l} y={Math.min(limitBand.y1, limitBand.y2)} width={w - pad.l - pad.r - 4} height={Math.abs(limitBand.y2 - limitBand.y1)} fill="#FFF4EB" />}
                      {parameter === 'pH' && (
                        <>
                          <rect x={pad.l} y={y(hi)} width={w - pad.l - pad.r - 4} height={y(8.5) - y(hi)} fill="#FFF4EB" />
                          <rect x={pad.l} y={y(6.5)} width={w - pad.l - pad.r - 4} height={y(lo) - y(6.5)} fill="#FFF4EB" />
                        </>
                      )}
                      {y.ticks(4).map((v) => (
                        <g key={v}>
                          <line x1={pad.l} x2={w - pad.r - 4} y1={y(v)} y2={y(v)} stroke="#EFEFED" />
                          <text x={pad.l - 5} y={y(v)} dy="0.35em" textAnchor="end" className="nums fill-grey-500 text-[9px]">
                            {v}
                          </text>
                        </g>
                      ))}
                      {(parameter === 'pH' ? [6.5, 8.5] : [parameter === 'BOD' ? 3 : 5]).map((v) => (
                        <line key={v} x1={pad.l} x2={w - pad.r - 4} y1={y(v)} y2={y(v)} stroke="#111111" strokeWidth={1.6} />
                      ))}
                      {PHASES.map((p, i) => (
                        <text key={p} x={x(i)} y={h - 6} textAnchor="middle" className="fill-grey-600 text-[9.5px] font-semibold">
                          {t(`phase.short.${p}` as StringKey)}
                        </text>
                      ))}
                      {pts.length > 1 && (
                        <motion.polyline
                          points={pts.map((p) => `${x(p.i)},${y(p.r.value as number)}`).join(' ')}
                          fill="none"
                          stroke="#111111"
                          strokeWidth={2}
                          initial={reduce ? false : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        />
                      )}
                      {rs.map((r, i) => {
                        if (!r || r.kind === 'missing')
                          return (
                            <g key={i}>
                              <rect x={x(i) - 6} y={h - pad.b - 14} width={12} height={12} fill="url(#pv-hatch)" stroke="#111" strokeWidth={1.2} />
                              <text x={x(i)} y={h - pad.b - 18} textAnchor="middle" className="fill-grey-600 text-[8.5px]">
                                —
                              </text>
                            </g>
                          )
                        if (r.kind === 'below-detection')
                          return (
                            <text key={i} x={x(i)} y={h - pad.b - 6} textAnchor="middle" className="fill-grey-700 text-[9px] font-bold">
                              {r.printed}
                            </text>
                          )
                        const st = displayStatus(r)
                        const cy = y(Math.min(hi, Math.max(lo, r.value as number)))
                        return (
                          <a
                            key={i}
                            href={reportLink(r.year, r.page)}
                            target="_blank"
                            rel="noopener"
                            aria-label={`${valueLabel(r)}, ${t(STATUS_STYLE[st].label)}, page ${r.page}`}
                            {...bind(
                                <span>
                                  <b>{valueLabel(r)}</b> · {t(STATUS_STYLE[st].label)}
                                  <br />
                                  {t(`phase.${r.phase}` as StringKey)}
                                  <br />
                                  <span className="text-grey-300">{t('ui.verify.page', { report: DATA.meta.reports[r.year].title, page: r.page })}</span>
                                </span>,
                            )}
                          >
                            <g>
                              <circle cx={x(i)} cy={cy} r={11} fill="transparent" />
                              <circle cx={x(i)} cy={cy} r={5.5} fill={FILL[st]} stroke="#111111" strokeWidth={2} />
                              <text x={x(i)} y={cy - 10} textAnchor="middle" className="nums fill-ink text-[10px] font-bold">
                                {r.value}
                              </text>
                            </g>
                          </a>
                        )
                      })}
                    </>
                  )}
                </svg>
              </div>
            )
          }),
        )}
      </div>)}
      <svg width="0" height="0" className="absolute">
        <defs>
          <pattern id="pv-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="#F0F0EE" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="#8A8A88" strokeWidth="2" />
          </pattern>
        </defs>
      </svg>
      <p className="mt-2 text-xs text-grey-600">
        {paramLabel(parameter, t)} · {t(`param.limit.${parameter}` as StringKey)} · {parameter === 'pH' ? '' : 'mg/l · '}
        {t('ui.verify')}
      </p>
      {node}
    </div>
  )
}

/** All comparable MP oxygen readings as a grey histogram; this ghat's typical value in orange. */
export function StatewideStrip({ ghatId }: { ghatId: string }) {
  const { t } = useLang()
  const [ref, width, ready] = useMeasure<HTMLDivElement>(700)
  const sum = DATA.statewide.summary
  const cmp = DATA.statewide.ghats.find((g) => g.ghatId === ghatId)!
  const h = 120
  const pad = { l: 8, r: 8, t: 22, b: 22 }
  const bins = sum.histogram
  const x = scaleLinear().domain([0, 15]).range([pad.l, width - pad.r])
  const y = scaleLinear().domain([0, Math.max(...bins)]).range([h - pad.b, pad.t])
  const bw = x(HISTOGRAM_BIN) - x(0)

  return (
    <div ref={ref}>
      {ready && (<svg width={width} height={h} className="block overflow-visible" role="img" aria-label={t('dt.statewide.text', { median: cmp.median, share: Math.round(cmp.worseThanShare * 100), n: sum.readings })}>
        <rect x={x(0)} y={pad.t} width={x(5) - x(0)} height={h - pad.t - pad.b} fill="#FFF4EB" />
        {bins.map((c, i) =>
          i * HISTOGRAM_BIN < 15 ? <rect key={i} x={x(i * HISTOGRAM_BIN) + 1} y={y(c)} width={Math.max(1, bw - 2)} height={h - pad.b - y(c)} fill="#BDBDBB" /> : null,
        )}
        <line x1={x(5)} x2={x(5)} y1={pad.t - 4} y2={h - pad.b} stroke="#111111" strokeWidth={2} />
        <line x1={x(cmp.median)} x2={x(cmp.median)} y1={pad.t - 10} y2={h - pad.b} stroke="#EA6A0A" strokeWidth={3} />
        <text x={x(cmp.median)} y={pad.t - 13} textAnchor="middle" className="fill-orange-deep text-[11px] font-extrabold">
          {t('dt.medianLine', { v: cmp.median })}
        </text>
        <line x1={pad.l} x2={width - pad.r} y1={h - pad.b} y2={h - pad.b} stroke="#111111" />
        {[0, 2.5, 5, 7.5, 10, 12.5, 15].map((v) => (
          <text key={v} x={x(v)} y={h - 6} textAnchor="middle" className="nums fill-grey-600 text-[10px]">
            {v === 15 ? '15+' : v}
          </text>
        ))}
      </svg>)}
    </div>
  )
}
