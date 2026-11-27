import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, TextArea, ChipGroup, ResultDoc, AiRefine, Notice } from './kit.jsx'
import { josa } from '../lib/korean.js'
import { DEPTS, deptByName, deptUrl, ADULT_PERKS, ADMISSION_TEL, ADULT_CENTER_TEL, ADULT_URL, PERIODS } from './admission-data.js'

/* 입시 홍보 카드뉴스·숏폼 대본
   기존 앱(V1)은 독자가 수험생·학부모뿐이었고, 학과를 직접 타이핑해야 했으며, 입력과 상관없이
   '취업깡패', '망설이는 순간 정원은 채워집니다' 같은 과장·압박 문구가 들어갔습니다.
   이 버전은 실제 학과 목록에서 고르고, 성인학습자(만학도·재직자) 독자를 따로 두며,
   수치는 입력한 값만 쓰고 비어 있으면 자리표시로 남깁니다. */

const AUDIENCES = [
  ['teen', '고3·수험생', '친근한 말투, 진로 고민'],
  ['parent', '학부모', '안정성·면허·취업'],
  ['adult', '성인학습자', '직장인·만학도·퇴직 예정자'],
  ['mix', '수험생과 학부모', '두 독자를 함께'],
]

const OUTPUTS = [['card', '카드뉴스 5장'], ['short', '숏폼 대본'], ['msg', '안내 문자·게시글'], ['prompt', '이미지·영상 AI 프롬프트']]

const EMPTY = { dept: '시니어운동처방학과', licenses: '', strength: '', outcome: '', careers: '', period: '', contact: '' }

const pick = a => a[Math.floor(Math.random() * a.length)]
const pickN = (a, n) => [...a].sort(() => Math.random() - 0.5).slice(0, n)

// 예시 채우기: 고른 학과는 그대로 두고, 그 학과의 공개 정보 안에서 강점·진로·성과·독자·모집 시기 조합을 바꿉니다.
// 홈페이지에 없는 사실이나 수치(취업률 등)는 지어내지 않습니다.
function sample(deptName, prevStrength) {
  const d = deptByName(deptName) || DEPTS[0]
  const lic = list(d.licenses)
  const car = list(d.careers)
  const pool = [
    ...(d.strengths || []),
    ...lic.map(x => `${x} 취득 준비`),
    ...car.slice(0, 4).map(x => `졸업 후 ${x} 진출`),
  ]
  let strength = ''
  for (let i = 0; i < 5 && (!strength || strength === prevStrength); i++) {
    strength = [pick(d.strengths || pool), ...pickN(pool, 2)].filter((x, k, arr) => arr.indexOf(x) === k).slice(0, 2 + Math.floor(Math.random() * 2)).join(', ')
  }
  const careers = pickN(car, Math.min(car.length, 3 + Math.floor(Math.random() * 3))).join(', ')
  const outcome = pick([
    ...(d.outcomes || []),
    `[대학알리미 공시 취업률과 기준연도], 주요 진출 분야: ${pickN(car, 2).join(', ')}`,
    `졸업생 진출 분야: ${pickN(car, 3).join(', ')}`,
  ])
  const aud = d.adult === 'only' ? 'adult' : pick(d.adult === 'sat' ? ['adult', 'teen', 'parent', 'mix'] : ['teen', 'parent', 'mix'])
  return { aud, v: { ...EMPTY, dept: d.name, ...fill(d.name), careers, strength, outcome, period: pick(PERIODS) } }
}

function fill(dept) {
  const d = deptByName(dept) || {}
  return {
    licenses: d.licenses || '',
    careers: d.careers || '',
    contact: d.tel ? `${dept} ${d.tel}` : ADMISSION_TEL,
  }
}

const list = s => String(s || '').split(/[,，、]/).map(x => x.trim()).filter(Boolean)

