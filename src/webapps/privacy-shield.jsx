import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, TextArea, ResultDoc, Notice, CopyButton } from './kit.jsx'

/* 개인정보 가명처리기
   AI에 넣기 전에 이름·학번·연락처 같은 정보를 "학생A", "[전화1]"로 바꾸고,
   AI 결과를 붙여 넣으면 원래 값으로 되돌립니다. 대응표는 이 화면에만 있고 저장하지 않습니다. */

const RULES = [
  { key: 'rrn', label: '주민·외국인등록번호', tok: '주민번호', re: /\b\d{6}\s?-\s?[1-8]\d{6}\b/g },
  { key: 'card', label: '카드번호', tok: '카드', re: /\b\d{4}[- ]\d{4}[- ]\d{4}[- ]\d{4}\b/g },
  { key: 'acct', label: '계좌번호', tok: '계좌', re: /(?:계좌|은행|입금)[^\n\d]{0,12}(\d{2,6}-\d{2,6}-\d{2,8}(?:-\d{1,4})?)/g, group: 1 },
  { key: 'mobile', label: '휴대전화', tok: '전화', re: /\b01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}\b/g },
  { key: 'tel', label: '일반전화', tok: '전화', re: /\b0(?:2|[3-6][1-5])[-.\s)]\s?\d{3,4}[-.\s]?\d{4}\b/g },
  { key: 'email', label: '이메일', tok: '메일', re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { key: 'sid', label: '학번', tok: '학번', re: /(?:학번|학생번호)\s*[:：]?\s*(\d{7,10})|\b(20\d{6,8})\b/g, group: [1, 2] },
  { key: 'mrn', label: '환자·등록번호', tok: '등록번호', re: /(?:등록번호|환자번호|차트번호|병록번호)\s*[:：]?\s*([A-Z]?\d{4,})/g, group: 1 },
  { key: 'birth', label: '생년월일', tok: '생년월일', re: /(?:생년월일|생일|출생)\s*[:：]?\s*(\d{2,4}[.\-/년\s]+\d{1,2}[.\-/월\s]+\d{1,2}일?)/g, group: 1 },
  { key: 'addr', label: '상세 주소', tok: '주소', re: /[가-힣]+(?:시|도) ?[가-힣]+(?:시|군|구) ?[가-힣0-9]+(?:로|길|동) ?\d+(?:-\d+)?(?: ?\d+(?:동|호|층))*/g },
]
// 이름: "이름: 홍길동", "홍길동 학생", "김OO 교수님", "환자 이영희" 같은 모양만 잡습니다(모든 이름을 찾지는 못함)
const NAME_RE = [
  /(?:이름|성명|학생명|환자명|보호자명)\s*[:：]\s*([가-힣]{2,4})/g,
  /(?:^|[\s(,])([가-힣]{2,4})\s?(?=(?:학생|교수님?|선생님?|님|씨|군|양|환자|보호자|조교|팀장|과장|주임|계장)(?:[^가-힣]|$|께|이|은|는|을|의|과|와|도|에게|이랑))/g,
  /(?:환자|학생|보호자|대상자|민원인|자녀)\s?([가-힣]{2,4})(?=\s?(?:님|씨)|[,.)(])/g,
]
const NOT_NAME = new Set(['우리', '저희', '모든', '각각', '해당', '담당', '지도', '전체', '일반', '신입', '재학', '휴학', '복학', '졸업', '외래', '입원', '병동', '실습', '대학', '학과', '교수', '학생', '선생', '환자', '보호', '오늘', '내일', '어제', '다른', '같은', '이번', '다음', '지난', '면담', '상담', '기록', '통화', '연락', '문의', '요청', '확인', '부모', '학부모', '어머니', '아버지', '자녀', '본인'])
const LETTER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function detect(text, extraNames, extraTerms) {
  const hits = []
  const push = (value, label, tok) => { const v = value.trim(); if (v && !hits.some(h => h.value === v)) hits.push({ value: v, label, tok }) }
  for (const r of RULES) {
    for (const m of text.matchAll(r.re)) {
      const g = Array.isArray(r.group) ? r.group.map(i => m[i]).find(Boolean) : r.group ? m[r.group] : m[0]
      if (g) push(g, r.label, r.tok)
    }
  }
  for (const re of NAME_RE) for (const m of text.matchAll(re)) if (m[1] && !NOT_NAME.has(m[1]) && !NOT_NAME.has(m[1].slice(0, 2))) push(m[1], '이름', '사람')
  extraNames.forEach(n => push(n, '이름(직접 입력)', '사람'))
  extraTerms.forEach(n => push(n, '기관·기타(직접 입력)', '기관'))
  // 같은 종류 안에서 차례대로 이름을 붙입니다
  const seen = {}
  return hits.map(h => {
    seen[h.tok] = (seen[h.tok] || 0) + 1
    const i = seen[h.tok]
    return { ...h, id: `${h.tok}-${i}`, token: h.tok === '사람' ? `사람${LETTER[(i - 1) % 26]}${i > 26 ? Math.ceil(i / 26) : ''}` : h.tok === '기관' ? `기관${LETTER[(i - 1) % 26]}` : `[${h.tok}${i}]` }
  })
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function applyMap(text, pairs) {
  // 긴 값부터 바꿔야 "홍길동"보다 "홍길동님" 같은 겹침이 꼬이지 않습니다
  return [...pairs].sort((a, b) => b[0].length - a[0].length).reduce((t, [from, to]) => t.replace(new RegExp(escapeRe(from), 'g'), to), text)
}

const SAMPLES = [
  `지도학생 면담 기록\n이름: 김민준 (학번 20241234), 물리치료학과 2학년\n연락처 010-1234-5678, minjun.kim@example.com\n어머니(보호자 박서연 님)와 통화함. 등록금 분납 문의, 입금 계좌 국민은행 123456-01-234567 확인 요청.\n다음 면담: 이수진 교수님 연구실`,
  `[실습 사례] 외래 환자 이영희 님(등록번호: 00872345, 생년월일 1948.03.15)\n주소 광주광역시 북구 용봉로 77 101동 1203호\n보호자 최동훈 씨 연락처 010-9876-5432. 담당 치료사 정하늘 선생님께 보고함.`,
  `민원 접수 메모\n민원인 홍길동(학부모)이 전화(062-123-4567)로 장학금 탈락 이의 제기.\n자녀 홍지아 학생(학번 2023001122)의 평점 3.48. 회신은 hong.parent@example.com 으로 요청.`,
]

export default function PrivacyShield({ app }) {
  const [text, setText] = useState('')
  const [names, setNames] = useState('')
  const [terms, setTerms] = useState('')
  const [off, setOff] = useState({})
  const [back, setBack] = useState('')
  const [si, setSi] = useState(-1)

  const list = s => s.split(/[,，\n]/).map(x => x.trim()).filter(x => x.length >= 2)
  const hits = useMemo(() => detect(text, list(names), list(terms)), [text, names, terms])
  const on = hits.filter(h => !off[h.value])
  const masked = useMemo(() => applyMap(text, on.map(h => [h.value, h.token])), [text, on])
  const restored = useMemo(() => applyMap(back, on.map(h => [h.token, h.value])), [back, on])
  const left = hits.length ? RULES.filter(r => r.key !== 'addr').some(r => { r.re.lastIndex = 0; return r.re.test(masked) }) : false

  function sample() {
    let i = Math.floor(Math.random() * SAMPLES.length); if (i === si) i = (i + 1) % SAMPLES.length
    setSi(i); setText(SAMPLES[i]); setOff({}); setBack(''); setNames(''); setTerms('')
  }

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">모든 처리는 이 브라우저 안에서만 합니다. 원래 값과 가명 대응표는 저장하지 않으며, 화면을 닫으면 사라집니다.</span>
      </AppHeader>
      <section className="card">
        <Field id="ps-t" label="AI에 넣으려는 글" hint={`${text.length.toLocaleString()}자`}>
          <TextArea id="ps-t" rows={8} value={text} onChange={v => { setText(v); setBack('') }} placeholder="면담 기록, 민원 메모, 실습 사례 등을 붙여 넣으세요." />
        </Field>
        <div className="grid">
          <Field id="ps-n" label="꼭 가릴 이름" hint="자동으로 못 찾은 이름을 쉼표로"><TextInput id="ps-n" value={names} onChange={setNames} placeholder="예: 김민준, 박서연" /></Field>
          <Field id="ps-o" label="꼭 가릴 기관·장소" hint="병원, 회사, 학교 이름 등"><TextInput id="ps-o" value={terms} onChange={setTerms} placeholder="예: OO요양병원" /></Field>
        </div>
        <div className="row"><button type="button" className="btn" onClick={sample}>예시 넣기</button><span className="small muted">가상 인물로 만든 예시입니다. 누를 때마다 바뀝니다.</span></div>
      </section>

      {text.trim() && (
        <>
          <section className="card">
            <div className="card-head"><h2>찾은 정보 {hits.length}개</h2><span className="muted small">체크를 풀면 그 값은 가리지 않습니다</span></div>
            {hits.length === 0 ? <Notice>자동으로 찾은 정보가 없습니다. 이름이나 기관이 있다면 위 칸에 직접 넣어 주세요.</Notice> : (
              <ul className="check-list">{hits.map(h => (
                <li key={h.value}><label><input type="checkbox" checked={!off[h.value]} onChange={e => setOff({ ...off, [h.value]: !e.target.checked })} />
                  <span><b>{h.value}</b> → <code>{h.token}</code> <span className="muted small">{h.label}</span></span></label></li>
              ))}</ul>
            )}
            <Notice>자동 찾기는 정해진 모양만 잡습니다. 별명, 사진 속 글자, 드문 이름은 놓칠 수 있으니 아래 결과를 한 번 읽어 확인하세요.</Notice>
          </section>
          <ResultDoc title="가린 글 (AI에 넣을 글)" text={masked} fileName="가명처리.txt" />
          {left && <Notice tone="bad">가린 글에 아직 번호 모양이 남아 있습니다. 체크를 풀었는지 확인하세요.</Notice>}
          <section className="card">
            <div className="card-head"><h2>AI 결과를 원래 이름으로 되돌리기</h2></div>
            <Field id="ps-b" label="AI가 돌려준 글" hint="가명(사람A, [전화1] 등)이 들어 있는 글">
              <TextArea id="ps-b" rows={5} value={back} onChange={setBack} placeholder="AI 답을 붙여 넣으세요." />
            </Field>
            {back.trim() && <><pre className="prompt-text" tabIndex={0}>{restored}</pre><div className="row"><CopyButton text={restored} label="되돌린 글 복사" primary /></div></>}
          </section>
        </>
      )}
    </>
  )
}
