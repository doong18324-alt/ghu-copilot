import { useMemo, useState } from 'react'
import { AppHeader, Field, TextArea, ChipGroup, ResultDoc, AiRefine } from './kit.jsx'
import { KB, EXAMPLES, AGE_NOTES } from './pet-data.js'

/* 반려동물 행동 통역사
   기존 앱(V1)의 종별 원인·대처 내용을 옮기고, 응급 판단을 종·증상 조합까지 보도록 넓혔습니다
   (수컷 고양이 배뇨 곤란, 중독 의심 음식, 대형견 배 부풀음 등). 수의사 진료를 대신하지 않습니다. */

const PET = [['dog', '강아지'], ['cat', '고양이']]
const AGE = [['junior', '1세 미만'], ['adult', '1~7세'], ['senior', '7세 이상']]
const CATS = Object.entries(KB).map(([k, v]) => [k, v.label])

// 빨강: 바로 동물병원(야간이면 24시 동물병원)
const RED = [
  ['blood', '피가 섞인 구토·변'],
  ['breath', '숨이 가쁘거나 잇몸이 창백·파람'],
  ['seizure', '경련, 비틀거림, 의식이 흐림'],
  ['toxin', '초콜릿·포도·자일리톨·약·백합(고양이) 등을 먹은 것 같음'],
  ['bloat', '배가 부풀고 토하려는데 안 나옴'],
  ['nourine', '소변을 보려 하는데 안 나오거나 몇 방울만 나옴'],
  ['fast', '하루 넘게 아무것도 먹지 않고 기운이 없음'],
]
const RED_WHY = {
  nourine: '요도가 막히면 몇 시간 안에 위험해질 수 있습니다. 특히 수컷 고양이는 바로 가야 합니다.',
  bloat: '대형견에게서 위가 꼬이는 응급(위확장·염전)일 수 있습니다.',
  toxin: '먹은 것의 이름과 양, 시간을 메모하고 포장지를 들고 가세요. 억지로 토하게 하지 마세요.',
  fast: '고양이는 굶으면 간에 지방이 쌓이는 병이 빨리 올 수 있습니다.',
}

function triage({ pet, age, cats, red, detail }) {
  const words = detail.replace(/\s/g, '')
  const autoRed = []
  if (pet === 'cat' && cats.includes('potty') && /(조금|소량|몇방울|안나|힘주|한참앉)/.test(words)) autoRed.push('배뇨 곤란이 의심되는 고양이')
  if (/(초콜릿|포도|건포도|자일리톨|양파|백합|타이레놀|진통제)/.test(words)) autoRed.push('중독 의심 음식·약')
  if (red.length || autoRed.length) return { lv: 'red', label: '빨강: 오늘 바로 동물병원', autoRed }
  const yellow = age === 'junior' || age === 'senior' || cats.some(c => ['appetite', 'potty', 'hiding'].includes(c)) || /(이틀|2일|사흘|3일|일주일|계속|반복|여러번)/.test(words)
  return yellow ? { lv: 'amber', label: '노랑: 1~2일 안에 진료 예약', autoRed } : { lv: 'green', label: '초록: 집에서 지켜보며 기록', autoRed }
}

