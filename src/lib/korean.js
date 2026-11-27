// 한국어 조사를 앞말의 받침에 맞춰 붙입니다. 예: josa('대학교', '은/는') → '대학교는'
export function hasBatchim(word) {
  const clean = String(word || '').replace(/[^가-힣0-9A-Za-z]/g, '')
  if (!clean) return false
  const last = clean[clean.length - 1]
  if (/[0-9]/.test(last)) return '013678'.includes(last) // 영, 일, 삼, 육, 칠, 팔
  if (/[A-Za-z]/.test(last)) return /[lmnr]$/i.test(last)
  const code = last.charCodeAt(0) - 0xac00
  return code >= 0 && code % 28 !== 0
}

// '으로/로'는 ㄹ 받침 뒤에 '로'를 씁니다.
export function josa(word, pair) {
  const [withB, withoutB] = pair.split('/')
  if (pair === '으로/로') {
    const clean = String(word || '').replace(/[^가-힣]/g, '')
    const code = clean ? clean.charCodeAt(clean.length - 1) - 0xac00 : -1
    if (code >= 0 && code % 28 === 8) return word + '로'
  }
  return word + (hasBatchim(word) ? withB : withoutB)
}

// '체육대회 개최' → '체육대회' (끝의 개최·실시·진행 등을 떼어 반복을 막습니다)
export function stripEventVerb(s) {
  return String(s || '').trim().replace(/\s*(개최|실시|진행|운영|시행)(\s*안내)?$/, '').trim()
}

export const todayDots = (d = new Date()) => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`

// 조사만 돌려줍니다. 따옴표 밖에 조사를 붙일 때 씁니다. 예: `‘${행사}’${particle(행사, '을/를')}`
export const particle = (word, pair) => josa(word, pair).slice(String(word).length)

// '…공유하기 위해', '…을 위하여'는 그대로, 명사로 끝나면 '…을 위해'를 붙입니다.
export function purpose(s) {
  const w = String(s || '').trim().replace(/[.。]$/, '')
  if (!w) return ''
  if (/(위해|위하여|하고자|도록)$/.test(w)) return w
  return `${josa(w, '을/를')} 위해`
}
