import { useLayoutEffect, useRef, useState } from 'react'
import { Card, PageHead, Empty } from '../components/ui.jsx'
import { useStored, uid } from '../lib/store.js'
import { usePrograms, useAchievements } from './shared.jsx'

const COLORS = [['#1D3A8A', '남색'], ['#0B63CE', '파랑'], ['#1F6F5C', '청록'], ['#3A3F4B', '진회색']]
const BLANK = { name: '', tagline: '', birth: '', phone: '', email: '', address: '', photo: '', color: COLORS[0][0], education: [], licenses: [], activities: [], skills: [] }
const period = (from, to) => [from, to].filter(Boolean).join(' ~ ')

// 올린 사진을 가운데 기준 정사각형으로 잘라 줄입니다(브라우저 저장 용량을 아끼기 위해).
function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const c = document.createElement('canvas'); c.width = c.height = 480
      // 얼굴이 위쪽에 있는 경우가 많아 세로 사진은 위쪽을 조금 더 남깁니다.
      const sx = (img.width - side) / 2, sy = (img.height - side) * 0.25
      c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, 480, 480)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.88))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('사진을 읽지 못했습니다. JPG 또는 PNG 파일인지 확인해 주세요.')) }
    img.src = url
  })
}

// 워드 파일에는 원형으로 오려 낸 PNG를 넣습니다.
function circlePng(dataUrl) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 360
      const g = c.getContext('2d')
      g.beginPath(); g.arc(180, 180, 180, 0, Math.PI * 2); g.clip()
      g.drawImage(img, 0, 0, 360, 360)
      c.toBlob(b => b.arrayBuffer().then(buf => resolve(new Uint8Array(buf))), 'image/png')
    }
    img.src = dataUrl
  })
}

function download(blob, name) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

function Sheet({ data }) {
  // 내용이 한 쪽(A4)을 넘으면 글자와 간격을 함께 줄여 한 쪽에 맞춥니다. 너무 많으면(70% 미만) 다음 쪽으로 넘깁니다.
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    el.style.setProperty('--fit', '1')
    const page = el.parentElement.clientWidth * 297 / 210
    const height = el.scrollHeight
    if (height > page + 1) el.style.setProperty('--fit', String(Math.max(0.7, (page / height) * 0.985)))
  })
  const Row = ({ title, en, children }) => (
    <section className="rs-row">
      <div className="rs-label"><b>{title}</b><span>{en}</span></div>
      <div className="rs-body">{children}</div>
    </section>
  )
  const Entry = ({ title, detail, when }) => (
    <div className="rs-entry">
      <div className="rs-line"><b>{title}</b><i aria-hidden="true" />{when && <span>{when}</span>}</div>
      {detail && <small>{detail}</small>}
    </div>
  )
  return (
    <div className="resume-wrap">
      <div className="resume-sheet" id="resume-sheet" ref={ref} style={{ '--rs': data.color }}>
        <header className="rs-head">
          <div className="rs-photo">{data.photo ? <img src={data.photo} alt="증명사진" /> : <span>사진</span>}</div>
          <div>
            {data.tagline && <p className="rs-tagline">{data.tagline}</p>}
            <h2 className="rs-name">{data.name || '[이름]'}</h2>
          </div>
        </header>
        <Row title="기본사항" en="Personal Information">
          {data.birth && <p className="rs-info">생년월일 <b>{data.birth}</b></p>}
          {(data.phone || data.email) && <p className="rs-info">{[data.phone, data.email].filter(Boolean).join('  |  ')}</p>}
          {data.address && <p className="rs-info">주소 <b>{data.address}</b></p>}
          {!data.birth && !data.phone && !data.email && !data.address && <p className="rs-empty">연락처와 주소를 입력하세요</p>}
        </Row>
        {data.education.length > 0 && <Row title="학력사항" en="Education">{data.education.map(e => <Entry key={e.id} title={e.school || '[학교명]'} detail={e.detail} when={period(e.from, e.to)} />)}</Row>}
        {data.licenses.length > 0 && <Row title="보유자격증" en="License">{data.licenses.map(l => <Entry key={l.id} title={l.name || '[자격증명]'} when={l.date} />)}</Row>}
        {data.activities.length > 0 && <Row title="활동·경험" en="Experience">{data.activities.map(a => <Entry key={a.id} title={a.title || '[활동명]'} detail={a.detail} when={period(a.from, a.to)} />)}</Row>}
        {data.skills.length > 0 && (
          <Row title="기술사항" en="Skills">
            <div className="rs-skills">{data.skills.map(s => <div key={s.id} className="rs-skill"><b>{s.name || '[기술]'}</b><span aria-label={`5단계 중 ${s.level}`}>{[1, 2, 3, 4, 5].map(n => <i key={n} className={n <= s.level ? 'on' : ''} />)}</span></div>)}</div>
          </Row>
        )}
      </div>
    </div>
  )
}

