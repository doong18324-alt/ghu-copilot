import { useEffect, useRef, useState } from 'react'
import { AppHeader, Field, TextArea, ChipGroup, AiRefine, CopyButton } from './kit.jsx'
import { EMOTIONS, SITUATIONS, DEFAULT_TIPS, CRISIS_WORDS } from './mind-data.js'

/* 마음 비움터
   - 적은 내용은 저장하지 않고 이 화면 안에서만 씁니다.
   - 위기를 뜻하는 낱말이 보이면 공감 문장보다 상담 연락처를 먼저 보여 주고, AI로 보내지 않습니다. */

const HELP = [
  ['자살예방상담전화', '109', '24시간'],
  ['정신건강위기상담전화', '1577-0199', '24시간'],
  ['광주보건대학교 학생상담센터', '[연락처]', '평일 근무시간'],
]

function isCrisis(text) {
  const t = text.replace(/\s/g, '')
  return CRISIS_WORDS.some(w => t.includes(w))
}

function buildLetter(emotions, text) {
  const picked = emotions.map(k => EMOTIONS.find(e => e[0] === k)).filter(Boolean)
  const found = SITUATIONS.filter(s => s.keywords.some(k => text.includes(k)))
  const p = ['오늘 정말 많이 애쓰셨어요.\n쉽게 꺼내지 못했던 마음을 여기에 내려놓아 주셔서 고마워요.']
  if (picked[0]) p.push(picked[0][2])
  if (picked.length > 1) p.push(`게다가 ${picked.slice(1).map(e => e[1].replace(/\s\S+$/, '')).join(', ')}의 마음까지 겹쳐 오늘이 더 버거우셨을 거예요. 여러 감정이 한꺼번에 밀려오는 건 약해서가 아니라 그만큼 진심으로 하루를 살아냈기 때문이에요.`)
  if (found[0]) p.push(found[0].empathy)
  if (found[1]) p.push(found[1].empathy)
  if (!found.length && text.trim()) p.push('적어 주신 문장마다 혼자 꾹꾹 눌러 담아 온 마음이 전해져요. 왜 그런 마음이 들었는지 다 설명하지 않아도 괜찮아요. 그렇게 느꼈다면 그 감정은 그 자체로 존중받아야 할 마음이에요.')
  p.push('지금 당장 모든 걸 해결하지 않아도 괜찮아요. 오늘 여기까지 온 것만으로도 충분히 잘해 내셨어요.')
  const tips = []
  for (const s of found) for (const t of s.tips) if (tips.length < 3 && !tips.some(x => x.text === t.text)) tips.push(t)
  for (const t of DEFAULT_TIPS) if (tips.length < 3 && !tips.some(x => x.text === t.text)) tips.push(t)
  return { letter: p.join('\n\n'), tags: [...picked.map(e => e[1]), ...found.map(s => s.tag)].slice(0, 4), tips }
}

const PHASES = [['들이마시기', 4, '코로 천천히 숨을 들이마셔요', 1.12], ['멈추기', 7, '편안하게 숨을 머금어요', 1.12], ['내쉬기', 8, '입으로 길고 가늘게 내쉬어요', 0.72]]

function Breathing() {
  const [run, setRun] = useState(false)
  const [st, setSt] = useState({ cycle: 1, phase: 0, left: 4 })
  const timer = useRef(null)
  useEffect(() => {
    if (!run) return
    timer.current = setInterval(() => setSt(s => {
      if (s.left > 1) return { ...s, left: s.left - 1 }
      const next = s.phase + 1
      if (next < PHASES.length) return { ...s, phase: next, left: PHASES[next][1] }
      if (s.cycle >= 3) { setRun(false); return { cycle: 1, phase: 0, left: 4, done: true } }
      return { cycle: s.cycle + 1, phase: 0, left: 4 }
    }), 1000)
    return () => clearInterval(timer.current)
  }, [run])
  const [name, , guide, scale] = PHASES[st.phase]
  return (
    <section className="card">
      <div className="card-head"><h2>1분 호흡 (4-7-8)</h2><span className="badge">{st.cycle} / 3 세트</span></div>
      <div className="wa-breath">
        <div className="wa-breath-circle" style={{ transform: `scale(${run ? scale : 1})`, transitionDuration: run ? `${PHASES[st.phase][1]}s` : '0.4s' }} aria-hidden="true">
          <b>{run ? `${st.left}초` : '준비'}</b><span>{run ? name : ''}</span>
        </div>
        <p className="muted" role="status" aria-live="polite">{run ? guide : st.done ? '잘하셨어요. 필요하면 한 번 더 해 보세요.' : '숨이 불편하면 언제든 멈추고 편하게 쉬세요.'}</p>
        <div className="row">
          <button type="button" className="btn primary app-open" onClick={() => setRun(!run)}>{run ? '잠시 멈추기' : '시작하기'}</button>
          <button type="button" className="btn app-open" onClick={() => { setRun(false); setSt({ cycle: 1, phase: 0, left: 4 }) }}>처음부터</button>
        </div>
      </div>
    </section>
  )
}

