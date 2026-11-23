import { useState } from 'react'
import { Link, NavLink, Outlet, useParams, Navigate } from 'react-router-dom'
import { SITE } from '../config.js'
import { Card, Empty } from '../components/ui.jsx'
import { ABOUT_PAGES, GREETING_PRESIDENT as GP, GREETING_DIRECTOR as GD, VISION, STRATEGY, ORGANIZATION, CURRICULUM, SAFETY, LOCATION } from '../data/about.js'
import { useAchievements, Cover, usePrograms, programState, Benefits, PROGRAM_TYPES, ROLE_LABEL, ROLE_TONE, TypeFilter, maskName } from './shared.jsx'

/* 로그인 없이 누구나 보는 영역: 본부 소개, 성과 소식, 프로그램 모집 */

export function PublicLayout() {
  return (
    <div className="public">
      <header className="public-bar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span><span className="brand-name">{SITE.name}</span><span className="brand-sub">{SITE.slogan}</span></span>
        </Link>
        <nav className="public-nav" aria-label="공개 메뉴">
          <NavLink to="/about">본부 소개</NavLink>
          <NavLink to="/news">성과 소식</NavLink>
          <NavLink to="/recruit">프로그램 모집</NavLink>
        </nav>
        <Link to="/" className="btn primary" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>시작하기</Link>
      </header>
      <main className="public-main"><Outlet /></main>
      <footer className="public-foot">
        <span>광주보건대학교 AI대학혁신본부</span>
        <span>{LOCATION.address} · {LOCATION.phone}</span>
      </footer>
    </div>
  )
}

function Section({ title, children }) {
  return <section className="stack" style={{ gap: 14 }}><h2 className="about-h2">{title}</h2>{children}</section>
}

function Greeting() {
  const [who, setWho] = useState('president')
  return (
    <>
      <TypeFilter value={who === 'president' ? '총장 인사말' : '본부장 인사말'} onChange={v => setWho(v === '총장 인사말' ? 'president' : 'director')} options={['총장 인사말', '본부장 인사말']} />
      {who === 'president' ? (
        <article className="prose">
          <h2 className="about-lead">{GP.title}</h2>
          <p className="muted">{GP.signer}</p>
          {GP.intro.map(t => <p key={t}>{t}</p>)}
          <h3>{GP.realitiesTitle}</h3>
          <ol className="num-list">{GP.realities.map(([h, t]) => <li key={h}><b>{h}</b> {t}</li>)}</ol>
          <h3>{GP.choicesTitle}</h3>
          {GP.choices.map(t => <p key={t}>{t}</p>)}
          <div className="grid">{GP.audiences.map(([h, t]) => <div key={h} className="tile"><b>{h}</b><span>{t}</span></div>)}</div>
          {GP.closing.map(t => <p key={t}>{t}</p>)}
          <p className="sign">{GP.date}<br />{GP.signer}</p>
        </article>
      ) : (
        <article className="prose">
          <h2 className="about-lead">{GD.title}</h2>
          {GD.body.map(t => <p key={t}>{t}</p>)}
        </article>
      )}
    </>
  )
}

function Vision() {
  return (
    <>
      <div className="grid">
        <div className="tile big"><small>Vision</small><b>{VISION.vision[0]}</b><span>{VISION.vision[1]}</span></div>
        <div className="tile big"><small>Mission</small><b>{VISION.mission[0]}</b><span>{VISION.mission[1]}</span></div>
      </div>
      <Section title="모든 AI 사업이 통과해야 할 세 가지 기준">
        <ol className="num-list">{VISION.criteria.map(([h, t]) => <li key={h}><b>{h}</b> {t}</li>)}</ol>
      </Section>
      <Section title="건학이념 위에 AI를 세웁니다"><p className="prose-p">{VISION.founding}</p></Section>
    </>
  )
}

