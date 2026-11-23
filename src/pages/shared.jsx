import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card, PageHead, Empty } from '../components/ui.jsx'
import { useStored, uid, roleFromPath } from '../lib/store.js'

const today = () => new Date().toISOString().slice(0, 10)
const ROLE_LABEL = { staff: '직원', faculty: '교수', student: '학생' }
const ROLE_TONE = { staff: 'blue', faculty: 'green', student: 'amber' }

/* ── 프로그램 등록(직원) · 신청(학생) ── */

export const PROGRAM_TYPES = ['서포터즈', '자격증 과정', '비교과', '소단위과정', '가상학과', '기타']

export const BENEFIT_TYPES = ['장학금', '비교과 마일리지', '수료증', '활동비', '학점 인정', '응시료 지원', '봉사시간', '취업 연계']

// 참여 혜택을 눈에 띄게 보여 주는 상자. 학생 목록, 내 신청 현황, 직원 관리 화면에서 같이 씁니다.
function Benefits({ program, compact = false }) {
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

function usePrograms() {
  const [posts, setPosts] = useStored('programs:posts', SEED_PROGRAMS)
  // 혜택 항목이 생기기 전에 브라우저에 저장된 예시 공고에는 혜택을 채워서 보여 줍니다.
  const patched = posts.map(p => {
    const seed = SEED_PROGRAMS.find(x => x.id === p.id)
    return seed && p.benefits === undefined ? { ...p, benefits: seed.benefits, benefitNote: seed.benefitNote, desc: seed.desc } : p
  })
  return [patched, setPosts]
}

function programState(p) {
  if (!p.open) return ['모집 마감', '']
  if (p.due && p.due < today()) return ['기한 지남', 'red']
  if (p.quota > 0 && p.applicants.length >= p.quota) return ['정원 마감', 'amber']
  return ['모집 중', 'green']
}

function TypeFilter({ value, onChange, options }) {
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
      <Card title="내 신청 현황" action={<Link to="../achievements" className="small">실적으로 공유하기</Link>}>
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

/* ── 실적 공유(직원·교수·학생 공통) ── */

const ACH_TYPES = {
  staff: ['업무 개선', '자동화 사례', '교육 이수', '수상·표창', '기타'],
  faculty: ['논문·학술', '수업 혁신', '연구과제', '산학협력', '수상', '기타'],
  student: ['자격증', '수상·공모전', '프로젝트·캡스톤', '서포터즈·봉사', '비교과 이수', '기타'],
}

const SEED_ACH = [
  { id: 'seed-a1', role: 'staff', type: '자동화 사례', title: '(예시) 회의록 정리와 할 일 추출 자동화', author: '[직원 이름]', dept: '[부서]', date: '', desc: '[어떤 업무를 어떻게 바꿨는지, 줄어든 시간이나 건수]', cheers: 0 },
  { id: 'seed-a2', role: 'faculty', type: '수업 혁신', title: '(예시) 강좌봇을 활용한 실습 사전학습 운영', author: '[교수 이름]', dept: '[학과]', date: '', desc: '[적용 교과목, 운영 방식, 학생 반응]', cheers: 0 },
  { id: 'seed-a3', role: 'student', type: '자격증', title: '(예시) [자격증명] 취득', author: '[학생 이름]', dept: '[학과]', date: '', desc: '[준비 과정, 도움이 된 프로그램]', cheers: 0 },
]

export function Achievements() {
  const role = roleFromPath(useLocation().pathname)
  return <AchievementBoard key={role} role={role} />
}

function AchievementBoard({ role }) {
  const types = ACH_TYPES[role] || ACH_TYPES.staff
  const [items, setItems] = useStored('achievements', SEED_ACH)
  const [cheered, setCheered] = useStored(`achievements:cheered:${role}`, [])
  const [author, setAuthor] = useStored(`profile:${role}-author`, '')
  const [dept, setDept] = useStored(`profile:${role}-dept`, '')
  const blank = { type: types[0], title: '', date: today(), desc: '' }
  const [form, setForm] = useState(blank)
  const [view, setView] = useState('전체')
  const set = k => e => setForm({ ...form, [k]: e.target.value })
  function add(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setItems([{ ...form, id: uid(), title: form.title.trim(), role, owner: role, author: author.trim() || `[${ROLE_LABEL[role]} 이름]`, dept: dept.trim(), cheers: 0 }, ...items])
    setForm(blank)
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
      <PageHead title="실적 공유" desc="직원·교수·학생이 각자의 실적을 올리고 서로 확인합니다. 올린 실적은 세 역할 화면 모두에 보입니다." />
      <Card>
        <div className="stat-row">
          {['staff', 'faculty', 'student'].map(r => (
            <div key={r} className="stat" style={{ background: `var(--${ROLE_TONE[r]}-soft)` }}><b style={{ color: `var(--${ROLE_TONE[r] === 'blue' ? 'blue-dark' : ROLE_TONE[r]})` }}>{count(r)}</b><span>{ROLE_LABEL[r]} 실적</span></div>
          ))}
        </div>
      </Card>
      <Card title={`${ROLE_LABEL[role] || ''} 실적 올리기`}>
        <form className="stack" style={{ gap: 14 }} onSubmit={add}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '0 0 180px' }}><label htmlFor="a-type">구분</label>
              <select id="a-type" className="input" value={form.type} onChange={set('type')}>{types.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="field" style={{ flex: '1 1 280px' }}><label htmlFor="a-title">실적 제목</label>
              <input id="a-title" className="input" required placeholder="예: 물리치료사 국가고시 합격" value={form.title} onChange={set('title')} /></div>
            <div className="field" style={{ flex: '0 0 180px' }}><label htmlFor="a-date">날짜</label>
              <input id="a-date" type="date" className="input" value={form.date} onChange={set('date')} /></div>
          </div>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '1 1 200px' }}><label htmlFor="a-author">이름</label>
              <input id="a-author" className="input" placeholder="통합인증 연결 후에는 자동 입력" value={author} onChange={e => setAuthor(e.target.value)} /></div>
            <div className="field" style={{ flex: '1 1 200px' }}><label htmlFor="a-dept">{role === 'staff' ? '부서' : '학과'}</label>
              <input id="a-dept" className="input" value={dept} onChange={e => setDept(e.target.value)} /></div>
          </div>
          <div className="field"><label htmlFor="a-desc">내용</label>
            <textarea id="a-desc" className="textarea" style={{ minHeight: 90 }} placeholder="무엇을 했고 어떤 결과가 있었는지 적어 주세요" value={form.desc} onChange={set('desc')} /></div>
          <div className="check warn">성적, 건강 정보, 다른 사람의 개인정보는 적지 마세요. 올린 내용은 모든 구성원이 볼 수 있습니다.</div>
          <div><button className="btn primary">올리기</button></div>
        </form>
      </Card>
      <Card title="공유된 실적">
        <TypeFilter value={view} onChange={setView} options={['전체', '직원', '교수', '학생', '내가 올린 실적']} />
        {shown.length === 0 ? <Empty>해당하는 실적이 없습니다.</Empty> : (
          <ul className="list">{shown.map(x => {
            const on = cheered.includes(x.id)
            return (
              <li key={x.id} style={{ alignItems: 'flex-start' }}>
                <span>
                  <span className={`badge ${ROLE_TONE[x.role]}`} style={{ marginRight: 6 }}>{ROLE_LABEL[x.role]}</span><span className="badge" style={{ marginRight: 8 }}>{x.type}</span><b>{x.title}</b><br />
                  <span className="muted small">{x.author}{x.dept ? ` · ${x.dept}` : ''} · {x.date || '[날짜]'}</span>
                  {x.desc && <><br /><span className="small">{x.desc}</span></>}
                </span>
                <span className="row" style={{ gap: 8, flex: 'none' }}>
                  <button className={on ? 'btn soft' : 'btn'} style={{ minHeight: 36, padding: '0 14px' }} aria-pressed={on} onClick={() => cheer(x.id)}>확인했어요 {x.cheers || 0}</button>
                  {x.owner === role && <button className="btn" style={{ minHeight: 36, padding: '0 14px' }} onClick={() => setItems(items.filter(y => y.id !== x.id))}>삭제</button>}
                </span>
              </li>
            )
          })}</ul>
        )}
      </Card>
    </>
  )
}
