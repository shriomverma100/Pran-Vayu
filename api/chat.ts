// प्राण-वायु assistant: Vercel serverless function.
//
// Provider: Claude (Anthropic) when ANTHROPIC_API_KEY is set, otherwise Groq
// when GROQ_API_KEY is set. Keys live only in the Vercel project's environment
// variables, never in the code and never in the browser.
//
// The browser sends the conversation (OpenAI-style chat messages) and a
// plain-text summary of the checked data; this function adds the fixed rules
// and the tool definitions, calls the model, and returns one assistant message
// in the same format. Tools run in the officer's browser (open a ghat, plan
// resources, download a report...).

import Anthropic from '@anthropic-ai/sdk'

const CLAUDE_MODEL = 'claude-opus-5-5'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'openai/gpt-oss-120b'
const MAX_CONTEXT_CHARS = 60_000
const MAX_MESSAGES = 40

const RULES = `You are the assistant inside प्राण-वायु, a planning tool for the Bhopal Municipal Corporation officer who prepares Durga visarjan on Tuesday 20 October 2026. The officer is busy and may not be technical.

How to answer:
- Use only the platform data given below. Every number must come from it, copied exactly. Counts read "X of Y tests" with X the smaller number, as in the data.
- The data uses shorthand: 23G = 2023 Ganesh, 24D = 2024 Durga, values are before/during/one week after, p26 = page 26 of that year's report. Never copy the shorthand into your answer: write "2023 Ganesh, during: 4.5 mg/l (2023 report, p.26)". The page belongs to the year of that reading.
- A test that is missing is "not tested", never clean or safe.
- Never call water safe or unsafe, and make no health claims: the reports contain no bacteria tests. Say only whether a reading meets or breaks the CPCB Class B (outdoor bathing) limit.
- In Hindi, write ghat as घाट and use the Hindi ghat names from the data.
- Reply in the language the officer writes in (Hindi or English). Keep answers short: a few lines or a short list, unless asked for detail. Use plain words; say "organic waste (BOD)" rather than only "BOD". Do not use markdown tables.
- If a question needs information the platform does not have (weather, crowds, other cities, today's water before any reading is entered), say so plainly.

Doing things for the officer:
- When the officer asks you to do something the tools can do (open a ghat, plan aerators and teams, download a report, switch language, go to a step), call the tool rather than describing how to do it.
- When asked where to send resources, call plan_resources; the platform shows its result to the officer.`

interface ToolSpec {
  name: string
  description: string
  properties: Record<string, unknown>
  required: string[]
}

const TOOL_SPECS: ToolSpec[] = [
  { name: 'open_ghat', description: "Open one ghat's evidence panel: its action, reasons, score, every reading and report page.", properties: { ghat_id: { type: 'string', enum: ['BAI', 'MAL', 'SHA', 'RKP', 'KHA', 'HAT', 'PRE'] } }, required: ['ghat_id'] },
  {
    name: 'plan_resources',
    description: 'Assign the given number of aerators and MPPCB sampling teams to ghats with the platform allocator, show it on the Send teams screen, and show the assignments with reasons to the officer.',
    properties: { aerators: { type: 'integer', description: 'Number of aerators, 0 to 10' }, teams: { type: 'integer', description: 'Number of sampling teams, 0 to 10' } },
    required: ['aerators', 'teams'],
  },
  {
    name: 'download_report',
    description: 'Download a ready PDF: the visarjan risk brief (one page English, one page Hindi), the ghat profiles, or the method and limits document.',
    properties: { report: { type: 'string', enum: ['brief', 'ghat_profiles', 'method'] }, language: { type: 'string', enum: ['en', 'hi'] } },
    required: ['report', 'language'],
  },
  { name: 'go_to', description: 'Show a screen of the platform.', properties: { screen: { type: 'string', enum: ['what_to_do', 'send_teams', 'test_on_20_oct', 'update', 'evidence', 'reports'] } }, required: ['screen'] },
  { name: 'set_language', description: 'Switch the whole platform to English or Hindi.', properties: { language: { type: 'string', enum: ['en', 'hi'] } }, required: ['language'] },
]

type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } }
type ChatMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string }
type Reply = { message: { role: 'assistant'; content: string; tool_calls?: ToolCall[] }; finish_reason: string }

class HttpError extends Error {
  constructor(
    public code: number,
    public body: Record<string, unknown>,
  ) {
    super(String(code))
  }
}

// ---------------------------------------------------------------------------
// Claude
// ---------------------------------------------------------------------------

