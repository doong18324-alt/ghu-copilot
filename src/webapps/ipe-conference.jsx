import { useMemo, useState } from 'react'
import { AppHeader, Notice, ChipGroup, TextArea, ResultDoc, AiRefine } from './kit.jsx'
import { CASES, ROUNDS, ROLE_NAMES } from './ipe-cases.js'

/* 다학제 케이스 컨퍼런스
   가상 사례 회의에서 학생은 한 직종 자리에 앉고, 나머지 직종은 미리 준비된 발언으로 참여합니다.
   세 라운드(사정 소견, 우선 문제와 목표, 중재와 협력 요청) 동안 학생이 발언하면
   그 직종이 짚어야 할 핵심 항목을 얼마나 다뤘는지 보여 주고, 다른 직종의 질문을 받습니다.
   마지막에 모든 직종의 발언을 묶은 통합 돌봄 계획을 만듭니다. AI 없이 동작하며,
   교내 AI가 연결되면 발언 피드백을 더 자세히 받을 수 있습니다. */

export default function IpeConference({ app }) {
  const [caseId, setCaseId] = useState(CASES[0].id)
  const [role, setRole] = useState('')
  const [round, setRound] = useState(0)
  const [drafts, setDrafts] = useState(['', '', ''])
  const [said, setSaid] = useState([]) // 발언을 마친 라운드 번호
  const [answers, setAnswers] = useState(['', '', ''])
  const c = CASES.find(x => x.id === caseId)
  const roles = Object.keys(c.roles)
  const others = roles.filter(r => r !== role)
  const done = said.length === 3

  function pickCase(id) { setCaseId(id); setRole(''); reset() }
  function reset() { setRound(0); setDrafts(['', '', '']); setSaid([]); setAnswers(['', '', '']) }

  const check = (i, text) => c.roles[role][i].points.map(([name, re]) => [name, re.test(text)])
  const setDraft = (i, v) => setDrafts(d => d.map((x, k) => (k === i ? v : x)))
  const setAnswer = (i, v) => setAnswers(d => d.map((x, k) => (k === i ? v : x)))

  const score = useMemo(() => {
    if (!role) return null
    let hit = 0, all = 0
    said.forEach(i => check(i, drafts[i]).forEach(([, ok]) => { all++; if (ok) hit++ }))
    return { hit, all }
  }, [said, drafts, role, caseId])

  const plan = useMemo(() => {
    if (!done) return ''
    const lines = [`[다학제 통합 돌봄 계획] ${c.title}`, '', `대상자: ${c.brief}`, ...c.detail.map(d => `- ${d}`), '']
    ROUNDS.forEach(([name], i) => {
      lines.push(`■ ${i + 1}. ${name}`)
      roles.forEach(r => lines.push(`- ${ROLE_NAMES[r]}${r === role ? '(나)' : ''}: ${r === role ? drafts[i].trim() : c.roles[r][i].say}`))
      lines.push('')
    })
    lines.push('■ 내가 받은 질문과 답')
    ROUNDS.forEach((_, i) => { const [who, q] = c.roles[role][i].ask; lines.push(`- ${ROLE_NAMES[who]}: ${q}`, `  → ${answers[i].trim() || '(답하지 않음)'}`) })
    lines.push('', '※ 교육용 가상 사례입니다. 수치와 기준은 교재와 최신 지침으로 확인합니다.')
    return lines.join('\n')
  }, [done, drafts, answers, role, caseId])

  const aiPrompt = done ? `다학제 케이스 컨퍼런스 연습입니다. 사례: ${c.title}. ${c.brief} ${c.detail.join(' ')}\n학생은 ${ROLE_NAMES[role]} 역할로 다음과 같이 발언했습니다.\n${ROUNDS.map(([n], i) => `${i + 1}. ${n}: ${drafts[i]}`).join('\n')}\n이 발언을 ${ROLE_NAMES[role]}의 전문성, 다른 직종과의 협력, 대상자 중심성 관점에서 평가하고, 잘한 점 2가지와 보완할 점 3가지를 구체적으로 알려 주세요. 의학적 수치는 지침 확인이 필요하다고 표시해 주세요.` : ''

  return (
    <div className="stack" style={{ gap: 16 }}>
      <AppHeader app={app} />
      <Notice tone="ok">모든 사례는 교육용 가상 사례입니다. 실제 실습 대상자 정보는 입력하지 마세요. 핵심 항목 표시는 발언에 들어간 낱말로 확인하는 연습용 기준이며, 최종 평가는 지도교수가 합니다.</Notice>

      <section className="card stack" style={{ gap: 12 }}>
        <ChipGroup label="1. 사례 고르기" options={CASES.map(x => [x.id, x.title, x.tag])} value={caseId} onChange={pickCase} />
        <div className="stack" style={{ gap: 6 }}>
          <b>{c.brief}</b>
          {c.detail.map(d => <span key={d} style={{ lineHeight: 1.7 }}>· {d}</span>)}
        </div>
        <ChipGroup label="2. 내가 맡을 직종" options={roles.map(r => [r, ROLE_NAMES[r]])} value={role} onChange={r => { setRole(r); reset() }} />
        {role && <p className="muted small" style={{ margin: 0 }}>참석: {roles.map(r => ROLE_NAMES[r] + (r === role ? '(나)' : '')).join(', ')} · 사회: 지도교수</p>}
      </section>

      {role && ROUNDS.map(([name, guide], i) => (i <= round || said.includes(i)) && (
        <section key={i} className="card stack" style={{ gap: 12 }}>
          <div className="card-head"><h2>{i + 1}라운드 · {name}</h2>{said.includes(i) && <span className="badge green">발언 완료</span>}</div>
          <p style={{ margin: 0, lineHeight: 1.7 }}><b>사회(지도교수):</b> {guide}</p>
          {others.map(r => (
            <div key={r} style={{ background: 'var(--fill)', borderRadius: 14, padding: '12px 14px', lineHeight: 1.75 }}>
              <b>{ROLE_NAMES[r]}</b>
              <div>{c.roles[r][i].say}</div>
            </div>
          ))}
          <TextArea id={`say-${i}`} value={drafts[i]} onChange={v => setDraft(i, v)} rows={4} placeholder={`${ROLE_NAMES[role]}로서 발언을 적어 주세요. 다른 직종의 소견을 이어받아 말하면 좋습니다.`} />
          {!said.includes(i)
            ? <div><button type="button" className="btn primary" disabled={drafts[i].trim().length < 20} onClick={() => { setSaid(s => [...s, i]); setRound(r => Math.max(r, i + 1)) }}>발언하기</button>{drafts[i].trim().length < 20 && <span className="muted small" style={{ marginLeft: 10 }}>20자 이상 적어 주세요.</span>}</div>
            : (
              <div className="stack" style={{ gap: 10 }}>
                <div className="stack" style={{ gap: 6 }}>
                  <b className="small">{ROLE_NAMES[role]}가 이 라운드에 짚을 핵심 항목</b>
                  <div className="wa-chips">
                    {check(i, drafts[i]).map(([n, ok]) => <span key={n} className={`badge ${ok ? 'green' : ''}`}>{ok ? '✓ ' : '· '}{n}</span>)}
                  </div>
                </div>
                <details>
                  <summary className="small" style={{ cursor: 'pointer' }}>같은 직종의 모범 발언 보기</summary>
                  <p style={{ margin: '8px 0 0', lineHeight: 1.75, background: 'var(--blue-soft)', borderRadius: 12, padding: '10px 12px' }}>{c.roles[role][i].say}</p>
                </details>
                <div style={{ borderLeft: '4px solid var(--blue)', paddingLeft: 12 }}>
                  <b>{ROLE_NAMES[c.roles[role][i].ask[0]]}의 질문</b>
                  <p style={{ margin: '4px 0 8px', lineHeight: 1.7 }}>{c.roles[role][i].ask[1]}</p>
                  <TextArea id={`ans-${i}`} value={answers[i]} onChange={v => setAnswer(i, v)} rows={2} placeholder="답해 보세요(선택)" />
                </div>
              </div>
            )}
        </section>
      ))}

      {role && done && (
        <>
          <section className="card stack" style={{ gap: 8 }}>
            <div className="card-head"><h2>회의를 마치며</h2><span className="badge">핵심 항목 {score.hit}/{score.all}</span></div>
            <p style={{ margin: 0, lineHeight: 1.7 }}>
              {score.hit / score.all >= 0.75 ? '직종의 핵심 관점을 대부분 짚었습니다. 다른 직종의 질문에 근거를 들어 답했는지도 확인해 보세요.'
                : score.hit / score.all >= 0.5 ? '절반 이상을 짚었습니다. 빠진 항목을 모범 발언과 비교해 보고, 다른 직종에 무엇을 요청했는지 다시 살펴보세요.'
                  : '빠진 항목이 많습니다. 모범 발언을 읽고 같은 라운드를 다시 적어 보세요. 측정한 것과 대상자가 말한 것을 나눠 말하면 도움이 됩니다.'}
            </p>
            <button type="button" className="btn soft" style={{ alignSelf: 'flex-start' }} onClick={reset}>같은 역할로 다시 하기</button>
          </section>
          <ResultDoc title="통합 돌봄 계획" text={plan} fileName={`다학제_${c.title}.txt`} />
          <AiRefine appId={app.id} prompt={aiPrompt} label="지후 AI에게 발언 피드백 받기" note="내 세 번의 발언을 직종 전문성, 협력, 대상자 중심성 관점에서 평가받습니다." />
        </>
      )}
    </div>
  )
}
