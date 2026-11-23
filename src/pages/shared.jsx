import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card, PageHead, Empty } from '../components/ui.jsx'
import { useStored, uid, roleFromPath } from '../lib/store.js'
import shotBody from '../assets/apps/body-aligner.jpg'
import shotGait from '../assets/apps/gait-analyzer.jpg'
import shotBalloon from '../assets/apps/balloon-exercise.jpg'
import shotPpe from '../assets/apps/ppe-concept.jpg'
import shotBps from '../assets/apps/bps-concept.jpg'
import shotFcs from '../assets/apps/fcs-assessment.jpg'

const today = () => new Date().toISOString().slice(0, 10)
export const ROLE_LABEL = { staff: '직원', faculty: '교수', student: '학생' }
export const ROLE_TONE = { staff: 'blue', faculty: 'green', student: 'amber' }

/* ── 프로그램 등록(직원) · 신청(학생) ── */

export const PROGRAM_TYPES = ['서포터즈', '자격증 과정', '비교과', '소단위과정', '가상학과', '기타']

export const BENEFIT_TYPES = ['장학금', '비교과 마일리지', '수료증', '활동비', '학점 인정', '응시료 지원', '봉사시간', '취업 연계']

// 참여 혜택을 눈에 띄게 보여 주는 상자. 학생 목록, 내 신청 현황, 직원 관리 화면에서 같이 씁니다.
export function Benefits({ program, compact = false }) {
  const tags = program.benefits || []
  const note = (program.benefitNote || '').trim()
  if (tags.length === 0 && !note) return compact ? null : <div className="benefit-box empty">참여 혜택이 아직 적혀 있지 않습니다.</div>
  return (
    <div className={compact ? 'benefit-box compact' : 'benefit-box'}>
      <span className="benefit-label">참여 혜택</span>
      <span className="benefit-tags">{tags.map(t => <span key={t} className="benefit-tag">{t}</span>)}</span>
      {note && !compact && <span className="benefit-note">{note}</span>}
    </div>
  )
}

const SEED_PROGRAMS = [
  { id: 'seed-1', type: '서포터즈', title: 'AI 서포터즈 모집 (예시)', dept: '[주관 부서]', quota: 20, due: '', period: '[운영 기간]', benefits: ['활동비', '수료증', '비교과 마일리지'], benefitNote: '[활동비 금액, 마일리지 점수]', desc: '교내 AI 활용 사례를 찾아 알리는 학생 서포터즈입니다. 직원 화면에서 실제 공고로 바꿔 주세요.', open: true, applicants: [] },
  { id: 'seed-2', type: '자격증 과정', title: '[자격증 과정명] (예시)', dept: '[주관 부서]', quota: 30, due: '', period: '[운영 기간]', benefits: ['응시료 지원', '수료증'], benefitNote: '[지원 금액과 조건]', desc: '[과정 내용, 수료 기준]', open: true, applicants: [] },
  { id: 'seed-3', type: '소단위과정', title: '[소단위과정명] (예시)', dept: '[주관 부서]', quota: 0, due: '', period: '[운영 기간]', benefits: ['학점 인정'], benefitNote: '[인정 학점]', desc: '[이수 조건]', open: true, applicants: [] },
]

export function usePrograms() {
  const [posts, setPosts] = useStored('programs:posts', SEED_PROGRAMS)
  // 혜택 항목이 생기기 전에 브라우저에 저장된 예시 공고에는 혜택을 채워서 보여 줍니다.
  const patched = posts.map(p => {
    const seed = SEED_PROGRAMS.find(x => x.id === p.id)
    return seed && p.benefits === undefined ? { ...p, benefits: seed.benefits, benefitNote: seed.benefitNote, desc: seed.desc } : p
  })
  return [patched, setPosts]
}

export function programState(p) {
  if (!p.open) return ['모집 마감', '']
  if (p.due && p.due < today()) return ['기한 지남', 'red']
  if (p.quota > 0 && p.applicants.length >= p.quota) return ['정원 마감', 'amber']
  return ['모집 중', 'green']
}

