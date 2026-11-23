import { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import ChatPanel from '../components/ChatPanel.jsx'
import { Card, PageHead, Empty } from '../components/ui.jsx'
import { MODELS, ROLES, SITE } from '../config.js'
import { useStored, uid, roleFromPath } from '../lib/store.js'
import jihu from '../assets/jihu.webp'

export function Hero({ title, desc, placeholder, chips = [] }) {
  const role = roleFromPath(useLocation().pathname)
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [model, setModel] = useState('auto')
  const go = text => text.trim() && nav(`/${role}/chat?q=${encodeURIComponent(text.trim())}&m=${model}`)
  return (
    <Card className="hero">
      <div className="hero-top">
        <div className="stack" style={{ gap: 10, flex: '1 1 320px' }}>
          <span className="jihu-tag">지후 AI에게 물어보기</span>
          <h1>{title}</h1>
          <p className="muted" style={{ fontSize: 15 }}>{desc}</p>
        </div>
        <img className="jihu-hero" src={jihu} alt="광주보건대학교 AI 캐릭터 지후" width="148" height="148" />
      </div>
      <form className="row" onSubmit={e => { e.preventDefault(); go(q) }}>
        <label className="sr-only" htmlFor="hero-ask">요청</label>
        <input id="hero-ask" className="input" style={{ flex: '1 1 320px', width: 'auto', minHeight: 52, fontSize: 15 }} placeholder={placeholder} value={q} onChange={e => setQ(e.target.value)} />
        <label className="sr-only" htmlFor="hero-model">AI 모델</label>
        <select id="hero-model" className="input select" style={{ minHeight: 52 }} value={model} onChange={e => setModel(e.target.value)}>
          {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <button className="btn primary" style={{ minHeight: 52 }}>보내기</button>
      </form>
      <div className="row" style={{ gap: 8 }}>
        {chips.map(c => <button key={c} type="button" className="chip" onClick={() => go(c)}>{c}</button>)}
      </div>
    </Card>
  )
}

export function ChatPage() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const role = roleFromPath(useLocation().pathname)
  return (
    <>
      <Card className="jihu-head">
        <img src={jihu} alt="광주보건대학교 AI 캐릭터 지후" width="112" height="112" />
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="page-title">지후 AI</h1>
          <p className="muted">광주보건대학교의 AI 도우미 지후입니다. 업무, 수업, 학교생활 무엇이든 물어보세요. 모델은 자동으로 고르거나 직접 선택할 수 있고, 대화 기록은 이 브라우저에만 저장됩니다.</p>
        </div>
      </Card>
      <Card>
        <ChatPanel key={q} task="chat" name="지후" storageKey={`chat:${role}`} initial={q} initialModel={params.get('m') || 'auto'} placeholder="지후에게 무엇이든 물어보세요" />
      </Card>
    </>
  )
}

export function TaskPage({ task, title, desc, placeholder, notes }) {
  const role = roleFromPath(useLocation().pathname)
  return (
    <>
      <PageHead title={title} desc={desc} />
      {notes && <Card title="이 기능이 하는 일">{notes}</Card>}
      <Card>
        <ChatPanel task={task} storageKey={`task:${role}:${task}`} placeholder={placeholder} />
      </Card>
    </>
  )
}

export function FilesPage() {
  const role = roleFromPath(useLocation().pathname)
  const [files, setFiles] = useStored(`files:${role}`, [])
  function add(e) {
    const list = [...e.target.files].map(f => ({ id: uid(), name: f.name, size: f.size, at: new Date().toLocaleDateString('ko-KR') }))
    setFiles([...list, ...files])
    e.target.value = ''
  }
  return (
    <>
      <PageHead title="파일함" desc="시연 모드에서는 파일 이름만 이 브라우저에 기록되고 내용은 어디에도 전송되지 않습니다." />
      <Card title="내 파일" action={<label className="btn soft" style={{ display: 'inline-flex', alignItems: 'center' }}>파일 올리기<input type="file" multiple className="sr-only" onChange={add} /></label>}>
        {files.length === 0 ? <Empty>올린 파일이 없습니다. 실제 연결 후에는 규정 Q&A, 강좌봇, 문서 분석이 이 파일들을 근거로 답합니다.</Empty> : (
          <ul className="list">
            {files.map(f => (
              <li key={f.id}><span>{f.name}</span><span className="row" style={{ gap: 8 }}><span className="muted small">{(f.size / 1024).toFixed(0)} KB · {f.at}</span><button className="btn" onClick={() => setFiles(files.filter(x => x.id !== f.id))}>삭제</button></span></li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

export function Login() {
  return (
    <div className="login">
      <div className="card">
        <div className="row" style={{ gap: 12 }}>
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <div className="brand-name" style={{ color: 'var(--ink)' }}>{SITE.name}</div>
            <div className="slogan">{SITE.slogan}</div>
            <div className="muted small">{SITE.sub}</div>
          </div>
        </div>
        <button className="btn primary" disabled title="학교 통합인증 연결 후 사용">학교 통합인증으로 로그인 (연결 예정)</button>
        <p className="muted small">통합인증(SSO)이 연결되면 계정의 소속에 따라 직원·교수·학생 화면이 자동으로 열립니다. 지금은 아래에서 역할을 골라 시연할 수 있습니다.</p>
        <div className="role-grid">
          {Object.entries(ROLES).map(([key, r]) => (
            <Link key={key} to={`/${key}`}><b>{r.label}</b><span>{key === 'admin' ? '모델·비용·권한' : `${r.label} 앱 시연`}</span></Link>
          ))}
        </div>
        <div className="login-links">
          <Link to="/about">본부 소개</Link>
          <Link to="/news">성과 소식</Link>
          <Link to="/recruit">프로그램 모집</Link>
        </div>
      </div>
    </div>
  )
}
