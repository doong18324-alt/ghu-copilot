import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, TextArea, ChipGroup, ResultDoc, AiRefine, Notice } from './kit.jsx'
import { useStored } from '../lib/store.js'
import { extractPdfText } from './regs.jsx'
import { DEFAULT_RULES, SAMPLE, parseGuidelineRules, runCrossValidationEngine } from './voucher-engine.js'

/* 산학협력단 결의서 검증기
   기존 앱(V2)의 지침 파싱·교차 검증 규칙을 옮기고, 외부 CDN 없이 PDF를 읽도록 바꿨습니다.
   부가세 산식은 증빙마다 따로 보고(이전에는 첫 번째 금액끼리 섞어 비교), 결제일의 요일을 직접 계산합니다.
   파일은 브라우저 안에서만 읽고, 지침 기준만 이 브라우저에 저장합니다. */

const STATUS = { REJECT: ['반려·위반', 'red'], WARN: ['주의', 'amber'], PASS: ['정상', 'green'] }
const AREAS = ['지침위반', '금액', '일자', '증빙', '오타']

async function readFile(file) {
  if (/\.txt$/i.test(file.name)) return file.text()
  if (/\.pdf$/i.test(file.name)) return extractPdfText(file)
  throw new Error('PDF나 TXT 파일만 읽을 수 있습니다.')
}

