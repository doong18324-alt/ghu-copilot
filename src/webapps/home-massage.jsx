import { useEffect, useMemo, useRef, useState } from 'react'
import { AppHeader, ChipGroup, ResultDoc, AiRefine, Notice } from './kit.jsx'

/* 가족 맞춤 안전 홈 안마·스트레칭
   기존 앱(V2)은 한의학 혈자리 이름과 "임신 중 자궁 수축 유발" 같은 근거가 약한 금기를 기준으로 삼았습니다.
   이 버전은 근육 위치(해부학) 기준으로 바꾸고, 안마를 하면 안 되는 위험 신호를 먼저 거릅니다.
   일반 건강 정보이며 진료·물리치료를 대신하지 않습니다. */

const WHO = [['senior', '부모님(고령)'], ['adult', '배우자·성인'], ['teen', '수험생·청소년']]
const PARTS = [['neck', '뒷목·어깨 윗부분'], ['shoulder', '어깨·날개뼈'], ['back', '허리·엉덩이'], ['thigh', '허벅지·무릎 주변'], ['calf', '종아리·발바닥'], ['arm', '팔뚝·손'], ['head', '관자놀이·눈 주변']]
const FEEL = [['stiff', '뭉치고 뻐근함'], ['sitting', '오래 앉아 묵직함'], ['standing', '오래 서서 붓고 당김'], ['joint', '관절 주변이 뻣뻣함']]
const COND = [['oa', '퇴행성 관절염'], ['ra', '류마티스 관절염'], ['osteo', '골다공증'], ['disc', '목·허리 디스크'], ['htn', '고혈압·심장질환'], ['dm', '당뇨병'], ['vein', '하지정맥류'], ['blood', '피를 묽게 하는 약 복용'], ['preg', '임신 중']]

// 하나라도 해당하면 안마하지 말고 진료를 먼저 받습니다
const RED = [
  ['fever', '열이 나거나 몸살 기운이 있다'],
  ['hot', '아픈 관절이나 부위가 붓고 뜨겁고 빨갛다'],
  ['dvt', '한쪽 종아리만 붓고 누르면 아프다'],
  ['injury', '최근 넘어지거나 부딪힌 뒤 아프기 시작했다'],
  ['nerve', '팔다리가 저리거나 힘이 빠진다'],
  ['night', '쉬어도 아프고 밤에 더 아프다'],
  ['chest', '가슴 통증, 숨참, 어지럼이 함께 있다'],
]

// 부위별 근육(해부학 위치 기준). [이름, 위치, 방법, 시간, 표시]
const MUSCLE = {
  neck: [['위등세모근(승모근 윗부분)', '목 뿌리와 어깨 끝 사이 두툼한 근육', '뒤에 서서 손바닥 전체로 감싸 쥐었다 놓기를 천천히', '30초씩 2번', 'spine'], ['목 뒤 근육', '뒷머리 아래에서 목 뒤 양옆으로 세로로 만져지는 근육', '엄지를 빼고 네 손가락 끝으로 작은 원을 그리며 아래로 내려오기', '30초', 'neckFront']],
  shoulder: [['날개뼈 안쪽 근육(마름근)', '척추와 날개뼈 안쪽 모서리 사이', '엎드리거나 앉아서 손바닥 아랫부분으로 위에서 아래로 쓸어내리기', '30초씩 2번', 'spine'], ['어깨 바깥 근육(삼각근)', '어깨 끝에서 팔 바깥쪽으로 둥글게 덮은 근육', '손바닥으로 감싸 쥐고 가볍게 주무르기', '30초']],
  back: [['허리 양옆 근육(척추세움근)', '허리 가운데 뼈에서 양옆으로 손가락 두 마디 떨어진 세로 근육', '가운데 뼈는 피하고 양옆 근육만 손바닥으로 위에서 아래로 쓸기', '1분', 'spine'], ['엉덩이 근육', '엉덩이 바깥 위쪽 두툼한 부분', '옆으로 누운 자세에서 손바닥 아랫부분으로 지그시 누르며 원 그리기', '30초씩 2번']],
  thigh: [['허벅지 앞 근육', '무릎뼈 위에서 허벅지 가운데까지', '무릎뼈는 건드리지 않고 허벅지를 손바닥으로 감싸 위쪽으로 쓸어 올리기', '1분', 'joint'], ['허벅지 뒤 근육', '오금 위에서 엉덩이 아래까지', '엎드리거나 옆으로 누워 손바닥으로 위쪽으로 쓸어 올리기', '1분', 'joint']],
  calf: [['종아리 근육', '오금 아래에서 발목 위까지 뒤쪽', '발목에서 무릎 쪽(심장 쪽)으로 손바닥으로 쓸어 올리기', '1분', 'leg'], ['발바닥', '발가락 뿌리에서 뒤꿈치 앞까지', '엄지로 발바닥 가운데 선을 따라 짧게 눌러 가기', '30초씩 2번', 'foot']],
  arm: [['팔뚝 바깥 근육', '팔꿈치 바깥에서 손목 쪽으로 손가락 세 마디까지', '반대 손 엄지로 짧게 눌렀다 떼기', '30초', 'joint'], ['손바닥 엄지 두덩', '손바닥 엄지 뿌리의 도톰한 부분', '반대 엄지로 작은 원 그리기', '30초', 'joint']],
  head: [['관자놀이 근육(측두근)', '눈꼬리 바깥에서 귀 위쪽까지 씹을 때 움직이는 부분', '세 손가락 끝을 대고 아주 약하게 작은 원 그리기', '30초'], ['이마와 눈썹 위', '눈썹 위 이마 아래쪽', '눈은 누르지 않고 손가락 끝으로 가운데에서 바깥으로 쓸기', '30초']],
}

