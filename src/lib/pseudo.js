// 개인정보 자동 찾기와 가명 바꾸기(가명처리기·성찰일지 등에서 함께 씁니다)
export const RULES = [
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
const NOT_NAME = new Set(['우리', '저희', '모든', '각각', '해당', '담당', '지도', '전체', '일반', '신입', '재학', '휴학', '복학', '졸업', '외래', '입원', '병동', '실습', '대학', '학과', '교수', '학생', '선생', '환자', '보호', '오늘', '내일', '어제', '다른', '같은', '이번', '다음', '지난', '면담', '상담', '기록', '통화', '연락', '문의', '요청', '확인', '부모', '학부모', '어머니', '아버지', '자녀', '본인', '여성', '남성', '고령', '노인', '아동', '소아', '성인', '어르신', '신규', '응급', '중증', '경증', '청소년', '외국인', '입원', '퇴원', '수술', '재활', '내과', '외과', '담임', '대학원', '전공', '편입', '실습생', '동기', '선배', '후배'])
const LETTER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function detect(text, extraNames, extraTerms) {
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
export function applyMap(text, pairs) {
  // 긴 값부터 바꿔야 "홍길동"보다 "홍길동님" 같은 겹침이 꼬이지 않습니다
  return [...pairs].sort((a, b) => b[0].length - a[0].length).reduce((t, [from, to]) => t.replace(new RegExp(escapeRe(from), 'g'), to), text)
}

