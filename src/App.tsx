import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Subjects from './pages/Subjects';
import CaseRegistration from './pages/CaseRegistration';
import CasesByStage from './pages/CasesByStage';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content animate-fade-in">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/register" element={<CaseRegistration />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/stage/:stage" element={<CasesByStage />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="*" element={
            <div className="card">
              <h1 className="card-title">준비 중인 페이지입니다</h1>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}
export default App;
