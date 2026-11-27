import { useMemo, useState } from 'react'
import { AppHeader, Field, TextArea, ChipGroup, ResultDoc, AiRefine, Notice } from './kit.jsx'
import { searchArticles } from '../lib/rules.js'
import { findPII } from '../lib/privacy.js'
import { RegLibrary, useRegs, allArticles } from './regs.jsx'

/* 학내 민원·학부모 문의 응대 스크립트
   기존 앱(V1)의 4단계 구성(공감, 규정 근거, 대안, 마무리)과 교직원 보호 멘트를 옮겼습니다.
   기존 앱은 올린 규정과 상관없이 '6분의 5', '4분의 3' 같은 수치를 고정 문장에 넣었으나,
   이 버전은 실제로 찾은 조항 원문을 근거로 붙이고 수치는 조항에서만 인용하도록 바꿨습니다. */

const WHO = [['parent', '학부모', '학부모님'], ['student', '재학생·휴학생', '학생'], ['external', '외부인·기타', '선생님']]
const CHANNEL = [['phone', '전화'], ['visit', '대면'], ['written', '이메일·게시판']]
const MOOD = [['calm', '차분함'], ['upset', '억울함·속상함'], ['angry', '격앙·강한 항의']]

// [키, 이름, 찾는 낱말, 공감 문장, 원칙 문장, 대안 목록, 담당 부서]
const CATS = [
  ['scholarship', '장학금 탈락·기준', '장학 성적우수 평점 선발 수혜 절사 이수학점',
    '한 학기 동안 성실히 공부하며 좋은 결과를 기대하셨을 텐데, 근소한 차이로 장학금 대상에서 제외되어 아쉬움이 크실 마음에 깊이 공감합니다.',
    '장학금은 모든 학생에게 같은 기준으로 배분되어야 하는 공적 재원이어서, 사전에 공고된 규정에 따라 선발하고 있습니다. 기준에 미치지 못한 경우 담당 부서가 임의로 예외를 적용하기 어려운 점 양해 부탁드립니다.',
    ['성적 외 요건으로 선발하는 교내 장학금(가계곤란·근로·비교과 등) 안내', '한국장학재단 국가장학금 신청 일정 안내', '다음 학기 선발 기준(이수학점·평점) 미리 안내'], '[장학 담당 부서]'],
  ['grade', '성적 평가·이의신청', '성적 이의신청 정정 평가 공시 열람',
    '한 학기 동안 수업과 시험을 준비하며 기울인 노력을 생각하면, 기대와 다른 성적에 속상하고 답답하신 마음이 충분히 이해됩니다.',
    '성적 정정은 규정에 정해진 기간과 절차에 따라, 출석·시험·과제 산출에 객관적인 착오가 확인된 경우에만 가능합니다. 장학금이나 개인 사정을 이유로 한 정정은 어려운 점 양해 부탁드립니다.',
    ['성적 공시 기간 내 담당 교수 이의신청 방법 안내', '성적 산출 내역(반영 비율) 열람 방법 안내', '학습 지원 프로그램(튜터링 등) 안내'], '[학사 담당 부서]'],
  ['tuition', '등록금 납부·반환', '등록금 반환 환불 납부 개시일 자퇴',
    '어려운 결정 끝에 학적 변동을 진행하시면서 반환 금액에 차이가 생겨 부담과 아쉬움이 크실 마음에 공감합니다.',
    '등록금 반환은 담당자가 임의로 정하는 것이 아니라, 반환 사유가 생긴 날을 기준으로 규정에 정해진 비율에 따라 일괄 처리됩니다.',
    ['서류 접수일이 반환 기준일이 되므로 결정하셨다면 바로 접수하시도록 안내', '학업을 이어 가실 경우 분할납부·학자금 대출·국가장학금 안내'], '[등록 담당 부서]'],
  ['attendance', '출석·학사경고', '출석 결석 학사경고 유급 수업시간',
    '불가피한 사정으로 출석에 어려움을 겪으시면서 성적과 학사 처리 결과 때문에 걱정이 많으실 마음에 공감합니다.',
    '출석과 학사경고 기준은 학점 인정의 공정성을 위해 규정으로 정해져 있어, 사후에 임의로 출석을 인정하거나 성적을 부여하기 어렵습니다.',
    ['규정이 인정하는 공결 사유와 증빙 제출 기한 안내', '재이수(다음 학기·계절학기)로 평점을 회복하는 방법 안내', '학습·상담 지원 프로그램 안내'], '[학사 담당 부서]'],
  ['leave', '휴학·복학·자퇴', '휴학 복학 자퇴 제적 일반휴학 입대휴학',
    '학업 계획과 진로를 고민하며 학적 변동을 준비하시는 과정에서 절차와 기준 때문에 막막하고 염려되시는 마음에 공감합니다.',
    '휴학·복학·자퇴는 학적 관리의 형평성을 위해 규정에 정해진 기간과 절차에 따라 허가됩니다. 정해진 연한이나 서류 요건을 넘으면 승인이 제한되는 점 양해 부탁드립니다.',
    ['질병 등 사유가 증빙되면 적용될 수 있는 다른 휴학 유형 안내', '복학 신청 기간과 미복학 시 처리 안내', '자퇴 전 학생상담·학업 지원 상담 연계'], '[학사 담당 부서]'],
]

