import { useState } from 'react'
import { Link, NavLink, Outlet, useParams, Navigate } from 'react-router-dom'
import { SITE } from '../config.js'
import jihu from '../assets/jihu.webp'
import { Card, Empty } from '../components/ui.jsx'
import { MANUALS, manualUrl } from '../data/library.js'
import { ABOUT_PAGES, GREETING_PRESIDENT as GP, GREETING_DIRECTOR as GD, VISION, STRATEGY, ORGANIZATION, CURRICULUM, SAFETY, LOCATION } from '../data/about.js'
import { useAchievements, Cover, ContactButton, usePrograms, programState, Benefits, PROGRAM_TYPES, ROLE_LABEL, ROLE_TONE, TypeFilter, maskName } from './shared.jsx'

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
          <NavLink to="/market">앱마켓</NavLink>
          <NavLink to="/guide">AI 활용 자료</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
        </nav>
        <Link to="/start" className="btn primary" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>시작하기</Link>
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
  const [dept, setDept] = useState(0)
  const C = CURRICULUM
  const d = C.xai[dept]
  const doc = id => MANUALS.find(m => m.id === id)
  return (
    <>
      <div className="tile big"><small>GHU AI 교육체계</small><b>{C.lead}</b><span>{C.desc}</span></div>
      <div className="row" style={{ gap: 8 }}><span className="small" style={{ fontWeight: 700 }}>모든 단계의 공통 원칙</span>{C.base.map(t => <span key={t} className="badge blue">{t}</span>)}</div>
      <Section title="3단계 AI 교육 로드맵">
        <div className="grid">
          {C.stages.map(([stage, area, question, goals, course, extra, outputs]) => (
            <div key={stage} className="tile"><small>{stage}</small><b>{area}</b><span>“{question}”</span>
              <ul className="dot-list">{goals.map(g => <li key={g}>{g}</li>)}</ul>
              <span className="small"><b style={{ fontSize: 13 }}>정규 교과</b> {course}</span>
              <span className="small"><b style={{ fontSize: 13 }}>비교과</b> {extra.join(', ')}</span>
              <span className="small"><b style={{ fontSize: 13 }}>산출물</b> {outputs.join(', ')}</span>
            </div>
          ))}
        </div>
        <div className="row"><Link to="/guide/manuals" className="small">1단계 학습 자료(자기주도학습·프롬프트 가이드북) 보기</Link></div>
      </Section>
      <Section title="학년별 이수 경로">
        <ol className="num-list">{C.path.map(([y, t, how, goal]) => <li key={y}><b>{y}: {t}</b> {how}. {goal}.</li>)}</ol>
      </Section>
      <Section title="이수 성과 관리와 혜택">
        <div className="grid">{C.benefits.map(([h, t]) => <div key={h} className="tile"><b>{h}</b><span>{t}</span></div>)}</div>
      </Section>
      <Section title="X × AI 전공융합">
        <p className="prose-p"><b>{C.xaiLead}</b> {C.xaiDesc}</p>
        <TypeFilter value={d[0]} onChange={v => setDept(C.xai.findIndex(x => x[0] === v))} options={C.xai.map(x => x[0])} />
        <div className="tile">
          <small>핵심 융합 테마</small><b>{d[1]}</b>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="xai-box"><small>기존 수업</small><span>{d[2]}</span></div>
            <div className="xai-box on"><small>AI 융합 수업</small><span>{d[3]}</span></div>
          </div>
          <span><b style={{ fontSize: 14 }}>수업 내 실습 예시</b> {d[4]}</span>
          <span><b style={{ fontSize: 14 }}>전공 지식으로 검증할 점</b> {d[5]}</span>
          <a className="btn app-open" style={{ alignSelf: 'flex-start' }} href={manualUrl(doc(d[6]))} target="_blank" rel="noopener">학과 가이드 PDF</a>
        </div>
      </Section>
      <Section title="교수자 수업설계 지원">
        <p className="prose-p">전공 수업에 AI를 도입하려는 교수자는 아래 양식을 내려받아 작성하고, 1:1 수업설계 컨설팅 신청서를 AI융합교육혁신원에 제출합니다.</p>
        <ul className="list">{C.support.map(doc).map(m => (
          <li key={m.id}><span>{m.title}</span><span className="row" style={{ gap: 6, flex: 'none' }}>
            <a className="btn app-open" href={manualUrl(m)} target="_blank" rel="noopener">PDF</a>
            {m.docx && <a className="btn app-open" href={manualUrl(m, 'docx')} download>워드 양식</a>}
          </span></li>
        ))}</ul>
      </Section>
    </>
  )
}

