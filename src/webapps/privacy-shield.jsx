import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, TextArea, ResultDoc, Notice, CopyButton } from './kit.jsx'
import { RULES, detect, applyMap } from '../lib/pseudo.js'

/* 개인정보 가명처리기
   AI에 넣기 전에 이름·학번·연락처 같은 정보를 "학생A", "[전화1]"로 바꾸고,
   AI 결과를 붙여 넣으면 원래 값으로 되돌립니다. 대응표는 이 화면에만 있고 저장하지 않습니다. */

const SAMPLES = [
  `지도학생 면담 기록\n이름: 김민준 (학번 20241234), 물리치료학과 2학년\n연락처 010-1234-5678, minjun.kim@example.com\n어머니(보호자 박서연 님)와 통화함. 등록금 분납 문의, 입금 계좌 국민은행 123456-01-234567 확인 요청.\n다음 면담: 이수진 교수님 연구실`,
  `[실습 사례] 외래 환자 이영희 님(등록번호: 00872345, 생년월일 1948.03.15)\n주소 광주광역시 북구 용봉로 77 101동 1203호\n보호자 최동훈 씨 연락처 010-9876-5432. 담당 치료사 정하늘 선생님께 보고함.`,
  `민원 접수 메모\n민원인 홍길동(학부모)이 전화(062-123-4567)로 장학금 탈락 이의 제기.\n자녀 홍지아 학생(학번 2023001122)의 평점 3.48. 회신은 hong.parent@example.com 으로 요청.`,
]

export default function PrivacyShield({ app }) {
  const [text, setText] = useState('')
  const [names, setNames] = useState('')
  const [terms, setTerms] = useState('')
  const [off, setOff] = useState({})
  const [back, setBack] = useState('')
  const [si, setSi] = useState(-1)

  const list = s => s.split(/[,，\n]/).map(x => x.trim()).filter(x => x.length >= 2)
  const hits = useMemo(() => detect(text, list(names), list(terms)), [text, names, terms])
  const on = hits.filter(h => !off[h.value])
  const masked = useMemo(() => applyMap(text, on.map(h => [h.value, h.token])), [text, on])
  const restored = useMemo(() => applyMap(back, on.map(h => [h.token, h.value])), [back, on])
  const left = hits.length ? RULES.filter(r => r.key !== 'addr').some(r => { r.re.lastIndex = 0; return r.re.test(masked) }) : false

  function sample() {
    let i = Math.floor(Math.random() * SAMPLES.length); if (i === si) i = (i + 1) % SAMPLES.length
    setSi(i); setText(SAMPLES[i]); setOff({}); setBack(''); setNames(''); setTerms('')
  }

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">모든 처리는 이 브라우저 안에서만 합니다. 원래 값과 가명 대응표는 저장하지 않으며, 화면을 닫으면 사라집니다.</span>
      </AppHeader>
      <section className="card">
        <Field id="ps-t" label="AI에 넣으려는 글" hint={`${text.length.toLocaleString()}자`}>
          <TextArea id="ps-t" rows={8} value={text} onChange={v => { setText(v); setBack('') }} placeholder="면담 기록, 민원 메모, 실습 사례 등을 붙여 넣으세요." />
        </Field>
        <div className="grid">
          <Field id="ps-n" label="꼭 가릴 이름" hint="자동으로 못 찾은 이름을 쉼표로"><TextInput id="ps-n" value={names} onChange={setNames} placeholder="예: 김민준, 박서연" /></Field>
          <Field id="ps-o" label="꼭 가릴 기관·장소" hint="병원, 회사, 학교 이름 등"><TextInput id="ps-o" value={terms} onChange={setTerms} placeholder="예: OO요양병원" /></Field>
        </div>
        <div className="row"><button type="button" className="btn" onClick={sample}>예시 넣기</button><span className="small muted">가상 인물로 만든 예시입니다. 누를 때마다 바뀝니다.</span></div>
      </section>

      {text.trim() && (
        <>
          <section className="card">
            <div className="card-head"><h2>찾은 정보 {hits.length}개</h2><span className="muted small">체크를 풀면 그 값은 가리지 않습니다</span></div>
            {hits.length === 0 ? <Notice>자동으로 찾은 정보가 없습니다. 이름이나 기관이 있다면 위 칸에 직접 넣어 주세요.</Notice> : (
              <ul className="check-list">{hits.map(h => (
                <li key={h.value}><label><input type="checkbox" checked={!off[h.value]} onChange={e => setOff({ ...off, [h.value]: !e.target.checked })} />
                  <span><b>{h.value}</b> → <code>{h.token}</code> <span className="muted small">{h.label}</span></span></label></li>
              ))}</ul>
            )}
            <Notice>자동 찾기는 정해진 모양만 잡습니다. 별명, 사진 속 글자, 드문 이름은 놓칠 수 있으니 아래 결과를 한 번 읽어 확인하세요.</Notice>
          </section>
          <ResultDoc title="가린 글 (AI에 넣을 글)" text={masked} fileName="가명처리.txt" />
          {left && <Notice tone="bad">가린 글에 아직 번호 모양이 남아 있습니다. 체크를 풀었는지 확인하세요.</Notice>}
          <section className="card">
            <div className="card-head"><h2>AI 결과를 원래 이름으로 되돌리기</h2></div>
            <Field id="ps-b" label="AI가 돌려준 글" hint="가명(사람A, [전화1] 등)이 들어 있는 글">
              <TextArea id="ps-b" rows={5} value={back} onChange={setBack} placeholder="AI 답을 붙여 넣으세요." />
            </Field>
            {back.trim() && <><pre className="prompt-text" tabIndex={0}>{restored}</pre><div className="row"><CopyButton text={restored} label="되돌린 글 복사" primary /></div></>}
          </section>
        </>
      )}
    </>
  )
}
