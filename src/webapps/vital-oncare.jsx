// GHU 바이탈 온케어: 별도 저장소(vital-oncare)로 배포된 앱을 바이탈 화면 안에서 엽니다.
// 두 앱이 같은 주소(doong18324-alt.github.io) 아래에 있어 카메라·센서 권한과 저장소를 함께 씁니다.
export const ONCARE_URL = 'https://doong18324-alt.github.io/vital-oncare/'

export default function VitalOnCare() {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>GHU 바이탈 온케어</h2>
          <p className="muted small" style={{ margin: '2px 0 0' }}>10개 보건계열 학과가 휴대폰으로 지역 주민을 평가하고 하나의 건강지도와 맞춤계획으로 관리합니다.</p>
        </div>
        <a href={ONCARE_URL} target="_blank" rel="noreferrer" className="btn soft" style={{ minHeight: 38, padding: "0 16px", fontSize: 14 }}>새 창으로 열기</a>
      </div>
      <iframe
        title="GHU 바이탈 온케어"
        src={ONCARE_URL}
        allow="camera; microphone; accelerometer; gyroscope; magnetometer; fullscreen; clipboard-write"
        style={{ width: '100%', height: 'calc(100vh - 170px)', minHeight: 560, border: '1px solid var(--line, #e5e5e5)', borderRadius: 14, background: '#fff' }}
      />
      <p className="muted small" style={{ margin: 0 }}>건강관리·교육·선별 목적의 도구이며 진단이나 치료를 대신하지 않습니다. 모든 결과는 면허를 가진 지도교수가 확인합니다.</p>
    </div>
  )
}
