import { useMemo, useState } from 'react'
import { AppHeader, Field, TextInput, TextArea, ChipGroup, ResultDoc, AiRefine, Notice } from './kit.jsx'

/* 미래전략: 학과 진단·개설 후보·수익성 계산
   기존 앱(V8)은 입력이 적어도 "적합도 72~99점"과 등록금·수강료·정원 같은 수치를 스스로 정해 보여 줬습니다.
   이 버전은 (1) 붙여 넣은 공시 수치로만 학과를 진단하고, (2) 개설 후보는 고른 여건과 몇 개가 맞는지만 보여 주며,
   (3) 수익성은 사용자가 넣은 값과 공식으로만 계산합니다. 정책 결정은 기획처의 공식 타당성 검토를 거칩니다. */

const COLS = ['학과', '입학정원', '경쟁률', '신입생충원율', '재학생충원율', '취업률']

const COND = {
  region: ['지역 산업·정책', [['ai', '광주 AI·디지털헬스케어'], ['care', '통합돌봄·방문의료 확대'], ['bio', '광의료·체외진단·바이오'], ['silver', '고령친화산업·돌봄기술']]],
  people: ['인구·노동시장', [['aging', '지역 고령화'], ['teens', '학령인구 감소'], ['midlife', '4060 재취업·재교육 수요'], ['foreign', '외국인 돌봄·보건 인력 수요']]],
  inside: ['우리 대학 강점', [['exam', '국가시험 성과'], ['sim', '시뮬레이션·실습 시설'], ['hospital', '병원·요양시설 협력망'], ['adultexp', '성인학습자 학과 운영 경험']]],
  rival: ['주변 대학 동향', [['overlap', '인근 대학과 보건 정원 겹침'], ['noClinicalAI', '주변 AI 교육은 임상과 거리 멂'], ['adultNew', '인근 성인학습자 학과 늘어남'], ['noBio', '광의료·바이오 전문학사 과정 없음']]],
}
const ALL = Object.values(COND).flatMap(([, o]) => o)
const label = k => ALL.find(x => x[0] === k)?.[1] || k

// 검토 후보: tags가 맞으면 근거, risk가 선택되면 확인할 점으로 표시합니다
const CAND = {
  dept: [
    { name: 'AI디지털헬스케어 계열 학과', tags: ['ai', 'sim', 'hospital', 'noClinicalAI'], risk: [], why: '병원 의료데이터·스마트병동 실무 인력과 보건 실습 인프라를 잇는 방향', check: '교원 확보(AI·의료정보), 병원 실습처, 취업처 수요 근거' },
    { name: '통합돌봄·실버테크 계열 학과', tags: ['care', 'silver', 'aging', 'hospital'], risk: ['overlap'], why: '지자체 통합돌봄 확대와 고령화에 맞춘 방문 돌봄·재활 코디네이터 양성', check: '사회복지·간호 계열과의 정원 겹침, 자격 연계' },
    { name: '광의료·체외진단 바이오 계열 학과', tags: ['bio', 'noBio'], risk: [], why: '지역 의료기기·바이오 기업의 품질관리·인허가 실무 인력', check: '기업 채용 약정, 장비 투자비, 기존 임상병리 장비 공유 가능성' },
    { name: '외국인 유학생 정주형 돌봄 학과', tags: ['foreign', 'teens', 'care'], risk: [], why: '학령인구 감소 대응과 요양 인력 수요를 함께 겨냥', check: '유학생 비자·어학 요건, 정주 지원 협약' },
    { name: '성인학습자 건강관리 학부(야간·주말)', tags: ['midlife', 'adultexp', 'aging'], risk: ['adultNew'], why: '4060의 재교육·재취업 학위 수요', check: '인근 성인학습자 학과와의 경쟁, 수업 시간 설계' },
  ],
  md: [
    { name: '의료데이터·디지털병동 실무 MD', tags: ['ai', 'hospital', 'exam'], risk: [], why: '간호·임상병리·방사선·보건행정 재학생의 디지털 역량 보강', check: '학점 인정 방식, 참여 학과 합의' },
    { name: '지역사회 통합돌봄 코디네이터 MD', tags: ['care', 'aging', 'hospital'], risk: [], why: '간호·물리치료·작업치료·사회복지 다학제 협력 트랙', check: '지자체 현장실습처' },
    { name: '의료기기 인허가·품질 실무 MD', tags: ['bio', 'noBio'], risk: [], why: '임상병리·치기공·안경 계열 학생의 산업체 진로 확장', check: '산업체 강사 확보' },
    { name: '시니어 인지재활·돌봄기술 MD', tags: ['silver', 'aging', 'sim'], risk: [], why: '재활·돌봄 계열 학생의 고령친화 기술 활용 역량', check: '장비 보유 여부' },
  ],
  edu: [
    { name: '신중년 치매예방·실버케어 지도자 과정', tags: ['midlife', 'aging', 'care'], risk: ['adultNew'], why: '재취업 수요가 있는 4060 대상 비학위 과정', check: '민간자격 등록 여부, 수료 후 일자리 연계' },
    { name: '요양·중소병원 재직자 감염관리·디지털 보수교육', tags: ['hospital', 'ai', 'care'], risk: [], why: '협력 병원 단체 위탁(B2B)', check: '위탁 계약 가능 기관 수' },
    { name: '방문 돌봄 인력 심화 과정', tags: ['care', 'aging'], risk: [], why: '지자체 통합돌봄 인력풀과 연계', check: '지자체 위탁 예산' },
    { name: '심폐소생술·응급안전 관리자 과정', tags: ['hospital', 'sim'], risk: [], why: '기관·산업체 대상 필수 안전교육 위탁', check: '공인 교육기관 요건' },
  ],
}

