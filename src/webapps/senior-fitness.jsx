import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, ChipGroup, ResultDoc, AiRefine, Notice } from './kit.jsx'

/* 노인 체력 측정 결과지·운동 처방 카드
   Senior Fitness Test(SFT) 측정값을 연령·성별 정상 범위(중간 50%)와 비교하고,
   어르신용 큰 글씨 결과지와 빈도·강도·시간·종류(FITT) 운동 카드를 만듭니다.
   기준값 출처: Jones CJ, Rikli RE. Measuring functional fitness of older adults. J Active Aging. 2002;Mar-Apr:24-30
   (원 자료: Rikli RE, Jones CJ. J Aging Phys Act. 1999;7:160-179). 미국 지역사회 노인 표본 기준이며 한국 노인 기준과 다를 수 있습니다.
   운동 권고: ACSM/AHA 노인 신체활동 권고(Nelson ME 등, Med Sci Sports Exerc 2007;39:1435-45). */

const AGES = ['60-64', '65-69', '70-74', '75-79', '80-84', '85-89', '90-94']
// [키, 이름, 단위, 높을수록 좋음?, 하는 법, 영역, 남 [낮은끝,높은끝]×7, 여 ×7]  유연성은 인치 기준
const TESTS = [
  ['chair', '30초 의자 앉았다 일어서기', '회', true, '팔짱을 끼고 30초 동안 완전히 일어섰다 앉은 횟수', '하체 근력',
    [[14, 19], [12, 18], [12, 17], [11, 17], [10, 15], [8, 14], [7, 12]], [[12, 17], [11, 16], [10, 15], [10, 15], [9, 14], [8, 13], [4, 11]]],
  ['curl', '30초 덤벨 들기', '회', true, '앉아서 남 3.6kg·여 2.3kg 덤벨을 30초 동안 팔꿈치 굽혀 든 횟수(우세 팔)', '상체 근력',
    [[16, 22], [15, 21], [14, 21], [13, 19], [13, 19], [11, 17], [10, 14]], [[13, 19], [12, 18], [12, 17], [11, 17], [10, 16], [10, 15], [8, 13]]],
  ['step', '2분 제자리 걷기', '회', true, '무릎을 무릎뼈와 엉덩뼈 중간 높이까지 올리며 2분 동안 오른 무릎이 올라간 횟수', '심폐 지구력',
    [[87, 115], [86, 116], [80, 110], [73, 109], [71, 103], [59, 91], [52, 86]], [[75, 107], [73, 107], [68, 101], [68, 100], [60, 91], [55, 85], [44, 72]]],
  ['sitreach', '의자 앉아 앞으로 굽히기', 'cm', true, '의자 끝에 앉아 한 다리를 펴고 손끝과 발끝 사이 거리(닿지 않으면 −, 넘으면 +)', '하체 유연성',
    [[-2.5, 4], [-3, 3], [-3.5, 2.5], [-4, 2], [-5.5, 1.5], [-5.5, 0.5], [-6.5, -0.5]], [[-0.5, 5], [-0.5, 4.5], [-1, 4], [-1.5, 3.5], [-2, 3], [-2.5, 2.5], [-4.5, 1]], true],
  ['scratch', '등 뒤로 손 닿기', 'cm', true, '한 손은 어깨 위로, 다른 손은 등 뒤 아래로 돌려 두 손 가운뎃손가락 사이 거리(−/+)', '상체 유연성',
    [[-6.5, 0], [-7.5, -1], [-8, -1], [-9, -2], [-9.5, -2], [-10, -3], [-10.5, -4]], [[-3, 1.5], [-3.5, 1.5], [-4, 1], [-5, 0.5], [-5.5, 0], [-7, -1], [-8, -1]], true],
  ['upgo', '2.44m(8피트) 일어나 돌아오기', '초', false, '의자에서 일어나 2.44m 앞 표지를 돌아와 다시 앉기까지 걸린 시간(빠를수록 좋음)', '민첩성·동적 균형',
    [[3.8, 5.6], [4.3, 5.7], [4.2, 6.0], [4.6, 7.2], [5.2, 7.6], [5.3, 8.9], [6.2, 10.0]], [[4.4, 6.0], [4.8, 6.4], [4.9, 7.1], [5.2, 7.4], [5.7, 8.7], [6.2, 9.6], [7.3, 11.5]]],
]
const IN = 2.54
const ageIdx = a => (a < 60 || a > 94 ? -1 : Math.min(6, Math.floor((a - 60) / 5)))

