import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, ChipGroup, CopyButton, AiRefine, Notice } from './kit.jsx'
import { OCCASIONS, TOASTS } from './toast-data.js'

/* 건배사 생성기
   기존 앱의 건배사 18종을 그대로 쓰고, 키워드 삼행시는 글자마다 실제로 그 글자로 시작하는
   문장을 붙이도록 고쳤습니다(기존 앱은 앞 글자만 바꿔 끼워 어색한 문장이 나왔습니다).
   사전에 없는 글자가 있으면 억지 삼행시 대신 선창·후창 구호만 만듭니다. */

const STARTS = {
  가: '가슴 뛰는 내일을 향해', 감: '감사한 마음을 담아', 건: '건강하게 오래오래', 경: '경쟁보다 협력으로', 고: '고생한 우리 모두에게',
  공: '공부도 일도 즐겁게', 광: '광주보건대의 자부심으로', 교: '교정에 웃음 가득', 국: '국시 합격을 기원하며', 기: '기분 좋은 오늘을',
  꿈: '꿈을 향해 함께', 나: '나란히 걸어온 동료들과', 내: '내일도 힘차게', 노: '노력한 만큼 빛나길', 다: '다 함께 웃는 날',
  대: '대박 나는 한 해', 도: '도약하는 우리 대학', 동: '동료가 있어 든든한', 마: '마음을 모아', 만: '만나서 반가운 오늘',
  멋: '멋진 우리 모두', 모: '모두가 주인공인', 미: '미래를 함께 그리며', 바: '바라는 일 모두 이루길', 발: '발전하는 우리',
  방: '방학까지 힘내자', 보: '보람찬 하루 끝에', 복: '복 받을 우리 모두', 부: '부족해도 함께라면', 비: '비전을 품고',
  빛: '빛나는 내일을 위해', 사: '사랑하는 동료들과', 상: '상상 이상의 성과로', 새: '새로운 출발을 응원하며', 생: '생명을 살리는 사람들',
  서: '서로를 아끼는 마음으로', 성: '성공을 향해', 소: '소중한 인연에 감사하며', 수: '수고한 모두에게', 스: '스스로 빛나는 우리',
  시: '시작이 반이니', 신: '신나게 웃으며', 아: '아낌없이 응원하며', 안: '안전하고 건강하게', 애: '애쓴 만큼 보람 있게',
  여: '여기 모인 우리', 열: '열정 가득한 우리', 영: '영원히 함께할 동료', 오: '오늘 하루도 수고한', 우: '우리 모두의 행복을 위해',
  웃: '웃음이 끊이지 않는', 원: '원하는 꿈 모두 이루길', 위: '위기도 함께 넘어', 응: '응원합니다 우리 모두', 이: '이 순간을 기억하며',
  인: '인연에 감사하며', 일: '일도 삶도 균형 있게', 자: '자랑스러운 우리', 잘: '잘될 거야 우리', 장: '장하다 우리 모두',
  전: '전진하는 우리', 정: '정성을 다한 한 해', 좋: '좋은 사람들과 함께', 종: '종강을 축하하며', 지: '지금 이 순간',
  진: '진심을 담아', 참: '참 잘했어요 우리', 창: '창의적인 내일을 향해', 청: '청춘은 바로 지금', 최: '최고의 팀을 위하여',
  축: '축하합니다 모두', 친: '친구 같은 동료들', 태: '태양처럼 빛나는', 통: '통하는 마음으로', 파: '파이팅 넘치는',
  평: '평안한 내일을', 품: '품격 있게', 하: '하나 되는 우리', 학: '학교의 자랑', 한: '한마음 한뜻으로',
  함: '함께라서 행복한', 합: '합심해서 이뤄낸', 해: '해냈다 우리', 행: '행복한 시간을 위해', 혁: '혁신을 이끄는',
  협: '협력으로 빛나는', 화: '화합하는 우리', 환: '환하게 웃는 날', 활: '활기찬 내일을', 회: '회복과 재충전의 시간',
  후: '후회 없는 하루', 희: '희망찬 내일을 위해', 힘: '힘내자 우리',
}

const TYPE_NAME = { acrostic: '트렌드 삼행시', callResponse: '선창·후창 구호', humor: '짧은 유머 건배사', custom: '맞춤 키워드' }

