import { useState } from 'react'
import { Link, useParams, useSearchParams, Navigate } from 'react-router-dom'
import { Card, Empty, PageHead } from '../components/ui.jsx'
import { useStored } from '../lib/store.js'
import { WEBAPPS, MARKET_ROLES, CATEGORIES, CATEGORY_TONE, appUrl, appById, searchApps, NATIVE_IDS } from '../data/webapps.js'
import { AppMark } from '../components/AppMark.jsx'

/* GHU 바이탈 앱마켓: 구성원이 만든 웹앱을 모아 찾고 바로 실행합니다. */

const ROLE_TONE = { student: 'green', faculty: 'blue', staff: 'amber' }

function RoleBadges({ app }) {
  const all = app.roles.length === 3
  if (all) return <span className="badge">모든 구성원</span>
  return app.roles.map(r => <span key={r} className={`badge ${ROLE_TONE[r]}`}>{MARKET_ROLES[r]}</span>)
}

const roleText = app => app.roles.length === 3 ? '모든 구성원' : app.roles.map(r => MARKET_ROLES[r]).join('·')
const isNative = app => NATIVE_IDS.includes(app.id)

// 앱을 새 탭으로 열고, 최근 사용 목록에 남깁니다.
function useRecent() { return useStored('webapps:recent', []) }
function OpenButton({ app, primary = true, label = '열기' }) {
  const [, setRecent] = useRecent()
  const remember = () => setRecent(r => [app.id, ...r.filter(x => x !== app.id)].slice(0, 6))
  if (NATIVE_IDS.includes(app.id)) {
    return <Link to={`/run/${app.id}`} className={primary ? 'btn primary app-open' : 'btn app-open'} onClick={remember}>{label}</Link>
  }
  return (
    <a href={appUrl(app)} target="_blank" rel="noopener" className={primary ? 'btn primary app-open' : 'btn app-open'}
      onClick={() => setRecent(r => [app.id, ...r.filter(x => x !== app.id)].slice(0, 6))}
      aria-label={`${app.title} 새 탭에서 열기`}>{label === '열기' ? '새 탭에서 열기' : label}</a>
  )
}

// 앱 한 줄: 두 글자 마크, 이름과 설명, 대상·판, 열기
function AppRow({ app, detail = true }) {
  return (
    <article className="app-row">
      <AppMark app={app} />
      <div className="app-row-body">
        <h3>{detail ? <Link to={`/market/${app.id}`}>{app.title}</Link> : app.title}</h3>
        <p>{app.summary}</p>
        <span className="app-row-meta">{roleText(app)} <i aria-hidden="true" /> {isNative(app) ? <b className="ed-new">바이탈판</b> : <span className="ed-old">이전판, 새 탭에서 열림</span>}</span>
        {!detail && app.caution && <p className="app-caution">{app.caution}</p>}
      </div>
      <div className="app-row-act"><OpenButton app={app} /></div>
    </article>
  )
}

// 분야별로 묶어 보여 줍니다(분야 색이 마크 색과 같습니다).
function Shelves({ apps, detail = true }) {
  const cats = CATEGORIES.filter(c => apps.some(a => a.category === c))
  return cats.map(c => {
    const list = apps.filter(a => a.category === c)
    return (
      <section key={c} className={`shelf t-${CATEGORY_TONE[c]}`}>
        <h2 className="shelf-h">{c}<span>{list.length}</span></h2>
        <div className="shelf-list">{list.map(a => <AppRow key={a.id} app={a} detail={detail} />)}</div>
      </section>
    )
  })
}

function SearchBox({ value, onChange, id = 'market-q', placeholder = '앱 이름이나 할 일로 찾기 (예: 국시, 공지, 민원)' }) {
  return (
    <div className="market-search">
      <label htmlFor={id} className="sr-only">앱 검색</label>
      <input id={id} type="search" className="input" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} autoComplete="off" />
    </div>
  )
}

