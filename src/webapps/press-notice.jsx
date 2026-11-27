import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, TextArea, ChipGroup, ResultDoc, AiRefine, Notice } from './kit.jsx'
import { josa, particle, purpose, stripEventVerb, todayDots } from '../lib/korean.js'

/* 보도자료·공지사항·알림 문자 초안
   기존 앱(Gemini 제작 V2)의 육하원칙 입력과 두 문서 양식을 바탕으로
   조사 처리, '개최' 반복 방지, 알림 문자 요약, 바로 고치는 편집 칸을 더했습니다. */

const EMPTY = { org: '', dept: '', who: '', target: '', when: '', where: '', what: '', why: '', how: '', apply: '', quote: '', speaker: '', contact: '' }
const SAMPLE = {
  org: '광주보건대학교', dept: '산학협력단', who: 'LINC 3.0 사업단', target: '재학생과 지역 보건의료기관 관계자',
  when: '2026. 12. 3.(목) 14:00~17:00', where: '본관 3층 대강당', what: '지역사회 보건의료 산학협력 성과확산 포럼',
  why: '지역 보건의료 인재 양성 성과를 공유하고 산학 네트워크를 넓히기 위해', how: '기조강연, 우수사례 발표, 산학협력 성과 전시',
  apply: '12. 1.(화)까지 QR 사전신청, 당일 현장 접수 가능', quote: '이번 포럼이 대학과 지역 의료기관이 함께 성장하는 자리가 되길 기대한다', speaker: '산학협력단장',
  contact: '산학협력단 [담당자] (062-958-7500)',
}

const TONES = [['press', '언론 보도체', '~했다, ~이다'], ['polite', '안내 경어체', '~합니다']]

const datePart = s => (s.match(/\d{1,2}\.\s*\d{1,2}\.(\([^)]+\))?/) || [''])[0]

