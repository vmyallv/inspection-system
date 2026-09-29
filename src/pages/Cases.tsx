import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadDb, CASE_STATUS_LABELS } from '../mockDb';
import type { Case, Subject } from '../mockDb';
import { Search, ChevronRight } from 'lucide-react';

export default function Cases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const db = loadDb();
    setCases(db.cases.filter(c => c.status !== 'ARCHIVED'));
    setSubjects(db.subjects);
  }, []);

  const filteredCases = cases.filter(c => (c.caseNumber || '').includes(searchTerm) || (c.violationType || '').includes(searchTerm));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">사건 관리 목록</h1>
        <p className="page-description">현재 진행 중인 모든 사건을 조회하고 상세 워크플로우로 진입합니다.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="사건번호 또는 비위유형 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: '0.5rem', color: 'white' }}
          />
        </div>
      </div>

      <div className="grid-3">
        {filteredCases.map(c => {
          const subject = subjects.find(s => s.id === c.subjectId);
          return (
            <div key={c.id} className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => navigate(`/cases/${c.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className={`badge ${c.status}`}>{CASE_STATUS_LABELS[c.status] || c.status}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.incidentDate}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{c.caseNumber}</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '1rem' }}>{c.violationType}</p>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', flex: 1 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>관련자(대상자)</p>
                <p style={{ fontWeight: '500' }}>{subject?.name} ({subject?.affiliation})</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subject?.militaryId}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                상세 워크플로우 진입 <ChevronRight size={16} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
