import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, TextArea, ResultDoc, AiRefine, Notice } from './kit.jsx'
import { useStored, uid } from '../lib/store.js'
import { detect, applyMap } from '../lib/pseudo.js'
import { RESUME_KEY } from '../pages/shared.jsx'

/* 임상실습 성찰일지 코치 (Gibbs 성찰 단계)
   단계별 질문에 답하면 일지 초안을 만들고, 환자·보호자·직원을 알아볼 수 있는 정보는 자동으로 가립니다.
   적지 않은 느낌이나 행동은 만들지 않고 [ ]로 남깁니다. 다 쓴 실습은 이력서 「활동·경험」에 넣을 수 있습니다. */

const STEPS = [
  ['desc', '1. 무슨 일이 있었나요', '언제, 어디서, 누가(익명), 무엇을 했는지 사실만 적어 보세요.', '예: 오전 외래에서 80대 환자의 보행 평가를 지도 치료사와 함께 진행했다.'],
  ['feel', '2. 그때 어떤 느낌이었나요', '처음, 중간, 끝났을 때의 느낌과 생각을 솔직하게.', '예: 환자가 넘어질까 봐 긴장했고, 평가 순서가 헷갈려 당황했다.'],
  ['eval', '3. 좋았던 점과 아쉬웠던 점', '잘 된 것 하나, 잘 안 된 것 하나.', '예: 환자에게 설명은 천천히 잘 했지만, 보호 위치를 늦게 잡았다.'],
  ['anal', '4. 왜 그랬을까요', '수업에서 배운 이론, 지침과 연결해 이유를 찾아보세요.', '예: 낙상 위험 평가를 먼저 하지 않아 보호 위치를 미리 정하지 못했다(노인 낙상 예방 지침).'],
  ['concl', '5. 무엇을 배웠나요', '이번 경험에서 얻은 결론 한두 가지.', '예: 평가 전에 위험도를 먼저 확인하면 보호 위치를 미리 잡을 수 있다.'],
  ['plan', '6. 다음에는 어떻게 할까요', '다음 실습에서 구체적으로 할 행동.', '예: 다음 보행 평가 전에 낙상 위험 체크리스트를 먼저 확인하고, 환자 옆 뒤쪽에 선다.'],
]

const SAMPLES = [
  { dept: '재활의학과 외래(물리치료실)', date: '', a: { desc: '오전에 80대 여성 환자의 보행 평가를 지도 치료사와 함께 했다. 환자는 지팡이를 사용했다.', feel: '넘어질까 봐 긴장했고 평가 순서가 헷갈려 당황했다.', eval: '설명은 천천히 잘 했지만 보호 위치를 늦게 잡았다.', anal: '평가 전에 낙상 위험도를 먼저 확인하지 않아 보호 위치를 미리 정하지 못했다.', concl: '위험도를 먼저 보면 안전한 위치를 미리 정할 수 있다.', plan: '다음 보행 평가 전에 낙상 위험 체크리스트를 먼저 확인한다.' } },
  { dept: '내과 병동', date: '', a: { desc: '활력징후 측정 중 혈압이 평소보다 높게 나온 환자가 있어 담당 간호사에게 보고했다. 환자 이영희 님은 두통을 호소했다.', feel: '보고해야 할지 망설였다.', eval: '바로 보고한 것은 잘했지만, 보고할 때 이전 측정값을 함께 말하지 못했다.', anal: '', concl: '', plan: '' } },
  { dept: '영상의학과 일반촬영실', date: '', a: { desc: '흉부 촬영 전 환자 확인 절차를 관찰했다.', feel: '', eval: '', anal: '', concl: '', plan: '' } },
]