const SAMPLE_TABLE = `학과\t입학정원\t경쟁률\t신입생충원율\t재학생충원율\t취업률
가상A학과\t80\t6.2\t100\t98\t78
가상B학과\t40\t1.3\t82\t76\t55
가상C학과\t60\t3.4\t100\t92\t71
가상D학과\t30\t0.9\t70\t68\t49
가상E학과\t50\t2.1\t96\t88\t64`

function parseTable(t) {
  const lines = t.trim().split(/\r?\n/).filter(Boolean)
  if (!lines.length) return []
  const split = l => l.split(/\t|,/).map(x => x.trim())
  const head = split(lines[0])
  const idx = COLS.map(c => head.findIndex(h => h.replace(/\s/g, '').includes(c)))
  const hasHead = idx[0] >= 0
  const map = hasHead ? idx : COLS.map((_, i) => i)
  return lines.slice(hasHead ? 1 : 0).map(split).map(r => {
    const num = i => { const v = map[i] >= 0 ? r[map[i]] : ''; const n = parseFloat(String(v || '').replace(/[,%:]/g, '').replace(/^(\d+(?:\.\d+)?)\s*대\s*1$/, '$1')); return Number.isFinite(n) ? n : null }
    return { name: map[0] >= 0 ? r[map[0]] : '', quota: num(1), comp: num(2), fresh: num(3), enrolled: num(4), job: num(5) }
  }).filter(r => r.name)
}

const n = v => Number(String(v).replace(/[^0-9.]/g, '')) || 0
const man = v => `${Math.round(v).toLocaleString()}만원`