export default function VoucherChecker({ app }) {
  const [guide, setGuide] = useStored('webapps:voucher-guide', { project: '', text: '', rules: DEFAULT_RULES })
  const [vtext, setVtext] = useState('')
  const [vtype, setVtype] = useState('지출결의서')
  const [res, setRes] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const rules = guide.rules || DEFAULT_RULES
  const setRule = (k, v) => setGuide({ ...guide, rules: { ...rules, [k]: v } })

  async function onGuideFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    setBusy('지침을 읽는 중입니다…'); setErr('')
    try {
      const text = await readFile(f)
      if (text.replace(/\s/g, '').length < 20) setErr('글자를 거의 읽지 못했습니다. 스캔한 이미지 PDF라면 글자가 있는 PDF로 다시 받아 주세요.')
      setGuide({ project: guide.project || f.name.replace(/\.[^.]+$/, ''), text, rules: parseGuidelineRules(text) })
    } catch (x) { setErr(x.message) } finally { setBusy(''); e.target.value = '' }
  }
  async function onVoucherFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    setBusy('결의서를 읽는 중입니다…'); setErr('')
    try { setVtext(await readFile(f)); setRes(null) } catch (x) { setErr(x.message) } finally { setBusy(''); e.target.value = '' }
  }
  function sample() {
    setGuide({ project: SAMPLE.project, text: SAMPLE.guideline, rules: parseGuidelineRules(SAMPLE.guideline) })
    setVtext(SAMPLE.voucher); setVtype('지출결의서'); setRes(null)
  }
  function run() {
    if (!vtext.trim()) { setErr('결의서 내용을 올리거나 붙여 넣어 주세요.'); return }
    setErr(''); setFilter('ALL')
    setRes({ ...runCrossValidationEngine(vtext, guide.text || '', rules), at: new Date().toLocaleString('ko-KR') })
  }
  const counts = res ? Object.fromEntries(Object.keys(STATUS).map(k => [k, res.results.filter(r => r.status === k).length])) : {}
  const verdict = !res ? '' : counts.REJECT ? '보완 후 재상신' : counts.WARN ? '확인 후 상신' : '상신 가능(담당자 확인)'
  const report = useMemo(() => !res ? '' : [
    `[결의서 사전 점검 결과서] ${guide.project || '사업명 미입력'} · ${vtype}`,
    `점검 일시: ${res.at} · 감지 비목: ${res.detectedCategories.join(', ')}`,
    `종합 판정: ${verdict} (반려 ${counts.REJECT}, 주의 ${counts.WARN}, 정상 ${counts.PASS})`,
    ...(res.detectedCategories.includes('여비(출장비)') && rules.travelSummary ? [`여비 기준: ${rules.travelSummary}`] : []),
    '',
    ...res.results.filter(r => r.status !== 'PASS').map((r, i) => `${i + 1}. [${STATUS[r.status][0]}·${r.category}] ${r.snippet}\n   근거: ${r.basis}\n   조치: ${r.guide}`),
    '',
    '※ 자동 점검 결과는 담당자 확인을 돕는 참고 자료입니다. 최종 판단은 산학협력단 담당자가 지침 원문으로 합니다.',
  ].join('\n'), [res, guide.project, vtype, verdict, counts, rules.travelSummary])
  const aiPrompt = !res ? '' : `역할: 산학협력단 회계 담당자에게 보완 요청을 전하는 행정 직원입니다.\n지킬 것: 점검 결과의 금액·날짜·조항은 그대로, 판정을 바꾸지 않기, 지침에 없는 규정 만들지 않기, 정중한 존댓말.\n출력: ① 집행 부서에 보낼 보완 요청 메시지(항목별 번호) ② 다시 낼 때 첨부할 서류 목록\n\n${report}`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">파일은 이 브라우저 안에서만 읽고 서버로 보내지 않습니다. 지침 기준만 이 브라우저에 저장됩니다. 최종 판단은 산학협력단 담당자가 합니다.</span>
      </AppHeader>
      <section className="card">
        <div className="card-head"><h2>1. 집행 지침</h2>{guide.text ? <span className="badge green">지침 저장됨</span> : <span className="badge">기본 기준 사용 중</span>}</div>
        <Field id="vc-p" label="사업명"><TextInput id="vc-p" value={guide.project} onChange={v => setGuide({ ...guide, project: v })} placeholder="예: 2026학년도 OO사업" /></Field>
        <div className="row">
          <label className="btn">지침 파일 올리기 (PDF·TXT)<input type="file" accept=".pdf,.txt" hidden onChange={onGuideFile} /></label>
          <button type="button" className="btn" onClick={sample}>예시 지침·결의서 넣기</button>
          {guide.text && <button type="button" className="btn" onClick={() => setGuide({ project: '', text: '', rules: DEFAULT_RULES })}>지침 지우기</button>}
        </div>
        <p className="small muted" style={{ margin: 0 }}>지침에서 찾은 기준입니다. 지침과 다르면 직접 고치세요.</p>
        <div className="grid">
          <Field id="vc-m" label="회의비 1인당 한도(원)"><TextInput id="vc-m" inputMode="numeric" value={String(rules.mealLimit)} onChange={v => setRule('mealLimit', Number(v.replace(/\D/g, '')) || 0)} /></Field>
          <Field id="vc-e" label="전문가·강사 수당 상한(원)"><TextInput id="vc-e" inputMode="numeric" value={String(rules.expertLimit)} onChange={v => setRule('expertLimit', Number(v.replace(/\D/g, '')) || 0)} /></Field>
        </div>
        <Field id="vc-k" label="집행 제한 낱말" hint="쉼표로 구분"><TextInput id="vc-k" value={rules.restrictedKeywords.join(', ')} onChange={v => setRule('restrictedKeywords', v.split(',').map(x => x.trim()).filter(Boolean))} /></Field>
        <Field id="vc-t" label="여비 정산·출장 기준 요약" hint="지침에서 찾은 문장입니다. 점검 결과서에 근거로 함께 적힙니다"><TextInput id="vc-t" value={rules.travelSummary || ''} onChange={v => setRule('travelSummary', v)} /></Field>
        <Field id="vc-d" label="필수 증빙" hint="쉼표로 구분. 점검 결과의 근거 문구로 쓰입니다. 누락 점검은 비목별(회의비는 회의록, 여비는 출장복명서 등)로 따로 합니다"><TextInput id="vc-d" value={rules.requiredDocs.join(', ')} onChange={v => setRule('requiredDocs', v.split(',').map(x => x.trim()).filter(Boolean))} /></Field>
      </section>

      <section className="card">
        <div className="card-head"><h2>2. 결의서와 증빙</h2></div>
        <ChipGroup label="결의서 종류" options={[['지출결의서', '지출결의서'], ['수입결의서', '수입결의서']]} value={vtype} onChange={setVtype} />
        <div className="row"><label className="btn">결의서 합본 올리기 (PDF·TXT)<input type="file" accept=".pdf,.txt" hidden onChange={onVoucherFile} /></label></div>
        <Field id="vc-v" label="결의서 내용" hint={`${vtext.length.toLocaleString()}자 · 파일을 올리면 여기에 채워집니다`}>
          <TextArea id="vc-v" rows={8} value={vtext} onChange={setVtext} placeholder="결의서 표지, 영수증, 세금계산서 내용을 붙여 넣어도 됩니다." />
        </Field>
        {busy && <Notice>{busy}</Notice>}
        {err && <Notice tone="bad">{err}</Notice>}
        <div className="row"><button type="button" className="btn primary" onClick={run}>지침 기준으로 점검하기</button></div>
      </section>

      {res && (
        <>
          <section className="card">
            <div className="card-head"><h2>종합 판정: {verdict}</h2><span className="muted small">감지 비목 {res.detectedCategories.join(', ')}</span></div>
            <div className="grid">{AREAS.map(a => {
              const rs = res.results.filter(r => r.category === a)
              const bad = rs.filter(r => r.status !== 'PASS').length
              return <div key={a} className="tile"><b>{a === '지침위반' ? '지침' : a === '오타' ? '기재사항' : a}</b><span className={`badge ${bad ? 'red' : rs.length ? 'green' : ''}`}>{rs.length ? (bad ? `${bad}건 확인` : '이상 없음') : '해당 없음'}</span></div>
            })}</div>
            <div className="row" style={{ gap: 6 }}>
              {[['ALL', `전체 ${res.results.length}`], ...Object.entries(STATUS).map(([k, [n]]) => [k, `${n} ${counts[k]}`])].map(([k, n]) => <button key={k} type="button" className={filter === k ? 'chip on' : 'chip'} aria-pressed={filter === k} onClick={() => setFilter(k)}>{n}</button>)}
            </div>
            <ul className="list">{res.results.filter(r => filter === 'ALL' || r.status === filter).map((r, i) => (
              <li key={i} style={{ display: 'block' }}>
                <span className={`badge ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span> <b className="small">{r.category === '오타' ? '기재사항' : r.category}</b>
                <p style={{ margin: '6px 0 2px' }}>{r.snippet}</p>
                <p className="small muted" style={{ margin: 0 }}>근거: {r.basis}</p>
                <p className="small" style={{ margin: '2px 0 0' }}>조치: {r.guide}</p>
              </li>
            ))}</ul>
          </section>
          <ResultDoc title="점검 결과서" text={report} fileName="결의서_점검결과.txt" />
          <AiRefine appId="voucher-checker" label="지후 AI로 보완 요청 메시지 만들기" note="점검 결과를 바꾸지 않고, 집행 부서에 보낼 정중한 보완 요청문으로 정리합니다." prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
