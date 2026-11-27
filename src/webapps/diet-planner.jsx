import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, ChipGroup, ResultDoc, AiRefine, Notice } from './kit.jsx'
import { MEALS, GROCERY } from './diet-data.js'

/* 건강 식단 플래너·장보기 예산
   기존 앱(V3)은 제외 조건 때문에 메뉴가 모자라면 걸러 낸 메뉴를 다시 넣었고, 와파린을 먹으면 녹색 채소를 빼라고 안내했습니다.
   이 버전은 걸러 낸 메뉴를 되살리지 않고, 약과 음식은 "끊기"가 아니라 "일정하게"처럼 실제 권고에 맞춰 안내합니다.
   일반 영양 참고용이며, 치료식이 필요하면 의사·임상영양사와 상담합니다. */

const TYPES = [['breakfast', '아침'], ['lunch', '점심'], ['dinner', '저녁'], ['snack', '간식']]
const DAYS = ['월', '화', '수', '목', '금', '토', '일']
const RATIO = { breakfast: 0.22, lunch: 0.38, dinner: 0.32, snack: 0.08 }
const ACT = [['low', '적음(주로 앉아서)'], ['mid', '보통(주 2~3회 운동)'], ['high', '많음(몸 쓰는 일·매일 운동)']]
const COND = [['diabetes', '혈당 관리'], ['hypertension', '혈압·저염'], ['lipid', '콜레스테롤'], ['gout', '통풍·요산'], ['kidney', '신장질환'], ['digestive', '속이 예민함']]
const COND_NOTE = {
  diabetes: '밥은 평소의 3분의 2 정도로 하고, 채소 → 단백질 → 밥 순서로 드세요. 간식 과일은 한 번에 주먹 반 개 정도가 적당합니다.',
  hypertension: '국·찌개는 건더기 위주로 먹고 국물은 남기세요. 김치·장아찌는 한 끼 한두 젓가락으로 줄입니다.',
  lipid: '튀김과 기름진 부위 대신 굽거나 찐 요리를 고르고, 생선은 주 2회 이상 넣었습니다.',
  gout: '요산을 높일 수 있는 등푸른생선·내장·진한 고기 국물 메뉴는 뺐습니다. 물을 충분히 드세요.',
  kidney: '신장질환은 단계마다 칼륨·인·단백질 기준이 달라 이 식단만으로 관리하면 안 됩니다. 칼륨이 많은 일부 메뉴는 뺐지만, 반드시 담당 의사·임상영양사의 기준을 따르세요.',
  digestive: '맵고 짠 양념을 줄이고, 천천히 30번 이상 씹어 드세요. 증상이 계속되면 진료를 받으세요.',
}
// 약과 음식: 실제 권고에 맞춘 안내만 합니다(메뉴를 자동으로 빼지 않음)
const DRUG_NOTE = [
  [/와파린|항응고/, '와파린을 드시면 시금치·브로콜리 같은 녹색 채소를 끊을 필요는 없고, 매일 비슷한 양으로 일정하게 드시는 것이 중요합니다. 양을 크게 바꿀 때는 담당 의사와 상의하세요.'],
  [/스타틴|고지혈|혈압약|칼슘\s*채널/, '일부 고지혈증·혈압약은 자몽(주스 포함)과 함께 먹으면 약효가 달라질 수 있습니다. 약 설명서나 약사에게 확인하세요.'],
  [/당뇨약|인슐린|메트포르민/, '식사를 거르면 저혈당이 올 수 있으니 끼니 시간을 일정하게 지키세요.'],
]

function kcalOf(age, sex, act) {
  let base = sex === 'm' ? 2200 : 1850
  if (age >= 65) base -= 200; else if (age >= 50) base -= 100; else if (age <= 29) base += 100
  base += { low: -200, mid: 0, high: 250 }[act]
  return Math.max(1300, Math.round(base / 50) * 50)
}

