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

function PressNotice({ app, switcher }) {
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
      {switcher}

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

/* ── 행정 문서 변환: 회의록 → 실행과제, 행사 기록 → 결과보고서 ── */
const MODES = [['press', '보도자료·공지'], ['meeting', '회의록 → 실행과제'], ['report', '행사 기록 → 결과보고서']]

export default function AdminDocs({ app }) {
  const [mode, setMode] = useState('press')
  const switcher = <section className="card"><ChipGroup label="만들 문서" options={MODES} value={mode} onChange={setMode} /></section>
  if (mode === 'press') return <PressNotice app={app} switcher={switcher} />
  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">{mode === 'meeting' ? '회의 메모나 녹취 텍스트를 붙여 넣으면 안건별 논의, 결정 사항, 담당·기한이 있는 실행과제 표로 정리합니다.' : '행사 운영 결과를 넣으면 정량·정성 성과와 환류 계획이 있는 개조식 결과보고서를 만듭니다.'}</span>
      </AppHeader>
      {switcher}
      {mode === 'meeting' ? <MeetingTool /> : <ReportTool />}
    </>
  )
}

const DECIDE = /(의결|결정|확정|승인|합의|하기로\s?함|하기로\s?했|가결)/
const TODO = /(까지|담당|하기로|요청|검토|준비|제출|공지|보고|작성|확인|추진|안내|송부|회신)/
const WHO_RE = /([가-힣A-Za-z]{1,10}(?:팀|과|처|실|부|센터|본부|단|교수|팀장|과장|처장|실장|센터장|담당|위원장|간사))/
const WHEN_RE = /(\d{1,2}\s*월\s*(?:초|중순|말)|\d{1,2}\s*[./월]\s*\d{1,2}\s*일?(?:\s*\([월화수목금토일]\))?|이번\s?주|다음\s?주|금주|차주|이번\s?달|다음\s?달|[월화수목금]요일|학기\s?초|학기\s?말)/

const MEETING_SAMPLES = [
  `[안건 1] 2027학년도 신입생 AI 기초교육
- 2월 23~24일 대강당에서 운영하기로 결정함
- 교육 내용은 AI대학혁신본부가 1월 15일까지 초안 작성
- 학생지원팀은 1월 말까지 신입생 안내 문자 발송 준비
[안건 2] 교내 LLM 도입
- 보안 검토가 필요하다는 의견이 있었음
- 전산팀이 다음 주까지 개인정보 처리 기준 검토 후 보고
- 도입 범위는 다음 회의에서 다시 논의`,
  `[안건 1] 강의평가 결과 환류
- 학과별 CQI 보고서를 12월 20일까지 교무처에 제출하기로 함
- 교수학습지원센터가 작성 양식을 이번 주 안에 공지
[안건 2] 겨울방학 비교과 프로그램
- 자격증 과정 2개 개설 승인
- 모집 공고는 학생지원팀 담당
- 예산 배분은 기획처와 협의 필요`,
]

