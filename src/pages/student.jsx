import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Hero, TaskPage } from './common.jsx'
import { RulesQA } from './staff.jsx'
import { Card, Feature, PageHead, Empty, Icon } from '../components/ui.jsx'
import { useStored } from '../lib/store.js'
import { askAI } from '../lib/ai.js'
import { maskPII, findPII } from '../lib/privacy.js'

const SAMPLE_QUESTIONS = [
  { q: '위팔두갈래근(biceps brachii)의 주된 작용으로 옳은 것은?', o: ['팔꿈치관절 폄', '팔꿈치관절 굽힘과 아래팔 뒤침', '어깨관절 모음', '손목관절 폄', '아래팔 엎침'], a: 1, e: '위팔두갈래근은 팔꿈치관절을 굽히고 아래팔을 뒤칩니다.' },
  { q: '넙다리네갈래근을 지배하는 신경은?', o: ['궁둥신경', '폐쇄신경', '넙다리신경', '정강신경', '온종아리신경'], a: 2, e: '넙다리네갈래근은 넙다리신경의 지배를 받습니다.' },
  { q: '근육의 길이 변화 없이 장력이 발생하는 수축은?', o: ['등척성 수축', '등장성 단축성 수축', '등장성 신장성 수축', '등속성 수축', '강축'], a: 0, e: '등척성 수축은 관절 움직임 없이 근육 길이가 유지된 채 장력이 생기는 수축입니다.' },
  { q: '어깨관절의 회전근띠(rotator cuff)에 속하지 않는 근육은?', o: ['가시위근', '가시아래근', '작은원근', '어깨밑근', '큰원근'], a: 4, e: '회전근띠는 가시위근, 가시아래근, 작은원근, 어깨밑근으로 이루어지며 큰원근은 포함되지 않습니다.' },
]

export function StudentHome() {
  const [courses] = useStored('student-courses', [])
  return (
    <>
      <Hero title="궁금한 것을 물어보세요" desc="교과목방 질문은 교수님이 올린 강의자료를 근거로, 학교생활 질문은 학칙과 안내문을 근거로 답합니다." placeholder="예: 오늘 배운 근수축 유형을 예시와 함께 정리해 줘" chips={['오늘 수업 요약', '국시 문제 풀기', '휴학 절차 알려 줘', '자기소개서 첨삭']} />
      <div className="grid">
        <Card title="내 교과목방" action={<Link to="courses" className="small">교과목 등록</Link>}>
          {courses.length === 0 ? <Empty>등록한 교과목이 없습니다. 교수님이 알려 준 참여 코드로 등록하세요.</Empty> : (
            <ul className="list">{courses.map(c => <li key={c.code}><span>{c.name}</span>{c.approved ? <span className="badge green">AI 조교 이용 가능</span> : <span className="badge amber">교수 승인 대기</span>}</li>)}</ul>
          )}
        </Card>
        <Card title="국가고시 대비" action={<span className="badge navy">D-[일]</span>}>
          <p className="muted">과목별 문제를 풀고, 틀린 문제는 해설과 관련 강의자료로 연결합니다.</p>
          <Link to="exam" className="btn primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>오늘의 문제 풀기</Link>
        </Card>
        <Card title="스터디룸 예약" action={<Link to="room" className="small">예약하기</Link>}>
          <p className="muted">현장 접수 없이 빈 시간을 바로 예약합니다.</p>
        </Card>
      </div>
      <div className="grid">
        <Feature to="notes" icon="doc" tone="amber" title="학습 노트" desc="필기를 요약, 용어, 복습 퀴즈로 정리" />
        <Feature to="clinical" icon="doc" tone="green" title="실습 일지 도우미" desc="환자 식별정보를 자동으로 가리고 일지 정리" />
        <Feature to="campus" icon="scale" title="학교생활 Q&A" desc="학칙·학사안내 근거로 휴학, 장학, 수강 질문 답변" />
        <Feature to="programs" icon="calendar" tone="green" title="프로그램 신청" desc="서포터즈, 자격증 과정, 비교과를 보고 바로 신청" />
        <Feature to="resume" icon="doc" tone="amber" title="이력서 만들기" desc="사진과 활동을 넣어 PDF·워드 이력서 완성" />
        <Feature to="achievements" icon="check" title="AI 활용 실적" desc="AI로 만든 프로젝트와 앱을 올리고 서로 확인" />
      </div>
    </>
  )
}

