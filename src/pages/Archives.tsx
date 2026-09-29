import { useState, useEffect } from 'react';
import { loadDb } from '../mockDb';
import type { Case, Subject } from '../mockDb';
import { Lock } from 'lucide-react';

export default function Archives() {
  const [data, setData] = useState<{cases: Case[], subjects: Subject[]}>({cases: [], subjects: []});

  useEffect(() => {
    setData(loadDb());
  }, []);

  const archivedCases = data.cases.filter(c => c.status === 'ARCHIVED');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Lock size={28} color="var(--danger)" />
          처분완료 기록실
        </h1>
        <p className="page-description">모든 처분이 완료되어 잠금 처리된 사건 기록입니다. (읽기 전용, 수정 불가)</p>
      </div>

      <div className="card">
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', color: 'var(--text-main)', marginBottom: '2rem' }}>
          <strong>⚠️ 주의:</strong> 이 페이지의 기록을 열람할 경우, 접속자의 정보와 열람 일시가 <strong>보안 로그(Audit Log)</strong>에 기록됩니다.
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>사건번호</th>
                <th>대상자</th>
                <th>비위유형</th>
                <th>발생일시</th>
                <th>상태</th>
                <th>권한</th>
              </tr>
            </thead>
            <tbody>
              {archivedCases.map(c => {
                const subject = data.subjects.find(s => s.id === c.subjectId);
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 'bold' }}>{c.caseNumber}</td>
                    <td>{subject?.name} ({subject?.affiliation})</td>
                    <td>{c.violationType}</td>
                    <td>{c.incidentDate}</td>
                    <td><span className="badge ARCHIVED">수정 불가</span></td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => alert('보안 로그 기록 완료. 열람 창 띄우기 (시뮬레이션)')}>
                        상세 열람
                      </button>
                    </td>
                  </tr>
                );
              })}
              {archivedCases.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    처분완료된 사건이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
