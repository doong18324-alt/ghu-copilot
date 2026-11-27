import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card, PageHead, Empty } from '../components/ui.jsx'
import { useStored, uid, roleFromPath } from '../lib/store.js'
import { josa } from '../lib/korean.js'
import shotBody from '../assets/apps/body-aligner.jpg'
import shotOncare from '../assets/apps/vital-oncare.jpg'
import shotOnvoice from '../assets/apps/voicemind.jpg'
import shotGait from '../assets/apps/gait-analyzer.jpg'
import shotBalloon from '../assets/apps/balloon-exercise.jpg'
import shotPpe from '../assets/apps/ppe-concept.jpg'
import shotBps from '../assets/apps/bps-concept.jpg'
import shotFcs from '../assets/apps/fcs-assessment.jpg'

const today = () => new Date().toISOString().slice(0, 10)
export const ROLE_LABEL = { staff: '직원', faculty: '교수', student: '학생' }
export const ROLE_TONE = { staff: 'blue', faculty: 'green', student: 'amber' }

/* ── 프로그램 등록(직원) · 신청(학생) · 이력서 연동 ── */

export const PROGRAM_TYPES = ['서포터즈', '자격증 과정', '비교과', '소단위과정', '가상학과', '기타']

export const BENEFIT_TYPES = ['장학금', '비교과 마일리지', '수료증', '활동비', '학점 인정', '응시료 지원', '봉사시간', '취업 연계']

// 구분별 색(앱마켓 분야 색과 같은 팔레트)과 이력서에 들어가는 칸
export const TYPE_INFO = {
  '서포터즈': { tone: 'pr', section: 'activities', role: '서포터즈 활동' },
  '자격증 과정': { tone: 'study', section: 'licenses', role: '자격증 과정 수료' },
  '비교과': { tone: 'career', section: 'activities', role: '비교과 프로그램 참여' },
  '소단위과정': { tone: 'guide', section: 'training', role: '소단위과정 이수' },
  '가상학과': { tone: 'rules', section: 'training', role: '가상학과 이수' },
  '기타': { tone: 'admin', section: 'activities', role: '프로그램 참여' },
}
export const RESUME_SECTION = { activities: '활동·경험', licenses: '보유자격증', training: '교육·이수' }

// 진행 단계: 신청 → 선정(참여 중) → 수료
export const STEPS = ['신청', '선정', '수료']

const cleanTitle = t => (t || '').replace(/\s*\((예시)\)\s*/g, ' ').replace(/\s*(모집|신청)(\s*안내)?\s*$/, '').trim()

// 프로그램 한 건이 이력서에 들어갈 모양. status가 없으면 '수료' 기준 미리보기입니다.
export function resumeEntry(p, status = '수료') {
  const info = TYPE_INFO[p.type] || TYPE_INFO['기타']
  const title = (p.resumeTitle || '').trim() || cleanTitle(p.title) || '[프로그램명]'
  const done = status === '수료'
  const from = p.start || '', to = done ? (p.end || '') : '진행 중'
  // 자격증 과정은 수료하고 자격명을 적어 둔 경우에만 '보유자격증'에, 아니면 '교육·이수'에 넣습니다.
  if (info.section === 'licenses') {
    if (done && (p.cert || '').trim()) return { section: 'licenses', name: p.cert.trim(), date: p.end || '', title: p.cert.trim(), detail: `${title} 수료 | ${p.dept || ''}`.replace(/\s\|\s$/, '') }
    return { section: 'training', title, detail: [done ? '자격증 과정 수료' : '자격증 과정 수강 중', p.dept].filter(Boolean).join(' | '), from, to }
  }
  const credit = info.section === 'training' && p.credit ? ` (${p.credit}학점)` : ''
  const role = done ? info.role : `${info.role} 중`
  return { section: info.section, title, detail: [role + credit, p.dept].filter(Boolean).join(' | '), from, to }
}

// 이력서(학생) 저장소에 프로그램 항목을 넣습니다. 같은 프로그램이 있으면 최신 단계로 고칩니다.
export const RESUME_KEY = 'resume:student'
export function mergeIntoResume(resume, p, status) {
  const r = { education: [], licenses: [], activities: [], training: [], skills: [], ...(resume || {}) }
  const e = resumeEntry(p, status)
  const source = `program:${p.id}`
  const strip = list => (list || []).filter(x => x.source !== source)
  const out = { ...r, licenses: strip(r.licenses), activities: strip(r.activities), training: strip(r.training) }
  const old = [...r.licenses, ...r.activities, ...r.training].find(x => x.source === source)
  const item = e.section === 'licenses'
    ? { id: old?.id || uid(), source, name: e.name, date: e.date || old?.date || '' }
    : { id: old?.id || uid(), source, title: e.title, detail: e.detail, from: e.from || old?.from || '', to: e.to || old?.to || '' }
  out[e.section] = [...out[e.section], item]
  return out
}

// 참여 혜택 칩
export function Benefits({ program, compact = false }) {
  const tags = program.benefits || []
  const note = (program.benefitNote || '').trim()
  if (tags.length === 0 && !note) return compact ? null : <div className="pg-benefits empty">참여 혜택이 아직 적혀 있지 않습니다.</div>
  return (
    <div className={compact ? 'pg-benefits compact' : 'pg-benefits'}>
      <div className="pg-benefit-tags">{tags.map(t => <span key={t}>{t}</span>)}</div>
      {note && !compact && <p>{note}</p>}
    </div>
  )
}

const SEED_PROGRAMS = [
  { id: 'seed-1', type: '서포터즈', title: 'AI 서포터즈 모집 (예시)', resumeTitle: 'GHU AI 서포터즈 [기수]기', dept: '[주관 부서]', quota: 20, due: '', period: '[운영 기간]', start: '', end: '', benefits: ['활동비', '수료증', '비교과 마일리지'], benefitNote: '[활동비 금액, 마일리지 점수]', desc: '교내 AI 활용 사례를 찾아 알리는 학생 서포터즈입니다. 직원 화면에서 실제 공고로 바꿔 주세요.', open: true, applicants: [] },
  { id: 'seed-2', type: '자격증 과정', title: '[자격증 과정명] (예시)', cert: '[취득 자격명]', dept: '[주관 부서]', quota: 30, due: '', period: '[운영 기간]', start: '', end: '', benefits: ['응시료 지원', '수료증'], benefitNote: '[지원 금액과 조건]', desc: '[과정 내용, 수료 기준]', open: true, applicants: [] },
  { id: 'seed-3', type: '소단위과정', title: '[소단위과정명] (예시)', credit: 3, dept: '[주관 부서]', quota: 0, due: '', period: '[운영 기간]', start: '', end: '', benefits: ['학점 인정', '수료증'], benefitNote: '[인정 학점, 이수증 발급]', desc: '[이수 조건]', open: true, applicants: [] },
  { id: 'seed-4', type: '가상학과', title: '[가상학과명] (예시)', credit: 12, dept: '[주관 부서]', quota: 0, due: '', period: '[운영 기간]', start: '', end: '', benefits: ['학점 인정'], benefitNote: '[이수 학점과 이수증]', desc: '[참여 학과, 이수 체계]', open: true, applicants: [] },
  { id: 'seed-5', type: '비교과', title: '[비교과 프로그램명] (예시)', dept: '[주관 부서]', quota: 40, due: '', period: '[운영 기간]', start: '', end: '', benefits: ['비교과 마일리지'], benefitNote: '[마일리지 점수]', desc: '[운영 방식, 이수 기준]', open: true, applicants: [] },
]