const SAFETY_TABS = ['4대 원칙', '입력 금지 4등급표', '보건의료 AI 윤리', '역할별 체크리스트']

function Safety() {
  const [tab, setTab] = useState(SAFETY_TABS[0])
  const [who, setWho] = useState(0)
  const [checked, setChecked] = useState({})
  const S = SAFETY
  const list = S.checklists[who]
  const done = list[2].filter((_, i) => checked[`${who}-${i}`]).length
  return (
    <>
      <p className="prose-p"><b>{S.lead}</b></p>
      <TypeFilter value={tab} onChange={setTab} options={SAFETY_TABS} />

      {tab === SAFETY_TABS[0] && (
        <>
          <p className="prose-p">{S.intro}</p>
          <div className="grid">{S.principles.map(([h, quote, dos, donts], i) => (
            <div key={h} className="tile"><small>0{i + 1}</small><b>{h}</b><span>“{quote}”</span>
              <ul className="dot-list">{dos.map(t => <li key={t}>{t}</li>)}</ul>
              {donts.map(t => <div key={t} className="check warn" style={{ fontSize: 13 }}>금지: {t}</div>)}
            </div>
          ))}</div>
        </>
      )}

      {tab === SAFETY_TABS[1] && (
        <>
          <p className="prose-p">{S.gradeLead}</p>
          <div className="grade-grid">{S.grades.map(([g, tone, kind, ex, allow, act]) => (
            <div key={g} className={`grade-card ${tone}`}>
              <div className="row" style={{ justifyContent: 'space-between' }}><b>{g} · {kind}</b><span className={`badge ${tone === 'blue' ? 'blue' : tone}`}>{allow}</span></div>
              <ul className="dot-list">{ex.map(t => <li key={t}>{t}</li>)}</ul>
              <span className="small"><b style={{ fontSize: 13 }}>필수 조치</b> {act.join(' · ')}</span>
            </div>
          ))}</div>
          <Section title="이렇게 하세요">
            <div className="table-wrap"><table>
              <thead><tr><th>상황</th><th>잘못된 예</th><th>올바른 예</th></tr></thead>
              <tbody>{S.cases.map(c => <tr key={c[0]}><td><b>{c[0]}</b></td><td>{c[1]}</td><td>{c[2]}</td></tr>)}</tbody>
            </table></div>
          </Section>
          <Section title="AI 사용 전 모델 학습 차단(Opt-out) 설정">
            <div className="grid">{S.optout.map(([tool, steps]) => <div key={tool} className="tile"><b>{tool}</b><ol className="num-list">{steps.map(t => <li key={t}>{t}</li>)}</ol></div>)}</div>
            <div className="check warn">{S.optoutNote}</div>
          </Section>
        </>
      )}

      {tab === SAFETY_TABS[2] && (
        <>
          <p className="prose-p"><b>“{S.healthLead}”</b></p>
          <div className="grid">{S.health.map(([h, sum, items], i) => (
            <div key={h} className="tile"><small>제{i + 1}원칙</small><b>{h}</b><span>{sum}</span><ul className="dot-list">{items.map(t => <li key={t}>{t}</li>)}</ul></div>
          ))}</div>
          <Section title="실습·수업 상황별 Q&A">
            {S.healthQA.map(([q, a]) => <details key={q} className="card faq-item"><summary><span className="faq-q">Q</span><span>{q}</span></summary><div className="faq-a"><span className="faq-q a">A</span><p>{a}</p></div></details>)}
          </Section>
          <Section title="실습실 게시 지침">
            <ol className="num-list">{S.labRules.map(t => <li key={t}>{t}</li>)}</ol>
          </Section>
        </>
      )}

      {tab === SAFETY_TABS[3] && (
        <>
          <TypeFilter value={list[0]} onChange={v => setWho(S.checklists.findIndex(c => c[0] === v))} options={S.checklists.map(c => c[0])} />
          <div className="tile">
            <div className="row" style={{ justifyContent: 'space-between' }}><b>{list[0]}용 6대 체크리스트</b><span className={`badge ${done === 6 ? 'green' : 'amber'}`}>{done} / 6 확인</span></div>
            <span>{list[1]}</span>
            <ul className="check-list">{list[2].map(([area, item], i) => {
              const k = `${who}-${i}`
              return <li key={k}><label><input type="checkbox" checked={!!checked[k]} onChange={e => setChecked({ ...checked, [k]: e.target.checked })} /><span><b>{area}</b> {item}</span></label></li>
            })}</ul>
            <a className="btn app-open" style={{ alignSelf: 'flex-start' }} href="./manuals/m55.pdf" target="_blank" rel="noopener">체크리스트 PDF</a>
          </div>
        </>
      )}
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
// 휴대폰으로 열었는지 판단합니다(화면 폭이 좁거나 휴대폰 브라우저인 경우).
export function isPhone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 820px)').matches || /Android.+Mobile|iPhone|iPod/i.test(navigator.userAgent)
}

