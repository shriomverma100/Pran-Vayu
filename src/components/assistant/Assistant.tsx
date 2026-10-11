import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { allocate } from '../../core/allocator'
import { DATA, GHAT_BY_ID } from '../../data'
import { useLang } from '../../i18n'
import type { StringKey } from '../../i18n/strings'
import { buildAssistantContext } from '../../lib/assistantContext'
import { ghatName } from '../../lib/labels'
import type { TabId } from '../../lib/useHashRoute'
import { writeStored } from '../../lib/useStoredState'
import { Icon } from '../icons'
import { SPRING_PANEL } from '../ui/motion'

// The assistant panel. Messages use the OpenAI-compatible chat format that
// Groq serves (api/chat.ts). Tool calls run here in the browser and their
// results go back as "tool" messages.

type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } }
type ApiMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string }
type Shown = { id: number; kind: 'user' | 'assistant' | 'action' | 'error'; text: string }

const SCREEN: Record<string, TabId> = {
  what_to_do: 'todo',
  send_teams: 'send',
  test_on_20_oct: 'test',
  update: 'update',
  evidence: 'evidence',
  reports: 'reports',
}
const FILES: Record<string, (lang: string) => string> = {
  brief: () => 'pdfs/pran-vayu-brief-en-hi.pdf',
  ghat_profiles: (l) => `pdfs/pran-vayu-ghat-reports-${l === 'hi' ? 'hi' : 'en'}.pdf`,
  method: (l) => `pdfs/pran-vayu-method-${l === 'hi' ? 'hi' : 'en'}.pdf`,
}

let nextId = 1

/**
 * Number check: every number in an answer must appear in the checked data
 * the assistant was given (or in the question). Small counts (0-24) and
 * years are always allowed. Returns the numbers that could not be matched.
 */
function unmatchedNumbers(answer: string, context: string, question: string): string[] {
  const known = new Set([...context.matchAll(/\d+(?:\.\d+)?/g), ...question.matchAll(/\d+(?:\.\d+)?/g)].map((m) => String(Number(m[0]))))
  const found = [...answer.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d))).matchAll(/\d+(?:\.\d+)?/g)].map((m) => String(Number(m[0])))
  return [...new Set(found)].filter((n) => !known.has(n) && !(Number(n) <= 24 && Number.isInteger(Number(n))) && !/^20[2-3]\d$/.test(n))
}

/** The last few turns, starting at a user message, to stay within the token budget. */
function recent(h: ApiMessage[]): ApiMessage[] {
  const from = Math.max(0, h.length - 8)
  const start = h.findIndex((m, i) => i >= from && m.role === 'user')
  return h.slice(start === -1 ? from : start)
}

