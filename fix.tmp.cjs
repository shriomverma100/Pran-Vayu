const fs = require('fs')
let st = fs.readFileSync('src/i18n/strings.ts', 'utf8')
st = st.replace('"The assistant is not switched on yet: GROQ_API_KEY must be set in the Vercel project, then redeploy."', '"The assistant is not switched on yet: set ANTHROPIC_API_KEY (or GROQ_API_KEY) in the Vercel project, then redeploy."')
st = st.replace('"सहायक अभी चालू नहीं है: Vercel प्रोजेक्ट में GROQ_API_KEY सेट कर फिर से डिप्लॉय करें।"', '"सहायक अभी चालू नहीं है: Vercel प्रोजेक्ट में ANTHROPIC_API_KEY (या GROQ_API_KEY) सेट कर फिर से डिप्लॉय करें।"')
fs.writeFileSync('src/i18n/strings.ts', st)

let s = fs.readFileSync('README.md', 'utf8')
const rep = (a, b) => {
  if (!s.includes(a)) throw new Error('missing: ' + a.slice(0, 80))
  s = s.replace(a, b)
}
const start = s.indexOf('- Server function: [api/chat.ts](api/chat.ts) (Vercel) calls **Groq**')
const end = s.indexOf('- It runs on the deployed site only;', start)
if (start < 0 || end < 0) throw new Error('assistant section')
s =
  s.slice(0, start) +
  `- Server function: [api/chat.ts](api/chat.ts) (Vercel). It uses **Claude Opus 5.5** (\`claude-opus-5-5\`, official \`@anthropic-ai/sdk\`, low effort for quick replies, the API's server-side refusal fallback, and prompt caching of the data summary) when \`ANTHROPIC_API_KEY\` is set. If only \`GROQ_API_KEY\` is set, it uses Groq (\`openai/gpt-oss-120b\`) instead.
- The browser sends a compact plain-text summary of the checked data, about 3,000 tokens with every oxygen, BOD and pH reading and its page ([src/lib/assistantContext.ts](src/lib/assistantContext.ts)). The rules live on the server.
- **One model call per question.** When the model calls a tool, the browser runs it and writes the outcome itself; the aerator and team allocation comes straight from the tested allocator, not from the model's wording.
- **Answer check:** every number in a reply is compared with the checked data; anything that doesn't match is flagged to the officer with a link to the proof.
- **Tested end to end** on real questions in English and Hindi: Claude gave the correct readings and pages, refused to call water "safe", and used the allocator tool. In one follow-up it attached a correct number to the wrong year, which is why every answer points the officer to the proof.
- **To switch it on:** Vercel project → Settings → Environment Variables → add \`ANTHROPIC_API_KEY\` (or \`GROQ_API_KEY\`) → Redeploy. Keys are never in the code, the repo or the browser.
` +
  s.slice(end)
rep('| Assistant answer (Groq, measured end to end) | about 1 s |', '| Assistant answer, end to end | 2–8 s with Claude Opus 5.5 · about 1 s with Groq |')
rep('TypeScript · React · Vite · Tailwind CSS · Motion (animation) · Groq (assistant, `openai/gpt-oss-120b`) · d3-scale', 'TypeScript · React · Vite · Tailwind CSS · Motion (animation) · Claude Opus 5.5 via the Anthropic SDK (assistant; Groq optional) · d3-scale')
rep('api/chat.ts           AI assistant (Vercel function, Groq; key from GROQ_API_KEY)', 'api/chat.ts           AI assistant (Vercel function; Claude via ANTHROPIC_API_KEY, or Groq via GROQ_API_KEY)')
rep('- AI assistant on the deployed site once `GROQ_API_KEY` is set in Vercel', '- AI assistant on the deployed site once `ANTHROPIC_API_KEY` (or `GROQ_API_KEY`) is set in Vercel')
rep("- **The AI assistant needs `GROQ_API_KEY` in Vercel** and an internet connection. On Groq's free tier it answers a few questions a minute, then asks the officer to wait. AI answers can be wrong: numbers that don't match the data are flagged, and the panel points to the proof.", "- **The AI assistant needs an API key in Vercel** and an internet connection. AI answers can be wrong: numbers that don't match the data are flagged, but a correct number with the wrong year is not caught, so the panel always points to the proof. On Groq's free tier it answers only a few questions a minute.")
rep('  API["api/chat.ts<br/>Groq gpt-oss-120b"]', '  API["api/chat.ts<br/>Claude Opus 5.5<br/>(or Groq)"]')
rep('and the Groq assistant', 'and the AI assistant')
fs.writeFileSync('README.md', s)
console.log('ok')
