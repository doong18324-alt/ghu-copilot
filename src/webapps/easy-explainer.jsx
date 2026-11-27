import { useMemo, useState } from 'react'
import { AppHeader, Field, TextArea, ChipGroup, AiRefine, Notice } from './kit.jsx'
import { SAMPLES, TERMS as T1 } from './explainer-data.js'
import { TERMS2 } from './explainer-terms2.js'

const LV = { elementary: 0, secondary: 1, college: 2 }
const TERMS = { ...T1, ...Object.fromEntries(Object.entries(TERMS2).map(([k, v]) => [k, { elementary: v[0], secondary: v[1], college: v[2] }])) }

/* 어려운 개념 쉽게 풀기·미니 퀴즈
   기존 앱(V2)은 분야마다 정해진 비유 문장 하나를 어떤 글에나 똑같이 붙였습니다.
   이 버전은 규칙으로 할 수 있는 일(문장 난이도 점검, 용어 풀이, 용어 퀴즈)만 규칙으로 하고,
   글 내용에 맞춘 쉬운 설명과 비유는 지후 AI가 만들도록 나눴습니다. */

const LEVELS = [['elementary', '초등학생 눈높이', '아주 쉬운 말과 생활 비유'], ['secondary', '중·고등학생 눈높이', '비유와 핵심 용어 연결'], ['college', '대학 신입생 눈높이', '구조와 전공 기초 어휘']]

