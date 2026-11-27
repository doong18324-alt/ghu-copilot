import { useMemo, useState } from 'react'
import { AppHeader, Field, TextArea, ChipGroup, AiRefine, Notice } from './kit.jsx'
import { SAMPLES, TERMS } from './explainer-data.js'

/* 어려운 개념 쉽게 풀기·미니 퀴즈
   기존 앱(V2)은 분야마다 정해진 비유 문장 하나를 어떤 글에나 똑같이 붙였습니다.
   이 버전은 규칙으로 할 수 있는 일(문장 난이도 점검, 용어 풀이, 용어 퀴즈)만 규칙으로 하고,
   글 내용에 맞춘 쉬운 설명과 비유는 지후 AI가 만들도록 나눴습니다. */

const LEVELS = [['elementary', '초등학생 눈높이', '아주 쉬운 말과 생활 비유'], ['secondary', '중·고등학생 눈높이', '비유와 핵심 용어 연결'], ['college', '대학 신입생 눈높이', '구조와 전공 기초 어휘']]

function splitSentences(t) {
  return t.replace(/\s+/g, ' ').split(/(?<=[.?!다요])\s+(?=[가-힣A-Za-z0-9(“"'])/).map(s => s.trim()).filter(s => s.length > 1)
}

function shuffle(a) { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }

function analyze(text, level) {
  const sents = splitSentences(text)
  const long = sents.filter(s => s.length > 80)
  const found = Object.keys(TERMS).filter(t => text.includes(t))
  const others = Object.keys(TERMS).filter(t => !found.includes(t))
  const quiz = shuffle(found).slice(0, 3).map(t => {
    const wrong = shuffle(others).slice(0, 3)
    const opts = shuffle([t, ...wrong])
    return { def: TERMS[t][level], opts, answer: opts.indexOf(t) }
  })
  const avg = sents.length ? Math.round(sents.reduce((n, s) => n + s.length, 0) / sents.length) : 0
  return { sents, long, found, quiz, avg }
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
        <span className="small muted">전공 문장이나 기사를 붙여 넣으면 어려운 문장과 용어를 짚어 주고, 용어 퀴즈를 냅니다.</span>
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
              <div className="card-head"><h2>용어 퀴즈</h2>{checked && <span className={`badge ${score === res.quiz.length ? 'green' : 'amber'}`}>{score} / {res.quiz.length}</span>}</div>
              {res.quiz.map((q, i) => (
                <div key={i} className="stack" style={{ gap: 8 }}>
                  <b>{i + 1}. 다음 설명에 맞는 용어는?</b>
                  <p className="muted" style={{ margin: 0 }}>“{q.def}”</p>
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
