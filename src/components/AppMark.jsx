import { CATEGORY_TONE } from '../data/webapps.js'

// 앱 표시: 앱을 줄인 두 글자를 분야 색으로 보여 줍니다(이모지 대신).
export function AppMark({ app, size = 52 }) {
  const tone = CATEGORY_TONE[app.category] || 'admin'
  if (app.icon) return <img className="app-mark" src={app.icon} alt="" aria-hidden="true" style={{ width: size, height: size, borderRadius: size * 0.24, objectFit: 'cover', padding: 0, background: 'none' }} />
  const len = [...app.mono].length
  return (
    <span className={`app-mark t-${tone}`} style={{ width: size, height: size, fontSize: size * (len > 2 ? 0.3 : len === 1 ? 0.5 : 0.36) }} aria-hidden="true">
      {app.mono}
    </span>
  )
}