function MeetingTool() {
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const [who, setWho] = useState('')
  const [text, setText] = useState('')
  const [made, setMade] = useState(false)
  const [si, setSi] = useState(-1)
  const res = useMemo(() => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const agenda = []
    let cur = { name: '기타', items: [] }
    for (const l of lines) {
      const m = l.match(/^\[?\s*안건\s*\d*\s*\]?\s*[:.]?\s*(.*)$/) || l.match(/^#+\s*(.*)$/)
      if (m && /안건|^#/.test(l)) { if (cur.items.length || cur.name !== '기타') agenda.push(cur); cur = { name: (m[1] || l).replace(/^\]\s*/, '').trim() || l, items: [] }; continue }
      cur.items.push(l.replace(/^[-·•*]\s*/, ''))
    }
    if (cur.items.length || cur.name !== '기타') agenda.push(cur)
    const decisions = [], todos = []
    for (const a of agenda) for (const it of a.items) {
      if (DECIDE.test(it)) decisions.push(`${a.name}: ${it}`)
      if (TODO.test(it) && !/다시 논의|의견이 있었/.test(it) && !(DECIDE.test(it) && !/담당|까지|제출|작성|준비|보고/.test(it))) todos.push({ what: it.replace(/\s*(함|임)\.?$/, ''), who: it.match(WHO_RE)?.[1] || '[미정]', when: it.match(WHEN_RE)?.[1] || '[미정]', from: a.name })
    }
    const next = agenda.flatMap(a => a.items.filter(i => /다음\s?회의|다시\s?논의|추후|보류/.test(i)).map(i => `${a.name}: ${i}`))
    return { agenda, decisions, todos, next }
  }, [text])
  const doc = !made ? '' : [
    `[회의록] ${title || '[회의명]'}`,
    `· 일시: ${when || '[일시]'}`, `· 참석: ${who || '[참석자(직위)]'}`, '',
    '1. 안건별 논의', ...res.agenda.flatMap((a, i) => [`  ${i + 1}) ${a.name}`, ...a.items.map(x => `    - ${x}`)]), '',
    '2. 결정 사항', ...(res.decisions.length ? res.decisions.map(x => `  · ${x}`) : ['  · 결정 사항으로 보이는 문장을 찾지 못함 [확인 필요]']), '',
    '3. 실행과제', ...(res.todos.length ? res.todos.map((t, i) => `  ${i + 1}. ${t.what} | 담당: ${t.who} | 기한: ${t.when}`) : ['  · 실행과제로 보이는 문장을 찾지 못함']), '',
    '4. 다음 회의 안건', ...(res.next.length ? res.next.map(x => `  · ${x}`) : ['  · 없음']),
  ].join('\n')
  const notice = !made ? '' : `[${title || '회의'} 후속 조치 안내]\n${when ? `${when} 회의 결과, ` : ''}아래 실행과제를 공유드립니다.\n${res.todos.map((t, i) => `${i + 1}. ${t.what} (담당 ${t.who}, 기한 ${t.when})`).join('\n')}\n담당과 기한이 [미정]인 항목은 회신 부탁드립니다.`
  const aiPrompt = !made ? '' : `역할: 대학 위원회 간사입니다.\n지킬 것: 회의에서 나오지 않은 결정·담당·기한을 만들지 않기, [미정]은 그대로, 개조식(~함, ~임).\n출력: ① 다듬은 회의록 ② 실행과제 표(번호/할 일/담당/기한) ③ 참석자에게 보낼 후속 메일\n\n${doc}`
  return (
    <>
      <section className="card">
        <div className="grid">
          <Field id="mt-t" label="회의명"><TextInput id="mt-t" value={title} onChange={setTitle} placeholder="예: 교무위원회" /></Field>
          <Field id="mt-w" label="일시"><TextInput id="mt-w" value={when} onChange={setWhen} placeholder="예: 2026. 11. 27.(금) 14:00" /></Field>
        </div>
        <Field id="mt-p" label="참석자" hint="이름 대신 직위로 써도 됩니다"><TextInput id="mt-p" value={who} onChange={setWho} /></Field>
        <Field id="mt-x" label="회의 메모·녹취" hint="[안건 1]처럼 안건을 구분하면 더 잘 나눕니다"><TextArea id="mt-x" rows={10} value={text} onChange={setText} /></Field>
        <div className="row">
          <button type="button" className="btn primary" disabled={!text.trim()} onClick={() => setMade(true)}>회의록 정리하기</button>
          <button type="button" className="btn" onClick={() => { let i = (si + 1) % MEETING_SAMPLES.length; setSi(i); setText(MEETING_SAMPLES[i]); setTitle(i ? '교무위원회' : 'AI대학혁신본부 운영회의'); setWhen('2026. 11. 27.(금) 14:00'); setWho('본부장, 각 팀장'); setMade(false) }}>예시 채우기</button>
        </div>
      </section>
      {made && <>
        {res.todos.some(t => t.who === '[미정]' || t.when === '[미정]') && <Notice>담당이나 기한이 회의 메모에 없는 실행과제는 [미정]으로 남겼습니다.</Notice>}
        <ResultDoc title="회의록" text={doc} fileName={`${title || '회의'}_회의록.txt`} />
        <ResultDoc title="후속 조치 안내(메일·메신저)" text={notice} fileName="후속조치_안내.txt" />
        <AiRefine appId="press-notice" label="지후 AI로 회의록 다듬기" note="회의에 없던 결정이나 담당을 만들지 않고 문장만 다듬습니다." prompt={aiPrompt} />
      </>}
    </>
  )
}

const POS_RE = /좋|유익|만족|도움|재밌|재미|감사|최고|알차|유용/
const NEG_RE = /아쉽|부족|어렵|길|짧|불편|많|늦|개선|했으면|좋겠|바랍/
const REPORT_SAMPLES = [
  { name: '2026 AI 활용 비교과 특강', when: '2026. 11. 20.(목) 15:00~17:00', where: '본관 대강당', who: '재학생', plan: '60', came: '54', sat: '4.6', resp: '48', budgetPlan: '1200000', budgetUsed: '1080000', comments: '실습이 있어서 유익했어요\n프롬프트 작성법이 도움이 됐습니다\n시간이 짧아서 아쉬웠어요\n자료를 미리 받았으면 좋겠습니다' },
  { name: '지역 어르신 건강체력 측정의 날', when: '2026. 10. 15.(수) 10:00~16:00', where: '스마트케어빌리지', who: '지역 어르신', plan: '80', came: '93', sat: '4.8', resp: '70', budgetPlan: '', budgetUsed: '', comments: '결과를 바로 알려 줘서 좋았어요\n학생들이 친절했습니다\n기다리는 시간이 길었어요' },
]

function ReportTool() {
  const E = { name: '', when: '', where: '', who: '', plan: '', came: '', sat: '', resp: '', budgetPlan: '', budgetUsed: '', comments: '' }
  const [v, setV] = useState(E)
  const [made, setMade] = useState(false)
  const [si, setSi] = useState(-1)
  const set = k => x => setV(s => ({ ...s, [k]: x }))
  const num = x => (String(x).trim() === '' ? null : Number(String(x).replace(/[^\d.]/g, '')))
  const plan = num(v.plan), came = num(v.came), sat = num(v.sat), resp = num(v.resp), bp = num(v.budgetPlan), bu = num(v.budgetUsed)
  const cm = v.comments.split(/\r?\n/).map(x => x.trim()).filter(Boolean)
  const pos = cm.filter(c => POS_RE.test(c) && !/아쉽|좋겠/.test(c)), neg = cm.filter(c => NEG_RE.test(c) && !pos.includes(c))
  const doc = !made ? '' : [
    `[결과보고] ${v.name || '[사업명]'}`, '',
    '1. 추진 개요',
    `  가. 일시: ${v.when || '[일시]'}`, `  나. 장소: ${v.where || '[장소]'}`, `  다. 대상: ${v.who || '[대상]'}`, '',
    '2. 운영 실적(정량)',
    `  가. 참여: 계획 ${plan ?? '[ ]'}명 대비 ${came ?? '[ ]'}명 참여${plan && came != null ? `(달성률 ${Math.round((came / plan) * 1000) / 10}%)` : ''}`,
    `  나. 만족도: ${sat != null ? `5점 만점 ${sat}점` : '[ ]'}${resp != null ? `(응답 ${resp}명${came ? `, 응답률 ${Math.round((resp / came) * 1000) / 10}%` : ''})` : ''}`,
    ...(bp != null || bu != null ? [`  다. 예산: 계획 ${bp != null ? bp.toLocaleString() : '[ ]'}원 대비 ${bu != null ? bu.toLocaleString() : '[ ]'}원 집행${bp && bu != null ? `(집행률 ${Math.round((bu / bp) * 1000) / 10}%)` : ''}`] : []),
    '',
    '3. 운영 성과(정성)',
    ...(pos.length ? pos.map(c => `  · 참여자 의견: "${c}"`) : ['  · [정성 성과 입력]']),
    '',
    '4. 개선 사항 및 환류 계획',
    ...(neg.length ? neg.map(c => `  · "${c}" → [다음 운영 시 개선 방법]`) : ['  · 특이 개선 요청 없음']),
    ...(plan && came != null && came / plan < 0.8 ? ['  · 참여율이 계획의 80%에 못 미침 → 홍보 시기와 경로 점검'] : []),
    ...(plan && came != null && came / plan > 1.1 ? ['  · 참여 인원이 계획을 넘음 → 다음 운영 시 정원·공간 확대 검토'] : []),
    '',
    '붙임: 참석자 명단, 만족도 설문 결과, 사진 각 1부.',
  ].join('\n')
  const aiPrompt = !made ? '' : `역할: 대학 사업 성과관리 담당자입니다.\n지킬 것: 숫자와 비율은 바꾸지 않기, 의견 원문에 없는 성과를 만들지 않기, [ ] 칸은 그대로, 개조식(~함, ~임).\n출력: ① 다듬은 결과보고서 ② 개선 사항별 구체적 환류 방법 ③ 보도자료용 한 문단\n\n${doc}`
  return (
    <>
      <section className="card">
        <Field id="rp-n" label="사업·행사명"><TextInput id="rp-n" value={v.name} onChange={set('name')} /></Field>
        <div className="grid">
          <Field id="rp-w" label="일시"><TextInput id="rp-w" value={v.when} onChange={set('when')} /></Field>
          <Field id="rp-p" label="장소"><TextInput id="rp-p" value={v.where} onChange={set('where')} /></Field>
          <Field id="rp-t" label="대상"><TextInput id="rp-t" value={v.who} onChange={set('who')} /></Field>
        </div>
        <div className="grid">
          <Field id="rp-pl" label="계획 인원"><TextInput id="rp-pl" inputMode="numeric" value={v.plan} onChange={set('plan')} /></Field>
          <Field id="rp-c" label="참여 인원"><TextInput id="rp-c" inputMode="numeric" value={v.came} onChange={set('came')} /></Field>
          <Field id="rp-s" label="만족도(5점 만점)"><TextInput id="rp-s" inputMode="decimal" value={v.sat} onChange={set('sat')} /></Field>
          <Field id="rp-r" label="설문 응답 수"><TextInput id="rp-r" inputMode="numeric" value={v.resp} onChange={set('resp')} /></Field>
          <Field id="rp-bp" label="예산 계획(원, 선택)"><TextInput id="rp-bp" inputMode="numeric" value={v.budgetPlan} onChange={set('budgetPlan')} /></Field>
          <Field id="rp-bu" label="집행액(원, 선택)"><TextInput id="rp-bu" inputMode="numeric" value={v.budgetUsed} onChange={set('budgetUsed')} /></Field>
        </div>
        <Field id="rp-cm" label="주관식 의견" hint="한 줄에 하나"><TextArea id="rp-cm" rows={5} value={v.comments} onChange={set('comments')} /></Field>
        <div className="row">
          <button type="button" className="btn primary" onClick={() => setMade(true)}>결과보고서 만들기</button>
          <button type="button" className="btn" onClick={() => { let i = (si + 1) % REPORT_SAMPLES.length; setSi(i); setV({ ...E, ...REPORT_SAMPLES[i] }); setMade(false) }}>예시 채우기</button>
          <span className="small muted">예시는 가상 수치입니다.</span>
        </div>
      </section>
      {made && <>
        <ResultDoc title="결과보고서" text={doc} fileName={`${v.name || '행사'}_결과보고.txt`} />
        <AiRefine appId="press-notice" label="지후 AI로 결과보고서 다듬기" note="숫자는 그대로 두고 문장과 환류 방법을 다듬습니다." prompt={aiPrompt} />
      </>}
    </>
  )
}