export function usePrograms() {
  const [posts, setPosts] = useStored('programs:posts', SEED_PROGRAMS)
  // 예전에 저장된 예시 공고에는 새 항목(이력서 표기, 기간 등)을 채우고, 빠진 예시 공고는 더합니다.
  const patched = posts.map(p => {
    const seed = SEED_PROGRAMS.find(x => x.id === p.id)
    return seed ? { ...seed, ...p, benefits: p.benefits ?? seed.benefits, resumeTitle: p.resumeTitle ?? seed.resumeTitle, cert: p.cert ?? seed.cert, credit: p.credit ?? seed.credit } : p
  })
  const onlySeeds = posts.every(p => String(p.id).startsWith('seed'))
  const missing = onlySeeds ? SEED_PROGRAMS.filter(x => !posts.some(p => p.id === x.id)) : []
  return [[...patched, ...missing], setPosts]
}

const daysLeft = due => {
  if (!due) return null
  const d = Math.ceil((new Date(due + 'T23:59:59') - new Date()) / 86400000)
  return d
}

export function programState(p) {
  if (!p.open) return ['모집 마감', '']
  if (p.due && p.due < today()) return ['기한 지남', 'red']
  if (p.quota > 0 && p.applicants.length >= p.quota) return ['정원 마감', 'amber']
  return ['모집 중', 'green']
}

// 이력서 미리보기 한 줄
export function ResumeLine({ program, status = '수료' }) {
  const e = resumeEntry(program, status)
  const when = e.section === 'licenses' ? e.date : [e.from, e.to].filter(Boolean).join(' ~ ')
  return (
    <div className="pg-resume">
      <span className="pg-resume-h">이력서 「{RESUME_SECTION[e.section]}」에 들어갑니다</span>
      <b>{e.title}</b>
      <small>{[e.detail, when || program.period].filter(Boolean).join(' · ')}</small>
    </div>
  )
}

// 프로그램 카드: 공개 모집 화면, 학생 신청 화면, 첫 화면에서 같이 씁니다.
export function ProgramCard({ program: p, children, preview = true }) {
  const [state, tone] = programState(p)
  const info = TYPE_INFO[p.type] || TYPE_INFO['기타']
  const d = state === '모집 중' ? daysLeft(p.due) : null
  return (
    <article className={`pg-card t-${info.tone}`}>
      <div className="pg-top">
        <span className="pg-type">{p.type}</span>
        <span className={`pg-state ${tone}`}>{state}{d !== null && d >= 0 && <b>{d === 0 ? '오늘 마감' : `D-${d}`}</b>}</span>
      </div>
      <h3>{p.title}</h3>
      {p.desc && <p className="pg-desc">{p.desc}</p>}
      <dl className="pg-facts">
        <div><dt>주관</dt><dd>{p.dept || '[주관 부서]'}</dd></div>
        <div><dt>신청 마감</dt><dd>{p.due || '[날짜]'}</dd></div>
        <div><dt>운영</dt><dd>{p.period || '[기간]'}</dd></div>
        <div><dt>모집</dt><dd>{p.applicants.length}명 신청{p.quota > 0 ? ` / 정원 ${p.quota}명` : ''}</dd></div>
      </dl>
      <Benefits program={p} />
      {preview && <ResumeLine program={p} />}
      {children && <div className="pg-foot">{children}</div>}
    </article>
  )
}

export function TypeFilter({ value, onChange, options }) {
  return (
    <ul className="steps" aria-label="구분 선택">
      {options.map(o => <li key={o}><button type="button" className={value === o ? 'on' : ''} aria-pressed={value === o} onClick={() => onChange(o)}>{o}</button></li>)}
    </ul>
  )
}

function StepBar({ status }) {
  const i = STEPS.indexOf(status)
  return (
    <ol className="pg-steps" aria-label={`진행 단계: ${status}`}>
      {STEPS.map((s, n) => <li key={s} className={n <= i ? 'on' : ''}>{s === '선정' ? '선정·참여' : s}</li>)}
    </ol>
  )
}

