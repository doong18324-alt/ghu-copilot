import { findPII } from './privacy.js'

const SPELLING = [
  ['되요', '돼요'],
  ['몇일', '며칠'],
  ['할께요', '할게요'],
  ['할께', '할게'],
  ['어떻해', '어떡해'],
  ['금새', '금세'],
  ['왠만하면', '웬만하면'],
  ['역활', '역할'],
  ['설겆이', '설거지'],
  ['댓가', '대가'],
]

export function checkDocument(text) {
  const results = []

  const isoDates = text.match(/\b\d{4}-\d{1,2}-\d{1,2}\b/g) || []
  const tightDates = text.match(/\b\d{4}\.\d{1,2}\.\d{1,2}\.?(?!\s)/g) || []
  const dateIssues = [...isoDates, ...tightDates]
  results.push(dateIssues.length
    ? { level: 'warn', text: `날짜 표기 ${dateIssues.length}곳: ${dateIssues.slice(0, 3).join(', ')} → 공문서 표기 "2026. 11. 14."처럼 마침표 뒤 한 칸 띄어 쓰세요.` }
    : { level: 'ok', text: '날짜 표기 형식 이상 없음' })

  const spell = SPELLING.filter(([w]) => text.includes(w))
  results.push(spell.length
    ? { level: 'warn', text: `맞춤법 확인: ${spell.map(([w, r]) => `${w} → ${r}`).join(', ')}` }
    : { level: 'ok', text: '자주 틀리는 맞춤법 목록에서 발견된 항목 없음' })

  const pii = findPII(text)
  results.push(pii.length
    ? { level: 'bad', text: `개인정보 의심: ${pii.map(p => `${p.label} ${p.count}건`).join(', ')}. 발송 전 삭제하거나 가려 주세요.` }
    : { level: 'ok', text: '개인정보 패턴 발견되지 않음' })

  const hasEnd = /끝\.\s*$/.test(text.trim())
  results.push(hasEnd
    ? { level: 'ok', text: '"끝." 표시 확인' }
    : { level: 'warn', text: '본문 또는 붙임 뒤에 "끝." 표시가 없습니다.' })

  return results
}
