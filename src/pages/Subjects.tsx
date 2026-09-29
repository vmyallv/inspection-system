import { useState, useEffect } from 'react';
import { loadDb, addPreventionLog, CASE_STATUS_LABELS } from '../mockDb';
import type { Case, Subject, PreventionActivityLog } from '../mockDb';
import { Search, User, History, Link as LinkIcon, ShieldAlert, PlusCircle, CheckCircle, ShieldCheck, AlertTriangle, Network, X, Building2, ChevronRight } from 'lucide-react';

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  '정상': { label: '정상', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  '관심': { label: '관심', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  '주의': { label: '주의', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  '중점관리': { label: '중점관리', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

const CATEGORIES = [
  '청렴 면담·상담', '청렴 모니터링', '취약시기 예방점검', '제보·단서 확인', '제도개선 지도', '기타'
] as const;

export default function Subjects() {
  const [data, setData] = useState<{
    cases: Case[];
    subjects: Subject[];
    preventionLogs: PreventionActivityLog[];
  }>({ cases: [], subjects: [], preventionLogs: [] });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // 조직도 모달 상태
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [selectedDeptGroup, setSelectedDeptGroup] = useState<string>('전체');
  const [orgSearchTerm, setOrgSearchTerm] = useState('');

  // 신규 예방감찰 활동 작성 상태
  const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0]);
  const [actCategory, setActCategory] = useState<typeof CATEGORIES[number]>('청렴 면담·상담');
  const [actRisk, setActRisk] = useState<'정상' | '관심' | '주의' | '중점관리'>('관심');
  const [actInspector, setActInspector] = useState('김감찰관');
  const [actContent, setActContent] = useState('');
  const [actFollowUp, setActFollowUp] = useState('');
  const [showActForm, setShowActForm] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const db = loadDb();
    setData({
      cases: db.cases,
      subjects: db.subjects,
      preventionLogs: db.preventionLogs || [],
    });
    if (!selectedSubjectId && db.subjects.length > 0) {
      setSelectedSubjectId(db.subjects[0].id);
    }
  };

  // 검색 필터링된 대상자 목록
  const filteredSubjects = data.subjects.filter(s =>
    (s.name || '').includes(searchTerm) || (s.militaryId || '').includes(searchTerm) || (s.affiliation || '').includes(searchTerm)
  );

  // 검색어 입력 시 첫 매칭 인물 자동 선택
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      const match = data.subjects.find(s =>
        (s.name || '').includes(value) || (s.militaryId || '').includes(value)
      );
      if (match) {
        setSelectedSubjectId(match.id);
      }
    }
  };

  const selectedSubject = data.subjects.find(s => s.id === selectedSubjectId) || data.subjects[0];

  // 선택된 인물 관련 사건들
  const subjectCases = selectedSubject ? data.cases.filter(c => c.subjectId === selectedSubject.id) : [];
  const relatedCases = selectedSubject ? data.cases.filter(c => c.relatedPersons?.includes(selectedSubject.id)) : [];
  
  // 선택된 인물의 예방감찰 활동 기록
  const subjectPreventionLogs = selectedSubject ? data.preventionLogs.filter(o => o.subjectId === selectedSubject.id) : [];

  // 최근 예방관리 등급 판정
  const latestRisk = subjectPreventionLogs.length > 0 ? subjectPreventionLogs[0].riskLevel : '정상';

  // 신규 예방감찰 활동 결과 추가 핸들러
  const handleAddPreventionLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !actContent.trim()) {
      alert('활동 내용을 입력해주세요.');
      return;
    }

    addPreventionLog({
      subjectId: selectedSubject.id,
      date: actDate,
      category: actCategory,
      riskLevel: actRisk,
      inspector: actInspector || '담당감찰관',
      content: actContent,
      followUpAction: actFollowUp.trim() || undefined,
    });

    setActContent('');
    setActFollowUp('');
    setShowActForm(false);
    refreshData();
    alert('예방감찰 활동 결과가 성공적으로 등록되었습니다.');
  };

  // 조직도 부서 그룹 추출
  const deptGroups = ['전체', ...Array.from(new Set(data.subjects.map(s => s.departmentGroup || s.affiliation)))];

  // 조직도 모달 내 인원 필터링
  const orgFilteredSubjects = data.subjects.filter(s => {
    const matchDept = selectedDeptGroup === '전체' || (s.departmentGroup || s.affiliation) === selectedDeptGroup;
    const matchSearch = (s.name || '').includes(orgSearchTerm) || (s.militaryId || '').includes(orgSearchTerm) || (s.affiliation || '').includes(orgSearchTerm);
    return matchDept && matchSearch;
  });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">대상자 관리</h1>
        <p className="page-description">
          조직도 및 검색을 통해 대상자를 지정하고, 과거 처분 이력 조회와 함께 일상적인 예방감찰 지도·상담 활동을 기록·관리합니다.
        </p>
      </div>

      {/* 스마트 인물 검색 바 & 조직도 팝업 열기 버튼 & 빠른 칩 */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', position: 'relative' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: '#1a1c23',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.5rem',
            padding: '0.2rem 1rem',
            position: 'relative',
          }}>
            <Search size={20} color="var(--primary)" />
            <input
              type="text"
              placeholder="이름, 군번/사번, 소속 부서로 대상자 검색..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                flex: 1,
                padding: '0.65rem 0',
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                <X size={16} />
              </button>
            )}

            {/* 검색어 입력 시 드롭다운 결과 */}
            {searchTerm.trim() && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#1c1e27',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '0.5rem',
                boxShadow: '0 12px 30px rgba(0,0,0,0.55)',
                zIndex: 50,
                marginTop: '0.4rem',
                maxHeight: '220px',
                overflowY: 'auto',
              }}>
                {filteredSubjects.length === 0 ? (
                  <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                    일치하는 대상자가 없습니다.
                  </div>
                ) : (
                  filteredSubjects.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubjectId(sub.id);
                        setSearchTerm('');
                      }}
                      style={{
                        padding: '0.7rem 1rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.88rem',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div>
                        <strong style={{ color: 'white' }}>{sub.name}</strong>{' '}
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({sub.rank} · {sub.affiliation})</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>{sub.militaryId}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 조직도 팝업 열기 버튼 */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsOrgModalOpen(true)}
            style={{
              padding: '0.75rem 1.25rem',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
            }}
          >
            <Network size={18} />
            조직도에서 선택
          </button>
        </div>
      </div>

      {/* 대상자 상세 프로파일 화면 */}
      {selectedSubject ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 상단: 인물 기본 신상 & 예방관리 요약 카드 */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}>
                <User size={36} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0 }}>{selectedSubject.name}</h2>
                  <span style={{
                    fontSize: '0.8rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '0.35rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-main)',
                  }}>
                    {selectedSubject.rank}
                  </span>
                  <span style={{
                    fontSize: '0.8rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    fontWeight: 'bold',
                    background: RISK_CONFIG[latestRisk]?.bg || 'rgba(16, 185, 129, 0.15)',
                    color: RISK_CONFIG[latestRisk]?.color || 'var(--success)',
                  }}>
                    예방관리: {latestRisk}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
                  군번/사번: <strong style={{ color: 'var(--text-main)' }}>{selectedSubject.militaryId}</strong> │ 
                  소속: <strong style={{ color: 'var(--text-main)' }}>{selectedSubject.departmentGroup || ''} {selectedSubject.affiliation}</strong>
                </p>
              </div>
            </div>

            {/* 예방활동 요약 미니 지표 */}
            <div style={{ display: 'flex', gap: '1.5rem', background: '#1a1c23', padding: '0.85rem 1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>누적 감찰 사건</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{subjectCases.length}건</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>예방활동 내역</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{subjectPreventionLogs.length}건</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>최근 활동일</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', marginTop: '0.2rem' }}>
                  {subjectPreventionLogs[0]?.date || '기록 없음'}
                </div>
              </div>
            </div>
          </div>

          {/* 중앙: 2단 분할 - [예방감찰 활동 기록] & [감찰/처분 이력] */}
          <div className="grid-2" style={{ gridTemplateColumns: '1.3fr 1fr', alignItems: 'start' }}>

            {/* [좌측]: 예방감찰 활동 및 상담 기록 */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa' }}>
                    <ShieldCheck size={20} /> 예방감찰 활동 기록
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                    청렴 면담, 예방 점검, 제도개선 지도 등 대상자에 대한 사전 예방활동을 기록합니다.
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                  onClick={() => setShowActForm(!showActForm)}
                >
                  <PlusCircle size={16} /> {showActForm ? '입력창 닫기' : '활동 결과 등록'}
                </button>
              </div>

              {/* 신규 활동 결과 입력 폼 */}
              {showActForm && (
                <form onSubmit={handleAddPreventionLog} style={{
                  background: '#191b22',
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--primary)', margin: 0 }}>신규 예방활동 결과 입력</h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>활동 일자 *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={actDate}
                        onChange={(e) => setActDate(e.target.value)}
                        required
                        style={{ margin: 0 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>활동 구분 *</label>
                      <select
                        className="form-input"
                        value={actCategory}
                        onChange={(e) => setActCategory(e.target.value as any)}
                        style={{ margin: 0 }}
                      >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>관리 구분 *</label>
                      <select
                        className="form-input"
                        value={actRisk}
                        onChange={(e) => setActRisk(e.target.value as any)}
                        style={{ margin: 0 }}
                      >
                        <option value="정상">정상</option>
                        <option value="관심">관심</option>
                        <option value="주의">주의</option>
                        <option value="중점관리">중점관리</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>담당 감찰관/조사관</label>
                    <input
                      type="text"
                      className="form-input"
                      value={actInspector}
                      onChange={(e) => setActInspector(e.target.value)}
                      placeholder="담당관 직급 및 성명"
                      style={{ margin: 0 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>활동 내용 및 면담 요지 *</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={actContent}
                      onChange={(e) => setActContent(e.target.value)}
                      placeholder="면담 요지, 청렴 점검 결과, 직무 애로사항 및 지도 내용을 구체적으로 기술하세요."
                      required
                      style={{ margin: 0, resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>후속 조치 계획 (선택)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={actFollowUp}
                      onChange={(e) => setActFollowUp(e.target.value)}
                      placeholder="예: 분기별 정기 면담 실시, 부서 업무 분장 조정 지도 등"
                      style={{ margin: 0 }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowActForm(false)} style={{ padding: '0.5rem 1rem' }}>취소</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>활동 결과 등록</button>
                  </div>
                </form>
              )}

              {/* 예방활동 기록 타임라인 목록 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {subjectPreventionLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', background: '#191b22', borderRadius: '0.5rem' }}>
                    <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 0.5rem', opacity: 0.8 }} />
                    <p style={{ margin: 0 }}>등록된 예방감찰 활동 기록이 없습니다.</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>상단의 '활동 결과 등록' 버튼을 눌러 첫 활동 기록을 등록해 보세요.</p>
                  </div>
                ) : (
                  subjectPreventionLogs.map(act => {
                    const riskStyle = RISK_CONFIG[act.riskLevel] || RISK_CONFIG['정상'];
                    return (
                      <div
                        key={act.id}
                        style={{
                          background: '#1c1e27',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          borderLeft: `4px solid ${riskStyle.color}`,
                          borderRadius: '0.5rem',
                          padding: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              background: riskStyle.bg,
                              color: riskStyle.color,
                            }}>
                              {act.riskLevel}
                            </span>
                            <span style={{
                              fontSize: '0.78rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '0.25rem',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-main)',
                            }}>
                              {act.category}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {act.date} │ {act.inspector}
                          </div>
                        </div>

                        <p style={{ fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 0.5rem 0', whiteSpace: 'pre-wrap' }}>
                          {act.content}
                        </p>

                        {act.followUpAction && (
                          <div style={{
                            fontSize: '0.82rem',
                            color: '#93c5fd',
                            background: 'rgba(59, 130, 246, 0.08)',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '0.35rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}>
                            <AlertTriangle size={14} color="#60a5fa" />
                            <span>후속 조치: {act.followUpAction}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* [우측]: 과거 처분완료 이력 & 현재 연루 사건 & 참고인 내역 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* 과거 징계 및 처분 이력 */}
              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
                  <History size={18} /> 과거 징계 및 처분 이력
                </h3>
                {subjectCases.filter(c => c.status === 'ARCHIVED').length > 0 ? (
                  subjectCases.filter(c => c.status === 'ARCHIVED').map(c => (
                    <div
                      key={c.id}
                      style={{
                        padding: '0.85rem',
                        background: '#1a1c24',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '0.5rem',
                        marginBottom: '0.6rem',
                        fontSize: '0.88rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{c.incidentDate.substring(0, 4)}년</strong>
                        <span className="badge ARCHIVED" style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}>
                          처분완료
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{c.violationType}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 'bold' }}>
                        최종 처분: {c.finalDisposition || '처분 확정'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, padding: '1rem', textAlign: 'center', background: '#1a1c24', borderRadius: '0.5rem' }}>
                    과거 징계 및 처분 이력이 없습니다.
                  </p>
                )}
              </div>

              {/* 현재 주 혐의 연루 (진행 중인 사건) */}
              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                  <ShieldAlert size={18} /> 현재 주 혐의 연루 (진행 중)
                </h3>
                {subjectCases.filter(c => c.status !== 'ARCHIVED').length > 0 ? (
                  subjectCases.filter(c => c.status !== 'ARCHIVED').map(c => (
                    <div
                      key={c.id}
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '0.5rem',
                        marginBottom: '0.6rem',
                        fontSize: '0.88rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{c.caseNumber}</strong>
                        <span className={`badge ${c.status}`} style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}>
                          {CASE_STATUS_LABELS[c.status] || c.status}
                        </span>
                      </div>
                      <div style={{ color: 'var(--danger)', fontWeight: '600' }}>{c.violationType}</div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, padding: '1rem', textAlign: 'center', background: '#1a1c24', borderRadius: '0.5rem' }}>
                    현재 진행 중인 혐의 사건이 없습니다.
                  </p>
                )}
              </div>

              {/* 참고인 등 연관 감찰 내역 */}
              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <LinkIcon size={18} /> 참고인 등 연관 감찰 내역
                </h3>
                {relatedCases.length > 0 ? (
                  relatedCases.map(c => (
                    <div
                      key={c.id}
                      style={{
                        padding: '0.85rem',
                        background: '#1a1c24',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '0.5rem',
                        marginBottom: '0.6rem',
                        fontSize: '0.88rem',
                      }}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>{c.caseNumber}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        사건 주요 참고인으로 등재되어 조사 협조 내역이 있습니다.
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, padding: '1rem', textAlign: 'center', background: '#1a1c24', borderRadius: '0.5rem' }}>
                    참고인으로 등재된 타 사건 기록이 없습니다.
                  </p>
                )}
              </div>

            </div>

          </div>

        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          조회할 대상자를 검색하거나 조직도에서 선택해주세요.
        </div>
      )}

      {/* ======================= 조직도 팝업 모달 ======================= */}
      {isOrgModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '850px',
            maxHeight: '85vh',
            background: '#22252d',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '1rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* 모달 상단 헤더 */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#1c1e25',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Network size={22} color="#60a5fa" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>기관 조직도 기반 대상자 선택</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOrgModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 모달 검색 바 */}
            <div style={{ padding: '1rem 1.5rem', background: '#191b22', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#15171d',
                padding: '0.5rem 0.85rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="조직도 내 인원 성명, 사번, 부서 검색..."
                  value={orgSearchTerm}
                  onChange={e => setOrgSearchTerm(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '0.9rem',
                    flex: 1,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* 모달 바디: 좌측 부서 트리 + 우측 소속 인원 리스트 */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, overflow: 'hidden' }}>
              
              {/* 좌측 부서 트리 목록 */}
              <div style={{
                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#1a1c23',
                overflowY: 'auto',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem', fontWeight: 'bold' }}>
                  소속 기관 및 부서 목록
                </div>
                {deptGroups.map(dept => {
                  const isSelected = selectedDeptGroup === dept;
                  const count = dept === '전체'
                    ? data.subjects.length
                    : data.subjects.filter(s => (s.departmentGroup || s.affiliation) === dept).length;

                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setSelectedDeptGroup(dept)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: isSelected ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                        color: isSelected ? '#60a5fa' : 'var(--text-main)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? '600' : 'normal',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={16} color={isSelected ? '#60a5fa' : 'var(--text-muted)'} />
                        <span>{dept}</span>
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '999px',
                        background: isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#93c5fd' : 'var(--text-muted)',
                      }}>
                        {count}명
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 우측 인원 목록 */}
              <div style={{ padding: '1.25rem', overflowY: 'auto', background: '#22252d' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                    [{selectedDeptGroup}] 소속 인원 ({orgFilteredSubjects.length}명)
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    인원을 선택하면 즉시 상세 화면으로 전환됩니다.
                  </span>
                </div>

                {orgFilteredSubjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    해당 부서에 소속된 인원이 없습니다.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem' }}>
                    {orgFilteredSubjects.map(sub => {
                      const isCurrent = selectedSubject?.id === sub.id;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubjectId(sub.id);
                            setIsOrgModalOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.85rem 1.15rem',
                            background: isCurrent ? 'rgba(59, 130, 246, 0.15)' : '#1a1c23',
                            border: isCurrent ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '0.6rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isCurrent ? '#60a5fa' : 'var(--text-muted)',
                            }}>
                              <User size={20} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                                <strong style={{ fontSize: '0.95rem', color: 'white' }}>{sub.name}</strong>
                                <span style={{
                                  fontSize: '0.75rem',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '0.25rem',
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  color: 'var(--text-muted)',
                                }}>
                                  {sub.rank}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {sub.departmentGroup || ''} {sub.affiliation} │ 군번/사번: {sub.militaryId}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                              type="button"
                              className={isCurrent ? 'btn btn-primary' : 'btn btn-outline'}
                              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                            >
                              {isCurrent ? '선택됨' : '선택'}
                            </button>
                            <ChevronRight size={16} color="var(--text-muted)" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* 모달 푸터 */}
            <div style={{
              padding: '0.85rem 1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#1c1e25',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsOrgModalOpen(false)}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .form-input {
          width: 100%;
          padding: 0.7rem 0.85rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: #15171d;
          color: white;
          display: block;
          font-family: inherit;
          font-size: 0.9rem;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}
