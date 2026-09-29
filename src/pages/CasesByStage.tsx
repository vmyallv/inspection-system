import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadDb } from '../mockDb';
import type { Case, Subject, CaseStatus } from '../mockDb';
import { Search, ChevronRight, FileText, AlertCircle, Shield, ClipboardCheck, Archive } from 'lucide-react';

const STAGE_CONFIG: Record<string, {
  status: CaseStatus;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  badge: string;
  filterFn?: (c: Case) => boolean;
}> = {
  '0': {
    status: 'INTAKE',
    title: '1단계 · 등록된 사건',
    description: '비위사실이 최초 인지되어 사건번호가 채번되고 관련자 기초 정보가 등록된 단계입니다.',
    color: '#f59e0b', icon: <FileText size={22} />, badge: 'INTAKE',
  },
  '1': {
    status: 'PRELIMINARY',
    title: '2단계 · 조사 계획',
    description: '비위사실 혐의점을 기반으로 조사 목적, 대상 및 일정, 조사관 편성을 수립하고 상급자 결재를 받는 단계입니다.',
    color: '#8b5cf6', icon: <Search size={22} />, badge: 'PRELIMINARY',
  },
  '2': {
    status: 'MAIN',
    title: '3단계 · 본조사(증거/출석)',
    description: '피조사자 출석 요구, 문답서·진술조서 작성, 디지털 증거물 수집 및 등록이 진행되는 단계입니다.',
    color: '#3b82f6', icon: <Shield size={22} />, badge: 'MAIN',
  },
  '3': {
    status: 'DISPOSITION',
    title: '4단계 · 결과보고/심의',
    description: '감찰결과보고서 파일 첨부, 조사관 의견서 기록, 처분심의위원회 운영 및 의결이 진행되는 단계입니다.',
    color: '#10b981', icon: <ClipboardCheck size={22} />, badge: 'DISPOSITION',
  },
  '4': {
    status: 'ARCHIVED',
    title: '5단계 · 처분결과',
    description: '최종 처분이 확정된 사건 목록입니다.',
    color: '#6b7280', icon: <Archive size={22} />, badge: 'ARCHIVED',
  },
  '5': {
    status: 'ARCHIVED',
    title: '6단계 · 재심의 신청',
    description: '처분 결과에 이의를 제기하여 재심의가 신청된 사건 목록입니다.',
    color: '#f97316', icon: <Archive size={22} />, badge: 'ARCHIVED',
    filterFn: (c) => c.status === 'ARCHIVED' && (c as any).appealStatus === 'REQUESTED',
  },
  '6': {
    status: 'ARCHIVED',
    title: '7단계 · 재심의 결과',
    description: '재심의 진행 후 최종 결과가 확정된 사건 목록입니다.',
    color: '#ec4899', icon: <Archive size={22} />, badge: 'ARCHIVED',
    filterFn: (c) => c.status === 'ARCHIVED' && (c as any).appealStatus === 'RESOLVED',
  },
};

const STATUS_LABEL: Record<string, string> = {
  INTAKE: '1단계(등록된 사건)',
  PRELIMINARY: '2단계(조사 계획)',
  MAIN: '3단계(본조사)',
  DISPOSITION: '4단계(결과보고/심의)',
  ARCHIVED: '5단계(처분결과)',
};

export default function CasesByStage() {
  const { stage } = useParams<{ stage: string }>();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const config = STAGE_CONFIG[stage || '0'];

  useEffect(() => {
    const db = loadDb();
    setSubjects(db.subjects);
    const allFiltered = config?.filterFn
      ? db.cases.filter(config.filterFn)
      : db.cases.filter(c => c.status === config?.status);
    setCases(allFiltered);
  }, [stage]);

  if (!config) return <div className="card"><p>잘못된 단계입니다.</p></div>;

  const filtered = cases.filter(c =>
    (c.caseNumber || '').includes(searchTerm) ||
    (c.violationType || '').includes(searchTerm)
  );

  return (
    <div>
      {/* 단계 헤더 */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            padding: '0.75rem',
            borderRadius: '0.75rem',
            background: `${config.color}22`,
            color: config.color,
          }}>
            {config.icon}
          </div>
          <div>
            <h1 className="page-title" style={{ color: config.color, margin: 0 }}>{config.title}</h1>
            <p className="page-description" style={{ margin: 0, marginTop: '0.25rem' }}>{config.description}</p>
          </div>
        </div>
      </div>

      {/* 단계 네비게이터 */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => navigate(`/cases/stage/${key}`)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '999px',
              border: `1px solid ${key === stage ? cfg.color : 'var(--surface-border)'}`,
              background: key === stage ? `${cfg.color}22` : 'transparent',
              color: key === stage ? cfg.color : 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: key === stage ? 'bold' : 'normal',
              transition: 'all 0.2s',
            }}
          >
            {cfg.title.split(' · ')[0]}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="사건번호 또는 비위유형 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: '0.5rem', color: 'white' }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            총 {filtered.length}건
          </span>
        </div>
      </div>

      {/* 사건 목록 */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>이 단계에 해당하는 사건이 없습니다.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/register')}>
            새 사건 등록하기
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(c => {
            const subject = subjects.find(s => s.id === c.subjectId);
            return (
              <div
                key={c.id}
                className="card"
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', borderTop: `3px solid ${config.color}` }}
                onClick={() => navigate(`/cases/${c.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    background: `${config.color}22`,
                    color: config.color,
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}>
                    {STATUS_LABEL[config.status]}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.incidentDate}</span>
                </div>

                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>{c.caseNumber}</h3>
                <p style={{ color: config.color, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{c.violationType}</p>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', marginBottom: '0.75rem', flex: 1 }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>관련자(대상자)</p>
                  <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{subject?.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subject?.affiliation} · {subject?.militaryId}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  상세 워크플로우 진입 <ChevronRight size={15} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
