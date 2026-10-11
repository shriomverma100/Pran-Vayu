import { useState } from 'react'
import { FESTIVALS, PHASES, YEARS, type Parameter } from '../../core/constants'
import { readingId } from '../../core/readings'
import { displayStatus, type DisplayStatus } from '../../core/status'
import { DATA, GHAT_BY_ID, READING_BY_ID } from '../../data'
import { useLang } from '../../i18n'
import type { StringKey } from '../../i18n/strings'
import { ghatName, paramLabel, testLabel, valueLabel, valueShort } from '../../lib/labels'
import { Icon } from '../icons'
import { STATUS_STYLE, StatusChip } from '../ui/Badges'
import { Segmented } from '../ui/Tabs'
import { Tooltip } from '../ui/Tooltip'

const PARAMS: Parameter[] = ['Dissolved oxygen', 'BOD', 'pH']
const LEGEND: DisplayStatus[] = ['severe', 'breach', 'within', 'not-tested', 'bdl']

/**
 * Ghat × test matrix: 7 ghats (rank order) × 18 tests (3 years × 2 festivals ×
 * before / during / after). One parameter at a time. A square with no reading
 * is striped, whether the report has no table or marks it not sampled.
 */
export function Matrix({ onOpen }: { onOpen: (ghatId: string) => void }) {
  const { lang, t } = useLang()
  const [param, setParam] = useState<Parameter>('Dissolved oxygen')

  const columns = YEARS.flatMap((year) => FESTIVALS.flatMap((festival) => PHASES.map((phase) => ({ year, festival, phase }))))

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <Segmented<Parameter>
          label="Parameter"
          value={param}
          onChange={setParam}
          options={PARAMS.map((p) => ({ id: p, label: p === 'Dissolved oxygen' ? t('param.short.Dissolved oxygen') : paramLabel(p, t) }))}
        />
        <p className="text-sm text-grey-700">
          <b>{paramLabel(param, t)}</b> · {t(`param.limit.${param}` as StringKey)} · {t(`param.plain.${param}` as StringKey)}
        </p>
      </div>

      <div className="overflow-x-auto pb-2" data-lenis-prevent-wheel>
        <div className="grid min-w-[980px]" style={{ gridTemplateColumns: `minmax(190px, 1.4fr) repeat(18, minmax(40px, 1fr))` }}>
          {/* header: years */}
          <div />
          {YEARS.map((y) => (
            <div key={y} className="col-span-6 border-l-[2.5px] border-ink bg-ink py-1 text-center text-sm font-extrabold text-white">
              {y}
            </div>
          ))}
          {/* header: festivals */}
          <div />
          {YEARS.flatMap((y) =>
            FESTIVALS.map((f, fi) => (
              <div key={`${y}${f}`} className={`col-span-3 border-b-2 border-ink py-1 text-center text-xs font-bold ${fi === 0 ? 'border-l-[2.5px]' : 'border-l-2'} border-ink bg-grey-100`}>
                {t(`festival.${f}` as StringKey)}
              </div>
            )),
          )}
          {/* header: phases */}
          <div className="flex items-end pb-1 eyebrow text-grey-600">{t('gh.col.ghat')}</div>
          {columns.map((c, i) => (
            <div key={i} className={`py-1 text-center text-[0.66rem] font-semibold text-grey-700 ${i % 3 === 0 ? (i % 6 === 0 ? 'border-l-[2.5px] border-ink' : 'border-l-2 border-ink') : ''}`}>
              {t(`phase.short.${c.phase}` as StringKey)}
            </div>
          ))}

          {/* rows */}
          {DATA.scores.map((s) => {
            const g = GHAT_BY_ID.get(s.ghatId)!
            const slots = DATA.coverage[s.ghatId]
            return [
              <button
                key={`${s.ghatId}-name`}
                type="button"
                onClick={() => onOpen(s.ghatId)}
                className="group flex items-center gap-2 border-t-2 border-ink py-2 pr-3 text-left text-sm font-bold hover:text-orange-deep"
              >
                <span className="nums grid h-6 w-6 shrink-0 place-items-center border-2 border-ink bg-white text-xs">{s.rank}</span>
                <span className="leading-tight">{ghatName(g, lang)}</span>
                <Icon name="arrowRight" size={14} className="ml-auto opacity-0 transition-opacity group-hover:opacity-100" />
              </button>,
              ...columns.map((c, i) => {
                const r = READING_BY_ID.get(readingId(c.year, c.festival, s.ghatId, c.phase, param))
                const slot = slots.find((x) => x.year === c.year && x.festival === c.festival && x.phase === c.phase)!
                const status: DisplayStatus = r ? displayStatus(r) : 'not-tested'
                const style = STATUS_STYLE[status]
                const missingReason = !r ? (slot.reason === 'no-table' ? t('coverage.noTable') : t('coverage.notSampled')) : r.kind === 'missing' ? t('status.notTested.hint') : null
                const text = valueShort(r)
                return (
                  <Tooltip
                    key={`${s.ghatId}-${i}`}
                    block
                    className={`border-t-2 border-ink ${i % 3 === 0 ? (i % 6 === 0 ? 'border-l-[2.5px]' : 'border-l-2') : 'border-l border-l-grey-300'}`}
                    content={
                      <span className="block">
                        <b>{ghatName(g, lang)}</b>
                        <br />
                        {testLabel(c, t)}
                        <br />
                        {paramLabel(param, t)}: {r ? valueLabel(r) : '—'} · {t(style.label)}
                        {missingReason && (
                          <>
                            <br />
                            {missingReason}
                          </>
                        )}
                        {r && (
                          <>
                            <br />
                            <span className="text-grey-300">
                              {DATA.meta.reports[c.year].title}, p.{r.page}
                            </span>
                          </>
                        )}
                      </span>
                    }
                  >
                    <button
                      type="button"
                      onClick={() => onOpen(s.ghatId)}
                      aria-label={`${ghatName(g, lang)}, ${testLabel(c, t)}, ${r ? valueLabel(r) : '—'}, ${t(style.label)}`}
                      className={`nums relative m-[3px] transition-transform duration-100 hover:z-10 hover:scale-110 grid h-9 w-[calc(100%-6px)] place-items-center border-[1.5px] border-ink text-[0.72rem] font-bold ${style.cell} ${
                        status === 'severe' ? 'text-white' : 'text-ink'
                      }`}
                    >
                      {text && <span className={status === 'not-tested' ? '' : ''}>{text}</span>}
                    </button>
                  </Tooltip>
                )
              }),
            ]
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {LEGEND.map((s) => (
          <StatusChip key={s} status={s} compact withHint={false} />
        ))}
        <span className="ml-1 text-xs text-grey-600">{t('ov.matrix.hint')}</span>
      </div>
    </div>
  )
}
