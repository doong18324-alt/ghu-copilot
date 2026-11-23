import { useEffect, useRef, useState } from 'react'
import { askAI } from '../lib/ai.js'
import { MODELS } from '../config.js'
import { useStored } from '../lib/store.js'

export default function ChatPanel({ task = 'chat', storageKey, initial = '', initialModel = 'auto', placeholder = '메시지를 입력하세요', context = '', modelPicker = true }) {
  const [log, setLog] = useStored(storageKey || `chat:${task}`, [])
  const [input, setInput] = useState('')
  const [model, setModel] = useState(initialModel)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)
  const sentInitial = useRef(false)

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) }, [log])

  useEffect(() => {
    if (initial && !sentInitial.current) {
      sentInitial.current = true
      send(initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  async function send(text) {
    const content = (text ?? input).trim()
    if (!content || busy) return
    setError('')
    const next = [...log, { role: 'user', content }]
    setLog([...next, { role: 'assistant', content: '', model }])
    setInput('')
    setBusy(true)
    try {
      await askAI({
        task, model, context,
        messages: next.map(({ role, content }) => ({ role, content })),
        onToken: partial => setLog([...next, { role: 'assistant', content: partial, model }]),
      })
    } catch (e) {
      setError(e.message)
      setLog(next)
    } finally {
      setBusy(false)
    }
  }

  const modelLabel = id => MODELS.find(m => m.id === id)?.label || id

  return (
    <div className="stack" style={{ gap: 14 }}>
      {log.length > 0 && (
        <div className="chat-log" aria-live="polite">
          {log.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>
              {m.role !== 'user' && <span className="meta">{modelLabel(m.model)}</span>}
              {m.content || '…'}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}
      {error && <div className="check bad" role="alert">{error}</div>}
      <form className="row" onSubmit={e => { e.preventDefault(); send() }}>
        <label className="sr-only" htmlFor={`in-${task}`}>메시지</label>
        <input id={`in-${task}`} className="input" style={{ flex: '1 1 300px', width: 'auto', minHeight: 50 }} value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder} />
        {modelPicker && (
          <>
            <label className="sr-only" htmlFor={`model-${task}`}>AI 모델</label>
            <select id={`model-${task}`} className="input select" style={{ minHeight: 50 }} value={model} onChange={e => setModel(e.target.value)}>
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </>
        )}
        <button className="btn primary" style={{ minHeight: 50 }} disabled={busy}>{busy ? '응답 중' : '보내기'}</button>
        {log.length > 0 && <button type="button" className="btn" style={{ minHeight: 50 }} onClick={() => setLog([])} disabled={busy}>새 대화</button>}
      </form>
    </div>
  )
}
