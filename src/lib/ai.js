const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export const AI_MODE = API_BASE ? 'live' : 'demo'

export async function askAI({ task = 'chat', model = 'auto', messages, context = '', onToken }) {
  if (AI_MODE === 'live') return askServer({ task, model, messages, context, onToken })
  return askDemo({ task, model, messages, context, onToken })
}

async function askServer({ task, model, messages, context, onToken }) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, model, messages, context }),
  })
  if (!res.ok || !res.body) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `서버 오류 (${res.status})`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    full += chunk
    onToken?.(full)
  }
  return full
}

export async function checkServer() {
  if (AI_MODE !== 'live') return { ok: false, mode: 'demo' }
  try {
    const res = await fetch(`${API_BASE}/api/health`, { credentials: 'include' })
    return { ok: res.ok, mode: 'live', ...(await res.json()) }
  } catch (e) {
    return { ok: false, mode: 'live', error: e.message }
  }
}

async function askDemo({ task, model, messages, context, onToken }) {
  const last = messages[messages.length - 1]?.content || ''
  const text = demoReply(task, last, context, model)
  let out = ''
  for (const piece of text.match(/.{1,6}/gs) || []) {
    out += piece
    onToken?.(out)
    await new Promise(r => setTimeout(r, 12))
  }
  return out
}

function demoReply(task, prompt, context) {
  const head = '[시연 모드] 실제 AI가 아직 연결되지 않아 예시 응답을 보여 드립니다.\n\n'
  const q = prompt.length > 60 ? prompt.slice(0, 60) + '…' : prompt
  switch (task) {
    case 'docs':
      return head + `요청하신 공문 초안의 구성 예시입니다.\n\n1. 관련: [근거 문서 또는 공문 번호]\n2. 위 호와 관련하여 ${q} 사항을 다음과 같이 안내합니다.\n  가. 일시: [YYYY. M. D.(요일) HH:MM]\n  나. 장소: [장소]\n  다. 대상: [대상]\n\n붙임  [붙임 문서명] 1부.  끝.\n\n실제 연결 시 본교 공문 서식과 첨부 자료를 반영해 작성합니다.`
    case 'meeting':
      return head + '회의 요약 예시\n\n• 논의 안건: 입력하신 회의록의 주요 안건이 여기에 정리됩니다.\n• 결정 사항: 합의된 내용이 항목별로 정리됩니다.\n• 후속 조치: 아래 "추출된 할 일" 목록을 확인하세요.'
    case 'rules':
      return head + (context
        ? `찾은 조항을 근거로 답하면 다음과 같습니다.\n\n${context}\n\n실제 연결 시 위 조항을 근거로 질문에 맞춘 설명을 덧붙이고 조항 번호를 함께 인용합니다.`
        : '파일함이나 이 화면에 규정 원문을 올리면 관련 조항을 찾아 근거로 답합니다.')
    case 'items':
      return head + `문항 출제 결과 예시 (실제 연결 시 강의자료 내용으로 생성)\n\n문항 1. [강의자료 핵심 개념]에 대한 설명으로 옳은 것은?\n ① [선지 1]\n ② [선지 2]\n ③ [선지 3]\n ④ [선지 4]\n ⑤ [선지 5]\n정답: [ ]\n해설: [근거 문장과 강의자료 쪽수]`
    case 'design':
      return head + `수업 설계 초안 예시\n\n• 학습목표: [행동 동사로 쓴 목표 2~3개]\n• 도입(10분): [선수 학습 확인 질문]\n• 전개(60분): [핵심 개념 설명 → 사례 → 짝 활동]\n• 정리(20분): [형성평가 3문항, 다음 차시 예고]\n• 평가: [루브릭 기준]`
    case 'research':
      return head + `"${q}"에 대한 리서치 계획 예시\n\n1. 핵심 질문 정리\n2. 검색어와 데이터베이스 선정\n3. 자료 선별 기준\n4. 요약표와 출처 목록 작성\n\n실제 연결 시 웹 검색과 출처 인용이 포함된 보고서를 작성합니다.`
    case 'notes':
      return head + '학습 노트 예시\n\n■ 핵심 요약: [수업 핵심 3줄]\n■ 주요 용어: [용어 1] / [용어 2] / [용어 3]\n■ 복습 퀴즈: [문항 3개]\n■ 다음 수업 전 확인할 것: [ ]'
    case 'clinical':
      return head + '실습 일지 정리 예시\n\n1. 실습 일자와 부서: [ ]\n2. 관찰·수행한 내용: 입력 내용을 학과 양식 항목에 맞춰 정리합니다.\n3. 학습 포인트: 관련 이론과 연결합니다.\n4. 다음 실습 목표: [ ]'
    case 'coursebot':
      return head + `강좌봇 응답 예시\n\n좋은 질문이에요. 바로 답을 알려 드리기보다 먼저 힌트를 드릴게요.\n\n힌트 1: 강의자료의 [관련 단원]에서 핵심 개념을 다시 확인해 보세요.\n힌트 2: 그 개념을 질문 상황에 적용하면 어떤 결과가 나올지 생각해 보세요.\n\n정리한 답을 보내 주면 맞는지 함께 확인해 드릴게요.`
    case 'apps':
      return head + `"${q}" 앱 구상 예시\n\n• 화면 1: 입력 화면 [입력 항목]\n• 화면 2: 결과 화면 [비교 기준과 해설]\n• 데이터: [기준값 출처]\n\n실제 연결 시 바로 실행할 수 있는 코드 초안과 배포 방법까지 안내합니다.`
    case 'analysis':
      return head + '분석 결과 예시\n\n• 핵심 요약: [3줄]\n• 집계표: [항목별 합계와 비율]\n• 눈여겨볼 점: [이상값, 변화 추이]\n\n실제 연결 시 첨부 파일 내용을 직접 읽어 분석합니다.'
    case 'campus':
      return head + '학칙·학사안내를 근거로 답합니다. 실제 연결 전에는 학사 담당 부서 안내를 확인해 주세요.'
    default:
      return head + `"${q}"에 대해 실제 연결 시 선택한 AI 모델이 답변합니다.`
  }
}
