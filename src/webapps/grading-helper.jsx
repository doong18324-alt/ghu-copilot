import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, TextArea, ChipGroup, ResultDoc, AiRefine, Notice } from './kit.jsx'
import { useStored } from '../lib/store.js'
import { josa } from '../lib/korean.js'

/* 평가 도우미: 루브릭 → 채점표 → 학생별 피드백
   1) 평가 영역과 기준을 적으면 수준별 기술이 있는 분석적 루브릭을 만들고,
   2) 학생 번호가 들어간 채점표(CSV)를 내려받아 채운 뒤 다시 붙여 넣으면,
   3) 영역별 점수에 근거한 피드백(잘한 점 → 보완점 → 다음 할 일)을 한꺼번에 만듭니다.
   루브릭만 이 브라우저에 저장하고, 점수표는 저장하지 않습니다. */

const LEVELS = [['A', '매우 우수', 1], ['B', '우수', 0.8], ['C', '보통', 0.6], ['D', '미흡', 0.4]]
const DESC = {
  A: c => `${josa(c, '을/를')} 모두 갖추고, 근거나 예를 구체적으로 들어 설명함`,
  B: c => `${josa(c, '을/를')} 대부분 갖추었으나, 근거나 예가 한두 군데 부족함`,
  C: c => `${josa(c, '을/를')} 일부만 갖추고, 설명이 일반적인 수준에 머묾`,
  D: c => `${josa(c, '이/가')} 거의 드러나지 않거나 사실 오류가 있음`,
}

const PRESETS = [
  { task: '만성질환 관리 프로그램 기획서', areas: [['현황 분석', 5, '대상 집단의 건강 문제를 자료로 제시'], ['중재 계획', 6, '목표에 맞는 중재와 실행 일정'], ['근거', 5, '중재를 뒷받침하는 문헌·지침 인용'], ['전달력', 4, '읽기 쉬운 구성과 정확한 용어']] },
  { task: '임상실습 사례 발표', areas: [['사례 요약', 4, '대상자 정보(익명)와 주요 문제 정리'], ['평가·분석', 6, '평가 결과를 근거로 문제 우선순위 판단'], ['중재와 근거', 6, '중재 선택 이유와 근거 제시'], ['발표·질의응답', 4, '시간 준수와 질문에 대한 정확한 답']] },
  { task: '운동 프로그램 지도 실기', areas: [['사전 평가', 5, '참여자 안전 확인과 체력 평가 실시'], ['운동 설명', 5, '목적·방법·주의점을 쉬운 말로 설명'], ['동작 지도', 6, '시범과 자세 교정을 정확히 수행'], ['안전 관리', 4, '이상 증상 확인과 강도 조절']] },
]

function rubricText(task, areas) {
  const total = areas.reduce((s, a) => s + Number(a[1] || 0), 0)
  return [
    `[분석적 루브릭] ${task || '과제명'} (총 ${total}점)`,
    '',
    ...areas.flatMap(([name, pts, crit]) => [
      `■ ${name} (${pts}점) 기준: ${crit}`,
      ...LEVELS.map(([k, ln, w]) => `  ${ln} ${Math.round(pts * w * 10) / 10}점: ${DESC[k](crit)}`),
    ]),
    '',
    '[공통 감점]',
    '· AI 도구를 쓰고 사용 사실을 밝히지 않은 경우: [감점 기준]',
    '· 출처 없이 남의 글을 옮긴 경우: [감점 기준]',
    '· 제출 기한을 넘긴 경우: [감점 기준]',
  ].join('\n')
}

const parse = t => t.trim().split(/\r?\n/).filter(Boolean).map(l => l.split(/\t|,/).map(x => x.trim().replace(/^"|"$/g, '')))

function feedbackFor(row, areas) {
  const scores = areas.map(([name, pts, crit], i) => ({ name, pts: Number(pts), crit, s: Number(row.scores[i]) || 0 }))
  const rate = x => (x.pts ? x.s / x.pts : 0)
  const best = [...scores].sort((a, b) => rate(b) - rate(a))[0]
  const worst = [...scores].sort((a, b) => rate(a) - rate(b))[0]
  const total = scores.reduce((s, x) => s + x.s, 0)
  const lvl = x => LEVELS.find(([, , w]) => rate(x) >= w - 0.1)?.[1] || '미흡'
  const lines = [
    `${best.name}에서 ${lvl(best)} 수준을 보였습니다(${best.s}/${best.pts}점). 특히 ${josa(best.crit, '이/가')} 잘 드러났습니다.`,
    worst.name !== best.name && rate(worst) < 0.9
      ? `${worst.name}(${worst.s}/${worst.pts}점)은 보완이 필요합니다. 다음에는 ${josa(worst.crit, '을/를')} 근거와 함께 분명히 보여 주는 것을 목표로 해 보세요.`
      : '모든 영역이 고르게 높습니다. 지금의 근거 제시 방식을 다음 과제에서도 유지해 주세요.',
    row.memo ? `교수 메모: ${row.memo}` : '',
    '예비 보건의료인으로서 한 걸음씩 성장하고 있습니다. 궁금한 점은 상담 시간에 물어 주세요.',
  ].filter(Boolean)
  return { total, text: lines.join(' ') }
}

