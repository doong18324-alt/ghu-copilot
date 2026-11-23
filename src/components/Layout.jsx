import { NavLink, Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { ROLES, SITE } from '../config.js'
import { DemoBanner, Icon } from './ui.jsx'
import { roleFromPath } from '../lib/store.js'

export default function Layout() {
  const role = roleFromPath(useLocation().pathname)
  const conf = ROLES[role]
  if (!conf) return <Navigate to="/" replace />

  return (
    <div className="app">
      <nav className="sidebar" aria-label={`${conf.label} 메뉴`}>
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span><span className="brand-name">{SITE.name}</span><span className="brand-sub">{SITE.sub}</span></span>
        </Link>

        <div className="role-switch" aria-label="역할 전환">
          {Object.entries(ROLES).map(([key, r]) => (
            <NavLink key={key} to={`/${key}`} end={false} className={() => (key === role ? 'active' : '')}>{r.label}</NavLink>
          ))}
        </div>

        {conf.groups.map(g => (
          <div className="nav-group" key={g.label}>
            <span className="nav-label">{g.label}</span>
            {g.items.map(([path, label]) => (
              <NavLink key={path} to={`/${role}${path ? '/' + path : ''}`} end>{label}</NavLink>
            ))}
          </div>
        ))}

        <div className="side-links">
          <Link to="/about">본부 소개</Link>
          <Link to="/news">성과 소식</Link>
          <Link to="/recruit">프로그램 모집</Link>
        </div>

        <div className="usage">
          <small>이번 달 사용량</small>
          <div className="meter" aria-hidden="true"><div style={{ width: '0%' }} /></div>
          <span>0 / [월 한도] 크레딧</span>
        </div>
      </nav>

      <main className="main">
        <div className="container">
          <div className="topbar">
            <div>
              <div className="eyebrow">{conf.label} 앱</div>
              <div className="title">[이름] {conf.greeting}</div>
            </div>
            <div className="row">
              <label className="sr-only" htmlFor="global-search">검색</label>
              <input id="global-search" className="input" type="search" placeholder="대화, 문서, 자료 검색" style={{ width: 240 }} />
              <button className="btn" aria-label="알림" style={{ padding: 0, width: 44 }}><Icon name="bell" size={20} /></button>
            </div>
          </div>
          <DemoBanner />
          <Outlet />
        </div>
      </main>
    </div>
  )
}
