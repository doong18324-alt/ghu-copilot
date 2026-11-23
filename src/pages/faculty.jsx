import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Hero } from './common.jsx'
import { Card, Feature, PageHead, Empty } from '../components/ui.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import { useStored, uid } from '../lib/store.js'
import { askAI } from '../lib/ai.js'

function useCourses() { return useStored('courses', []) }

export function FacultyHome() {
  const [courses] = useCourses()
  return (
    <>
      <Hero title="수업과 연구, 무엇부터 시작할까요?" desc="강의자료를 올리면 수업 설계, 문항 출제, 강좌봇 구성이 같은 자료를 바탕으로 이어집니다." placeholder="예: 3주차 학습목표와 형성평가 문항을 만들어 줘" chips={['15주 수업계획서 초안', '국가고시형 문항 10개', '루브릭 만들기', '영문 초록 교정']} />
      <Card title="내 강좌" action={<Link to="courses" className="btn soft" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>강좌 관리</Link>}>
        {courses.length === 0 ? <Empty>개설한 강좌방이 없습니다. 강좌방을 열면 학생이 등록을 신청하고, 승인한 학생만 강좌봇을 쓸 수 있습니다.</Empty> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th scope="col">강좌</th><th scope="col">수강 승인 대기</th><th scope="col">강좌봇</th><th scope="col">이번 주 학생 질문</th></tr></thead>
              <tbody>{courses.map(c => (
                <tr key={c.id}><td>{c.name}</td><td>{c.pending.length}명</td><td>{c.bot?.published ? <span className="badge green">공개 중</span> : <span className="badge">미설정</span>}</td><td>0건</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
      <div className="grid">
        <Feature to="bot" icon="bot" title="강좌봇 빌더" desc="강의자료 범위 안에서만 답하는 AI 조교 만들기" />
        <Feature to="items" icon="doc" tone="green" title="문항 출제" desc="국가고시형 문항과 해설, 출처 쪽수 함께 생성" />
        <Feature to="analytics" icon="search" tone="amber" title="학습 분석" desc="학생들이 자주 막히는 개념 모아 보기" />
      </div>
      <div className="grid">
        <Feature to="research" icon="search" title="연구에 AI 쓰기" desc="문헌 검토, 통계 코드, IRB 서식 초안, 영문 교정" />
        <Feature to="apps" icon="code" tone="green" title="전공 앱 만들기" desc="말로 설명해 전공 실습용 웹앱 만들기" />
        <Feature to="training" icon="cap" tone="amber" title="역량강화 과정" desc="AI 교수법·연구 활용 워크숍 신청" />
      </div>
    </>
  )
}

export function Courses() {
  const [courses, setCourses] = useCourses()
  const [name, setName] = useState('')
  function add(e) {
    e.preventDefault()
    if (!name.trim()) return
    setCourses([...courses, { id: uid(), name: name.trim(), code: Math.random().toString(36).slice(2, 7).toUpperCase(), pending: ['[학생 1]', '[학생 2]'], members: [], bot: null }])
    setName('')
  }
  const approve = (cid, s) => setCourses(courses.map(c => (c.id === cid ? { ...c, pending: c.pending.filter(x => x !== s), members: [...c.members, s] } : c)))
  return (
    <>
      <PageHead title="내 강좌" desc="강좌방을 열고 참여 코드를 학생에게 알려 주세요. 승인한 학생만 강좌봇을 사용할 수 있습니다." />
      <Card title="강좌방 개설">
        <form className="row" onSubmit={add}>
          <label className="sr-only" htmlFor="cname">교과목명</label>
          <input id="cname" className="input" style={{ flex: 1 }} placeholder="교과목명 입력" value={name} onChange={e => setName(e.target.value)} />
          <button className="btn primary">개설</button>
        </form>
      </Card>
      {courses.length === 0 ? <Empty>개설한 강좌방이 없습니다.</Empty> : courses.map(c => (
        <Card key={c.id} title={c.name} action={<span className="badge blue">참여 코드 {c.code}</span>}>
          <div className="grid-2">
            <div className="stack">
              <b className="small">승인 대기 {c.pending.length}명</b>
              {c.pending.length === 0 ? <Empty>대기 중인 학생이 없습니다.</Empty> : (
                <ul className="list">{c.pending.map(s => <li key={s}><span>{s}</span><button className="btn soft" onClick={() => approve(c.id, s)}>승인</button></li>)}</ul>
              )}
            </div>
            <div className="stack">
              <b className="small">수강생 {c.members.length}명</b>
              {c.members.length === 0 ? <Empty>승인한 학생이 여기에 표시됩니다.</Empty> : <ul className="list">{c.members.map(s => <li key={s}>{s}</li>)}</ul>}
            </div>
          </div>
          <div className="row">
            <Link to="../bot" className="small">이 강좌의 강좌봇 설정</Link>
            <button className="btn" onClick={() => setCourses(courses.filter(x => x.id !== c.id))}>강좌방 삭제</button>
          </div>
        </Card>
      ))}
    </>
  )
}

const BOT_STEPS = ['강의자료', '답변 범위', '힌트·정답 공개', '미리 시험', '공개']

export function BotBuilder() {
  const [courses, setCourses] = useCourses()
  const [cid, setCid] = useState(courses[0]?.id || '')
  const [step, setStep] = useState(0)
  const course = courses.find(c => c.id === cid)
  const bot = course?.bot || { files: [], scope: 'materials', hint: 'hint-first', tone: '친절하고 간결하게', published: false }
  const save = patch => setCourses(courses.map(c => (c.id === cid ? { ...c, bot: { ...bot, ...patch } } : c)))

  if (courses.length === 0) {
    return (<><PageHead title="강좌봇 빌더" /><Card><Empty>먼저 <Link to="../courses">내 강좌</Link>에서 강좌방을 개설해 주세요.</Empty></Card></>)
  }
  return (
    <>
      <PageHead title="강좌봇 빌더" desc="학생 질문에 교수님 강의자료 범위 안에서 답하는 AI 조교를 만듭니다." />
      <Card>
        <div className="row">
          <label htmlFor="bcourse" className="small">강좌</label>
          <select id="bcourse" className="input select" value={cid} onChange={e => { setCid(e.target.value); setStep(0) }}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {bot.published && <span className="badge green">학생에게 공개 중</span>}
        </div>
        <ol className="steps">
          {BOT_STEPS.map((s, i) => (
            <li key={s} className="row" style={{ gap: 6 }}>
              <button className={i === step ? 'on' : ''} onClick={() => setStep(i)}>{i + 1} {s}</button>
              {i < BOT_STEPS.length - 1 && <span className="sep" aria-hidden="true">›</span>}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="stack">
            <p className="muted">PDF, PPT, 한글 문서를 올리면 실제 연결 후 내용을 조각내어 검색할 수 있게 저장합니다. 시연 모드에서는 파일 이름만 기록합니다.</p>
            <label className="btn soft" style={{ display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>강의자료 올리기<input type="file" multiple className="sr-only" onChange={e => { save({ files: [...bot.files, ...[...e.target.files].map(f => f.name)] }); e.target.value = '' }} /></label>
            {bot.files.length === 0 ? <Empty>올린 자료가 없습니다.</Empty> : <ul className="list">{bot.files.map(f => <li key={f}>{f}</li>)}</ul>}
          </div>
        )}
        {step === 1 && (
          <fieldset className="stack" style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="small" style={{ fontWeight: 500, marginBottom: 8 }}>답변 범위</legend>
            {[['materials', '강의자료 안에서만 답하기 (자료에 없으면 "자료에 없음"으로 답함)'], ['materials+general', '강의자료를 우선하고, 일반 지식은 출처를 구분해 덧붙이기']].map(([v, l]) => (
              <label key={v} className="list-item" style={{ cursor: 'pointer', justifyContent: 'flex-start' }}><input type="radio" name="scope" checked={bot.scope === v} onChange={() => save({ scope: v })} />{l}</label>
            ))}
          </fieldset>
        )}
        {step === 2 && (
          <div className="stack">
            <fieldset className="stack" style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend className="small" style={{ fontWeight: 500, marginBottom: 8 }}>과제·문제 질문에 대한 답변 방식</legend>
              {[['hint-first', '힌트부터 단계적으로 제시하고 정답은 바로 주지 않기'], ['explain', '풀이 과정을 설명하되 최종 답은 학생이 쓰게 하기'], ['answer', '정답과 해설을 바로 제시하기 (복습용 과목)']].map(([v, l]) => (
                <label key={v} className="list-item" style={{ cursor: 'pointer', justifyContent: 'flex-start' }}><input type="radio" name="hint" checked={bot.hint === v} onChange={() => save({ hint: v })} />{l}</label>
              ))}
            </fieldset>
            <div className="field"><label htmlFor="btone">말투</label><input id="btone" className="input" value={bot.tone} onChange={e => save({ tone: e.target.value })} /></div>
          </div>
        )}
        {step === 3 && (
          <div className="stack">
            <p className="muted">학생 입장에서 질문해 보세요. 공개 전에 답변 방식을 확인할 수 있습니다.</p>
            <ChatPanel task="coursebot" storageKey={`bot-test:${cid}`} modelPicker={false} placeholder="예: 이번 주 과제 3번 답이 뭐예요?" context={`범위:${bot.scope} 방식:${bot.hint} 말투:${bot.tone}`} />
          </div>
        )}
        {step === 4 && (
          <div className="stack">
            <ul className="list">
              <li><span>강의자료</span><span>{bot.files.length}개</span></li>
              <li><span>답변 범위</span><span>{bot.scope === 'materials' ? '자료 안에서만' : '자료 우선 + 일반 지식'}</span></li>
              <li><span>답변 방식</span><span>{{ 'hint-first': '힌트 우선', explain: '풀이 설명', answer: '정답 제시' }[bot.hint]}</span></li>
            </ul>
            <button className="btn primary" onClick={() => save({ published: !bot.published })}>{bot.published ? '공개 중지' : '승인된 학생에게 공개'}</button>
          </div>
        )}
      </Card>
    </>
  )
}

export function ItemGen() {
  const [form, setForm] = useState({ topic: '', type: '국가고시형 5지선다', level: '적용', count: 5 })
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => setForm({ ...form, [k]: e.target.value })
  async function run(e) {
    e.preventDefault(); setBusy(true)
    await askAI({ task: 'items', messages: [{ role: 'user', content: `범위: ${form.topic}\n유형: ${form.type}\n인지 수준: ${form.level}\n문항 수: ${form.count}` }], onToken: setOut })
    setBusy(false)
  }
  return (
    <>
      <PageHead title="문항 출제" desc="강의자료를 근거로 문항을 만들고 정답 해설과 출처 쪽수를 함께 붙입니다. 생성된 문항은 반드시 검토 후 사용하세요." />
      <div className="grid-2">
        <Card title="출제 조건">
          <form className="stack" onSubmit={run}>
            <div className="field"><label htmlFor="i-topic">출제 범위</label><input id="i-topic" className="input" value={form.topic} onChange={set('topic')} placeholder="예: 3~5주차 근골격계 해부학" /></div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}><label htmlFor="i-type">유형</label><select id="i-type" className="input" value={form.type} onChange={set('type')}><option>국가고시형 5지선다</option><option>단답형</option><option>사례 기반 서술형</option></select></div>
              <div className="field" style={{ flex: 1 }}><label htmlFor="i-level">인지 수준</label><select id="i-level" className="input" value={form.level} onChange={set('level')}><option>기억·이해</option><option>적용</option><option>분석·평가</option></select></div>
              <div className="field" style={{ width: 100 }}><label htmlFor="i-count">문항 수</label><input id="i-count" type="number" min="1" max="30" className="input" value={form.count} onChange={set('count')} /></div>
            </div>
            <label className="btn" style={{ display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>근거 강의자료 첨부<input type="file" className="sr-only" /></label>
            <button className="btn primary" disabled={busy}>{busy ? '생성 중' : '문항 생성'}</button>
          </form>
        </Card>
        <Card title="생성 결과">{out ? <div className="output">{out}</div> : <Empty>생성된 문항이 여기에 표시됩니다.</Empty>}</Card>
      </div>
    </>
  )
}

export function Analytics() {
  return (
    <>
      <PageHead title="학습 분석" desc="강좌봇에 들어온 질문을 개념별로 묶어 학생들이 자주 막히는 부분을 보여 줍니다." />
      <div className="check warn">개인정보 보호를 위해 개별 학생의 대화 원문과 이름은 표시하지 않고, 개념별 묶음과 건수만 보여 줍니다.</div>
      <div className="grid">
        <Card title="이번 주 막힌 개념 상위 5"><Empty>강좌봇을 공개하고 학생 질문이 쌓이면 표시됩니다.</Empty></Card>
        <Card title="주차별 질문 수"><Empty>강좌봇 사용 기록이 쌓이면 표시됩니다.</Empty></Card>
        <Card title="다음 수업에 다룰 내용 제안"><Empty>막힌 개념을 바탕으로 보충 설명 자료 초안을 제안합니다.</Empty></Card>
      </div>
    </>
  )
}

export function Training() {
  const [applied, setApplied] = useStored('training', [])
  const list = ['[워크숍명 1] AI 조교로 수업 설계하기', '[워크숍명 2] 연구에 생성형 AI 쓰기', '[워크숍명 3] 바이브코딩으로 전공 앱 만들기']
  return (
    <>
      <PageHead title="역량강화 과정" desc="일정과 정원은 AI대학혁신본부 공지에 맞춰 채워 넣습니다." />
      <Card>
        <ul className="list">
          {list.map(w => (
            <li key={w}><span>{w}<br /><span className="muted small">[일시] · [장소] · 정원 [ ]명</span></span>
              <button className={applied.includes(w) ? 'btn' : 'btn primary'} onClick={() => setApplied(applied.includes(w) ? applied.filter(x => x !== w) : [...applied, w])}>{applied.includes(w) ? '신청 취소' : '신청'}</button></li>
          ))}
        </ul>
      </Card>
    </>
  )
}
