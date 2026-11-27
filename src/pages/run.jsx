import { Suspense } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { NATIVE } from '../webapps/index.js'
import { appById } from '../data/webapps.js'
import { Empty } from '../components/ui.jsx'

/* 바이탈 웹앱 실행 화면 */
export function RunApp() {
  const { id } = useParams()
  const app = appById(id)
  const App = NATIVE[id]
  if (!app || !App) return <Navigate to={app ? `/market/${id}` : '/market'} replace />
  return (
    <div className="container market wa">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Link to="/market" className="small" style={{ fontWeight: 700, textDecoration: 'none' }}>← 앱마켓</Link>
        <Link to={`/market/${id}`} className="small" style={{ textDecoration: 'none' }}>앱 정보</Link>
      </div>
      <Suspense fallback={<Empty>앱을 불러오는 중입니다.</Empty>}>
        <App app={app} />
      </Suspense>
    </div>
  )
}