const STRETCH = {
  neck: ['앉아서 고개를 옆으로 기울여 목 옆 늘리기(좌우 15초, 뒤로 젖히거나 돌리지 않기)', '팔꿈치를 옆구리에 붙이고 날개뼈를 뒤로 모았다 풀기(5번)'],
  shoulder: ['수건 양 끝을 잡고 통증 없는 높이까지 팔 올렸다 내리기(5번)', '한 팔을 가슴 앞으로 뻗어 반대 팔로 위팔을 당기기(좌우 15초)'],
  back: ['누워서 한쪽 무릎을 두 손으로 가슴 쪽으로 당기기(좌우 15초, 허벅지 뒤쪽을 잡기)', '누워서 무릎 세우고 골반을 위아래로 살짝 말았다 펴기(8번, 비틀지 않기)'],
  thigh: ['의자에 앉아 한쪽 다리를 펴고 발끝 당겨 5초 버티기(좌우 5번)', '누워서 발바닥에 수건 걸고 다리를 들어 허벅지 뒤 늘리기(15초)'],
  calf: ['앉거나 누워서 발끝 당기고 밀기(10번)', '앉아서 발가락 오므렸다 펴기, 발목 원 그리기(5번씩)'],
  arm: ['손가락 활짝 폈다 힘 빼기(5번, 마디를 뒤로 꺾지 않기)', '팔꿈치를 옆구리에 대고 손바닥 위아래로 뒤집기(8번)'],
  head: ['두 손바닥을 비벼 따뜻하게 한 뒤 감은 눈 위를 가볍게 덮기(15초, 누르지 않기)', '어금니를 살짝 띄우고 코로 4초 들이마시고 입으로 6초 내쉬기(5번)'],
}

// 조건별 주의(실제 근거가 분명한 것만)
const RULES = {
  senior: { lvl: 1, note: '피부와 혈관이 약하므로 손바닥 전체로 넓게, 약하게 합니다. 멍이 들 정도로 누르지 않습니다.' },
  oa: { lvl: 1, note: '아픈 관절 위는 직접 누르지 않고 위아래 근육만 풉니다.', ex: ['아픈 관절 바로 위 누르기'] },
  ra: { lvl: 2, note: '관절이 붓고 뜨거운 날에는 그 부위 안마를 쉬고, 가벼운 움직임만 합니다.', ex: ['붓고 뜨거운 관절 안마'] },
  osteo: { lvl: 2, note: '뼈에 체중을 실어 누르면 골절 위험이 있습니다. 등뼈·갈비뼈 위는 누르지 않고 쓸기만 합니다.', ex: ['등뼈·갈비뼈 위 체중 싣기', '허리 비틀기'], spine: true },
  disc: { lvl: 1, note: '안마 중이나 뒤에 팔다리가 저리거나 당기면 바로 멈춥니다. 강하게 비틀거나 꺾지 않습니다.', ex: ['목·허리 비틀기, 꺾기'] },
  htn: { lvl: 1, note: '목 앞쪽(맥이 뛰는 곳)은 누르지 않습니다. 오래 엎드리지 말고 앉거나 옆으로 누운 자세로 합니다.', ex: ['목 앞쪽 누르기', '오래 엎드린 자세'], neckFront: true },
  dm: { lvl: 2, note: '발과 다리 감각이 둔할 수 있어 아파도 못 느낄 수 있습니다. 아주 약하게 하고, 안마 전후에 발에 상처·물집이 없는지 봅니다. 뜨거운 찜질은 하지 않습니다.', ex: ['발 강하게 누르기', '뜨거운 찜질'], foot: true },
  vein: { lvl: 2, note: '튀어나온 혈관 위는 누르거나 문지르지 않습니다. 다리는 발목에서 무릎 쪽으로 가볍게 쓸기만 합니다.', ex: ['튀어나온 혈관 위 문지르기', '종아리 세게 주무르기'], leg: true },
  blood: { lvl: 2, note: '멍이 쉽게 들므로 쓸기 위주로 아주 약하게 합니다.', ex: ['세게 누르기, 두드리기'] },
  preg: { lvl: 2, note: '엎드리지 말고 옆으로 누운 자세로 합니다. 배는 안마하지 않습니다. 종아리는 혈전 위험이 있으므로 세게 주무르지 않고, 한쪽만 붓고 아프면 바로 진료를 받습니다.', ex: ['엎드린 자세', '배 안마', '종아리 세게 주무르기'], leg: true },
}
const LEVEL = ['보통 (기분 좋게 시원한 정도, 10점 중 4~5)', '약하게 (살짝 눌리는 느낌, 10점 중 3)', '아주 약하게 (쓸기 위주, 10점 중 1~2)']