/** Chat messages → Claude messages: tool calls become tool_use blocks, tool messages become tool_result blocks. */
function toClaudeMessages(messages: ChatMessage[]): Anthropic.Beta.BetaMessageParam[] {
  const out: Anthropic.Beta.BetaMessageParam[] = []
  for (const m of messages) {
    if (m.role === 'user') out.push({ role: 'user', content: m.content })
    else if (m.role === 'assistant') {
      const blocks: Anthropic.Beta.BetaContentBlockParam[] = []
      if (m.content) blocks.push({ type: 'text', text: m.content })
      for (const c of m.tool_calls ?? []) {
        let input: Record<string, unknown> = {}
        try {
          input = JSON.parse(c.function.arguments || '{}')
        } catch {
          input = {}
        }
        blocks.push({ type: 'tool_use', id: c.id, name: c.function.name, input })
      }
      if (blocks.length) out.push({ role: 'assistant', content: blocks })
    } else {
      const result: Anthropic.Beta.BetaToolResultBlockParam = { type: 'tool_result', tool_use_id: m.tool_call_id, content: m.content }
      const last = out[out.length - 1]
      // Results of one turn's tool calls go back together in a single user message.
      if (last?.role === 'user' && Array.isArray(last.content) && last.content.every((b) => b.type === 'tool_result')) last.content.push(result)
      else out.push({ role: 'user', content: [result] })
    }
  }
  return out
}

async function askClaude(key: string, messages: ChatMessage[], context: string): Promise<Reply> {
  const client = new Anthropic({ apiKey: key })
  try {
    const response = await client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: RULES },
        { type: 'text', text: `Platform data (checked at build):\n${context}`, cache_control: { type: 'ephemeral' } },
      ],
      tools: TOOL_SPECS.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: { type: 'object' as const, properties: t.properties, required: t.required, additionalProperties: false },
        strict: true,
      })),
      messages: toClaudeMessages(messages),
    })
    if (response.stop_reason === 'refusal') return { message: { role: 'assistant', content: '' }, finish_reason: 'refusal' }
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()
    const toolCalls: ToolCall[] = response.content
      .filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')
      .map((b) => ({ id: b.id, type: 'function', function: { name: b.name, arguments: JSON.stringify(b.input ?? {}) } }))
    return { message: { role: 'assistant', content: text, ...(toolCalls.length ? { tool_calls: toolCalls } : {}) }, finish_reason: response.stop_reason ?? 'end_turn' }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) throw new HttpError(503, { error: 'not_configured' })
    if (err instanceof Anthropic.RateLimitError) throw new HttpError(429, { error: 'busy' })
    if (err instanceof Anthropic.APIError) throw new HttpError(502, { error: 'upstream', status: err.status })
    throw err
  }
}

// ---------------------------------------------------------------------------
// Groq (used only when no Anthropic key is set)
// ---------------------------------------------------------------------------

async function askGroq(key: string, messages: ChatMessage[], context: string): Promise<Reply> {
  const r = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: `${RULES}\n\nPlatform data (checked at build):\n${context}` }, ...messages],
      tools: TOOL_SPECS.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: { type: 'object', properties: t.properties, required: t.required, additionalProperties: false } } })),
      tool_choice: 'auto',
      temperature: 0.1,
      max_completion_tokens: 900,
      reasoning_effort: 'low',
    }),
  })
  if (r.status === 401 || r.status === 403) throw new HttpError(503, { error: 'not_configured' })
  if (r.status === 429) throw new HttpError(429, { error: 'busy' })
  if (!r.ok) throw new HttpError(502, { error: 'upstream', status: r.status })
  const data = (await r.json()) as { choices: { message: { content: string | null; tool_calls?: ToolCall[] }; finish_reason: string }[] }
  const choice = data.choices?.[0]
  if (!choice) throw new HttpError(502, { error: 'upstream' })
  const { content, tool_calls } = choice.message
  return { message: { role: 'assistant', content: content ?? '', ...(tool_calls?.length ? { tool_calls } : {}) }, finish_reason: choice.finish_reason }
}

// ---------------------------------------------------------------------------

interface Req {
  method?: string
  body?: { messages?: ChatMessage[]; context?: string }
}
interface Res {
  status(code: number): Res
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

const ROLES = new Set(['user', 'assistant', 'tool'])

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  const claudeKey = process.env.ANTHROPIC_API_KEY
  const groqKey = process.env.GROQ_API_KEY
  if (!claudeKey && !groqKey) return res.status(503).json({ error: 'not_configured' })

  const messages = req.body?.messages
  const context = req.body?.context
  if (!Array.isArray(messages) || !messages.length || typeof context !== 'string' || !messages.every((m) => m && ROLES.has(m.role)))
    return res.status(400).json({ error: 'bad_request' })
  if (messages.length > MAX_MESSAGES || context.length > MAX_CONTEXT_CHARS) return res.status(413).json({ error: 'too_long' })

  try {
    const reply = claudeKey ? await askClaude(claudeKey, messages, context) : await askGroq(groqKey!, messages, context)
    return res.status(200).json(reply)
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.code).json(err.body)
    return res.status(500).json({ error: 'server' })
  }
}
