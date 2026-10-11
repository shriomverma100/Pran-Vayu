// प्राण-वायु assistant: Vercel serverless function.
//
// The browser sends the conversation and the platform's data summary; this
// function adds the fixed rules and the tool definitions and calls Claude.
// Tools run in the officer's browser (open a ghat, plan resources, download a
// report...), so tool_use blocks are returned to the client, which executes
// them and sends the results back on the next request.
//
// The API key is read from the ANTHROPIC_API_KEY environment variable set in
// the Vercel project. It is never sent to the browser.

import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-opus-5-5'
const MAX_CONTEXT_CHARS = 60_000
const MAX_MESSAGES = 40

const RULES = `You are the assistant inside प्राण-वायु, a planning tool for the Bhopal Municipal Corporation officer who prepares Durga visarjan on Tuesday 20 October 2026. The officer is busy and may not be technical.

How to answer:
- Use only the platform data given below. Every number must come from it. When you give a reading, cite its source as (YEAR report, p.PAGE).
- A test that is missing is "not tested", never clean or safe.
- The reports contain no bacteria tests. Do not make health claims; compare readings with the CPCB Class B (outdoor bathing) limits only.
- Reply in the language the officer writes in (Hindi or English). Keep answers short: a few lines or a short list, unless asked for detail. Use plain words; say "organic waste (BOD)" rather than only "BOD".
- If a question needs information the platform does not have (weather, crowds, other cities, today's water before any reading is entered), say so plainly.

Doing things for the officer:
- When the officer asks you to do something the tools can do (open a ghat, plan aerators and teams, download a report, switch language, go to a step), use the tool rather than describing how to do it. After a tool runs, say in one line what you did and what it shows.
- When asked where to send resources, call plan_resources and explain its result.`

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'open_ghat',
    description: "Open one ghat's evidence panel: its action, reasons, score, every reading and report page.",
    input_schema: {
      type: 'object',
      properties: { ghat_id: { type: 'string', enum: ['BAI', 'MAL', 'SHA', 'RKP', 'KHA', 'HAT', 'PRE'], description: 'Ghat id from the data' } },
      required: ['ghat_id'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'plan_resources',
    description: 'Assign the given number of aerators and MPPCB sampling teams to ghats with the platform allocator, show it on the Send teams screen, and return the assignments with reasons.',
    input_schema: {
      type: 'object',
      properties: {
        aerators: { type: 'integer', minimum: 0, maximum: 10 },
        teams: { type: 'integer', minimum: 0, maximum: 10 },
      },
      required: ['aerators', 'teams'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'download_report',
    description: 'Download a ready PDF: the visarjan risk brief (one page English, one page Hindi), the ghat profiles, or the method and limits document.',
    input_schema: {
      type: 'object',
      properties: {
        report: { type: 'string', enum: ['brief', 'ghat_profiles', 'method'] },
        language: { type: 'string', enum: ['en', 'hi'], description: 'Ignored for the brief, which has both' },
      },
      required: ['report', 'language'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'go_to',
    description: 'Show a screen of the platform.',
    input_schema: {
      type: 'object',
      properties: { screen: { type: 'string', enum: ['what_to_do', 'send_teams', 'test_on_20_oct', 'update', 'evidence', 'reports'] } },
      required: ['screen'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'set_language',
    description: 'Switch the whole platform to English or Hindi.',
    input_schema: {
      type: 'object',
      properties: { language: { type: 'string', enum: ['en', 'hi'] } },
      required: ['language'],
      additionalProperties: false,
    },
    strict: true,
  },
]

interface Req {
  method?: string
  body?: { messages?: Anthropic.Beta.BetaMessageParam[]; context?: string }
}
interface Res {
  status(code: number): Res
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

const client = new Anthropic()

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'not_configured' })

  const messages = req.body?.messages
  const context = req.body?.context
  if (!Array.isArray(messages) || !messages.length || typeof context !== 'string') return res.status(400).json({ error: 'bad_request' })
  if (messages.length > MAX_MESSAGES || context.length > MAX_CONTEXT_CHARS) return res.status(413).json({ error: 'too_long' })

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: RULES },
        { type: 'text', text: `Platform data (checked at build):\n${context}`, cache_control: { type: 'ephemeral' } },
      ],
      tools: TOOLS,
      messages,
    })
    return res.status(200).json({ content: response.content, stop_reason: response.stop_reason })
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'busy' })
    if (err instanceof Anthropic.AuthenticationError) return res.status(503).json({ error: 'not_configured' })
    if (err instanceof Anthropic.APIError) return res.status(502).json({ error: 'upstream', status: err.status })
    return res.status(500).json({ error: 'server' })
  }
}
