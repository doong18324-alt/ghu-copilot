import { useState } from 'react'
import { useStored, uid } from '../lib/store.js'
import { splitArticles } from '../lib/rules.js'
import { Notice } from './kit.jsx'

/* 규정 파일 보관함: 학칙 Q&A와 민원 응대 앱이 함께 씁니다.
   PDF·TXT를 이 브라우저 안에서 읽어 글자만 저장하며, 파일은 어디에도 올리지 않습니다. */

// 실제 규정이 아닌 시연용 예시입니다(기존 앱의 샘플 규정 문구를 옮김).
export const SAMPLE_REGS = [
  { id: 'sample-1', sample: true, name: '예시 장학규정', text: '장학규정\n제12조(성적우수장학금 선발 기준 및 평점 산정) ① 성적우수장학금은 직전 학기 15학점 이상을 이수하고, 평점평균이 3.50 이상인 재학생 중에서 학과(부)별 배정 예산 범위 내 성적 석차순으로 선발한다.\n② 평점평균은 소수점 둘째 자리까지 산출하며, 셋째 자리 이하는 반올림하지 않고 절사한다.\n③ 직전 학기 F학점이 있거나 학칙에 의한 징계 처분을 받은 자는 선발 대상에서 제외한다.\n제15조(장학금 중복 수혜 제한 및 교내외 장학 안내) 등록금 범위 내에서 국가장학금 및 교내 복지·근로장학금을 신청할 수 있으며, 가계곤란 학생을 위한 면학장학금은 별도 심사를 통해 선발한다.' },
  { id: 'sample-2', sample: true, name: '예시 학업성적처리규정', text: '학업성적처리규정\n제18조(성적 평가 및 이의신청 절차) ① 학생은 매 학기 성적 공시 기간(공시일로부터 5일 이내)에 본인의 성적을 열람하고, 성적 산출에 착오가 있다고 판단될 경우 담당 교원에게 공식 이의신청을 할 수 있다.\n② 담당 교원은 객관적 평가 근거(출석부, 시험답안지, 과제물 등)를 확인하여 정정 사유가 명백한 경우에만 증빙서류를 첨부하여 교무처에 성적 정정을 신청한다.\n③ 단순한 장학금 탈락 구제, 취업 지원, 졸업 사정 등의 개인적 사유로 인한 성적 정정은 엄격히 금지한다.' },
  { id: 'sample-3', sample: true, name: '예시 등록금에 관한 규정', text: '등록금에 관한 규정\n제9조(등록금의 반환 기준) ① 이미 납부한 등록금은 다음 각 호의 반환 사유가 발생한 날을 기준으로 반환한다.\n1. 학기 개시일 전일까지 반환 사유가 발생한 경우: 이미 납부한 등록금 전액\n2. 학기 개시일부터 30일까지: 등록금의 6분의 5 해당액\n3. 학기 개시일에서 30일이 지난 날부터 60일까지: 등록금의 3분의 2 해당액\n4. 학기 개시일에서 60일이 지난 날부터 90일까지: 등록금의 2분의 1 해당액\n5. 학기 개시일에서 90일이 지난 날: 반환하지 아니함\n② 제1항의 반환 기준일은 학생이 자퇴원서 또는 미복학 제적 관련 서류를 공식 접수한 날을 기준으로 산정한다.' },
  { id: 'sample-4', sample: true, name: '예시 학칙', text: '학칙\n제22조(휴학 및 복학) ① 질병, 가사, 기타 부득이한 사유로 4주 이상 수강할 수 없을 때에는 소정의 휴학원서를 제출하여 총장의 허가를 받아 휴학할 수 있다.\n② 일반휴학 기간은 1회에 1년(2개 학기) 이내로 하며, 재학 중 통산 2년(4개 학기)을 초과할 수 없다. 다만, 병역 의무 이행을 위한 입대휴학 기간은 통산 기간에 산입하지 아니한다.\n제25조(자퇴) 자퇴하고자 하는 자는 본인과 보호자가 연서한 자퇴원서를 제출하여 총장의 허가를 받아야 한다.\n제34조(출석 의무 및 학사경고·유급) ① 각 교과목의 출석 시수는 매 학기 총 수업시간수의 4분의 3 이상이어야 하며, 출석 미달 시 해당 교과목 성적은 F학점으로 처리한다.\n② 매 학기 성적 평점평균이 1.75 미만인 자에게는 학사경고를 과하며, 연속 3회 학사경고를 받은 자는 학칙에 따라 제적될 수 있다.' },
]