export function MyCourses() {
  const [courses, setCourses] = useStored('student-courses', [])
  const [code, setCode] = useState('')
  function join(e) {
    e.preventDefault()
    if (!code.trim()) return
    setCourses([...courses, { code: code.trim().toUpperCase(), name: `[교과목명] (${code.trim().toUpperCase()})`, approved: false }])
    setCode('')
  }
  const approvedCourse = courses.find(c => c.approved)
  return (
    <>
      <PageHead title="내 교과목방" desc="참여 코드로 등록하고 교수님이 승인하면 그 과목 전용 AI 조교를 쓸 수 있습니다." />
      <Card title="교과목 등록">
        <form className="row" onSubmit={join}>
          <label className="sr-only" htmlFor="jc">참여 코드</label>
          <input id="jc" className="input" style={{ flex: 1 }} placeholder="참여 코드 입력" value={code} onChange={e => setCode(e.target.value)} />
          <button className="btn primary">등록 신청</button>
        </form>
        {courses.length === 0 ? <Empty>등록한 교과목이 없습니다.</Empty> : (
          <ul className="list">{courses.map(c => (
            <li key={c.code}><span>{c.name}</span>
              {c.approved ? <span className="badge green">이용 가능</span> : (
                <span className="row" style={{ gap: 8 }}><span className="badge amber">승인 대기</span>
                  <button className="btn" style={{ minHeight: 34, padding: '0 10px' }} onClick={() => setCourses(courses.map(x => (x.code === c.code ? { ...x, approved: true } : x)))} title="시연용: 교수 승인을 흉내 냅니다">승인 처리(시연)</button>
                </span>
              )}
            </li>
          ))}</ul>
        )}
      </Card>
      {approvedCourse && (
        <Card title={`${approvedCourse.name} AI 조교`}>
          <p className="muted small">이 조교는 교수님이 올린 강의자료 범위에서 답하고, 과제 질문에는 힌트부터 제시합니다.</p>
          <TaskInline code={approvedCourse.code} />
        </Card>
      )}
    </>
  )
}

function TaskInline({ code }) {
  const [log, setLog] = useStored(`tutor:${code}`, [])
  const [q, setQ] = useState('')
  async function send(e) {
    e.preventDefault()
    if (!q.trim()) return
    const next = [...log, { role: 'user', content: q }]
    setLog([...next, { role: 'assistant', content: '' }]); setQ('')
    await askAI({ task: 'coursebot', messages: next, onToken: t => setLog([...next, { role: 'assistant', content: t }]) })
  }
  return (
    <div className="stack">
      {log.length > 0 && <div className="chat-log">{log.map((m, i) => <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>{m.content || '…'}</div>)}</div>}
      <form className="row" onSubmit={send}>
        <label className="sr-only" htmlFor={`tq-${code}`}>질문</label>
        <input id={`tq-${code}`} className="input" style={{ flex: 1 }} value={q} onChange={e => setQ(e.target.value)} placeholder="이 과목에 대해 질문하세요" />
        <button className="btn primary">보내기</button>
      </form>
    </div>
  )
}

export function Exam() {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useStored('exam-score', { right: 0, total: 0 })
  const item = SAMPLE_QUESTIONS[i]
  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    setScore({ right: score.right + (k === item.a ? 1 : 0), total: score.total + 1 })
  }
  return (
    <>
      <PageHead title="국가고시 대비" desc="과목별 문제를 풀고 취약 영역을 확인합니다." />
      <div className="check warn">아래 문항은 화면 시연용 예시입니다. 실제 서비스에서는 학과 교수진이 검수한 문항만 탑재합니다.</div>
      <div className="grid-2">
        <Card title={`문제 ${i + 1} / ${SAMPLE_QUESTIONS.length}`}>
          <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.6 }}>{item.q}</p>
          <div className="stack" style={{ gap: 8 }}>
            {item.o.map((o, k) => {
              const cls = picked === null ? '' : k === item.a ? 'right' : k === picked ? 'wrong' : ''
              return <button key={k} className={`option ${cls}`} onClick={() => pick(k)} aria-pressed={picked === k}>{'①②③④⑤'[k]} {o}</button>
            })}
          </div>
          {picked !== null && (
            <>
              <div className={`check ${picked === item.a ? 'ok' : 'bad'}`}>{picked === item.a ? '정답입니다. ' : '오답입니다. '}{item.e}</div>
              <button className="btn primary" onClick={() => { setI((i + 1) % SAMPLE_QUESTIONS.length); setPicked(null) }}>다음 문제</button>
            </>
          )}
        </Card>
        <Card title="나의 기록">
          <div className="stat-row">
            <div className="stat" style={{ background: 'var(--blue-soft)' }}><b>{score.total}</b><span>푼 문제</span></div>
            <div className="stat" style={{ background: 'var(--green-soft)' }}><b>{score.right}</b><span>맞힌 문제</span></div>
            <div className="stat" style={{ background: 'var(--amber-soft)' }}><b>{score.total ? Math.round((score.right / score.total) * 100) : 0}%</b><span>정답률</span></div>
          </div>
          <Empty>과목 분류가 붙은 실제 문항이 탑재되면 과목별 정답률과 취약 영역이 표시됩니다.</Empty>
          <button className="btn" onClick={() => setScore({ right: 0, total: 0 })}>기록 초기화</button>
        </Card>
      </div>
    </>
  )
}

