import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, TextArea, ResultDoc, AiRefine, Notice } from './kit.jsx'

/* 강의개선·CQI 계획서 도우미
   강의평가 항목 점수, 서술 의견, 학습목표 달성도를 넣으면 강점·약점을 나누고,
   주제별로 개선 과제·실행 시기·확인 지표가 있는 계획 표와 보고서 문장을 만듭니다.
   의견 분류는 낱말 규칙이라 틀릴 수 있으니 표에서 확인하세요. */

// [주제, 찾는 낱말, 개선 과제, 확인 지표]
const THEMES = [
  ['설명·속도', /설명|속도|빠르|빨리|이해|어렵|어려|난이도|따라가/, '핵심 개념마다 예시와 확인 질문을 넣고, 어려운 차시는 진도를 나눠 운영함', '해당 차시 형성평가 정답률, 강의평가 "이해" 문항'],
  ['과제·평가', /과제|시험|평가|채점|성적|기준|공정|퀴즈/, '평가 기준(루브릭)을 학기 초에 공개하고, 과제 분량과 마감을 주차별로 고르게 배치함', '과제 제출률, 강의평가 "평가 공정성" 문항'],
  ['자료', /자료|ppt|피피티|교재|슬라이드|유인물|영상|녹화/i, '수업 자료를 수업 전에 올리고, 실습 시연 영상을 함께 제공함', '자료 열람률(LMS), 서술 의견 중 자료 관련 부정 의견 수'],
  ['피드백·소통', /피드백|질문|소통|답변|상담|친절|면담/, '과제마다 개별 피드백을 1주 안에 돌려주고, 질문 창구(게시판·오피스아워)를 운영함', '피드백 회신 기간, 강의평가 "소통" 문항'],
  ['실습·현장', /실습|실기|현장|체험|장비|기구|임상/, '실습 조를 작게 나누고, 장비별 체크리스트와 시범 순서를 정해 운영함', '실습 수행평가 점수, 1인당 실습 시간'],
  ['시간 운영', /시간|늦|일찍|지각|연장|쉬는|분량|많/, '차시별 시간 배분표를 쓰고, 수업 종료 5분 전 요약으로 마무리함', '정시 종료 비율, 서술 의견 중 시간 관련 의견 수'],
]
const NEG = /어렵|어려|빠르|빨리|많|부족|불편|아쉽|힘들|헷갈|모르|없|늦|별로|싫|개선|바랍|했으면|좋겠/
const POS = /좋|감사|유익|재밌|재미|도움|최고|친절|만족|알기\s?쉽|쉽게/

const SAMPLES = [
  { course: '운동처방론', term: '2026-2학기', scores: '수업 준비\t4.6\t4.3\n설명의 명확성\t3.9\t4.2\n평가의 공정성\t4.1\t4.1\n소통과 피드백\t4.5\t4.2\n수업 만족도\t4.2\t4.2', comments: '실습이 많아서 좋았어요\n설명이 빨라서 따라가기 어려웠습니다\n과제 기준을 미리 알려주시면 좋겠어요\n질문에 친절하게 답해 주셔서 감사합니다\nPPT를 수업 전에 올려 주셨으면 좋겠습니다\n장비가 부족해서 기다리는 시간이 길었어요', goals: '운동 처방 원리를 설명할 수 있다\t82\n체력 평가를 수행할 수 있다\t71\n대상자 맞춤 프로그램을 설계할 수 있다\t64' },
  { course: '스포츠마사지', term: '2026-2학기', scores: '수업 준비\t4.4\t4.3\n설명의 명확성\t4.5\t4.2\n평가의 공정성\t3.8\t4.1\n소통과 피드백\t4.0\t4.2', comments: '실기 시범이 자세해서 좋았습니다\n실기 시험 채점 기준이 헷갈렸어요\n수업 시간이 자주 늦게 끝났습니다\n재밌고 유익했어요', goals: '부위별 근육을 찾을 수 있다\t88\n기본 수기법을 수행할 수 있다\t76' },
]

const rows = t => t.trim().split(/\r?\n/).filter(Boolean).map(l => l.split(/\t|,/).map(x => x.trim()))

