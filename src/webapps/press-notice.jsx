import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, TextArea, ChipGroup, ResultDoc, AiRefine, Notice } from './kit.jsx'
import { josa, particle, purpose, stripEventVerb, todayDots } from '../lib/korean.js'

/* 보도자료·공지사항·알림 문자·SNS 게시글 초안
   - 글 종류: 행사 사전 안내, 행사 결과(사후 보도), 협약 체결, 수상·선정
   - 제목 4가지 유형(사실형, 의미형, 인용형, 숫자형)
   - 리드문(핵심 한 문장) → 배경·의미 → 세부 내용 → 인용 → 향후 계획 → 문의 순의 보도자료 구조
   - 예시 채우기는 누를 때마다 다른 사례로 채웁니다(모두 가상의 예시이므로 실제 정보로 바꿔 씁니다). */

const EMPTY = { kind: 'event', org: '광주보건대학교', dept: '', who: '', partner: '', target: '', when: '', where: '', what: '', why: '', how: '', result: '', next: '', apply: '', quote: '', speaker: '', contact: '' }

const KINDS = [
  ['event', '행사 사전 안내', '개최 예정'],
  ['result', '행사 결과', '마친 뒤 보도'],
  ['mou', '협약 체결', '기관 간 협약'],
  ['award', '수상·선정', '사업 선정, 상 수상'],
]

// 가상의 예시(누를 때마다 바뀝니다). 실제 일정·이름·수치는 반드시 바꿔 씁니다.
const SAMPLES = [
  { kind: 'event', dept: '산학협력단', who: 'LINC 3.0 사업단', target: '재학생과 지역 보건의료기관 관계자', when: '2026. 12. 3.(목) 14:00~17:00', where: '본관 3층 대강당', what: '지역사회 보건의료 산학협력 성과확산 포럼', why: '지역 보건의료 인재 양성 성과를 공유하고 산학 네트워크를 넓히기 위해', how: '기조강연, 우수사례 발표, 산학협력 성과 전시', apply: '12. 1.(화)까지 QR 사전신청, 당일 현장 접수 가능', speaker: '산학협력단장', quote: '이번 포럼이 대학과 지역 의료기관이 함께 성장하는 자리가 되길 기대한다', next: '포럼에서 나온 제안은 내년 현장실습 협력 과제에 반영할 계획이다' },
  { kind: 'result', dept: '시니어운동처방학과', who: '시니어운동처방학과', target: '지역 어르신 40명', when: '2026. 11. 20.(금)', where: '광주 북구 스마트케어빌리지', what: '어르신 낙상예방 운동교실', why: '지역 어르신의 낙상 위험을 줄이고 학생들의 현장 지도 역량을 높이기 위해', how: '체력 측정, 균형 운동 지도, 가정 운동 안내', result: '참여 어르신 40명이 체력 측정과 균형 운동 지도를 받았다', speaker: '시니어운동처방학과장', quote: '학생들이 배운 운동처방을 지역 어르신께 직접 돌려드린 뜻깊은 시간이었다', next: '참여 어르신을 대상으로 3개월 뒤 재측정을 진행할 예정이다' },
  { kind: 'mou', dept: '대외협력처', partner: '[협약 기관명]', target: '재학생', when: '2026. 12. 10.(목)', where: '본관 총장실', what: '보건의료 인재 양성 업무협약', why: '현장 중심 실습과 졸업생 취업 연계를 강화하기 위해', how: '현장실습 기관 제공, 공동 교육과정 개발, 취업 연계, 기자재·시설 공동 활용', speaker: '총장', quote: '지역 의료현장이 요구하는 인재를 함께 길러 내겠다', next: '양 기관은 실무협의체를 꾸려 내년 1학기부터 공동 프로그램을 운영할 계획이다' },
  { kind: 'award', dept: 'AI대학혁신본부', who: 'AI대학혁신본부', target: '', when: '2026. 11.', where: '', what: '[사업·상 이름]', why: '대학 전 분야에 AI 활용 교육을 확산한 성과를 인정받아', how: 'AI 활용 교과목 운영, 교직원 AI 연수, 학생 AI 서포터즈 활동', result: '[선정·수상 내용, 지원 규모]', speaker: 'AI대학혁신본부장', quote: 'Saving Lives with AI라는 대학의 방향을 구성원 모두가 함께 실천한 결과다', next: '선정을 계기로 학과별 AI 활용 교육을 더 넓혀 갈 계획이다' },
  { kind: 'event', dept: '입학처', who: '입학처', target: '고3 수험생과 학부모, 성인학습자', when: '2026. 12. 19.(토) 10:00~12:00', where: '임마누엘관 1층', what: '2027학년도 정시 입학설명회', why: '정시 모집 전형과 학과별 특징을 자세히 안내하기 위해', how: '정시 전형 안내, 학과별 상담 부스, 캠퍼스 투어', apply: '입학처 홈페이지 사전 신청(현장 접수 가능)', speaker: '입학처장', quote: '수험생과 가족이 궁금한 점을 직접 묻고 답을 얻어 가는 자리가 되도록 준비했다', next: '' },
]