export function TypeFilter({ value, onChange, options }) {
  return (
    <ul className="steps" aria-label="구분 선택">
      {options.map(o => <li key={o}><button type="button" className={value === o ? 'on' : ''} aria-pressed={value === o} onClick={() => onChange(o)}>{o}</button></li>)}
    </ul>
  )
}

export function ProgramAdmin() {
  const [posts, setPosts] = usePrograms()
  const blank = { type: PROGRAM_TYPES[0], title: '', dept: '', quota: '', due: '', period: '', benefits: [], benefitNote: '', desc: '' }
  const [warn, setWarn] = useState('')
  const [form, setForm] = useState(blank)
  const set = k => e => setForm({ ...form, [k]: e.target.value })
  function add(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (form.benefits.length === 0 && !form.benefitNote.trim()) return setWarn('참여 혜택을 하나 이상 고르거나 적어 주세요. 혜택이 없는 프로그램이면 "혜택 설명"에 "별도 혜택 없음"이라고 적습니다.')
    setWarn('')
    setPosts([{ ...form, id: uid(), title: form.title.trim(), benefitNote: form.benefitNote.trim(), quota: Number(form.quota) || 0, open: true, applicants: [], created: today() }, ...posts])
    setForm(blank)
  }
  const update = (id, fn) => setPosts(posts.map(p => (p.id === id ? fn(p) : p)))
  const toggleBenefit = t => setForm({ ...form, benefits: form.benefits.includes(t) ? form.benefits.filter(x => x !== t) : [...form.benefits, t] })
  const openCount = posts.filter(p => programState(p)[0] === '모집 중').length
  const applied = posts.reduce((n, p) => n + p.applicants.length, 0)
  const selected = posts.reduce((n, p) => n + p.applicants.filter(a => a.status === '선정').length, 0)
  return (
    <>
      <PageHead title="프로그램 등록·관리" desc="서포터즈, 자격증 과정, 비교과 프로그램을 올리면 학생 화면의 '프로그램 신청'에 바로 나타납니다. 신청 현황을 보고 선정까지 처리합니다." />
      <Card>
        <div className="stat-row">
          <div className="stat" style={{ background: 'var(--green-soft)' }}><b style={{ color: 'var(--green)' }}>{openCount}</b><span>모집 중</span></div>
          <div className="stat" style={{ background: 'var(--blue-soft)' }}><b style={{ color: 'var(--blue-dark)' }}>{applied}</b><span>전체 신청</span></div>
          <div className="stat" style={{ background: 'var(--amber-soft)' }}><b style={{ color: 'var(--amber)' }}>{selected}</b><span>선정</span></div>
        </div>
      </Card>
      <Card title="새 프로그램 올리기">
        <form className="stack" style={{ gap: 14 }} onSubmit={add}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '0 0 170px' }}><label htmlFor="p-type">구분</label>
              <select id="p-type" className="input" value={form.type} onChange={set('type')}>{PROGRAM_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="field" style={{ flex: '1 1 260px' }}><label htmlFor="p-title">프로그램명</label>
              <input id="p-title" className="input" required placeholder="예: 2학기 AI 서포터즈 모집" value={form.title} onChange={set('title')} /></div>
          </div>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '1 1 180px' }}><label htmlFor="p-dept">주관 부서</label>
              <input id="p-dept" className="input" placeholder="예: 학생지원처" value={form.dept} onChange={set('dept')} /></div>
            <div className="field" style={{ flex: '0 0 130px' }}><label htmlFor="p-quota">모집 정원</label>
              <input id="p-quota" type="number" min="0" className="input" placeholder="제한 없음" value={form.quota} onChange={set('quota')} /></div>
            <div className="field" style={{ flex: '0 0 180px' }}><label htmlFor="p-due">신청 마감일</label>
              <input id="p-due" type="date" className="input" value={form.due} onChange={set('due')} /></div>
            <div className="field" style={{ flex: '1 1 180px' }}><label htmlFor="p-period">운영 기간</label>
              <input id="p-period" className="input" placeholder="예: 3월~6월, 주 1회" value={form.period} onChange={set('period')} /></div>
          </div>
          <fieldset className="benefit-form">
            <legend>참여 혜택 <span className="muted small">학생 화면 맨 위에 강조되어 보입니다</span></legend>
            <div className="row" style={{ gap: 8 }}>
              {BENEFIT_TYPES.map(t => <button key={t} type="button" className={form.benefits.includes(t) ? 'chip on' : 'chip'} aria-pressed={form.benefits.includes(t)} onClick={() => toggleBenefit(t)}>{t}</button>)}
            </div>
            <div className="field"><label htmlFor="p-benefit">혜택 설명</label>
              <input id="p-benefit" className="input" placeholder="예: 활동비 월 10만 원, 마일리지 30점, 우수 활동자 총장상" value={form.benefitNote} onChange={set('benefitNote')} /></div>
          </fieldset>
          <div className="field"><label htmlFor="p-desc">내용</label>
            <textarea id="p-desc" className="textarea" style={{ minHeight: 90 }} placeholder="대상, 활동 내용, 선정 기준을 적어 주세요" value={form.desc} onChange={set('desc')} /></div>
          {warn && <div className="check warn" role="alert">{warn}</div>}
          <div><button className="btn primary">올리기</button></div>
        </form>
      </Card>
      {posts.length === 0 ? <Empty>올린 프로그램이 없습니다.</Empty> : posts.map(p => {
        const [state, tone] = programState(p)
        return (
          <Card key={p.id} title={p.title} action={<span className="row" style={{ gap: 6 }}><span className="badge blue">{p.type}</span><span className={`badge ${tone}`}>{state}</span></span>}>
            <p className="muted small">{p.dept || '[주관 부서]'} · 마감 {p.due || '[날짜]'} · 운영 {p.period || '[기간]'} · 신청 {p.applicants.length}명{p.quota > 0 ? ` / 정원 ${p.quota}명` : ''}</p>
            <Benefits program={p} />
            {p.desc && <p style={{ margin: 0 }}>{p.desc}</p>}
            {p.applicants.length === 0 ? <Empty>아직 신청자가 없습니다.</Empty> : (
              <ul className="list">
                {p.applicants.map(a => (
                  <li key={a.id}>
                    <span>{a.name} <span className="muted small">· {a.at} 신청</span></span>
                    <span className="row" style={{ gap: 8 }}>
                      <span className={`badge ${a.status === '선정' ? 'green' : ''}`}>{a.status}</span>
                      <button className="btn soft" style={{ minHeight: 34, padding: '0 14px' }} onClick={() => update(p.id, x => ({ ...x, applicants: x.applicants.map(y => (y.id === a.id ? { ...y, status: y.status === '선정' ? '신청' : '선정' } : y)) }))}>{a.status === '선정' ? '선정 취소' : '선정'}</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="row">
              <button className="btn" onClick={() => update(p.id, x => ({ ...x, open: !x.open }))}>{p.open ? '모집 마감' : '모집 재개'}</button>
              <button className="btn" onClick={() => setPosts(posts.filter(x => x.id !== p.id))}>삭제</button>
            </div>
          </Card>
        )
      })}
    </>
  )
}

export function Programs() {
  const [posts, setPosts] = usePrograms()
  const [name, setName] = useStored('profile:student-name', '')
  const [type, setType] = useState('전체')
  const [benefit, setBenefit] = useState('')
  const mine = p => p.applicants.find(a => a.id === 'me')
  const shown = posts.filter(p => (type === '전체' || p.type === type) && (!benefit || (p.benefits || []).includes(benefit)))
  const usedBenefits = BENEFIT_TYPES.filter(t => posts.some(p => (p.benefits || []).includes(t)))
  const myList = posts.filter(mine)
  function toggle(p) {
    setPosts(posts.map(x => {
      if (x.id !== p.id) return x
      if (mine(x)) return { ...x, applicants: x.applicants.filter(a => a.id !== 'me') }
      return { ...x, applicants: [...x.applicants, { id: 'me', name: name.trim() || '[학생 이름]', at: today(), status: '신청' }] }
    }))
  }
  return (
    <>
      <PageHead title="프로그램 신청" desc="직원이 올린 서포터즈, 자격증 과정, 비교과·소단위과정을 한곳에서 보고 신청합니다. 선정 여부도 여기서 확인합니다." />
      <Card>
        <div className="stat-row">
          <div className="stat" style={{ background: 'var(--green-soft)' }}><b style={{ color: 'var(--green)' }}>{posts.filter(p => programState(p)[0] === '모집 중').length}</b><span>모집 중</span></div>
          <div className="stat" style={{ background: 'var(--blue-soft)' }}><b style={{ color: 'var(--blue-dark)' }}>{myList.length}</b><span>내 신청</span></div>
          <div className="stat" style={{ background: 'var(--amber-soft)' }}><b style={{ color: 'var(--amber)' }}>{myList.filter(p => mine(p).status === '선정').length}</b><span>선정</span></div>
        </div>
        <div className="field" style={{ maxWidth: 320 }}><label htmlFor="s-name">신청자 이름</label>
          <input id="s-name" className="input" placeholder="통합인증 연결 후에는 자동 입력" value={name} onChange={e => setName(e.target.value)} /></div>
      </Card>
      <Card title="내 신청 현황" action={<Link to="../resume" className="small">이력서에 넣기</Link>}>
        {myList.length === 0 ? <Empty>신청한 프로그램이 없습니다.</Empty> : (
          <ul className="list">{myList.map(p => {
            const a = mine(p)
            return <li key={p.id}><span><span className="badge blue" style={{ marginRight: 8 }}>{p.type}</span>{p.title}<br /><span className="muted small">{a.at} 신청</span><Benefits program={p} compact /></span><span className={`badge ${a.status === '선정' ? 'green' : 'amber'}`}>{a.status === '선정' ? '선정' : '심사 대기'}</span></li>
          })}</ul>
        )}
      </Card>
      <Card title="프로그램 목록">
        <TypeFilter value={type} onChange={setType} options={['전체', ...PROGRAM_TYPES]} />
        {usedBenefits.length > 0 && (
          <div className="row" style={{ gap: 8 }}>
            <span className="small" style={{ fontWeight: 700 }}>혜택으로 찾기</span>
            {usedBenefits.map(t => <button key={t} type="button" className={benefit === t ? 'chip on' : 'chip'} aria-pressed={benefit === t} onClick={() => setBenefit(benefit === t ? '' : t)}>{t}</button>)}
          </div>
        )}
        {shown.length === 0 ? <Empty>조건에 맞는 프로그램이 없습니다.</Empty> : (
          <ul className="list">{shown.map(p => {
            const [state, tone] = programState(p)
            const applied = !!mine(p)
            return (
              <li key={p.id} style={{ alignItems: 'flex-start' }}>
                <span>
                  <span className="badge blue" style={{ marginRight: 6 }}>{p.type}</span><span className={`badge ${tone}`} style={{ marginRight: 8 }}>{state}</span><b>{p.title}</b>
                  <Benefits program={p} />
                  <span className="muted small">{p.dept || '[주관 부서]'} · 마감 {p.due || '[날짜]'} · 운영 {p.period || '[기간]'} · 신청 {p.applicants.length}명{p.quota > 0 ? ` / 정원 ${p.quota}명` : ''}</span>
                  {p.desc && <><br /><span className="small">{p.desc}</span></>}
                </span>
                <button className={applied ? 'btn' : 'btn primary'} style={{ flex: 'none' }} disabled={!applied && state !== '모집 중'} onClick={() => toggle(p)}>{applied ? '신청 취소' : '신청'}</button>
              </li>
            )
          })}</ul>
        )}
      </Card>
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
const APP_NOTE = '생성형 AI와 대화하며 코드를 작성하는 방식으로 제작했고, 설치 없이 웹 브라우저에서 사용합니다.'
export const FEATURED = [
  { ...PROF, id: 'real-body-aligner', type: 'AI 앱·에이전트 개발', date: '2026-04-13', photo: shotBody, caption: 'BodyAligner 첫 화면',
    title: 'BodyAligner: 카메라로 하는 체형분석 웹앱',
    summary: '앞면·옆면·뒷면을 촬영하면 대칭성과 관절 각도를 분석하고 운동처방까지 제시합니다.',
    desc: 'MediaPipe Pose 기반 체형분석 웹앱입니다.\n앞면·옆면·뒷면 3방향을 촬영해 대칭성, 관절 각도 등 20개 이상의 변수를 산출하고, 임상 해석과 ACSM 기준 운동처방을 함께 보여 줍니다. 결과는 PDF로 내려받거나 구글 시트에 저장할 수 있습니다.\n' + APP_NOTE },
  { ...PROF, id: 'real-nrf-bps', type: 'AI 활용 연구', date: '2026-09-01', photo: shotBps, caption: '만성통증 표현형 연구 개념 이미지',
    title: '한국연구재단 기본연구 선정: AI 기반 만성통증 표현형 정밀 중재 시스템',
    summary: '멀티모달 생체신호와 AI로 만성통증을 유형별로 나누고 맞춤 중재를 찾는 5개년 연구입니다.',
    desc: '2026년 한국연구재단 개인기초연구 기본연구 과제에 선정되었습니다.\n과제명은 「AI기반 멀티모달 생체신호 융합·합성 및 강화학습 매칭을 활용한 만성통증 표현형 정밀 중재 시스템(BPS-PPIS) 알고리즘 개발」이며 5개년 동안 수행합니다.\n만성 척추통증과 섬유근통을 대상으로 생체신호와 설문 자료를 모아 통증 표현형을 분류하고, 표현형에 맞는 중재를 연결하는 알고리즘을 개발합니다.\n과제번호: RS-2026-25591593' },
  { ...PROF, id: 'real-gait-analyzer', type: 'AI 앱·에이전트 개발', date: '2026-04-13', photo: shotGait, caption: 'GaitAnalyzer Web 첫 화면',
    title: 'GaitAnalyzer Web: 카메라 기반 보행분석',
    summary: '측면에서 6m 보행을 촬영하면 보행 변수를 자동으로 분석합니다.',
    desc: 'MediaPipe Pose 기반 보행분석 웹앱입니다.\n연령, 키, 성별을 입력하고 카메라를 보행 경로 측면에 둔 뒤 평소 속도로 6m를 걷는 모습을 촬영하면 자동으로 분석합니다.\n' + APP_NOTE },
  { ...PROF, id: 'real-balloon', type: 'AI 앱·에이전트 개발', date: '2026-04-07', photo: shotBalloon, caption: 'AI 맞춤형 운동 트레이너 첫 화면',
    title: 'AI 맞춤형 운동 트레이너: 풍선 터트리기 운동 게임',
    summary: 'ACSM 평가로 맞춤 프로그램을 만들고, 화면 속 풍선을 터트리며 운동합니다.',
    desc: 'AI스포츠테크연구센터에서 만든 운동 웹앱입니다.\nACSM 평가, 맞춤 프로그램, 카메라 앞에서 움직여 풍선을 터트리는 운동, PDF 리포트 순서로 진행하며 식이 제안도 함께 제공합니다.\n' + APP_NOTE },
  { ...PROF, id: 'real-fcs', type: 'AI 앱·에이전트 개발', date: '2026-03-22', photo: shotFcs, caption: 'FCS 노쇠중심스펙트럼 평가 첫 화면',
    title: 'FCS 노쇠중심스펙트럼 평가 도구',
    summary: '노쇠를 생물·심리·사회·기능 영역으로 나누어 16단계로 평가하는 웹 도구입니다.',
    desc: 'BPS-FN 모델에 따른 노쇠중심스펙트럼(Frailty-Centered Spectrum) 평가 웹앱입니다.\nK-FRAIL, MNA-SF, GDS-SF, K-MMSE, LSNS-6, 수정 바델지수, IADL 등의 평가를 차례로 입력하면 결과를 정리해 보여 줍니다.\n' + APP_NOTE },
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