export function Clinical() {
  const [raw, setRaw] = useState('')
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState(false)
  const masked = maskPII(raw)
  const pii = findPII(raw)
  async function run() {
    setBusy(true)
    await askAI({ task: 'clinical', messages: [{ role: 'user', content: masked }], onToken: setOut })
    setBusy(false)
  }
  return (
    <>
      <PageHead title="실습 일지 도우미" desc="현장실습 기록을 학과 일지 양식에 맞춰 정리합니다. 식별정보 가림은 지금도 실제로 작동합니다." />
      <div className="row check bad" style={{ alignItems: 'center' }}><Icon name="alert" size={20} />환자 이름, 등록번호, 주민등록번호, 연락처는 AI에 보내기 전에 자동으로 가려집니다. 그래도 가능한 한 처음부터 입력하지 마세요.</div>
      <div className="grid-2">
        <Card title="오늘 실습 메모">
          <label className="sr-only" htmlFor="cl-raw">실습 메모</label>
          <textarea id="cl-raw" className="textarea" style={{ minHeight: 220 }} value={raw} onChange={e => setRaw(e.target.value)} placeholder="예: 환자 김철수님(등록번호 12345678) 우측 무릎 수술 후 3일차, 관절가동범위 측정 참관" />
          {pii.length > 0 && <div className="check warn">가려진 항목: {pii.map(p => `${p.label} ${p.count}건`).join(', ')}</div>}
          <button className="btn primary" onClick={run} disabled={busy || !raw.trim()}>일지로 정리</button>
        </Card>
        <Card title="AI에 전달되는 내용과 결과">
          <div className="output">{masked || '입력하면 가려진 내용이 여기에 표시됩니다.'}</div>
          {out && <div className="output">{out}</div>}
        </Card>
      </div>
    </>
  )
}

const SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const ROOMS = ['[스터디룸 A]', '[스터디룸 B]', '[스터디룸 C]']

export function StudyRoom() {
  const [mine, setMine] = useStored('room-mine', [])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const taken = (room, slot) => (room.charCodeAt(room.length - 2) + Number(slot.slice(0, 2)) + Number(date.slice(-2))) % 4 === 0
  const key = (room, slot) => `${date}|${room}|${slot}`
  function toggle(room, slot) {
    const k = key(room, slot)
    if (mine.includes(k)) return setMine(mine.filter(x => x !== k))
    if (mine.filter(x => x.startsWith(date)).length >= 2) return alertBox()
    setMine([...mine, k])
  }
  const [warn, setWarn] = useState('')
  function alertBox() { setWarn('하루 최대 2시간까지 예약할 수 있습니다. (시연용 규칙)'); setTimeout(() => setWarn(''), 3000) }
  return (
    <>
      <PageHead title="스터디룸 예약" desc="빈 시간을 눌러 바로 예약합니다. 호실, 운영 시간, 예약 규칙은 학생지원 부서 기준으로 맞춥니다." />
      <Card>
        <div className="row"><label htmlFor="rdate" className="small">날짜</label><input id="rdate" type="date" className="input" style={{ width: 180 }} value={date} onChange={e => setDate(e.target.value)} />
          <span className="badge navy">내 예약</span><span className="badge">예약됨</span></div>
        {warn && <div className="check warn" role="alert">{warn}</div>}
        {ROOMS.map(room => (
          <div key={room} className="stack" style={{ gap: 8 }}>
            <b className="small">{room}</b>
            <div className="slot-grid">
              {SLOTS.map(s => {
                const isMine = mine.includes(key(room, s))
                const isTaken = !isMine && taken(room, s)
                return <button key={s} className={`slot ${isMine ? 'mine' : ''} ${isTaken ? 'taken' : ''}`} disabled={isTaken} aria-pressed={isMine} onClick={() => toggle(room, s)}>{s}</button>
              })}
            </div>
          </div>
        ))}
      </Card>
    </>
  )
}

export function CampusQA() {
  return <RulesQA title="학교생활 Q&A" desc="학칙과 학사안내 원문을 근거로 답합니다. 실제 운영 시 학사 부서가 원문을 등록하고, 학생 화면에서는 질문만 합니다." storeKey="rules:campus" placeholder="예: 스터디룸은 한 번에 몇 시간까지 예약할 수 있나요?" />
}

export function Notes() {
  return <TaskPage task="notes" title="학습 노트" desc="수업 필기를 붙여 넣으면 요약, 핵심 용어, 복습 퀴즈로 정리합니다." placeholder="필기 내용을 붙여 넣거나 정리하고 싶은 내용을 적어 주세요" />
}