function Chips({ value, onChange, options, label }) {
  return (
    <div className="row" style={{ gap: 8 }} role="group" aria-label={label}>
      {options.map(([v, t]) => <button key={v} type="button" className={value === v ? 'chip on' : 'chip'} aria-pressed={value === v} onClick={() => onChange(v)}>{t}</button>)}
    </div>
  )
}

/* 앱마켓 전체 화면 */
export function AppMarket() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const role = params.get('role') || 'all'
  const cat = params.get('cat') || 'all'
  const set = (k, v) => { const p = new URLSearchParams(params); if (!v || v === 'all') p.delete(k); else p.set(k, v); setParams(p, { replace: true }) }

  const filtered = WEBAPPS.filter(a => (role === 'all' || a.roles.includes(role)) && (cat === 'all' || a.category === cat))
  const shown = searchApps(filtered, q)
  const usedCats = CATEGORIES.filter(c => WEBAPPS.some(a => a.category === c))

  return (
    <div className="container market">
      <section className="market-hero">
        <h1>앱마켓</h1>
        <p>AI대학혁신본부와 구성원이 만든 웹앱 {WEBAPPS.length}종. 설치나 로그인 없이 열리고, 입력한 내용은 이 브라우저 안에서만 처리합니다. 바이탈판 {NATIVE_IDS.length}종은 이 화면 안에서, 이전판은 새 탭에서 열립니다.</p>
        <SearchBox value={q} onChange={v => set('q', v)} />
      </section>

      <section className="stack" style={{ gap: 12 }}>
        <Chips label="대상 선택" value={role} onChange={v => set('role', v)} options={[['all', '전체'], ...Object.entries(MARKET_ROLES)]} />
        <Chips label="분야 선택" value={cat} onChange={v => set('cat', v)} options={[['all', '모든 분야'], ...usedCats.map(c => [c, c])]} />
      </section>

      <section className="stack" style={{ gap: 16 }}>
        <div className="home-head">
          <h2 className="home-h">{q ? `‘${q}’ 검색 결과` : '전체 앱'} <span className="muted" style={{ fontSize: 18, fontWeight: 600 }}>{shown.length}</span></h2>
          {(q || role !== 'all' || cat !== 'all') && <button type="button" className="btn" onClick={() => setParams({}, { replace: true })}>조건 지우기</button>}
        </div>
        {shown.length === 0 ? <Empty>조건에 맞는 앱이 없습니다. 다른 낱말로 찾아보세요.</Empty> : (
          <Shelves apps={shown} />
        )}
      </section>

      <Card title="앱 올리기">
        <p className="muted">직접 만든 웹앱을 앱마켓에 올리고 싶으면 AI대학혁신본부에 보내 주세요. 개인정보를 서버로 보내지 않는지, 안내 문구가 충분한지 확인한 뒤 올립니다.</p>
      </Card>
    </div>
  )
}