// PDF 글자를 줄 단위로 읽어 '제○조' 경계가 살아 있게 합니다.
export async function extractPdfText(file) {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  let out = ''
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const { items } = await page.getTextContent()
    let lastY = null
    for (const it of items) {
      const y = it.transform?.[5]
      if (lastY !== null && Math.abs(y - lastY) > 2) out += '\n'
      out += it.str
      if (it.hasEOL) out += '\n'
      lastY = y
    }
    out += '\n'
  }
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
}

export function useRegs() { return useStored('webapps:regs', []) }

export function allArticles(regs) {
  return regs.flatMap(r => splitArticles(r.text, r.name).filter(a => a.no))
}

export function RegLibrary({ regs, setRegs }) {
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  async function onFiles(files) {
    setErr('')
    const added = []
    for (const f of files) {
      setBusy(`${f.name} 읽는 중…`)
      try {
        const text = /\.pdf$/i.test(f.name) ? await extractPdfText(f) : /\.txt$/i.test(f.name) ? await f.text() : null
        if (text === null) { setErr(`${f.name}: PDF나 TXT 파일만 읽을 수 있습니다.`); continue }
        if (text.trim().length < 20) { setErr(`${f.name}: 글자를 찾지 못했습니다. 스캔 이미지 PDF는 읽을 수 없습니다.`); continue }
        added.push({ id: uid(), name: f.name.replace(/\.(pdf|txt)$/i, ''), text, at: new Date().toLocaleDateString('ko-KR') })
      } catch (e) {
        setErr(`${f.name}: 읽는 중 오류가 났습니다 (${e.message}).`)
      }
    }
    setBusy('')
    if (added.length) setRegs(r => [...added, ...r.filter(x => !added.some(a => a.name === x.name))])
  }
  const hasSample = regs.some(r => r.sample)
  return (
    <section className="card">
      <div className="card-head"><h2>규정 보관함 <span className="muted small">{regs.length}건 · 조항 {allArticles(regs).length}개</span></h2>
        {!hasSample && <button type="button" className="btn app-open" onClick={() => setRegs(r => [...r, ...SAMPLE_REGS])}>예시 규정 넣기</button>}
      </div>
      <Notice>현재 시행 중인 최신 개정본인지 학교 규정집에서 먼저 확인한 뒤 올려 주세요. 파일은 이 브라우저에만 저장되고 외부로 보내지 않습니다.</Notice>
      <label className="wa-drop">
        <input type="file" accept=".pdf,.txt" multiple onChange={e => { onFiles([...e.target.files]); e.target.value = '' }} />
        <b>규정 파일 선택 (PDF·TXT, 여러 개 가능)</b>
        <span className="muted small">{busy || '글자가 들어 있는 PDF만 읽을 수 있습니다'}</span>
      </label>
      {err && <Notice tone="bad">{err}</Notice>}
      {regs.length > 0 && (
        <ul className="list">{regs.map(r => (
          <li key={r.id}><span>{r.sample && <span className="badge amber" style={{ marginRight: 6 }}>예시</span>}{r.name}<br /><span className="muted small">조항 {splitArticles(r.text, r.name).filter(a => a.no).length}개 · {r.text.length.toLocaleString()}자</span></span>
            <button type="button" className="btn app-open" onClick={() => setRegs(regs.filter(x => x.id !== r.id))}>삭제</button></li>
        ))}</ul>
      )}
    </section>
  )
}

// 조항 본문에서 검색어를 굵게 표시합니다.
export function Highlight({ text, words }) {
  const ws = words.filter(w => w.length >= 2)
  if (!ws.length) return text
  const re = new RegExp(`(${ws.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
  return text.split(re).map((p, i) => (ws.includes(p) ? <mark key={i}>{p}</mark> : p))
}
