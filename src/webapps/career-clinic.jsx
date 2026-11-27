import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, TextArea, ChipGroup, ResultDoc, AiRefine, Notice } from './kit.jsx'
import { josa } from '../lib/korean.js'
import { findPII } from '../lib/privacy.js'

/* 의료기관 취업 자소서·면접 클리닉
   기존 앱(V1)은 "단 한 건의 오류 없이", "호평을 받았습니다"처럼 학생이 쓰지 않은 성과를 문장에 넣었습니다.
   이 버전은 학생이 적은 상황·과제·행동·결과(STAR)만 문장으로 엮고, 비어 있는 칸은 [ ]로 남깁니다. */

const ROLES = {
  nurse: { name: '간호사', comp: ['간호사정', '투약 안전', '환자 옹호'], duty: '정확한 간호사정과 투약 안전', proto: '투약 5 Right와 낙상·욕창 예방 지침',
    q: ['교대 인수인계에서 꼭 확인해야 할 것은 무엇이라고 생각합니까?', '투약 직전 처방이 이상하다고 느껴지면 어떻게 하겠습니까?'],
    sudden: '여러 처치가 몰린 시간에 보호자가 대기가 길다며 언성을 높인다면 어떻게 대처하겠습니까?' },
  pt: { name: '물리치료사', comp: ['기능 평가', '운동치료', '보행 재활'], duty: '기능 평가와 단계별 운동치료', proto: '관절가동범위·근력 평가와 낙상 예방 보행 훈련 절차',
    q: ['처음 만난 환자에게 평가 순서를 어떻게 잡겠습니까?', '운동 중 환자가 어지러움을 호소하면 무엇부터 확인하겠습니까?'],
    sudden: '수술 후 통증이 두려워 운동치료를 거부하는 환자를 어떻게 참여시키겠습니까?' },
  mt: { name: '임상병리사', comp: ['검체 관리', '정도관리', '이상치 보고'], duty: '정도관리와 검체 무결성 확보', proto: '검체 바코드 이중 확인과 이상치(Critical value) 즉시 보고 지침',
    q: ['정도관리 결과가 허용 범위를 벗어나면 어떻게 처리하겠습니까?', '채혈 시 환자 확인은 어떤 방법으로 하겠습니까?'],
    sudden: '응급(STAT) 검체가 용혈되어 결과를 낼 수 없는데 의사가 결과를 재촉한다면 어떻게 하겠습니까?' },
  rt: { name: '방사선사', comp: ['피폭 저감', '영상 품질', '환자 안전 확인'], duty: '피폭을 줄이면서 진단에 충분한 영상 획득', proto: '환자·검사 부위 이중 확인과 차폐 기준(ALARA)',
    q: ['재촬영을 줄이기 위해 촬영 전 무엇을 확인하겠습니까?', '가임기 여성 환자 촬영 전 확인할 것은 무엇입니까?'],
    sudden: '조영제 투여 직전 환자가 예전 알레르기 이력을 뒤늦게 말한다면 어떻게 하겠습니까?' },
  dh: { name: '치과위생사', comp: ['감염관리', '예방처치', '구강보건교육'], duty: '감염관리와 환자 맞춤 구강보건교육', proto: '기구 멸균과 개인보호구 착용 지침',
    q: ['환자에게 칫솔질을 교육할 때 어떤 순서로 설명하겠습니까?', '멸균 기록 관리가 왜 중요하다고 생각합니까?'],
    sudden: '늦게 온 환자가 순서가 밀렸다며 바로 스케일링을 해 달라고 요구하면 어떻게 응대하겠습니까?' },
  dt: { name: '치과기공사', comp: ['정밀 보철 제작', '디지털 CAD/CAM', '진료실과의 소통'], duty: '오차 없는 보철물 제작', proto: '교합·적합도 검증과 재료별 제작 공정',
    q: ['디지털 기공과 전통 기공의 장단점을 설명해 보세요.', '보철물 적합도가 맞지 않는다는 연락을 받으면 무엇부터 확인하겠습니까?'],
    sudden: '세팅 당일 진료실에서 색조 수정이 급히 요청되면 어떻게 대처하겠습니까?' },
  emt: { name: '응급구조사', comp: ['중증도 분류', '응급처치', '현장 안전'], duty: '신속한 중증도 분류와 응급처치', proto: '1차·2차 평가와 심폐소생술·외상 처치 지침',
    q: ['SBAR로 환자 상태를 보고해 보세요.', '현장에 도착했을 때 가장 먼저 확인할 것은 무엇입니까?'],
    sudden: '비슷한 중증도의 환자 두 명이 동시에 처치가 필요하다면 무엇을 기준으로 우선순위를 정하겠습니까?' },
  admin: { name: '보건행정·원무', comp: ['원무 절차', '개인정보 보호', '환자 응대'], duty: '정확한 원무 처리와 의료정보 보호', proto: '의료법상 의무기록 열람·사본 발급 기준',
    q: ['진료비 수납 중 오류를 발견하면 어떻게 처리하겠습니까?', '키오스크 사용이 어려운 고령 환자를 어떻게 돕겠습니까?'],
    sudden: '서류 없이 온 보호자가 환자 의무기록 사본을 당장 달라고 항의하면 어떻게 응대하겠습니까?' },
}