function build(v, aud) {
  const d = deptByName(v.dept) || { name: v.dept, years: '' }
  const dept = d.name
  const lic = list(v.licenses)
  const licText = lic.length ? lic.join(', ') : '[취득 면허·자격]'
  const lic1 = lic[0] || '[대표 면허·자격]'
  const strength = v.strength.trim() || '[학과 강점·실습 환경]'
  const outcome = v.outcome.trim() || '[졸업 후 성과(대학알리미 공시 취업률 등)]'
  const careers = list(v.careers)
  const careerText = careers.length ? careers.join(', ') : '[졸업 후 진로]'
  const period = v.period.trim() || '[모집 시기·전형]'
  const contact = v.contact.trim() || ADMISSION_TEL
  const yrs = d.years ? `${d.years}년제` : ''
  const adultDept = d.adult === 'only'
  const sat = d.adult === 'sat'

  // 성인학습자 특전 문장(성인학습자 학과·반일 때만 공식 특전을 씁니다)
  const adultWay = adultDept ? ADULT_PERKS.schedule : sat ? '토요일 수업(성인학습자반)' : '[수업 방식: 야간·주말·온라인 여부]'
  const adultPerk = (adultDept || sat) ? ADULT_PERKS.scholarship : '[장학 혜택: 성인학습자 장학 적용 여부 확인]'
  const noExam = adultDept && /사회복지/.test(licText) ? ` ${ADULT_PERKS.noExam.replace('(사회복지계열만)', '')}으로 사회복지사 2급을 받을 수 있습니다.` : ''

  const T = {
    teen: {
      hook: `${dept}에서 ${lic1}까지, 진로가 보이는 3년`,
      cover: [`어떤 과에 갈지 아직 고민 중이라면`, `${dept}에서 배우는 것과 졸업 후 하는 일을 짧게 정리했어요.`],
      cta: `${period} 모집입니다. 궁금한 건 ${josa(contact, '으로/로')} 편하게 물어보세요.`,
      tone: '밝고 친근한 반말 섞인 존댓말',
    },
    parent: {
      hook: `${dept}, 면허와 진로가 분명한 전공`,
      cover: [`자녀의 전공 선택, 졸업 후 진로까지 함께 보세요`, `${dept}의 교육과정과 취득 면허, 졸업 후 진로를 정리했습니다.`],
      cta: `${period} 모집 일정과 장학 제도는 ${contact}에서 상담받으실 수 있습니다.`,
      tone: '차분하고 신뢰감 있는 존댓말',
    },
    adult: {
      hook: `일하면서 다시 배우는 ${dept}`,
      cover: [`지금 하는 일을 이어 가면서, 다음 일을 준비하세요`, `${ADULT_PERKS.who}. ${dept}${adultDept || sat ? `${josa(dept, '은/는').slice(dept.length)} ${josa(adultWay, '으로/로')} 운영합니다` : '의 성인학습자 지원 방식을 확인해 보세요'}.`],
      cta: `${period} 모집입니다. 수업 시간과 장학은 ${josa(contact + ((adultDept || sat) ? ` 또는 ${ADULT_CENTER_TEL}` : ''), '으로/로')} 문의하세요.`,
      tone: '정중하고 실용적인 존댓말, 직장인의 시간과 비용 고민에 답하는 말투',
    },
    mix: {
      hook: `${dept}, 배우는 것도 졸업 후 길도 분명합니다`,
      cover: [`수험생은 진로를, 학부모님은 안정성을 확인하세요`, `${dept}의 면허, 실습, 졸업 후 진로를 한 번에 정리했습니다.`],
      cta: `${period} 모집입니다. 상담은 ${contact}.`,
      tone: '누구나 읽기 쉬운 존댓말',
    },
  }[aud]

  const slides = [
    ['1장 · 표지', T.cover[0], T.cover[1], aud === 'adult' ? '퇴근길 저녁 캠퍼스나 강의실의 성인 학습자 사진, 큰 제목 한 줄' : '실습 중인 학생 사진 위에 큰 제목 한 줄'],
    aud === 'adult'
      ? ['2장 · 시간과 비용', '일과 공부, 같이 할 수 있을까?', `${josa(adultWay, '으로/로')} 수업합니다. 장학은 ${adultPerk}.`, '요일·시간표 그래픽, 장학 비율은 숫자로 크게']
      : ['2장 · 졸업 후 성과', '졸업 후 어디서 일할까?', `${outcome}. 주요 진로: ${careerText}.`, '공시 수치는 출처(대학알리미, 기준연도)를 작게 표기'],
    ['3장 · 면허·자격', `${yrs ? `${yrs} 과정에서 ` : ''}준비하는 면허·자격`, `${licText}.${aud === 'adult' ? `${noExam} 졸업 후 진로: ${careerText}.` : ''}`, '자격 이름을 목록으로, 국가면허와 민간자격은 구분해 표기'],
    ['4장 · 우리 학과의 강점', '여기서 배우는 방식', strength, '실습실·수업 사진 2~3장, 강점은 짧은 문장 세 줄 이내'],
    ['5장 · 모집 안내', aud === 'adult' ? '지원 자격과 문의' : '모집 안내', aud === 'adult' ? `${ADULT_PERKS.who}. ${T.cta}` : T.cta, '연락처와 입학처 QR, 모집요강 바로가기'],
  ]
  const card = slides.map(([n, h, b, memo]) => `[${n}]\n제목: ${h}\n본문: ${b}\n디자인 메모: ${memo}`).join('\n\n')
    + `\n\n[캡션]\n${T.hook}. ${aud === 'adult' ? `${josa(adultWay, '으로/로')} ${lic1} 준비를 시작해 보세요.` : `${josa(licText, '을/를')} 준비하는 ${josa(dept, '을/를')} 소개합니다.`}\n${tags(dept, aud)}`

  const short = [
    `[30~40초 숏폼 대본 · ${dept} · ${AUDIENCES.find(a => a[0] === aud)[1]}]`,
    `말투: ${T.tone}`,
    '',
    `00~03초 | 화면: ${aud === 'adult' ? '퇴근 후 캠퍼스에 들어서는 학습자 뒷모습' : '실습실 문을 여는 학생'}`,
    `자막·내레이션: "${aud === 'adult' ? `퇴근하고 대학 가는 사람, 여기 있습니다.` : aud === 'teen' ? `${dept} 가면 뭐 배우는지 30초로 알려 줄게요.` : `${dept}, 졸업하면 어떤 일을 할까요?`}"`,
    '',
    `03~15초 | 화면: 수업·실습 장면 2~3컷`,
    `자막·내레이션: "${strength}"`,
    '',
    `15~27초 | 화면: 자격 이름이 차례로 뜨는 그래픽`,
    `자막·내레이션: "${aud === 'adult' ? `${adultWay}. 졸업하면 ${licText}에 도전할 수 있습니다.` : `졸업하면 ${licText}. 진로는 ${careerText}.`}"`,
    '',
    `27~38초 | 화면: 연락처와 QR`,
    `자막·내레이션: "${T.cta}"`,
    '',
    `촬영 메모: 실제 재학생·졸업생이 나오면 출연 동의서를 받습니다. 수치를 말할 때는 화면에 출처를 함께 띄웁니다.`,
  ].join('\n')

  const msg = aud === 'adult'
    ? [
      `[광주보건대 ${dept} 성인학습자 모집]`,
      `${ADULT_PERKS.who}`,
      `· 수업: ${adultWay}`,
      `· 장학: ${adultPerk}`,
      `· 자격: ${licText}`,
      `· 모집: ${period}`,
      `· 문의: ${contact}`,
      '',
      '[지역 커뮤니티·직장 게시판용]',
      `일하면서 ${josa(lic1, '을/를')} 준비하고 싶은 분들께 알려 드립니다. 광주보건대 ${josa(dept, '은/는')} ${adultWay}${(adultDept || sat) ? (josa(adultWay, '으로/로').slice(adultWay.length)) + ' 운영하고, ' + ADULT_PERKS.scholarship + '을 지원합니다' : '에 대해 학과로 문의하시면 안내해 드립니다'}. ${period} 모집이며, 자세한 내용은 ${josa(contact, '으로/로')} 문의해 주세요.`,
    ].join('\n')
    : [
      `[인스타그램·블로그 게시글]`,
      `${T.hook}`,
      '',
      `${dept}에서는 ${strength.replace(/[.。]$/, '')}.`,
      `졸업하면 ${josa(licText, '을/를')} 준비하고, ${careerText} 등으로 진출합니다.`,
      `${T.cta}`,
      '',
      tags(dept, aud),
    ].join('\n')

  const ko = aud === 'adult' ? 'adult learners in their 30s to 50s attending an evening class after work' : 'Korean college students in a hands-on practice lab'
  const prompt = [
    `[포스터 이미지 프롬프트 · 영어로 넣으면 결과가 안정적입니다]`,
    `Editorial-style admissions poster photo for a Korean health university department (${dept}). ${ko}, natural light, real equipment, candid expressions, clean composition with empty space at the top for a Korean headline. No text, no logos, no watermark.`,
    '',
    `[인포그래픽 이미지 프롬프트]`,
    `Flat vector infographic background for a university department poster, calm navy and sky blue palette, simple icons for license, classroom, career path, generous margins for Korean text overlay. No text.`,
    '',
    `[영상 프롬프트 · 5~8초 컷]`,
    `${aud === 'adult' ? 'Evening campus, an adult learner walks into a lit classroom carrying a laptop bag, slow push-in, warm interior light, realistic.' : 'A student in a practice lab adjusts equipment, slow dolly-in, bright realistic lighting, shallow depth of field.'}`,
    '',
    '주의: 실제 학생 얼굴이나 대학 로고를 AI로 만들지 마세요. 실제 사진을 쓸 때는 초상권 동의를 받습니다.',
  ].join('\n')

  return { card, short, msg, prompt }
}

