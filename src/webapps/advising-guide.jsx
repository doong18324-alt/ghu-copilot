import { useMemo, useState } from 'react'
import { AppHeader, Field, TextArea, ChipGroup, ResultDoc, AiRefine, Notice, CopyButton } from './kit.jsx'
import { findPII } from '../lib/privacy.js'
import { todayDots } from '../lib/korean.js'

/* 지도학생 진로·학업 위기 상담 가이드
   기존 앱(V1)의 3단계 화법, 금기 화법, 지원 부서 연계, 상담일지 문장을 옮겼고
   위기 신호 확인 질문, 일정·부서명 자리표시, 비밀보장 예외 안내, 개인정보 확인을 더했습니다. */

const GRADES = [
  ['1학년', '1학년', '적응기', '대학 입학 후 새로운 환경에 적응하는 시기라 낯설고 막막한 게 당연하단다.'],
  ['2학년', '2학년', '전공심화·실습 전', '전공 난이도가 높아지고 실습을 앞둔 시기라 많은 학생이 흔들리는 때야.'],
  ['3·4학년', '3·4학년', '국가시험·취업 준비기', '임상실습과 국가시험, 취업 준비가 한꺼번에 몰려 부담이 가장 큰 시기지.'],
  ['복학생', '복학생', '복학 후 재적응', '복학 후 달라진 분위기와 학업 리듬을 다시 맞추는 게 결코 쉽지 않았을 거야.'],
]

// [키, 이름, 탐색 질문]
const CRISES = [
  ['leave', '휴학·자퇴 고민', '휴학이나 진로 변경을 고민하기까지 혼자서 얼마나 많은 생각을 했을까. 지금 학교생활에서 가장 지치게 만드는 결정적인 이유는 무엇이니?'],
  ['grade', '성적 저하·학사경고 위험', '성적이나 출석 때문에 많이 위축되고 속상했을 텐데, 수업을 따라가거나 공부 시간을 확보하는 데 어떤 부분이 가장 큰 걸림돌이었어?'],
  ['people', '교우·선후배 관계 어려움', '학과 안에서 사람들과 어울리거나 조별 활동을 할 때 마음이 편치 않았던 순간이 있었니? 어떤 상황에서 가장 혼자라고 느꼈는지 들려줄 수 있을까?'],
  ['major', '전공 부적응·진로 방황', '막상 전공 수업을 들어 보니 기대와 다르다고 느낀 지점이 있었니? 네가 진짜 해 보고 싶거나 잘할 수 있다고 느끼는 분야는 어떤 쪽이야?'],
  ['exam', '임상실습·국가시험 스트레스', '실습 현장의 긴장감과 국가시험 압박을 동시에 견디느라 에너지가 많이 소진된 것 같아. 하루 중 가장 부담되는 부분은 구체적으로 무엇이니?'],
  ['money', '경제적 어려움·장학 상담', '학비나 생활비를 스스로 해결하느라 학업에 집중할 여력이 부족했겠구나. 지금 아르바이트 시간이나 경제적 부담이 어느 정도인지 이야기해 줄 수 있니?'],
  ['mood', '정서적 우울·무기력감', '요즘 학교에 오는 발걸음조차 무겁게 느껴질 만큼 많이 지쳐 있는 것 같아. 최근 잠과 식사는 어떤지, 언제부터 이렇게 힘들어졌는지 편하게 말해 줄래?'],
]

// [키, 이름, 코칭 포인트, 1단계 여는 말]
const STYLES = [
  ['quiet', '말수가 적고 방어적', '질문을 쏟아붓기보다 침묵을 기다리고, 평가나 추궁 없는 안전한 분위기를 먼저 만듭니다.',
    'OO야, 바쁠 텐데 와 줘서 고맙다. 오늘은 뭐가 잘못됐는지 따지려는 자리가 전혀 아니야. 요즘 혼자 끙끙 앓는 건 없는지, 교수님이 도울 수 있는 게 있는지 얼굴 보고 이야기하고 싶었어. 말하기 어려운 건 천천히 해도 괜찮아.'],
  ['anxious', '감정이 격하거나 불안', '해결책보다 감정을 먼저 충분히 받아 주고, 차분하고 안정된 어조를 유지합니다.',
    'OO야, 여기까지 오느라 마음이 많이 무거웠지? 우선 물 한 잔 마시면서 숨부터 천천히 고르자. 지금 당장 결론을 내리지 않아도 괜찮아. 이 방에서는 속상한 마음을 있는 그대로 말해도 돼. 끝까지 들을게.'],
  ['masked', '괜찮은 척하지만 속으로 고민', '밝은 표정 뒤의 부담을 알아봐 주고, 약한 모습을 보여도 괜찮다고 말로 전합니다.',
    'OO야, 늘 밝고 성실하게 지내려고 애쓰는 모습이 보여. 그런데 겉으로 괜찮아 보여도 혼자 버티기 버거운 순간이 오기 마련이잖아. 오늘만큼은 잘해야 한다는 부담을 내려놓고 속마음을 들려주면 좋겠어.'],
  ['practical', '구체적 해결책을 바로 원함', '요점을 짚고 학사 일정, 장학, 비교과 등 바로 할 수 있는 선택지를 정리해 안내합니다.',
    'OO야, 찾아와 줘서 반갑다. 오늘은 지금 겪는 어려움을 정확히 짚고, 학교에서 쓸 수 있는 가장 현실적인 방법을 같이 찾아보려고 해. 가장 급하게 해결하고 싶은 것부터 이야기해 줄래?'],
]

