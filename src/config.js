export const SITE = {
  name: 'GHU 바이탈',
  slogan: 'Saving Lives with AI',
  sub: '광주보건대학교 AI 업무·학습 플랫폼',
}

export const MODELS = [
  { id: 'auto', label: '자동 선택' },
  { id: 'gpt', label: 'OpenAI GPT', provider: 'openai' },
  { id: 'claude', label: 'Anthropic Claude', provider: 'anthropic' },
  { id: 'gemini', label: 'Google Gemini', provider: 'google' },
]

export const ROLES = {
  staff: {
    label: '직원',
    greeting: '선생님, 오늘 어떤 업무를 도와드릴까요?',
    groups: [
      { label: '시작', items: [['', '홈'], ['chat', '지후 AI'], ['todo', '할 일']] },
      { label: '행정 업무', items: [['projects', '업무 프로젝트'], ['docs', '공문·기안 작성'], ['meeting', '회의 도우미'], ['rules', '규정 근거 Q&A'], ['evaluation', '평가·인증 자료함'], ['webapps', '직원 웹앱'], ['prompts', '프롬프트 라이브러리'], ['manuals', 'AI 활용 매뉴얼']] },
      { label: '분석·자료', items: [['analysis', '문서·데이터 분석'], ['research', '심층 리서치'], ['files', '파일함']] },
      { label: '모집·공유', items: [['program-admin', '프로그램 등록·관리'], ['achievements', 'AI 활용 실적']] },
    ],
  },
  faculty: {
    label: '교수',
    greeting: '교수님, 수업과 연구 무엇부터 시작할까요?',
    groups: [
      { label: '시작', items: [['', '홈'], ['chat', '지후 AI']] },
      { label: '수업', items: [['courses', '내 강좌'], ['bot', '강좌봇 빌더'], ['design', '수업 설계 조교'], ['items', '문항 출제'], ['analytics', '학습 분석'], ['oncare', '지역사회 건강관리(온케어)']] },
      { label: '연구·역량', items: [['research', '연구에 AI 쓰기'], ['apps', '전공 앱 만들기'], ['training', '역량강화 과정'], ['webapps', '교수 웹앱'], ['prompts', '프롬프트 라이브러리'], ['manuals', 'AI 활용 매뉴얼'], ['achievements', 'AI 활용 실적'], ['files', '파일함']] },
    ],
  },
  student: {
    label: '학생',
    greeting: '오늘도 한 걸음씩 가 봐요',
    groups: [
      { label: '학습', items: [['', '홈'], ['chat', '지후 AI'], ['courses', '내 교과목방'], ['notes', '학습 노트'], ['exam', '국가고시 대비'], ['clinical', '실습 일지 도우미'], ['oncare', '지역사회 건강관리(온케어)'], ['webapps', '학생 웹앱'], ['prompts', '프롬프트 라이브러리'], ['manuals', 'AI 활용 매뉴얼']] },
      { label: '학교생활', items: [['campus', '학교생활 Q&A'], ['room', '스터디룸 예약'], ['programs', '프로그램 신청'], ['resume', '이력서 만들기'], ['achievements', 'AI 활용 실적'], ['files', '파일함']] },
    ],
  },
  admin: {
    label: '관리자',
    greeting: '플랫폼 운영 현황',
    groups: [
      { label: '운영', items: [['', '대시보드'], ['models', '모델·비용 관리'], ['users', '사용자·권한'], ['connection', '연결 상태']] },
    ],
  },
}