function Strategy() {
  return (
    <>
      <div className="tile big"><small>{STRATEGY.eyebrow}</small><b>{STRATEGY.title}</b><span>{STRATEGY.desc}</span></div>
      <div className="grid">{STRATEGY.pillars.map(([h, t]) => <div key={h} className="tile"><b>{h}</b><span>{t}</span></div>)}</div>
    </>
  )
}

function Organization() {
  return (
    <>
      <Section title="조직 구성">
        <ol className="org-chart">{ORGANIZATION.chart.map(x => <li key={x}>{x}</li>)}</ol>
      </Section>
      <Section title="구성원 안내">
        <div className="table-wrap">
          <table>
            <thead><tr><th>이름</th><th>직위</th><th>담당업무</th><th>전화번호</th></tr></thead>
            <tbody>{ORGANIZATION.members.map(m => <tr key={m[0]}>{m.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </Section>
    </>
  )
}

function Curriculum() {
  return (
    <>
      <p className="prose-p">{CURRICULUM.desc}</p>
      <div className="grid">
        {CURRICULUM.stages.map(([stage, title, items, goal]) => (
          <div key={stage} className="tile"><small>{stage}</small><b>{title}</b>
            <ul className="dot-list">{items.map(i => <li key={i}>{i}</li>)}</ul>
            <span className="badge blue" style={{ alignSelf: 'flex-start' }}>{goal}</span>
          </div>
        ))}
      </div>
      <Section title="X+AI 전공융합">
        <div className="grid">{CURRICULUM.xai.map(([h, t]) => <div key={h} className="tile"><b>{h}</b><span>{t}</span></div>)}</div>
      </Section>
    </>
  )
}

function Safety() {
  return (
    <>
      <p className="prose-p">{SAFETY.lead}</p>
      <Section title="GHU 책임 있는 AI 원칙">
        <div className="grid">{SAFETY.principles.map(([h, t], i) => <div key={h} className="tile"><small>0{i + 1}</small><b>{h}</b><span>{t}</span></div>)}</div>
      </Section>
      <Section title="어떤 정보를 어디에 넣을 수 있나요">
        <div className="table-wrap">
          <table>
            <thead><tr><th>등급</th><th>예시</th><th>공개 AI 도구</th><th>대학 승인 도구</th></tr></thead>
            <tbody>{SAFETY.grades.map(g => <tr key={g[0]}><td><b>{g[0]}</b></td><td>{g[1]}</td><td><span className={`badge ${g[2] === '가능' ? 'green' : 'red'}`}>{g[2]}</span></td><td><span className={`badge ${g[3].startsWith('가능') ? 'green' : g[3].startsWith('절대') ? 'red' : 'amber'}`}>{g[3]}</span></td></tr>)}</tbody>
          </table>
        </div>
        {SAFETY.gradeNotes.map(t => <div key={t} className="check warn">{t}</div>)}
      </Section>
      <Section title="보건의료 AI 윤리">
        <div className="grid">{SAFETY.healthcare.map(([h, t]) => <div key={h} className="tile"><b>{h}</b><span>{t}</span></div>)}</div>
      </Section>
      <Section title="실습실 게시 지침">
        <ol className="num-list">{SAFETY.labRules.map(t => <li key={t}>{t}</li>)}</ol>
      </Section>
    </>
  )
}

function Location() {
  return (
    <>
      <div className="grid">
        <div className="tile"><small>주소</small><b style={{ fontSize: 16 }}>{LOCATION.address}</b></div>
        <div className="tile"><small>전화</small><b>{LOCATION.phone}</b></div>
      </div>
      <Section title="버스 이용 시">
        <ul className="list">{LOCATION.bus.map(([from, line]) => <li key={from}><span>{from}</span><b>{line}</b></li>)}</ul>
      </Section>
      <Section title="자가용 이용 시"><p className="prose-p">{LOCATION.car}</p></Section>
    </>
  )
}

const ABOUT_VIEWS = { greeting: Greeting, vision: Vision, strategy: Strategy, organization: Organization, curriculum: Curriculum, safety: Safety, location: Location }

export function About() {
  const { page = 'greeting' } = useParams()
  const View = ABOUT_VIEWS[page]
  if (!View) return <Navigate to="/about" replace />
  const title = ABOUT_PAGES.find(([k]) => k === page)[1]
  return (
    <div className="about">
      <nav className="about-nav" aria-label="본부 소개 메뉴">
        {ABOUT_PAGES.map(([k, label]) => <NavLink key={k} to={k === 'greeting' ? '/about' : `/about/${k}`} end>{label}</NavLink>)}
      </nav>
      <div className="about-body">
        <div className="stack" style={{ gap: 4 }}>
          <span className="muted small">AI대학혁신본부 소개</span>
          <h1 className="page-title">{title}</h1>
        </div>
        <View />
      </div>
    </div>
  )
}

/* 성과 소식: 구성원이 'AI 활용 실적'에 올린 프로젝트·개발·사례를 소식처럼 보여 줍니다. */
export function Showcase() {
  const [items] = useAchievements()
  const [view, setView] = useState('전체')
  const shown = items.filter(x => view === '전체' || ROLE_LABEL[x.role] === view)
  const [lead, ...rest] = shown
  const meta = x => [maskName(x.author), x.dept, x.date].filter(Boolean).join(' · ')
  const Badges = ({ x }) => <span className="row" style={{ gap: 6 }}><span className={`badge ${ROLE_TONE[x.role]}`}>{ROLE_LABEL[x.role]}</span><span className="badge">{x.type}</span></span>
  return (
    <div className="container">
      <div className="stack" style={{ gap: 6 }}>
        <span className="muted small">GHU 바이탈 성과 소식</span>
        <h1 className="page-title">학생·교수·직원의 AI 활용 성과</h1>
        <p className="muted">AI를 활용한 프로젝트, 직접 개발한 앱과 에이전트, 수업 혁신과 업무 개선 사례를 역할별로 모았습니다. 이름은 가운데 글자를 가려 표시합니다.</p>
      </div>
      <TypeFilter value={view} onChange={setView} options={['전체', '학생', '교수', '직원']} />
      {shown.length === 0 ? <Empty>아직 올라온 소식이 없습니다.</Empty> : (
        <>
          <Link to={`/news/${lead.id}`} className="news-lead card">
            <Cover item={lead} />
            <div className="stack" style={{ gap: 10, minWidth: 0 }}>
              <Badges x={lead} />
              <h2>{lead.title}</h2>
              {(lead.summary || lead.desc) && <p className="clamp three">{lead.summary || lead.desc}</p>}
              <p className="muted small">{meta(lead)}</p>
            </div>
          </Link>
          <div className="news-grid">
            {rest.map(x => (
              <Link key={x.id} to={`/news/${x.id}`} className="card news-card">
                <Cover item={x} />
                <div className="news-card-body">
                  <Badges x={x} />
                  <h3>{x.title}</h3>
                  {(x.summary || x.desc) && <p className="small clamp">{x.summary || x.desc}</p>}
                  <p className="muted small" style={{ marginTop: 'auto' }}>{meta(x)}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
      <Card>
        <p className="muted" style={{ margin: 0 }}>내 성과를 올리려면 역할을 선택해 들어간 뒤 &lsquo;AI 활용 실적&rsquo;에서 등록합니다.</p>
        <div><Link to="/" className="btn primary" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>역할 선택으로 가기</Link></div>
      </Card>
    </div>
  )
}

// 기사 한 편: 구분 → 제목 → 요약 → 글쓴이·날짜 → 대표 사진·설명 → 본문 → 결과물 → 다른 소식
export function Article() {
  const { id } = useParams()
  const [items] = useAchievements()
  const x = items.find(i => String(i.id) === id)
  if (!x) return (
    <div className="container">
      <Empty>소식을 찾을 수 없습니다. 지워졌거나 주소가 바뀌었을 수 있습니다.</Empty>
      <div><Link to="/news" className="btn soft news-link">성과 소식 목록으로</Link></div>
    </div>
  )
  const paras = (x.desc || '').split(/\n+/).map(t => t.trim()).filter(Boolean)
  const more = items.filter(i => i.id !== x.id).slice(0, 3)
  return (
    <div className="container article">
      <Link to="/news" className="muted small">← 성과 소식</Link>
      <header className="stack" style={{ gap: 12 }}>
        <span className="row" style={{ gap: 6 }}><span className={`badge ${ROLE_TONE[x.role]}`}>{ROLE_LABEL[x.role]}</span><span className="badge">{x.type}</span></span>
        <h1>{x.title}</h1>
        {x.summary && <p className="article-summary">{x.summary}</p>}
        <p className="muted small article-byline">{[maskName(x.author), x.dept].filter(Boolean).join(' · ')}{x.date ? ` | ${x.date}` : ''}</p>
      </header>
      {x.photo && (
        <figure className="article-figure">
          <img src={x.photo} alt={x.caption || x.title} />
          {x.caption && <figcaption>{x.caption}</figcaption>}
        </figure>
      )}
      <div className="article-body">
        {paras.length ? paras.map((t, i) => <p key={i}>{t}</p>) : <p className="muted">본문이 없습니다.</p>}
      </div>
      {x.link && <div><a className="btn primary news-link" href={x.link} target="_blank" rel="noopener noreferrer">결과물 보기</a></div>}
      {more.length > 0 && (
        <section className="stack" style={{ gap: 16 }}>
          <h2 className="article-more">다른 소식</h2>
          <div className="news-grid">
            {more.map(m => (
              <Link key={m.id} to={`/news/${m.id}`} className="card news-card">
                <Cover item={m} />
                <div className="news-card-body">
                  <h3>{m.title}</h3>
                  <p className="muted small" style={{ marginTop: 'auto' }}>{[ROLE_LABEL[m.role], m.date].filter(Boolean).join(' · ')}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/* 프로그램 모집: 직원이 올린 프로그램을 누구나 볼 수 있게 한 목록. 신청은 학생 화면에서 합니다. */
export function Recruit() {
  const [posts] = usePrograms()
  const [type, setType] = useState('전체')
  const shown = posts.filter(p => type === '전체' || p.type === type)
  return (
    <div className="container">
      <div className="stack" style={{ gap: 6 }}>
        <span className="muted small">GHU 바이탈 프로그램 모집</span>
        <h1 className="page-title">지금 참여할 수 있는 프로그램</h1>
        <p className="muted">서포터즈, 자격증 과정, 비교과·소단위과정의 참여 혜택과 모집 현황입니다.</p>
      </div>
      <TypeFilter value={type} onChange={setType} options={['전체', ...PROGRAM_TYPES]} />
      {shown.length === 0 ? <Empty>해당 구분의 프로그램이 없습니다.</Empty> : (
        <div className="news-grid">
          {shown.map(p => {
            const [state, tone] = programState(p)
            return (
              <article key={p.id} className="card news-card">
                <span className="row" style={{ gap: 6 }}><span className="badge blue">{p.type}</span><span className={`badge ${tone}`}>{state}</span></span>
                <h3>{p.title}</h3>
                <Benefits program={p} />
                <p className="muted small">{p.dept || '[주관 부서]'} · 마감 {p.due || '[날짜]'} · 운영 {p.period || '[기간]'} · 신청 {p.applicants.length}명{p.quota > 0 ? ` / 정원 ${p.quota}명` : ''}</p>
                {p.desc && <p className="small">{p.desc}</p>}
              </article>
            )
          })}
        </div>
      )}
      <Card>
        <p className="muted" style={{ margin: 0 }}>신청은 학생 화면의 &lsquo;프로그램 신청&rsquo;에서 합니다.</p>
        <div><Link to="/student/programs" className="btn primary" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>신청하러 가기</Link></div>
      </Card>
    </div>
  )
}
