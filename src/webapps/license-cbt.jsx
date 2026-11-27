import { useMemo, useState } from 'react'
import { AppHeader, Notice, AiRefine } from './kit.jsx'
import { useStored } from '../lib/store.js'
import { JOBS, jobById, KUKSIWON_URL } from './cbt-data.js'

/* 보건의료 국가고시 CBT 모의고사·오답노트
   기존 앱(V2)은 Gemini가 만든 문항을 '기출 기반'이라고 표시했고, 같은 문항을 여러 번 복제해 문제 수를 채웠습니다.
   이 버전은 국시원 공개 기출에서 출제 개념만 확인해 새로 쓴 문항을 쓰고, 문항 수가 모자라면 모자란 대로 알립니다.
   학과에서 만든 문항은 CSV로 올려 함께 풀 수 있습니다. */

const CSV_HEAD = '직종,과목,난이도,문제지문,사례,보기1,보기2,보기3,보기4,보기5,정답번호,해설,함정포인트'
const COUNTS = [5, 10, 20, 30, 50]
const NUM = ['①', '②', '③', '④', '⑤']

function shuffle(a) { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }

// 숫자·각도처럼 순서가 의미 있는 보기는 섞지 않습니다.
const ordered = opts => opts.every(o => /^[+\-−]?\s*[\d.,]+/.test(o.trim()))

function prepare(item, mix) {
  if (!mix || ordered(item.o)) return { ...item, view: [0, 1, 2, 3, 4] }
  return { ...item, view: shuffle([0, 1, 2, 3, 4]) }
}

// 큰따옴표와 줄바꿈을 지원하는 간단한 CSV 파서
function parseCSV(text) {
  const rows = []; let row = []; let cell = ''; let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') q = false; else cell += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter(r => r.some(x => x.trim()))
}

const csvCell = v => /[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v)

function fromCSV(text, fallbackJob) {
  const rows = parseCSV(text.replace(/^﻿/, ''))
  const out = []; const errors = []
  rows.forEach((r, i) => {
    if (i === 0 && (r[0]?.includes('직종') || r[3]?.includes('문제'))) return
    const [jobName, subjName, , stem, scase, o1, o2, o3, o4, o5, ans, expl] = r.map(x => (x ?? '').trim())
    const job = JOBS.find(j => j.name === jobName) || jobById(fallbackJob)
    const a = Number(ans)
    const o = [o1, o2, o3, o4, o5]
    if (!stem || o.some(x => !x) || !(a >= 1 && a <= 5)) { errors.push(i + 1); return }
    const subj = job.subjects.find(s => s[1] === subjName)?.[0] || `x:${subjName || '기타'}`
    out.push({ id: `u-${job.id}-${i}-${stem.slice(0, 12)}`, job: job.id, subj, subjName: subjName || '기타', q: scase ? `${stem}\n[사례] ${scase}` : stem, o, a, e: expl || '해설 없음', src: '학과 업로드' })
  })
  return { out, errors }
}