// 예시 민원(가상): 누를 때마다 다른 사례로 채웁니다
const SAMPLES = [
  { who: 'parent', channel: 'phone', mood: 'angry', cat: 'scholarship', summary: '평점 3.48로 기준 3.50에 0.02점 모자라 성적장학금에서 탈락. 반올림해서 선발해 달라고 요구.' },
  { who: 'student', channel: 'written', mood: 'upset', cat: 'grade', summary: '기말 과제 점수가 반영되지 않은 것 같다며 성적 정정을 요청. 성적 공시 기간은 지난 상태.' },
  { who: 'parent', channel: 'visit', mood: 'upset', cat: 'tuition', summary: '개강 5주 차에 자퇴 서류를 냈는데 반환액이 생각보다 적다며 전액 반환을 요구.' },
  { who: 'student', channel: 'phone', mood: 'calm', cat: 'attendance', summary: '아르바이트 때문에 결석이 많아 학사경고를 받았다. 출석을 인정받을 방법이 있는지 문의.' },
  { who: 'external', channel: 'written', mood: 'calm', cat: 'leave', summary: '직장인 학생의 보호자라고 밝히며 출장 때문에 학기 중 휴학이 가능한지 문의.' },
  { who: 'student', channel: 'visit', mood: 'angry', cat: 'scholarship', summary: '근로장학생 선발에서 떨어졌는데 기준을 공개하지 않았다며 항의.' },
]

const MOOD_LINE = {
  calm: '먼저 확인해 주셔서 감사합니다. 대학의 공식 기준을 차근차근 설명해 드리겠습니다.',
  upset: '말씀하신 사정을 충분히 이해합니다. 대학이 어떤 원칙으로 처리하고 있는지 투명하게 말씀드리겠습니다.',
  angry: '얼마나 속상하셨으면 이렇게 직접 말씀하셨을지 무겁게 받아들이고 있습니다. 잠시만 제 설명을 들어 주시면 감사하겠습니다.',
}

