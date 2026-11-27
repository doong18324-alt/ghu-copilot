import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, TextArea, ChipGroup, ResultDoc, AiRefine, Notice } from './kit.jsx'

/* 시험 문항 분석기 (고전검사이론)
   응답표나 채점표를 붙여 넣으면 문항별 난이도, 변별도(상하 27%), 문항-나머지 점이연 상관, 오답지 선택 분포와
   시험 전체 신뢰도(KR-20)를 이 브라우저 안에서 계산합니다. 학생 이름 대신 번호를 쓰세요. */

const FMT = [['resp', '응답 번호표(1~5) + 정답'], ['score', '채점표(맞음 1 / 틀림 0)']]

function parse(text) {
  return text.trim().split(/\r?\n/).filter(l => l.trim()).map(l => l.split(/\t|,/).map(x => x.trim()))
}
const mean = a => a.reduce((s, x) => s + x, 0) / (a.length || 1)
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length || 1)) }
function corr(x, y) {
  const mx = mean(x), my = mean(y)
  let sxy = 0, sxx = 0, syy = 0
  for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2 }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0
}

// 첫 열이 학생 번호·이름이면 떼어 냅니다. 첫 행이 머리글이면 떼어 냅니다.
function build(rows, fmt, keyText) {
  if (rows.length < 3) return { err: '학생이 3명 이상 있어야 계산할 수 있습니다.' }
  let body = rows
  let head = null
  if (body[0].slice(1).some(c => /[가-힣A-Za-z]/.test(c) && !/^[A-Ea-e]$/.test(c))) { head = body[0]; body = body.slice(1) }
  let key = null
  const keyRow = body.findIndex(r => /^(정답|key|답)$/i.test(r[0]))
  if (keyRow >= 0) { key = body[keyRow].slice(1); body = body.filter((_, i) => i !== keyRow) }
  const idCol = head ? /번호|학생|이름|ID|학번|no/i.test(head[0]) : key ? body[0].length === key.length + 1 : false
  const ids = idCol ? body.map(r => r[0]) : body.map((_, i) => String(i + 1))
  const data = idCol ? body.map(r => r.slice(1)) : body
  const k = Math.max(...data.map(r => r.length))
  if (fmt === 'resp') {
    if (!key) key = keyText.split(/[,\s]+/).filter(Boolean)
    if (key.length < k) return { err: `정답이 ${key.length}개인데 문항은 ${k}개입니다. 정답 행을 "정답, 3, 1, …"으로 넣거나 아래 칸에 정답을 쉼표로 적어 주세요.` }
  }
  const norm = v => String(v ?? '').trim().replace(/^([①②③④⑤])$/, m => String('①②③④⑤'.indexOf(m) + 1)).toUpperCase().replace(/^([A-E])$/, m => String('ABCDE'.indexOf(m) + 1))
  const resp = data.map(r => Array.from({ length: k }, (_, j) => norm(r[j])))
  const sc = fmt === 'resp' ? resp.map(r => r.map((v, j) => (v !== '' && v === norm(key[j]) ? 1 : 0))) : resp.map(r => r.map(v => (v === '1' ? 1 : 0)))
  const total = sc.map(r => r.reduce((s, x) => s + x, 0))
  const n = sc.length
  const order = total.map((t, i) => [t, i]).sort((a, b) => b[0] - a[0]).map(x => x[1])
  const g = Math.max(1, Math.round(n * 0.27))
  const upper = order.slice(0, g), lower = order.slice(-g)
  const items = Array.from({ length: k }, (_, j) => {
    const col = sc.map(r => r[j])
    const p = mean(col)
    const D = mean(upper.map(i => sc[i][j])) - mean(lower.map(i => sc[i][j]))
    const rest = total.map((t, i) => t - sc[i][j])
    const r = corr(col, rest)
    let opts = null
    if (fmt === 'resp') {
      opts = {}
      for (const v of ['1', '2', '3', '4', '5']) {
        const cnt = resp.filter(x => x[j] === v).length
        opts[v] = { all: cnt, up: upper.filter(i => resp[i][j] === v).length, low: lower.filter(i => resp[i][j] === v).length }
      }
    }
    const flags = []
    if (p < 0.3) flags.push('매우 어려움')
    if (p > 0.9) flags.push('매우 쉬움')
    if (D < 0.2) flags.push('변별 낮음')
    if (D < 0) flags.push('상위가 더 틀림(정답 확인)')
    if (opts) {
      const ans = norm(key[j])
      const dead = Object.entries(opts).filter(([v, o]) => v !== ans && o.all === 0).map(([v]) => v)
      const rev = Object.entries(opts).filter(([v, o]) => v !== ans && o.up > o.low && o.up >= 2).map(([v]) => v)
      if (dead.length) flags.push(`선택 0명 보기 ${dead.join('·')}번`)
      if (rev.length) flags.push(`상위가 더 고른 오답 ${rev.join('·')}번`)
    }
    return { no: head ? head[j + (idCol ? 1 : 0)] || `${j + 1}` : `${j + 1}`, p, D, r, opts, ans: fmt === 'resp' ? norm(key[j]) : null, flags }
  })
  const pq = items.reduce((s, it) => s + it.p * (1 - it.p), 0)
  const v = sd(total) ** 2
  const kr20 = k > 1 && v > 0 ? (k / (k - 1)) * (1 - pq / v) : NaN
  return { n, k, ids, total, items, m: mean(total), s: sd(total), kr20, sem: sd(total) * Math.sqrt(Math.max(0, 1 - (kr20 || 0))), g }
}

