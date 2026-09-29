import { useState, useEffect } from 'react';
import { loadDb, CASE_STATUS_LABELS } from '../mockDb';
import type { Case, Subject } from '../mockDb';
import { Activity, Users, ShieldAlert, Archive, FileText, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<{cases: Case[], subjects: Subject[]}>({cases: [], subjects: []});
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  useEffect(() => {
    setData(loadDb());
  }, []);

  // 사건에서 존재하는 연도 목록 자동 추출
  const availableYears = Array.from(
    new Set(data.cases.map(c => c.incidentDate?.substring(0, 4)).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));

  // 연도 필터링된 사건들
  const filteredCases = selectedYear === 'ALL'
    ? data.cases
    : data.cases.filter(c => c.incidentDate?.startsWith(selectedYear));

  const activeCases = filteredCases.filter(c => c.status !== 'ARCHIVED').length;
  const archivedCases = filteredCases.filter(c => c.status === 'ARCHIVED').length;
  const intakeCases = filteredCases.filter(c => c.status === 'INTAKE').length;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">직무감찰 현황</h1>
          <p className="page-description">배당된 직무감찰 사건의 단계별 상태, 기한 임박 내역, 처분 결과를 연도별로 종합 파악합니다.</p>
        </div>

        {/* 연도별 확인 체크/필터 박스 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: '#1a1c24',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.4rem 0.8rem',
          borderRadius: '0.6rem',
        }}>
          <Calendar size={18} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>조회 연도:</span>
          
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button
              type="button"
              onClick={() => setSelectedYear('ALL')}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '0.4rem',
                border: 'none',
                background: selectedYear === 'ALL' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: selectedYear === 'ALL' ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: selectedYear === 'ALL' ? 'bold' : 'normal',
                transition: 'all 0.15s ease',
              }}
            >
              전체
            </button>
            {availableYears.map(yr => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '0.4rem',
                  border: 'none',
                  background: selectedYear === yr ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: selectedYear === yr ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: selectedYear === yr ? 'bold' : 'normal',
                  transition: 'all 0.15s ease',
                }}
              >
                {yr}년
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 효율적이고 컴팩트한 상단 요약 통계 바 */}
      <div className="grid-5" style={{ marginBottom: '1.5rem' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
            <Activity size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>진행기한 임박 사건</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', lineHeight: 1.2, color: 'var(--danger)' }}>
              {selectedYear === 'ALL' || selectedYear === '2026' ? '1건' : '0건'}
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)' }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>진행 중 사건 ({selectedYear === 'ALL' ? '전체' : `${selectedYear}년`})</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', lineHeight: 1.2 }}>{activeCases}건</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>출석 예정자</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', lineHeight: 1.2 }}>
              {selectedYear === 'ALL' || selectedYear === '2026' ? '2명' : '0명'}
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
            <FileText size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>1단계 등록 사건</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', lineHeight: 1.2 }}>{intakeCases}건</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)' }}>
            <Archive size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>처분 완료 사건</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', lineHeight: 1.2 }}>{archivedCases}건</div>
          </div>
        </div>
      </div>

      {/* 최근 진행 중인 사건 목록 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>진행 중인 직무감찰 사건 목록</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            기준: {selectedYear === 'ALL' ? '전체 연도' : `${selectedYear}년도 발생 사건`} (총 {activeCases}건)
          </span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>사건번호</th>
                <th>발생일자</th>
                <th>관련자(대상자)</th>
                <th>비위유형</th>
                <th>현재 단계</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.filter(c => c.status !== 'ARCHIVED').length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    해당 연도에 진행 중인 사건이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredCases.filter(c => c.status !== 'ARCHIVED').map(c => {
                  const subject = data.subjects.find(s => s.id === c.subjectId);
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '600' }}>{c.caseNumber}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.incidentDate}</td>
                      <td>{subject?.name} ({subject?.affiliation})</td>
                      <td>{c.violationType}</td>
                      <td>
                        <span className={`badge ${c.status}`}>
                          {CASE_STATUS_LABELS[c.status] || c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 처분 현황 */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', margin: 0 }}>
            <Archive size={20} /> 처분 현황 ({selectedYear === 'ALL' ? '전체' : `${selectedYear}년`})
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            종결 및 처분 확정: {archivedCases}건
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          모든 조사가 종결되고 최종 징계 및 처분이 확정된 사건 내역입니다.
        </p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>사건번호</th>
                <th>발생일자</th>
                <th>관련자(대상자)</th>
                <th>비위유형</th>
                <th>최종 처분</th>
                <th>처분 일자</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.filter(c => c.status === 'ARCHIVED').length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    해당 연도에 처분 확정된 사건 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredCases.filter(c => c.status === 'ARCHIVED').map(c => {
                  const subject = data.subjects.find(s => s.id === c.subjectId);
                  return (
                    <tr key={c.id} style={{ opacity: 0.85 }}>
                      <td style={{ fontWeight: '600' }}>{c.caseNumber}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.incidentDate}</td>
                      <td>{subject?.name} ({subject?.affiliation})</td>
                      <td>{c.violationType}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{c.finalDisposition || '기록 없음'}</td>
                      <td>{c.dispositionDate || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
