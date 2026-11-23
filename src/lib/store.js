import { useEffect, useState } from 'react'

const PREFIX = 'ghu-copilot:'

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function useStored(key, fallback) {
  const [state, setState] = useState(() => ({ key, value: load(key, fallback) }))
  let current = state
  // 같은 화면이 다른 저장 키로 다시 쓰일 때(역할 전환 등) 이전 값이 새 키에 섞이지 않게 다시 읽습니다.
  if (state.key !== key) {
    current = { key, value: load(key, fallback) }
    setState(current)
  }
  useEffect(() => {
    try { localStorage.setItem(PREFIX + current.key, JSON.stringify(current.value)) } catch { /* 저장 불가 환경 */ }
  }, [current.key, current.value])
  const setValue = next => setState(s => ({ key: s.key, value: typeof next === 'function' ? next(s.value) : next }))
  return [current.value, setValue]
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export function roleFromPath(pathname) {
  return pathname.split('/')[1] || ''
}