const TYPES = [['motive', '지원동기·입사 후 포부'], ['star', '직무역량 사례(STAR)'], ['team', '협업·갈등 해결'], ['ethics', '직업윤리·사명감']]
const LENGTHS = [['500', '500자'], ['700', '700자'], ['1000', '1,000자']]

// 예시(가상): 같은 직군을 골라도 누를 때마다 다른 경험으로 채웁니다
const SAMPLES = {
  nurse: [
    { hospital: '[지원 병원]', values: '환자 중심, 생명 존중', s: '내과 병동 실습에서 낙상 고위험 80대 환자가 밤마다 혼자 화장실에 가려 함', t: '환자가 스스로 도움을 청하도록 하는 것', a: '낙상 위험을 쉬운 말로 설명하고, 침대 옆에 호출벨 위치를 그림으로 붙였으며, 담당 간호사에게 야간 순회 시간을 함께 확인함', r: '실습 기간 동안 환자가 호출벨을 누르고 기다리게 되었고, 담당 간호사가 그림 안내를 병실에 계속 쓰기로 함', strengths: '관찰력, 꼼꼼함' },
    { hospital: '[지원 병원]', values: '안전, 존중', s: '외과 병동 실습에서 수술 전 환자가 금식 시간을 잘못 알고 있음', t: '환자가 금식 시간을 정확히 이해하도록 하는 것', a: '담당 간호사에게 바로 보고하고, 금식 시작 시각을 환자와 보호자에게 시계 그림으로 다시 설명함', r: '수술 일정이 그대로 진행되었고, 이후 금식 안내를 할 때마다 되묻기 확인을 습관으로 들임', strengths: '보고 습관, 설명력' },
  ],
  pt: [
    { hospital: '[지원 병원]', values: '인간 존중, 전문성', s: '재활의학과 실습에서 편마비 환자가 보행 훈련을 지루해하며 참여가 줄어듦', t: '환자가 훈련을 이어 가도록 동기를 높이는 것', a: '환자가 좋아하는 손주 이야기를 활용해 "손주 손 잡고 걷기"를 목표로 정하고, 매회 걸은 거리를 표로 함께 기록함', r: '2주 동안 결석 없이 참여했고, 환자가 스스로 기록표를 챙겨 오게 됨', strengths: '동기부여, 공감 소통' },
    { hospital: '[지원 병원]', values: '환자 안전, 협력', s: '정형외과 실습에서 무릎 인공관절 수술 후 환자가 통증 때문에 굽힘 운동을 피함', t: '통증을 줄이면서 관절가동범위를 늘리는 것', a: '운동 전 통증 점수를 묻고, 지도 치료사와 함께 운동 강도를 나눠 짧게 여러 번 하도록 순서를 바꿈', r: '환자가 운동을 끝까지 따라왔고, 통증 점수를 묻는 방법을 실습 내내 썼음', strengths: '평가 습관, 끈기' },
  ],
}
const genericSample = r => ({ hospital: '[지원 병원]', values: '환자 중심, 신뢰', s: `${r.name} 실습에서 [어떤 상황이었는지]`, t: '[내가 맡은 일이나 풀어야 했던 문제]', a: '[내가 한 행동을 순서대로]', r: '[실제로 달라진 점, 배운 점]', strengths: '[강점 1], [강점 2]' })

