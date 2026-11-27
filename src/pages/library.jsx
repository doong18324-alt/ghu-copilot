import { useState } from 'react'
import { Link, NavLink, useParams, Navigate } from 'react-router-dom'
import { Card, Empty, PageHead } from '../components/ui.jsx'
import { PROMPTS, PROMPT_AUDIENCE, fillPrompt, FAQ, FAQ_CATS, MANUALS, MANUAL_GROUPS, manualUrl } from '../data/library.js'
import { LOCATION } from '../data/about.js'
import { appById, NATIVE_IDS } from '../data/webapps.js'

/* AI 활용 자료: 프롬프트 라이브러리, 매뉴얼 자료실, 자주 묻는 질문 */

const norm = s => (s || '').toLowerCase().replace(/\s+/g, '')
const has = (text, q) => q.trim().split(/\s+/).filter(Boolean).every(w => norm(text).includes(norm(w)))

function Search({ id, value, onChange, placeholder }) {
  return (
    <div className="market-search">
      <label htmlFor={id} className="sr-only">검색</label>
      <input id={id} type="search" className="input" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} autoComplete="off" />
    </div>
  )
}

function Chips({ value, onChange, options, label }) {
  return (
    <div className="row" style={{ gap: 8 }} role="group" aria-label={label}>
      {options.map(([v, t]) => <button key={v} type="button" className={value === v ? 'chip on' : 'chip'} aria-pressed={value === v} onClick={() => onChange(v)}>{t}</button>)}
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

/* ── 프롬프트 라이브러리 ── */

function PromptCard({ p }) {
  const [open, setOpen] = useState(false)
  const [vals, setVals] = useState({})
  const [msg, setMsg] = useState('')
  const text = fillPrompt(p, vals)
  const empty = p.fields.filter(f => !(vals[f.key] || '').trim()).length
  const app = p.app && appById(p.app)
  async function onCopy() {
    const ok = await copyText(text)
    setMsg(ok ? (empty ? `복사했습니다. 비운 칸 ${empty}곳은 [ ]로 남아 있습니다.` : '복사했습니다. AI 창에 붙여 넣으세요.') : '복사하지 못했습니다. 아래 완성본을 직접 선택해 복사하세요.')
    if (!ok) setOpen(true)
  }
  function example() { setVals(Object.fromEntries(p.fields.filter(f => !String(f.ex).startsWith('(')).map(f => [f.key, f.ex]))) }
  return (
    <article className={open ? 'card prompt-card open' : 'card prompt-card'}>
      <div className="row" style={{ gap: 6 }}>
        <span className="badge navy">{p.id}</span>
        <span className="badge blue">{PROMPT_AUDIENCE[p.part]}</span>
        {p.tags.map(t => <span key={t} className="badge">#{t}</span>)}
      </div>
      <h3>{p.title}</h3>
      <p className="small muted" style={{ margin: 0 }}>{p.desc}</p>
      <p className="small" style={{ margin: 0 }}><b>쓸 수 있는 도구</b> {p.tools}</p>
      {app && <p className="small" style={{ margin: 0 }}><b>바이탈 앱</b> {NATIVE_IDS.includes(app.id) ? <Link to={`/run/${app.id}`}>{app.title}</Link> : <a href={`./webapps/${app.id}.html`} target="_blank" rel="noopener">{app.title} ↗</a>}에서 화면으로 바로 할 수 있습니다.</p>}
      {open && (
        <div className="prompt-fill">
          {p.fields.map(f => (
            <label key={f.key} className="field">
              <span className="field-label">{f.label}</span>
              {f.multi
                ? <textarea className="input" rows={3} value={vals[f.key] || ''} placeholder={f.ex} onChange={e => setVals({ ...vals, [f.key]: e.target.value })} />
                : <input className="input" value={vals[f.key] || ''} placeholder={f.ex} onChange={e => setVals({ ...vals, [f.key]: e.target.value })} />}
            </label>
          ))}
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="btn" onClick={example}>예시 넣기</button>
            <button type="button" className="btn" onClick={() => setVals({})}>칸 비우기</button>
          </div>
          <span className="small muted">완성본 미리보기</span>
          <pre className="prompt-text" tabIndex={0}>{text}</pre>
        </div>
      )}
      <p className={`prompt-check ${p.level}`}>{p.level === 'red' ? '개인정보 주의 · ' : '결과 확인법 · '}{p.check}</p>
      <div className="row">
        <button type="button" className="btn primary app-open" onClick={onCopy}>{open ? '완성본 복사' : '복사하기'}</button>
        <button type="button" className="btn app-open" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '접기' : '칸 채워 쓰기'}</button>
        {msg && <span className="small muted" role="status">{msg}</span>}
      </div>
    </article>
  )
}

export function PromptLibrary({ role }) {
  const [aud, setAud] = useState(role && PROMPT_AUDIENCE[role] ? role : 'all')
  const [tag, setTag] = useState('')
  const [q, setQ] = useState('')
  const tags = [...new Set(PROMPTS.flatMap(p => p.tags))]
  const shown = PROMPTS.filter(p => (aud === 'all' || p.part === aud || (p.part === 'basic' && aud !== 'health')) && (!tag || p.tags.includes(tag)) && has([p.title, p.desc, p.template, ...p.tags].join(' '), q))
  return (
    <>
      <PageHead title="프롬프트 라이브러리" desc={`업무별 표준 프롬프트 ${PROMPTS.length}종입니다. 모두 역할, 상황, 넣을 자료, 작업 순서, 출력 형식, 지킬 것, 마지막 점검의 같은 틀로 되어 있습니다. 「칸 채워 쓰기」로 빈칸을 채우면 완성본을 복사할 수 있고, 결과는 카드 아래 확인법대로 사람이 확인합니다.`} />
      <Card>
        <Search id="prompt-q" value={q} onChange={setQ} placeholder="하고 싶은 일로 찾기 (예: 국시, 루브릭, 회의록, 엑셀)" />
        <Chips label="대상 선택" value={aud} onChange={setAud} options={[['all', '전체'], ...Object.entries(PROMPT_AUDIENCE)]} />
        <div className="row" style={{ gap: 6 }}>
          <span className="small" style={{ fontWeight: 700 }}>태그</span>
          {tags.map(t => <button key={t} type="button" className={tag === t ? 'chip on' : 'chip'} style={{ minHeight: 30, fontSize: 13 }} aria-pressed={tag === t} onClick={() => setTag(tag === t ? '' : t)}>#{t}</button>)}
        </div>
        <p className="prompt-check red" style={{ margin: 0 }}>개인정보, 환자 정보, 비공개 업무자료는 어떤 AI에도 입력하지 않습니다. 등급 기준은 <Link to="/about/safety">AI 안전 기준</Link>에서 확인하세요.</p>
      </Card>
      <p className="muted small">{shown.length}개</p>
      {shown.length === 0 ? <Empty>조건에 맞는 프롬프트가 없습니다.</Empty> : <div className="prompt-grid">{shown.map(p => <PromptCard key={p.id} p={p} />)}</div>}
    </>
  )
}

/* ── 매뉴얼 자료실 ── */

const ROLE_NAME = { student: '학생', faculty: '교수', staff: '직원' }

function ManualRow({ m }) {
  return (
    <li>
      <span style={{ minWidth: 0 }}><b>{m.title}</b>{m.desc && <><br /><span className="small" style={{ color: 'var(--ink-2, #4b5563)' }}>{m.desc}</span></>}<br /><span className="muted small">A4 PDF · {m.pages}쪽 · {(m.size / 1024 / 1024).toFixed(1)}MB</span></span>
      <span className="row" style={{ gap: 6, flex: 'none' }}>
        <a className="btn app-open" href={manualUrl(m)} target="_blank" rel="noopener">PDF 보기</a>
        {m.docx && <a className="btn app-open" href={manualUrl(m, 'docx')} download>워드 양식</a>}
      </span>
    </li>
  )
}

export function ManualLibrary({ role }) {
  const [who, setWho] = useState(role || 'all')
  const [q, setQ] = useState('')
  const list = MANUALS.filter(m => (who === 'all' || m.roles.includes(who)) && has(m.title + ' ' + m.group + ' ' + (m.desc || ''), q))
  const groups = MANUAL_GROUPS.filter(([g]) => list.some(m => m.group === g))
  return (
    <>
      <PageHead title="AI 활용 매뉴얼" desc="학생 학습 트랙, 교수자·직원 업무 매뉴얼, 전공융합 가이드와 수업설계 양식입니다. 2026년 11월에 모두 A4 판형으로 다시 짜고, 프롬프트는 복사해 쓸 수 있게 상자로 나눴습니다." />
      <Card>
        <Search id="manual-q" value={q} onChange={setQ} placeholder="매뉴얼 제목으로 찾기 (예: 국가고시, 회의록, 루브릭)" />
        <Chips label="대상 선택" value={who} onChange={setWho} options={[['all', '전체'], ...Object.entries(ROLE_NAME)]} />
      </Card>
      {groups.length === 0 ? <Empty>찾는 매뉴얼이 없습니다.</Empty> : groups.map(([g, step, desc]) => (
        <Card key={g} title={g} action={step ? <span className="badge green">{step}</span> : null}>
          <p className="muted small">{desc}</p>
          <ul className="list">{list.filter(m => m.group === g).map(m => <ManualRow key={m.id} m={m} />)}</ul>
        </Card>
      ))}
    </>
  )
}

/* ── 자주 묻는 질문 ── */

export function FaqPage() {
  const [cat, setCat] = useState('전체')
  const [q, setQ] = useState('')
  const shown = FAQ.filter(f => (cat === '전체' || f.cat === cat) && has(f.q + ' ' + f.a, q))
  return (
    <div className="container market" style={{ maxWidth: 860 }}>
      <PageHead title="자주 묻는 질문" desc="GHU 바이탈 이용, AI 교육·비교과, AI 윤리·보안에 관해 자주 묻는 질문입니다." />
      <Chips label="분류" value={cat} onChange={setCat} options={['전체', ...FAQ_CATS].map(c => [c, c])} />
      <Search id="faq-q" value={q} onChange={setQ} placeholder="궁금한 낱말로 찾기 (예: 국가고시, 마일리지, 개인정보)" />
      {shown.length === 0 ? <Empty>찾는 질문이 없습니다.</Empty> : (
        <div className="faq">
          {shown.map(f => (
            <details key={f.n} className="card faq-item">
              <summary><span className="faq-q">Q</span><span>{f.q}</span></summary>
              <div className="faq-a"><span className="faq-q a">A</span><p>{f.a}</p></div>
            </details>
          ))}
        </div>
      )}
      <Card>
        <b>원하는 답을 찾지 못하셨나요?</b>
        <p className="muted">AI대학혁신본부({LOCATION.phone})로 문의해 주세요.</p>
      </Card>
    </div>
  )
}

/* ── 공개 화면: AI 활용 자료(프롬프트·매뉴얼 탭) ── */

export function GuidePublic() {
  const { tab = 'prompts' } = useParams()
  if (!['prompts', 'manuals'].includes(tab)) return <Navigate to="/guide" replace />
  return (
    <div className="container market">
      <nav className="row" aria-label="AI 활용 자료">
        <NavLink to="/guide" end className={() => (tab === 'prompts' ? 'chip on' : 'chip')} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>프롬프트 라이브러리</NavLink>
        <NavLink to="/guide/manuals" className={() => (tab === 'manuals' ? 'chip on' : 'chip')} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>AI 활용 매뉴얼</NavLink>
      </nav>
      {tab === 'prompts' ? <PromptLibrary /> : <ManualLibrary />}
    </div>
  )
}
