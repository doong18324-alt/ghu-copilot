const PATTERNS = [
  { label: '주민등록번호', re: /\b\d{6}\s?-\s?[1-4]\d{6}\b/g },
  { label: '휴대전화번호', re: /\b01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}\b/g },
  { label: '이메일', re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { label: '등록번호', re: /(등록번호|환자번호|차트번호)\s*[:：]?\s*\d{4,}/g },
  { label: '생년월일', re: /(생년월일|생일)\s*[:：]?\s*\d{2,4}[.\-/년\s]+\d{1,2}[.\-/월\s]+\d{1,2}일?/g },
]

export function findPII(text) {
  const found = []
  for (const p of PATTERNS) {
    const m = text.match(p.re)
    if (m) found.push({ label: p.label, count: m.length })
  }
  return found
}

export function maskPII(text) {
  let out = text
  for (const p of PATTERNS) out = out.replace(p.re, `[${p.label} 가림]`)
  out = out.replace(/(환자|대상자|보호자)\s*([가-힣]{2,4})(님|씨)?/g, '$1 [이름 가림]')
  return out
}
