/* 광주보건대 학과 정보 (입학안내 누리집 공개 내용, 2026-11 확인)
   - 성인학습자 학과 정보: ipsi.ghu.ac.kr 「성인학습자 소개」
   - 학과 목록·학제: ipsi.ghu.ac.kr 「2027학년도 수시1차 경쟁률」
   면허 이름은 학과와 직결되는 것만 미리 채웠습니다. 모집 인원·일정·장학은 해마다 바뀌므로 최종본은 모집요강으로 확인합니다. */

export const SOURCE_URL = 'https://ipsi.ghu.ac.kr/AdultLearnerIntroduction'
export const ADMISSION_TEL = '입학처 062-958-7511~7514'
export const ADULT_CENTER_TEL = '성인학습지원센터 062-958-7602~7603'

// 성인학습자 공통 특전(입학안내 「성인학습자 소개」 기준)
export const ADULT_PERKS = {
  who: '25세 이상 누구나(직장인, 퇴직·퇴직 예정자 포함)',
  degree: '전문학사 학위 취득',
  scholarship: '국가장학금(소득구간별)과 성인학습자 장학금(등록금 50%)',
  schedule: '주 2~3회 야간 수업과 온라인 수업',
  noExam: '졸업 후 무시험 자격 취득(사회복지계열만)',
}

// adult: 'only' 성인학습자 전담 학과, 'sat' 성인학습자 토요일 수업 운영, undefined 일반 학과
export const DEPTS = [
  { name: '간호학과', years: 4, licenses: '간호사 면허' },
  { name: '물리치료학과', years: 3, licenses: '물리치료사 면허' },
  { name: '방사선학과', years: 3, licenses: '방사선사 면허' },
  { name: '임상병리학과', years: 3, licenses: '임상병리사 면허' },
  { name: '치위생학과', years: 3, licenses: '치과위생사 면허' },
  { name: '치기공학과', years: 3, licenses: '치과기공사 면허' },
  { name: '응급구조학과', years: 3, licenses: '1급 응급구조사 자격' },
  { name: '식품영양학과', years: 3, licenses: '영양사 면허' },
  { name: '보건행정학과', years: 3, licenses: '' },
  { name: '스포츠의학과', years: 3, licenses: '' },
  { name: '사회복지학과', years: 2, licenses: '사회복지사 2급' },
  { name: '뷰티케어학과', years: 2, licenses: '' },
  { name: '유아교육학과', years: 3, adult: 'sat', licenses: '유치원 정교사 2급, 보육교사 2급', tel: '062-958-7672' },
  { name: '안경광학과', years: 3, adult: 'sat', licenses: '안경사 면허, 보청기 관리사, 시기능 훈련사', tel: '062-958-7705',
    careers: '안경원 개원·취업, 안과병원, 안경렌즈·콘택트렌즈 업체' },
  { name: '손해사정학과', years: 2, adult: 'only', quota: 30, licenses: '신체·차량·재물 손해사정사, 농어업 손해평가사, 보험심사역', tel: '062-958-7656',
    careers: '보험회사·손해사정법인 손해사정사, 손해평가법인 손해평가사, 손해사정법인 창업' },
  { name: '상담복지학과', years: 2, adult: 'only', quota: 20, licenses: '사회복지사 2급, 상담심리지도사 2급, 노인심리상담사 1급', tel: '062-958-7724',
    careers: '종합사회복지관, 청소년상담복지센터, 아동·노인 보호전문기관, 사회복지 전담공무원' },
  { name: '복지경영학과', years: 2, adult: 'only', quota: 35, licenses: '사회복지사 2급, 건강가정사, 통합돌봄 사례관리사 수료', tel: '062-958-7723',
    careers: '사회복지기관·생활시설, 지자체 통합돌봄 수행인력, 재가복지센터, 복지기관 창업·위탁경영' },
  { name: '중독재활복지학과', years: 2, adult: 'only', quota: 20, licenses: '사회복지사 2급, 중독재활상담사, 중독예방전문가', tel: '062-958-7722',
    careers: '중독관리통합지원센터, 정신건강복지센터, 가족센터, 사회복지 전담공무원' },
  { name: '시니어운동처방학과', years: 2, adult: 'only', quota: 20, licenses: '생활스포츠지도사, 노인스포츠지도사, 건강운동관리사, 걷기지도사', tel: '062-958-7598',
    careers: '노인스포츠지도사, 운동처방센터, 생활스포츠지도사, 노인체육 업체 취업·창업' },
]

export const deptByName = n => DEPTS.find(d => d.name === n)
