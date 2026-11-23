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
  const [value, setValue] = useState(() => load(key, fallback))
  useEffect(() => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch { /* 저장 불가 환경 */ }
  }, [key, value])
  return [value, setValue]
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export function roleFromPath(pathname) {
  return pathname.split('/')[1] || ''
}