export default function PetSignal({ app }) {
  const [pet, setPet] = useState('dog')
  const [age, setAge] = useState('adult')
  const [cats, setCats] = useState([])
  const [detail, setDetail] = useState('')
  const [red, setRed] = useState([])
  const [res, setRes] = useState(null)
  const [msg, setMsg] = useState('')
  const [ei, setEi] = useState({ dog: -1, cat: -1 })

  function sample() {
    const arr = EXAMPLES[pet]; let i = (ei[pet] + 1) % arr.length
    const x = arr[i]; setEi({ ...ei, [pet]: i }); setAge(x.age); setCats(x.categories.filter(c => KB[c])); setDetail(x.text); setRed([]); setRes(null); setMsg('')
  }
  function make() {
    if (!cats.length && !detail.trim()) { setMsg('행동을 하나 이상 고르거나 설명을 적어 주세요.'); return }
    setMsg(''); setRes(triage({ pet, age, cats, red, detail }))
  }
  const petName = PET.find(p => p[0] === pet)[1]
  const memo = useMemo(() => !res ? '' : [
    `[수의사 상담용 메모] ${petName} · ${AGE.find(a => a[0] === age)[1]}`,
    `판단: ${res.label}`,
    `관찰한 행동: ${cats.map(c => KB[c].label).join(', ') || '선택 없음'}`,
    `자세한 상황: ${detail.trim() || '(적지 않음)'}`,
    `응급 신호: ${[...red.map(k => RED.find(r => r[0] === k)[1]), ...res.autoRed].join(', ') || '없음'}`,
    '',
    '진료 때 함께 알려 줄 것: 증상이 시작된 날짜, 횟수, 먹은 사료·간식, 최근 환경 변화, 먹는 약, 사진·영상',
  ].join('\n'), [res, petName, age, cats, detail, red])
  const aiPrompt = !res ? '' : `역할: 반려동물 행동을 보호자 눈높이로 설명하는 수의 간호사입니다.\n지킬 것: 진단명 단정하지 않기, 사람 약 권하지 않기, 판단 등급(빨강·노랑·초록)은 낮추지 않기, 쉬운 말.\n출력: ① 이 행동이 말하는 것 3줄 ② 오늘 집에서 할 일 3가지 ③ 동물병원에 갈 때 챙길 것\n\n${memo}`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">행동 이해를 돕는 일반 정보이며 수의사 진료를 대신하지 않습니다. 응급 신호가 있으면 바로 동물병원에 가세요.</span>
      </AppHeader>
      <section className="card">
        <ChipGroup label="종류" options={PET} value={pet} onChange={v => { setPet(v); setRes(null) }} />
        <ChipGroup label="나이" options={AGE} value={age} onChange={setAge} />
        <ChipGroup label="보이는 행동 (여러 개)" multi options={CATS} value={cats} onChange={setCats} />
        <Field id="ps-d" label="자세한 상황" hint="언제부터, 몇 번, 무엇을 먹었는지">
          <TextArea id="ps-d" rows={4} value={detail} onChange={setDetail} placeholder="예: 어제 저녁부터 사료를 남기고, 오늘 아침 노란 거품 토를 한 번 했어요." />
        </Field>
        <ChipGroup label="응급 신호 (해당하면 모두)" multi options={RED} value={red} onChange={setRed} />
        {msg && <div className="check bad" role="alert">{msg}</div>}
        <div className="row">
          <button type="button" className="btn primary" onClick={make}>행동 통역하기</button>
          <button type="button" className="btn" onClick={sample}>예시 채우기</button>
          <span className="small muted">고른 종류의 예시가 차례로 바뀝니다.</span>
        </div>
      </section>

      {res && (
        <>
          <section className={`card ${res.lv === 'red' ? 'wa-crisis' : ''}`} role={res.lv === 'red' ? 'alert' : undefined}>
            <div className="card-head"><h2>{res.label}</h2><span className={`badge ${res.lv === 'red' ? 'red' : res.lv === 'amber' ? 'amber' : 'green'}`}>응급도</span></div>
            {res.lv === 'red' && <ul className="list">
              {[...red.map(k => `${RED.find(r => r[0] === k)[1]}${RED_WHY[k] ? `: ${RED_WHY[k]}` : ''}`), ...res.autoRed.map(t => `${t}: 적은 설명에서 이 신호가 보였습니다.`)].map(t => <li key={t}>{t}</li>)}
              <li>밤이나 휴일이면 가까운 24시 동물병원에 전화로 먼저 상황을 알리고 가세요.</li>
            </ul>}
            {res.lv !== 'red' && <p style={{ margin: 0 }}>{res.lv === 'amber' ? '당장 위급해 보이지는 않지만, 나이나 증상 특성상 진료로 원인을 확인하는 것이 안전합니다. 그동안 아래 대처를 해 주세요.' : '흔히 보이는 행동일 가능성이 높습니다. 아래 대처를 하며 하루 이틀 기록해 보고, 나빠지면 진료를 받으세요.'}</p>}
            <p className="small muted" style={{ margin: 0 }}>{AGE_NOTES[age][pet]}</p>
          </section>
          {cats.map(c => {
            const k = KB[c][pet]
            return (
              <section key={c} className="card">
                <div className="card-head"><h2>{KB[c].label}</h2><span className="badge">{petName}</span></div>
                <b>이럴 수 있어요</b>
                <ul className="list">{k.reasons.map(r => <li key={r.title}><span><b>{r.title}</b><br /><span className="small">{r.desc}</span></span></li>)}</ul>
                <b>해 주세요</b>
                <ul className="list">{k.doList.map(t => <li key={t}>{t}</li>)}</ul>
                <b>하지 마세요</b>
                <ul className="list">{k.dontList.map(t => <li key={t}>{t}</li>)}</ul>
              </section>
            )
          })}
          <ResultDoc title="수의사 상담용 메모" text={memo} fileName="반려동물_상담메모.txt" />
          <AiRefine appId="pet-signal" label="지후 AI로 쉽게 풀어 듣기" note="응급도는 낮추지 않고, 보호자가 오늘 할 일을 정리합니다." prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