const FALLBACK_Q = [
  '지금 상황이 조금이라도 나아지려면 교수님이나 학교가 가장 먼저 도와줬으면 하는 한 가지는 무엇이니?',
  '요즘 하루 중 그나마 마음이 편해지는 시간은 언제야?',
]

// 지원 부서: 이름은 본교 조직명과 다를 수 있어 [ ]로 확인 표시를 남깁니다.
const PROGRAMS = [
  { when: c => c.includes('grade'), dept: '[교수학습지원센터]', name: '학습클리닉·또래 학습튜터링', desc: '1:1 학습전략 진단, 시간관리 코칭, 선배 튜터 매칭', say: '혼자 막막해하기보다 학습튜터링을 신청해 보자. 선배 튜터와 공부 습관을 잡으면 훨씬 수월할 거야.' },
  { when: c => c.includes('mood') || c.includes('leave') || c.includes('people'), dept: '[학생상담센터]', name: '개인 심리상담·심리검사', desc: '전문상담사 1:1 상담, 정서·성격 검사, 대인관계 집단상담', say: '마음이 지칠 때는 전문가의 도움이 큰 힘이 돼. 상담센터는 비밀이 보장되고(안전이 걱정될 때는 예외가 있어) 무료로 검사도 받을 수 있으니 같이 예약해 볼까?' },
  { when: (c, g) => c.includes('major') || c.includes('exam') || g === '3·4학년', dept: '[취창업지원 부서]', name: '진로적성검사·직무멘토링·취업 특강', desc: '진로 트랙 탐색, 1:1 진로취업 상담, 보건의료 직무 특강과 모의면접', say: '전공을 살릴 수 있는 길은 생각보다 다양해. 진로 상담을 받아 보고 선택지를 넓혀 보자.' },
  { when: c => c.includes('money'), dept: '[장학 담당 부서]', name: '국가·교내 장학금, 교내 근로장학', desc: '국가장학금 재신청 안내, 교내 장학금, 학업과 병행 가능한 근로장학', say: '아르바이트 때문에 수업까지 빠지면 너무 아깝잖아. 장학 담당 선생님께 연결해 줄 테니 근로장학이나 추가 장학금부터 확인해 보자.' },
]
const DEFAULT_PROGRAM = { dept: '[학생지원 부서]', name: '지도교수 멘토링·대학생활 적응 비교과', desc: '대학생활 적응 진단, 선후배 멘토링, 비교과 프로그램', say: '혼자 고민하면 작은 문제도 크게 느껴지곤 해. 비교과 프로그램에 참여하면서 작은 성취를 하나씩 쌓아 가 보자.' }

const DONTS = [
  ['다른 애들도 다 똑같이 힘든데 너만 왜 유난이니?', '남들 눈에 어떻게 보이든, 지금 네가 느끼는 무게가 너에게는 가장 버거웠을 거야.'],
  ['지금 휴학하면 나중에 더 힘들어. 무조건 버텨.', '휴학이든 학업 유지든 네 미래에 가장 나은 선택이 무엇인지 장단점과 대안을 같이 따져 보자.'],
]
const DONT_STUDY = ['공부를 안 하니까 성적이 떨어지지. 이래서 국가시험 어떻게 하려고?', '성적표 숫자보다 어디서 막혔는지가 더 중요해. 기초부터 다시 같이 잡아 보자.']
const DONT_MAJOR = ['다 알고 들어온 전공인데 이제 와서 안 맞는다고 하면 어떡하니?', '직접 부딪혀 보면서 고민이 생기는 건 당연해. 네 강점이 살 수 있는 방향을 함께 찾아보자.']
const DONT_QUIET = ['대답을 해야 도와주지, 왜 아무 말도 안 해?', '지금 말로 정리하기 어려우면 천천히 생각해도 돼. 메모나 메시지로 먼저 보내 줘도 괜찮아.']
const DONT_ANX = ['감정적으로 불안해한다고 해결되는 건 없어. 냉정해져야지.', '많이 놀라고 불안한 게 당연해. 마음부터 진정시키고 할 수 있는 것부터 하나씩 정리해 보자.']

