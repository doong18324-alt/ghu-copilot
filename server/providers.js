async function* sse(res) {
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop()
    for (const line of lines) {
      const t = line.trim()
      if (!t.startsWith('data:')) continue
      const data = t.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try { yield JSON.parse(data) } catch { /* 불완전한 줄은 건너뜀 */ }
    }
  }
}

async function check(res, name) {
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${name} API 오류 ${res.status}: ${body.slice(0, 300)}`)
  }
}

export async function* openai({ system, messages, model }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, stream: true, messages: [{ role: 'system', content: system }, ...messages] }),
  })
  await check(res, 'OpenAI')
  for await (const ev of sse(res)) {
    const t = ev.choices?.[0]?.delta?.content
    if (t) yield t
  }
}

export async function* anthropic({ system, messages, model }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, system, messages, stream: true, max_tokens: Number(process.env.MAX_OUTPUT_TOKENS || 4000) }),
  })
  await check(res, 'Anthropic')
  for await (const ev of sse(res)) {
    if (ev.type === 'content_block_delta' && ev.delta?.text) yield ev.delta.text
  }
}

export async function* google({ system, messages, model }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    }),
  })
  await check(res, 'Gemini')
  for await (const ev of sse(res)) {
    const t = ev.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('')
    if (t) yield t
  }
}

export const PROVIDERS = {
  gpt: { run: openai, key: 'OPENAI_API_KEY', model: 'OPENAI_MODEL', name: 'openai' },
  claude: { run: anthropic, key: 'ANTHROPIC_API_KEY', model: 'ANTHROPIC_MODEL', name: 'anthropic' },
  gemini: { run: google, key: 'GEMINI_API_KEY', model: 'GEMINI_MODEL', name: 'google' },
}