function shuffle(a) { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }
function pool(list, occ) { return [...shuffle(list.filter(x => x.occasions.includes(occ))), ...shuffle(list.filter(x => !x.occasions.includes(occ)))] }

function keywordToasts(keyword, occ) {
  const word = keyword.replace(/[^가-힣A-Za-z0-9]/g, '')
  if (!word) return { cards: [], missing: [] }
  const chars = [...word]
  const cards = []
  const missing = chars.filter(c => !STARTS[c])
  if (chars.length >= 2 && chars.length <= 4 && missing.length === 0) {
    const lines = chars.map(c => `(${c})${STARTS[c].slice(1)}`)
    cards.push({
      type: 'custom', title: `「${word}」 ${chars.length}행시`,
      lead: `오늘의 키워드 "${word}"로 ${chars.length}행시 하겠습니다. 운을 띄워 주세요!\n${lines.join('\n')}\n위하여!`,
      chant: chars.join('! ') + '!',
      tip: '선창자가 한 글자씩 운을 띄우면 참석자가 따라 외치며 호응합니다.',
    })
  }
  const call = occ === 'executive' ? '함께 만드는' : '오늘부터 우리는?'
  cards.push({
    type: 'custom', title: `하나 되는 구호: 「${word}!」`,
    lead: `오늘 이 자리의 마음을 "${word}" 한마디에 담겠습니다.\n제가 "${call}" 하면 다 같이 "${word}!" 외쳐 주세요!`,
    chant: `${call} → ${word}!`,
    tip: '긴 키워드나 영어 키워드는 삼행시보다 선창·후창 구호가 리듬감 있게 들립니다.',
  })
  return { cards, missing }
}

function makeFive(occ, keyword) {
  const a = pool(TOASTS.acrostic, occ).map(x => ({ ...x, type: 'acrostic' }))
  const c = pool(TOASTS.callResponse, occ).map(x => ({ ...x, type: 'callResponse' }))
  const h = pool(TOASTS.humor, occ).map(x => ({ ...x, type: 'humor' }))
  const { cards, missing } = keywordToasts(keyword, occ)
  const list = cards.length ? [...cards, a[0], c[0], h[0], a[1], c[1]] : [a[0], a[1], c[0], c[1], h[0]]
  return { list: list.slice(0, 5), missing }
}

// 건배 제의 전체 멘트(약 20~30초): 인사 → 감사 → 오늘의 의미 → 구호 안내 → 구호
const OPEN = {
  staff: ['반갑습니다.', '오늘 이렇게 한자리에 모이니 참 든든합니다.'],
  mt: ['다들 반가워요!', '오늘 이 자리에 와 줘서 고마워요.'],
  executive: ['귀한 자리에 함께해 주셔서 감사합니다.', '바쁘신 가운데 자리를 빛내 주셔서 감사드립니다.'],
  welcome: ['여러분, 진심으로 환영합니다.', '새 식구를 맞이하는 오늘이 참 기쁩니다.'],
  project: ['정말 수고 많으셨습니다.', '긴 여정을 함께 달려온 여러분, 반갑습니다.'],
}
function speechOf(t, occ, who, reason) {
  const formal = occ === 'executive' || occ === 'staff' || occ === 'project'
  const me = who.trim() ? `${who.trim()}${formal ? '입니다' : '이에요'}.` : ''
  const open = OPEN[occ][Math.abs(t.title.length) % 2]
  const why = reason.trim()
    ? (formal ? `${reason.trim().replace(/[.。]$/, '')}까지, 애써 주신 모든 분께 감사드립니다.` : `${reason.trim().replace(/[.。]$/, '')}까지, 다들 정말 고생 많았어요.`)
    : (formal ? '올 한 해 서로 믿고 함께해 주셔서 감사합니다.' : '여기까지 함께 와 줘서 고마워요.')
  const how = formal ? '제가 선창하면 함께 외쳐 주십시오.' : '제가 먼저 외치면 다 같이 따라 해 주세요!'
  return [open, me, why, t.lead, how, `“${t.chant}”`].filter(Boolean).join(' ')
}

