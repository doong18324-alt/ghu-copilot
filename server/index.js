import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROVIDERS } from './providers.js'
import { systemPrompt } from './prompts.js'
import { getUser } from './auth.js'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
loadEnv(path.join(ROOT, '..', '.env'))

const PORT = Number(process.env.PORT || 8787)
const ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
const DAILY_LIMIT = Number(process.env.MAX_REQUESTS_PER_DAY || 200)
const LOG_FILE = path.join(ROOT, '..', 'logs', 'usage.jsonl')
const counts = new Map()

function loadEnv(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

function cors(req, res) {
  const origin = req.headers.origin
  if (origin && ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  }
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  let raw = ''
  for await (const c of req) {
    raw += c
    if (raw.length > 2_000_000) throw new Error('요청이 너무 큽니다')
  }
  return JSON.parse(raw || '{}')
}

const PII = [
  [/\b\d{6}\s?-\s?[1-4]\d{6}\b/g, '[주민등록번호 가림]'],
  [/\b01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}\b/g, '[휴대전화번호 가림]'],
  [/(등록번호|환자번호|차트번호)\s*[:：]?\s*\d{4,}/g, '[등록번호 가림]'],
]
const mask = s => (process.env.MASK_PII === 'false' ? s : PII.reduce((t, [re, r]) => t.replace(re, r), s))

function pickProvider(model) {
  const id = model && model !== 'auto' ? model : process.env.DEFAULT_PROVIDER || 'claude'
  const p = PROVIDERS[id]
  if (!p) throw new Error(`알 수 없는 모델: ${id}`)
  if (!process.env[p.key]) throw new Error(`${p.key}가 설정되지 않았습니다`)
  if (!process.env[p.model]) throw new Error(`${p.model}가 설정되지 않았습니다`)
  return { id, ...p, modelName: process.env[p.model] }
}

function overLimit(userId) {
  const key = `${userId}:${new Date().toISOString().slice(0, 10)}`
  const n = (counts.get(key) || 0) + 1
  counts.set(key, n)
  return n > DAILY_LIMIT
}

function logUsage(entry) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true })
  fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', () => {})
}

async function handleChat(req, res, user) {
  const { task = 'chat', model, messages = [], context = '' } = await readBody(req)
  if (!Array.isArray(messages) || messages.length === 0) return json(res, 400, { error: '메시지가 없습니다' })
  if (overLimit(user.id)) return json(res, 429, { error: '오늘 사용 한도를 넘었습니다' })

  const p = pickProvider(model)
  const clean = messages.slice(-20).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: mask(String(m.content || '')) }))
  const system = systemPrompt(task, mask(String(context || '')).slice(0, 60000))

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' })
  let out = ''
  try {
    for await (const t of p.run({ system, messages: clean, model: p.modelName })) {
      out += t
      res.write(t)
    }
  } catch (e) {
    res.write(`\n\n[오류] ${e.message}`)
  }
  res.end()
  logUsage({
    at: new Date().toISOString(), user: user.id, role: user.role, task, provider: p.name, model: p.modelName,
    inputChars: clean.reduce((n, m) => n + m.content.length, 0) + system.length, outputChars: out.length,
  })
}

function usageSummary() {
  if (!fs.existsSync(LOG_FILE)) return { requests: 0, byProvider: {}, byRole: {} }
  const month = new Date().toISOString().slice(0, 7)
  const rows = fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(r => r.at.startsWith(month))
  const tally = key => rows.reduce((o, r) => ({ ...o, [r[key]]: (o[r[key]] || 0) + 1 }), {})
  return { month, requests: rows.length, byProvider: tally('provider'), byRole: tally('role') }
}

const server = http.createServer(async (req, res) => {
  cors(req, res)
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }
  try {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname === '/api/health') {
      return json(res, 200, {
        ok: true,
        auth: process.env.AUTH_MODE || 'none',
        providers: Object.fromEntries(Object.entries(PROVIDERS).map(([k, p]) => [k, !!process.env[p.key]])),
      })
    }
    const user = await getUser(req)
    if (!user) return json(res, 401, { error: '로그인이 필요합니다' })
    if (url.pathname === '/api/chat' && req.method === 'POST') return await handleChat(req, res, user)
    if (url.pathname === '/api/usage' && user.role === 'admin') return json(res, 200, usageSummary())
    json(res, 404, { error: '없는 경로입니다' })
  } catch (e) {
    if (!res.headersSent) json(res, 500, { error: e.message })
    else res.end()
  }
})

const HOST = (process.env.AUTH_MODE || 'none') === 'none' ? '127.0.0.1' : process.env.HOST || '0.0.0.0'
server.listen(PORT, HOST, () => console.log(`GHU 코파일럿 중계 서버: http://${HOST}:${PORT} (인증 방식: ${process.env.AUTH_MODE || 'none'})`))