export function ProgramAdmin() {
  const [posts, setPosts] = usePrograms()
  const blank = { type: PROGRAM_TYPES[0], title: '', resumeTitle: '', dept: '', quota: '', due: '', period: '', start: '', end: '', cert: '', credit: '', benefits: [], benefitNote: '', desc: '' }
  const [warn, setWarn] = useState('')
  const [form, setForm] = useState(blank)
  const set = k => e => setForm({ ...form, [k]: e.target.value })
  function add(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (form.benefits.length === 0 && !form.benefitNote.trim()) return setWarn('참여 혜택을 하나 이상 고르거나 적어 주세요. 혜택이 없는 프로그램이면 "혜택 설명"에 "별도 혜택 없음"이라고 적습니다.')
    setWarn('')
    setPosts([{ ...form, id: uid(), title: form.title.trim(), benefitNote: form.benefitNote.trim(), quota: Number(form.quota) || 0, credit: Number(form.credit) || '', open: true, applicants: [], created: today() }, ...posts])
    setForm(blank)
  }
  const update = (id, fn) => setPosts(posts.map(p => (p.id === id ? fn(p) : p)))
  const setStatus = (pid, aid, status) => update(pid, x => ({ ...x, applicants: x.applicants.map(y => (y.id === aid ? { ...y, status } : y)) }))
  const toggleBenefit = t => setForm({ ...form, benefits: form.benefits.includes(t) ? form.benefits.filter(x => x !== t) : [...form.benefits, t] })
  const openCount = posts.filter(p => programState(p)[0] === '모집 중').length
  const applied = posts.reduce((n, p) => n + p.applicants.length, 0)
  const selected = posts.reduce((n, p) => n + p.applicants.filter(a => a.status === '선정').length, 0)
  const done = posts.reduce((n, p) => n + p.applicants.filter(a => a.status === '수료').length, 0)
  const sec = (TYPE_INFO[form.type] || TYPE_INFO['기타']).section
  return (
    <>
      <PageHead title="프로그램 등록·관리" desc="서포터즈, 자격증 과정, 비교과, 소단위과정, 가상학과를 올리면 학생 화면의 '프로그램 신청'에 바로 나타납니다. 선정과 수료를 처리하면 학생 이력서에 그대로 들어갑니다." />
      <Card>
        <div className="stat-row">
          <div className="stat" style={{ background: 'var(--green-soft)' }}><b style={{ color: 'var(--green)' }}>{openCount}</b><span>모집 중</span></div>
          <div className="stat" style={{ background: 'var(--blue-soft)' }}><b style={{ color: 'var(--blue-dark)' }}>{applied}</b><span>전체 신청</span></div>
          <div className="stat" style={{ background: 'var(--amber-soft)' }}><b style={{ color: 'var(--amber)' }}>{selected}</b><span>선정·참여 중</span></div>
          <div className="stat" style={{ background: 'var(--soft)' }}><b>{done}</b><span>수료</span></div>
        </div>
      </Card>
      <Card title="새 프로그램 올리기">
        <form className="stack" style={{ gap: 14 }} onSubmit={add}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '0 0 170px' }}><label htmlFor="p-type">구분</label>
              <select id="p-type" className="input" value={form.type} onChange={set('type')}>{PROGRAM_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="field" style={{ flex: '1 1 260px' }}><label htmlFor="p-title">공고 제목</label>
              <input id="p-title" className="input" required placeholder="예: 2027-1학기 AI 서포터즈 모집" value={form.title} onChange={set('title')} /></div>
          </div>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '1 1 180px' }}><label htmlFor="p-dept">주관 부서</label>
              <input id="p-dept" className="input" placeholder="예: 학생지원처" value={form.dept} onChange={set('dept')} /></div>
            <div className="field" style={{ flex: '0 0 130px' }}><label htmlFor="p-quota">모집 정원</label>
              <input id="p-quota" type="number" min="0" className="input" placeholder="제한 없음" value={form.quota} onChange={set('quota')} /></div>
            <div className="field" style={{ flex: '0 0 180px' }}><label htmlFor="p-due">신청 마감일</label>
              <input id="p-due" type="date" className="input" value={form.due} onChange={set('due')} /></div>
            <div className="field" style={{ flex: '1 1 180px' }}><label htmlFor="p-period">운영 안내</label>
              <input id="p-period" className="input" placeholder="예: 3월~6월, 주 1회" value={form.period} onChange={set('period')} /></div>
          </div>
          <fieldset className="benefit-form">
            <legend>이력서 연동 <span className="muted small">선정·수료한 학생의 이력서 「{RESUME_SECTION[form.type === '자격증 과정' && form.cert ? 'licenses' : sec === 'licenses' ? 'training' : sec]}」에 이렇게 들어갑니다</span></legend>
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <div className="field" style={{ flex: '1 1 240px' }}><label htmlFor="p-rtitle">이력서 표기명</label>
                <input id="p-rtitle" className="input" placeholder="비우면 공고 제목에서 '모집'을 뺀 이름" value={form.resumeTitle} onChange={set('resumeTitle')} /></div>
              <div className="field" style={{ flex: '0 0 140px' }}><label htmlFor="p-start">시작(연.월)</label>
                <input id="p-start" className="input" placeholder="2027.03" value={form.start} onChange={set('start')} /></div>
              <div className="field" style={{ flex: '0 0 140px' }}><label htmlFor="p-end">종료(연.월)</label>
                <input id="p-end" className="input" placeholder="2027.06" value={form.end} onChange={set('end')} /></div>
              {form.type === '자격증 과정' && <div className="field" style={{ flex: '1 1 200px' }}><label htmlFor="p-cert">취득 자격명</label>
                <input id="p-cert" className="input" placeholder="예: 노인스포츠지도사 2급" value={form.cert} onChange={set('cert')} /></div>}
              {(form.type === '소단위과정' || form.type === '가상학과') && <div className="field" style={{ flex: '0 0 120px' }}><label htmlFor="p-credit">인정 학점</label>
                <input id="p-credit" type="number" min="0" className="input" value={form.credit} onChange={set('credit')} /></div>}
            </div>
            <ResumeLine program={{ ...form, applicants: [] }} />
          </fieldset>
          <fieldset className="benefit-form">
            <legend>참여 혜택 <span className="muted small">학생 화면 카드에 강조되어 보입니다</span></legend>
            <div className="row" style={{ gap: 8 }}>
              {BENEFIT_TYPES.map(t => <button key={t} type="button" className={form.benefits.includes(t) ? 'chip on' : 'chip'} aria-pressed={form.benefits.includes(t)} onClick={() => toggleBenefit(t)}>{t}</button>)}
            </div>
            <div className="field"><label htmlFor="p-benefit">혜택 설명</label>
              <input id="p-benefit" className="input" placeholder="예: 활동비 월 10만 원, 마일리지 30점, 우수 활동자 총장상" value={form.benefitNote} onChange={set('benefitNote')} /></div>
          </fieldset>
          <div className="field"><label htmlFor="p-desc">내용</label>
            <textarea id="p-desc" className="textarea" style={{ minHeight: 90 }} placeholder="대상, 활동 내용, 선정·수료 기준을 적어 주세요" value={form.desc} onChange={set('desc')} /></div>
          {warn && <div className="check warn" role="alert">{warn}</div>}
          <div><button className="btn primary">올리기</button></div>
        </form>
      </Card>
      {posts.length === 0 ? <Empty>올린 프로그램이 없습니다.</Empty> : (
        <div className="pg-grid">
          {posts.map(p => (
            <ProgramCard key={p.id} program={p}>
              <div className="stack" style={{ gap: 8, width: '100%' }}>
                {p.applicants.length === 0 ? <span className="small muted">아직 신청자가 없습니다.</span> : (
                  <ul className="pg-applicants">
                    {p.applicants.map(a => (
                      <li key={a.id}>
                        <span>{a.name} <span className="muted small">{a.at}</span></span>
                        <span className="row" style={{ gap: 6 }}>
                          <span className={`badge ${a.status === '수료' ? 'navy' : a.status === '선정' ? 'green' : ''}`}>{a.status === '선정' ? '참여 중' : a.status}</span>
                          {a.status === '신청' && <button className="get-btn" onClick={() => setStatus(p.id, a.id, '선정')}>선정</button>}
                          {a.status === '선정' && <><button className="get-btn" onClick={() => setStatus(p.id, a.id, '수료')}>수료 처리</button><button className="get-btn" onClick={() => setStatus(p.id, a.id, '신청')}>선정 취소</button></>}
                          {a.status === '수료' && <button className="get-btn" onClick={() => setStatus(p.id, a.id, '선정')}>수료 취소</button>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="row">
                  <button className="btn" onClick={() => update(p.id, x => ({ ...x, open: !x.open }))}>{p.open ? '모집 마감' : '모집 재개'}</button>
                  <button className="btn" onClick={() => setPosts(posts.filter(x => x.id !== p.id))}>삭제</button>
                </div>
              </div>
            </ProgramCard>
          ))}
        </div>
      )}
    </>
  )
}

export function Programs() {
  const [posts, setPosts] = usePrograms()
  const [name, setName] = useStored('profile:student-name', '')
  const [resume, setResume] = useStored(RESUME_KEY, null)
  const [type, setType] = useState('전체')
  const [benefit, setBenefit] = useState('')
  const [msg, setMsg] = useState('')
  const mine = p => p.applicants.find(a => a.id === 'me')
  const shown = posts.filter(p => (type === '전체' || p.type === type) && (!benefit || (p.benefits || []).includes(benefit)))
  const usedBenefits = BENEFIT_TYPES.filter(t => posts.some(p => (p.benefits || []).includes(t)))
  const myList = posts.filter(mine)
  const inResume = p => {
    const src = `program:${p.id}`
    return ['activities', 'licenses', 'training'].some(k => (resume?.[k] || []).some(x => x.source === src))
  }
  function toggle(p) {
    setPosts(posts.map(x => {
      if (x.id !== p.id) return x
      if (mine(x)) return { ...x, applicants: x.applicants.filter(a => a.id !== 'me') }
      return { ...x, applicants: [...x.applicants, { id: 'me', name: name.trim() || '[학생 이름]', at: today(), status: '신청' }] }
    }))
  }
  function toResume(p) {
    const st = mine(p).status
    setResume(r => mergeIntoResume(r, p, st))
    const e = resumeEntry(p, st)
    setMsg(`‘${e.title}’${josa(e.title, '을/를').slice(e.title.length)} 이력서 「${RESUME_SECTION[e.section]}」에 넣었습니다.`)
    setTimeout(() => setMsg(''), 4000)
  }
  return (
    <>
      <PageHead title="프로그램 신청" desc="서포터즈, 자격증 과정, 비교과, 소단위과정, 가상학과를 한곳에서 보고 신청합니다. 선정되거나 수료하면 이력서에 바로 넣을 수 있습니다." />
      <Card>
        <div className="stat-row">
          <div className="stat" style={{ background: 'var(--green-soft)' }}><b style={{ color: 'var(--green)' }}>{posts.filter(p => programState(p)[0] === '모집 중').length}</b><span>모집 중</span></div>
          <div className="stat" style={{ background: 'var(--blue-soft)' }}><b style={{ color: 'var(--blue-dark)' }}>{myList.length}</b><span>내 신청</span></div>
          <div className="stat" style={{ background: 'var(--amber-soft)' }}><b style={{ color: 'var(--amber)' }}>{myList.filter(p => mine(p).status !== '신청').length}</b><span>선정·수료</span></div>
        </div>
        <div className="field" style={{ maxWidth: 320 }}><label htmlFor="s-name">신청자 이름</label>
          <input id="s-name" className="input" placeholder="통합인증 연결 후에는 자동 입력" value={name} onChange={e => setName(e.target.value)} /></div>
      </Card>
      <Card title="내 신청 현황" action={<Link to="../resume" className="small">이력서 보기</Link>}>
        {msg && <div className="check ok" role="status">{msg}</div>}
        {myList.length === 0 ? <Empty>신청한 프로그램이 없습니다.</Empty> : (
          <ul className="pg-mine">{myList.map(p => {
            const a = mine(p)
            const can = a.status !== '신청'
            return (
              <li key={p.id} className={`t-${(TYPE_INFO[p.type] || TYPE_INFO['기타']).tone}`}>
                <div className="pg-mine-main">
                  <span className="pg-type">{p.type}</span>
                  <b>{p.title}</b>
                  <StepBar status={a.status} />
                </div>
                <div className="pg-mine-act">
                  {can
                    ? <button className={inResume(p) ? 'get-btn' : 'get-btn solid'} onClick={() => toResume(p)}>{inResume(p) ? '이력서 다시 맞추기' : '이력서에 넣기'}</button>
                    : <span className="small muted">선정되면 이력서에 넣을 수 있습니다</span>}
                </div>
              </li>
            )
          })}</ul>
        )}
      </Card>
      <section className="stack" style={{ gap: 14 }}>
        <TypeFilter value={type} onChange={setType} options={['전체', ...PROGRAM_TYPES]} />
        {usedBenefits.length > 0 && (
          <div className="row" style={{ gap: 8 }}>
            <span className="small" style={{ fontWeight: 700 }}>혜택으로 찾기</span>
            {usedBenefits.map(t => <button key={t} type="button" className={benefit === t ? 'chip on' : 'chip'} aria-pressed={benefit === t} onClick={() => setBenefit(benefit === t ? '' : t)}>{t}</button>)}
          </div>
        )}
        {shown.length === 0 ? <Empty>조건에 맞는 프로그램이 없습니다.</Empty> : (
          <div className="pg-grid">{shown.map(p => {
            const [state] = programState(p)
            const applied = !!mine(p)
            return (
              <ProgramCard key={p.id} program={p}>
                <button className={applied ? 'get-btn' : 'get-btn solid'} disabled={!applied && state !== '모집 중'} onClick={() => toggle(p)}>{applied ? '신청 취소' : '신청하기'}</button>
                {applied && <span className="small muted">{mine(p).status === '신청' ? '심사 대기' : mine(p).status === '선정' ? '선정, 참여 중' : '수료'}</span>}
              </ProgramCard>
            )
          })}</div>
        )}
      </section>
    </>
  )
}

/* ── AI 활용 실적(직원·교수·학생 공통) ── */

// 공유하는 것은 AI 활용 실적뿐입니다. 자격증 같은 개인 이력은 '이력서 만들기'에서 본인이 관리합니다.
const ACH_TYPES = {
  staff: ['업무 자동화', 'AI 앱·에이전트 개발', 'AI 업무 개선 사례', 'AI 프로젝트'],
  faculty: ['AI 수업 혁신', 'AI 앱·에이전트 개발', 'AI 활용 연구', 'AI 프로젝트'],
  student: ['AI 프로젝트·캡스톤', 'AI 앱·에이전트 개발', 'AI 활용 사례', 'AI 공모전·수상'],
}

// 공개 화면(성과 소식)에서는 이름의 가운데 글자를 가립니다. 자리표시자([ ])는 그대로 둡니다.
export function maskName(name) {
  const n = (name || '').trim()
  if (n.startsWith('[') || n.length <= 1) return n
  if (n.length === 2) return n[0] + '*'
  return n[0] + '*'.repeat(n.length - 2) + n[n.length - 1]
}

// http(s) 주소만 링크로 씁니다.

const SEED_ACH = [
  { id: 'seed-b1', role: 'student', type: 'AI 프로젝트·캡스톤', title: '(예시) [AI를 활용한 캡스톤 프로젝트명]', author: '[학생 이름]', dept: '[학과]', date: '', desc: '[해결하려던 문제, 만든 결과물, 사용한 AI 도구]', cheers: 0 },
  { id: 'seed-b2', role: 'faculty', type: 'AI 수업 혁신', title: '(예시) 강좌봇을 활용한 실습 사전학습 운영', author: '[교수 이름]', dept: '[학과]', date: '', desc: '[적용 교과목, 운영 방식, 학생 반응]', cheers: 0 },
  { id: 'seed-b3', role: 'staff', type: '업무 자동화', title: '(예시) 회의록 정리와 할 일 추출 자동화', author: '[직원 이름]', dept: '[부서]', date: '', desc: '[어떤 업무를 어떻게 바꿨는지, 줄어든 시간이나 건수]', cheers: 0 },
  { id: 'seed-b4', role: 'faculty', type: 'AI 앱·에이전트 개발', title: '(예시) [전공 실습용 앱 이름]', author: '[교수 이름]', dept: '[학과]', date: '', desc: '[어떤 수업에서 어떻게 쓰는지]', cheers: 0 },
]

// 기사 대표 사진: 16:9로 가운데를 잘라 줄입니다(브라우저 저장 용량을 아끼기 위해).
export function readCover(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const W = 1200, H = 675
      const scale = Math.max(W / img.width, H / img.height)
      const w = W / scale, h = H / scale
      const c = document.createElement('canvas'); c.width = W; c.height = H
      c.getContext('2d').drawImage(img, (img.width - w) / 2, (img.height - h) / 2, w, h, 0, 0, W, H)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('사진을 읽지 못했습니다. JPG 또는 PNG 파일인지 확인해 주세요.')) }
    img.src = url
  })
}

