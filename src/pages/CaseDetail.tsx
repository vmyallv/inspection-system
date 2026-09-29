import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadDb, saveCases, addAuditLog, CASE_STATUS_LABELS } from '../mockDb';
import type { Case, Subject, PrelimPlan, CaseStatus } from '../mockDb';
import { ArrowLeft, Upload, Lock, Key } from 'lucide-react';

const TABS = ['등록된 사건', '조사 계획', '본조사(증거/출석)', '결과보고/심의', '처분결과'];
const STATUS_ORDER: CaseStatus[] = ['INTAKE', 'PRELIMINARY', 'MAIN', 'DISPOSITION', 'ARCHIVED'];

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // States for sub-forms
  const [newLog, setNewLog] = useState('');
  const [planDraft, setPlanDraft] = useState<Partial<PrelimPlan>>({});
  
  const [summonsName, setSummonsName] = useState('');
  const [summonsDate, setSummonsDate] = useState('');
  
  const [evName, setEvName] = useState('');
  const [evType, setEvType] = useState('문서');
  const [evSubmitter, setEvSubmitter] = useState('');

  const [qnaText, setQnaText] = useState('');
  
  useEffect(() => {
    refreshData();
  }, [id]);

  const refreshData = () => {
    const db = loadDb();
    const c = db.cases.find(c => c.id === id);
    if (c) {
      setCaseData(c);
      setSubject(db.subjects.find(s => s.id === c.subjectId) || null);
      setActiveTab(STATUS_ORDER.indexOf(c.status));
      if (c.preliminaryPlan) setPlanDraft(c.preliminaryPlan);
    }
  }

  const updateCase = (updatedFields: Partial<Case>, logAction: string) => {
    if (!caseData) return;
    const updated = { ...caseData, ...updatedFields };
    const cases = loadDb().cases.map(c => c.id === updated.id ? updated : c);
    saveCases(cases);
    addAuditLog(updated.id, logAction);
    setCaseData(updated);
  };

  const changeStatus = (newStatus: CaseStatus, route: string = '') => {
    if (!caseData) return;
    updateCase({ status: newStatus }, `상태 변경: ${caseData.status} -> ${newStatus} ${route}`);
    setActiveTab(STATUS_ORDER.indexOf(newStatus));
    if (newStatus === 'ARCHIVED') {
      alert('사건이 완전 종결 및 처분완료 처리되어 읽기 전용으로 잠금 전환되었습니다.');
      navigate('/cases');
    }
  }

  // Phase 2 Handlers
  const savePlan = () => {
    updateCase({ preliminaryPlan: { ...planDraft, approved: false } as PrelimPlan }, '조사 계획서 작성 및 상신');
    alert('상급자에게 조사 계획서 결재(승인)가 상신되었습니다.');
  }
  const approvePlan = () => {
    updateCase({ preliminaryPlan: { ...caseData!.preliminaryPlan!, approved: true } }, '조사 계획서 승인 완료');
  }
  const addPrelimLog = () => {
    if(!newLog) return;
    const log = { id: Date.now().toString(), date: new Date().toLocaleString(), content: newLog };
    updateCase({ preliminaryLogs: [...(caseData?.preliminaryLogs || []), log] }, '기초 정보 수집 일지 추가');
    setNewLog('');
  }

  // Phase 3 Handlers
  const addSummons = () => {
    if(!summonsName || !summonsDate) return;
    const s = { id: Date.now().toString(), personName: summonsName, date: summonsDate, noShowCount: 0, status: 'SCHEDULED' as any };
    updateCase({ summons: [...(caseData?.summons || []), s] }, '출석 요구서 캘린더 등록');
    setSummonsName(''); setSummonsDate('');
  }
  const addInterrogation = () => {
    if(!qnaText) return;
    const i = { id: Date.now().toString(), type: '문답서', date: new Date().toLocaleString(), attendees: '주무조사관, 피조사자', content: qnaText };
    updateCase({ interrogations: [...(caseData?.interrogations || []), i] }, '문답서(조서) 작성');
    setQnaText('');
  }
  const addEvidence = () => {
    if(!evName || !evSubmitter) return;
    const count = (caseData?.evidence?.length || 0) + 1;
    const hash = Array.from({length:64}, () => Math.floor(Math.random()*16).toString(16)).join(''); // Fake SHA256
    const e = { id: Date.now().toString(), evNumber: `EV-${caseData?.caseNumber}-${count}`, type: evType, summary: evName, submitter: evSubmitter, date: new Date().toLocaleString(), hash };
    updateCase({ evidence: [...(caseData?.evidence || []), e] }, `디지털 증거물 추가 (해시: ${hash.substring(0,8)}...)`);
    setEvName(''); setEvSubmitter('');
  }

  if (!caseData || !subject) return <div>Loading...</div>;

  const isArchived = caseData.status === 'ARCHIVED';

  return (
    <div style={{ pointerEvents: isArchived ? 'none' : 'auto', opacity: isArchived ? 0.8 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/cases')} className="btn btn-outline" style={{ pointerEvents: 'auto' }}><ArrowLeft size={20} /></button>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {caseData.caseNumber} {isArchived && <Lock color="var(--danger)"/>}
          </h1>
          <p className="page-description" style={{ margin: 0 }}>관련자: {subject.name} ({subject.militaryId}) | 상태: {CASE_STATUS_LABELS[caseData.status] || caseData.status}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
        {TABS.map((tab, idx) => (
          <button key={tab} onClick={() => setActiveTab(idx)} style={{ background: 'transparent', border: 'none', color: activeTab === idx ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === idx ? 'bold' : 'normal', fontSize: '1.1rem', cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: activeTab === idx ? '2px solid var(--primary)' : 'none' }}>
            {idx + 1}. {tab}
          </button>
        ))}
      </div>

      <div className="card" style={{ minHeight: '600px' }}>
        {/* TAB 1 */}
        {activeTab === 0 && (
          <div className="animate-fade-in">
            <h2 className="card-title">1단계: 등록된 사건 상세 (인지 보고서)</h2>
            <div className="grid-2">
              <div className="inner-card">
                <p><strong>사건번호:</strong> {caseData.caseNumber}</p>
                <p><strong>관련자(대상자):</strong> {subject.name} ({subject.militaryId})</p>
                <p><strong>소속/직급:</strong> {subject.affiliation} / {subject.rank}</p>
              </div>
              <div className="inner-card">
                <p><strong>비위 유형:</strong> {caseData.violationType}</p>
                <p><strong>인지 경로:</strong> {caseData.intakeRoute}</p>
                <p><strong>발생 일자:</strong> {caseData.incidentDate}</p>
              </div>
            </div>
            <div className="inner-card" style={{ marginTop: '1rem' }}>
              <p><strong>비위사실 요지 및 인지 경위:</strong></p>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', fontFamily: 'inherit' }}>{caseData.summary}</pre>
            </div>
            {caseData.status === 'INTAKE' && (
              <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <button className="btn btn-primary" onClick={() => changeStatus('PRELIMINARY')}>2단계(조사 계획) 수립으로 전환</button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2 : 조사 계획 */}
        {activeTab === 1 && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>2단계: 조사 계획 수립 및 승인</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                인지 보고서의 혐의점을 기반으로 조사 범위와 일정을 편성하고 결재를 상신합니다.
              </span>
            </div>

            {/* 1단계 인지 기초 정보 연동 요약 카드 */}
            <div style={{
              background: '#1a1c24',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#60a5fa', fontWeight: 'bold', fontSize: '0.95rem' }}>
                <span>📋 1단계 인지 기초정보 연동 내역</span>
                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(59, 130, 246, 0.15)' }}>자동 참조</span>
              </div>
              <div className="grid-3" style={{ fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>사건번호:</span> <strong style={{ color: 'white' }}>{caseData.caseNumber}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>피조사자:</span> <strong style={{ color: 'white' }}>{subject.name}</strong> ({subject.rank} · {subject.affiliation})</div>
                <div><span style={{ color: 'var(--text-muted)' }}>비위유형:</span> <strong style={{ color: 'var(--warning)' }}>{caseData.violationType}</strong></div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>[인지 비위사실 요지 및 단초]</span>
                <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.5 }}>{caseData.summary}</p>
              </div>
            </div>

            <div className="grid-2">
              {/* 좌측: 조사 계획서 상세 작성 및 결재 */}
              <div className="inner-card">
                <h3 style={{ color: '#60a5fa', marginBottom: '1rem', fontSize: '1rem' }}>조사 계획서 작성 및 상급자 결재</h3>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>조사 목적 및 배경 *</label>
                  <input
                    placeholder="예: 비위 제보 사실관계 확인 및 규정 위반 여부 조사"
                    className="form-input"
                    value={planDraft.purpose || `${caseData.violationType} 혐의 관련 사실관계 규명`}
                    onChange={e => setPlanDraft({ ...planDraft, purpose: e.target.value })}
                  />
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>조사 대상 및 범위 *</label>
                  <input
                    placeholder="조사 대상자 및 관련자"
                    className="form-input"
                    value={planDraft.target || `${subject.name}(${subject.militaryId}) 및 관련 부서 업무 담당자`}
                    onChange={e => setPlanDraft({ ...planDraft, target: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>조사 예정 기간 *</label>
                    <input
                      placeholder="예: 2026-10-01 ~ 2026-10-25"
                      className="form-input"
                      value={planDraft.period || '2026-10-01 ~ 2026-10-25'}
                      onChange={e => setPlanDraft({ ...planDraft, period: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>조사관 편성 *</label>
                    <input
                      placeholder="주무/보조 조사관"
                      className="form-input"
                      value={planDraft.personnel || '주무: A01 감찰관, 보조: B02 조사관'}
                      onChange={e => setPlanDraft({ ...planDraft, personnel: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>중점 조사 착안 사항</label>
                  <input
                    placeholder="예: 업무 결재선 확인, 관련자 금융거래 추적, PC 자료 포렌식"
                    className="form-input"
                    value={planDraft.expected || '관련 공문 결재 이력 검토 및 제보자 진술 대조 확인'}
                    onChange={e => setPlanDraft({ ...planDraft, expected: e.target.value })}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn btn-outline" onClick={savePlan}>조사 계획서 상신</button>
                  {caseData.preliminaryPlan && !caseData.preliminaryPlan.approved && (
                    <button className="btn btn-primary" style={{ background: 'var(--success)' }} onClick={approvePlan}>
                      상급자 결재 승인 처리
                    </button>
                  )}
                </div>
                {caseData.preliminaryPlan?.approved && (
                  <p style={{ color: 'var(--success)', marginTop: '0.75rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    ✓ 조사 계획서 상급자 결재 승인 완료됨 (본조사 전환 가능)
                  </p>
                )}
              </div>

              {/* 우측: 기초 자료 수집 및 착수 일지 */}
              <div className="inner-card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>조사 착수 및 기초자료 수집 일지</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    placeholder="공문 열람, 참고인 사전 통화, 현장 확인 등 기록..."
                    className="form-input"
                    style={{ flex: 1, margin: 0 }}
                    value={newLog}
                    onChange={e => setNewLog(e.target.value)}
                  />
                  <button className="btn btn-outline" onClick={addPrelimLog}>등록</button>
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {caseData.preliminaryLogs?.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
                      등록된 기초자료 수집 기록이 없습니다.
                    </p>
                  ) : (
                    caseData.preliminaryLogs?.map(l => (
                      <div key={l.id} style={{ padding: '0.75rem', background: '#191b22', marginBottom: '0.5rem', borderRadius: '0.35rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.date}</span>
                        <p style={{ fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>{l.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {caseData.status === 'PRELIMINARY' && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={() => changeStatus('ARCHIVED', '(조사 종결)')}>조사 종결 (혐의없음/공람)</button>
                <button className="btn btn-outline" style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }} onClick={() => changeStatus('ARCHIVED', '(타 기관 이첩)')}>타 기관/수사기관 이첩</button>
                <button className="btn btn-primary" onClick={() => changeStatus('MAIN')} disabled={!caseData.preliminaryPlan?.approved}>
                  3단계(본조사) 전환 (계획 승인 필요)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3 */}
        {activeTab === 2 && (
          <div className="animate-fade-in">
            <h2 className="card-title">3단계: 본조사 (조서 작성 및 디지털 증거물)</h2>
            
            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              <div className="inner-card">
                <h3 style={{ marginBottom: '1rem' }}>출석 요구 캘린더 등록</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input type="text" placeholder="대상자명" className="form-input" style={{ margin: 0, width: '30%' }} value={summonsName} onChange={e=>setSummonsName(e.target.value)}/>
                  <input type="datetime-local" className="form-input" style={{ margin: 0, flex: 1 }} value={summonsDate} onChange={e=>setSummonsDate(e.target.value)}/>
                  <button className="btn btn-outline" onClick={addSummons}>등록</button>
                </div>
                {caseData.summons?.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                    <span>{s.personName} ({s.date.replace('T', ' ')})</span>
                    <span className="badge PRELIMINARY">
                      {s.status === 'SCHEDULED' ? '출석 예정' : s.status === 'ATTENDED' ? '출석 완료' : '불출석'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="inner-card">
                <h3 style={{ marginBottom: '1rem' }}>문답서/진술조서 표준 에디터</h3>
                <textarea className="form-input" placeholder="문: 혐의를 인정하십니까?&#10;답: 아닙니다..." style={{ minHeight: '100px', margin: 0, marginBottom: '0.5rem' }} value={qnaText} onChange={e=>setQnaText(e.target.value)}></textarea>
                <button className="btn btn-outline" onClick={addInterrogation}>조서 저장 및 시간 로그 기록</button>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  저장된 조서: {caseData.interrogations?.length || 0}건
                </div>
              </div>
            </div>

            <div className="inner-card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Key size={18} color="var(--success)"/> 디지털 증거물 (Evidence Room) 관리</h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input placeholder="증거명/요지" className="form-input" style={{ margin: 0, flex: 2 }} value={evName} onChange={e=>setEvName(e.target.value)}/>
                <select className="form-input" style={{ margin: 0, flex: 1 }} value={evType} onChange={e=>setEvType(e.target.value)}><option>문서</option><option>사진/영상</option><option>포렌식 데이터</option><option>실물(압수)</option></select>
                <input placeholder="제출/압수자" className="form-input" style={{ margin: 0, flex: 1 }} value={evSubmitter} onChange={e=>setEvSubmitter(e.target.value)}/>
                <button className="btn btn-primary" onClick={addEvidence}><Upload size={16}/> 등록</button>
              </div>
              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead><tr><th>고유번호</th><th>유형</th><th>증거요지</th><th>제출자</th><th>해시값(SHA-256)</th></tr></thead>
                <tbody>
                  {caseData.evidence?.map(e => (
                    <tr key={e.id}>
                      <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{e.evNumber}</td>
                      <td>{e.type}</td><td>{e.summary}</td><td>{e.submitter}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--success)' }}>{e.hash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {caseData.status === 'MAIN' && (
              <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <button className="btn btn-primary" onClick={() => changeStatus('DISPOSITION')}>4단계(결과보고/심의)로 전환</button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4 */}
        {activeTab === 3 && (
          <div className="animate-fade-in">
            <h2 className="card-title">4단계: 조사결과 보고 및 처분 심의</h2>
            <div className="grid-2">
              <div className="inner-card">
                <h3 style={{ marginBottom: '1rem' }}>감찰결과보고서 파일 첨부</h3>
                <label style={{ display: 'block', cursor: 'pointer', border: '2px dashed var(--surface-border)', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', transition: 'border-color 0.2s' }}
                  onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; }}
                  onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--surface-border)'; }}
                  onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = 'var(--surface-border)'; const f = e.dataTransfer.files[0]; if(f) updateCase({ reportDraft: `[첨부됨] ${f.name}` }, `보고서 파일 첨부: ${f.name}`); }}
                >
                  <input type="file" accept=".hwp,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if(f) updateCase({ reportDraft: `[첨부됨] ${f.name}` }, `보고서 파일 첨부: ${f.name}`); }} />
                  <Upload size={32} style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>감찰결과보고서 파일 업로드</p>
                  <p style={{ fontSize: '0.8rem' }}>클릭하거나 파일을 드래그하여 첨부 (.hwp, .pdf, .doc)</p>
                </label>
                {caseData.reportDraft && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16,185,129,0.1)', borderRadius: '0.5rem', color: 'var(--success)', fontSize: '0.9rem' }}>
                    ✓ {caseData.reportDraft}
                  </div>
                )}
              </div>
              <div className="inner-card">
                <h3 style={{ marginBottom: '1rem' }}>처분심의위원회 관리 및 검토 의견</h3>
                <textarea className="form-input" placeholder="조사관 처분 의견 (관련 법규, 양정 기준 등)" style={{ minHeight: '100px', marginBottom: '1rem' }} value={caseData.investigatorOpinion || ''} onChange={e=>updateCase({investigatorOpinion: e.target.value}, '조사관 의견 갱신')} />
                
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>심의위원회 최종 의결 사항 등록</h4>
                <input placeholder="개최 일자 (예: 2026-10-15)" className="form-input" value={caseData.committee?.date || ''} onChange={e=>updateCase({committee: {...(caseData.committee as any), date: e.target.value}}, '위원회 개최 일자 등록')}/>
                <input placeholder="참석 위원" className="form-input" value={caseData.committee?.attendees || ''} onChange={e=>updateCase({committee: {...(caseData.committee as any), attendees: e.target.value}}, '위원회 참석자 등록')}/>
                <textarea className="form-input" placeholder="의결 요지 및 최종 결정" value={caseData.committee?.decision || ''} onChange={e=>updateCase({committee: {...(caseData.committee as any), decision: e.target.value}}, '위원회 의결사항 등록')}/>
              </div>
            </div>
            {caseData.status === 'DISPOSITION' && (
              <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <button className="btn btn-primary" onClick={() => setActiveTab(4)}>5단계(처분결과)로 이동</button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5 */}
        {activeTab === 4 && (
          <div className="animate-fade-in">
            <h2 className="card-title">5단계: 처분결과</h2>
            <div className="grid-2">
              <div className="inner-card">
                <h3 style={{ marginBottom: '1rem' }}>최종 처분 입력</h3>
                <select className="form-input" value={caseData.finalDisposition || ''} onChange={e=>updateCase({finalDisposition: e.target.value}, '최종 처분명 등록')}>
                  <option value="">선택 안됨</option><option>중징계(파면)</option><option>중징계(해임)</option><option>중징계(정직)</option><option>경징계(감봉)</option><option>경징계(견책)</option><option>경고/주의</option>
                </select>
                <input type="number" placeholder="징계 부가금 액수 (원)" className="form-input" value={caseData.penaltyAmount || ''} onChange={e=>updateCase({penaltyAmount: Number(e.target.value)}, '부가금 등록')}/>
                <input type="date" className="form-input" value={caseData.dispositionDate || ''} onChange={e=>updateCase({dispositionDate: e.target.value}, '처분 일자 등록')}/>
              </div>
              <div className="inner-card">
                <h3 style={{ marginBottom: '1rem' }}>재심의(이의신청) 트래킹</h3>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>처분 통보일 (기준일)</label>
                <input type="date" className="form-input" value={caseData.appealDeadline || ''} onChange={e=>updateCase({appealDeadline: e.target.value}, '이의신청 기준일 등록')}/>
                {caseData.appealDeadline && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                    이의신청 기한 D-Day 트래킹 중 (기준일로부터 30일)
                  </div>
                )}
                <button className="btn btn-outline" style={{ marginTop: '1rem', width: '100%' }}>처분요구서 및 통보서 양식 출력</button>
              </div>
            </div>
            
            {caseData.status !== 'ARCHIVED' && (
              <div style={{ marginTop: '2rem', textAlign: 'right', borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
                <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={() => changeStatus('ARCHIVED')}>
                  <Lock size={18} style={{ marginRight: '0.5rem' }}/> 5단계 처분 확정 및 사건 종결 처리
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`.inner-card { background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 0.75rem; } .form-input { width: 100%; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--surface-border); background: rgba(0,0,0,0.4); color: white; display: block; margin-bottom: 0.5rem; }`}</style>
    </div>
  );
}