// 영역별 운동 카드(ACSM/AHA 노인 권고 범위)
const FITT = {
  '하체 근력': ['근력', '주 2~3회(하루 걸러)', '조금 힘든 정도(10점 중 5~6)', '동작마다 10~15회 × 1~3세트', '의자 앉았다 일어서기, 벽 짚고 발뒤꿈치 들기, 계단 오르기'],
  '상체 근력': ['근력', '주 2~3회(하루 걸러)', '조금 힘든 정도(10점 중 5~6)', '동작마다 10~15회 × 1~3세트', '물병·밴드로 팔 굽히기, 벽 밀기, 밴드 당기기'],
  '심폐 지구력': ['유산소', '주 5회 이상', '숨이 차지만 대화는 되는 정도(10점 중 5~6)', '하루 30분(10분씩 나눠도 됨)', '빠르게 걷기, 제자리 걷기, 실내 자전거'],
  '하체 유연성': ['유연성', '주 2회 이상(가능하면 매일)', '당기는 느낌까지, 아프지 않게', '동작마다 30~60초 유지', '의자 앉아 다리 뒤 늘리기, 누워서 무릎 당기기'],
  '상체 유연성': ['유연성', '주 2회 이상(가능하면 매일)', '당기는 느낌까지, 아프지 않게', '동작마다 30~60초 유지', '수건 잡고 등 뒤 늘리기, 가슴 펴기'],
  '민첩성·동적 균형': ['균형', '주 3회 이상', '넘어지지 않게 붙잡을 곳을 두고', '하루 10~15분', '한발 서기(의자 잡고), 일자 걷기, 앉았다 일어나 걷기 연습'],
}
const RED = [['chest', '운동 중 가슴 통증·압박감'], ['dizzy', '어지럼·실신 경험'], ['bp', '혈압이 조절되지 않음'], ['fall', '최근 6개월 안에 넘어짐'], ['surgery', '최근 수술·골절'], ['pain', '측정 중 관절 통증']]

const SAMPLES = [
  { id: 'A-001', sex: 'f', age: '72', v: { chair: '9', curl: '13', step: '70', sitreach: '-5', scratch: '-12', upgo: '7.8' }, red: [] },
  { id: 'A-002', sex: 'm', age: '68', v: { chair: '15', curl: '18', step: '95', sitreach: '-10', scratch: '-22', upgo: '5.1' }, red: [] },
  { id: 'A-003', sex: 'f', age: '81', v: { chair: '7', curl: '9', step: '52', sitreach: '2', scratch: '-8', upgo: '10.2' }, red: ['fall'] },
]