// 학생이 직접 말하지 않아도 꼭 확인해야 하는 위기 신호
const RISK_WORDS = ['자해', '자살', '죽고', '죽을', '사라지고', '끝내고', '살기싫', '유서', '손목', '뛰어내']

function build({ grade, crises, style, obs }) {
  const g = GRADES.find(x => x[0] === grade)
  const s = STYLES.find(x => x[0] === style)
  const qs = crises.map(k => CRISES.find(c => c[0] === k)[2])
  for (const f of FALLBACK_Q) if (qs.length < 3) qs.push(f)
  const programs = PROGRAMS.filter(p => p.when(crises, grade))
  if (programs.length < 2) programs.push(DEFAULT_PROGRAM)
  const donts = [...DONTS, crises.includes('grade') || crises.includes('exam') ? DONT_STUDY : DONT_MAJOR, style === 'quiet' || style === 'masked' ? DONT_QUIET : DONT_ANX]
  const risk = crises.includes('mood') || RISK_WORDS.some(w => obs.replace(/\s/g, '').includes(w))
  const crisisNames = crises.map(k => CRISES.find(c => c[0] === k)[1])

  const script = [
    '[1단계] 마음 열기',
    `“${s[3]} ${g[3]}”`,
    '',
    '[2단계] 비난 없는 공감과 탐색 질문',
    ...qs.slice(0, 3).map((q, i) => `Q${i + 1}. “${q}”`),
    ...(risk ? ['', '[꼭 확인할 질문] “요즘 너무 힘들어서 스스로를 해치고 싶거나 사라지고 싶다는 생각이 든 적이 있니?”', '  (직접 묻는 것이 위험을 키우지 않습니다. 그렇다고 답하면 아래 위기 대응 순서를 따릅니다.)'] : []),
    '',
    '[3단계] 지지와 다음 약속',
    '“오늘 쉽지 않은 이야기를 솔직하게 들려줘서 정말 고맙다. 지금 겪는 고민은 네가 부족해서가 아니라 성장하면서 누구나 만날 수 있는 과정이야. 오늘 이야기한 것 중 하나부터 가볍게 시도해 보자. [다음 면담 일시]에 잠깐 들러서 어떻게 지냈는지 10분만 이야기하자. 교수님이 끝까지 같이 방법을 찾을게.”',
  ].join('\n')

  const log = [
    `[상담일시 및 대상] ${todayDots()} / 지도학생 (${g[1]}, ${g[2]})`,
    '[상담유형] 진로·학업 위기 예방 및 대학생활 적응 지도상담',
    '',
    '1. 학생 현황 및 주호소 문제',
    `- 주요 호소 영역: ${crisisNames.join(', ')}`,
    `- 사전 관찰 및 특이사항: ${obs.trim() || '최근 학업과 대학생활 적응 과정에서 심리적·학업적 부담을 느끼는 상태로 관찰됨.'}`,
    '',
    '2. 주요 상담 내용 및 학생 반응',
    `- 면담 초기 학생은 '${s[1]}' 특성을 보였으며, 고충을 경청하고 정서적으로 지지하며 라포를 형성함.`,
    '- 어려움의 구체적 원인을 함께 탐색하고, 휴학·학업중단 등 결정에 앞서 활용 가능한 교내 지원 제도를 안내함.',
    ...(risk ? ['- 정서적 위기 신호 여부를 직접 확인함: [학생 응답 기록]'] : []),
    '',
    '3. 지도교수 의견 및 연계 계획',
    `- 연계 권유: ${programs.map(p => `${p.dept} ${p.name}`).join(', ')}`,
    '- 향후 계획: [다음 면담 일시]에 짧은 후속 면담으로 프로그램 신청 여부와 생활 안정도를 재점검할 예정임.',
  ].join('\n')

  return { script, log, programs, donts, risk, coach: s[2] }
}

