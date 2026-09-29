import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldAlert, Settings, ChevronDown, ChevronRight, FileText } from 'lucide-react';

const CASE_STAGES = [
  { label: '1. 등록된 사건', tab: 0 },
  { label: '2. 조사 계획', tab: 1 },
  { label: '3. 본조사(증거/출석)', tab: 2 },
  { label: '4. 결과보고/심의', tab: 3 },
  { label: '5. 처분결과', tab: 4 },
  { label: '6. 재심의 신청', tab: 5 },
  { label: '7. 재심의 결과', tab: 6 },
];

export default function Sidebar() {
  const location = useLocation();
  const [casesOpen, setCasesOpen] = useState(
    location.pathname.startsWith('/cases')
  );

  const isCasesActive = location.pathname.startsWith('/cases');

  return (
    <aside className="sidebar">
      <div className="sidebar-title">
        <ShieldAlert size={28} color="#3b82f6" />
        감찰정보시스템
      </div>
      <nav className="nav-links">

        {/* 직무감찰 현황 */}
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          직무감찰 현황
        </Link>

        {/* 사건 등록 */}
        <Link to="/register" className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}>
          <ShieldAlert size={20} color="var(--warning)" />
          사건 등록
        </Link>

        {/* 사건 진행관리 (아코디언) */}
        <div>
          <button
            onClick={() => setCasesOpen(!casesOpen)}
            className={`nav-link ${isCasesActive ? 'active' : ''}`}
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', justifyContent: 'space-between', textAlign: 'left' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldAlert size={20} />
              사건 진행관리
            </span>
            {casesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {casesOpen && (
            <div style={{ marginLeft: '1.5rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <Link
                to="/cases"
                className={`nav-link ${location.pathname === '/cases' ? 'active' : ''}`}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
              >
                <FileText size={15} /> 사건 목록 전체
              </Link>
              {CASE_STAGES.map((stage) => (
                <Link
                  key={stage.tab}
                  to={`/cases/stage/${stage.tab}`}
                  className={`nav-link ${location.pathname === `/cases/stage/${stage.tab}` ? 'active' : ''}`}
                  style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', marginRight: '0.4rem', flexShrink: 0 }} />
                  {stage.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 대상자 관리 */}
        <Link to="/subjects" className={`nav-link ${location.pathname === '/subjects' ? 'active' : ''}`}>
          <Users size={20} />
          대상자 관리
        </Link>

        {/* 시스템 설정 */}
        <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
          <Settings size={20} />
          시스템 설정
        </Link>

      </nav>

      <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>독립망 프로토타입 v1.0</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.25rem' }}>접속자: 최고관리자(감찰관)</p>
      </div>
    </aside>
  );
}
