import { scaleLinear } from 'd3-scale'
import { motion, useReducedMotion } from 'motion/react'
import { SLOTS_PER_GHAT } from '../../core/constants'
import { displayStatus } from '../../core/status'
import { DATA } from '../../data'
import { useLang } from '../../i18n'
import { testLabel } from '../../lib/labels'
import { STATUS_STYLE } from '../ui/Badges'
import { useChartTip } from './ChartTip'

const FILL = { severe: '#111111', breach: '#EA6A0A', within: '#FFFFFF' } as const

/**
 * Oxygen strip: every measured oxygen reading at one ghat as a dot on a
 * 0–12 mg/l line, with the 5 mg/l limit. Missing tests are counted beside it.
 */
export function OxygenStrip({ ghatId, width = 280 }: { ghatId: string; width?: number }) {
  const { t } = useLang()
  const reduce = useReducedMotion()
  const { bind, node } = useChartTip()
  const readings = DATA.readings
    .filter((r) => r.ghatId === ghatId && r.parameter === 'Dissolved oxygen' && r.kind === 'measured')
    .sort((a, b) => (a.value as number) - (b.value as number))
  const notTested = SLOTS_PER_GHAT - readings.length
  const h = 40
  const x = scaleLinear().domain([0, 12]).range([6, width - 6])
  // Light vertical spread so equal values stay visible: alternate rows by order.
  const ys = readings.map((_, i) => h / 2 + ((i % 3) - 1) * 7)

  return (
    <div className="flex items-center gap-3">
      <svg width={width} height={h + 14} className="block overflow-visible" role="img" aria-label={`Oxygen readings: ${readings.map((r) => r.value).join(', ')} mg/l`}>
        <rect x={x(0)} y={4} width={x(5) - x(0)} height={h - 8} fill="#FFF4EB" />
        <line x1={x(0)} x2={x(12)} y1={h / 2} y2={h / 2} stroke="#D4D4D2" />
        <line x1={x(5)} x2={x(5)} y1={2} y2={h - 2} stroke="#111111" strokeWidth={2} />
        {[0, 5, 10].map((v) => (
          <text key={v} x={x(v)} y={h + 11} textAnchor="middle" className="nums fill-grey-600 text-[10px]">
            {v}
          </text>
        ))}
        {readings.map((r, i) => {
          const st = displayStatus(r) as keyof typeof FILL
          return (
            <motion.circle
              key={r.id}
              cx={x(r.value as number)}
              cy={ys[i]}
              r={5}
              fill={FILL[st] ?? '#FFFFFF'}
              stroke="#111111"
              strokeWidth={1.6}
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.025, type: 'spring', stiffness: 500, damping: 24 }}
              style={{ transformOrigin: `${x(r.value as number)}px ${ys[i]}px` }}
              className="outline-none"
              {...bind(
                <span>
                  <b>{r.value} mg/l</b> · {t(STATUS_STYLE[displayStatus(r)].label)}
                  <br />
                  {testLabel(r, t)}
                  <br />
                  <span className="text-grey-300">{t('ui.verify.page', { report: DATA.meta.reports[r.year].title, page: r.page })}</span>
                </span>,
              )}
            />
          )
        })}
      </svg>
      {notTested > 0 && (
        <span className="inline-flex items-center gap-1 whitespace-nowrap border-[1.5px] border-ink bg-white text-[0.7rem] font-bold">
          <span className="hatch block h-4 w-3 border-r-[1.5px] border-ink" />
          <span className="pr-1.5">{t('gh.notTestedCount', { n: notTested })}</span>
        </span>
      )}
      {node}
    </div>
  )
}

/** Risk score 0–100 as a single-hue bar with the number. */
export function ScoreBar({ score, width = 150 }: { score: number; width?: number }) {
  const reduce = useReducedMotion()
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-4 border-[1.5px] border-ink bg-white" style={{ width }}>
        <motion.div
          className="absolute inset-y-0 left-0 bg-ink"
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </div>
      <span className="nums w-10 text-right text-base font-extrabold">{score.toFixed(1)}</span>
    </div>
  )
}

/** Rank range across the 24 scoring scenarios: bar from best to worst, dot at the main rank. */
export function RankRange({ best, worst, rank, width = 180 }: { best: number; worst: number; rank: number; width?: number }) {
  const x = scaleLinear().domain([1, 7]).range([10, width - 10])
  const stable = worst - best <= 1
  return (
    <svg width={width} height={30} className="block overflow-visible" role="img" aria-label={`Rank ${best} to ${worst}, main rank ${rank}`}>
      {[1, 2, 3, 4, 5, 6, 7].map((r) => (
        <g key={r}>
          <line x1={x(r)} x2={x(r)} y1={9} y2={21} stroke="#D4D4D2" />
          <text x={x(r)} y={30} textAnchor="middle" className="nums fill-grey-500 text-[9px]">
            {r}
          </text>
        </g>
      ))}
      <rect x={x(best) - 5} y={10} width={x(worst) - x(best) + 10} height={10} fill={stable ? '#111111' : '#FFFFFF'} stroke="#111111" strokeWidth={1.6} strokeDasharray={stable ? undefined : '3 2'} />
      <circle cx={x(rank)} cy={15} r={6} fill="#EA6A0A" stroke="#111111" strokeWidth={2} />
    </svg>
  )
}