// 문의하기: 누르면 글을 올린 사람의 메일 주소를 복사합니다.
export function ContactButton({ email }) {
  const [done, setDone] = useState(false)
  if (!email) return null
  async function copy() {
    try { await navigator.clipboard.writeText(email) } catch {
      // 클립보드 권한이 없는 브라우저용 예비 방법
      const t = document.createElement('textarea'); t.value = email; t.style.position = 'fixed'; t.style.opacity = '0'
      document.body.appendChild(t); t.select(); try { document.execCommand('copy') } catch { /* 복사 불가 */ } t.remove()
    }
    setDone(true); setTimeout(() => setDone(false), 6000)
  }
  return (
    <div className="contact">
      <button type="button" className="btn primary" onClick={copy}>문의하기</button>
      <span className="small" role="status">{done ? <>메일 주소를 복사했습니다: <b>{email}</b></> : <span className="muted">누르면 올린 사람의 메일 주소가 복사됩니다.</span>}</span>
    </div>
  )
}

// 사진이 없는 글은 역할 색 바탕에 구분명을 보여 줍니다.
export function Cover({ item, className = '' }) {
  return item.photo
    ? <img className={`news-cover ${className}`} src={item.photo} alt={item.caption || item.title} />
    : <div className={`news-cover empty ${className}`} style={{ background: `var(--${ROLE_TONE[item.role]}-soft)` }} aria-hidden="true"><span>{item.type}</span></div>
}