function tags(dept, aud) {
  const base = ['#광주보건대', `#${dept.replace(/\s/g, '')}`, '#광주보건대학교']
  const extra = { teen: ['#수시모집', '#진로고민', '#보건계열'], parent: ['#학과선택', '#국가면허', '#진로설계'], adult: ['#성인학습자', '#만학도', '#직장인대학', '#야간대학'], mix: ['#신입생모집', '#보건계열', '#학과소개'] }[aud]
  return [...base, ...extra].join(' ')
}

export default function AdmissionStudio({ app }) {
  const [v, setV] = useState({ ...EMPTY, ...fill(EMPTY.dept) })
  const [aud, setAud] = useState('adult')
  const [out, setOut] = useState('card')
  const [texts, setTexts] = useState(null)
  const set = k => val => setV(s => ({ ...s, [k]: val }))
  const d = deptByName(v.dept) || {}

  function example() {
    const { aud: a, v: nv } = sample(v.dept, v.strength)
    setV(nv); setAud(a); setTexts(build(nv, a)); setOut('card')
  }

  function pickDept(name) {
    const nd = deptByName(name) || {}
    setV(s => ({ ...s, dept: name, ...fill(name) }))
    if (nd.adult === 'only') setAud('adult')
    setTexts(null)
  }

  const result = useMemo(() => build(v, aud), [v, aud])
  function run() { setTexts(result) }
  const shown = texts?.[out] ?? ''
  const aiPrompt = !texts ? '' : `학과: ${v.dept}\n독자: ${AUDIENCES.find(a => a[0] === aud)[1]}\n자격: ${v.licenses}\n강점: ${v.strength}\n성과: ${v.outcome}\n진로: ${v.careers}\n모집: ${v.period}\n\n[초안]\n${shown}\n\n입력한 사실만 쓰고 수치를 새로 만들지 마세요. 과장·압박 문구(정원 마감 임박, 취업 보장 등) 없이 독자에게 맞는 말투로 다듬어 주세요.`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">학과를 고르면 공개된 학과 정보가 채워집니다. 독자를 고르고 강점을 적으면 카드뉴스, 숏폼 대본, 안내 문자, AI 제작 프롬프트를 만듭니다.</span>
      </AppHeader>

      <section className="card stack">
        <div className="wa-form">
          <div className="field">
            <label htmlFor="ad-dept">학과</label>
            <select id="ad-dept" className="input" value={v.dept} onChange={e => pickDept(e.target.value)}>
              <optgroup label="성인학습자 학과">
                {DEPTS.filter(x => x.adult).map(x => <option key={x.name} value={x.name}>{x.name}{x.adult === 'sat' ? ' (토요일 수업)' : ''}</option>)}
              </optgroup>
              <optgroup label="일반 학과">
                {DEPTS.filter(x => !x.adult).map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
              </optgroup>
            </select>
            <span className="muted small">{d.years ? `${d.years}년제` : ''}{d.quota ? ` · 입학정원 ${d.quota}명` : ''}{d.adult === 'only' ? ' · 성인학습자 전담' : d.adult === 'sat' ? ' · 성인학습자 토요일 수업' : ''}</span>
          </div>
          <Field id="ad-period" label="모집 시기·전형" hint="예: 2027학년도 정시 1.4~1.20, 만학도 및 재직자 전형">
            <TextInput id="ad-period" value={v.period} onChange={set('period')} placeholder="모집요강에서 확인한 일정" />
          </Field>
          <Field id="ad-contact" label="문의처">
            <TextInput id="ad-contact" value={v.contact} onChange={set('contact')} />
          </Field>
        </div>
        <ChipGroup label="누구에게 보낼까요" options={AUDIENCES} value={aud} onChange={a => { setAud(a); setTexts(null) }} />
        {aud === 'adult' && !d.adult && (
          <Notice>{v.dept}는 성인학습자 전담 학과가 아닙니다. 정원 외 ‘만학도 및 재직자’ 전형이 있는지, 수업 시간과 장학이 일반 학생과 같은지 모집요강으로 확인한 뒤 자리표시를 채우세요.</Notice>
        )}
        <div className="wa-form">
          <Field id="ad-lic" label="취득 면허·자격" hint="쉼표로 구분">
            <TextArea id="ad-lic" rows={2} value={v.licenses} onChange={set('licenses')} placeholder="예: 물리치료사 면허" />
          </Field>
          <Field id="ad-career" label="졸업 후 진로" hint="쉼표로 구분">
            <TextArea id="ad-career" rows={2} value={v.careers} onChange={set('careers')} placeholder="예: 병원 재활치료실, 스포츠재활센터" />
          </Field>
          <Field id="ad-str" label="학과 강점·실습 환경">
            <TextArea id="ad-str" rows={3} value={v.strength} onChange={set('strength')} placeholder={d.strengths?.[0] ? `예: ${d.strengths[0]}` : '예: 현장 연계 실습, 졸업생 진로 연계'} />
          </Field>
          <Field id="ad-out" label="졸업 후 성과" hint="수치는 대학알리미 공시값과 기준연도를 함께">
            <TextArea id="ad-out" rows={3} value={v.outcome} onChange={set('outcome')} placeholder="예: 2025년 대학알리미 공시 취업률 ○○%" />
          </Field>
        </div>
        <div className="row">
          <button type="button" className="btn primary" onClick={run}>홍보 초안 만들기</button>
          <button type="button" className="btn" onClick={example}>예시 채우기</button>
          <span className="small muted">고른 학과의 공개 정보로 채우며, 누를 때마다 강점·진로·성과·독자·모집 시기 조합이 바뀝니다. 취업률 같은 수치는 자리표시로 둡니다.</span>
        </div>
        <span className="small muted">학과 정보 출처: <a href={deptUrl(d)} target="_blank" rel="noreferrer">광주보건대 홈페이지 {v.dept} 학과안내</a>, <a href={ADULT_URL} target="_blank" rel="noreferrer">입학안내 「성인학습자 소개」</a>(2026년 11월 27일 확인). 장학·수업 방식·모집 인원은 해마다 바뀌므로 모집요강으로 다시 확인하세요.</span>
      </section>

      {texts && (
        <>
          <section className="card stack">
            <ChipGroup label="볼 결과" options={OUTPUTS} value={out} onChange={setOut} />
            {/\[[^\]]+\]/.test(shown.replace(/^\[[^\]\n]*\]$/gm, '')) && <Notice>대괄호로 남은 자리는 입력하지 않은 정보입니다. 채운 뒤 게시하세요.</Notice>}
          </section>
          <ResultDoc key={out + aud} title={OUTPUTS.find(o => o[0] === out)[1]} text={shown} onChange={t => setTexts(s => ({ ...s, [out]: t }))} fileName={`${v.dept}_${OUTPUTS.find(o => o[0] === out)[1]}.txt`} />
          <AiRefine appId="admission-studio" prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
