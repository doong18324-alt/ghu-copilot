import { Link } from 'react-router-dom'
import { AI_MODE } from '../lib/ai.js'

const ICONS = {
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  scale: <><path d="M12 3v18" /><path d="M5 7h14" /><path d="M5 7l-3 7a4 4 0 0 0 6 0z" /><path d="M19 7l-3 7a4 4 0 0 0 6 0z" /></>,
  doc: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  code: <><path d="M8 7l-5 5 5 5" /><path d="M16 7l5 5-5 5" /></>,
  cap: <><path d="M2 7l10-4 10 4-10 4z" /><path d="M6 9v5c0 2 3 3 6 3s6-1 6-3V9" /></>,
  bot: <><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 4v4" /><path d="M9 14h.01" /><path d="M15 14h.01" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  check: <><path d="M9 11l3 3 8-8" /><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M3 11h18" /></>,
  alert: <><path d="M12 3l9 16H3z" /><path d="M12 10v4" /><path d="M12 17h.01" /></>,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
}

export function Icon({ name, color = 'currentColor', size = 22 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  )
}

const TONES = {
  blue: ['var(--blue-soft)', 'var(--blue-dark)'],
  green: ['var(--green-soft)', 'var(--green)'],
  amber: ['var(--amber-soft)', 'var(--amber)'],
  red: ['var(--red-soft)', 'var(--red)'],
}

export function Feature({ to, icon, tone = 'blue', title, desc }) {
  const [bg, fg] = TONES[tone]
  return (
    <Link to={to} className="feature">
      <div className="icon" style={{ background: bg }}><Icon name={icon} color={fg} /></div>
      <div><b>{title}</b><span>{desc}</span></div>
    </Link>
  )
}

export function Card({ title, action, children, className = '', id }) {
  const hid = id || (title ? 'h-' + title.replace(/\s/g, '') : undefined)
  return (
    <section className={`card ${className}`} aria-labelledby={title ? hid : undefined}>
      {(title || action) && (
        <div className="card-head">
          {title && <h2 id={hid}>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageHead({ eyebrow, title, desc }) {
  return (
    <div className="stack" style={{ gap: 4 }}>
      {eyebrow && <span className="muted small">{eyebrow}</span>}
      <h1 style={{ fontSize: 24 }}>{title}</h1>
      {desc && <p className="muted">{desc}</p>}
    </div>
  )
}

export function DemoBanner() {
  if (AI_MODE !== 'demo') return null
  return (
    <div className="demo-banner" role="status">
      시연 모드입니다. AI 응답은 예시이며, 입력한 내용은 이 브라우저에만 저장됩니다. 실제 AI 연결 방법은 연결 안내서를 참고하세요.
    </div>
  )
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>
}