const SAMPLES = [
  { who: 'senior', parts: ['thigh', 'calf'], feel: 'joint', cond: ['oa', 'htn'] },
  { who: 'adult', parts: ['neck', 'shoulder'], feel: 'sitting', cond: [] },
  { who: 'teen', parts: ['neck', 'head'], feel: 'sitting', cond: [] },
  { who: 'senior', parts: ['back'], feel: 'stiff', cond: ['osteo'] },
  { who: 'adult', parts: ['calf'], feel: 'standing', cond: ['preg'] },
  { who: 'senior', parts: ['calf', 'arm'], feel: 'stiff', cond: ['dm', 'blood'] },
]

function build({ who, parts, feel, cond }) {
  const keys = [...(who === 'senior' ? ['senior'] : []), ...cond]
  const rs = keys.map(k => RULES[k]).filter(Boolean)
  const lvl = Math.max(0, ...rs.map(r => r.lvl))
  const notes = rs.map(r => r.note)
  const excluded = [...new Set(rs.flatMap(r => r.ex || []))]
  const flags = new Set(rs.flatMap(r => ['spine', 'neckFront', 'foot', 'leg'].filter(f => r[f])))
  const blocks = parts.map(p => {
    const name = PARTS.find(x => x[0] === p)[1]
    const ms = MUSCLE[p].map(([m, where, how, time, tag]) => {
      let h = how
      if (tag === 'spine' && flags.has('spine')) h = '뼈 위는 피하고 손바닥으로 넓게 쓸기만(누르지 않기)'
      if ((tag === 'leg' || tag === 'foot') && (flags.has('leg') || flags.has('foot'))) h = '발목에서 무릎 쪽으로 손바닥으로 가볍게 쓸기만'
      return `· ${m}\n  위치: ${where}\n  방법: ${h}\n  시간: ${time}`
    })
    const st = STRETCH[p].map(x => `· ${x}`)
    return `■ ${name}\n[안마]\n${ms.join('\n')}\n[마무리 스트레칭] 반동 없이, 아프지 않은 범위까지만\n${st.join('\n')}`
  })
  const feelTip = { stiff: '따뜻한 수건으로 5분 데운 뒤 시작하면 한결 편합니다(당뇨병이 있으면 찜질 생략).', sitting: '안마와 함께, 50분마다 일어나 2분 정도 걷기를 권합니다.', standing: '안마 뒤 10분 정도 다리를 심장보다 조금 높게 올려 둡니다.', joint: '아침에 뻣뻣하면 안마보다 관절을 천천히 움직이는 것부터 합니다.' }[feel]
  const text = [
    `[가족 홈 안마·스트레칭 안내] 대상: ${WHO.find(w => w[0] === who)[1]}`,
    `강도: ${LEVEL[lvl]}`,
    '전체 시간: 부위당 5분 이내, 하루 1번',
    '',
    ...(notes.length ? ['[주의할 점]', ...notes.map(n => `· ${n}`), ''] : []),
    ...(excluded.length ? ['[하지 않을 것]', ...excluded.map(e => `· ${e}`), ''] : []),
    ...blocks.flatMap(b => [b, '']),
    `[생활 팁] ${feelTip}`,
    '',
    '[바로 멈추고 진료받을 때] 안마 중 날카로운 통증, 저림, 어지럼, 피부색 변화가 생기면 멈춥니다. 같은 통증이 2주 넘게 이어지면 의료기관 진료를 받습니다.',
  ].join('\n')
  return { text, lvl, excluded }
}

