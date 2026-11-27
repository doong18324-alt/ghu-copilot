// GHU 바이탈 앱마켓에 올라가는 웹앱 목록입니다.
// 파일은 public/webapps/ 에 있으며, 모두 브라우저 안에서만 작동합니다(서버 전송 없음).
// 새 앱을 올릴 때: 파일을 public/webapps/ 에 넣고 아래 목록에 한 줄을 추가합니다.

export const MARKET_ROLES = {
  student: '학생',
  faculty: '교수',
  staff: '직원',
}

// 분야별 색: 앱 표시(두 글자 마크)의 색이 분야를 나타냅니다.
export const CATEGORY_TONE = { '학습·국가고시': 'study', '취업·진로': 'career', '학생 지도': 'guide', '행정·문서': 'admin', '규정·민원': 'rules', '기획·홍보': 'pr', '건강·생활': 'life' }

export const CATEGORIES = ['학습·국가고시', '취업·진로', '학생 지도', '행정·문서', '규정·민원', '기획·홍보', '건강·생활']

// stored: 입력한 자료를 이 기기 브라우저에 저장하는지 여부
// caution: 사용 전 꼭 알려야 할 내용
export const WEBAPPS = [
  {
    id: 'privacy-shield', mono: '가림', tone: 'red', version: 'V1', isNew: true,
    title: '개인정보 가명처리기: AI에 넣기 전에 가리기',
    summary: '이름·학번·연락처·계좌·등록번호를 찾아 "학생A", "[전화1]"로 바꾸고, AI 결과를 붙여 넣으면 원래 값으로 되돌립니다.',
    roles: ['student', 'faculty', 'staff'], category: '행정·문서',
    tags: ['개인정보', '가명처리', '비식별', '마스킹', '보안', 'AI 안전', '학번', '전화번호', '이름 가리기'],
    features: ['주민번호·전화·이메일·학번·계좌·등록번호·주소 자동 찾기', '직접 넣은 이름·기관도 가리기', 'AI 결과 원래 이름으로 되돌리기', '대응표는 저장하지 않음'],
    caution: '자동 찾기는 정해진 모양만 잡습니다. 결과를 한 번 읽어 남은 정보가 없는지 확인하세요.',
  },
  {
    id: 'license-cbt', mono: '국시', tone: 'blue', version: 'V3', stored: true,
    title: '보건의료 국가고시 CBT 모의고사·오답노트',
    summary: '10개 면허 직종의 과목별 모의고사를 풀고 틀린 문제를 오답노트로 모읍니다.',
    roles: ['student', 'faculty'], category: '학습·국가고시',
    tags: ['국시', '국가고시', 'CBT', '모의고사', '오답노트', '문제은행', '간호', '물리치료', '방사선', '임상병리', '치위생', '응급구조', '치기공', '안경', '보건의료정보', '영양'],
    features: ['직종·과목·문항 수(드롭다운)를 골라 바로 풀기', '문제지·정답해설 내려받기(인쇄용 HTML, 텍스트, CSV)', '틀린 문제 자동 오답노트와 다시 풀기', '학과 자체 문항 CSV 업로드'],
    caution: '내장 문항은 국시원 공개 기출의 출제 개념만 참고해 새로 쓴 연습 문항(AI 초안)이며 기출 원문이 아닙니다. 학과 교수 검토 후 사용하세요.',
  },
  {
    id: 'item-analysis', mono: '분석', tone: 'blue', version: 'V1', isNew: true,
    title: '시험 문항 분석기: 난이도·변별도·신뢰도',
    summary: '응답표를 붙여 넣으면 문항별 난이도, 변별도, 오답지 선택 분포와 시험 신뢰도(KR-20)를 계산하고 다시 볼 문항을 짚어 줍니다.',
    roles: ['faculty'], category: '학습·국가고시',
    tags: ['문항분석', '난이도', '변별도', '신뢰도', 'KR-20', '오답지', '시험', 'CQI', '출제', '평가'],
    features: ['응답 번호표·채점표 모두 지원', '상하 27% 변별도와 문항-나머지 상관', '오답지 작동 여부 점검', '엑셀용 CSV와 CQI 문장'],
    caution: '학생 이름 대신 번호를 쓰세요. 응시 인원이 30명 미만이면 수치가 크게 흔들립니다.',
  },
  {
    id: 'grading-helper', mono: '채점', tone: 'green', version: 'V1', isNew: true, stored: true,
    title: '평가 도우미: 루브릭·채점표·학생별 피드백',
    summary: '평가 영역과 기준을 적으면 수준별 루브릭을 만들고, 채점표를 채워 붙여 넣으면 점수에 근거한 학생별 피드백을 한꺼번에 만듭니다.',
    roles: ['faculty'], category: '학습·국가고시',
    tags: ['루브릭', '채점', '채점표', '피드백', '과제', '실기 평가', '수행평가', 'LMS'],
    features: ['영역·배점·기준으로 4수준 루브릭', '학생 번호가 들어간 채점표 CSV', '영역 점수 근거 피드백 일괄 생성', '영역별 평균'],
    caution: '학생 이름 대신 번호를 쓰세요. 피드백은 보낸 뒤가 아니라 보내기 전에 한 번 읽어 확인하세요.',
  },
  {
    id: 'easy-explainer', mono: '쉽게', tone: 'amber', version: 'V2',
    title: '어려운 개념 쉽게 풀기·미니 퀴즈',
    summary: '전공 문장이나 기사를 붙여 넣으면 어려운 문장과 용어를 짚어 주고 퀴즈를 냅니다. AI 연결 후에는 눈높이 설명과 비유까지 만듭니다.',
    roles: ['student', 'faculty'], category: '학습·국가고시',
    tags: ['개념', '비유', '설명', '퀴즈', '복습', '전공 용어', '수업 자료'],
    features: ['초등·중고등·대학 신입생 눈높이 선택', '보건·경제·IT·인문 분야 선택', '확인 퀴즈 3문제'],
  },
  {
    id: 'career-clinic', mono: '취업', tone: 'green', version: 'V2',
    title: '대학병원·의료기관 취업 자소서·면접 클리닉',
    summary: '실습 경험을 상황·과제·행동·결과(STAR)로 적으면 자기소개서 초안과 직군별 면접 질문을 만듭니다. 적지 않은 성과는 지어내지 않습니다.',
    roles: ['student'], category: '취업·진로',
    tags: ['자소서', '자기소개서', '면접', '취업', '병원', 'STAR', '실습 경험'],
    features: ['간호사·물리치료사 등 8개 직군', '문항 유형 4가지와 목표 글자 수', '직군별 면접 질문 6개와 답변 방향', '빈칸은 [ ]로 남겨 직접 채우기'],
    caution: '실제 환자의 이름·병실·등록번호는 쓰지 말고 익명으로 적으세요.',
  },
  {
    id: 'rules-chatbot', mono: '학칙', tone: 'blue', version: 'V1', stored: true,
    title: '학칙·대학 규정 Q&A 챗봇',
    summary: '학칙·장학·인사 규정 파일을 올리면 질문에 맞는 조항을 근거로 답합니다.',
    roles: ['student', 'faculty', 'staff'], category: '규정·민원',
    tags: ['학칙', '규정', '장학', '휴학', '인사 규정', '조항', '챗봇'],
    features: ['규정 PDF 업로드', '조항 근거 답변', '샘플 학칙으로 바로 체험'],
    caution: '올리는 규정이 현재 시행 중인 최신 개정본인지 먼저 확인하세요.',
  },
  {
    id: 'advising-guide', mono: '지도', tone: 'green', version: 'V1',
    title: '지도학생 진로·학업 위기 상담 가이드',
    summary: '면담 전에 학생 상황을 고르면 공감 화법과 교내 지원 프로그램 연계 방안을 정리합니다.',
    roles: ['faculty'], category: '학생 지도',
    tags: ['지도학생', '상담', '면담', '휴학', '자퇴', '학사경고', '진로', '위기 학생'],
    features: ['학년·위기 유형 선택', '면담 단계별 화법', '교내 지원 프로그램 연계', '면담 준비지 출력'],
    caution: '학생 이름·학번 등 개인정보는 넣지 않고 상황만 고르세요.',
  },
  {
    id: 'press-notice', mono: '보도', tone: 'blue', version: 'V2',
    title: '보도자료·공지사항 자동 작성',
    summary: '육하원칙만 입력하면 보도자료, 교내 공지, 알림 문자 초안을 함께 만듭니다.',
    roles: ['staff', 'faculty'], category: '행정·문서',
    tags: ['보도자료', '공지', '공지사항', '홍보', '행사', '육하원칙', '5W1H'],
    features: ['보도자료·공지문 양식 선택', '담당자 인용 코멘트', '문서 톤 선택'],
  },
  {
    id: 'voucher-checker', mono: '결의', tone: 'amber', version: 'V3', stored: true,
    title: '산학협력단 결의서 스마트 검증기',
    summary: '사업별 집행 지침을 등록하고 결의서의 금액·일자·필수 증빙을 지침과 대조해 점검합니다.',
    roles: ['staff', 'faculty'], category: '행정·문서',
    tags: ['결의서', '연구비', '사업비', '산학협력단', '증빙', '집행 지침', '회계', '정산'],
    features: ['지침 PDF에서 한도·제한·필수 증빙 자동 추출(직접 수정 가능)', '증빙별 부가세 산식, 결제 요일, 품의-집행 선후 점검', '사업자등록번호 검증', '점검 결과서와 보완 요청문'],
    caution: '최종 판단은 산학협력단 담당자가 합니다.',
  },
  {
    id: 'complaint-script', mono: '민원', tone: 'red', version: 'V1', stored: true,
    title: '학내 민원·학부모 문의 응대 스크립트',
    summary: '등록금·성적·장학 같은 민감한 문의에 규정 근거와 정중한 응대 문안을 함께 준비합니다.',
    roles: ['staff'], category: '규정·민원',
    tags: ['민원', '학부모', '응대', '전화', '등록금', '성적 이의', '장학', '스크립트'],
    features: ['규정 파일 업로드', '상황별 응대 문안', '감정 완화 화법'],
    caution: '올리는 규정이 최신 개정본인지 먼저 확인하세요.',
  },
  {
    id: 'future-strategy', mono: '전략', tone: 'blue', version: 'V9',
    title: '미래전략: 학과 진단·개설 후보·수익성 계산',
    summary: '공시 표를 붙여 넣어 학과를 진단하고, 우리 대학 여건과 맞는 학과·MD·평생교육 후보를 비교하며, 넣은 값으로 손익분기를 계산합니다. 점수나 수치를 지어내지 않습니다.',
    roles: ['staff', 'faculty'], category: '기획·홍보',
    tags: ['기획', '학과 개편', '평생교육', 'MD', '수익성', '손익분기', 'BEP', '재정', '공시'],
    features: ['대학알리미 표 붙여넣기와 기준 조정 진단', '여건과 맞는 개수로 보는 개설 후보', '공식이 보이는 수익성·손익분기 계산', '위원회 검토 자료'] ,
  },
  {
    id: 'admission-studio', mono: '입시', tone: 'amber', version: 'V2',
    title: '입시 홍보 카드뉴스·숏폼 대본',
    summary: '학과를 고르고 강점을 적으면 수험생, 학부모, 성인학습자에게 맞춘 카드뉴스, 숏폼 대본, 안내 문자, AI 제작 프롬프트를 만듭니다.',
    roles: ['staff', 'faculty'], category: '기획·홍보',
    tags: ['입시', '홍보', '카드뉴스', '숏폼', '릴스', 'SNS', '학과 소개', '포스터', '성인학습자', '만학도', '재직자', '야간'],
    features: ['광주보건대 학과 목록(성인학습자 학과 7곳 포함)과 공개 정보 자동 채움', '수험생·학부모·성인학습자·통합 독자 선택', '카드뉴스 5장, 숏폼 대본, 안내 문자, 이미지·영상 프롬프트'],
    caution: '수치는 입력한 값만 씁니다. 장학·수업 방식·모집 인원은 해마다 바뀌므로 게시 전 모집요강으로 확인하세요.',
  },
  {
    id: 'toast-maker', mono: '축사', tone: 'amber', version: 'V2',
    title: '건배사 생성기',
    summary: '모임 성격과 키워드를 고르면 삼행시, 선창·후창 구호 등 건배사 5개를 추천합니다.',
    roles: ['staff', 'faculty', 'student'], category: '건강·생활',
    tags: ['건배사', '회식', 'MT', '삼행시', '환영회'],
    features: ['모임 성격 선택', '키워드 삼행시'],
  },
  {
    id: 'mind-rest', mono: '쉼', tone: 'green', version: 'V1',
    title: '마음 비움터: 감정 털어놓기',
    summary: '지금 마음을 적고 비우면 판단 없는 공감 문장과 마음을 가라앉히는 작은 행동을 안내합니다.',
    roles: ['student', 'faculty', 'staff'], category: '건강·생활',
    tags: ['마음', '스트레스', '감정', '공감', '위로', '상담'],
    features: ['감정 선택', '공감 문장', '안정 팁'],
    caution: '전문 상담을 대신하지 않습니다. 혼자 감당하기 어려우면 학생상담센터나 자살예방상담전화 109(24시간)에 연락하세요.',
  },
  {
    id: 'diet-planner', mono: '식단', tone: 'green', version: 'V4',
    title: '건강 식단 플래너·장보기 예산',
    summary: '나이·활동량·건강 목표와 주간 식비를 넣으면 예산 안에서 7일 식단과 장보기 목록을 만듭니다.',
    roles: ['student', 'faculty', 'staff'], category: '건강·생활',
    tags: ['식단', '장보기', '식비', '예산', '저염식', '혈당', '자취'],
    features: ['건강 목표 6가지(신장질환은 상담 안내)', '빼는 재료·먹는 약 주의점', '예산 맞춘 7일 식단과 다른 조합 보기', '단가를 고칠 수 있는 장보기 목록'],
    caution: '질환이 있으면 식단은 담당 의료진과 상의하세요.',
  },
  {
    id: 'home-massage', mono: '손길', tone: 'blue', version: 'V3',
    title: '가족 맞춤 안전 홈 안마·지압',
    summary: '불편한 부위와 건강 상태를 고르면 근육 위치 기준의 안전한 안마와 마무리 스트레칭을 안내합니다. 안마하면 안 되는 위험 신호를 먼저 거릅니다.',
    roles: ['student', 'faculty', 'staff'], category: '건강·생활',
    tags: ['안마', '지압', '마사지', '스트레칭', '통증', '부모님', '관절염'],
    features: ['위험 신호 먼저 확인', '건강 상태 9가지별 강도·금지 동작 자동 반영', '부위별 안마 순서와 마무리 스트레칭', '안마 타이머'],
    caution: '통증이 심하거나 오래가면 의료기관 진료를 먼저 받으세요.',
  },
  {
    id: 'pet-signal', mono: '반려', tone: 'amber', version: 'V2',
    title: '반려동물 행동 통역사',
    summary: '강아지·고양이의 행동과 증상을 고르면 이유와 대처법, 병원 방문이 필요한 정도를 안내합니다.',
    roles: ['student', 'faculty', 'staff'], category: '건강·생활',
    tags: ['반려동물', '강아지', '고양이', '행동', '증상', '응급'],
    features: ['강아지·고양이, 나이별 안내', '행동 7가지의 원인과 해 주세요·하지 마세요', '응급도 신호등(배뇨 곤란·중독 의심 자동 감지)', '수의사 상담용 메모'],
    caution: '응급 증상이 있으면 바로 동물병원에 가세요.',
  },
]