const TONES = [['press', '언론 보도체', '~했다, ~이다'], ['polite', '안내 경어체', '~합니다']]
const datePart = s => (s.match(/\d{1,2}\.\s*\d{1,2}\.(\([^)]+\))?/) || [''])[0]
const has = s => !!(s || '').trim()

function build(v, tone) {
  const press = tone === 'press'
  const end = (p, q) => (press ? p : q)
  const org = v.org.trim() || '[기관명]'
  const unit = has(v.dept) ? `${org} ${v.dept.trim()}` : org
  const event = stripEventVerb(v.what) || '[행사·사업명]'
  const host = v.who.trim() || unit
  const partner = v.partner.trim() || '[협약 기관명]'
  const target = v.target.trim()
  const when = v.when.trim() || '[일시]'
  const where = v.where.trim()
  const why = purpose(v.why) || '[추진 목적을 위해]'
  const whyRaw = v.why.trim().replace(/[.。]+$/, '') || '[선정 이유]'
  const polite = t => t.replace(/했다$/, '했습니다').replace(/았다$/, '았습니다').replace(/었다$/, '었습니다').replace(/이다$/, '입니다')
  const how = v.how.trim() || '[주요 내용]'
  const items = how.split(/[,，]/).map(x => x.trim()).filter(Boolean)
  const contact = v.contact.trim() || `${unit} [담당자·연락처]`
  const speaker = has(v.speaker) ? `${org} ${v.speaker.trim()}` : `${org} 관계자`
  const quote = v.quote.trim().replace(/[.。"”]+$/, '') || `[인용할 말씀]`
  const result = v.result.trim().replace(/[.。]+$/, '')
  const next = v.next.trim().replace(/[.。]+$/, '')
  const nums = (v.result + ' ' + v.target).match(/\d[\d,]*\s?(명|개|곳|건|%|억|만)/)
  const at = [when, where].filter(Boolean).join(' ')
  const tgt = target ? `${josa(target, '을/를')} 대상으로 ` : ''

  // 리드문: 기사 첫 문장(누가, 언제, 어디서, 무엇을)
  const lead = {
    event: end(`${josa(org, '은/는')} ${at}에서 ${tgt}‘${event}’${particle(event, '을/를')} 연다고 밝혔다.`, `${josa(org, '은/는')} ${at}에서 ${tgt}‘${event}’${particle(event, '을/를')} 엽니다.`),
    result: end(`${josa(org, '은/는')} ${at}에서 ${tgt}‘${event}’${particle(event, '을/를')} 열었다고 밝혔다.`, `${josa(org, '은/는')} ${at}에서 ${tgt}‘${event}’${particle(event, '을/를')} 열었습니다.`),
    mou: end(`${josa(org, '은/는')} ${when} ${josa(partner, '과/와')} ‘${event}’${particle(event, '을/를')} 맺었다고 밝혔다.`, `${josa(org, '은/는')} ${when} ${josa(partner, '과/와')} ‘${event}’${particle(event, '을/를')} 맺었습니다.`),
    award: end(`${josa(org, '이/가')} ‘${event}’에 선정됐다.`, `${josa(org, '이/가')} ‘${event}’에 선정되었습니다.`),
  }[v.kind]

  const middle = {
    event: [
      end(`이번 행사는 ${why} 마련됐다. ${josa(host, '이/가')} 주관하며, ${items.join(', ')} 순으로 진행된다.`, `이번 행사는 ${why} 마련했습니다. ${josa(host, '이/가')} 주관하며, ${items.join(', ')} 순으로 진행합니다.`),
      has(v.apply) ? end(`참가 신청은 다음과 같이 받는다(${v.apply.trim()}).`, `참가 신청은 다음과 같이 받습니다(${v.apply.trim()}).`) : '',
    ],
    result: [
      end(`이번 행사는 ${why} ${josa(host, '이/가')} 마련했다.`, `이번 행사는 ${why} ${josa(host, '이/가')} 마련했습니다.`),
      end(`행사는 ${items.join(', ')} 순으로 진행됐으며, ${result || '[참여 인원과 주요 성과]'}.`, `행사는 ${items.join(', ')} 순으로 진행되었으며, ${result || '[참여 인원과 주요 성과]'}.`),
    ],
    mou: [
      end(`이번 협약은 ${why} 추진됐다.`, `이번 협약은 ${why} 추진했습니다.`),
      end(`협약에 따라 두 기관은 ▲${items.join(' ▲')} 등에 협력한다.`, `협약에 따라 두 기관은 ▲${items.join(' ▲')} 등에 협력합니다.`),
    ],
    award: [
      end(`${josa(org, '은/는')} ${whyRaw} 이번에 선정됐다. ${result ? result + '.' : '[선정·수상 내용과 지원 규모].'}`, `${josa(org, '은/는')} ${whyRaw} 이번에 선정되었습니다. ${result ? polite(result) + '.' : '[선정·수상 내용과 지원 규모].'}`),
      end(`그동안 ▲${items.join(' ▲')} 등을 추진해 왔다.`, `그동안 ▲${items.join(' ▲')} 등을 추진해 왔습니다.`),
    ],
  }[v.kind].filter(Boolean)

  const verb = { event: '개최', result: '성료', mou: /협약$/.test(event) ? '체결' : '협약 체결', award: '선정' }[v.kind]
  const first = items[0] || ''
  const headlines = [
    `${org}, ‘${event}’ ${verb}`,
    v.kind === 'mou' ? `${org}·${partner}, ${first ? first + ' 등 ' : ''}손잡는다` : v.kind === 'award' ? `${org}, ‘${event}’ 선정… ${first || '그동안의'} 성과 인정` : `${org}, ${first ? first + '부터 ' : ''}‘${event}’${v.kind === 'result' ? '로 지역과 함께' : ' 연다'}`,
    has(v.quote) ? `“${quote.slice(0, 26)}${quote.length > 26 ? '…' : ''}” ${org} ‘${event}’` : `${org}${has(v.dept) ? ' ' + v.dept.trim() : ''}, ${datePart(when) || when} ‘${event}’ ${verb}`,
    nums ? `${org}, ${nums[0]} 함께한 ‘${event}’` : `${org}, ‘${event}’ ${verb}… ${items.slice(0, 2).join('·')}`,
  ]

  const subs = [
    ...(v.kind === 'event' || v.kind === 'result' ? [`- ${[at, target ? `${target} 대상` : ''].filter(Boolean).join(', ')}`] : []),
    v.kind === 'mou' ? `- ${items.slice(0, 3).join(', ')} 등 협력` : `- ${items.slice(0, 3).join(', ')}`,
  ]

  const pressBody = title => [
    '[보도자료]',
    `배포일 ${todayDots()} | 보도 가능 시점 즉시 | 담당 ${unit} | 문의 ${contact}`,
    '',
    title,
    ...subs,
    '',
    lead,
    '',
    ...middle.flatMap(p => [p, '']),
    end(`${josa(speaker, '은/는')} “${quote}”라고 말했다.`, `${josa(speaker, '은/는')} “${quote}”라고 전했습니다.`),
    ...(next ? ['', end(`${next}.`, `${next.replace(/계획이다$/, '계획입니다').replace(/예정이다$/, '예정입니다').replace(/한다$/, '합니다')}.`)] : []),
    '',
    '[붙임] 사진 1부(사진 설명: [누가, 무엇을 하는 장면]).  끝.',
  ].join('\n')

  const notice = [
    `[${v.kind === 'result' ? '결과' : '안내'}] ${event}${v.kind === 'event' && has(v.apply) ? ' 참가 신청' : ''} ${v.kind === 'result' ? '결과 안내' : '안내'}`,
    `작성 ${unit} | 게시일 ${todayDots()}`,
    '',
    v.kind === 'result'
      ? `안녕하십니까, ${unit}입니다.\n${why} 진행한 ‘${event}’${particle(event, '을/를')} 아래와 같이 마쳤습니다. 함께해 주신 모든 분께 감사드립니다.`
      : `안녕하십니까, ${unit}입니다.\n${why} 아래와 같이 ‘${event}’${particle(event, '을/를')} ${v.kind === 'mou' ? '체결하였기에 알려 드립니다' : '진행하오니 많은 관심과 참여 바랍니다'}.`,
    '',
    `1. 명    칭: ${event}`,
    `2. 일    시: ${when}`,
    ...(where ? [`3. 장    소: ${where}`] : []),
    ...(target ? [`${where ? 4 : 3}. 대    상: ${target}`] : []),
    `${3 + (where ? 1 : 0) + (target ? 1 : 0)}. 주요 내용: ${items.join(', ')}`,
    ...(v.kind === 'result' && result ? [`${4 + (where ? 1 : 0) + (target ? 1 : 0)}. 결    과: ${result}`] : []),
    ...(v.kind === 'event' && has(v.apply) ? [`${4 + (where ? 1 : 0) + (target ? 1 : 0)}. 신청 방법: ${v.apply.trim()}`] : []),
    `문의: ${contact}`,
    '',
    unit,
  ].join('\n')

  const sms = [
    `[${org}] ${event} ${v.kind === 'result' ? '결과' : '안내'}`,
    v.kind === 'event' ? `${at}` : null,
    v.kind === 'event' && target ? `대상: ${target}` : null,
    v.kind === 'event' && has(v.apply) ? `신청: ${v.apply.trim()}` : null,
    v.kind === 'result' ? `${result ? polite(result) : '[결과 한 줄]'}. 함께해 주셔서 감사합니다.` : null,
    v.kind === 'mou' ? `${josa(partner, '과/와')} ${items.slice(0, 2).join('·')} 등에 협력합니다.` : null,
    v.kind === 'award' ? `${result || '[선정 내용]'}` : null,
    `문의: ${contact}`,
  ].filter(Boolean).join('\n')

  const sns = [
    v.kind === 'event' ? `📣 ${event} 안내` : v.kind === 'result' ? `🙌 ${event}, 함께해 주셔서 감사합니다` : v.kind === 'mou' ? `🤝 ${josa(partner, '과/와')} 손잡았습니다` : `🏅 ${event} 선정`,
    '',
    v.kind === 'event' ? `${why.replace(/위해$/, '위해')} ${event}${particle(event, '을/를')} 준비했어요.` : v.kind === 'result' ? `${result ? polite(result) : '[결과 한 줄]'}.` : v.kind === 'mou' ? `${items.slice(0, 3).join(', ')}까지, 학생들의 배움이 현장으로 이어지도록 함께합니다.` : `${whyRaw} 이번에 선정되었습니다.`,
    '',
    ...(v.kind === 'event' ? [`🗓 ${when}`, ...(where ? [`📍 ${where}`] : []), ...(target ? [`👥 ${target}`] : []), ...(has(v.apply) ? [`✍️ ${v.apply.trim()}`] : []), ''] : []),
    `#${org.replace(/\s/g, '')} #${event.replace(/\s/g, '').slice(0, 20)}${has(v.dept) ? ' #' + v.dept.trim().replace(/\s/g, '') : ''} #SavingLivesWithAI`,
  ].join('\n')

  return { headlines, pressBody, notice, sms, sns }
}

export default function PressNotice({ app }) {
  const [v, setV] = useState(EMPTY)
  const [tone, setTone] = useState('press')
  const [made, setMade] = useState(null)
  const [pick, setPick] = useState(0)
  const [edit, setEdit] = useState({})
  const [si, setSi] = useState(-1)
  const set = k => val => setV(s => ({ ...s, [k]: val }))
  const need = v.kind === 'mou' ? ['what', 'when', 'partner'] : v.kind === 'award' ? ['what'] : ['what', 'when', 'where']
  const missing = need.filter(k => !has(v[k]))

  function sample() {
    let i = Math.floor(Math.random() * SAMPLES.length)
    if (i === si) i = (i + 1) % SAMPLES.length
    setSi(i); setV({ ...EMPTY, ...SAMPLES[i], contact: `${SAMPLES[i].dept} [담당자] (062-958-0000)` }); setMade(null)
  }
  function make() {
    const r = build(v, tone)
    setMade(r); setPick(0)
    setEdit({ press: r.pressBody(r.headlines[0]), notice: r.notice, sms: r.sms, sns: r.sns })
  }
  function choose(i) { setPick(i); setEdit(e => ({ ...e, press: made.pressBody(made.headlines[i]) })) }

  const aiPrompt = useMemo(() => !made ? '' : [
    `역할: 대학 홍보팀의 보도자료 담당자입니다. 아래 입력과 규칙 기반 초안을 기자가 그대로 받아쓸 수 있는 수준으로 다듬어 주세요.`,
    `글 종류: ${KINDS.find(k => k[0] === v.kind)[1]} / 문체: ${tone === 'press' ? '언론 보도체(~했다)' : '안내 경어체(~합니다)'}`,
    '지킬 것: 입력에 없는 수치·이름·일정을 만들지 않기, 리드문 한 문장에 누가·언제·어디서·무엇을 담기, 과장 표현(최초·최고·대성황) 쓰지 않기, 대괄호 자리표시는 그대로 두기.',
    '출력: ① 제목 3개(사실형·의미형·인용형) ② 보도자료 본문 ③ 사진 설명 한 줄',
    '[입력]', ...Object.entries(v).filter(([k, x]) => k !== 'kind' && has(x)).map(([k, x]) => `${k}: ${x}`),
    '[보도자료 초안]', edit.press || '',
  ].join('\n'), [made, v, tone, edit])

  const showPartner = v.kind === 'mou'
  const showResult = v.kind === 'result' || v.kind === 'award'

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">글 종류를 고르고 핵심 정보를 적으면 보도자료, 교내 공지, 알림 문자, SNS 게시글을 함께 만듭니다. 결과 칸에서 바로 고칠 수 있습니다.</span>
      </AppHeader>

      <section className="card stack">
        <div className="card-head"><h2>1. 글 종류와 핵심 정보</h2><button type="button" className="btn app-open" onClick={sample}>예시 채우기</button></div>
        <ChipGroup label="글 종류" options={KINDS} value={v.kind} onChange={k => { setV(s => ({ ...s, kind: k })); setMade(null) }} />
        <div className="wa-form">
          <Field id="pn-org" label="기관" required><TextInput id="pn-org" value={v.org} onChange={set('org')} placeholder="광주보건대학교" /></Field>
          <Field id="pn-dept" label="담당 부서·학과"><TextInput id="pn-dept" value={v.dept} onChange={set('dept')} placeholder="산학협력단" /></Field>
          <Field id="pn-what" label={v.kind === 'award' ? '사업·상 이름' : v.kind === 'mou' ? '협약 이름' : '행사 이름'} required hint="끝의 '개최'는 빼고 적어도 됩니다"><TextInput id="pn-what" value={v.what} onChange={set('what')} placeholder={v.kind === 'mou' ? '보건의료 인재 양성 업무협약' : '성과확산 포럼'} /></Field>
          {showPartner
            ? <Field id="pn-partner" label="협약 기관" required><TextInput id="pn-partner" value={v.partner} onChange={set('partner')} placeholder="○○병원" /></Field>
            : <Field id="pn-who" label="주관"><TextInput id="pn-who" value={v.who} onChange={set('who')} placeholder="LINC 3.0 사업단" /></Field>}
          <Field id="pn-when" label="언제" required={v.kind !== 'award'}><TextInput id="pn-when" value={v.when} onChange={set('when')} placeholder="2026. 12. 3.(목) 14:00~17:00" /></Field>
          <Field id="pn-where" label="어디서"><TextInput id="pn-where" value={v.where} onChange={set('where')} placeholder="본관 3층 대강당" /></Field>
          <Field id="pn-target" label="대상·참여 인원"><TextInput id="pn-target" value={v.target} onChange={set('target')} placeholder="재학생과 지역 주민 100명" /></Field>
          {v.kind === 'event' && <Field id="pn-apply" label="신청 방법"><TextInput id="pn-apply" value={v.apply} onChange={set('apply')} placeholder="12. 1.(화)까지 QR 사전신청" /></Field>}
        </div>
        <Field id="pn-why" label="왜 (목적·배경)"><TextInput id="pn-why" value={v.why} onChange={set('why')} placeholder="지역 보건의료 인재 양성 성과를 공유하기 위해" /></Field>
        <Field id="pn-how" label={v.kind === 'mou' ? '협력 내용' : v.kind === 'award' ? '그동안의 성과' : '주요 프로그램'} hint="쉼표로 구분"><TextArea id="pn-how" rows={2} value={v.how} onChange={set('how')} placeholder="기조강연, 우수사례 발표, 성과 전시" /></Field>
        {showResult && <Field id="pn-result" label={v.kind === 'award' ? '선정·수상 내용' : '결과(참여 인원, 성과)'} hint="실제 수치만 적습니다"><TextInput id="pn-result" value={v.result} onChange={set('result')} placeholder="참여 어르신 40명이 체력 측정을 받았다" /></Field>}
        <div className="wa-form">
          <Field id="pn-speaker" label="인용할 사람 직함"><TextInput id="pn-speaker" value={v.speaker} onChange={set('speaker')} placeholder="산학협력단장" /></Field>
          <Field id="pn-contact" label="문의처"><TextInput id="pn-contact" value={v.contact} onChange={set('contact')} placeholder="산학협력단 홍길동 (062-958-0000)" /></Field>
        </div>
        <Field id="pn-quote" label="인용 코멘트" hint="본인 확인을 받은 말만 씁니다"><TextArea id="pn-quote" rows={2} value={v.quote} onChange={set('quote')} placeholder="비워 두면 자리표시로 남습니다" /></Field>
        <Field id="pn-next" label="향후 계획"><TextInput id="pn-next" value={v.next} onChange={set('next')} placeholder="내년 1학기부터 공동 프로그램을 운영할 계획이다" /></Field>
        <ChipGroup label="문체" options={TONES} value={tone} onChange={setTone} />
        {missing.length > 0 && <span className="small muted">필수 항목을 비우면 [ ] 자리표시로 남습니다.</span>}
        <div className="row"><button type="button" className="btn primary" onClick={make}>초안 만들기</button></div>
      </section>

      {made && (
        <>
          <section className="card">
            <div className="card-head"><h2>2. 보도자료 제목 고르기</h2><span className="small muted">사실형 · 의미형 · 인용형 · 숫자형</span></div>
            <div className="wa-chips">{made.headlines.map((h, i) => <button key={h + i} type="button" className={pick === i ? 'wa-chip on' : 'wa-chip'} aria-pressed={pick === i} onClick={() => choose(i)}><b>{h}</b></button>)}</div>
          </section>
          <ResultDoc title="보도자료" text={edit.press} onChange={t => setEdit(e => ({ ...e, press: t }))} fileName="보도자료_초안.txt" />
          <ResultDoc title="교내 공지" text={edit.notice} onChange={t => setEdit(e => ({ ...e, notice: t }))} fileName="공지_초안.txt" />
          <ResultDoc title="알림 문자" text={edit.sms} onChange={t => setEdit(e => ({ ...e, sms: t }))} fileName="알림문자.txt" />
          {edit.sms.length > 90 && <span className="small muted">알림 문자 {edit.sms.length}자: 90자를 넘으면 장문(LMS)으로 발송됩니다.</span>}
          <ResultDoc title="SNS 게시글" text={edit.sns} onChange={t => setEdit(e => ({ ...e, sns: t }))} fileName="SNS_게시글.txt" />
          <Notice>배포 전 날짜·요일, 장소, 신청 기한, 연락처, 인용한 분의 확인 여부를 원 계획과 대조하세요. 사진은 초상권 동의를 받은 것만 씁니다.</Notice>
          <AiRefine appId="press-notice" prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