export default function MindRest({ app }) {
  const [emo, setEmo] = useState([])
  const [text, setText] = useState('')
  const [withTips, setWithTips] = useState('tips')
  const [res, setRes] = useState(null)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState({})

  function comfort() {
    if (!emo.length && !text.trim()) { setMsg('감정을 하나 고르거나 짧게라도 적어 주세요.'); return }
    setMsg(''); setDone({})
    setRes({ ...buildLetter(emo, text), crisis: isCrisis(text) })
  }
  function empty() {
    setText(''); setEmo([]); setRes(null)
    setMsg('적은 마음을 모두 비웠어요. 한결 가벼워진 마음으로 깊게 숨을 쉬어 보세요.')
  }

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">적은 내용은 저장하지 않으며, 이 화면을 닫으면 사라집니다. 전문 상담을 대신하지 않습니다.</span>
      </AppHeader>

      <section className="card">
        <ChipGroup label="지금 마음 날씨" multi options={EMOTIONS.map(([k, label]) => [k, label])} value={emo} onChange={setEmo} />
        <ChipGroup label="어떤 위로를 원하나요" options={[['only', '공감만 받을래요'], ['tips', '작은 행동 팁도 함께']]} value={withTips} onChange={setWithTips} />
        <Field id="mr-text" label="마음속 이야기" hint="이름이나 연락처 같은 개인정보는 적지 않아도 됩니다">
          <TextArea id="mr-text" rows={6} value={text} onChange={setText} placeholder="무엇이든 편하게 적어 보세요." />
        </Field>
        {msg && <div className="check ok" role="status">{msg}</div>}
        <div className="row">
          <button type="button" className="btn primary" onClick={comfort}>공감 편지 받기</button>
          <button type="button" className="btn" onClick={empty}>비우고 지우기</button>
        </div>
      </section>

      {res?.crisis && (
        <section className="card wa-crisis" role="alert">
          <h2>지금 많이 힘드신 것 같아 마음이 쓰여요</h2>
          <p>혼자 견디지 않아도 됩니다. 지금 바로 이야기를 들어 줄 사람이 있어요. 아래 번호로 전화해 주세요. 위급한 상황이면 112나 119에 연락하세요.</p>
          <ul className="list">{HELP.map(([n, tel, t]) => (
            <li key={n}><span><b>{n}</b><br /><span className="muted small">{t}</span></span>{tel.startsWith('[') ? <b>{tel}</b> : <a className="btn primary app-open" href={`tel:${tel}`}>{tel} 전화</a>}</li>
          ))}</ul>
        </section>
      )}

      {res && (
        <>
          <section className="card wa-letter">
            <div className="row" style={{ gap: 6 }}>{res.tags.map(t => <span key={t} className="badge blue">{t}</span>)}</div>
            <h2>당신에게 보내는 편지</h2>
            <p className="wa-letter-body">{res.letter}</p>
            <div className="row"><CopyButton text={res.letter} label="편지 복사" /></div>
          </section>
          {withTips === 'tips' && (
            <section className="card">
              <div className="card-head"><h2>지금 할 수 있는 아주 작은 행동</h2><span className="badge">{Object.values(done).filter(Boolean).length} / {res.tips.length}</span></div>
              <ul className="check-list">{res.tips.map((t, i) => (
                <li key={t.text}><label><input type="checkbox" checked={!!done[i]} onChange={e => setDone({ ...done, [i]: e.target.checked })} /><span>{t.text} <span className="muted small">({t.time})</span></span></label></li>
              ))}</ul>
            </section>
          )}
          <Breathing />
          {!res.crisis && (
            <AiRefine appId="mind-rest" label="지후에게 이야기 더 들려주기"
              note="적은 이야기를 바탕으로 판단 없이 공감하는 짧은 답장을 받습니다. 진단이나 치료 조언은 하지 않습니다."
              prompt={`감정: ${emo.map(k => EMOTIONS.find(e => e[0] === k)?.[1]).join(', ') || '선택 없음'}\n이야기: ${text || '(적지 않음)'}`} />
          )}
        </>
      )}
      {!res && <Breathing />}
    </>
  )
}
