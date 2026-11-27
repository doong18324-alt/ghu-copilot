import { useState } from 'react'
import { Link } from 'react-router-dom'
import { askAI, AI_MODE } from '../lib/ai.js'
import { findPII, maskPII } from '../lib/privacy.js'

/* 바이탈 웹앱 공통 부품: 앱 머리말, 입력 칸, 선택 칩, 결과 상자, 지후 AI 다듬기 */

const TONE_BG = { blue: 'var(--blue-soft)', green: 'var(--green-soft)', amber: 'var(--amber-soft)', red: 'var(--red-soft)' }

export function AppHeader({ app, children }) {
  return (
    <section className="card wa-head">
      <span className="app-icon" style={{ background: TONE_BG[app.tone], width: 64, height: 64, fontSize: 32 }} aria-hidden="true">{app.icon}</span>
      <div className="stack" style={{ gap: 6, minWidth: 0 }}>
        <h1 className="page-title" style={{ fontSize: 28 }}>{app.title}</h1>
        <p className="muted" style={{ margin: 0 }}>{app.summary}</p>
        {children}
      </div>
    </section>
  )
}

export function Notice({ tone = 'warn', children }) {
  return <div className={`check ${tone}`} role="note">{children}</div>
}

export function Field({ id, label, hint, required, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required && <span style={{ color: 'var(--red)' }}> *</span>}</label>
      {children}
      {hint && <span className="muted small">{hint}</span>}
    </div>
  )
}

export function TextInput({ id, value, onChange, ...rest }) {
  return <input id={id} className="input" value={value} onChange={e => onChange(e.target.value)} {...rest} />
}

export function TextArea({ id, value, onChange, rows = 4, ...rest }) {
  return <textarea id={id} className="textarea" rows={rows} value={value} onChange={e => onChange(e.target.value)} {...rest} />
}

// options: [[값, 이름, 설명?]]. multi면 value는 배열입니다.
export function ChipGroup({ label, options, value, onChange, multi = false }) {
  const on = v => (multi ? value.includes(v) : value === v)
  const toggle = v => (multi ? onChange(on(v) ? value.filter(x => x !== v) : [...value, v]) : onChange(v))
  return (
    <div className="stack" style={{ gap: 8 }}>
      {label && <span className="small" style={{ fontWeight: 700, color: 'var(--muted)' }}>{label}{multi && ' (여러 개 선택)'}</span>}
      <div className="wa-chips" role="group" aria-label={label}>
        {options.map(([v, name, desc]) => (
          <button key={v} type="button" className={on(v) ? 'wa-chip on' : 'wa-chip'} aria-pressed={on(v)} onClick={() => toggle(v)}>
            <b>{name}</b>{desc && <span>{desc}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true } catch { /* 권한이 없는 환경 */ }
  const ta = document.createElement('textarea')
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
  document.body.appendChild(ta); ta.select()
  let ok = false
  try { ok = document.execCommand('copy') } catch { ok = false }
  ta.remove()
  return ok
}

export function CopyButton({ text, label = '복사', primary = false }) {
  const [done, setDone] = useState('')
  return (
    <>
      <button type="button" className={primary ? 'btn primary app-open' : 'btn app-open'} onClick={async () => setDone((await copyText(text)) ? '복사했습니다' : '복사하지 못했습니다. 직접 선택해 복사하세요.')}>{label}</button>
      {done && <span className="small muted" role="status">{done}</span>}
    </>
  )
}

function download(text, name) {
  const blob = new Blob(['﻿' + text], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

// 결과 문서: 제목, 본문(편집 가능), 글자 수, 복사·내려받기
export function ResultDoc({ title, text, onChange, fileName = '초안.txt', extra }) {
  const len = text.length
  const noSpace = text.replace(/\s/g, '').length
  return (
    <section className="card wa-result">
      <div className="card-head"><h2>{title}</h2><span className="muted small">공백 포함 {len.toLocaleString()}자 · 제외 {noSpace.toLocaleString()}자</span></div>
      {onChange
        ? <textarea className="textarea wa-paper" value={text} onChange={e => onChange(e.target.value)} rows={Math.min(28, Math.max(8, text.split('\n').length + 1))} aria-label={`${title} 본문`} />
        : <pre className="wa-paper" tabIndex={0}>{text}</pre>}
      <div className="row">
        <CopyButton text={text} label="전체 복사" primary />
        <button type="button" className="btn app-open" onClick={() => download(text, fileName)}>텍스트 파일로 저장</button>
        {extra}
      </div>
    </section>
  )
}

/* 지후 AI로 다듬기
   - 규칙으로 만든 초안과 입력값을 앱별 지침(서버의 app-<id> 작업)과 함께 보냅니다.
   - 개인정보로 보이는 내용이 있으면 가린 뒤에만 보냅니다(서버에서도 한 번 더 가립니다).
   - AI가 연결되지 않은 시연 모드에서는 버튼을 막고 이유를 알립니다. */
export function AiRefine({ appId, prompt, label = '지후 AI로 다듬기', note, onResult }) {
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const pii = findPII(prompt)
  const live = AI_MODE === 'live'

  async function run() {
    setBusy(true); setErr(''); setOut('')
    try {
      const text = await askAI({ task: `app-${appId}`, messages: [{ role: 'user', content: maskPII(prompt) }], onToken: setOut })
      onResult?.(text)
    } catch (e) {
      setErr(e.message || 'AI 응답을 받지 못했습니다.')
    }
    setBusy(false)
  }

  return (
    <section className="card wa-ai">
      <div className="card-head"><h2>지후 AI로 한 단계 더</h2><span className={`badge ${live ? 'green' : ''}`}>{live ? 'AI 연결됨' : 'AI 연결 전'}</span></div>
      <p className="muted small" style={{ margin: 0 }}>{note || '위 초안과 입력 내용을 바탕으로 문장을 자연스럽게 다듬고 빠진 부분을 채웁니다. 결과는 반드시 확인한 뒤 사용하세요.'}</p>
      {pii.length > 0 && <Notice tone="bad">개인정보로 보이는 내용({pii.map(p => p.label).join(', ')})이 있습니다. AI에는 가린 상태로만 보냅니다.</Notice>}
      <div className="row">
        <button type="button" className="btn soft app-open" disabled={!live || busy || !prompt.trim()} onClick={run} title={live ? '' : '교내 AI 서버가 연결되면 사용할 수 있습니다'}>{busy ? '다듬는 중…' : label}</button>
        {!live && <span className="small muted">교내 AI 서버가 연결되면 사용할 수 있습니다. 지금은 위의 규칙 기반 초안을 쓰세요.</span>}
      </div>
      {err && <Notice tone="bad">{err}</Notice>}
      {out && <ResultDoc title="지후 AI 결과" text={out} fileName="지후AI_결과.txt" />}
    </section>
  )
}

export function BackToMarket() {
  return <Link to="/market" className="small" style={{ fontWeight: 700, textDecoration: 'none' }}>← 앱마켓</Link>
}
