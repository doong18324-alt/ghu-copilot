import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { ChatPage, FilesPage, Login, TaskPage } from './pages/common.jsx'
import { StaffHome, Projects, Todo, OfficialDocs, Meeting, RulesQA, Evaluation } from './pages/staff.jsx'
import { FacultyHome, Courses, BotBuilder, ItemGen, Analytics, Training } from './pages/faculty.jsx'
import { StudentHome, MyCourses, Exam, Clinical, StudyRoom, CampusQA, Notes } from './pages/student.jsx'
import { ProgramAdmin, Programs, Achievements } from './pages/shared.jsx'
import { AdminHome, Models, Users, Connection } from './pages/admin.jsx'
import { PublicLayout, About, Showcase, Recruit } from './pages/public.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<PublicLayout />}>
        <Route path="/about" element={<About />} />
        <Route path="/about/:page" element={<About />} />
        <Route path="/news" element={<Showcase />} />
        <Route path="/recruit" element={<Recruit />} />
      </Route>

      <Route path="/staff" element={<Layout />}>
        <Route index element={<StaffHome />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="todo" element={<Todo />} />
        <Route path="projects" element={<Projects />} />
        <Route path="docs" element={<OfficialDocs />} />
        <Route path="meeting" element={<Meeting />} />
        <Route path="rules" element={<RulesQA />} />
        <Route path="evaluation" element={<Evaluation />} />
        <Route path="program-admin" element={<ProgramAdmin />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="analysis" element={<TaskPage task="analysis" title="문서·데이터 분석" desc="보고서를 요약하거나 엑셀 자료를 집계·정리합니다. 파일 분석은 실제 연결 후 사용할 수 있습니다." placeholder="예: 첨부한 만족도 조사 결과를 학과별로 요약해 줘" />} />
        <Route path="research" element={<TaskPage task="research" title="심층 리서치" desc="정책, 타 대학 사례, 통계를 조사하고 출처와 함께 정리합니다." placeholder="예: 전문대학 생성형 AI 도입 사례를 조사해 줘" />} />
        <Route path="files" element={<FilesPage />} />
      </Route>

      <Route path="/faculty" element={<Layout />}>
        <Route index element={<FacultyHome />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="courses" element={<Courses />} />
        <Route path="bot" element={<BotBuilder />} />
        <Route path="design" element={<TaskPage task="design" title="수업 설계 조교" desc="학습목표, 차시 구성, 활동, 평가 루브릭을 함께 설계합니다." placeholder="예: 보행분석 3주차 90분 수업을 설계해 줘" />} />
        <Route path="items" element={<ItemGen />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="research" element={<TaskPage task="research" title="연구에 AI 쓰기" desc="문헌 검토 계획, 통계 분석 코드, IRB 서식 초안, 영문 교정을 돕습니다. 결과는 반드시 원문과 대조해 확인하세요." placeholder="예: 노인 낙상 예방 운동 RCT 문헌 검색식을 만들어 줘" />} />
        <Route path="apps" element={<TaskPage task="apps" title="전공 앱 만들기" desc="만들고 싶은 실습용 앱을 말로 설명하면 화면 구성과 코드 초안을 만듭니다." placeholder="예: 학생이 관절가동범위를 입력하면 정상 범위와 비교해 주는 앱" />} />
        <Route path="training" element={<Training />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="files" element={<FilesPage />} />
      </Route>

      <Route path="/student" element={<Layout />}>
        <Route index element={<StudentHome />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="courses" element={<MyCourses />} />
        <Route path="notes" element={<Notes />} />
        <Route path="exam" element={<Exam />} />
        <Route path="clinical" element={<Clinical />} />
        <Route path="campus" element={<CampusQA />} />
        <Route path="room" element={<StudyRoom />} />
        <Route path="programs" element={<Programs />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="files" element={<FilesPage />} />
      </Route>

      <Route path="/admin" element={<Layout />}>
        <Route index element={<AdminHome />} />
        <Route path="models" element={<Models />} />
        <Route path="users" element={<Users />} />
        <Route path="connection" element={<Connection />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