function build({ who, channel, mood, cat, summary, articles }) {
  const [, , call] = WHO.find(w => w[0] === who)
  const c = CATS.find(x => x[0] === cat)
  const found = searchArticles(articles, `${c[2]} ${summary}`, 2)
  const top = found[0]
  const open = channel === 'written'
    ? '안녕하십니까. 광주보건대학교 [담당 부서]입니다.\n대학에 관심을 갖고 의견을 주셔서 감사드립니다.\n\n'
    : channel === 'phone' ? '(차분한 어조로, 말씀을 끊지 않고 끝까지 들은 뒤)\n\n' : '(눈을 맞추고, 규정 출력물을 함께 보며)\n\n'
  const close = channel === 'written'
    ? `\n\n추가로 궁금하신 점은 ${c[6]}로 문의해 주시면 안내해 드리겠습니다.\n감사합니다.\n\n광주보건대학교 [담당 부서] 드림`
    : channel === 'phone' ? `\n\n추가 절차는 ${c[6]}로 연락 주시면 정확히 안내해 드리겠습니다. 전화 주셔서 감사합니다.` : `\n\n추가 절차는 ${c[6]}로 연락 주시면 정확히 안내해 드리겠습니다. 직접 와 주셔서 감사합니다.`

  const stage1 = `${open}“${call}, ${c[3]} ${MOOD_LINE[mood]}”`
  const stage2 = top
    ? `“${call}, ${c[4]}”\n\n[근거] ${top.source} ${top.no}(${top.title})\n${top.body.trim()}`
    : `“${call}, ${c[4]}”\n\n[근거] 올린 규정에서 관련 조항을 찾지 못했습니다. 안내 전에 [규정명·조항]을 확인해 넣어 주세요.`
  const stage3 = `“그 대신 지금 도움이 될 수 있는 방법을 안내해 드리겠습니다.”\n${c[5].map((t, i) => `${'①②③④'[i]} ${t}`).join('\n')}`
  const stage4 = `“다시 한번 이해해 주셔서 감사드립니다. 대학은 모든 학생이 공정한 기준 아래 공부할 수 있도록 최선을 다하겠습니다.”${close}`
  const protect = mood === 'angry'
    ? `“${call}, 속상하신 마음은 충분히 이해합니다. 다만 폭언이나 욕설이 계속되면 산업안전보건법의 고객응대근로자 보호 조치와 대학 민원 응대 지침에 따라 상담을 종료할 수밖에 없습니다. 차분히 말씀해 주시면 끝까지 성실히 안내해 드리겠습니다.”`
    : ''
  // 개인정보: 학부모·외부인에게 학생 성적·학적 정보를 알릴 때는 본인 동의나 법령 근거가 필요합니다.
  const privacy = who === 'student'
    ? '· 학생 본인인지 학번과 이름 등 기관이 정한 방법으로 확인한 뒤 개인 정보를 안내합니다.\n· 전화로는 본인 확인이 어려우면 포털 확인이나 방문을 안내합니다.'
    : '· 성적, 출석, 장학, 징계 같은 학생 개인 정보는 학생 본인의 동의나 법령 근거 없이 학부모·외부인에게 알리지 않습니다(성인 학생 포함).\n· "학생 본인이 함께 문의하시거나, 본인 동의서를 제출하시면 자세히 안내해 드리겠습니다"처럼 절차를 안내합니다.\n· 일반 기준과 절차(규정 내용)는 안내해도 되지만, 특정 학생의 결과는 확인해 주지 않습니다.'
  const full = ['[1단계 공감]', stage1, '', '[2단계 규정 근거]', stage2, '', '[3단계 대안]', stage3, '', '[4단계 마무리]', stage4, ...(protect ? ['', '[교직원 보호 멘트]', protect] : []), '', '[개인정보 보호와 본인 확인 점검]', privacy, '· 통화·상담 내용은 부서 지침에 따라 기록하고, 약속한 회신 기한을 지킵니다.'].join('\n')
  return { full, top, found }
}