export default function AdvisingGuide({ app }) {
  const [grade, setGrade] = useState('1학년')
  const [crises, setCrises] = useState(['leave'])
  const [style, setStyle] = useState('quiet')
  const [obs, setObs] = useState('')
  const [res, setRes] = useState(null)
  const [log, setLog] = useState('')
  const pii = findPII(obs)

  function make() {
    if (!crises.length) return
    const r = build({ grade, crises, style, obs })
    setRes(r); setLog(r.log)
  }
  const aiPrompt = useMemo(() => !res ? '' : `학년: ${grade}\n고민 유형: ${crises.map(k => CRISES.find(c => c[0] === k)[1]).join(', ')}\n성향: ${STYLES.find(x => x[0] === style)[1]}\n관찰 메모: ${obs || '없음'}\n\n[규칙 기반 화법 초안]\n${res.script}`, [res, grade, crises, style, obs])

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">학생 이름·학번 없이 상황만 고르세요. 결과는 면담 준비용 참고 자료이며 전문 상담을 대신하지 않습니다.</span>
      </AppHeader>
      <section className="card">
        <ChipGroup label="1. 학년과 시기" options={GRADES.map(([k, n, d]) => [k, n, d])} value={grade} onChange={setGrade} />
        <ChipGroup label="2. 핵심 고민 유형" multi options={CRISES.map(([k, n]) => [k, n])} value={crises} onChange={setCrises} />
        <ChipGroup label="3. 학생 성향과 태도" options={STYLES.map(([k, n]) => [k, n])} value={style} onChange={setStyle} />
        <p className="small muted" style={{ margin: 0 }}>코칭 포인트: {STYLES.find(x => x[0] === style)[2]}</p>
        <Field id="ag-obs" label="4. 관찰한 상황 (선택)" hint="이름, 학번, 연락처는 적지 마세요">
          <TextArea id="ag-obs" rows={4} value={obs} onChange={setObs} placeholder="예: 전공기초 2주 연속 결석 후 휴학 절차를 물어봄. 면담 요청에 '별일 없습니다'라고만 답함." />
        </Field>
        {pii.length > 0 && <Notice tone="bad">개인정보로 보이는 내용({pii.map(p => p.label).join(', ')})이 있습니다. 지우고 상황만 남겨 주세요.</Notice>}
        {!crises.length && <Notice>고민 유형을 하나 이상 골라 주세요.</Notice>}
        <div className="row"><button type="button" className="btn primary" disabled={!crises.length} onClick={make}>면담 준비지 만들기</button></div>
      </section>

      {res && (
        <>
          {res.risk && (
            <section className="card wa-crisis" role="alert">
              <h2>정서적 위기 신호를 먼저 확인하세요</h2>
              <ol className="num-list">
                <li>자해·자살 생각이 있는지 직접, 차분하게 묻습니다.</li>
                <li>위험이 있다고 판단되면 학생을 혼자 두지 말고 [학생상담센터 연락처]에 바로 연계합니다.</li>
                <li>급박한 위험이면 112·119, 상담이 필요하면 자살예방상담전화 109(24시간)를 함께 안내합니다.</li>
                <li>비밀보장보다 안전이 우선이며, 학교 위기 대응 절차에 따라 보고합니다.</li>
              </ol>
            </section>
          )}
          <ResultDoc title="면담 3단계 화법" text={res.script} fileName="면담화법.txt" />
          <section className="card">
            <div className="card-head"><h2>피해야 할 말과 바꿔 말하기</h2></div>
            <div className="table-wrap"><table>
              <thead><tr><th>피할 말</th><th>바꿔 말하기</th></tr></thead>
              <tbody>{res.donts.map(([a, b]) => <tr key={a}><td style={{ color: 'var(--red)' }}>“{a}”</td><td>“{b}”</td></tr>)}</tbody>
            </table></div>
          </section>
          <section className="card">
            <div className="card-head"><h2>교내 지원 연계</h2><span className="muted small">[ ] 부서명은 본교 조직명으로 확인하세요</span></div>
            <ul className="list">{res.programs.map(p => (
              <li key={p.name} style={{ alignItems: 'flex-start' }}><span><b>{p.dept} {p.name}</b><br /><span className="muted small">{p.desc}</span><br /><span className="small">“{p.say}”</span></span><CopyButton text={p.say} /></li>
            ))}</ul>
          </section>
          <ResultDoc title="상담일지 초안" text={log} onChange={setLog} fileName="상담일지_초안.txt" />
          <AiRefine appId="advising-guide" label="지후 AI로 화법 맞춤 다듬기" note="입력한 상황에 맞춰 질문과 지지 문장을 자연스럽게 다듬습니다. 진단이나 판단은 하지 않습니다." prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