export default function LectureCqi({ app }) {
  const [course, setCourse] = useState('')
  const [term, setTerm] = useState('')
  const [scores, setScores] = useState('')
  const [comments, setComments] = useState('')
  const [goals, setGoals] = useState('')
  const [target, setTarget] = useState('70')
  const [made, setMade] = useState(false)
  const [si, setSi] = useState(-1)

  function sample() {
    let i = (si + 1) % SAMPLES.length; setSi(i)
    const x = SAMPLES[i]; setCourse(x.course); setTerm(x.term); setScores(x.scores); setComments(x.comments); setGoals(x.goals); setMade(false)
  }

  const res = useMemo(() => {
    const sc = rows(scores).filter(r => r[0] && !isNaN(parseFloat(r[1]))).map(r => ({ item: r[0], me: parseFloat(r[1]), ref: r[2] != null && r[2] !== '' ? parseFloat(r[2]) : null }))
    const strong = sc.filter(s => s.ref != null && s.me - s.ref >= 0.2)
    const weak = sc.filter(s => s.ref != null && s.ref - s.me >= 0.2)
    const cm = comments.split(/\r?\n/).map(x => x.trim()).filter(Boolean).map(c => {
      const neg = NEG.test(c) && !/좋았|감사/.test(c)
      const tone = neg ? '보완' : POS.test(c) ? '긍정' : '기타'
      const theme = THEMES.find(([, re]) => re.test(c))?.[0] || '기타'
      return { c, tone, theme }
    })
    const byTheme = THEMES.map(([t, , act, kpi]) => ({ t, act, kpi, neg: cm.filter(x => x.theme === t && x.tone === '보완'), pos: cm.filter(x => x.theme === t && x.tone === '긍정') }))
    // 점수가 낮은 문항도 주제로 연결합니다
    for (const w of weak) { const th = THEMES.find(([, re]) => re.test(w.item)); const b = th && byTheme.find(x => x.t === th[0]); if (b && !b.neg.length) b.neg.push({ c: `강의평가 "${w.item}" ${w.me}점(비교 ${w.ref}점)`, tone: '보완', theme: b.t }) }
    const plan = byTheme.filter(b => b.neg.length).sort((a, b) => b.neg.length - a.neg.length)
    const gl = rows(goals).filter(r => r[0] && !isNaN(parseFloat(r[1]))).map(r => ({ g: r[0], v: parseFloat(r[1]) }))
    const low = gl.filter(g => g.v < Number(target))
    return { sc, strong, weak, cm, byTheme, plan, gl, low }
  }, [scores, comments, goals, target])

  const report = !made ? '' : [
    `[${course || '교과목'} ${term || ''} 강의 개선(CQI) 계획]`,
    '',
    '1. 강의 운영 결과 분석',
    res.sc.length ? `· 강의평가 ${res.sc.length}개 문항 중 비교 기준보다 0.2점 이상 높은 문항은 ${res.strong.map(s => `${s.item}(${s.me})`).join(', ') || '없음'}, 0.2점 이상 낮은 문항은 ${res.weak.map(s => `${s.item}(${s.me})`).join(', ') || '없음'}으로 나타남.` : '· 강의평가 점수 [입력 필요]',
    res.cm.length ? `· 서술 의견 ${res.cm.length}건 중 긍정 ${res.cm.filter(x => x.tone === '긍정').length}건, 보완 요청 ${res.cm.filter(x => x.tone === '보완').length}건이며, 보완 요청은 ${res.plan.map(p => `${p.t}(${p.neg.length}건)`).join(', ') || '특정 주제에 몰리지 않음'}로 나타남.` : '· 서술 의견 [입력 필요]',
    res.gl.length ? `· 학습목표 달성도는 ${res.gl.map(g => `「${g.g}」 ${g.v}%`).join(', ')}이며, 기준(${target}%)에 미달한 목표는 ${res.low.map(g => `「${g.g}」`).join(', ') || '없음'}임.` : '· 학습목표 달성도 [입력 필요]',
    '',
    '2. 강점',
    ...(res.strong.length || res.byTheme.some(b => b.pos.length) ? [...res.strong.map(s => `· ${s.item}: ${s.me}점(비교 ${s.ref}점)`), ...res.byTheme.filter(b => b.pos.length).map(b => `· ${b.t}: 긍정 의견 ${b.pos.length}건`)] : ['· [강점 입력]']),
    '',
    '3. 개선 과제와 실행 계획',
    ...(res.plan.length ? res.plan.map((p, i) => `${i + 1}) ${p.t}\n   근거: ${p.neg.slice(0, 2).map(x => `"${x.c}"`).join(', ')}\n   개선: ${p.act}\n   시기: 다음 학기 [주차]\n   확인 지표: ${p.kpi}`) : ['· 보완 요청이 특정 주제에 모이지 않음. 현 운영 유지']),
    ...(res.low.length ? [`${res.plan.length + 1}) 학습목표 달성도 보완\n   근거: ${res.low.map(g => `「${g.g}」 ${g.v}%`).join(', ')}\n   개선: 해당 목표 차시에 형성평가와 보충 실습을 추가함\n   시기: 다음 학기 [주차]\n   확인 지표: 해당 목표 달성도 ${target}% 이상`] : []),
    '',
    '4. 환류',
    '· 다음 학기 중간 시점에 개선 과제 이행 여부를 점검하고, 학기 말 강의평가와 달성도로 효과를 확인함.',
  ].join('\n')
  const aiPrompt = !made ? '' : `역할: 대학 교수학습지원센터의 CQI 컨설턴트입니다.\n지킬 것: 아래 점수·건수·달성도는 바꾸지 않기, 새 수치 만들지 않기, 개조식(~함, ~임), [ ] 칸은 그대로.\n출력: ① 다듬은 CQI 계획 ② 개선 과제별로 실제 수업에서 바로 쓸 활동 예시 1개씩 ③ 학생에게 공지할 "지난 학기 의견을 이렇게 반영합니다" 3줄\n\n${report}\n\n[서술 의견 원문]\n${comments}`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">입력한 내용은 저장하지 않습니다. 서술 의견에 학생 이름이 있으면 지우고 넣으세요.</span>
      </AppHeader>
      <section className="card">
        <div className="grid">
          <Field id="cq-c" label="교과목"><TextInput id="cq-c" value={course} onChange={setCourse} placeholder="예: 운동처방론" /></Field>
          <Field id="cq-t" label="학기"><TextInput id="cq-t" value={term} onChange={setTerm} placeholder="예: 2026-2학기" /></Field>
        </div>
        <Field id="cq-s" label="강의평가 문항별 점수" hint="한 줄에: 문항, 내 점수, 비교 점수(학과 평균 등). 엑셀에서 복사 가능">
          <TextArea id="cq-s" rows={5} value={scores} onChange={setScores} placeholder={'설명의 명확성\t3.9\t4.2\n소통과 피드백\t4.5\t4.2'} />
        </Field>
        <Field id="cq-m" label="서술 의견" hint="한 줄에 의견 하나">
          <TextArea id="cq-m" rows={5} value={comments} onChange={setComments} />
        </Field>
        <div className="grid">
          <Field id="cq-g" label="학습목표 달성도(선택)" hint="한 줄에: 학습목표, 달성률(%)"><TextArea id="cq-g" rows={3} value={goals} onChange={setGoals} /></Field>
          <Field id="cq-x" label="달성 기준(%)"><TextInput id="cq-x" inputMode="numeric" value={target} onChange={setTarget} /></Field>
        </div>
        <div className="row">
          <button type="button" className="btn primary" onClick={() => setMade(true)}>CQI 계획 만들기</button>
          <button type="button" className="btn" onClick={sample}>예시 채우기</button>
          <span className="small muted">예시는 가상 점수와 의견입니다.</span>
        </div>
      </section>
      {made && (
        <>
          {res.cm.length > 0 && (
            <section className="card">
              <div className="card-head"><h2>의견 분류</h2><span className="muted small">낱말 규칙으로 나눈 결과입니다. 잘못 나뉜 의견은 계획서에서 고쳐 주세요.</span></div>
              <ul className="list">{res.cm.map(x => <li key={x.c}><span>{x.c}</span><span><span className="badge">{x.theme}</span> <span className={`badge ${x.tone === '긍정' ? 'green' : x.tone === '보완' ? 'amber' : ''}`}>{x.tone}</span></span></li>)}</ul>
            </section>
          )}
          {!res.sc.some(s => s.ref != null) && res.sc.length > 0 && <Notice>비교 점수가 없어 강점·약점 문항을 나누지 못했습니다. 학과 평균 등을 셋째 칸에 넣어 주세요.</Notice>}
          <ResultDoc title="강의 개선(CQI) 계획" text={report} fileName={`${course || '교과목'}_CQI계획.txt`} />
          <AiRefine appId="lecture-cqi" label="지후 AI로 수업 활동 예시 받기" note="수치는 바꾸지 않고, 개선 과제마다 바로 쓸 수업 활동과 학생 공지 문구를 만듭니다." prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