export const appUrl = a => `./webapps/${a.id}.html`
// 바이탈 디자인으로 다시 만든 앱(src/webapps/index.js에 등록)은 이 목록에 있습니다.
export const NATIVE_IDS = ['press-notice', 'toast-maker', 'mind-rest', 'advising-guide', 'rules-chatbot', 'complaint-script', 'easy-explainer', 'license-cbt', 'admission-studio', 'career-clinic', 'home-massage', 'diet-planner', 'pet-signal', 'voucher-checker', 'future-strategy', 'privacy-shield', 'item-analysis', 'grading-helper']
export const appById = id => WEBAPPS.find(a => a.id === id)

// 띄어쓰기·대소문자와 관계없이 제목, 설명, 태그, 기능에서 찾습니다.
const norm = s => (s || '').toLowerCase().replace(/\s+/g, '')
export function searchApps(list, q) {
  const words = (q || '').trim().split(/\s+/).filter(Boolean).map(norm)
  if (words.length === 0) return list
  return list
    .map(a => {
      const title = norm(a.title)
      const body = norm([a.summary, a.category, ...a.tags, ...a.features, ...a.roles.map(r => MARKET_ROLES[r])].join(' '))
      let score = 0
      for (const w of words) {
        if (title.includes(w)) score += 3
        else if (body.includes(w)) score += 1
        else return null
      }
      return [a, score]
    })
    .filter(Boolean)
    .sort((x, y) => y[1] - x[1])
    .map(x => x[0])
}