// 실제 실적. 코드에 들어 있어 모든 방문자에게 보입니다(서버 연결 전까지는 이 방식으로만 공개 게시가 됩니다).
const PROF = { role: 'faculty', author: '김현중', dept: '시니어운동처방학과', email: 'hjkim@ghu.ac.kr' }
const IOS_NOTE = '생성형 AI와 대화하며 코드를 작성하는 방식으로 제작한 아이폰 앱입니다.'
const APP_NOTE = '생성형 AI와 대화하며 코드를 작성하는 방식으로 제작했고, 설치 없이 웹 브라우저에서 사용합니다.'
export const FEATURED = [
  { ...PROF, id: 'real-vital-oncare', type: 'AI 앱·에이전트 개발', date: '2026-11-27', photo: shotOncare, caption: 'GHU 바이탈 온케어 서비스 구성도',
    title: 'GHU 바이탈 온케어(Vital OnCare): 휴대폰 하나로 하는 다학제 지역사회 전신 건강관리',
    summary: '10개 보건계열 학과가 휴대폰으로 지역 주민을 평가하고, 결과를 하나의 건강지도와 맞춤계획으로 묶어 지속 관리하는 웹앱입니다.',
    desc: '지역사회 건강평가는 학과별로 따로 이루어져 한 주민의 상태를 전신 관점에서 함께 보기 어렵고, 장비가 없는 현장에서는 객관적 측정이 어렵습니다. 바이탈 온케어는 휴대폰 센서와 카메라로 현장에서 바로 측정하고, 여러 학과의 결과를 하나의 건강지도와 맞춤계획으로 묶어 지속 관리하도록 만든 웹앱입니다.\n참여 학과는 물리치료학과, 시니어운동처방학과, 간호학과, 임상병리학과, 응급구조학과, 치위생학과, 치기공학과, 안경광학과, 식품영양학과, 방사선학과의 10개 학과입니다. 영유아·아동, 청소년, 성인, 노인 가운데 대상자의 연령대를 고르면 평가 항목이 그에 맞게 구성됩니다.\n휴대폰으로 측정하는 항목은 균형 검사, 의자 일어서기, TUG, 보행속도, 관절가동범위, 자세 정렬, 얼굴·손가락 카메라 맥박, CPR 교육 피드백, 원거리·근거리 시력, 암슬러 격자, 청력 선별, 인지 선별(Mini-Cog), 선 잇기, 반응속도, 구강 사진, 교합·보철 사진, 소변 시험지 기록 등 19개이며, 문진·입력 도구 20개가 함께 들어 있습니다. 학과별 결과를 묶어 SPPB, 근감소증 선별, 낙상 위험 종합 같은 통합 지표를 자동으로 산출합니다.\n화면은 건강확인, 건강지도, 맞춤계획, 지속관리, 성과보고 순서로 이어집니다. 건강관리·교육·선별 목적의 도구이며 진단이나 치료를 대신하지 않고, 모든 결과는 면허를 가진 지도교수가 확인합니다.\n현재는 시제품 단계로, 아이폰과 안드로이드 브라우저에서 설치 없이 실행됩니다. 기획, 평가 항목 근거 검토, 웹앱 설계·코드 작성과 배포에는 Claude(Anthropic)를, 얼굴·자세 인식(카메라 맥박, 보행속도, 자세 정렬)에는 Google MediaPipe를 활용했습니다.\n앞으로 학과별 지도교수 검토로 평가 기준을 확정하고, 보행분석·HRV·악력계 등 기준 장비와 휴대폰 측정값을 비교해 검증할 계획입니다. 이후 GHU 바이탈에 탑재해 학교 통합인증(SSO)과 서버 저장을 연동하고, 지후 AI의 결과 요약·안내문 생성 기능과 연결해 스마트케어빌리지 등 지역 거점에서 시범 적용할 예정입니다.' },
  { ...PROF, id: 'real-onvoice', type: 'AI 앱·에이전트 개발', date: '2026-11-27', photo: shotOnvoice, caption: '어르신의 목소리가 말 속도·쉼·높낮이 지표로 분석되어 휴대폰 마음건강 결과로 이어지는 온보이스의 흐름',
    title: '온보이스(OnVoice): 목소리로 살피는 마음건강, 휴대폰 음성 기반 우울 선별 앱',
    summary: '5분 녹음으로 말의 속도·쉼·높낮이를 분석해 PHQ-9와 함께 마음건강을 살피는 앱입니다.',
    desc: '지역사회 노인의 우울은 흔하지만, 설문에 솔직하게 답하기 어렵거나 글을 읽기 힘든 경우가 많아 놓치기 쉽습니다. 온보이스는 우울할 때 말이 느려지고 쉼이 길어지며 목소리 높낮이가 줄어든다는 점에 착안해, 별도 장비 없이 휴대폰 녹음만으로 마음 상태의 변화를 꾸준히 살피고 도움이 필요한 사람을 상담으로 연결하려고 만든 앱입니다.\n우선 대상은 지역사회 노인이며, 성인 주민과 정신건강 상담 연계 전에 선별이 필요한 분도 쓸 수 있습니다.\n사용자는 약 5분 동안 6가지 과제를 차례로 녹음합니다. 1부터 20까지 세기, 20부터 1까지 거꾸로 세기, 가을 문단 소리 내어 읽기, 공원 그림 보고 설명하기, 최근 즐거웠던 일 이야기하기, 최근 힘들었던 일 이야기하기(건너뛰기 가능)입니다. 이어서 PHQ-9 설문 9문항에 답합니다. 과제 구성은 AI허브 정신건강 음성 데이터의 녹음 과제와 같게 맞췄습니다.\n분석하는 음성 지표는 말 속도(쉼 포함), 조음 속도(쉼 제외), 평균 쉼 길이, 쉼 빈도, 쉼 비율, 평균 음높이, 음높이 변화(반음), 목소리 크기 변화, 배음 대 잡음비, 음높이·크기 미세변동(근사값), 즐거운 기억과 힘든 기억 사이의 말투 차이입니다.\n결과 화면에는 PHQ-9 점수와 단계(양호·주의·위험), 지표별로 우울과 관련해 보고된 방향을 표시한 음성 지표 표, 지난 측정 대비 변화값, 같은 사람의 PHQ-9·말 속도 변화 추이 그래프, 과제별 녹음 품질이 나옵니다. 자해 관련 문항에 해당하는 답을 하면 자살예방상담전화 109와 정신건강위기상담전화 1577-0199 안내 화면이 바로 표시됩니다.\n분석은 휴대폰에서 이루어집니다. 에너지 기반 발화 구간 검출, YIN 음높이 추정, 음절 핵 검출로 말 속도를 계산합니다. 녹음 원음은 저장하거나 전송하지 않고 계산이 끝나면 지웁니다. 남는 것은 음성 지표 숫자와 PHQ-9 응답뿐이고, 참여자는 실명 대신 코드로 기록하며, 이 결과만 학교 구글 시트로 전송됩니다.\n온보이스는 진단 도구가 아니라 선별·참고용 도구입니다. 현재는 학습 데이터 없이 문헌 근거에 따라 지표를 계산하는 시제품 단계이며, 판정 모델의 정확도는 아직 검증하지 않았습니다. 결과가 높게 나오면 전문가 상담으로 연결하는 것을 원칙으로 합니다.\nGHU 바이탈 온케어 패밀리의 별도 앱으로, 측정 결과는 온케어와 같은 구글 시트(대상자·평가결과)로 전송되어 함께 관리됩니다. 이후 온케어 건강지도의 마음건강 영역에 바로 연결할 계획입니다.\n기획, 공개 데이터·선행연구 조사, 음성 분석 알고리즘과 웹앱 코드 작성, 시험에는 Claude(Anthropic)를, 로고·앱 아이콘·대표 이미지 제작에는 ChatGPT 이미지 생성을 활용했습니다.\n앞으로 AI허브 헬스케어 안심존의 「정신건강진단 및 예측을 위한 멀티모달 데이터」, 「고령인구 우울증 데이터」 등을 열람한 뒤 정식 이용을 신청하고(IRB 승인 또는 면제), 안심존에서 우울 선별 모델을 학습해 앱에 탑재할 계획입니다. 이어서 지역사회 노인을 대상으로 PHQ-9·GDS와의 일치도를 검증하는 연구(IRB 승인)를 하고, 스마트케어빌리지 등 지역 거점에서 시범 적용과 상담기관 연계를 진행할 예정입니다.' },
  { ...PROF, id: 'real-body-aligner', type: 'AI 앱·에이전트 개발', date: '2026-04-13', photo: shotBody, caption: 'BodyAligner 첫 화면',
    title: 'BodyAligner: 아이폰 ARKit 기반 체형분석과 운동처방 앱',
    summary: '앞면·옆면·뒷면을 촬영하면 26개 변수로 체형을 분석하고 ACSM 기준 운동처방까지 제시합니다.',
    desc: 'Apple ARKit 기반 아이폰 체형분석 앱입니다.\n앞면·옆면·뒷면 3방향을 촬영하면 자동으로 분석해 대칭성, 관절 각도, 체형 크기 등 26개 변수를 산출합니다. 위험요소 경고와 함께 임상 해석을 보여 주고, ACSM 기준 운동처방을 제시합니다. 결과는 3쪽 분량의 컬러 PDF 보고서로 내보낼 수 있습니다.\n' + IOS_NOTE },
  { ...PROF, id: 'real-nrf-bps', type: 'AI 활용 연구', date: '2026-09-01', photo: shotBps, caption: '만성통증 표현형 연구 개념 이미지',
    title: '한국연구재단 기본연구 선정: AI 기반 만성통증 표현형 정밀 중재 시스템',
    summary: '멀티모달 생체신호와 AI로 만성통증을 유형별로 나누고 맞춤 중재를 찾는 5개년 연구입니다.',
    desc: '2026년 한국연구재단 개인기초연구 기본연구 과제에 선정되었습니다.\n과제명은 「AI기반 멀티모달 생체신호 융합·합성 및 강화학습 매칭을 활용한 만성통증 표현형 정밀 중재 시스템(BPS-PPIS) 알고리즘 개발」이며 5개년 동안 수행합니다.\n만성 척추통증과 섬유근통을 대상으로 생체신호와 설문 자료를 모아 통증 표현형을 분류하고, 표현형에 맞는 중재를 연결하는 알고리즘을 개발합니다.\n과제번호: RS-2026-25591593' },
  { ...PROF, id: 'real-gait-analyzer', type: 'AI 앱·에이전트 개발', date: '2026-04-13', photo: shotGait, caption: 'GaitAnalyzer 첫 화면',
    title: 'GaitAnalyzer: 아이폰 ARKit·LiDAR 기반 보행분석 앱',
    summary: '6m 보행을 촬영하면 시공간 보행 변수를 산출하고 100점 만점 점수와 운동처방을 제시합니다.',
    desc: 'Apple ARKit과 LiDAR를 활용한 아이폰 보행분석 앱(v2.0)입니다.\n6m 보행 검사에서 LiDAR로 거리를 재고 키를 기준으로 보정(캘리브레이션)한 뒤, 보행속도, 분속수, 활보장, 입각기·유각기 등 시공간 보행 변수를 산출합니다. 결과는 100점 만점 점수와 임상 해석, 위험요소 경고, ACSM 기준 운동처방으로 정리되며, 점수·변수·운동처방을 담은 3쪽 컬러 PDF 보고서로 내보낼 수 있습니다.\n' + IOS_NOTE },
  { ...PROF, id: 'real-balloon', type: 'AI 앱·에이전트 개발', date: '2026-04-07', photo: shotBalloon, caption: 'AI 맞춤형 운동 트레이너 첫 화면',
    title: 'AI 맞춤형 운동 트레이너: 풍선 터트리기 운동 게임',
    summary: 'ACSM 평가로 맞춤 프로그램을 만들고, 화면 속 풍선을 터트리며 운동합니다.',
    desc: 'AI스포츠테크연구센터에서 만든 운동 앱입니다.\nACSM 평가, 맞춤 프로그램, 카메라 앞에서 움직여 풍선을 터트리는 운동, PDF 리포트 순서로 진행하며 식이 제안도 함께 제공합니다.\n' + IOS_NOTE },
  { ...PROF, id: 'real-fcs', type: 'AI 앱·에이전트 개발', date: '2026-03-22', photo: shotFcs, caption: 'FCS 노쇠중심스펙트럼 평가 첫 화면',
    title: 'FCS 노쇠중심스펙트럼 평가 도구',
    summary: '노쇠를 생물·심리·사회·기능 영역으로 나누어 16단계로 평가하는 앱입니다.',
    desc: 'BPS-FN 모델에 따른 노쇠중심스펙트럼(Frailty-Centered Spectrum) 평가 앱입니다.\nK-FRAIL, MNA-SF, GDS-SF, K-MMSE, LSNS-6, 수정 바델지수, IADL 등의 평가를 차례로 입력하면 결과를 정리해 보여 줍니다.\n' + IOS_NOTE },
  { ...PROF, id: 'real-ppe', type: 'AI 수업 혁신', date: '2026-03-08', photo: shotPpe, caption: '스포츠 참가 전 평가 개념 이미지',
    title: '스포츠 참가 전 평가(PPE) 교육용 웹 도구',
    summary: '병력부터 판정까지 7단계 평가 흐름을 수업에서 직접 실습합니다.',
    desc: '스포츠 참가 전 평가(Preparticipation Evaluation)를 수업에서 실습하도록 만든 교육용 도구입니다.\n기본 정보, 병력, 심혈관, 근골격계, 신경학적 평가, 일반 건강, 판정 결과의 7단계로 구성되어 있습니다.\n' + APP_NOTE },
]
const FEATURED_IDS = new Set(FEATURED.map(f => f.id))