export default function ComplaintScript({ app }) {
  const [regs, setRegs] = useRegs()
  const [who, setWho] = useState('parent')
  const [channel, setChannel] = useState('phone')
  const [mood, setMood] = useState('upset')
  const [cat, setCat] = useState('scholarship')
  const [summary, setSummary] = useState('')
  const [res, setRes] = useState(null)
  const [text, setText] = useState('')
  const pii = findPII(summary)
  const articles = allArticles(regs)

  const [si, setSi] = useState(-1)
  function sample() {
    let i = Math.floor(Math.random() * SAMPLES.length); if (i === si) i = (i + 1) % SAMPLES.length
    const x = SAMPLES[i]; setSi(i); setWho(x.who); setChannel(x.channel); setMood(x.mood); setCat(x.cat); setSummary(x.summary); setRes(null)
  }
  function make() {
    const r = build({ who, channel, mood, cat, summary, articles })
    setRes(r); setText(r.full)
  }
  const aiPrompt = useMemo(() => !res ? '' : `역할: 대학 행정부서의 민원 응대 코치입니다.\n지킬 것: [근거] 안의 조항 원문과 숫자는 그대로 두기, 규정에 없는 예외·약속("검토해서 해 드리겠다") 만들지 않기, 민원인을 탓하는 말 쓰지 않기, 존댓말.\n출력: ① 다듬은 4단계 스크립트(말하듯 자연스럽게) ② 민원인이 다시 따질 만한 질문 3개와 답 ③ 상급자에게 넘길 기준 한 줄\n\n민원인: ${WHO.find(w => w[0] === who)[1]}, 채널: ${CHANNEL.find(c => c[0] === channel)[1]}, 감정: ${MOOD.find(m => m[0] === mood)[1]}\n분야: ${CATS.find(c => c[0] === cat)[1]}\n민원 요지: ${summary || '없음'}\n\n[규칙 기반 스크립트]\n${text}`, [res, who, channel, mood, cat, summary, text])

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">민원인의 이름·학번·연락처는 넣지 마세요. 규정 근거는 올린 규정에서만 찾습니다.</span>
      </AppHeader>
      <RegLibrary regs={regs} setRegs={setRegs} />
      <section className="card">
        <div className="card-head"><h2>민원 상황</h2></div>
        <ChipGroup label="민원인" options={WHO.map(([k, n]) => [k, n])} value={who} onChange={setWho} />
        <ChipGroup label="응대 경로" options={CHANNEL} value={channel} onChange={setChannel} />
        <ChipGroup label="감정 상태" options={MOOD} value={mood} onChange={setMood} />
        <ChipGroup label="민원 분야" options={CATS.map(([k, n]) => [k, n])} value={cat} onChange={setCat} />
        <Field id="cs-sum" label="민원 요지" hint="예: 평점 3.48로 0.02점 차이로 장학금 탈락, 반올림 요청">
          <TextArea id="cs-sum" rows={3} value={summary} onChange={setSummary} placeholder="어떤 내용을 요구하는지 짧게 적어 주세요." />
        </Field>
        {pii.length > 0 && <Notice tone="bad">개인정보로 보이는 내용({pii.map(p => p.label).join(', ')})이 있습니다. 지우고 요지만 남겨 주세요.</Notice>}
        <div className="row"><button type="button" className="btn primary" onClick={make}>응대 스크립트 만들기</button><button type="button" className="btn" onClick={sample}>예시 채우기</button><span className="small muted">누를 때마다 다른 가상 민원으로 채웁니다.</span></div>
      </section>
      {res && (
        <>
          {!res.top && <Notice tone="bad">올린 규정에서 이 분야의 조항을 찾지 못했습니다. 규정 근거 없이 안내하지 않도록 해당 규정을 먼저 올려 주세요.</Notice>}
          {res.top && regs.find(r => r.name === res.top.source)?.sample && <Notice>근거 조항이 예시 규정에서 나왔습니다. 실제 응대 전에 본교 규정으로 바꿔 주세요.</Notice>}
          <ResultDoc title="4단계 응대 스크립트" text={text} onChange={setText} fileName="민원응대_스크립트.txt" />
          <AiRefine appId="complaint-script" label="지후 AI로 상황 맞춤 다듬기" note="민원 요지에 맞춰 문장을 자연스럽게 다듬습니다. 규정 근거 문장과 수치는 바꾸지 않습니다." prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