/* 앱 상세 */
export function AppDetail() {
  const { id } = useParams()
  const app = appById(id)
  if (!app) return <Navigate to="/market" replace />
  const related = WEBAPPS.filter(a => a.id !== app.id && a.category === app.category).slice(0, 3)
  return (
    <div className="container market">
      <Link to="/market" className="small" style={{ fontWeight: 700, textDecoration: 'none' }}>← 앱마켓</Link>
      <section className="card app-detail">
        <AppMark app={app} size={96} />
        <div className="stack" style={{ gap: 12, minWidth: 0 }}>
          <h1 className="page-title">{app.title}</h1>
          <span className="row" style={{ gap: 6 }}><span className="badge">{app.category}</span><RoleBadges app={app} /><span className="badge">{app.version}</span>{isNative(app) ? <span className="badge green">바이탈판</span> : <span className="badge">이전판 · 새 탭</span>}</span>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65 }}>{app.summary}</p>
          <div className="row"><OpenButton app={app} label="앱 열기" /></div>
        </div>
      </section>
      <div className="grid-2">
        <Card title="주요 기능">
          <ul className="dot-list">{app.features.map(f => <li key={f}>{f}</li>)}</ul>
        </Card>
        <Card title="이용 전 확인">
          <ul className="dot-list">
            <li>입력한 내용은 서버로 보내지 않고 이 브라우저 안에서만 처리합니다.{NATIVE_IDS.includes(app.id) && ' 지후 AI로 다듬기를 누를 때만 개인정보를 가린 뒤 교내 AI 서버로 보냅니다.'}</li>
            {app.stored && <li>올린 파일과 설정은 이 기기의 브라우저에 저장됩니다. 공용 PC에서는 사용 후 지워 주세요.</li>}
            <li>결과는 참고용 초안입니다. 사실과 수치는 원문과 담당자가 확인합니다.</li>
            {app.caution && <li><b>{app.caution}</b></li>}
          </ul>
        </Card>
      </div>
      {related.length > 0 && (
        <section className="stack" style={{ gap: 16 }}>
          <h2 className="home-h">같은 분야의 앱</h2>
          <div className="shelf-list">{related.map(a => <AppRow key={a.id} app={a} />)}</div>
        </section>
      )}
    </div>
  )
}

/* 역할별 웹앱 화면(학생·교수·직원 앱 안) */
const ROLE_PAGE = {
  student: ['학생 웹앱', '공부, 국가고시, 취업 준비, 학교생활에 바로 쓰는 웹앱입니다.'],
  faculty: ['교수 웹앱', '수업 자료, 학생 지도, 연구비 집행, 학과 홍보에 쓰는 웹앱입니다.'],
  staff: ['직원 웹앱', '공문·보도자료, 규정 응대, 결의서 점검, 기획에 쓰는 웹앱입니다.'],
}

const CORE_LABEL = { student: '학생에게 맞춘 앱', faculty: '수업·지도·연구 행정', staff: '행정 업무' }

export function RoleApps({ role }) {
  const [q, setQ] = useState('')
  const [recent] = useRecent()
  const [title, desc] = ROLE_PAGE[role]
  const mine = WEBAPPS.filter(a => a.roles.includes(role))
  const core = mine.filter(a => a.roles.length < 3)
  const common = mine.filter(a => a.roles.length === 3)
  const recentApps = recent.map(appById).filter(a => a && a.roles.includes(role))
  const found = q.trim() ? searchApps(mine, q) : null

  return (
    <>
      <PageHead title={title} desc={desc} />
      <Card>
        <SearchBox id={`role-q-${role}`} value={q} onChange={setQ} placeholder="이 화면의 앱에서 찾기" />
        <p className="muted small">전체 {WEBAPPS.length}종은 <Link to={`/market?role=${role}`}>앱마켓</Link>에서 볼 수 있습니다. 앱은 새 탭에서 열립니다.</p>
      </Card>

      {found ? (
        found.length === 0 ? <Empty>찾는 앱이 없습니다. <Link to={`/market?q=${encodeURIComponent(q)}`}>앱마켓 전체에서 찾기</Link></Empty>
          : <div className="shelf-list">{found.map(a => <AppRow key={a.id} app={a} detail={false} />)}</div>
      ) : (
        <>
          {recentApps.length > 0 && (
            <Card title="최근 사용">
              <div className="row" style={{ gap: 8 }}>{recentApps.map(a => <OpenButton key={a.id} app={a} primary={false} label={a.title} />)}</div>
            </Card>
          )}
          <section className="stack" style={{ gap: 14 }}>
            <h2 className="section-h">{CORE_LABEL[role]}</h2>
            <div className="shelf-list">{core.map(a => <AppRow key={a.id} app={a} detail={false} />)}</div>
          </section>
          <section className="stack" style={{ gap: 14 }}>
            <h2 className="section-h">모든 구성원 공통</h2>
            <div className="shelf-list">{common.map(a => <AppRow key={a.id} app={a} detail={false} />)}</div>
          </section>
        </>
      )}
    </>
  )
}