const list = s => String(s || '').split(/[,，、/·]/).map(x => x.trim()).filter(Boolean)
const fill = (x, ph) => (x && x.trim() ? x.trim().replace(/[.。]$/, '') : ph)

function build({ role, type, len, f }) {
  const R = ROLES[role]
  const [v1, v2] = [list(f.values)[0] || '[인재상 1]', list(f.values)[1] || list(f.values)[0] || '[인재상 2]']
  const [s1, s2] = [list(f.strengths)[0] || '[강점 1]', list(f.strengths)[1] || '[강점 2]']
  const hosp = fill(f.hospital, '[지원 병원]')
  const S = fill(f.s, '[상황]'), T = fill(f.t, '[과제]'), A = fill(f.a, '[행동]'), Rr = fill(f.r, '[결과·배운 점]')
  const intro = {
    motive: `${josa(hosp, '이/가')} 말하는 '${v1}'은 제가 실습에서 가장 오래 붙잡고 있던 질문과 같습니다. ${R.name}의 일은 ${R.duty}에서 시작한다고 배웠고, 그 기본을 현장에서 직접 확인한 경험이 있습니다.`,
    star: `${R.name}에게 필요한 역량 가운데 저는 '${R.comp[0]}'을 실습에서 직접 써 보았습니다.`,
    team: `환자 한 명을 돕는 데에도 여러 사람의 손이 필요하다는 것을 실습에서 배웠습니다.`,
    ethics: `${R.name}의 윤리는 아무도 보지 않을 때도 ${R.proto}를 지키는 데서 시작한다고 생각합니다.`,
  }[type]
  const body = `${S}. 제가 맡은 일은 ${T}이었습니다. 저는 ${A}. 그 결과 ${Rr}.`
  const link = {
    motive: `이 경험으로 '${s1}'이 환자의 하루를 바꿀 수 있다는 것을 알았습니다.`,
    star: `이 과정에서 '${s1}'과 '${s2}'이 ${R.comp[1]}로 이어진다는 것을 배웠습니다.`,
    team: `혼자 판단하지 않고 먼저 공유한 것이 문제를 푸는 열쇠였습니다.`,
    ethics: `번거롭더라도 절차를 지키는 것이 환자를 지키는 일임을 확인했습니다.`,
  }[type]
  const plan = len >= 700
    ? `입사 후 첫해에는 ${R.proto}를 몸에 익히고, ${josa(hosp, '의')} '${v2}'을 매일의 업무 기준으로 삼겠습니다. 실습에서 배운 '${s1}'을 바탕으로 동료가 믿고 맡길 수 있는 ${R.name}가 되겠습니다.`
    : `입사 후 ${R.proto}를 철저히 익혀 '${v2}'을 실천하는 ${R.name}가 되겠습니다.`
  const extra = len >= 1000 ? `\n\n돌아보면 그때 가장 어려웠던 점은 [어려웠던 점]이었습니다. 다시 같은 상황이 온다면 [다르게 할 점]을 먼저 하겠습니다.` : ''
  const headline = { motive: `'${v1}'을 실습에서 먼저 배운 ${R.name}`, star: `${R.comp[0]}, 실습에서 직접 해 본 일`, team: `먼저 공유해서 함께 푼 문제`, ethics: `지켜보는 사람이 없어도 지키는 절차` }[type]
  const essay = `[${headline}]\n\n${intro} ${body}\n\n${link}${extra}\n\n${plan}`

  const qs = [
    { q: '1분 자기소개를 해 보세요.', g: `① 지원 직무 한 줄(${R.name}) ② 실습 경험 한 문장(${S.slice(0, 40)}…) ③ ${josa(hosp, '와/과')} 맞닿는 점('${v1}'). 50초 안에 끝내세요.` },
    { q: `자기소개서에 쓴 경험에서 왜 그렇게 행동했습니까?`, g: `행동 이유를 ${R.proto}나 환자 안전과 연결해 한 문장으로 먼저 말하고, 그다음에 순서를 설명하세요. 결과를 부풀리지 말고 적은 그대로 말하세요.` },
    ...R.q.map(q => ({ q, g: `원칙(지침) → 실제 순서 → 보고·기록 순서로 답하세요. 모르는 부분은 "선임에게 확인하겠다"고 말해도 됩니다.` })),
    { q: R.sudden, g: '① 상대의 감정을 먼저 인정 ② 지켜야 할 원칙(안전·규정)은 지킨다고 분명히 말하기 ③ 선임·담당 부서에 바로 공유 ④ 상황이 끝난 뒤 다시 확인. 이 순서로 답하세요.' },
    { q: `강점이 '${s1}'이라고 했는데, 바쁠 때도 유지할 수 있습니까?`, g: '강점이 지나치면 생기는 약점(예: 속도가 느려짐)을 먼저 인정하고, 그것을 보완하는 나만의 방법(우선순위 메모, 체크리스트)을 실습 예와 함께 말하세요.' },
  ]
  const interview = qs.map((x, i) => `Q${i + 1}. ${x.q}\n답변 방향: ${x.g}`).join('\n\n')
  return { essay, interview, holes: (essay.match(/\[[^\]]+\]/g) || []).filter(x => !x.startsWith(`[${headline}`)) }
}

