export function splitArticles(text, source = '규정') {
  const parts = text.split(/(?=제\s*\d+\s*조(?:의\s*\d+)?\s*[(（])/g)
  return parts
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      const m = p.match(/^제\s*(\d+)\s*조(?:의\s*(\d+))?\s*[(（]([^)）]+)[)）]/)
      return {
        source,
        no: m ? `제${m[1]}조${m[2] ? '의' + m[2] : ''}` : '',
        title: m ? m[3] : '',
        body: p,
      }
    })
}

function tokens(s) {
  return (s.toLowerCase().match(/[가-힣a-z0-9]{2,}/g) || [])
    .map(t => t.replace(/(은|는|이|가|을|를|에|의|로|으로|와|과|도|만|에서|하고|해서|하나요|인가요|할까요|되나요|있나요)$/, ''))
    .filter(t => t.length >= 2)
}

export function searchArticles(articles, question, k = 3) {
  const q = tokens(question)
  if (!q.length) return []
  return articles
    .map(a => {
      const hay = (a.title + ' ' + a.body).toLowerCase()
      let score = 0
      for (const t of q) {
        if (a.title.includes(t)) score += 3
        const hits = hay.split(t).length - 1
        score += Math.min(hits, 3)
      }
      return { ...a, score }
    })
    .filter(a => a.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, k)
}

export const SAMPLE_RULES = `제1조(목적) 이 규정은 시연을 위한 예시 규정으로, 실제 학칙이나 규정이 아니다.
제2조(스터디룸 이용) ① 스터디룸은 재학생이 이용할 수 있다. ② 1회 예약은 2시간 이내로 한다.
제3조(예약 취소) 예약자는 이용 시작 1시간 전까지 예약을 취소하여야 한다.
제4조(출장 신청) 직원은 출장 3일 전까지 출장 신청서를 제출하여야 한다.`
