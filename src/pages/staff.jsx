import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Hero } from './common.jsx'
import { Card, Feature, PageHead, Empty } from '../components/ui.jsx'
import { useStored, uid } from '../lib/store.js'
import { askAI } from '../lib/ai.js'
import { checkDocument } from '../lib/docCheck.js'
import { splitArticles, searchArticles, SAMPLE_RULES } from '../lib/rules.js'

const STAGES = ['사업계획', '품의·기안', '집행·공문', '정산', '결과보고']
const STAGE_TASKS = {
  사업계획: ['추진 목적과 기대효과 정리', '세부 일정표 작성', '예산 산출 근거 작성'],
  '품의·기안': ['기안문 초안', '관련 규정 근거 확인', '결재선 확인'],
  '집행·공문': ['안내 공문 작성', '참여자 모집 안내문', '계약·구매 서류 점검'],
  정산: ['지출 증빙 목록 대조', '정산서 작성', '잔액 처리 확인'],
  결과보고: ['성과지표 실적 집계', '결과보고서 초안', '만족도 조사 요약'],
}

function useTodos() { return useStored('todos:staff', []) }

export function StaffHome() {
  const [todos] = useTodos()
  const [projects] = useStored('projects', [])
  const open = todos.filter(t => !t.done)
  const today = new Date().toISOString().slice(0, 10)
  const overdue = open.filter(t => t.due && t.due < today).length
  const dueToday = open.filter(t => t.due === today).length
  return (
    <>
      <Hero title="오늘 어떤 업무를 도와드릴까요?" desc="요청에 맞는 AI 모델을 자동으로 고르며, 필요하면 직접 선택할 수 있습니다." placeholder="예: 다음 주 교무회의 안건을 정리해 줘" chips={['회의 안건 정리', '엑셀 실적 집계 방법', '보도자료 초안', '출장 신청 규정 찾기']} />
      <div className="grid">
        <Card title="오늘 챙길 일" action={<Link to="todo" className="small">전체 보기</Link>}>
          <div className="stat-row">
            <div className="stat" style={{ background: 'var(--red-soft)' }}><b style={{ color: 'var(--red)' }}>{overdue}</b><span>기한 지남</span></div>
            <div className="stat" style={{ background: 'var(--amber-soft)' }}><b style={{ color: 'var(--amber)' }}>{dueToday}</b><span>오늘 마감</span></div>
            <div className="stat" style={{ background: 'var(--blue-soft)' }}><b style={{ color: 'var(--blue-dark)' }}>{open.length}</b><span>열린 할 일</span></div>
          </div>
          {open.length === 0 ? <Empty>회의록에서 추출한 할 일과 직접 추가한 할 일이 여기에 모입니다.</Empty> : (
            <ul className="list">{open.slice(0, 3).map(t => <li key={t.id}><span>{t.text}</span><span className="muted small">{t.due || '기한 없음'}</span></li>)}</ul>
          )}
        </Card>
        <Card title="진행 중 업무 프로젝트" className="span-2" action={<Link to="projects" className="btn soft" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>프로젝트 관리</Link>}>
          <p className="muted">담당 사업 하나를 프로젝트로 만들면 단계마다 필요한 문서 초안과 점검표가 이어집니다.</p>
          {projects.length === 0 ? <Empty>진행 중인 프로젝트가 없습니다. 단계 명칭은 본교 전자결재 절차에 맞춰 조정합니다.</Empty> : (
            <ul className="list">{projects.slice(0, 3).map(p => <li key={p.id}><span>{p.name}</span><span className="badge navy">{STAGES[p.stage]}</span></li>)}</ul>
          )}
        </Card>
      </div>
      <div className="grid">
        <Feature to="rules" icon="scale" title="규정 근거 Q&A" desc="학칙·규정·지침에서 조항을 찾아 근거로 답합니다." />
        <Feature to="docs" icon="doc" tone="green" title="공문·기안 작성" desc="초안 작성과 발송 전 날짜·맞춤법·개인정보 점검" />
        <Feature to="meeting" icon="check" tone="amber" title="회의 도우미" desc="회의록 정리와 할 일 자동 추출" />
      </div>
      <div className="grid">
        <Feature to="evaluation" icon="check" title="평가·인증 자료함" desc="지표별 증빙을 모으고 빠진 증빙을 알려 줍니다." />
        <Feature to="analysis" icon="search" tone="green" title="문서·데이터 분석" desc="보고서 요약, 엑셀 집계와 표 정리" />
        <Feature to="research" icon="search" tone="amber" title="심층 리서치" desc="정책·사례 조사와 출처 정리" />
      </div>
    </>
  )
}