export default function ReflectionJournal({ app }) {
  const [dept, setDept] = useState('')
  const [date, setDate] = useState('')
  const [ans, setAns] = useState({})
  const [made, setMade] = useState(false)
  const [msg, setMsg] = useState('')
  const [si, setSi] = useState(-1)
  const [resume, setResume] = useStored(RESUME_KEY, null)

  const raw = STEPS.map(([k]) => ans[k] || '').join('\n') + '\n' + dept
  const hits = useMemo(() => detect(raw, [], []).filter(h => h.label !== '학번' || /\d{7,}/.test(h.value)), [raw])
  const pairs = hits.map(h => [h.value, h.label.startsWith('이름') ? (h.token.replace('사람', '대상자 ')) : h.token])
  const clean = t => applyMap(t, pairs)

  function sample() {
    let i = Math.floor(Math.random() * SAMPLES.length); if (i === si) i = (i + 1) % SAMPLES.length
    setSi(i); setDept(SAMPLES[i].dept); setDate(SAMPLES[i].date); setAns(SAMPLES[i].a); setMade(false); setMsg('')
  }
  const filled = STEPS.filter(([k]) => (ans[k] || '').trim()).length
  const journal = [
    `[임상실습 성찰일지] ${clean(dept) || '[실습 부서]'} · ${date || '[날짜]'}`,
    '',
    ...STEPS.flatMap(([k, title]) => [`■ ${title.replace(/^\d\.\s/, '').replace(/요$/, '')}`, clean((ans[k] || '').trim()) || `[${title.replace(/^\d\.\s/, '')}: 직접 적기]`, '']),
    '실습지도자 확인: ______________________ (서명)    날짜: __________',
  ].join('\n')
  function toResume() {
    const r = { education: [], licenses: [], activities: [], training: [], skills: [], ...(resume || {}) }
    const source = `reflect:${dept.trim()}`
    const old = r.activities.find(x => x.source === source)
    const lesson = clean((ans.concl || '').trim()).slice(0, 60)
    const item = { id: old?.id || uid(), source, title: `임상실습 (${clean(dept.trim())})`, detail: lesson ? `성찰일지 작성 | 배운 점: ${lesson}` : '성찰일지 작성', from: old?.from || date || '', to: date || old?.to || '' }
    setResume({ ...r, activities: [...r.activities.filter(x => x.source !== source), item] })
    setMsg('이력서 「활동·경험」에 넣었습니다. 같은 부서 실습은 한 줄로 합쳐집니다.')
  }
  const aiPrompt = `역할: 보건의료 계열 임상실습 지도교수입니다.\n지킬 것: 학생이 쓴 사실·느낌·행동만 다듬고 새로 만들지 않기, [ ] 칸은 그대로, 가명(대상자 A 등)은 그대로, 문어체(~했다).\n출력: ① 다듬은 성찰일지 ② 4단계(왜 그랬을까)에 연결할 만한 전공 이론·지침 이름 2개와 확인할 교재 장 ③ 다음 실습 목표를 측정 가능한 문장 1개로\n\n${journal}`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">환자·보호자·직원 이름과 번호는 자동으로 가립니다. 적은 내용은 저장하지 않습니다(이력서에 넣은 한 줄만 저장).</span>
      </AppHeader>
      <section className="card">
        <div className="grid">
          <Field id="rj-d" label="실습 부서"><TextInput id="rj-d" value={dept} onChange={setDept} placeholder="예: 재활의학과 외래" /></Field>
          <Field id="rj-t" label="날짜"><TextInput id="rj-t" type="date" value={date} onChange={setDate} /></Field>
        </div>
        {STEPS.map(([k, title, hint, ex]) => (
          <Field key={k} id={`rj-${k}`} label={title} hint={hint}>
            <TextArea id={`rj-${k}`} rows={3} value={ans[k] || ''} onChange={v => setAns({ ...ans, [k]: v })} placeholder={ex} />
          </Field>
        ))}
        {hits.length > 0 && <Notice>알아볼 수 있는 정보 {hits.length}개({hits.map(h => h.label).filter((x, i, a) => a.indexOf(x) === i).join(', ')})를 일지에서 가렸습니다.</Notice>}
        <div className="row">
          <button type="button" className="btn primary" onClick={() => setMade(true)}>성찰일지 만들기</button>
          <button type="button" className="btn" onClick={sample}>예시 채우기</button>
          <span className="small muted">{filled}/6단계 작성</span>
        </div>
      </section>
      {made && (
        <>
          {filled < 6 && <Notice>아직 적지 않은 단계 {6 - filled}곳은 [ ]로 남겼습니다. AI가 대신 채우지 않도록 직접 적어 주세요.</Notice>}
          <ResultDoc title="성찰일지 초안" text={journal} fileName={`성찰일지_${date || '날짜'}.txt`} />
          <section className="card">
            <div className="card-head"><h2>이력서에 넣기</h2></div>
            <p className="small" style={{ margin: 0 }}>이력서 「활동·경험」에 "임상실습 ({clean(dept) || '실습 부서'})" 한 줄로 들어갑니다.</p>
            <div className="row"><button type="button" className="btn" disabled={!dept.trim()} onClick={toResume}>이력서에 넣기</button>{msg && <span className="small muted" role="status">{msg}</span>}</div>
          </section>
          <AiRefine appId="reflection-journal" label="지후 AI로 문장 다듬고 이론 연결받기" note="쓴 내용만 다듬고, 4단계에 연결할 이론 이름과 확인할 교재 장을 제안합니다." prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
