// प्राण-वायु assistant: Vercel serverless function, using Groq.
//
// The browser sends the conversation and a plain-text summary of the checked
// data; this function adds the fixed rules and the tool definitions and calls
// Groq's OpenAI-compatible chat completions API. Tools run in the officer's
// browser (open a ghat, plan resources, download a report...), so tool calls
// are returned to the client, which runs them and sends the results back.
//
// The key is read from the GROQ_API_KEY environment variable set in the
// Vercel project. It is never in the code and never sent to the browser.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
// Only the strongest model answers: in testing, smaller fallback models
// misread the data, so on a rate limit the officer is asked to retry instead.
const MODELS = ['openai/gpt-oss-120b']
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
- When the officer asks you to do something the tools can do (open a ghat, plan aerators and teams, download a report, switch language, go to a step), call the tool rather than describing how to do it. After a tool runs, say in one line what you did and what it shows.
- When asked where to send resources, call plan_resources and explain its result.`

const fn = (name: string, description: string, properties: Record<string, unknown>, required: string[]) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required, additionalProperties: false } },
})

const TOOLS = [
  fn('open_ghat', "Open one ghat's evidence panel: its action, reasons, score, every reading and report page.", { ghat_id: { type: 'string', enum: ['BAI', 'MAL', 'SHA', 'RKP', 'KHA', 'HAT', 'PRE'] } }, ['ghat_id']),
  fn(
    'plan_resources',
    'Assign the given number of aerators and MPPCB sampling teams to ghats with the platform allocator, show it on the Send teams screen, and return the assignments with reasons.',
    { aerators: { type: 'integer', minimum: 0, maximum: 10 }, teams: { type: 'integer', minimum: 0, maximum: 10 } },
    ['aerators', 'teams'],
  ),
  fn(
    'download_report',
    'Download a ready PDF: the visarjan risk brief (one page English, one page Hindi), the ghat profiles, or the method and limits document.',
    { report: { type: 'string', enum: ['brief', 'ghat_profiles', 'method'] }, language: { type: 'string', enum: ['en', 'hi'] } },
    ['report', 'language'],
  ),
  fn('go_to', 'Show a screen of the platform.', { screen: { type: 'string', enum: ['what_to_do', 'send_teams', 'test_on_20_oct', 'update', 'evidence', 'reports'] } }, ['screen']),
  fn('set_language', 'Switch the whole platform to English or Hindi.', { language: { type: 'string', enum: ['en', 'hi'] } }, ['language']),
]

type ChatMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[] }
  | { role: 'tool'; tool_call_id: string; content: string }

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
  const key = process.env.GROQ_API_KEY
  if (!key) return res.status(503).json({ error: 'not_configured' })

  const messages = req.body?.messages
  const context = req.body?.context
  if (!Array.isArray(messages) || !messages.length || typeof context !== 'string' || !messages.every((m) => m && ROLES.has(m.role)))
    return res.status(400).json({ error: 'bad_request' })
  if (messages.length > MAX_MESSAGES || context.length > MAX_CONTEXT_CHARS) return res.status(413).json({ error: 'too_long' })

  try {
    let r: Response | null = null
    for (const model of MODELS) {
      r = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: `${RULES}\n\nPlatform data (checked at build):\n${context}` }, ...messages],
          tools: TOOLS,
          tool_choice: 'auto',
          temperature: 0.1,
          max_completion_tokens: 900,
          ...(model.startsWith('openai/') ? { reasoning_effort: 'low' } : {}),
        }),
      })
      if (r.status !== 429 && r.status < 500) break
    }
    if (!r) return res.status(502).json({ error: 'upstream' })
    if (r.status === 401 || r.status === 403) return res.status(503).json({ error: 'not_configured' })
    if (r.status === 429) return res.status(429).json({ error: 'busy' })
    if (!r.ok) return res.status(502).json({ error: 'upstream', status: r.status })
    const data = (await r.json()) as { choices: { message: { content: string | null; tool_calls?: ChatMessage[] }; finish_reason: string }[] }
    const choice = data.choices?.[0]
    if (!choice) return res.status(502).json({ error: 'upstream' })
    const { content, tool_calls } = choice.message
    return res.status(200).json({ message: { role: 'assistant', content: content ?? '', ...(tool_calls?.length ? { tool_calls } : {}) }, finish_reason: choice.finish_reason })
  } catch {
    return res.status(500).json({ error: 'server' })
  }
}