// 여러 줄을 추가·삭제하는 입력 묶음
function ListEditor({ title, hint, items, onChange, fields, blank, addLabel, extra }) {
  const set = (id, key, value) => onChange(items.map(x => (x.id === id ? { ...x, [key]: value } : x)))
  return (
    <Card title={title} action={<button type="button" className="btn soft" onClick={() => onChange([...items, { id: uid(), ...blank }])}>{addLabel}</button>}>
      {hint && <p className="muted small">{hint}</p>}
      {extra}
      {items.length === 0 ? <Empty>아직 입력한 항목이 없습니다.</Empty> : items.map(item => (
        <div key={item.id} className="resume-item">
          {fields.map(([key, label, type = 'text', flex = '1 1 160px']) => (
            <div key={key} className="field" style={{ flex }}>
              <label htmlFor={`${item.id}-${key}`}>{label}</label>
              {type === 'level'
                ? <select id={`${item.id}-${key}`} className="input" value={item[key]} onChange={e => set(item.id, key, Number(e.target.value))}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}단계</option>)}</select>
                : <input id={`${item.id}-${key}`} className="input" type={type} value={item[key]} onChange={e => set(item.id, key, e.target.value)} />}
            </div>
          ))}
          <button type="button" className="btn" aria-label={`${title} 항목 삭제`} onClick={() => onChange(items.filter(x => x.id !== item.id))}>삭제</button>
        </div>
      ))}
    </Card>
  )
}