export default function FutureStrategy({ app }) {
  const [table, setTable] = useState('')
  const [th, setTh] = useState({ comp: '2', fresh: '95', enrolled: '85', job: '60' })
  const [cond, setCond] = useState([])
  const [kind, setKind] = useState('dept')
  const [fin, setFin] = useState({ quota: '80', fill: '90', tuition: '600', costRate: '55', fixed: '15000' })
  const [shown, setShown] = useState(false)
  const [extra, setExtra] = useState('')
  const [fileMsg, setFileMsg] = useState('')

  function onFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    const rd = new FileReader()
    rd.onload = () => { const t = String(rd.result).replace(/^\uFEFF/, ''); setTable(t); setFileMsg(`${f.name}을(를) 불러왔습니다. 엑셀 파일은 'CSV UTF-8'로 저장해 올려 주세요.`) }
    rd.readAsText(f, 'utf-8'); e.target.value = ''
  }
  function template() {
    const blob = new Blob(['\uFEFF' + COLS.join(',') + '\n'], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '학과현황_양식.csv'; document.body.appendChild(a); a.click(); a.remove()
  }

  const rows = useMemo(() => parseTable(table), [table])
  const diag = rows.map(r => {
    const flags = []
    if (r.comp != null && r.comp < n(th.comp)) flags.push(`경쟁률 ${r.comp}`)
    if (r.fresh != null && r.fresh < n(th.fresh)) flags.push(`신입생 충원율 ${r.fresh}%`)
    if (r.enrolled != null && r.enrolled < n(th.enrolled)) flags.push(`재학생 충원율 ${r.enrolled}%`)
    if (r.job != null && r.job < n(th.job)) flags.push(`취업률 ${r.job}%`)
    return { ...r, flags }
  }).sort((a, b) => b.flags.length - a.flags.length)
  const ranked = Object.fromEntries(Object.entries(CAND).map(([k, list]) => [k, list.map(c => ({ ...c, hit: c.tags.filter(t => cond.includes(t)), warn: c.risk.filter(t => cond.includes(t)) })).sort((a, b) => b.hit.length - a.hit.length)]))

  // 수익성: 넣은 값으로만 계산합니다
  const F = useMemo(() => {
    const Q = n(fin.quota), f = n(fin.fill) / 100, T = n(fin.tuition), r = n(fin.costRate) / 100, FX = n(fin.fixed)
    const people = Q * f
    const rev = people * T
    const cost = rev * r + FX
    const unit = T * (1 - r)
    const bep = unit > 0 ? FX / unit : Infinity
    const calc = ff => { const p = Q * ff, rv = p * T, c = rv * r + FX; return { fill: ff, people: p, rev: rv, cost: c, net: rv - c } }
    const scen = [['보수', Math.max(0, f - 0.1)], ['기본', f], ['낙관', 1]].map(([k, ff]) => ({ k, ...calc(ff) }))
    const sens = [0.6, 0.7, 0.8, 0.9, 1].map(calc)
    return { people, rev, cost, net: rev - cost, bep, bepPct: Q ? (bep / Q) * 100 : 0, scen, sens }
  }, [fin])
  const FIN_LABEL = { dept: ['재학 정원(입학정원×수업연한, 명)', '충원율(%)', '1인당 연 등록금(만원)', '변동 운영비율(%)', '연 고정비(만원, 전임교원 인건비 등)'], md: ['과정 이수 정원(명)', '이수율(%)', '1인당 재정지원 단가(만원)', '직접비 집행률(%)', '연 고정비(만원, 운영 인력 등)'], edu: ['연간 수강 정원(기수×인원)', '모집률(%)', '1인당 수강료(만원)', '변동비율(%, 강사료·교재)', '연 고정비(만원, 시설·홍보 등)'] }[kind]

  const report = !shown ? '' : [
    '[미래전략 검토 자료]',
    '',
    '1. 학과 진단(붙여 넣은 공시 수치 기준)',
    ...(diag.length ? diag.map(d => `· ${d.name}: ${d.flags.length ? `확인 필요(${d.flags.join(', ')})` : '기준 충족'}`) : ['· 학과 현황표를 넣지 않음']),
    `  기준: 경쟁률 ${th.comp} 미만, 신입생 충원율 ${th.fresh}% 미만, 재학생 충원율 ${th.enrolled}% 미만, 취업률 ${th.job}% 미만`,
    '',
    `2. 고른 여건: ${cond.map(label).join(', ') || '없음'}`,
    ...(extra.trim() ? [`   직접 입력한 여건: ${extra.trim()}`] : []),
    '',
    ...[['dept', '학과'], ['md', '마이크로디그리'], ['edu', '평생교육']].flatMap(([k, t]) => [`3-${t}. 검토 후보(맞는 여건 수 순)`, ...ranked[k].slice(0, 3).map(c => `· ${c.name}: 맞는 여건 ${c.hit.length}개(${c.hit.map(label).join(', ') || '없음'}). ${c.why}. 확인할 점: ${c.check}${c.warn.length ? `, ${c.warn.map(label).join(', ')}` : ''}`), '']),
    `4. 수익성 계산(${{ dept: '학과', md: '마이크로디그리', edu: '평생교육' }[kind]}, 입력값 기준)`,
    `· 수입 ${man(F.rev)} = ${Math.round(F.people)}명 × ${fin.tuition}만원`,
    `· 지출 ${man(F.cost)} = 수입 × ${fin.costRate}% + 고정비 ${man(n(fin.fixed))}`,
    `· 순수익 ${man(F.net)}, 손익분기 인원 ${Number.isFinite(F.bep) ? `${Math.ceil(F.bep)}명(정원의 ${F.bepPct.toFixed(0)}%)` : '계산 불가(변동비율 100% 이상)'}`,
    `· 시나리오: ${F.scen.map(x => `${x.k}(충원 ${Math.round(x.fill * 100)}%) 순수익 ${man(x.net)}`).join(' / ')}`,
    '',
    '※ 이 자료는 검토용입니다. 학과 신설·정원 조정은 기획처·교무처의 공식 타당성 검토와 관계 법령 확인을 거칩니다.',
  ].join('\n')
  const aiPrompt = !shown ? '' : `역할: 전문대학 기획처의 학사 구조개편 검토 담당자입니다.\n지킬 것: 아래 수치는 그대로 쓰고 새 수치(취업률, 수요 인원, 등록금)를 만들지 않기, 필요한 근거 자료는 [자료 필요]로 표시, 개조식.\n출력: ① 후보별 추진 전 확인할 근거 자료 목록 ② 위험 학과의 개선·전환 선택지 3가지와 각각의 장단점 ③ 위원회 보고용 요약 5줄\n\n${report}`

  return (
    <>
      <AppHeader app={app}>
        <span className="small muted">붙여 넣은 수치와 고른 여건만으로 계산합니다. 점수나 수치를 지어내지 않습니다. 정책 결정 전 공식 타당성 검토를 거치세요.</span>
      </AppHeader>

      <section className="card">
        <div className="card-head"><h2>1. 학과 현황 진단</h2><span className="muted small">대학알리미 표를 복사해 붙여 넣기</span></div>
        <Field id="fs-t" label={`학과 현황표 (열: ${COLS.join(', ')})`} hint="엑셀에서 복사한 표(탭 구분)나 CSV">
          <TextArea id="fs-t" rows={6} value={table} onChange={setTable} placeholder={COLS.join('\t')} />
        </Field>
        <div className="row"><button type="button" className="btn" onClick={() => setTable(SAMPLE_TABLE)}>가상 예시 표 넣기</button>
          <label className="btn app-open" style={{ cursor: 'pointer' }}>CSV 파일 불러오기<input type="file" accept=".csv,.tsv,.txt" onChange={onFile} style={{ display: 'none' }} /></label>
          <button type="button" className="btn app-open" onClick={template}>빈 양식 내려받기</button>
          <span className="small muted">예시는 실제 학과가 아닌 가상 수치입니다.</span></div>
        {fileMsg && <p className="small muted" style={{ margin: 0 }}>{fileMsg}</p>}
        <div className="grid">
          <Field id="fs-c" label="경쟁률 기준(미만이면 확인)"><TextInput id="fs-c" value={th.comp} onChange={v => setTh({ ...th, comp: v })} /></Field>
          <Field id="fs-f" label="신입생 충원율 기준(%)"><TextInput id="fs-f" value={th.fresh} onChange={v => setTh({ ...th, fresh: v })} /></Field>
          <Field id="fs-e" label="재학생 충원율 기준(%)"><TextInput id="fs-e" value={th.enrolled} onChange={v => setTh({ ...th, enrolled: v })} /></Field>
          <Field id="fs-j" label="취업률 기준(%)"><TextInput id="fs-j" value={th.job} onChange={v => setTh({ ...th, job: v })} /></Field>
        </div>
        {rows.length > 0 && (
          <div className="table-wrap"><table className="table">
            <thead><tr>{COLS.map(c => <th key={c}>{c}</th>)}<th>진단</th></tr></thead>
            <tbody>{diag.map(d => <tr key={d.name}><td><b>{d.name}</b></td><td>{d.quota ?? '-'}</td><td>{d.comp ?? '-'}</td><td>{d.fresh ?? '-'}</td><td>{d.enrolled ?? '-'}</td><td>{d.job ?? '-'}</td>
              <td>{d.flags.length ? <span className="badge red">{d.flags.length}개 확인</span> : <span className="badge green">충족</span>}</td></tr>)}</tbody>
          </table></div>
        )}
        {table.trim() && !rows.length && <Notice tone="bad">표를 읽지 못했습니다. 첫 줄에 열 이름을 넣거나 열 순서를 위와 같게 맞춰 주세요.</Notice>}
      </section>

      <section className="card">
        <div className="card-head"><h2>2. 우리 대학 여건</h2><span className="muted small">해당하는 것만 고르기</span></div>
        {Object.entries(COND).map(([k, [t, opts]]) => <ChipGroup key={k} label={t} multi options={opts} value={cond} onChange={setCond} />)}
        <Field id="fs-x" label="목록에 없는 여건 직접 입력 (선택)" hint="예: 지자체 통합돌봄 시범사업 참여, 인근 대학 ○○과 폐과 예정. 후보 순위에는 반영되지 않고 검토 자료와 지후 AI 분석에 들어갑니다.">
          <TextArea id="fs-x" rows={2} value={extra} onChange={setExtra} />
        </Field>
      </section>

      <section className="card">
        <div className="card-head"><h2>3. 개설 검토 후보</h2><span className="muted small">고른 여건과 맞는 개수 순서</span></div>
        <ChipGroup label="종류" options={[['dept', '학과'], ['md', '마이크로디그리'], ['edu', '평생교육']]} value={kind} onChange={setKind} />
        <ul className="list">{ranked[kind].map(c => (
          <li key={c.name} style={{ display: 'block' }}>
            <b>{c.name}</b> <span className={`badge ${c.hit.length >= 2 ? 'green' : c.hit.length ? 'amber' : ''}`}>맞는 여건 {c.hit.length}/{c.tags.length}</span>
            <p className="small" style={{ margin: '4px 0 0' }}>{c.why}</p>
            {c.hit.length > 0 && <p className="small muted" style={{ margin: 0 }}>근거: {c.hit.map(label).join(', ')}</p>}
            <p className="small" style={{ margin: 0 }}>확인할 점: {c.check}{c.warn.length > 0 && <b> · 주의: {c.warn.map(label).join(', ')}</b>}</p>
          </li>
        ))}</ul>
      </section>

      <section className="card">
        <div className="card-head"><h2>4. 수익성 계산</h2><span className="muted small">{{ dept: '학과', md: '마이크로디그리', edu: '평생교육' }[kind]} 기준, 넣은 값으로만 계산</span></div>
        <div className="grid">{['quota', 'fill', 'tuition', 'costRate', 'fixed'].map((k, i) => (
          <Field key={k} id={`fs-${k}`} label={FIN_LABEL[i]}><TextInput id={`fs-${k}`} inputMode="numeric" value={fin[k]} onChange={v => setFin({ ...fin, [k]: v })} /></Field>
        ))}</div>
        <div className="grid">
          <div className="tile"><b>연 수입</b><span>{man(F.rev)}</span></div>
          <div className="tile"><b>연 지출</b><span>{man(F.cost)}</span></div>
          <div className="tile"><b>순수익</b><span className={F.net >= 0 ? '' : 'bad'}>{man(F.net)}</span></div>
          <div className="tile"><b>손익분기 인원</b><span>{Number.isFinite(F.bep) ? `${Math.ceil(F.bep)}명 (정원의 ${F.bepPct.toFixed(0)}%)` : '계산 불가'}</span></div>
        </div>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>시나리오</th><th>충원율</th><th>인원</th><th>연 수입</th><th>연 지출</th><th>순수익</th></tr></thead>
          <tbody>{F.scen.map(x => <tr key={x.k}><td><b>{x.k}</b></td><td>{Math.round(x.fill * 100)}%</td><td>{Math.round(x.people)}명</td><td>{man(x.rev)}</td><td>{man(x.cost)}</td><td className={x.net >= 0 ? '' : 'bad'}>{man(x.net)}</td></tr>)}</tbody>
        </table></div>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>충원율별 순수익</th>{F.sens.map(x => <th key={x.fill}>{Math.round(x.fill * 100)}%</th>)}</tr></thead>
          <tbody><tr><td>순수익</td>{F.sens.map(x => <td key={x.fill} className={x.net >= 0 ? '' : 'bad'}>{man(x.net)}</td>)}</tr></tbody>
        </table></div>
        <p className="small muted" style={{ margin: 0 }}>보수 시나리오는 입력 충원율에서 10%p 낮춘 값, 낙관 시나리오는 충원율 100%로 계산합니다. 공식: 수입 = 정원 × 충원율 × 단가 / 지출 = 수입 × 변동비율 + 고정비 / 손익분기 인원 = 고정비 ÷ (단가 × (1 − 변동비율))</p>
        <div className="row"><button type="button" className="btn primary" onClick={() => setShown(true)}>검토 자료 만들기</button></div>
      </section>

      {shown && (
        <>
          <ResultDoc title="미래전략 검토 자료" text={report} fileName="미래전략_검토자료.txt" />
          <AiRefine appId="future-strategy" label="지후 AI로 근거 자료 목록·보고 요약 만들기" note="수치는 바꾸지 않고, 추진 전에 모을 근거 자료와 위원회 보고 요약을 정리합니다." prompt={aiPrompt} />
        </>
      )}
    </>
  )
}