function splitSentences(t) {
  return t.replace(/\s+/g, ' ').split(/(?<=[.?!다요])\s+(?=[가-힣A-Za-z0-9(“"'])/).map(s => s.trim()).filter(s => s.length > 1)
}

function shuffle(a) { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }

// 글에서 핵심어 후보 찾기: 두 번 이상 나오거나 전문 용어처럼 보이는 낱말
function keywords(text) {
  const words = (text.match(/[가-힣A-Za-z]{2,}/g) || []).map(w => w.replace(/(으로|에서|에게|까지|부터|이라|이다|이며|하고|하는|하여|되어|된다|한다|이고|에는|으로써|의|은|는|이|가|을|를|에|와|과|도|로|만)$/, ''))
  const stop = new Set(['그리고', '하지만', '이러한', '때문', '경우', '대한', '통해', '위해', '있다', '없다', '것이', '수가', '이로', '인해', '또한', '따라'])
  const cnt = {}
  words.filter(w => w.length >= 2 && !stop.has(w)).forEach(w => { cnt[w] = (cnt[w] || 0) + 1 })
  return Object.entries(cnt).filter(([w, n]) => n >= 2 || w.length >= 4).sort((a, b) => b[1] * b[0].length - a[1] * a[0].length).map(([w]) => w).slice(0, 12)
}

// 한 줄 핵심: 핵심어를 가장 많이 담은 문장
function keySentence(sents, keys) {
  let best = sents[0] || '', score = -1
  sents.forEach(s => { const n = keys.filter(k => s.includes(k)).length; if (n > score) { score = n; best = s } })
  return best
}

function analyze(text, level) {
  const sents = splitSentences(text)
  const long = sents.filter(s => s.length > 80)
  const found = Object.keys(TERMS).filter(t => text.includes(t))
  const others = Object.keys(TERMS).filter(t => !found.includes(t))
  const keys = keywords(text)
  const quiz = shuffle(found).slice(0, 3).map(t => {
    const opts = shuffle([t, ...shuffle(others).slice(0, 3)])
    return { kind: 'term', q: '다음 설명에 맞는 용어는?', def: TERMS[t][level], opts, answer: opts.indexOf(t) }
  })
  // 사전 용어가 3개보다 적으면 원문 문장의 빈칸 채우기 문제로 채웁니다.
  const used = new Set()
  for (const k of keys) {
    if (quiz.length >= 3) break
    const s = sents.find(x => x.includes(k) && !used.has(x))
    const pool = keys.filter(x => x !== k && !s?.includes(x))
    if (!s || pool.length < 3) continue
    used.add(s)
    const opts = shuffle([k, ...shuffle(pool).slice(0, 3)])
    quiz.push({ kind: 'cloze', q: '빈칸에 들어갈 말은?', def: s.replace(k, '(　　　)'), opts, answer: opts.indexOf(k) })
  }
  const avg = sents.length ? Math.round(sents.reduce((n, s) => n + s.length, 0) / sents.length) : 0
  return { sents, long, found, quiz, avg, keys, key: keySentence(sents, keys) }
}

export default function EasyExplainer({ app }) {
  const [level, setLevel] = useState('secondary')
  const [text, setText] = useState('')
  const [res, setRes] = useState(null)
  const [pick, setPick] = useState({})
  const [checked, setChecked] = useState(false)

  function run() { if (!text.trim()) return; setRes(analyze(text, level)); setPick({}); setChecked(false) }
  const score = res ? res.quiz.filter((q, i) => pick[i] === q.answer).length : 0
  const aiPrompt = useMemo(() => !text.trim() ? '' : `눈높이: ${LEVELS.find(l => l[0] === level)[1]}\n\n[원문]\n${text}\n\n원문 내용만 바탕으로 (1) 세 줄 핵심 요약, (2) 일상 비유 하나, (3) 어려운 용어 풀이, (4) 이해 확인 퀴즈 3문제(보기 4개, 정답과 해설)를 만들어 주세요. 원문에 없는 사실은 덧붙이지 마세요.`, [text, level])

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">전공 문장이나 기사를 붙여 넣으면 한 줄 핵심과 핵심어를 뽑고, 어려운 문장과 용어를 짚고, 이해 확인 퀴즈 3문제를 냅니다.</span>
      </AppHeader>
      <section className="card">
        <ChipGroup label="누구 눈높이로" options={LEVELS} value={level} onChange={setLevel} />
        <Field id="ee-text" label="원문" hint={`${text.length.toLocaleString()}자`}>
          <TextArea id="ee-text" rows={7} value={text} onChange={setText} placeholder="어려운 전공 문장이나 기사를 붙여 넣으세요." />
        </Field>
        <div className="row" style={{ gap: 6 }}>
          <span className="small muted">예시 지문</span>
          {SAMPLES.map(([k, name, t]) => <button key={k} type="button" className="chip" onClick={() => setText(t)}>{name}</button>)}
        </div>
        <div className="row"><button type="button" className="btn primary" disabled={!text.trim()} onClick={run}>살펴보기</button></div>
      </section>

      {res && (
        <>
          <section className="card">
            <div className="card-head"><h2>한 줄 핵심</h2><span className="muted small">핵심어가 가장 많이 담긴 문장</span></div>
            <p style={{ margin: 0, fontWeight: 600 }}>{res.key}</p>
            {res.keys.length > 0 && <div className="wa-chips">{res.keys.map(k => <span key={k} className="badge">{k}</span>)}</div>}
            <p className="muted small" style={{ margin: 0 }}>원문 문장을 그대로 고른 것입니다. 쉬운 말로 다시 쓴 요약과 일상 비유는 아래 지후 AI가 만듭니다.</p>
          </section>

          <section className="card">
            <div className="card-head"><h2>문장 난이도</h2><span className="muted small">{res.sents.length}문장 · 평균 {res.avg}자</span></div>
            {res.long.length === 0 ? <div className="check ok">80자를 넘는 긴 문장이 없습니다.</div> : (
              <>
                <p className="muted small" style={{ margin: 0 }}>80자를 넘는 문장은 두세 문장으로 나누면 훨씬 쉬워집니다.</p>
                <ul className="list">{res.long.map(s => <li key={s}><span>{s}</span><span className="badge amber">{s.length}자</span></li>)}</ul>
              </>
            )}
          </section>

          <section className="card">
            <div className="card-head"><h2>어려운 용어 풀이</h2><span className="muted small">사전에 있는 용어 {res.found.length}개</span></div>
            {res.found.length === 0 ? <Notice>지금 사전에 등록된 용어가 이 글에는 없습니다. 지후 AI가 연결되면 글에 나온 용어를 모두 풀이합니다.</Notice> : (
              <div className="grid">{res.found.map(t => <div key={t} className="tile"><b>{t}</b><span>{TERMS[t][level]}</span></div>)}</div>
            )}
          </section>

          {res.quiz.length > 0 && (
            <section className="card">
              <div className="card-head"><h2>이해 확인 퀴즈</h2>{checked && <span className={`badge ${score === res.quiz.length ? 'green' : 'amber'}`}>{score} / {res.quiz.length}</span>}</div>
              {res.quiz.map((q, i) => (
                <div key={i} className="stack" style={{ gap: 8 }}>
                  <b>{i + 1}. {q.q}</b>
                  <p className="muted" style={{ margin: 0 }}>“{q.def}”</p>
                  {checked && <p className="small" style={{ margin: 0 }}>{pick[i] === q.answer ? '정답입니다.' : `정답: ${q.opts[q.answer]}`}{q.kind === 'cloze' ? ' (원문 문장에서 낸 문제)' : ''}</p>}
                  <div className="wa-chips">{q.opts.map((o, j) => {
                    const cls = checked ? (j === q.answer ? 'wa-chip ok' : pick[i] === j ? 'wa-chip bad' : 'wa-chip') : pick[i] === j ? 'wa-chip on' : 'wa-chip'
                    return <button key={o} type="button" className={cls} aria-pressed={pick[i] === j} disabled={checked} onClick={() => setPick({ ...pick, [i]: j })}><b>{o}</b></button>
                  })}</div>
                </div>
              ))}
              <div className="row">
                {!checked ? <button type="button" className="btn primary" disabled={Object.keys(pick).length < res.quiz.length} onClick={() => setChecked(true)}>채점하기</button>
                  : <button type="button" className="btn" onClick={() => { setRes(analyze(text, level)); setPick({}); setChecked(false) }}>새 문제</button>}
              </div>
            </section>
          )}
        </>
      )}

      {text.trim() && <AiRefine appId="easy-explainer" label="지후 AI로 쉽게 풀어 설명받기" note="원문 내용에 맞춘 세 줄 요약, 일상 비유, 용어 풀이, 이해 확인 퀴즈 3문제를 만듭니다. 원문에 없는 사실은 덧붙이지 않습니다." prompt={aiPrompt} />}
    </>
  )
}