// 가상 예시: 40명 × 10문항, 일부 문항에 일부러 문제를 넣었습니다
function sampleText() {
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  const key = [3, 1, 4, 2, 5, 2, 3, 1, 4, 5]
  const diff = [0.2, 0.0, 0.5, -0.3, 1.6, 0.1, -1.8, 0.3, 0.4, 0.2]
  const lines = ['번호\t' + key.map((_, i) => `${i + 1}번`).join('\t'), '정답\t' + key.join('\t')]
  for (let s = 1; s <= 40; s++) {
    const th = (rnd() + rnd() + rnd() - 1.5) * 2
    lines.push(`${s}\t` + key.map((a, j) => {
      let pr = 1 / (1 + Math.exp(-(1.4 * (th - diff[j]))))
      if (j === 7) pr = 0.55 // 변별이 거의 없는 문항
      if (rnd() < pr) return a
      const wrong = [1, 2, 3, 4, 5].filter(x => x !== a && !(j === 1 && x === 5))
      return wrong[Math.floor(rnd() * wrong.length)]
    }).join('\t'))
  }
  return lines.join('\n')
}

const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-')

export default function ItemAnalysis({ app }) {
  const [fmt, setFmt] = useState('resp')
  const [text, setText] = useState('')
  const [keyText, setKeyText] = useState('')
  const [title, setTitle] = useState('')
  const [res, setRes] = useState(null)

  function run() { setRes(build(parse(text), fmt, keyText)) }
  function onFile(e) { const f = e.target.files?.[0]; if (f) f.text().then(t => { setText(t); setRes(null) }); e.target.value = '' }
  function csv() {
    const head = ['문항', '정답', '난이도(정답률)', '변별도(상하27%)', '문항-나머지 상관', ...(fmt === 'resp' ? ['보기1', '보기2', '보기3', '보기4', '보기5'] : []), '확인할 점']
    const lines = res.items.map(it => [it.no, it.ans ?? '', f2(it.p), f2(it.D), f2(it.r), ...(it.opts ? ['1', '2', '3', '4', '5'].map(v => it.opts[v].all) : []), it.flags.join(' / ')])
    const out = [head, ...lines].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + out], { type: 'text/csv;charset=utf-8' })); a.download = `${title || '시험'}_문항분석.csv`; a.click()
  }
  const report = useMemo(() => {
    if (!res || res.err) return ''
    const bad = res.items.filter(it => it.flags.length)
    const easy = res.items.filter(it => it.p > 0.9).length, hard = res.items.filter(it => it.p < 0.3).length
    return [
      `[${title || '시험'} 문항 분석 결과]`,
      `응시 ${res.n}명, ${res.k}문항, 평균 ${res.m.toFixed(1)}점(문항 수 기준), 표준편차 ${res.s.toFixed(2)}, 신뢰도(KR-20) ${f2(res.kr20)}, 측정오차 ${res.sem.toFixed(2)}`,
      `평균 난이도 ${f2(mean(res.items.map(i => i.p)))}, 평균 변별도 ${f2(mean(res.items.map(i => i.D)))}. 매우 쉬운 문항 ${easy}개, 매우 어려운 문항 ${hard}개.`,
      '',
      '[다시 볼 문항]',
      ...(bad.length ? bad.map(it => `· ${it.no}: 난이도 ${f2(it.p)}, 변별도 ${f2(it.D)} → ${it.flags.join(', ')}`) : ['· 기준에 걸린 문항이 없습니다.']),
      '',
      '[교육과정 개선(CQI)용 문장]',
      `본 시험(${res.k}문항, ${res.n}명)의 KR-20 신뢰도는 ${f2(res.kr20)}였다. 변별도 0.20 미만 문항 ${res.items.filter(i => i.D < 0.2).length}개와 선택되지 않은 오답지가 있는 문항 ${res.items.filter(i => i.flags.some(f => f.startsWith('선택 0명'))).length}개는 다음 학기 출제 전에 보기와 문두를 수정한다.`,
      '',
      '기준: 난이도 0.3 미만 매우 어려움, 0.9 초과 매우 쉬움, 변별도 0.2 미만 낮음. 학생 수가 적으면(30명 미만) 수치가 크게 흔들리므로 참고만 하세요.',
    ].join('\n')
  }, [res, title])
  const aiPrompt = !report ? '' : `역할: 보건의료 계열 시험 출제를 돕는 교육평가 전문가입니다.\n지킬 것: 아래 수치는 바꾸지 않기, 문항 내용은 받은 것만 다루기, 학생을 탓하지 않기.\n출력: ① 다시 볼 문항별 고칠 방향(문두·정답·오답지) ② 다음 시험에서 지킬 출제 원칙 3가지 ③ 학생에게 줄 복습 안내 3줄\n\n${report}\n\n[문항 내용(있으면 붙여 넣기)]\n`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">계산은 이 브라우저 안에서만 합니다. 학생 이름 대신 번호를 쓰세요. 입력한 표는 저장하지 않습니다.</span>
      </AppHeader>
      <section className="card">
        <Field id="ia-t" label="시험 이름"><TextInput id="ia-t" value={title} onChange={setTitle} placeholder="예: 운동처방론 중간고사" /></Field>
        <ChipGroup label="표 형식" options={FMT} value={fmt} onChange={v => { setFmt(v); setRes(null) }} />
        <Field id="ia-d" label="응답표" hint="한 줄에 학생 한 명, 첫 열은 학생 번호. 엑셀에서 복사해 붙여 넣거나 CSV를 올리세요.">
          <TextArea id="ia-d" rows={8} value={text} onChange={v => { setText(v); setRes(null) }} placeholder={fmt === 'resp' ? '번호, 1번, 2번, 3번 …\n정답, 3, 1, 4 …\n1, 3, 2, 4 …\n2, 3, 1, 4 …' : '번호, 1번, 2번, 3번 …\n1, 1, 0, 1 …\n2, 1, 1, 1 …'} />
        </Field>
        {fmt === 'resp' && <Field id="ia-k" label="정답(표에 정답 행이 없을 때만)" hint="쉼표로 구분, 예: 3,1,4,2,5"><TextInput id="ia-k" value={keyText} onChange={setKeyText} /></Field>}
        <div className="row">
          <button type="button" className="btn primary" disabled={!text.trim()} onClick={run}>분석하기</button>
          <label className="btn">CSV 올리기<input type="file" accept=".csv,.txt,.tsv" hidden onChange={onFile} /></label>
          <button type="button" className="btn" onClick={() => { setFmt('resp'); setText(sampleText()); setTitle('가상 예시 시험'); setRes(null) }}>예시 넣기</button>
          <span className="small muted">예시는 가상 학생 40명 응답입니다.</span>
        </div>
      </section>

      {res?.err && <Notice tone="bad">{res.err}</Notice>}
      {res && !res.err && (
        <>
          <section className="card">
            <div className="card-head"><h2>시험 전체</h2>{res.n < 30 && <span className="badge amber">응시 30명 미만: 참고용</span>}</div>
            <div className="grid">
              <div className="tile"><b>응시·문항</b><span>{res.n}명 · {res.k}문항</span></div>
              <div className="tile"><b>평균(표준편차)</b><span>{res.m.toFixed(1)} ({res.s.toFixed(2)})</span></div>
              <div className="tile"><b>신뢰도 KR-20</b><span>{f2(res.kr20)}</span></div>
              <div className="tile"><b>상하 집단</b><span>각 {res.g}명(27%)</span></div>
            </div>
          </section>
          <section className="card">
            <div className="card-head"><h2>문항별 분석</h2><button type="button" className="btn" onClick={csv}>엑셀용 CSV 내려받기</button></div>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>문항</th>{fmt === 'resp' && <th>정답</th>}<th>난이도</th><th>변별도</th><th>상관</th>{fmt === 'resp' && <th>보기별 선택(상위/하위)</th>}<th>확인할 점</th></tr></thead>
              <tbody>{res.items.map(it => (
                <tr key={it.no}>
                  <td><b>{it.no}</b></td>{fmt === 'resp' && <td>{it.ans}</td>}
                  <td>{f2(it.p)}</td><td className={it.D < 0.2 ? 'bad' : ''}>{f2(it.D)}</td><td>{f2(it.r)}</td>
                  {fmt === 'resp' && <td className="small">{['1', '2', '3', '4', '5'].map(v => <span key={v} style={{ marginRight: 8, fontWeight: v === it.ans ? 800 : 400 }}>{v}:{it.opts[v].all}({it.opts[v].up}/{it.opts[v].low})</span>)}</td>}
                  <td>{it.flags.length ? it.flags.map(f => <span key={f} className="badge red" style={{ marginRight: 4 }}>{f}</span>) : <span className="badge green">양호</span>}</td>
                </tr>
              ))}</tbody>
            </table></div>
            <p className="small muted" style={{ margin: 0 }}>난이도는 정답률(높을수록 쉬움), 변별도는 상위 27% 정답률 − 하위 27% 정답률, 상관은 그 문항과 나머지 문항 총점의 상관입니다.</p>
          </section>
          <ResultDoc title="분석 요약과 CQI 문장" text={report} fileName={`${title || '시험'}_문항분석.txt`} />
          <AiRefine appId="item-analysis" label="지후 AI로 문항 고칠 방향 받기" note="수치는 그대로 두고, 다시 볼 문항의 수정 방향과 출제 원칙을 정리합니다. 문항 내용을 함께 붙이면 더 구체적입니다." prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