function shuffle(a, seed) { const r = [...a]; let s = seed; for (let i = r.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }

function plan({ budget, cond, exclude, seed }) {
  const ex = exclude.split(/[,，\s]+/).map(x => x.trim()).filter(Boolean)
  const ok = MEALS.filter(m => !cond.some(c => m.avoid.includes(c)) && !ex.some(k => m.name.includes(k) || m.ingredients.some(i => i.includes(k))))
  const daily = budget / 7
  const short = []
  const days = DAYS.map((d, di) => {
    const meals = {}
    for (const [t] of TYPES) {
      const pool = ok.filter(m => m.type === t)
      if (!pool.length) { meals[t] = null; if (!short.includes(t)) short.push(t); continue }
      const target = daily * RATIO[t] * 1.15
      const fit = pool.filter(m => m.cost <= target)
      const cand = shuffle(fit.length ? fit : [...pool].sort((a, b) => a.cost - b.cost).slice(0, 2), seed + di * 7 + t.length)
      meals[t] = cand[0]
    }
    return { d, meals }
  })
  // 같은 메뉴가 이틀 연속 나오지 않게 합니다
  for (let i = 1; i < 7; i++) for (const [t] of TYPES) {
    const pool = ok.filter(m => m.type === t && m.cost <= daily * RATIO[t] * 1.15)
    if (days[i].meals[t] && days[i - 1].meals[t] && days[i].meals[t].id === days[i - 1].meals[t].id && pool.length > 1) days[i].meals[t] = pool.find(m => m.id !== days[i - 1].meals[t].id)
  }
  const mealCost = days.reduce((n, x) => n + Object.values(x.meals).reduce((k, m) => k + (m?.cost || 0), 0), 0)
  const ing = {}
  days.forEach(x => Object.values(x.meals).forEach(m => m?.ingredients.forEach(i => { ing[i] = (ing[i] || 0) + 1 })))
  return { days, mealCost, ing, short, pool: ok.length }
}

const won = n => `${Math.round(n).toLocaleString()}원`
const SAMPLES = [
  { age: '68', sex: 'f', act: 'low', cond: ['hypertension'], exclude: '', budget: 42000, drug: '혈압약' },
  { age: '22', sex: 'm', act: 'high', cond: [], exclude: '오이', budget: 35000, drug: '' },
  { age: '55', sex: 'm', act: 'mid', cond: ['diabetes', 'lipid'], exclude: '', budget: 56000, drug: '메트포르민' },
  { age: '47', sex: 'f', act: 'mid', cond: ['gout'], exclude: '견과', budget: 49000, drug: '' },
  { age: '73', sex: 'm', act: 'low', cond: [], exclude: '', budget: 45000, drug: '와파린' },
]

export default function DietPlanner({ app }) {
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('f')
  const [act, setAct] = useState('mid')
  const [cond, setCond] = useState([])
  const [exclude, setExclude] = useState('')
  const [drug, setDrug] = useState('')
  const [budget, setBudget] = useState(49000)
  const [seed, setSeed] = useState(1)
  const [res, setRes] = useState(null)
  const [price, setPrice] = useState({})
  const [got, setGot] = useState({})
  const [si, setSi] = useState(-1)

  function sample() {
    let i = Math.floor(Math.random() * SAMPLES.length); if (i === si) i = (i + 1) % SAMPLES.length
    const x = SAMPLES[i]; setSi(i); setAge(x.age); setSex(x.sex); setAct(x.act); setCond(x.cond); setExclude(x.exclude); setBudget(x.budget); setDrug(x.drug); setRes(null)
  }
  function make(nextSeed = seed) { setRes(plan({ budget, cond, exclude, seed: nextSeed })); setGot({}) }
  const kcal = kcalOf(Number(age) || 40, sex, act)
  const notes = [...cond.map(c => COND_NOTE[c]), ...DRUG_NOTE.filter(([re]) => re.test(drug)).map(([, t]) => t)]

  const shop = useMemo(() => {
    if (!res) return []
    return Object.keys(res.ing).map(n => ({ n, ...GROCERY[n], price: price[n] ?? GROCERY[n]?.price ?? 0 })).sort((a, b) => (a.cat || '').localeCompare(b.cat || '') || a.n.localeCompare(b.n))
  }, [res, price])
  const shopTotal = shop.reduce((n, x) => n + x.price, 0)
  const gotTotal = shop.filter(x => got[x.n]).reduce((n, x) => n + x.price, 0)

  const text = !res ? '' : [
    `[일주일 식단] 하루 예상 필요 열량 약 ${kcal.toLocaleString()}kcal(참고용 추정) · 주간 식비 ${won(budget)}`,
    ...res.days.map(x => `${x.d}  ${TYPES.map(([t, n]) => `${n}: ${x.meals[t]?.name || '알맞은 메뉴 없음'}`).join(' / ')}`),
    '',
    `끼니 재료비 합계(1인분 추정): ${won(res.mealCost)}`,
    `장보기 구매액(구매 단위 기준, 남는 재료 포함): ${won(shopTotal)}`,
    ...(notes.length ? ['', '[건강 상태별 안내]', ...notes.map(n => `· ${n}`)] : []),
  ].join('\n')
  const aiPrompt = !res ? '' : `역할: 가정식 식단을 짜 주는 영양사입니다.\n지킬 것: 아래 식단의 메뉴 구성과 [건강 상태별 안내]는 유지, 치료 효과 약속하지 않기, 약 복용은 바꾸라고 하지 않기, 가격 수치는 바꾸지 않기.\n출력: ① 주말에 미리 해 둘 밑반찬 3가지와 조리 순서 ② 남는 재료 활용법 ③ 외식할 때 고를 메뉴 기준 3줄\n\n${text}`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">일반 영양 참고용입니다. 질환 치료식은 의사·임상영양사와 상의하세요. 가격은 예시 단가이며 장보기 표에서 고칠 수 있습니다.</span>
      </AppHeader>
      <section className="card">
        <div className="grid">
          <Field id="dp-age" label="나이"><TextInput id="dp-age" inputMode="numeric" value={age} onChange={v => setAge(v.replace(/\D/g, '').slice(0, 3))} placeholder="예: 55" /></Field>
          <ChipGroup label="성별" options={[['f', '여성'], ['m', '남성']]} value={sex} onChange={setSex} />
        </div>
        <ChipGroup label="평소 활동량" options={ACT} value={act} onChange={setAct} />
        <ChipGroup label="건강 목표 (해당 없으면 고르지 않기)" multi options={COND} value={cond} onChange={setCond} />
        <div className="grid">
          <Field id="dp-ex" label="빼고 싶은 재료·알레르기" hint="쉼표로 구분"><TextInput id="dp-ex" value={exclude} onChange={setExclude} placeholder="예: 오징어, 견과" /></Field>
          <Field id="dp-drug" label="먹는 약(있으면)" hint="음식과 함께 주의할 점만 안내합니다"><TextInput id="dp-drug" value={drug} onChange={setDrug} placeholder="예: 와파린, 혈압약" /></Field>
        </div>
        <Field id="dp-b" label={`주간 식비 ${won(budget)} (하루 ${won(budget / 7)})`}>
          <input id="dp-b" type="range" min={21000} max={70000} step={1000} value={budget} onChange={e => setBudget(Number(e.target.value))} style={{ width: '100%' }} />
        </Field>
        <div className="row">
          <button type="button" className="btn primary" onClick={() => make()}>일주일 식단 만들기</button>
          <button type="button" className="btn" onClick={sample}>예시 채우기</button>
          {res && <button type="button" className="btn" onClick={() => { const s = seed + 1; setSeed(s); make(s) }}>다른 조합 보기</button>}
        </div>
      </section>

      {res && (
        <>
          {res.short.length > 0 && <Notice tone="bad">조건에 맞는 {res.short.map(t => TYPES.find(x => x[0] === t)[1]).join('·')} 메뉴가 없습니다. 빼는 재료를 줄이거나 직접 메뉴를 정해 주세요. 걸러 낸 메뉴를 다시 넣지는 않았습니다.</Notice>}
          {cond.includes('kidney') && <Notice tone="bad">{COND_NOTE.kidney}</Notice>}
          <section className="card">
            <div className="card-head"><h2>일주일 식단표</h2><span className={`badge ${res.mealCost <= budget ? 'green' : 'red'}`}>재료비 {won(res.mealCost)} / {won(budget)}</span></div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>요일</th>{TYPES.map(([t, n]) => <th key={t}>{n}</th>)}<th>열량</th></tr></thead>
                <tbody>{res.days.map(x => (
                  <tr key={x.d}><td><b>{x.d}</b></td>{TYPES.map(([t]) => <td key={t}>{x.meals[t] ? <>{x.meals[t].name}<br /><span className="muted small">{won(x.meals[t].cost)}</span></> : <span className="muted">없음</span>}</td>)}
                    <td className="small">{Object.values(x.meals).reduce((n, m) => n + (m?.kcal || 0), 0)}kcal</td></tr>
                ))}</tbody>
              </table>
            </div>
            <p className="small muted" style={{ margin: 0 }}>하루 예상 필요 열량은 약 {kcal.toLocaleString()}kcal입니다(나이·성별·활동량으로 낸 참고용 추정). 메뉴 열량도 1인분 추정치입니다.</p>
          </section>
          {notes.length > 0 && <section className="card"><div className="card-head"><h2>건강 상태별 안내</h2></div><ul className="list">{notes.map(n => <li key={n}>{n}</li>)}</ul></section>}
          <section className="card">
            <div className="card-head"><h2>장보기 목록</h2><span className="badge">담은 금액 {won(gotTotal)} / 전체 {won(shopTotal)}</span></div>
            <p className="small muted" style={{ margin: 0 }}>구매 단위 가격이라 끼니 재료비보다 많고, 남는 재료는 다음 주에 씁니다. 단가는 동네 가격으로 고쳐 쓰세요.</p>
            <ul className="check-list">{shop.map(x => (
              <li key={x.n}><label style={{ flex: 1 }}><input type="checkbox" checked={!!got[x.n]} onChange={e => setGot({ ...got, [x.n]: e.target.checked })} /><span>{x.n} <span className="muted small">{x.unit} · {x.cat}</span></span></label>
                <input className="input" style={{ width: 96 }} inputMode="numeric" aria-label={`${x.n} 단가`} value={x.price} onChange={e => setPrice({ ...price, [x.n]: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></li>
            ))}</ul>
          </section>
          <ResultDoc title="식단 요약(복사·저장용)" text={text} fileName="일주일_식단.txt" />
          <AiRefine appId="diet-planner" label="지후 AI로 밑반찬·조리 순서 받기" note="식단과 건강 안내는 그대로 두고, 미리 해 둘 반찬과 남는 재료 활용법을 정리합니다." prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
