import { lazy } from 'react'

// 바이탈 디자인으로 다시 만든 웹앱입니다. 여기 없는 앱은 기존 HTML 파일(public/webapps)을 새 탭으로 엽니다.
export const NATIVE = {
  'press-notice': lazy(() => import('./press-notice.jsx')),
  'toast-maker': lazy(() => import('./toast-maker.jsx')),
  'mind-rest': lazy(() => import('./mind-rest.jsx')),
  'advising-guide': lazy(() => import('./advising-guide.jsx')),
  'rules-chatbot': lazy(() => import('./rules-chatbot.jsx')),
  'complaint-script': lazy(() => import('./complaint-script.jsx')),
  'easy-explainer': lazy(() => import('./easy-explainer.jsx')),
  'license-cbt': lazy(() => import('./license-cbt.jsx')),
  'admission-studio': lazy(() => import('./admission-studio.jsx')),
  'career-clinic': lazy(() => import('./career-clinic.jsx')),
  'home-massage': lazy(() => import('./home-massage.jsx')),
  'diet-planner': lazy(() => import('./diet-planner.jsx')),
  'pet-signal': lazy(() => import('./pet-signal.jsx')),
  'voucher-checker': lazy(() => import('./voucher-checker.jsx')),
  'future-strategy': lazy(() => import('./future-strategy.jsx')),
  'privacy-shield': lazy(() => import('./privacy-shield.jsx')),
}