export function Resume() {
  const [saved, setData] = useStored('resume:student', BLANK)
  const data = { ...BLANK, ...saved }
  const [programs] = usePrograms()
  const [achievements] = useAchievements()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const put = patch => setData({ ...data, ...patch })
  const field = key => e => put({ [key]: e.target.value })
  const say = text => { setNote(text); setTimeout(() => setNote(''), 4000) }

  async function onPhoto(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try { put({ photo: await readPhoto(file) }); say('사진을 넣었습니다.') } catch (err) { say(err.message) }
  }

  // 바이탈에서 신청·선정된 프로그램과 내가 올린 AI 활용 실적을 활동란으로 가져옵니다.
  function importActivities() {
    const have = new Set(data.activities.map(a => a.source).filter(Boolean))
    const fromPrograms = programs
      .filter(p => p.applicants.some(a => a.id === 'me' && a.status === '선정'))
      .map(p => ({ source: `program:${p.id}`, title: p.title, detail: [p.type, p.dept].filter(Boolean).join(' | '), from: '', to: '' }))
    const fromAchievements = achievements
      .filter(a => a.owner === 'student')
      .map(a => ({ source: `ach:${a.id}`, title: a.title, detail: `AI 활용 실적 | ${a.type}`, from: a.date || '', to: '' }))
    const fresh = [...fromPrograms, ...fromAchievements].filter(x => !have.has(x.source)).map(x => ({ id: uid(), ...x }))
    if (fresh.length === 0) return say('새로 가져올 활동이 없습니다. 선정된 프로그램이나 올린 AI 활용 실적이 있으면 여기에 들어옵니다.')
    put({ activities: [...data.activities, ...fresh] })
    say(`${fresh.length}건을 활동·경험에 넣었습니다. 기간은 직접 입력해 주세요.`)
  }

  async function saveWord() {
    setBusy(true)
    try {
      const { buildResumeDocx } = await import('../lib/resumeDocx.js')
      const blob = await buildResumeDocx(data, data.photo ? await circlePng(data.photo) : null)
      download(blob, `${data.name || '이력서'}_이력서.docx`)
    } catch (err) {
      say('워드 파일을 만들지 못했습니다: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHead title="이력서 만들기" desc="내용을 입력하면 오른쪽 양식에 바로 반영됩니다. 사진을 올리면 원형 자리에 맞춰 들어가고, PDF나 워드 파일로 내려받을 수 있습니다." />
      <div className="check ok no-print">입력한 내용과 사진은 이 브라우저에만 저장되고 다른 사람에게 보이지 않습니다. 자격증도 여기서 본인이 직접 관리합니다.</div>
      {note && <div className="check warn no-print" role="status">{note}</div>}
      <div className="resume-layout">
        <div className="stack resume-form" style={{ gap: 20 }}>
          <Card title="기본사항">
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <div className="field" style={{ flex: '1 1 160px' }}><label htmlFor="r-name">이름</label><input id="r-name" className="input" value={data.name} onChange={field('name')} /></div>
              <div className="field" style={{ flex: '2 1 240px' }}><label htmlFor="r-tagline">한 줄 소개</label><input id="r-tagline" className="input" placeholder="예: 환자의 하루를 먼저 생각하는 물리치료사" value={data.tagline} onChange={field('tagline')} /></div>
            </div>
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <div className="field" style={{ flex: '1 1 150px' }}><label htmlFor="r-birth">생년월일</label><input id="r-birth" className="input" placeholder="2004.03.15" value={data.birth} onChange={field('birth')} /></div>
              <div className="field" style={{ flex: '1 1 160px' }}><label htmlFor="r-phone">전화</label><input id="r-phone" className="input" type="tel" value={data.phone} onChange={field('phone')} /></div>
              <div className="field" style={{ flex: '1 1 200px' }}><label htmlFor="r-email">이메일</label><input id="r-email" className="input" type="email" value={data.email} onChange={field('email')} /></div>
            </div>
            <div className="field"><label htmlFor="r-address">주소</label><input id="r-address" className="input" value={data.address} onChange={field('address')} /></div>
            <div className="row">
              <label className="btn soft" style={{ display: 'inline-flex', alignItems: 'center' }}>{data.photo ? '사진 바꾸기' : '사진 올리기'}<input id="r-photo" type="file" accept="image/*" className="sr-only" onChange={onPhoto} /></label>
              {data.photo && <button type="button" className="btn" onClick={() => put({ photo: '' })}>사진 빼기</button>}
              <span className="small muted">양식 색</span>
              {COLORS.map(([c, name]) => <button key={c} type="button" className={data.color === c ? 'swatch on' : 'swatch'} style={{ background: c }} aria-label={`${name} 양식`} aria-pressed={data.color === c} onClick={() => put({ color: c })} />)}
            </div>
          </Card>
          <ListEditor title="학력사항" items={data.education} onChange={v => put({ education: v })} addLabel="학력 추가" blank={{ school: '', detail: '', from: '', to: '' }}
            fields={[['school', '학교'], ['detail', '전공·계열'], ['from', '입학', 'text', '0 1 110px'], ['to', '졸업(예정)', 'text', '0 1 110px']]} />
          <ListEditor title="보유자격증" hint="자격증은 공유되지 않고 이력서에만 들어갑니다." items={data.licenses} onChange={v => put({ licenses: v })} addLabel="자격증 추가" blank={{ name: '', date: '' }}
            fields={[['name', '자격증·면허'], ['date', '취득일', 'text', '0 1 130px']]} />
          <ListEditor title="활동·경험" hint="서포터즈, 대외활동, 봉사, 실습, 아르바이트를 적습니다." items={data.activities} onChange={v => put({ activities: v })} addLabel="활동 추가" blank={{ title: '', detail: '', from: '', to: '' }}
            fields={[['title', '활동명'], ['detail', '역할·내용'], ['from', '시작', 'text', '0 1 110px'], ['to', '종료', 'text', '0 1 110px']]}
            extra={<div><button type="button" className="btn" onClick={importActivities}>바이탈 활동 불러오기</button> <span className="small muted">선정된 프로그램과 내가 올린 AI 활용 실적</span></div>} />
          <ListEditor title="기술사항" items={data.skills} onChange={v => put({ skills: v })} addLabel="기술 추가" blank={{ name: '', level: 3 }}
            fields={[['name', '기술·도구'], ['level', '숙련도', 'level', '0 1 120px']]} />
        </div>
        <div className="resume-side">
          <div className="row no-print">
            <button type="button" className="btn primary" onClick={() => window.print()}>PDF로 저장</button>
            <button type="button" className="btn" onClick={saveWord} disabled={busy}>{busy ? '만드는 중' : '워드로 저장'}</button>
          </div>
          <p className="small muted no-print" style={{ margin: 0 }}>PDF는 인쇄 창에서 대상을 &lsquo;PDF로 저장&rsquo;으로 고르고, 배경 그래픽을 켜 주세요.</p>
          <Sheet data={data} />
        </div>
      </div>
    </>
  )
}