export function Assistant({ go, openGhat }: { go: (tab: TabId, detail?: string) => void; openGhat: (id: string) => void }) {
  const { lang, setLang, t } = useLang()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState('')
  const [shown, setShown] = useState<Shown[]>([])
  const history = useRef<ApiMessage[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const context = useMemo(() => buildAssistantContext(), [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [shown, busy])
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  const show = (kind: Shown['kind'], text: string) => setShown((s) => [...s, { id: nextId++, kind, text }])

  /** Run one tool in the platform and describe the result for the model. */
  const runTool = (name: string, input: Record<string, unknown>): string => {
    if (name === 'open_ghat') {
      const id = String(input.ghat_id)
      const g = GHAT_BY_ID.get(id)
      if (!g) return 'Unknown ghat id.'
      openGhat(id)
      show('action', t('ai.did.open', { name: ghatName(g, lang) }))
      return `Opened the evidence panel for ${g.name}.`
    }
    if (name === 'plan_resources') {
      const a = Math.max(0, Math.min(10, Number(input.aerators) || 0))
      const tm = Math.max(0, Math.min(10, Number(input.teams) || 0))
      writeStored('pran-vayu:aerators', a)
      writeStored('pran-vayu:teams', tm)
      go('send')
      const plan = allocate(DATA.scores, a, tm)
      show('action', t('ai.did.plan', { a, t: tm }))
      const name = (id: string) => GHAT_BY_ID.get(id)!.name
      return JSON.stringify({
        aerators: plan.aerators.map((x) => ({ unit: x.unit, ghat: name(x.ghatId), reason: x.reason, values: x.values })),
        teams: plan.teams.map((x) => ({ unit: x.unit, ghat: name(x.ghatId), reason: x.reason, values: x.values })),
        still_needing_aeration: plan.unservedAeration.map(name),
        still_blind: plan.unservedTesting.map(name),
      })
    }
    if (name === 'download_report') {
      const file = FILES[String(input.report)]?.(String(input.language))
      if (!file) return 'Unknown report.'
      const link = document.createElement('a')
      link.href = file
      link.download = file.split('/').pop()!
      link.click()
      show('action', t('ai.did.download'))
      return `Started the download of ${file}.`
    }
    if (name === 'go_to') {
      const tab = SCREEN[String(input.screen)]
      if (!tab) return 'Unknown screen.'
      go(tab)
      show('action', t('ai.did.go'))
      return `Showing the ${String(input.screen)} screen.`
    }
    if (name === 'set_language') {
      const l = input.language === 'hi' ? 'hi' : 'en'
      setLang(l)
      show('action', l === 'hi' ? 'भाषा: हिंदी' : 'Language: English')
      return `Platform language set to ${l}.`
    }
    return 'Unknown tool.'
  }

  /** The allocation in plain words, from the allocator itself. */
  const planSummary = (a: number, tm: number) => {
    const plan = allocate(DATA.scores, Math.min(10, a), Math.min(10, tm))
    const name = (id: string) => ghatName(GHAT_BY_ID.get(id)!, lang)
    const lines = [
      ...plan.aerators.map((x) => `${t('alloc.aerator.unit', { n: x.unit })} → ${name(x.ghatId)}: ${t(`aer.${x.reason}` as StringKey, x.values)}`),
      ...plan.teams.map((x) => `${t('alloc.team.unit', { n: x.unit })} → ${name(x.ghatId)}: ${t(`test.${x.reason}` as StringKey, x.values)}`),
    ]
    if (plan.unservedAeration.length) lines.push(t('alloc.unserved.aer', { list: plan.unservedAeration.map(name).join(', ') }))
    if (plan.unservedTesting.length) lines.push(t('alloc.unserved.test', { list: plan.unservedTesting.map(name).join(', ') }))
    return lines.join('\n')
  }

  const ask = async (question: string) => {
    const q = question.trim()
    if (!q || busy) return
    setInput('')
    show('user', q)
    history.current.push({ role: 'user', content: q })
    setBusy(true)
    try {
      for (let round = 0; round < 5; round++) {
        const r = await fetch('api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: recent(history.current), context }),
        })
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          show('error', err.error === 'not_configured' ? t('ai.err.config') : r.status === 404 ? t('ai.err.local') : t('ai.err.busy'))
          history.current.pop()
          break
        }
        const data = (await r.json()) as { message: { content: string; tool_calls?: ToolCall[] }; finish_reason: string }
        const calls = data.message.tool_calls ?? []
        history.current.push({ role: 'assistant', content: data.message.content ?? '', ...(calls.length ? { tool_calls: calls } : {}) })
        const text = (data.message.content ?? '').trim()
        if (text) {
          show('assistant', text)
          const odd = unmatchedNumbers(text, context, q)
          if (odd.length) show('error', t('ai.check', { n: odd.join(', ') }))
        }
        if (!calls.length) break
        // One model call per question: the tools run here and the browser writes
        // the outcome itself (the allocation comes straight from the tested allocator).
        const summaries: string[] = []
        for (const c of calls) {
          let args: Record<string, unknown> = {}
          try {
            args = JSON.parse(c.function.arguments || '{}')
          } catch {
            args = {}
          }
          const result = runTool(c.function.name, args)
          history.current.push({ role: 'tool', tool_call_id: c.id, content: result })
          if (c.function.name === 'plan_resources') summaries.push(planSummary(Number(args.aerators) || 0, Number(args.teams) || 0))
        }
        if (summaries.length) {
          const summary = summaries.join('\n\n')
          show('assistant', summary)
          history.current.push({ role: 'assistant', content: summary })
        } else history.current.push({ role: 'assistant', content: 'Done.' })
        break
      }
    } catch {
      show('error', t('ai.err.busy'))
    } finally {
      setBusy(false)
    }
  }

  const suggestions: StringKey[] = ['ai.s1', 'ai.s2', 'ai.s3', 'ai.s4']

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.1 } }}
            transition={SPRING_PANEL}
            className="press no-print fixed right-6 bottom-6 z-40 flex items-center gap-2.5 border-[2.5px] border-ink bg-orange px-4 py-3 font-extrabold text-ink"
            aria-label={t('ai.open')}
          >
            <span className="relative grid h-7 w-7 place-items-center border-2 border-ink bg-white">
              <Icon name="spark" size={16} />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 animate-ping bg-ink" aria-hidden />
            </span>
            {t('ai.open')}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            role="dialog"
            aria-label={t('ai.title')}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.12 } }}
            transition={SPRING_PANEL}
            style={{ transformOrigin: 'bottom right' }}
            className="no-print fixed right-4 bottom-4 z-50 flex h-[min(640px,calc(100vh-2rem))] w-[min(430px,calc(100vw-2rem))] flex-col border-[2.5px] border-ink bg-paper shadow-brut-lg"
            data-lenis-prevent
          >
            <header className="flex items-center justify-between gap-3 border-b-[2.5px] border-ink bg-ink px-4 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center border-2 border-white bg-orange text-ink">
                  <Icon name="spark" size={16} />
                </span>
                <div>
                  <p className="font-extrabold leading-tight">{t('ai.title')}</p>
                  <p className="text-[0.72rem] text-grey-300">{t('ai.sub')}</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('ui.close')} className="grid h-9 w-9 place-items-center border-2 border-white transition-colors hover:bg-white hover:text-ink">
                <Icon name="close" size={18} />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
              {shown.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-grey-800">{t('ai.hello')}</p>
                  <div className="flex flex-col gap-2">
                    {suggestions.map((k, i) => (
                      <motion.button
                        key={k}
                        type="button"
                        onClick={() => ask(t(k))}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: 0.04 * i, duration: 0.16 } }}
                        className="press-xs border-2 border-ink bg-white px-3 py-2 text-left text-sm font-semibold"
                      >
                        {t(k)}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              <AnimatePresence initial={false}>
                {shown.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className={m.kind === 'user' ? 'flex justify-end' : 'flex'}
                  >
                    {m.kind === 'user' && <p className="max-w-[85%] border-2 border-ink bg-ink px-3 py-2 text-sm whitespace-pre-wrap text-white">{m.text}</p>}
                    {m.kind === 'assistant' && <p className="max-w-[92%] border-2 border-ink bg-white px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>}
                    {m.kind === 'action' && (
                      <p className="flex items-center gap-2 border-2 border-dashed border-ink bg-orange-tint px-3 py-1.5 text-xs font-bold">
                        <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 22 }} className="grid h-5 w-5 place-items-center bg-ink text-white">
                          <Icon name="check" size={12} strokeWidth={3} />
                        </motion.span>
                        {m.text}
                      </p>
                    )}
                    {m.kind === 'error' && <p className="flex items-start gap-2 border-2 border-ink bg-white px-3 py-2 text-sm"><Icon name="alert" size={16} className="mt-0.5 shrink-0" />{m.text}</p>}
                  </motion.div>
                ))}
              </AnimatePresence>
              {busy && (
                <div className="flex items-center gap-1.5 px-1 py-2" aria-label={t('ai.thinking')}>
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="block h-2.5 w-2.5 bg-ink" animate={{ y: [0, -6, 0], backgroundColor: ['#111111', '#EA6A0A', '#111111'] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }} />
                  ))}
                  <span className="ml-2 text-xs text-grey-600">{t('ai.thinking')}</span>
                </div>
              )}
            </div>

            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                ask(input)
              }}
              className="flex gap-2 border-t-[2.5px] border-ink bg-white p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('ai.placeholder')}
                className="h-11 min-w-0 flex-1 border-2 border-ink bg-paper px-3 text-sm outline-none focus-visible:outline-3 focus-visible:outline-orange"
                disabled={busy}
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label={t('ai.send')} className="press-sm grid h-11 w-11 place-items-center border-2 border-ink bg-orange disabled:opacity-40">
                <Icon name="send" size={18} />
              </button>
            </form>
            <p className="border-t border-grey-200 bg-white px-3 py-1.5 text-[0.65rem] text-grey-600">{t('ai.note')}</p>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
