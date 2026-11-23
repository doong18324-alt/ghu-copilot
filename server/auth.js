// 통합인증(SSO) 연결 지점. 학교 인증 방식이 정해지면 이 함수만 바꾸면 됩니다.
// 반환값: { id, role } (role: staff | faculty | student | admin) 또는 로그인하지 않았으면 null

export async function getUser(req) {
  const mode = process.env.AUTH_MODE || 'none'

  // 개발용: 내 컴퓨터(127.0.0.1)에서만 열리며 누구나 관리자 권한으로 처리됩니다.
  if (mode === 'none') {
    return { id: 'local-dev', role: 'admin' }
  }

  if (mode === 'sso') {
    throw new Error('SSO 연동이 아직 구현되지 않았습니다. 전산 담당 부서와 인증 방식(SAML/OAuth/CAS)을 정한 뒤 이 부분을 채워야 합니다.')
  }

  return null
}