export default function SeniorFitness({ app }) {
  const [id, setId] = useState('')
  const [sex, setSex] = useState('f')
  const [age, setAge] = useState('')
  const [v, setV] = useState({})
  const [red, setRed] = useState([])
  const [made, setMade] = useState(false)
  const [si, setSi] = useState(-1)

  function sample() {
    let i = (si + 1) % SAMPLES.length; setSi(i)
    const x = SAMPLES[i]; setId(x.id); setSex(x.sex); setAge(x.age); setV(x.v); setRed(x.red); setMade(false)
  }
  const ai = ageIdx(Number(age))
  const res = useMemo(() => {
    if (ai < 0) return []
    return TESTS.map(([k, name, unit, higher, how, area, m, w, inch]) => {
      const raw = v[k]
      if (raw == null || String(raw).trim() === '' || isNaN(Number(raw))) return null
      const val = Number(raw)
      const [lo, hi] = (sex === 'm' ? m : w)[ai]
      const cmp = inch ? val / IN : val
      const level = higher ? (cmp < lo ? 'low' : cmp > hi ? 'high' : 'mid') : (cmp > hi ? 'low' : cmp < lo ? 'high' : 'mid')
      const range = inch ? `${(lo * IN).toFixed(1)} ~ ${(hi * IN).toFixed(1)}cm` : higher ? `${lo} ~ ${hi}${unit}` : `${lo} ~ ${hi}${unit}`
      return { k, name, unit, area, val, level, range }
    }).filter(Boolean)
  }, [v, sex, ai])
  const LV = { low: ['평균에 못 미침', 'red'], mid: ['평균 범위', 'green'], high: ['평균보다 좋음', 'blue'] }
  const weak = res.filter(r => r.level === 'low')
  const order = [...weak, ...res.filter(r => r.level === 'mid')].map(r => r.area).filter((x, i, a) => a.indexOf(x) === i)
  const cards = (order.length ? order : Object.keys(FITT)).slice(0, 4).map(a => [a, ...FITT[a]])

  const sheet = !made ? '' : [
    `[체력 측정 결과] 대상자 ${id || '[번호]'} · ${sex === 'm' ? '남' : '여'} · ${age}세 (${AGES[ai]}세 기준)`,
    '',
    ...res.map(r => `■ ${r.name}: ${r.val}${r.unit} → ${LV[r.level][0]} (같은 나이 평균 범위 ${r.range})`),
    '',
    weak.length ? `더 키워야 할 체력: ${weak.map(r => r.area).join(', ')}` : '모든 항목이 같은 나이 평균 범위 이상입니다.',
    '',
    '[나의 운동 카드]',
    ...cards.map(([a, kind, f, i, t, ex]) => `● ${a} (${kind})\n  얼마나 자주: ${f}\n  얼마나 힘들게: ${i}\n  얼마나 오래: ${t}\n  무엇을: ${ex}`),
    '',
    '운동 중 가슴 통증, 심한 숨참, 어지럼이 생기면 바로 멈추고 의료진에게 알리세요.',
    '',
    '기준: 미국 지역사회 노인 정상 범위(중간 50%, Jones & Rikli 2002). 한국 노인 기준과 다를 수 있어 참고용입니다.',
    '운동 권고: ACSM/AHA 노인 신체활동 권고(2007).',
  ].join('\n')
  const aiPrompt = !made ? '' : `역할: 노인 운동처방을 하는 건강운동관리사입니다.\n지킬 것: 측정값과 판정은 바꾸지 않기, 기준값을 새로 만들지 않기, 질환 진단하지 않기, 어르신이 읽을 쉬운 말.\n출력: ① 4주 동안의 주간 운동 일정표(요일별) ② 각 동작의 쉬운 설명과 주의점 ③ 4주 뒤 다시 잴 항목\n건강 주의사항: ${red.map(k => RED.find(r => r[0] === k)[1]).join(', ') || '없음'}\n\n${sheet}`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">이름 대신 대상자 번호를 쓰세요. 입력한 값은 저장하지 않습니다. 기준은 미국 노인 표본이라 참고용입니다.</span>
      </AppHeader>
      <section className="card">
        <div className="grid">
          <Field id="sf-id" label="대상자 번호"><TextInput id="sf-id" value={id} onChange={setId} placeholder="예: A-001" /></Field>
          <Field id="sf-age" label="나이(60~94세)"><TextInput id="sf-age" inputMode="numeric" value={age} onChange={x => setAge(x.replace(/\D/g, '').slice(0, 2))} /></Field>
        </div>
        <ChipGroup label="성별" options={[['f', '여성'], ['m', '남성']]} value={sex} onChange={setSex} />
        {age && ai < 0 && <Notice tone="bad">기준표는 60~94세만 있습니다.</Notice>}
        <div className="grid">{TESTS.map(([k, name, unit, , how]) => (
          <Field key={k} id={`sf-${k}`} label={`${name} (${unit})`} hint={how}>
            <TextInput id={`sf-${k}`} inputMode="decimal" value={v[k] || ''} onChange={x => setV({ ...v, [k]: x.replace(/[^\d.\-]/g, '') })} />
          </Field>
        ))}</div>
        <ChipGroup label="운동 전 확인 (해당하면 모두)" multi options={RED} value={red} onChange={setRed} />
        <div className="row">
          <button type="button" className="btn primary" disabled={ai < 0} onClick={() => setMade(true)}>결과지 만들기</button>
          <button type="button" className="btn" onClick={sample}>예시 채우기</button>
          <span className="small muted">가상 대상자 3명이 차례로 바뀝니다.</span>
        </div>
      </section>
      {made && (
        <>
          {red.length > 0 && <Notice tone="bad">운동 전 확인 항목({red.map(k => RED.find(r => r[0] === k)[1]).join(', ')})이 있습니다. 운동을 시작하기 전에 의료진의 확인을 받으세요.</Notice>}
          <section className="card">
            <div className="card-head"><h2>측정 결과</h2><span className="muted small">{AGES[ai]}세 {sex === 'm' ? '남성' : '여성'} 기준</span></div>
            <ul className="list">{res.map(r => (
              <li key={r.k}><span><b>{r.name}</b> {r.val}{r.unit}<br /><span className="small muted">{r.area} · 평균 범위 {r.range}</span></span><span className={`badge ${LV[r.level][1]}`}>{LV[r.level][0]}</span></li>
            ))}</ul>
            {res.length < TESTS.length && <p className="small muted" style={{ margin: 0 }}>측정하지 않은 항목 {TESTS.length - res.length}개는 결과에서 뺐습니다.</p>}
          </section>
          <section className="card">
            <div className="card-head"><h2>운동 카드</h2><span className="muted small">부족한 체력부터</span></div>
            <div className="grid">{cards.map(([a, kind, f, i, t, ex]) => (
              <div key={a} className="tile"><b>{a} · {kind}</b><span className="small">자주: {f}<br />강도: {i}<br />시간: {t}<br />예: {ex}</span></div>
            ))}</div>
          </section>
          <ResultDoc title="어르신용 결과지(인쇄·저장)" text={sheet} fileName={`체력결과_${id || '대상자'}.txt`} />
          <AiRefine appId="senior-fitness" label="지후 AI로 4주 운동 일정표 만들기" note="측정값과 판정은 그대로 두고, 요일별 운동 일정과 동작 설명을 만듭니다." prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