// 첫 주소: 휴대폰은 앱 시작 화면으로, 컴퓨터는 홈페이지로 보냅니다.
export function Root() {
  return isPhone() ? <Navigate to="/start" replace /> : <Home />
}

const HOME_ROLES = [
  ['student', '학생', '지후 AI 학습 도우미, 국가고시 대비, 실습 일지, 프로그램 신청, 이력서 만들기'],
  ['faculty', '교수', '수업 설계, 강좌봇 만들기, 문항 생성, 학습 분석, 연구와 전공 앱 제작'],
  ['staff', '직원', '공문·기안 작성, 회의 정리, 규정 근거 Q&A, 평가·인증 자료, 프로그램 등록·관리'],
]

export function Home() {
  const [news] = useAchievements()
  const [programs] = usePrograms()
  const open = programs.filter(p => programState(p)[0] !== '마감').slice(0, 3)
  return (
    <div className="container home">
      <section className="home-hero card">
        <div className="stack" style={{ gap: 18, minWidth: 0 }}>
          <span className="home-eyebrow">광주보건대학교 AI대학혁신본부</span>
          <h1>{SITE.slogan}</h1>
          <p>학생·교수·직원이 함께 쓰는 {SITE.sub}, {SITE.name}입니다. 본부 소식과 프로그램 모집은 여기서 보고, 실제 업무와 학습은 앱에서 합니다.</p>
          <div className="row" style={{ gap: 10 }}>
            <Link to="/start" className="btn primary home-btn">{SITE.name} 시작하기</Link>
            <Link to="/about" className="btn home-btn">본부 소개</Link>
          </div>
        </div>
        <img src={jihu} alt="GHU 바이탈 AI 캐릭터 지후" />
      </section>

      <section className="stack" style={{ gap: 16 }}>
        <h2 className="home-h">역할별 앱 바로가기</h2>
        <div className="home-roles">
          {HOME_ROLES.map(([key, label, desc]) => (
            <Link key={key} to={`/${key}`} className="card home-role">
              <span className={`badge ${ROLE_TONE[key]}`}>{label}</span>
              <b>{label} 앱</b>
              <span className="muted small">{desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="stack" style={{ gap: 16 }}>
        <div className="home-head"><h2 className="home-h">성과 소식</h2><Link to="/news">전체 보기</Link></div>
        {news.length === 0 ? <Empty>아직 올라온 소식이 없습니다.</Empty> : (
          <div className="news-grid">
            {news.slice(0, 3).map(x => (
              <Link key={x.id} to={`/news/${x.id}`} className="card news-card">
                <Cover item={x} />
                <div className="news-card-body">
                  <span className="row" style={{ gap: 6 }}><span className={`badge ${ROLE_TONE[x.role]}`}>{ROLE_LABEL[x.role]}</span><span className="badge">{x.type}</span></span>
                  <h3>{x.title}</h3>
                  {(x.summary || x.desc) && <p className="small clamp">{x.summary || x.desc}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="stack" style={{ gap: 16 }}>
        <div className="home-head"><h2 className="home-h">모집 중인 프로그램</h2><Link to="/recruit">전체 보기</Link></div>
        {open.length === 0 ? <Empty>지금 모집 중인 프로그램이 없습니다.</Empty> : (
          <div className="news-grid">
            {open.map(p => {
              const [state, tone] = programState(p)
              return (
                <Link key={p.id} to="/recruit" className="card news-card">
                  <div className="news-card-body">
                    <span className="row" style={{ gap: 6 }}><span className="badge blue">{p.type}</span><span className={`badge ${tone}`}>{state}</span></span>
                    <h3>{p.title}</h3>
                    <Benefits program={p} />
                    <p className="muted small" style={{ marginTop: 'auto' }}>{p.dept || '[주관 부서]'} · 마감 {p.due || '[날짜]'}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="stack" style={{ gap: 16 }}>
        <h2 className="home-h">AI대학혁신본부</h2>
        <div className="home-about">
          {ABOUT_PAGES.map(([key, label]) => <Link key={key} to={`/about/${key}`} className="card">{label}</Link>)}
        </div>
      </section>
    </div>
  )
}

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
        <div><Link to="/start" className="btn primary" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>역할 선택으로 가기</Link></div>
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
      <ContactButton email={x.email} />
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