function build(v, tone) {
  const org = v.org.trim() || '[기관명]'
  const unit = v.dept.trim() ? `${org} ${v.dept.trim()}` : org
  const event = stripEventVerb(v.what) || '[행사명]'
  const host = v.who.trim() || unit
  const target = v.target.trim() || '[참여 대상]'
  const when = v.when.trim() || '[일시]'
  const where = v.where.trim() || '[장소]'
  const why = purpose(v.why) || '[추진 목적을 위해]'
  const how = v.how.trim() || '[주요 프로그램]'
  const contact = v.contact.trim() || `${unit} [담당자·연락처]`
  const speaker = v.speaker.trim() ? `${org} ${v.speaker.trim()}` : `${org} 관계자`
  const quote = v.quote.trim().replace(/[.。"”]+$/, '') || `이번 ${event}가 참여자 모두에게 실질적인 도움이 되길 바란다`
  const press = tone === 'press'

  const first = how.split(',')[0].trim()
  const headlines = [
    `${org}, ‘${event}’ 개최`,
    `${org}, ‘${event}’ 연다…${first} 등 마련`,
    `${org}${v.dept.trim() ? ' ' + v.dept.trim() : ''}, ${datePart(when) || when} ‘${event}’ 개최`,
  ]

  const pressBody = (title) => [
    `[보도자료]`,
    `배포일 ${todayDots()} | 담당 ${unit} | 문의 ${contact}`,
    '',
    title,
    `- ${when}, ${where}에서 ${target} 대상으로 진행`,
    `- ${how} 등으로 구성`,
    '',
    press
      ? `${josa(org, '은/는')} ${when} ${where}에서 ${josa(target, '을/를')} 대상으로 ‘${event}’${particle(event, '을/를')} 개최한다고 밝혔다.`
      : `${josa(org, '은/는')} ${when} ${where}에서 ${josa(target, '을/를')} 대상으로 ‘${event}’${particle(event, '을/를')} 개최합니다.`,
    '',
    press
      ? `이번 행사는 ${why} 마련됐다. ${josa(host, '이/가')} 주관하며 ${how} 등의 프로그램으로 진행된다.`
      : `이번 행사는 ${why} 마련되었습니다. ${josa(host, '이/가')} 주관하며 ${how} 등의 프로그램으로 진행됩니다.`,
    ...(v.apply.trim() ? ['', `참가 신청 안내: ${v.apply.trim()}`] : []),
    '',
    press ? `${josa(speaker, '은/는')} “${quote}”라고 말했다.` : `${josa(speaker, '은/는')} “${quote}”라고 전했습니다.`,
    '',
    press ? `자세한 내용은 ${contact}로 문의하면 된다.` : `자세한 내용은 ${contact}로 문의해 주시기 바랍니다.`,
    '',
    '[붙임] 행사 사진 및 참고자료 1부.  끝.',
  ].join('\n')

  const notice = [
    `[안내] ${event} ${v.apply.trim() ? '참가 신청 ' : ''}안내`,
    `작성 ${unit} | 게시일 ${todayDots()}`,
    '',
    press
      ? `${unit}에서는 ${why} 아래와 같이 ‘${event}’${particle(event, '을/를')} 개최한다. 많은 관심과 참여를 바란다.`
      : `안녕하십니까, ${unit}입니다.\n${why} 아래와 같이 ‘${event}’${particle(event, '을/를')} 개최하오니 많은 관심과 참여를 바랍니다.`,
    '',
    '1. 행 사 명: ' + event,
    '2. 일    시: ' + when,
    '3. 장    소: ' + where,
    '4. 대    상: ' + target,
    '5. 주요 내용: ' + how,
    ...(v.apply.trim() ? ['6. 신청 방법: ' + v.apply.trim(), '7. 문 의 처: ' + contact] : ['6. 문 의 처: ' + contact]),
    '',
    unit,
  ].join('\n')

  const sms = [
    `[${org}] ${event} 안내`,
    `${when} / ${where}`,
    `대상: ${target}`,
    v.apply.trim() ? `신청: ${v.apply.trim()}` : null,
    `문의: ${contact}`,
  ].filter(Boolean).join('\n')

  return { headlines, pressBody, notice, sms }
}

export default function PressNotice({ app }) {
  const [v, setV] = useState(EMPTY)
  const [tone, setTone] = useState('press')
  const [made, setMade] = useState(null)
  const [pick, setPick] = useState(0)
  const [edit, setEdit] = useState({})
  const set = k => val => setV(s => ({ ...s, [k]: val }))
  const missing = ['org', 'what', 'when', 'where'].filter(k => !v[k].trim())

  function make() {
    const r = build(v, tone)
    setMade(r); setPick(0)
    setEdit({ press: r.pressBody(r.headlines[0]), notice: r.notice, sms: r.sms })
  }
  function choose(i) { setPick(i); setEdit(e => ({ ...e, press: made.pressBody(made.headlines[i]) })) }

  const aiPrompt = useMemo(() => !made ? '' : [
    '다음 입력과 규칙 기반 초안을 바탕으로 보도자료, 교내 공지, 200자 이내 알림 문자를 다듬어 주세요.',
    `문체: ${tone === 'press' ? '언론 보도체' : '안내 경어체'}`,
    '[입력]', ...Object.entries(v).filter(([, x]) => x.trim()).map(([k, x]) => `${k}: ${x}`),
    '[보도자료 초안]', edit.press || '', '[공지 초안]', edit.notice || '',
  ].join('\n'), [made, v, tone, edit])

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">보도자료, 교내 공지, 알림 문자를 함께 만들고 결과 칸에서 바로 고칠 수 있습니다.</span>
      </AppHeader>

      <section className="card">
        <div className="card-head"><h2>1. 핵심 정보</h2><button type="button" className="btn app-open" onClick={() => setV(SAMPLE)}>예시 채우기</button></div>
        <div className="wa-form">
          <Field id="pn-org" label="기관" required><TextInput id="pn-org" value={v.org} onChange={set('org')} placeholder="광주보건대학교" /></Field>
          <Field id="pn-dept" label="담당 부서"><TextInput id="pn-dept" value={v.dept} onChange={set('dept')} placeholder="산학협력단" /></Field>
          <Field id="pn-what" label="무엇을 (행사·사업명)" required hint="끝의 '개최'는 빼고 적어도 됩니다"><TextInput id="pn-what" value={v.what} onChange={set('what')} placeholder="성과확산 포럼" /></Field>
          <Field id="pn-who" label="누가 (주최·주관)"><TextInput id="pn-who" value={v.who} onChange={set('who')} placeholder="LINC 3.0 사업단" /></Field>
          <Field id="pn-when" label="언제" required><TextInput id="pn-when" value={v.when} onChange={set('when')} placeholder="2026. 12. 3.(목) 14:00~17:00" /></Field>
          <Field id="pn-where" label="어디서" required><TextInput id="pn-where" value={v.where} onChange={set('where')} placeholder="본관 3층 대강당" /></Field>
          <Field id="pn-target" label="참여 대상"><TextInput id="pn-target" value={v.target} onChange={set('target')} placeholder="재학생과 지역 주민" /></Field>
          <Field id="pn-apply" label="신청 방법"><TextInput id="pn-apply" value={v.apply} onChange={set('apply')} placeholder="12. 1.(화)까지 QR 사전신청" /></Field>
        </div>
        <Field id="pn-why" label="왜 (목적)"><TextInput id="pn-why" value={v.why} onChange={set('why')} placeholder="지역 보건의료 인재 양성 성과를 공유하기 위해" /></Field>
        <Field id="pn-how" label="어떻게 (주요 프로그램)"><TextArea id="pn-how" rows={2} value={v.how} onChange={set('how')} placeholder="기조강연, 우수사례 발표, 성과 전시" /></Field>
        <div className="wa-form">
          <Field id="pn-speaker" label="인용할 사람 직함"><TextInput id="pn-speaker" value={v.speaker} onChange={set('speaker')} placeholder="산학협력단장" /></Field>
          <Field id="pn-contact" label="문의처"><TextInput id="pn-contact" value={v.contact} onChange={set('contact')} placeholder="산학협력단 홍길동 (062-958-0000)" /></Field>
        </div>
        <Field id="pn-quote" label="인용 코멘트"><TextArea id="pn-quote" rows={2} value={v.quote} onChange={set('quote')} placeholder="비워 두면 기본 문장을 넣습니다" /></Field>
        <ChipGroup label="문체" options={TONES} value={tone} onChange={setTone} />
        {missing.length > 0 && <span className="small muted">필수 항목을 비우면 [ ] 자리표시로 남습니다.</span>}
        <div className="row"><button type="button" className="btn primary" onClick={make}>초안 만들기</button></div>
      </section>

      {made && (
        <>
          <section className="card">
            <div className="card-head"><h2>2. 보도자료 제목 고르기</h2></div>
            <div className="wa-chips">{made.headlines.map((h, i) => <button key={h} type="button" className={pick === i ? 'wa-chip on' : 'wa-chip'} aria-pressed={pick === i} onClick={() => choose(i)}><b>{h}</b></button>)}</div>
          </section>
          <ResultDoc title="보도자료" text={edit.press} onChange={t => setEdit(e => ({ ...e, press: t }))} fileName="보도자료_초안.txt" />
          <ResultDoc title="교내 공지" text={edit.notice} onChange={t => setEdit(e => ({ ...e, notice: t }))} fileName="공지_초안.txt" />
          <ResultDoc title="알림 문자" text={edit.sms} onChange={t => setEdit(e => ({ ...e, sms: t }))} fileName="알림문자.txt" />
          {edit.sms.length > 200 && <Notice>알림 문자가 200자를 넘습니다. 카카오 알림톡이나 문자로 보낼 때는 줄여 주세요.</Notice>}
          <Notice>배포 전 날짜·요일, 장소, 신청 기한, 연락처를 원 계획과 대조하세요.</Notice>
          <AiRefine appId="press-notice" prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