export function useAchievements() {
  const [stored, setItems] = useStored('achievements', SEED_ACH)
  // 실제 실적은 항상 맨 앞에 두고(확인 수만 브라우저 값 사용), 예전 버전의 예시 글(자격증 등)은 뺍니다.
  const items = [
    ...FEATURED.map(f => ({ ...f, cheers: stored.find(x => x.id === f.id)?.cheers || 0 })),
    ...stored.filter(x => !FEATURED_IDS.has(x.id) && !String(x.id).startsWith('seed-a') && !['seed-b2', 'seed-b4'].includes(x.id)),
  ]
  return [items, setItems]
}

export function Achievements() {
  const role = roleFromPath(useLocation().pathname)
  return <AchievementBoard key={role} role={role} />
}

function AchievementBoard({ role }) {
  const types = ACH_TYPES[role] || ACH_TYPES.staff
  const [items, setItems] = useAchievements()
  const [cheered, setCheered] = useStored(`achievements:cheered:${role}`, [])
  const [author, setAuthor] = useStored(`profile:${role}-author`, '')
  const [dept, setDept] = useStored(`profile:${role}-dept`, '')
  const [email, setEmail] = useStored(`profile:${role}-email`, '')
  const blank = { type: types[0], title: '', summary: '', date: today(), desc: '', photo: '', caption: '' }
  const [form, setForm] = useState(blank)
  const [view, setView] = useState('전체')
  const [note, setNote] = useState('')
  const set = k => e => setForm({ ...form, [k]: e.target.value })
  async function onPhoto(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try { const photo = await readCover(file); setForm(f => ({ ...f, photo })); setNote('') } catch (err) { setNote(err.message) }
  }
  function add(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    // 사진이 많아져 브라우저 저장 공간이 차면 올리지 않고 알려 줍니다.
    const next = [{ ...form, email: email.trim(), id: uid(), title: form.title.trim(), summary: form.summary.trim(), caption: form.caption.trim(), role, owner: role, author: author.trim() || `[${ROLE_LABEL[role]} 이름]`, dept: dept.trim(), cheers: 0 }, ...items]
    try { localStorage.setItem('ghu-copilot:achievements', JSON.stringify(next)) } catch { setNote('브라우저 저장 공간이 부족해 올리지 못했습니다. 사진을 빼거나 예전에 올린 글을 지운 뒤 다시 시도해 주세요.'); return }
    setItems(next)
    setForm(blank); setNote('')
  }
  function cheer(id) {
    const on = cheered.includes(id)
    setCheered(on ? cheered.filter(x => x !== id) : [...cheered, id])
    setItems(items.map(x => (x.id === id ? { ...x, cheers: Math.max(0, (x.cheers || 0) + (on ? -1 : 1)) } : x)))
  }
  const count = r => items.filter(x => x.role === r).length
  const shown = items.filter(x => view === '전체' || (view === '내가 올린 실적' ? x.owner === role : ROLE_LABEL[x.role] === view))
  return (
    <>
      <PageHead title="AI 활용 실적" desc="AI를 활용한 프로젝트, 직접 개발한 앱·에이전트, 수업·업무 개선 사례를 올리고 서로 확인합니다. 사진을 함께 올리면 공개 '성과 소식'에 기사 형태로 실립니다." />
      <div><Link to="/news" className="btn soft" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>성과 소식 화면 보기</Link></div>
      <Card>
        <div className="stat-row">
          {['staff', 'faculty', 'student'].map(r => (
            <div key={r} className="stat" style={{ background: `var(--${ROLE_TONE[r]}-soft)` }}><b style={{ color: `var(--${ROLE_TONE[r] === 'blue' ? 'blue-dark' : ROLE_TONE[r]})` }}>{count(r)}</b><span>{ROLE_LABEL[r]} 실적</span></div>
          ))}
        </div>
      </Card>
      <Card title={`${ROLE_LABEL[role] || ''} AI 활용 실적 올리기`}>
        <form className="stack" style={{ gap: 14 }} onSubmit={add}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '0 0 180px' }}><label htmlFor="a-type">구분</label>
              <select id="a-type" className="input" value={form.type} onChange={set('type')}>{types.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="field" style={{ flex: '1 1 280px' }}><label htmlFor="a-title">실적 제목</label>
              <input id="a-title" className="input" required placeholder="예: 관절가동범위 측정 앱 개발" value={form.title} onChange={set('title')} /></div>
            <div className="field" style={{ flex: '0 0 180px' }}><label htmlFor="a-date">날짜</label>
              <input id="a-date" type="date" className="input" value={form.date} onChange={set('date')} /></div>
          </div>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '1 1 200px' }}><label htmlFor="a-author">이름</label>
              <input id="a-author" className="input" placeholder="통합인증 연결 후에는 자동 입력" value={author} onChange={e => setAuthor(e.target.value)} /></div>
            <div className="field" style={{ flex: '1 1 200px' }}><label htmlFor="a-dept">{role === 'staff' ? '부서' : '학과'}</label>
              <input id="a-dept" className="input" value={dept} onChange={e => setDept(e.target.value)} /></div>
            <div className="field" style={{ flex: '1 1 240px' }}><label htmlFor="a-email">문의 받을 이메일</label>
              <input id="a-email" className="input" type="email" required placeholder="기사의 '문의하기'를 누르면 복사됩니다" value={email} onChange={e => setEmail(e.target.value)} /></div>
          </div>
          <div className="field"><label htmlFor="a-summary">한 줄 요약</label>
            <input id="a-summary" className="input" maxLength={80} placeholder="기사 제목 아래에 들어가는 한 문장 (예: 휴대전화 카메라만으로 관절 각도를 재는 앱을 만들었습니다)" value={form.summary} onChange={set('summary')} /></div>
          <div className="field"><label htmlFor="a-photo">대표 사진</label>
            <div className="cover-pick">
              {form.photo ? <img src={form.photo} alt="올린 대표 사진 미리보기" /> : <div className="cover-empty">사진을 올리면 기사 맨 위에 들어갑니다</div>}
              <div className="stack" style={{ gap: 8 }}>
                <input id="a-photo" type="file" accept="image/*" className="input" onChange={onPhoto} />
                {form.photo && <div><button type="button" className="btn" style={{ minHeight: 36, padding: '0 14px' }} onClick={() => setForm({ ...form, photo: '', caption: '' })}>사진 빼기</button></div>}
                <span className="muted small">활동 장면, 결과물 화면, 발표 모습 등. 가로 16:9로 자동 맞춤됩니다.</span>
              </div>
            </div></div>
          {form.photo && <div className="field"><label htmlFor="a-caption">사진 설명 (선택)</label>
            <input id="a-caption" className="input" maxLength={60} placeholder="예: 캡스톤 발표회에서 앱을 시연하는 모습" value={form.caption} onChange={set('caption')} /></div>}
          <div className="field"><label htmlFor="a-desc">본문</label>
            <textarea id="a-desc" className="textarea" style={{ minHeight: 150 }} placeholder={'줄을 바꾸면 문단이 나뉩니다.\n1) 어떤 문제에서 시작했는지\n2) 어떤 AI 도구로 무엇을 만들었거나 바꿨는지\n3) 결과와 다음 계획'} value={form.desc} onChange={set('desc')} /></div>
          {note && <div className="check warn" role="alert">{note}</div>}
          <div className="check warn">성적, 건강 정보, 다른 사람의 개인정보는 적지 마세요. 다른 사람 얼굴이 나온 사진은 동의를 받은 것만 올려 주세요. 올린 내용과 문의 이메일은 모든 구성원이 볼 수 있습니다.</div>
          <div><button className="btn primary">올리기</button></div>
        </form>
      </Card>
      <Card title="공유된 AI 활용 실적">
        <TypeFilter value={view} onChange={setView} options={['전체', '직원', '교수', '학생', '내가 올린 실적']} />
        {shown.length === 0 ? <Empty>해당하는 실적이 없습니다.</Empty> : (
          <div className="ach-list">{shown.map(x => {
            const on = cheered.includes(x.id)
            return (
              <article key={x.id} className="ach-item">
                <Link to={`/news/${x.id}`} className="ach-thumb" aria-label={`${x.title} 기사로 보기`}><Cover item={x} /></Link>
                <div className="stack" style={{ gap: 6, minWidth: 0 }}>
                  <span className="row" style={{ gap: 6 }}><span className={`badge ${ROLE_TONE[x.role]}`}>{ROLE_LABEL[x.role]}</span><span className="badge">{x.type}</span></span>
                  <h3><Link to={`/news/${x.id}`}>{x.title}</Link></h3>
                  {(x.summary || x.desc) && <p className="small clamp">{x.summary || x.desc}</p>}
                  <span className="muted small">{x.author}{x.dept ? ` · ${x.dept}` : ''} · {x.date || '[날짜]'}</span>
                  <span className="row" style={{ gap: 8 }}>
                    <button className={on ? 'btn soft' : 'btn'} style={{ minHeight: 36, padding: '0 14px' }} aria-pressed={on} onClick={() => cheer(x.id)}>확인했어요 {x.cheers || 0}</button>
                    {x.owner === role && <button className="btn" style={{ minHeight: 36, padding: '0 14px' }} onClick={() => setItems(items.filter(y => y.id !== x.id))}>삭제</button>}
                  </span>
                </div>
              </article>
            )
          })}</div>
        )}
      </Card>
    </>
  )
}