function download(text, name, type = 'text/plain') {
  const blob = new Blob(['﻿' + text], { type: `${type};charset=utf-8` })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function sheetText(qs, title, withKey) {
  const head = `${title}\n총 ${qs.length}문항 · 연습용 신규 문항(국시원 기출 원문 아님)\n${'='.repeat(40)}\n`
  const body = qs.map((it, n) => {
    const opts = it.view.map((k, i) => `   ${NUM[i]} ${it.o[k]}`).join('\n')
    const key = withKey ? `\n   정답: ${NUM[it.view.indexOf(it.a - 1)]}  ${it.o[it.a - 1]}\n   해설: ${it.e}` : ''
    return `${n + 1}. [${it.subjName}] ${it.q}\n${opts}${key}`
  }).join('\n\n')
  return head + body + '\n'
}

function sheetHTML(qs, title) {
  const q = qs.map((it, n) => `<li><p><small>${esc(it.subjName)}</small> ${esc(it.q).replace(/\n/g, '<br>')}</p><ol>${it.view.map(k => `<li>${esc(it.o[k])}</li>`).join('')}</ol></li>`).join('')
  const key = qs.map((it, n) => `<tr><td>${n + 1}</td><td>${NUM[it.view.indexOf(it.a - 1)]}</td><td>${esc(it.e)}</td></tr>`).join('')
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
body{font-family:'Noto Sans KR','Malgun Gothic',sans-serif;max-width:780px;margin:24px auto;padding:0 20px;line-height:1.6;font-size:11pt;color:#111}
h1{font-size:16pt;margin:0 0 4px}.sub{color:#555;font-size:9.5pt;margin:0 0 18px}
ol.q>li{margin:0 0 14px;break-inside:avoid}ol.q>li>p{margin:0 0 4px}ol.q ol{list-style:none;padding-left:14px;margin:0}
ol.q ol li{counter-increment:o}ol.q ol{counter-reset:o}ol.q ol li::before{content:counter(o,decimal) ") ";color:#555}
small{display:inline-block;font-size:8.5pt;color:#335;background:#EEF1F8;border-radius:4px;padding:0 5px;margin-right:4px}
table{width:100%;border-collapse:collapse;font-size:9.5pt}td{border-bottom:1px solid #ddd;padding:3px 6px;vertical-align:top}
td:first-child,td:nth-child(2){white-space:nowrap}.key{break-before:page}
</style></head><body><h1>${esc(title)}</h1><p class="sub">총 ${qs.length}문항 · GHU 바이탈 연습 문항(국시원 기출 원문 아님, 교수 검토용 초안)</p><ol class="q">${q}</ol>
<section class="key"><h1>정답과 해설</h1><table>${key}</table></section></body></html>`
}

export default function LicenseCbt({ app }) {
  const [jobId, setJobId] = useStored('webapps:cbt-job', 'pt')
  const [subj, setSubj] = useState('all')
  const [count, setCount] = useState(10)
  const [mix, setMix] = useState(true)
  const [useUpload, setUseUpload] = useState(true)
  const [custom, setCustom] = useStored('webapps:cbt-custom', [])
  const [wrong, setWrong] = useStored('webapps:cbt-wrong', [])
  const [exam, setExam] = useState(null)
  const [msg, setMsg] = useState('')

  const job = jobById(jobId) || JOBS[0]

  const pool = useMemo(() => {
    const base = job.items.map(([s, q, o, a, e], i) => ({ id: `${job.id}-${i}`, job: job.id, subj: s, subjName: job.subjects.find(x => x[0] === s)[1], q, o, a, e, src: '바이탈 문항' }))
    const up = useUpload ? custom.filter(c => c.job === job.id) : []
    return [...base, ...up]
  }, [job, custom, useUpload])

  const subjects = useMemo(() => {
    const extra = [...new Map(pool.filter(p => p.subj.startsWith('x:')).map(p => [p.subj, p.subjName])).entries()]
    return [...job.subjects, ...extra].map(([id, name]) => [id, name, pool.filter(p => p.subj === id).length])
  }, [job, pool])

  const avail = subj === 'all' ? pool : pool.filter(p => p.subj === subj)
  const n = Math.min(count, avail.length)
  const myWrong = wrong.filter(w => w.job === job.id)

  function changeJob(id) { setJobId(id); setSubj('all'); setExam(null) }

  function start(list, title) {
    // 전 과목이면 과목별로 고르게 뽑습니다.
    let pick
    if (subj === 'all' && list === avail) {
      const groups = subjects.map(([id]) => shuffle(list.filter(p => p.subj === id))).filter(g => g.length)
      pick = []
      for (let r = 0; pick.length < n; r++) for (const g of groups) if (g[r] && pick.length < n) pick.push(g[r])
      pick = shuffle(pick)
    } else pick = shuffle(list).slice(0, list === avail ? n : list.length)
    setExam({ title, qs: pick.map(it => prepare(it, mix)), ans: {}, done: false })
    setMsg('')
    setTimeout(() => document.getElementById('cbt-exam')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function submit() {
    const wrongNow = exam.qs.filter(it => exam.ans[it.id] !== it.a - 1)
    setExam(e => ({ ...e, done: true }))
    setWrong(prev => {
      const keep = prev.filter(w => !exam.qs.some(it => it.id === w.id && exam.ans[it.id] === it.a - 1))
      const add = wrongNow.filter(it => !keep.some(w => w.id === it.id)).map(({ view, ...rest }) => ({ ...rest, at: new Date().toISOString().slice(0, 10) }))
      return [...keep, ...add]
    })
  }

  function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const { out, errors } = fromCSV(String(reader.result), job.id)
      // 내장 문항이나 이미 올린 문항과 문제 줄기가 같으면 다시 넣지 않습니다(내려받은 CSV를 그대로 올린 경우 등).
      const norm = t => t.replace(/\s+/g, '')
      const known = new Set([...JOBS.flatMap(j => j.items.map(it => `${j.id}|${norm(it[1])}`)), ...custom.map(c => `${c.job}|${norm(c.q)}`)])
      const fresh = out.filter(o => !known.has(`${o.job}|${norm(o.q)}`))
      const dup = out.length - fresh.length
      setCustom(prev => [...prev, ...fresh])
      setMsg(`${fresh.length}문항을 추가했습니다.${dup ? ` 이미 있는 ${dup}문항은 건너뛰었습니다.` : ''}${errors.length ? ` 형식이 맞지 않은 ${errors.length}행(${errors.slice(0, 8).join(', ')}${errors.length > 8 ? '…' : ''}행)은 건너뛰었습니다.` : ''}`)
    }
    reader.readAsText(f, 'utf-8')
    e.target.value = ''
  }

  const answered = exam ? Object.keys(exam.ans).length : 0
  const score = exam?.done ? exam.qs.filter(it => exam.ans[it.id] === it.a - 1).length : 0
  const bySubj = exam?.done ? [...new Set(exam.qs.map(q => q.subjName))].map(name => {
    const qs = exam.qs.filter(q => q.subjName === name)
    return [name, qs.filter(it => exam.ans[it.id] === it.a - 1).length, qs.length]
  }) : []
  const fileBase = exam ? `${job.name}_${exam.title.replace(/\s/g, '')}_${exam.qs.length}문항` : ''

  const sample = avail.slice(0, 3).map(it => [job.name, it.subjName, '중', it.q, '', ...it.o, it.a, it.e, ''].map(csvCell).join(',')).join('\n')
  const aiPrompt = `직종: ${job.name}\n과목: ${subj === 'all' ? '전 과목' : subjects.find(s => s[0] === subj)?.[1]}\n\n[참고 문항]\n${sample}\n\n위 문항과 같은 출제 개념·난이도로, 문제 줄기·사례·보기·해설이 모두 다른 새 5지선다 문항 10개를 만들어 주세요. 국가시험 기출 문장을 옮겨 쓰지 마세요. 정답은 하나만 맞도록 하고 근거가 확실하지 않은 수치·법령 조항은 쓰지 마세요. 결과는 아래 머리글로 시작하는 CSV로만 주세요.\n${CSV_HEAD}`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">직종과 과목, 문항 수를 고르면 바로 풀 수 있습니다. 채점 후 틀린 문제는 오답노트에 모이고, 문제지와 정답·해설은 파일로 내려받습니다.</span>
      </AppHeader>

      <Notice>
        모든 문항은 국시원 공개 기출에서 출제 개념만 참고해 새로 쓴 연습 문항입니다. AI가 쓴 초안이므로 학과 교수 검토 전에는 시험 대비 자료로 단정하지 마세요.
        실제 기출은 <a href={KUKSIWON_URL} target="_blank" rel="noreferrer">국시원 출제자료 게시판</a>에서 내려받을 수 있습니다(수험 참고 외 사용·재배포 금지).
      </Notice>

      <section className="card stack">
        <div className="wa-form">
          <div className="field">
            <label htmlFor="cbt-job">직종</label>
            <select id="cbt-job" className="input" value={job.id} onChange={e => changeJob(e.target.value)}>
              {JOBS.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="cbt-subj">과목</label>
            <select id="cbt-subj" className="input" value={subj} onChange={e => setSubj(e.target.value)}>
              <option value="all">전 과목 ({pool.length}문항, 과목별 고르게)</option>
              {subjects.map(([id, name, c]) => <option key={id} value={id} disabled={!c}>{name} ({c}문항)</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="cbt-count">문항 수</label>
            <select id="cbt-count" className="input" value={count} onChange={e => setCount(Number(e.target.value))}>
              {COUNTS.map(c => <option key={c} value={c}>{c}문항{c > avail.length ? ` (현재 ${avail.length}문항만 있음)` : ''}</option>)}
            </select>
          </div>
        </div>
        <div className="row" style={{ gap: 18 }}>
          <label className="row small" style={{ gap: 6 }}><input type="checkbox" checked={mix} onChange={e => setMix(e.target.checked)} /> 보기 순서 섞기</label>
          <label className="row small" style={{ gap: 6 }}><input type="checkbox" checked={useUpload} onChange={e => setUseUpload(e.target.checked)} /> 학과 업로드 문항 포함 ({custom.filter(c => c.job === job.id).length}문항)</label>
        </div>
        {count > avail.length && avail.length > 0 && <Notice tone="warn">선택한 범위에 {avail.length}문항이 있어 {avail.length}문항으로 출제합니다. 다른 과목 문항이나 같은 문항을 반복해 채우지 않습니다.</Notice>}
        <div className="row">
          <button type="button" className="btn primary" disabled={!avail.length} onClick={() => start(avail, subj === 'all' ? '전 과목' : subjects.find(s => s[0] === subj)[1])}>{n}문항 풀기</button>
          <button type="button" className="btn" disabled={!myWrong.length} onClick={() => start(myWrong, '오답 다시 풀기')}>오답만 다시 풀기 ({myWrong.length})</button>
        </div>
      </section>

      {exam && (
        <section className="card stack" id="cbt-exam">
          <div className="card-head">
            <h2>{job.name} · {exam.title}</h2>
            <span className="muted small">{exam.done ? `${score} / ${exam.qs.length}점 (${Math.round(score / exam.qs.length * 100)}%)` : `${answered} / ${exam.qs.length} 답함`}</span>
          </div>

          {exam.done && (
            <div className="wa-answer">
              <b>과목별 결과</b>
              <div className="row" style={{ gap: 8, marginTop: 6 }}>
                {bySubj.map(([name, ok, all]) => <span key={name} className={`badge ${ok / all >= 0.6 ? 'green' : 'red'}`}>{name} {ok}/{all}</span>)}
              </div>
              <p className="small" style={{ margin: '8px 0 0' }}>국가시험 합격 기준(과목별 40% 이상, 전체 60% 이상)을 참고해 60% 미만 과목은 붉게 표시했습니다. 틀린 {exam.qs.length - score}문항은 오답노트에 넣었습니다.</p>
            </div>
          )}

          <ol className="stack" style={{ paddingLeft: 0, listStyle: 'none', gap: 18 }}>
            {exam.qs.map((it, n) => {
              const pick = exam.ans[it.id]
              const right = it.a - 1
              return (
                <li key={it.id} className="stack" style={{ gap: 8 }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    <b>{n + 1}.</b> <span className="badge">{it.subjName}</span> {it.src === '학과 업로드' && <span className="badge amber">학과</span>} {it.q}
                  </p>
                  <div className="wa-chips" role="radiogroup" aria-label={`${n + 1}번 보기`}>
                    {it.view.map((k, i) => {
                      let cls = 'wa-chip'
                      if (exam.done && k === right) cls += ' ok'
                      else if (exam.done && k === pick) cls += ' bad'
                      else if (!exam.done && k === pick) cls += ' on'
                      return (
                        <button key={k} type="button" role="radio" aria-checked={k === pick} className={cls} disabled={exam.done}
                          onClick={() => setExam(e => ({ ...e, ans: { ...e.ans, [it.id]: k } }))}>
                          <b>{NUM[i]} {it.o[k]}</b>
                        </button>
                      )
                    })}
                  </div>
                  {exam.done && (
                    <p className="small" style={{ margin: 0, lineHeight: 1.7 }}>
                      <b style={{ color: pick === right ? 'var(--green)' : 'var(--red)' }}>{pick === right ? '정답' : pick === undefined ? '답하지 않음' : '오답'}</b>
                      {' · '}정답 {NUM[it.view.indexOf(right)]} · {it.e}
                    </p>
                  )}
                </li>
              )
            })}
          </ol>

          <div className="row">
            {!exam.done && <button type="button" className="btn primary" onClick={submit}>채점하기{answered < exam.qs.length ? ` (${exam.qs.length - answered}문항 남음)` : ''}</button>}
            {exam.done && <button type="button" className="btn primary" onClick={() => setExam(e => ({ ...e, qs: e.qs.map(q => prepare(q, mix)), ans: {}, done: false }))}>같은 문항 다시 풀기</button>}
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <b className="small">내려받기</b>
            <div className="row">
              <button type="button" className="btn app-open" onClick={() => download(sheetHTML(exam.qs, `${job.name} ${exam.title} 모의고사`), `${fileBase}_인쇄용.html`, 'text/html')}>인쇄용 문제지·해설 (HTML)</button>
              <button type="button" className="btn app-open" onClick={() => download(sheetText(exam.qs, `${job.name} ${exam.title} 모의고사`, false), `${fileBase}_문제지.txt`)}>문제지 (텍스트)</button>
              <button type="button" className="btn app-open" onClick={() => download(sheetText(exam.qs, `${job.name} ${exam.title} 정답·해설`, true), `${fileBase}_정답해설.txt`)}>정답·해설 (텍스트)</button>
              <button type="button" className="btn app-open" onClick={() => download([CSV_HEAD, ...exam.qs.map(it => [job.name, it.subjName, '중', it.q, '', ...it.o, it.a, it.e, ''].map(csvCell).join(','))].join('\n'), `${fileBase}.csv`, 'text/csv')}>CSV (편집·재업로드용)</button>
            </div>
            <span className="small muted">인쇄용 HTML은 브라우저로 열어 인쇄하거나 PDF로 저장하면 문제지 뒤에 정답·해설이 새 쪽으로 붙습니다.</span>
          </div>
        </section>
      )}

      <section className="card stack">
        <div className="card-head"><h2>오답노트 · {job.name}</h2><span className="muted small">{myWrong.length}문항 · 이 브라우저에만 저장</span></div>
        {!myWrong.length && <p className="muted small" style={{ margin: 0 }}>아직 틀린 문제가 없습니다. 채점하면 틀린 문제가 여기에 모이고, 다시 맞히면 빠집니다.</p>}
        {myWrong.length > 0 && (
          <>
            <ul className="stack" style={{ gap: 6, paddingLeft: 18, margin: 0 }}>
              {myWrong.map(w => <li key={w.id} className="small" style={{ lineHeight: 1.6 }}><span className="badge">{w.subjName}</span> {w.q.split('\n')[0]} <span className="muted">→ {w.o[w.a - 1]}</span></li>)}
            </ul>
            <div className="row">
              <button type="button" className="btn app-open" onClick={() => download(sheetText(myWrong.map(w => ({ ...w, view: [0, 1, 2, 3, 4] })), `${job.name} 오답노트`, true), `${job.name}_오답노트.txt`)}>오답노트 내려받기</button>
              <button type="button" className="btn app-open" onClick={() => setWrong(prev => prev.filter(w => w.job !== job.id))}>{job.name} 오답노트 비우기</button>
            </div>
          </>
        )}
      </section>

      <section className="card stack">
        <div className="card-head"><h2>학과 문항 올리기</h2><span className="muted small">CSV · UTF-8</span></div>
        <p className="small muted" style={{ margin: 0 }}>교수님이 만든 문항을 CSV로 올리면 위 출제에 함께 들어갑니다. 파일은 이 브라우저에만 저장되고 서버로 보내지 않습니다. 국시원 기출 원문은 올리지 마세요.</p>
        <code className="small" style={{ wordBreak: 'break-all' }}>{CSV_HEAD}</code>
        <div className="row">
          <label className="btn app-open" style={{ cursor: 'pointer' }}>CSV 파일 선택<input type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" /></label>
          <button type="button" className="btn app-open" onClick={() => download(CSV_HEAD + '\n' + [job.name, job.subjects[0][1], '중', '문제 줄기를 쓰세요', '', '보기1', '보기2', '보기3', '보기4', '보기5', 1, '해설을 쓰세요', ''].map(csvCell).join(',') + '\n', 'CBT_문항양식.csv', 'text/csv')}>빈 양식 내려받기</button>
          {custom.length > 0 && <button type="button" className="btn app-open" onClick={() => { setCustom([]); setMsg('업로드한 문항을 모두 지웠습니다.') }}>업로드 문항 모두 지우기 ({custom.length})</button>}
        </div>
        {msg && <p className="small" role="status" style={{ margin: 0 }}>{msg}</p>}
      </section>

      <AiRefine appId="license-cbt" prompt={aiPrompt} label="이 과목 유사 문항 10개 만들기"
        note="지금 고른 직종·과목의 문항을 예시로 보내 같은 개념의 새 문항 10개를 CSV로 받습니다. 받은 CSV를 교수 검토 후 위 '학과 문항 올리기'로 넣으면 출제에 포함됩니다." />
    </>
  )
}