const count = t => ({ all: t.length, nos: t.replace(/\s/g, '').length })

export default function CareerClinic({ app }) {
  const [role, setRole] = useState('nurse')
  const [type, setType] = useState('star')
  const [len, setLen] = useState('700')
  const [f, setF] = useState({ hospital: '', values: '', s: '', t: '', a: '', r: '', strengths: '' })
  const [res, setRes] = useState(null)
  const [essay, setEssay] = useState('')
  const [si, setSi] = useState(-1)
  const set = k => v => setF(o => ({ ...o, [k]: v }))
  const pii = findPII(Object.values(f).join(' '))

  function sample() {
    const arr = SAMPLES[role] || [genericSample(ROLES[role])]
    let i = Math.floor(Math.random() * arr.length); if (arr.length > 1 && i === si) i = (i + 1) % arr.length
    setSi(i); setF(arr[i]); setRes(null)
  }
  function make() { const r = build({ role, type, len: Number(len), f }); setRes(r); setEssay(r.essay) }
  const c = count(essay)
  const aiPrompt = useMemo(() => !res ? '' : `역할: 보건의료 직군 취업 자기소개서 첨삭 코치입니다.
지킬 것: 학생이 적은 사실(상황·행동·결과)만 쓰고 성과·수치·칭찬을 지어내지 않기, [ ] 칸은 그대로 두기, "열심히", "최선을 다해" 같은 빈말 빼기, 공백 포함 ${len}자의 85~98%로 맞추기, 실제 환자 정보 쓰지 않기.
출력: ① 고친 자기소개서 ② 바꾼 이유 3줄 ③ 면접관이 물을 만한 꼬리질문 3개

직군: ${ROLES[role].name}, 문항: ${TYPES.find(x => x[0] === type)[1]}, 지원 기관 인재상: ${f.values || '미입력'}
[초안]
${essay}`, [res, role, type, len, f, essay])

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">실제 환자의 이름·병실·등록번호는 쓰지 말고 "80대 환자"처럼 익명으로 적으세요. 적은 내용은 저장하지 않습니다.</span>
      </AppHeader>
      <section className="card">
        <ChipGroup label="지원 직군" options={Object.entries(ROLES).map(([k, r]) => [k, r.name])} value={role} onChange={v => { setRole(v); setRes(null) }} />
        <ChipGroup label="자소서 문항" options={TYPES} value={type} onChange={setType} />
        <ChipGroup label="목표 글자 수 (공백 포함)" options={LENGTHS} value={len} onChange={setLen} />
        <div className="grid">
          <Field id="cc-h" label="지원 기관"><TextInput id="cc-h" value={f.hospital} onChange={set('hospital')} placeholder="예: OO대학교병원" /></Field>
          <Field id="cc-v" label="기관 인재상" hint="쉼표로 구분, 채용 공고에서 그대로"><TextInput id="cc-v" value={f.values} onChange={set('values')} placeholder="예: 환자 중심, 생명 존중" /></Field>
        </div>
        <Field id="cc-s" label="S 상황: 언제, 어디서, 어떤 일이 있었나요"><TextArea id="cc-s" rows={2} value={f.s} onChange={set('s')} /></Field>
        <Field id="cc-t" label="T 과제: 내가 맡은 일, 풀어야 했던 문제"><TextArea id="cc-t" rows={2} value={f.t} onChange={set('t')} /></Field>
        <Field id="cc-a" label="A 행동: 내가 한 일을 순서대로"><TextArea id="cc-a" rows={3} value={f.a} onChange={set('a')} /></Field>
        <Field id="cc-r" label="R 결과: 실제로 달라진 점, 배운 점" hint="없었던 성과는 쓰지 마세요"><TextArea id="cc-r" rows={2} value={f.r} onChange={set('r')} /></Field>
        <Field id="cc-k" label="내 강점 2~3개" hint="쉼표로 구분"><TextInput id="cc-k" value={f.strengths} onChange={set('strengths')} placeholder="예: 관찰력, 보고 습관" /></Field>
        {pii.length > 0 && <Notice tone="bad">개인정보로 보이는 내용({pii.map(p => p.label).join(', ')})이 있습니다. 익명으로 바꿔 주세요.</Notice>}
        <div className="row">
          <button type="button" className="btn primary" onClick={make}>자소서·면접 준비지 만들기</button>
          <button type="button" className="btn" onClick={sample}>예시 채우기</button>
          <span className="small muted">고른 직군에 맞는 가상 사례로 채웁니다. 누를 때마다 바뀝니다.</span>
        </div>
      </section>

      {res && (
        <>
          {res.holes.length > 0 && <Notice>아직 채우지 않은 칸 {res.holes.length}곳이 [ ]로 남아 있습니다. 직접 겪은 내용으로 바꿔 주세요.</Notice>}
          <ResultDoc title="자기소개서 초안" text={essay} onChange={setEssay} fileName={`자소서_${ROLES[role].name}.txt`}
            extra={<span className={`badge ${c.all > Number(len) ? 'red' : c.all >= Number(len) * 0.85 ? 'green' : 'amber'}`}>공백 포함 {c.all}자 / {len}자 · 공백 제외 {c.nos}자</span>} />
          <ResultDoc title="면접 예상 질문과 답변 방향" text={res.interview} fileName={`면접질문_${ROLES[role].name}.txt`} />
          <section className="card">
            <div className="card-head"><h2>내기 전 점검</h2></div>
            <ul className="list">
              <li>"열심히", "최선을 다해" 대신 내가 한 행동이 문장에 들어 있는가</li>
              <li>결과에 실제로 없었던 수치나 칭찬을 넣지 않았는가</li>
              <li>기관 인재상 낱말이 한 번 이상 자연스럽게 들어갔는가</li>
              <li>환자를 알아볼 수 있는 정보(이름, 병실, 나이+질환 조합)가 없는가</li>
              <li>소리 내어 읽었을 때 한 문장이 숨 한 번에 읽히는가</li>
            </ul>
          </section>
          <AiRefine appId="career-clinic" label="지후 AI로 첨삭받기" note="적은 사실만으로 문장을 다듬고 글자 수를 맞춥니다. 성과나 수치를 새로 만들지 않습니다." prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
