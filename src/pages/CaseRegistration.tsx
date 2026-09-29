import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addCaseAndSubject, loadDb } from '../mockDb';
import type { Subject } from '../mockDb';
import { FilePlus, User, ShieldAlert, Key, PlusCircle, Trash2, Network, Search, X, Building2, ChevronRight, Check } from 'lucide-react';

const VIOLATION_TYPES = [
  '직무태만 및 직무유기', '직권남용', '비밀엄수 위반', '청렴의무 위반 (금품·향응 수수 등)',
  '품위유지 위반 (성비위)', '품위유지 위반 (음주운전)', '품위유지 위반 (폭행 등)',
  '복종의무 위반 (지시불이행 등)', '직장이탈 금지 위반', '영리업무 및 겸직 금지 위반',
  '정치운동 금지 위반', '기타 (국가공무원법 및 징계령 위반)'
];
const INTAKE_ROUTES = ['내부감찰', '외부이첩', '민원', '진정'];

export default function CaseRegistration() {
  const navigate = useNavigate();
  const [existingSubjects, setExistingSubjects] = useState<Subject[]>([]);
  
  // 관련자 인적사항
  const [militaryId, setMilitaryId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [rank, setRank] = useState('');
  
  // 빠른 검색 및 조직도 모달 상태
  const [searchPersonTerm, setSearchPersonTerm] = useState('');
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [selectedDeptGroup, setSelectedDeptGroup] = useState<string>('전체');
  const [orgSearchTerm, setOrgSearchTerm] = useState('');

  // 참고인 목록
  const [references, setReferences] = useState<Omit<Subject, 'id'>[]>([]);

  // 사건 정보
  const [intakeRoute, setIntakeRoute] = useState(INTAKE_ROUTES[0]);
  const [deptCode, setDeptCode] = useState('인사');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [violationType, setViolationType] = useState(VIOLATION_TYPES[0]);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    const db = loadDb();
    setExistingSubjects(db.subjects);
  }, []);

  const currentYear = new Date().getFullYear();
  const simulatedCaseNum = `${currentYear}-${intakeRoute}-${deptCode}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

  // 인물 선택 핸들러 (검색 또는 조직도에서 선택 시 자동 입력)
  const handleSelectPerson = (sub: Subject) => {
    setSubjectName(sub.name);
    setMilitaryId(sub.militaryId);
    setAffiliation(sub.affiliation);
    setRank(sub.rank);
    setDeptCode(sub.affiliation.substring(0, 2) || '감찰');
    setIsOrgModalOpen(false);
    setSearchPersonTerm('');
  };

  // 실시간 검색어 일치 인물 목록
  const searchResults = searchPersonTerm.trim()
    ? existingSubjects.filter(s =>
        (s.name || '').includes(searchPersonTerm) ||
        (s.militaryId || '').includes(searchPersonTerm) ||
        (s.affiliation || '').includes(searchPersonTerm)
      )
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName || !affiliation || !summary || !militaryId) {
      alert('모든 필수 항목을 입력해주세요.'); return;
    }

    addCaseAndSubject(
      { militaryId, name: subjectName, affiliation, rank, type: 'PRIMARY' },
      references,
      { caseNumber: simulatedCaseNum, intakeRoute, departmentCode: deptCode, investigatorId: 'A01', violationType, incidentDate, summary }
    );

    alert('사건이 성공적으로 등록되었습니다. 담당관 배당 및 보안 격리가 시작됩니다.');
    navigate('/cases');
  };

  const addRef = () => setReferences([...references, { militaryId: '', name: '', affiliation: '', rank: '', type: 'REFERENCE' }]);
  const updateRef = (index: number, field: string, value: string) => {
    const newRefs = [...references];
    (newRefs[index] as any)[field] = value;
    setReferences(newRefs);
  };
  const removeRef = (index: number) => setReferences(references.filter((_, i) => i !== index));

  // 조직도 부서 그룹 추출
  const deptGroups = ['전체', ...Array.from(new Set(existingSubjects.map(s => s.departmentGroup || s.affiliation)))];

  // 조직도 모달 필터링
  const orgFilteredSubjects = existingSubjects.filter(s => {
    const matchDept = selectedDeptGroup === '전체' || (s.departmentGroup || s.affiliation) === selectedDeptGroup;
    const matchSearch = (s.name || '').includes(orgSearchTerm) || (s.militaryId || '').includes(orgSearchTerm) || (s.affiliation || '').includes(orgSearchTerm);
    return matchDept && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">1. 사건 등록 (인지 보고서)</h1>
        <p className="page-description">
          조직도 및 인원 검색을 통해 관련자를 지정하고, 비위사실 요지 및 단초 정보를 작성하여 고유 사건번호를 자동 부여합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid-2" style={{ alignItems: 'start' }}>
        
        {/* 관련자 인적사항 폼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', margin: 0 }}>
                <User size={20}/> 관련자 등록
              </h2>
              {/* 조직도에서 선택 버튼 */}
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsOrgModalOpen(true)}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Network size={16} color="var(--primary)" />
                조직도에서 선택
              </button>
            </div>

            {/* 인물 빠른 검색 창 */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#15171d',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.85rem',
              }}>
                <Search size={16} color="var(--primary)" />
                <input
                  type="text"
                  placeholder="등록된 인원 검색(이름, 군번/사번 입력 시 자동 채우기)..."
                  value={searchPersonTerm}
                  onChange={e => setSearchPersonTerm(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    outline: 'none',
                    flex: 1,
                    fontSize: '0.88rem',
                  }}
                />
                {searchPersonTerm && (
                  <button type="button" onClick={() => setSearchPersonTerm('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* 검색 드롭다운 결과 */}
              {searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#1e2129',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  zIndex: 20,
                  marginTop: '0.25rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {searchResults.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => handleSelectPerson(sub)}
                      style={{
                        padding: '0.65rem 0.85rem',
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
                        <strong>{sub.name}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({sub.rank} · {sub.affiliation})</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.militaryId}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 인적사항 입력 폼 (선택 시 자동 입력 및 직접 수정 가능) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>성명 *</label>
                <input type="text" className="form-input" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="예: 홍길동" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>군번/사번 *</label>
                  <input type="text" className="form-input" value={militaryId} onChange={e => setMilitaryId(e.target.value)} placeholder="예: 2015-12345" required />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>직급/계급 *</label>
                  <input type="text" className="form-input" value={rank} onChange={e => setRank(e.target.value)} placeholder="예: 대위, 사무관" required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>대상 기관/소속 부서 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={affiliation}
                  onChange={e => {
                    setAffiliation(e.target.value);
                    setDeptCode(e.target.value.substring(0, 2) || '감찰');
                  }}
                  placeholder="예: 인사과, 작전사령부"
                  required
                />
              </div>
            </div>
          </div>

          {/* 참고인 및 관련자 추가 */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="card-title" style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>참고인 및 부가 관련자 추가</h2>
              <button type="button" className="btn btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={addRef}>
                <PlusCircle size={15}/> 추가
              </button>
            </div>
            {references.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>등록된 참고인이 없습니다. 필요시 추가 버튼을 누르세요.</p>
            ) : (
              references.map((r, i) => (
                <div key={i} style={{ padding: '0.85rem', background: '#191b22', borderRadius: '0.5rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input placeholder="사번/군번" className="form-input" style={{ flex: 1, minWidth: '90px', margin: 0 }} value={r.militaryId} onChange={e=>updateRef(i, 'militaryId', e.target.value)} />
                  <input placeholder="성명" className="form-input" style={{ flex: 1, minWidth: '90px', margin: 0 }} value={r.name} onChange={e=>updateRef(i, 'name', e.target.value)} />
                  <input placeholder="소속/직급" className="form-input" style={{ flex: 1.2, minWidth: '100px', margin: 0 }} value={r.affiliation} onChange={e=>updateRef(i, 'affiliation', e.target.value)} />
                  <button type="button" className="btn" style={{ background: 'var(--danger)', color: 'white', padding: '0.5rem' }} onClick={()=>removeRef(i)}><Trash2 size={16}/></button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 사건정보 폼 (인지 보고서) */}
        <div className="card">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginBottom: '1.25rem' }}>
            <ShieldAlert size={20}/> 인지 보고서 작성
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>인지 경로</label>
                <select className="form-input" value={intakeRoute} onChange={e => setIntakeRoute(e.target.value)} style={{ margin: 0 }}>
                  {INTAKE_ROUTES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>사건번호 (자동채번)</label>
                <input type="text" className="form-input" value={simulatedCaseNum} readOnly style={{ color: 'var(--primary)', fontWeight: 'bold', margin: 0 }} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>비위 유형 *</label>
                <select className="form-input" value={violationType} onChange={e => setViolationType(e.target.value)} style={{ margin: 0 }}>
                  {VIOLATION_TYPES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>발생 일자 *</label>
                <input type="date" className="form-input" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} required style={{ margin: 0 }} />
              </div>
            </div>
            
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>비위사실 요지 및 인지 경위 *</label>
              <textarea
                className="form-input"
                style={{ minHeight: '140px', resize: 'vertical', lineHeight: 1.5, margin: 0 }}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="제보 내용, 포착 경위, 혐의 비위사실을 구체적으로 기술하세요. 이 내용은 다음 단계인 '조사 계획'으로 자동 연동됩니다."
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.82rem' }}>
              <Key size={16} /> Need-to-Know 접근 통제: 등록 즉시 주무 감찰관과 결재권자 외 조회 불가 상태로 격리 보호됩니다.
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.9rem' }}>
              <FilePlus size={18} /> 사건 등록 및 인지 보고서 확정
            </button>
          </div>
        </div>

      </form>

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
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>조직도에서 관련자(대상자) 선택</h3>
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
              
              {/* 좌측 부서 목록 */}
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
                    ? existingSubjects.length
                    : existingSubjects.filter(s => (s.departmentGroup || s.affiliation) === dept).length;

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
                    인원을 선택하면 사건 등록 폼에 인적사항이 자동 반영됩니다.
                  </span>
                </div>

                {orgFilteredSubjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    해당 부서에 소속된 인원이 없습니다.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem' }}>
                    {orgFilteredSubjects.map(sub => {
                      const isCurrent = subjectName === sub.name && militaryId === sub.militaryId;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => handleSelectPerson(sub)}
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
                              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              {isCurrent ? <Check size={14} /> : null}
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
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--surface-border);
          background: #15171d;
          color: white;
          display: block;
          margin-top: 0.25rem;
          font-family: inherit;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}