export function Projects() {
  const [projects, setProjects] = useStored('projects', [])
  const [todos, setTodos] = useTodos()
  const [name, setName] = useState('')
  const [sel, setSel] = useState(null)
  const cur = projects.find(p => p.id === sel)

  function create(e) {
    e.preventDefault()
    if (!name.trim()) return
    const p = { id: uid(), name: name.trim(), stage: 0, done: {} }
    setProjects([p, ...projects]); setSel(p.id); setName('')
  }
  const update = patch => setProjects(projects.map(p => (p.id === cur.id ? { ...p, ...patch } : p)))
  const toggle = key => update({ done: { ...cur.done, [key]: !cur.done?.[key] } })

  return (
    <>
      <PageHead title="업무 프로젝트" desc="사업 하나를 단계별로 이어서 관리합니다. 각 단계의 체크 항목은 본교 절차에 맞춰 바꿀 수 있습니다." />
      <div className="grid-2">
        <Card title="프로젝트 목록">
          <form className="row" onSubmit={create}>
            <label className="sr-only" htmlFor="pname">프로젝트 이름</label>
            <input id="pname" className="input" style={{ flex: 1 }} placeholder="예: 2027 늘봄 강사 연수" value={name} onChange={e => setName(e.target.value)} />
            <button className="btn primary">만들기</button>
          </form>
          {projects.length === 0 ? <Empty>아직 프로젝트가 없습니다.</Empty> : (
            <ul className="list">
              {projects.map(p => (
                <li key={p.id} style={{ background: p.id === sel ? 'var(--blue-soft)' : undefined }}>
                  <button className="btn" style={{ border: 'none', background: 'transparent', padding: 0, minHeight: 'auto', textAlign: 'left' }} onClick={() => setSel(p.id)}>{p.name}</button>
                  <span className="badge navy">{STAGES[p.stage]}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={cur ? cur.name : '프로젝트를 선택하세요'}>
          {!cur ? <Empty>왼쪽에서 프로젝트를 만들거나 선택하면 단계별 점검표가 나타납니다.</Empty> : (
            <>
              <ol className="steps">
                {STAGES.map((s, i) => (
                  <li key={s} className="row" style={{ gap: 6 }}>
                    <button className={i === cur.stage ? 'on' : ''} onClick={() => update({ stage: i })}>{i + 1} {s}</button>
                    {i < STAGES.length - 1 && <span className="sep" aria-hidden="true">›</span>}
                  </li>
                ))}
              </ol>
              <ul className="list">
                {STAGE_TASKS[STAGES[cur.stage]].map(t => {
                  const key = `${cur.stage}:${t}`
                  return (
                    <li key={key}>
                      <label className="row" style={{ gap: 10, cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!cur.done?.[key]} onChange={() => toggle(key)} style={{ width: 18, height: 18 }} />
                        <span style={{ textDecoration: cur.done?.[key] ? 'line-through' : 'none' }}>{t}</span>
                      </label>
                      <span className="row" style={{ gap: 6 }}>
                        <Link className="small" to={`../chat?q=${encodeURIComponent(`[${cur.name}] ${t} 초안을 만들어 줘`)}`}>AI 초안</Link>
                        <button className="btn" style={{ minHeight: 34, padding: '0 10px' }} onClick={() => setTodos([{ id: uid(), text: `[${cur.name}] ${t}`, due: '', done: false }, ...todos])}>할 일로</button>
                      </span>
                    </li>
                  )
                })}
              </ul>
              <div className="row">
                <button className="btn" onClick={() => setProjects(projects.filter(p => p.id !== cur.id))}>프로젝트 삭제</button>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  )
}

export function Todo() {
  const [todos, setTodos] = useTodos()
  const [text, setText] = useState('')
  const [due, setDue] = useState('')
  function add(e) {
    e.preventDefault()
    if (!text.trim()) return
    setTodos([{ id: uid(), text: text.trim(), due, done: false }, ...todos]); setText(''); setDue('')
  }
  return (
    <>
      <PageHead title="할 일" desc="직접 추가한 할 일과 회의록·업무 프로젝트에서 넘어온 할 일을 함께 관리합니다." />
      <Card>
        <form className="row" onSubmit={add}>
          <label className="sr-only" htmlFor="tt">할 일</label>
          <input id="tt" className="input" style={{ flex: '1 1 260px', width: 'auto' }} placeholder="할 일 입력" value={text} onChange={e => setText(e.target.value)} />
          <label className="sr-only" htmlFor="td">마감일</label>
          <input id="td" type="date" className="input" style={{ width: 170 }} value={due} onChange={e => setDue(e.target.value)} />
          <button className="btn primary">추가</button>
        </form>
        {todos.length === 0 ? <Empty>할 일이 없습니다.</Empty> : (
          <ul className="list">
            {todos.map(t => (
              <li key={t.id}>
                <label className="row" style={{ gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={t.done} onChange={() => setTodos(todos.map(x => (x.id === t.id ? { ...x, done: !x.done } : x)))} style={{ width: 18, height: 18 }} />
                  <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                </label>
                <span className="row" style={{ gap: 8 }}>
                  <span className="muted small">{t.due || '기한 없음'}</span>
                  <button className="btn" style={{ minHeight: 34, padding: '0 10px' }} onClick={() => setTodos(todos.filter(x => x.id !== t.id))}>삭제</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

export function OfficialDocs() {
  const [form, setForm] = useState({ to: '', title: '', purpose: '' })
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [checks, setChecks] = useState(null)
  const set = k => e => setForm({ ...form, [k]: e.target.value })

  async function generate(e) {
    e.preventDefault()
    setBusy(true); setChecks(null)
    const prompt = `수신: ${form.to}\n제목: ${form.title}\n주요 내용: ${form.purpose}`
    await askAI({ task: 'docs', messages: [{ role: 'user', content: prompt }], onToken: setDraft })
    setBusy(false)
  }
  return (
    <>
      <PageHead title="공문·기안 작성" desc="초안을 만들고, 발송 전에 날짜 표기·맞춤법·개인정보를 점검합니다. 점검 기능은 지금도 실제로 작동합니다." />
      <div className="grid-2">
        <Card title="1. 초안 만들기">
          <form className="stack" onSubmit={generate}>
            <div className="field"><label htmlFor="d-to">수신</label><input id="d-to" className="input" value={form.to} onChange={set('to')} placeholder="예: 각 학과장" /></div>
            <div className="field"><label htmlFor="d-title">제목</label><input id="d-title" className="input" value={form.title} onChange={set('title')} placeholder="예: 2027학년도 AI 교수법 워크숍 참가 안내" /></div>
            <div className="field"><label htmlFor="d-p">주요 내용</label><textarea id="d-p" className="textarea" value={form.purpose} onChange={set('purpose')} placeholder="일시, 장소, 대상, 요청 사항 등을 적어 주세요" /></div>
            <button className="btn primary" disabled={busy}>{busy ? '작성 중' : '초안 만들기'}</button>
          </form>
        </Card>
        <Card title="2. 검토와 발송 전 점검">
          <div className="field">
            <label htmlFor="d-draft">초안 (직접 고쳐 쓸 수 있습니다)</label>
            <textarea id="d-draft" className="textarea" style={{ minHeight: 260 }} value={draft} onChange={e => setDraft(e.target.value)} />
          </div>
          <div className="row">
            <button className="btn primary" onClick={() => setChecks(checkDocument(draft))} disabled={!draft.trim()}>발송 전 점검</button>
            <button className="btn" onClick={() => navigator.clipboard?.writeText(draft)} disabled={!draft.trim()}>복사</button>
          </div>
          {checks && <div className="stack" style={{ gap: 6 }}>{checks.map((c, i) => <div key={i} className={`check ${c.level}`}>{c.text}</div>)}</div>}
        </Card>
      </div>
    </>
  )
}

function extractActions(text) {
  return text.split(/\n|(?<=[.다])\s+/)
    .map(s => s.trim())
    .filter(s => /(까지|하기로|담당|요청|제출|준비|검토하기|확인하기)/.test(s) && s.length > 4)
    .slice(0, 10)
}

export function Meeting() {
  const [text, setText] = useState('')
  const [summary, setSummary] = useState('')
  const [actions, setActions] = useState([])
  const [todos, setTodos] = useTodos()
  const [busy, setBusy] = useState(false)
  async function run() {
    setBusy(true)
    setActions(extractActions(text))
    await askAI({ task: 'meeting', messages: [{ role: 'user', content: text }], onToken: setSummary })
    setBusy(false)
  }
  return (
    <>
      <PageHead title="회의 도우미" desc="회의 메모를 붙여 넣으면 요약과 할 일을 정리합니다." />
      <div className="grid-2">
        <Card title="회의 내용">
          <div className="field"><label htmlFor="m-text">회의 메모 붙여 넣기</label><textarea id="m-text" className="textarea" style={{ minHeight: 240 }} value={text} onChange={e => setText(e.target.value)} placeholder={'예: 홍보 영상은 기획팀이 11월 30일까지 준비하기로 함.\n예산안은 다음 회의 전까지 재무팀 검토 요청.'} /></div>
          <button className="btn primary" onClick={run} disabled={busy || !text.trim()}>정리하기</button>
        </Card>
        <Card title="정리 결과">
          {summary ? <div className="output">{summary}</div> : <Empty>정리 결과가 여기에 표시됩니다.</Empty>}
          <h3 style={{ fontSize: 15 }}>추출된 할 일</h3>
          {actions.length === 0 ? <Empty>"~까지", "~하기로", "담당" 같은 표현이 들어간 문장을 할 일로 뽑습니다.</Empty> : (
            <>
              <ul className="list">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
              <button className="btn soft" onClick={() => { setTodos([...actions.map(a => ({ id: uid(), text: a, due: '', done: false })), ...todos]); setActions([]) }}>모두 할 일에 추가</button>
            </>
          )}
        </Card>
      </div>
    </>
  )
}

export function RulesQA({ title = '규정 근거 Q&A', desc = '규정 원문을 붙여 넣거나 텍스트 파일로 올리면 질문과 관련된 조항을 찾아 근거로 답합니다. 조항 검색은 지금도 실제로 작동합니다.', storeKey = 'rules:staff', placeholder = '예: 출장 신청은 며칠 전까지 해야 하나요?' }) {
  const [source, setSource] = useStored(storeKey, SAMPLE_RULES)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState(null)
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const articles = splitArticles(source)

  async function ask(e) {
    e.preventDefault()
    if (!q.trim()) return
    const found = searchArticles(articles, q)
    setHits(found); setAnswer(''); setBusy(true)
    const context = found.map(a => a.body).join('\n\n')
    await askAI({ task: 'rules', messages: [{ role: 'user', content: q }], context, onToken: setAnswer })
    setBusy(false)
  }
  async function upload(e) {
    const f = e.target.files[0]
    if (!f) return
    setSource(await f.text()); e.target.value = ''
  }
  return (
    <>
      <PageHead title={title} desc={desc} />
      <div className="grid-2">
        <Card title="질문하기">
          <form className="row" onSubmit={ask}>
            <label className="sr-only" htmlFor="rq">질문</label>
            <input id="rq" className="input" style={{ flex: 1 }} value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} />
            <button className="btn primary" disabled={busy}>질문</button>
          </form>
          {hits && (hits.length === 0 ? <Empty>관련 조항을 찾지 못했습니다. 다른 표현으로 물어보거나 규정 원문을 확인해 주세요.</Empty> : (
            <div className="stack">
              <span className="muted small">근거 조항 {hits.length}건</span>
              {hits.map((h, i) => <div key={i} className="output"><b>{h.no} {h.title && `(${h.title})`}</b>{'\n'}{h.body}</div>)}
            </div>
          ))}
          {answer && <div className="output">{answer}</div>}
        </Card>
        <Card title="규정 원문" action={<label className="btn soft" style={{ display: 'inline-flex', alignItems: 'center' }}>텍스트 파일 올리기<input type="file" accept=".txt,.md" className="sr-only" onChange={upload} /></label>}>
          <p className="muted small">현재 {articles.filter(a => a.no).length}개 조항이 인식되었습니다. "제○조(제목)" 형식으로 나뉩니다. 기본으로 들어 있는 내용은 시연용 예시 규정입니다.</p>
          <label className="sr-only" htmlFor="rsrc">규정 원문</label>
          <textarea id="rsrc" className="textarea" style={{ minHeight: 320 }} value={source} onChange={e => setSource(e.target.value)} />
        </Card>
      </div>
    </>
  )
}

export function Evaluation() {
  const [items, setItems] = useStored('evaluation', [
    { id: uid(), name: '[지표명 1]', need: 3, files: [] },
    { id: uid(), name: '[지표명 2]', need: 2, files: [] },
  ])
  const [name, setName] = useState('')
  const attach = (id, e) => {
    const names = [...e.target.files].map(f => f.name)
    setItems(items.map(it => (it.id === id ? { ...it, files: [...it.files, ...names] } : it)))
    e.target.value = ''
  }
  const missing = items.filter(it => it.files.length < it.need).length
  return (
    <>
      <PageHead title="평가·인증 자료함" desc="기관평가인증·사업 성과지표의 지표별 증빙을 모읍니다. 지표 이름과 필요한 증빙 수는 실제 지표에 맞게 바꿔 쓰세요." />
      <Card title={`증빙 현황 (부족 ${missing}개 지표)`}>
        <form className="row" onSubmit={e => { e.preventDefault(); if (name.trim()) { setItems([...items, { id: uid(), name: name.trim(), need: 1, files: [] }]); setName('') } }}>
          <label className="sr-only" htmlFor="ev-name">지표 이름</label>
          <input id="ev-name" className="input" style={{ flex: 1 }} placeholder="지표 이름 추가" value={name} onChange={e => setName(e.target.value)} />
          <button className="btn primary">추가</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">지표</th><th scope="col">필요 증빙</th><th scope="col">등록된 증빙</th><th scope="col">상태</th><th scope="col"><span className="sr-only">작업</span></th></tr></thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td>{it.name}</td>
                  <td>
                    <label className="sr-only" htmlFor={`need-${it.id}`}>필요 증빙 수</label>
                    <input id={`need-${it.id}`} type="number" min="1" className="input" style={{ width: 80 }} value={it.need} onChange={e => setItems(items.map(x => (x.id === it.id ? { ...x, need: Number(e.target.value) || 1 } : x)))} />
                  </td>
                  <td className="small">{it.files.length ? it.files.join(', ') : '없음'}</td>
                  <td>{it.files.length >= it.need ? <span className="badge green">충족</span> : <span className="badge red">{it.need - it.files.length}건 부족</span>}</td>
                  <td><label className="btn soft" style={{ display: 'inline-flex', alignItems: 'center' }}>증빙 추가<input type="file" multiple className="sr-only" onChange={e => attach(it.id, e)} /></label></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