export default function ToastMaker({ app }) {
  const [occ, setOcc] = useState('staff')
  const [kw, setKw] = useState('')
  const [who, setWho] = useState('')
  const [reason, setReason] = useState('')
  const [seed, setSeed] = useState(0)
  const meta = OCCASIONS.find(o => o[0] === occ)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { list, missing } = useMemo(() => makeFive(occ, kw), [occ, kw, seed])
  const text = t => `[${t.title}]\n${t.lead}\n구호: ${t.chant}`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">과음을 권하지 않는 건배사만 담았습니다. 잔에 무엇이 담겼든 함께 외칠 수 있습니다.</span>
      </AppHeader>
      <section className="card">
        <ChipGroup label="어떤 자리인가요" options={OCCASIONS.map(([k, name, tone]) => [k, name, tone])} value={occ} onChange={setOcc} />
        <Field id="tm-kw" label="핵심 키워드 (선택)" hint="두세 글자 한글 키워드는 삼행시로, 긴 키워드는 선창·후창 구호로 만듭니다">
          <TextInput id="tm-kw" value={kw} onChange={setKw} placeholder="예: 보건대, 화합, 종강" maxLength={12} />
        </Field>
        <div className="row" style={{ gap: 6 }}>
          <span className="small muted">추천 키워드</span>
          {meta[3].map(k => <button key={k} type="button" className="chip" onClick={() => setKw(k)}>{k}</button>)}
        </div>
        <div className="wa-form">
          <Field id="tm-who" label="건배 제의하는 분 (선택)" hint="예: 기획처장 김○○"><TextInput id="tm-who" value={who} onChange={setWho} placeholder="직함과 이름" /></Field>
          <Field id="tm-why" label="오늘 함께 축하할 일 (선택)" hint="예: 국가고시 전원 합격, 사업 평가 마무리"><TextInput id="tm-why" value={reason} onChange={setReason} placeholder="한 줄로" /></Field>
        </div>
        {missing.length > 0 && <Notice>‘{missing.join(', ')}’로 시작하는 자연스러운 문장이 사전에 없어 삼행시 대신 구호로 만들었습니다. AI가 연결되면 아래에서 맞춤 삼행시를 받을 수 있습니다.</Notice>}
        <div className="row"><button type="button" className="btn primary" onClick={() => setSeed(s => s + 1)}>다른 조합 보기</button></div>
      </section>

      <div className="prompt-grid">
        {list.map((t, i) => (
          <article key={t.title + i} className="card prompt-card">
            <div className="row" style={{ gap: 6 }}><span className="badge navy">{i + 1}</span><span className={`badge ${t.type === 'custom' ? 'green' : 'blue'}`}>{TYPE_NAME[t.type]}</span></div>
            <h3>{t.title}</h3>
            <pre className="prompt-text">{t.lead}</pre>
            <p className="small" style={{ margin: 0 }}><b>다 같이</b> {t.chant}</p>
            <p className="small muted" style={{ margin: 0 }}>{t.tip}</p>
            <details className="small"><summary style={{ cursor: 'pointer', fontWeight: 700 }}>건배 제의 전체 멘트 (약 30초)</summary><p style={{ margin: '6px 0 0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{speechOf(t, occ, who, reason)}</p></details>
            <div className="row"><CopyButton text={text(t)} label="건배사 복사" /><CopyButton text={speechOf(t, occ, who, reason)} label="전체 멘트 복사" /></div>
          </article>
        ))}
      </div>

      <AiRefine appId="toast-maker" label="지후 AI 맞춤 건배사 받기"
        note="모임 성격과 키워드로 새 삼행시와 구호를 3개 더 만듭니다. 과음 권유나 특정인을 놀리는 표현은 넣지 않습니다."
        prompt={`역할: 대학 행사 사회자입니다.\n모임: ${meta[1]} (${meta[2]})\n키워드: ${kw || '없음'}\n건배 제의자: ${who || '미정'}\n축하할 일: ${reason || '없음'}\n요청: ① 키워드 글자로 실제 시작하는 자연스러운 삼행시 1개 ② 선창·후창 구호 2개 ③ 그중 하나로 30초 건배 제의 전체 멘트(인사→감사→의미→구호 안내→구호).\n지킬 것: 과음 권유, 특정인 놀림, 비속어, 성별·나이 고정관념 표현 쓰지 않기.`} />
    </>
  )
}