export default function GradingHelper({ app }) {
  const [rb, setRb] = useStored('webapps:grading-rubric', { task: '', areas: [['', 5, '']] })
  const [ids, setIds] = useState('')
  const [scoresText, setScoresText] = useState('')
  const [step, setStep] = useState('rubric')
  const [pi, setPi] = useState(-1)
  const areas = rb.areas.filter(a => a[0].trim())
  const setArea = (i, j, v) => setRb({ ...rb, areas: rb.areas.map((a, k) => (k === i ? a.map((x, m) => (m === j ? v : x)) : a)) })
  const total = areas.reduce((s, a) => s + Number(a[1] || 0), 0)

  function preset() {
    let i = (pi + 1) % PRESETS.length; setPi(i)
    setRb({ task: PRESETS[i].task, areas: PRESETS[i].areas.map(a => [...a]) })
  }
  function downloadSheet() {
    const list = ids.split(/[,\s]+/).filter(Boolean)
    const rows = [['번호', ...areas.map(a => `${a[0]}(${a[1]})`), '메모'], ...(list.length ? list : Array.from({ length: 30 }, (_, i) => String(i + 1))).map(x => [x, ...areas.map(() => ''), ''])]
    const out = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + out], { type: 'text/csv;charset=utf-8' })); a.download = `${rb.task || '과제'}_채점표.csv`; a.click()
  }
  function sampleScores() {
    let seed = 3; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
    const rows = [['번호', ...areas.map(a => a[0]), '메모']]
    const memos = ['', '그림 출처 표기 누락', '', '발표 시간 2분 초과', '', '참고문헌 형식 통일 필요']
    for (let s = 1; s <= 6; s++) rows.push([String(s), ...areas.map(a => String(Math.round(Number(a[1]) * (0.45 + rnd() * 0.55)))), memos[s - 1]])
    setScoresText(rows.map(r => r.join('\t')).join('\n'))
  }

  const graded = useMemo(() => {
    const rows = parse(scoresText)
    if (!rows.length) return []
    const body = /[가-힣A-Za-z]/.test(rows[0].slice(1).join('')) && isNaN(Number(rows[0][1])) ? rows.slice(1) : rows
    return body.map(r => ({ id: r[0], scores: r.slice(1, 1 + areas.length), memo: r[1 + areas.length] || '' })).map(r => ({ ...r, ...feedbackFor(r, areas) }))
  }, [scoresText, areas])
  const over = graded.filter(g => g.scores.some((s, i) => Number(s) > Number(areas[i]?.[1])))
  const fbText = graded.map(g => `[${g.id}] ${g.total}/${total}점\n${g.text}`).join('\n\n')
  const avg = areas.map((a, i) => ({ name: a[0], pts: a[1], m: graded.length ? graded.reduce((s, g) => s + (Number(g.scores[i]) || 0), 0) / graded.length : 0 }))
  function downloadFb() {
    const out = [['번호', '총점', '피드백'], ...graded.map(g => [g.id, g.total, g.text])].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + out], { type: 'text/csv;charset=utf-8' })); a.download = `${rb.task || '과제'}_피드백.csv`; a.click()
  }
  const rubric = rubricText(rb.task, areas)
  const aiPrompt = `역할: 대학 교육평가 전문가입니다.\n지킬 것: 영역과 배점은 그대로, 수준별 기술을 관찰 가능한 행동(무엇을 몇 개, 어떻게)으로 바꾸기, "잘함·충실함" 같은 추상어 쓰지 않기.\n출력: 영역마다 4수준 기술을 고친 표, 채점자끼리 판단이 갈릴 만한 칸 3개와 보완 문장\n\n${rubric}`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">루브릭만 이 브라우저에 저장합니다. 점수표는 저장하지 않으며, 학생 이름 대신 번호를 쓰세요.</span>
      </AppHeader>
      <section className="card">
        <ChipGroup label="단계" options={[['rubric', '1. 루브릭 만들기'], ['sheet', '2. 채점표 내려받기'], ['fb', '3. 점수로 피드백 만들기']]} value={step} onChange={setStep} />
      </section>

      {step === 'rubric' && (
        <section className="card">
          <Field id="gh-t" label="과제명"><TextInput id="gh-t" value={rb.task} onChange={v => setRb({ ...rb, task: v })} placeholder="예: 만성질환 관리 프로그램 기획서" /></Field>
          {rb.areas.map((a, i) => (
            <div key={i} className="grid" style={{ gridTemplateColumns: '1.2fr .5fr 2fr auto', alignItems: 'end' }}>
              <Field id={`gh-n${i}`} label={i ? '' : '평가 영역'}><TextInput id={`gh-n${i}`} value={a[0]} onChange={v => setArea(i, 0, v)} placeholder="예: 근거" /></Field>
              <Field id={`gh-p${i}`} label={i ? '' : '배점'}><TextInput id={`gh-p${i}`} inputMode="numeric" value={String(a[1])} onChange={v => setArea(i, 1, v.replace(/[^\d.]/g, ''))} /></Field>
              <Field id={`gh-c${i}`} label={i ? '' : '이 영역에서 볼 것(관찰 가능한 기준)'}><TextInput id={`gh-c${i}`} value={a[2]} onChange={v => setArea(i, 2, v)} placeholder="예: 중재를 뒷받침하는 문헌 인용" /></Field>
              <button type="button" className="btn" aria-label={`${a[0] || '영역'} 삭제`} onClick={() => setRb({ ...rb, areas: rb.areas.filter((_, k) => k !== i) })}>삭제</button>
            </div>
          ))}
          <div className="row">
            <button type="button" className="btn" onClick={() => setRb({ ...rb, areas: [...rb.areas, ['', 5, '']] })}>영역 추가</button>
            <button type="button" className="btn" onClick={preset}>예시 루브릭 채우기</button>
            <span className="small muted">총 {total}점</span>
          </div>
          {areas.length > 0 && <ResultDoc title="루브릭" text={rubric} fileName={`${rb.task || '과제'}_루브릭.txt`} />}
          {areas.length > 0 && <AiRefine appId="grading-helper" label="지후 AI로 수준별 기술 다듬기" note="영역과 배점은 그대로 두고, 수준별 기술을 관찰 가능한 행동으로 바꿉니다." prompt={aiPrompt} />}
        </section>
      )}

      {step === 'sheet' && (
        <section className="card">
          {!areas.length && <Notice tone="bad">1단계에서 평가 영역을 먼저 정해 주세요.</Notice>}
          <Field id="gh-i" label="학생 번호 목록(선택)" hint="쉼표나 줄바꿈으로. 비우면 1~30번으로 만듭니다."><TextArea id="gh-i" rows={3} value={ids} onChange={setIds} placeholder="예: 1, 2, 3 …" /></Field>
          <div className="row"><button type="button" className="btn primary" disabled={!areas.length} onClick={downloadSheet}>채점표 CSV 내려받기</button><span className="small muted">엑셀에서 열어 점수와 메모를 채운 뒤 3단계에 붙여 넣으세요.</span></div>
        </section>
      )}

      {step === 'fb' && (
        <>
          <section className="card">
            {!areas.length && <Notice tone="bad">1단계에서 평가 영역을 먼저 정해 주세요.</Notice>}
            <Field id="gh-s" label="채운 채점표" hint={`열 순서: 번호, ${areas.map(a => a[0]).join(', ')}, 메모`}><TextArea id="gh-s" rows={7} value={scoresText} onChange={setScoresText} /></Field>
            <div className="row"><button type="button" className="btn" disabled={!areas.length} onClick={sampleScores}>예시 점수 넣기</button><span className="small muted">가상 학생 6명의 점수입니다.</span></div>
          </section>
          {graded.length > 0 && (
            <>
              {over.length > 0 && <Notice tone="bad">배점보다 큰 점수가 있습니다: {over.map(g => g.id).join(', ')}번. 채점표를 확인하세요.</Notice>}
              <section className="card">
                <div className="card-head"><h2>영역별 평균</h2><span className="muted small">{graded.length}명</span></div>
                <div className="grid">{avg.map(a => <div key={a.name} className="tile"><b>{a.name}</b><span>{a.m.toFixed(1)} / {a.pts}</span></div>)}</div>
              </section>
              <ResultDoc title="학생별 피드백" text={fbText} fileName={`${rb.task || '과제'}_피드백.txt`} extra={<button type="button" className="btn" onClick={downloadFb}>CSV로 내려받기</button>} />
            </>
          )}
        </>
      )}
    </>
  )
}
