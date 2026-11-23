import { useEffect, useState } from 'react'
import { Card, PageHead, Empty } from '../components/ui.jsx'
import { MODELS, ROLES } from '../config.js'
import { AI_MODE, checkServer } from '../lib/ai.js'
import { useStored } from '../lib/store.js'

export function AdminHome() {
  return (
    <>
      <PageHead title="운영 대시보드" desc="사용량과 비용은 중계 서버가 연결되면 집계됩니다." />
      <div className="grid">
        <Card title="이번 달 요청 수"><Empty>서버 연결 후 집계</Empty></Card>
        <Card title="이번 달 예상 비용"><Empty>서버 연결 후 집계</Empty></Card>
        <Card title="역할별 사용자"><ul className="list">{Object.values(ROLES).map(r => <li key={r.label}><span>{r.label}</span><span className="muted small">[ ]명</span></li>)}</ul></Card>
      </div>
      <ConnectionStatus />
    </>
  )
}

export function Models() {
  const [limits, setLimits] = useStored('admin-limits', { staff: '', faculty: '', student: '' })
  const [enabled, setEnabled] = useStored('admin-models', { gpt: true, claude: true, gemini: true })
  return (
    <>
      <PageHead title="모델·비용 관리" desc="실제 모델명과 API 키는 이 화면이 아니라 서버의 환경변수(.env)에 둡니다. 여기서는 사용 허용 여부와 월 한도 정책을 정합니다." />
      <Card title="사용 모델">
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">표시 이름</th><th scope="col">공급사</th><th scope="col">서버 설정 키</th><th scope="col">사용</th></tr></thead>
            <tbody>
              {MODELS.filter(m => m.provider).map(m => (
                <tr key={m.id}>
                  <td>{m.label}</td>
                  <td>{m.provider}</td>
                  <td><code>{{ openai: 'OPENAI_MODEL', anthropic: 'ANTHROPIC_MODEL', google: 'GEMINI_MODEL' }[m.provider]}</code></td>
                  <td><label className="row" style={{ gap: 8 }}><input type="checkbox" checked={!!enabled[m.id]} onChange={() => setEnabled({ ...enabled, [m.id]: !enabled[m.id] })} style={{ width: 18, height: 18 }} />{enabled[m.id] ? '허용' : '중지'}</label></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="역할별 월 한도 (크레딧)">
        <div className="row">
          {['staff', 'faculty', 'student'].map(r => (
            <div className="field" key={r} style={{ flex: '1 1 160px' }}>
              <label htmlFor={`lim-${r}`}>{ROLES[r].label} 1인당</label>
              <input id={`lim-${r}`} type="number" min="0" className="input" placeholder="미설정" value={limits[r]} onChange={e => setLimits({ ...limits, [r]: e.target.value })} />
            </div>
          ))}
        </div>
        <p className="muted small">시연 모드에서는 이 브라우저에만 저장됩니다. 실제 적용은 서버의 사용량 제한 설정과 연동해야 합니다.</p>
      </Card>
    </>
  )
}

export function Users() {
  return (
    <>
      <PageHead title="사용자·권한" desc="통합인증(SSO)이 연결되면 소속 정보에 따라 역할이 자동 지정됩니다." />
      <Card title="역할 지정 규칙 (예정)">
        <ul className="list">
          <li><span>교직원 계정 · 행정 부서 소속</span><span className="badge">직원</span></li>
          <li><span>교원 계정</span><span className="badge">교수</span></li>
          <li><span>재학생 계정</span><span className="badge">학생</span></li>
          <li><span>AI대학혁신본부 지정 담당자</span><span className="badge navy">관리자</span></li>
        </ul>
        <p className="muted small">규칙은 전산 담당 부서와 인증 연동 방식(SAML, OAuth 등)을 협의한 뒤 확정합니다.</p>
      </Card>
    </>
  )
}

export function ConnectionStatus() {
  const [status, setStatus] = useState(null)
  useEffect(() => { checkServer().then(setStatus) }, [])
  return (
    <Card title="연결 상태">
      <ul className="list">
        <li><span>AI 모드</span>{AI_MODE === 'live' ? <span className="badge green">실연결</span> : <span className="badge amber">시연 모드</span>}</li>
        <li><span>중계 서버</span>{!status ? <span className="badge">확인 중</span> : status.ok ? <span className="badge green">응답 정상</span> : <span className="badge red">{status.mode === 'demo' ? '미설정 (VITE_API_BASE 없음)' : '응답 없음'}</span>}</li>
        {status?.providers && Object.entries(status.providers).map(([k, v]) => (
          <li key={k}><span>{k} API 키</span>{v ? <span className="badge green">등록됨</span> : <span className="badge red">없음</span>}</li>
        ))}
        <li><span>통합인증(SSO)</span><span className="badge amber">{status?.auth || '미연결'}</span></li>
      </ul>
    </Card>
  )
}

export function Connection() {
  return (
    <>
      <PageHead title="연결 상태" desc="서버, API 키, 통합인증 연결 여부를 확인합니다. 연결 방법은 연결 안내서를 따르세요." />
      <ConnectionStatus />
    </>
  )
}
