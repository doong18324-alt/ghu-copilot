import { useState } from 'react'
import { AppHeader, AiRefine, CopyButton, Notice } from './kit.jsx'
import { searchArticles } from '../lib/rules.js'
import { RegLibrary, useRegs, allArticles, Highlight } from './regs.jsx'

/* 학칙·대학 규정 Q&A
   기존 챗봇(V1)처럼 올린 규정의 조항을 찾아 근거로 답하되, 바이탈 공용 조항 검색 엔진과
   PDF 읽기(외부 CDN 없이)로 바꾸고, 찾은 조항을 근거로 지후 AI가 문장으로 정리하도록 했습니다. */

const SUGGEST = ['휴학은 몇 학기까지 할 수 있나요?', '성적 이의신청은 언제까지 하나요?', '자퇴하면 등록금은 얼마나 돌려받나요?', '출석이 부족하면 어떻게 되나요?', '성적장학금 기준이 뭔가요?', '복학 신청은 언제 하나요?', '학사경고를 몇 번 받으면 제적되나요?', '계절학기는 몇 학점까지 들을 수 있나요?']

const words = q => (q.match(/[가-힣A-Za-z0-9]{2,}/g) || []).map(t => t.replace(/(은|는|이|가|을|를|에|의|로|으로|와|과|도|만|에서|하나요|인가요|되나요|있나요|나요|까지)$/, '')).filter(t => t.length >= 2)

function coreSentence(a) {
  const body = a.body.replace(/^제\s*\d+\s*조(?:의\s*\d+)?\s*[(（][^)）]*[)）]\s*/, '')
  return (body.split('\n').find(l => l.trim().length > 10) || body).trim()
}

export default function RulesChatbot({ app }) {
  const [regs, setRegs] = useRegs()
  const [q, setQ] = useState('')
  const [log, setLog] = useState([])
  const arts = allArticles(regs)

  function ask(text = q) {
    const question = text.trim()
    if (!question) return
    const found = searchArticles(arts, question, 3)
    setLog(l => [{ question, found, ws: words(question) }, ...l])
    setQ('')
  }

  const last = log[0]
  const aiPrompt = !last || !last.found.length ? '' : `질문: ${last.question}\n\n[찾은 조항]\n${last.found.map(a => `${a.source} ${a.no}(${a.title})\n${a.body}`).join('\n\n')}\n\n역할: 학생에게 학칙을 풀어 주는 학사 상담 직원입니다.\n지킬 것: 위 조항만 근거로 하기, 숫자·기간은 조항 그대로 옮기기, 조항에 없는 내용은 "[담당 부서]에 확인"으로 안내하기, 존댓말.\n출력: ① 한 줄 답 ② 근거 조항 인용(조항 번호 포함) ③ 학생이 지금 할 일 1~3개 ④ 예외·주의할 점(조항에 있을 때만)`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">답은 올린 규정의 조항에서만 찾습니다. 최종 판단은 담당 부서 안내를 따르세요.</span>
      </AppHeader>
      <RegLibrary regs={regs} setRegs={setRegs} />

      <section className="card">
        <div className="card-head"><h2>규정에 물어보기</h2></div>
        {arts.length === 0 && <Notice>먼저 규정 파일을 올리거나 예시 규정을 넣어 주세요.</Notice>}
        <form className="row" onSubmit={e => { e.preventDefault(); ask() }}>
          <label htmlFor="rc-q" className="sr-only">질문</label>
          <input id="rc-q" className="input" style={{ flex: '1 1 320px' }} value={q} onChange={e => setQ(e.target.value)} placeholder="예: 휴학은 몇 학기까지 할 수 있나요?" disabled={!arts.length} />
          <button type="submit" className="btn primary" disabled={!arts.length || !q.trim()}>찾기</button>
        </form>
        <div className="row" style={{ gap: 6 }}>{SUGGEST.map(s => <button key={s} type="button" className="chip" disabled={!arts.length} onClick={() => ask(s)}>{s}</button>)}</div>
      </section>

      {log.map((m, i) => (
        <section key={log.length - i} className="card">
          <div className="wa-q"><span className="faq-q">Q</span><b>{m.question}</b></div>
          {m.found.length === 0 ? (
            <Notice>올린 규정에서 관련 조항을 찾지 못했습니다. 다른 낱말로 물어보거나 담당 부서에 확인해 주세요.</Notice>
          ) : (
            <>
              <p className="wa-answer"><b>{m.found[0].source} {m.found[0].no}({m.found[0].title})</b>에 따르면, {coreSentence(m.found[0])}
                {m.found[1] && <> 관련 기준은 {m.found[1].no}({m.found[1].title})에서도 확인할 수 있습니다.</>}</p>
              {m.found.map(a => (
                <details key={a.source + a.no} className="wa-article" open={a === m.found[0]}>
                  <summary>{a.source} · {a.no}({a.title})</summary>
                  <p><Highlight text={a.body} words={m.ws} /></p>
                  <CopyButton text={`[${a.source} ${a.no}(${a.title})]\n${a.body}`} label="조항 복사" />
                </details>
              ))}
            </>
          )}
        </section>
      ))}

      {last && last.found.length > 0 && <AiRefine appId="rules-chatbot" label="지후 AI로 쉽게 풀어 설명" note="찾은 조항만 근거로 질문에 맞춰 쉬운 문장으로 설명합니다. 조항에 없는 내용은 만들지 않습니다." prompt={aiPrompt} />}
    </>
  )
}