function Timer() {
  const [left, setLeft] = useState(0)
  const t = useRef(null)
  useEffect(() => () => clearInterval(t.current), [])
  function start(n) {
    clearInterval(t.current); setLeft(n)
    t.current = setInterval(() => setLeft(x => { if (x <= 1) { clearInterval(t.current); try { navigator.vibrate?.(200) } catch { /* 진동 없음 */ } return 0 } return x - 1 }), 1000)
  }
  return (
    <section className="card">
      <div className="card-head"><h2>안마 타이머</h2><span className="badge" role="status" aria-live="polite">{left ? `${left}초 남음` : '준비'}</span></div>
      <div className="row">{[30, 60].map(n => <button key={n} type="button" className="btn app-open" onClick={() => start(n)}>{n}초</button>)}<button type="button" className="btn app-open" onClick={() => { clearInterval(t.current); setLeft(0) }}>멈춤</button></div>
    </section>
  )
}

export default function HomeMassage({ app }) {
  const [who, setWho] = useState('senior')
  const [parts, setParts] = useState([])
  const [feel, setFeel] = useState('stiff')
  const [cond, setCond] = useState([])
  const [red, setRed] = useState([])
  const [res, setRes] = useState(null)
  const [text, setText] = useState('')
  const [si, setSi] = useState(-1)
  const [msg, setMsg] = useState('')

  function sample() {
    let i = Math.floor(Math.random() * SAMPLES.length); if (i === si) i = (i + 1) % SAMPLES.length
    const x = SAMPLES[i]; setSi(i); setWho(x.who); setParts(x.parts); setFeel(x.feel); setCond(x.cond); setRed([]); setRes(null); setMsg('')
  }
  function make() {
    if (!parts.length) { setMsg('부위를 하나 이상 골라 주세요.'); return }
    setMsg('')
    if (red.length) { setRes({ stop: true }); return }
    const r = build({ who, parts, feel, cond }); setRes(r); setText(r.text)
  }
  const aiPrompt = useMemo(() => !res || res.stop ? '' : `역할: 가족에게 안전한 홈 안마를 알려 주는 물리치료사입니다.\n지킬 것: [하지 않을 것]과 [주의할 점]은 그대로 유지, 진단·치료 효과를 약속하지 않기, 혈자리·민간요법 추가하지 않기, 쉬운 말.\n출력: ① 보호자가 따라 읽을 순서 안내(번호) ② 받는 분께 건넬 말 한마디 ③ 멈출 신호 3가지\n\n[규칙 기반 안내]\n${text}`, [res, text])

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">일반 건강 정보이며 진료나 물리치료를 대신하지 않습니다. 고른 내용은 저장하지 않습니다.</span>
      </AppHeader>
      <section className="card">
        <ChipGroup label="누구에게" options={WHO} value={who} onChange={setWho} />
        <ChipGroup label="불편한 부위 (여러 개)" multi options={PARTS} value={parts} onChange={setParts} />
        <ChipGroup label="어떤 느낌인가요" options={FEEL} value={feel} onChange={setFeel} />
        <ChipGroup label="해당하는 건강 상태 (없으면 고르지 않기)" multi options={COND} value={cond} onChange={setCond} />
      </section>
      <section className="card">
        <div className="card-head"><h2>먼저 확인하세요</h2><span className="badge red">하나라도 있으면 안마하지 않기</span></div>
        <ChipGroup label="지금 해당하는 것" multi options={RED} value={red} onChange={setRed} />
        {msg && <Notice tone="bad">{msg}</Notice>}
        <div className="row">
          <button type="button" className="btn primary" onClick={make}>안전 안마 안내 만들기</button>
          <button type="button" className="btn" onClick={sample}>예시 채우기</button>
          <span className="small muted">누를 때마다 다른 가족 상황으로 채웁니다.</span>
        </div>
      </section>

      {res?.stop && (
        <section className="card wa-crisis" role="alert">
          <h2>오늘은 안마하지 말고 진료를 먼저 받으세요</h2>
          <p>고른 증상({red.map(k => RED.find(r => r[0] === k)[1]).join(', ')})은 근육 뭉침이 아닌 다른 원인일 수 있고, 안마가 오히려 해가 될 수 있습니다.</p>
          <ul className="list">
            <li>한쪽 종아리만 붓고 아프거나, 가슴 통증·숨참이 있으면 바로 응급실에 가거나 119에 연락하세요.</li>
            <li>그 밖의 증상은 가까운 의원이나 정형외과·재활의학과 진료를 받으세요.</li>
          </ul>
        </section>
      )}
      {res && !res.stop && (
        <>
          <ResultDoc title="우리 가족 안마 안내" text={text} onChange={setText} fileName="홈안마_안내.txt" />
          <Timer />
          <AiRefine appId="home-massage" label="지후 AI로 보호자용 안내 다듬기" note="안전 규칙은 그대로 두고, 보호자가 따라 읽기 쉬운 순서로 바꿉니다." prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
