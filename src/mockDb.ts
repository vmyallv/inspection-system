export type CaseStatus = 'INTAKE' | 'PRELIMINARY' | 'MAIN' | 'REPORTING' | 'DISPOSITION' | 'ARCHIVED';

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  INTAKE: '1단계(등록된 사건)',
  PRELIMINARY: '2단계(조사 계획)',
  MAIN: '3단계(본조사)',
  REPORTING: '4단계(조사결과)',
  DISPOSITION: '5단계(처분심의)',
  ARCHIVED: '6단계(처분결과)',
};

export interface Subject {
  id: string;
  militaryId: string;
  name: string;
  affiliation: string;
  departmentGroup?: string; // 소속 기관/처/본부
  rank: string;
  type: 'PRIMARY' | 'REFERENCE'; // 주혐의자 vs 참고인
}

export interface PreventionActivityLog {
  id: string;
  subjectId: string;
  date: string;
  category: '청렴 면담·상담' | '청렴 모니터링' | '취약시기 예방점검' | '제보·단서 확인' | '제도개선 지도' | '기타';
  riskLevel: '정상' | '관심' | '주의' | '중점관리';
  inspector: string;
  content: string;
  followUpAction?: string;
}

export interface PrelimPlan {
  purpose: string;
  target: string;
  period: string;
  expected: string;
  personnel: string;
  approved: boolean;
}

export interface PrelimLog { id: string; date: string; content: string; }
export interface Summons { id: string; personName: string; date: string; noShowCount: number; status: 'SCHEDULED'|'ATTENDED'|'MISSED'; }
export interface Interrogation { id: string; type: string; date: string; attendees: string; content: string; }
export interface Evidence { id: string; evNumber: string; type: string; summary: string; submitter: string; date: string; hash: string; }
export interface SeizedItem { id: string; name: string; location: string; date: string; returned: boolean; }
export interface Committee { date: string; attendees: string; minutes: string; decision: string; }
export interface AuditLog { id: string; caseId: string; action: string; user: string; timestamp: string; }

export interface Case {
  id: string;
  caseNumber: string;
  intakeRoute: string;
  subjectId: string;
  relatedPersons?: string[];
  investigatorId: string;
  violationType: string;
  incidentDate: string;
  status: CaseStatus;
  summary: string;
  departmentCode: string;
  
  preliminaryPlan?: PrelimPlan;
  preliminaryLogs: PrelimLog[];
  
  summons: Summons[];
  interrogations: Interrogation[];
  evidence: Evidence[];
  seizedItems: SeizedItem[];
  
  reportDraft?: string;
  investigatorOpinion?: string;
  committee?: Committee;
  
  finalDisposition?: string;
  penaltyAmount?: number;
  dispositionDate?: string;
  appealDeadline?: string;
}

const initialSubjects: Subject[] = [
  { id: '1', militaryId: '2015-12345', name: '홍길동', affiliation: '인사과', departmentGroup: '인사처', rank: '대위', type: 'PRIMARY' },
  { id: '2', militaryId: '2008-54321', name: '김철수', affiliation: '작전과', departmentGroup: '작전사령부', rank: '중령', type: 'PRIMARY' },
  { id: '3', militaryId: '2012-98765', name: '박민수', affiliation: '군수과', departmentGroup: '군수사령부', rank: '소령', type: 'PRIMARY' },
  { id: '4', militaryId: '2018-11223', name: '이영희', affiliation: '정보과', departmentGroup: '정보사령부', rank: '대위', type: 'PRIMARY' },
  { id: '5', militaryId: '2019-33445', name: '정다은', affiliation: '감찰과', departmentGroup: '감찰본부', rank: '사무관(5급)', type: 'PRIMARY' },
  { id: '6', militaryId: '2010-77889', name: '최재혁', affiliation: '재정원', departmentGroup: '재정관리단', rank: '준위', type: 'PRIMARY' },
  { id: '7', militaryId: '2021-99881', name: '강호성', affiliation: '시설대', departmentGroup: '시설지원단', rank: '군무주사(6급)', type: 'PRIMARY' },
  { id: '8', militaryId: '2014-44556', name: '윤지훈', affiliation: '통신대', departmentGroup: '통신지원단', rank: '상사', type: 'PRIMARY' },
];

const initialCases: Case[] = [
  {
    id: '1', caseNumber: '2026-내부감찰-인사-001', intakeRoute: '내부감찰', departmentCode: '인사',
    subjectId: '1', relatedPersons: ['4'], investigatorId: 'A01', violationType: '직무태만 및 직무유기', incidentDate: '2026-09-01',
    status: 'INTAKE', summary: '민원 처리 고의 지연 및 인사 청탁 의혹에 따른 직무유기 혐의',
    preliminaryLogs: [], summons: [], interrogations: [], evidence: [], seizedItems: []
  },
  {
    id: '2', caseNumber: '2024-민원-인사-018', intakeRoute: '민원', departmentCode: '인사',
    subjectId: '1', investigatorId: 'A03', violationType: '품위유지 위반 (음주운전)', incidentDate: '2024-05-12',
    status: 'ARCHIVED', summary: '휴일 음주운전 단속 적발 및 보고 지연',
    finalDisposition: '경징계(견책)', dispositionDate: '2024-07-20',
    preliminaryLogs: [], summons: [], interrogations: [], evidence: [], seizedItems: []
  },
  {
    id: '3', caseNumber: '2026-외부이첩-작전-003', intakeRoute: '외부이첩', departmentCode: '작전',
    subjectId: '2', relatedPersons: ['8'], investigatorId: 'A02', violationType: '직권남용', incidentDate: '2026-08-15',
    status: 'MAIN', summary: '하급자에 대한 사적 노무 동원 및 훈련 평가 부당 개입',
    preliminaryLogs: [], summons: [], interrogations: [], evidence: [], seizedItems: []
  },
  {
    id: '4', caseNumber: '2023-내부감찰-작전-007', intakeRoute: '내부감찰', departmentCode: '작전',
    subjectId: '2', investigatorId: 'A01', violationType: '비밀엄수 위반', incidentDate: '2023-11-04',
    status: 'ARCHIVED', summary: '작전 회의 비공개 자료 외부 유출 의혹',
    finalDisposition: '경고/주의', dispositionDate: '2023-12-28',
    preliminaryLogs: [], summons: [], interrogations: [], evidence: [], seizedItems: []
  },
  {
    id: '5', caseNumber: '2026-진정-군수-005', intakeRoute: '진정', departmentCode: '군수',
    subjectId: '3', relatedPersons: ['7'], investigatorId: 'A04', violationType: '청렴의무 위반 (금품·향응 수수 등)', incidentDate: '2026-09-10',
    status: 'PRELIMINARY', summary: '물품 납품 업체로부터 부적절한 식사 및 명절 선물 수수 의혹 제보',
    preliminaryLogs: [], summons: [], interrogations: [], evidence: [], seizedItems: []
  },
  {
    id: '6', caseNumber: '2026-내부감찰-재정-009', intakeRoute: '내부감찰', departmentCode: '재정',
    subjectId: '6', investigatorId: 'A02', violationType: '공금 횡령 및 회계 부정', incidentDate: '2026-07-20',
    status: 'DISPOSITION', summary: '부서 운영비 및 특수활동비 허위 영수증 처리 정황 포착',
    preliminaryLogs: [], summons: [], interrogations: [], evidence: [], seizedItems: []
  },
  {
    id: '7', caseNumber: '2025-외부이첩-시설-022', intakeRoute: '외부이첩', departmentCode: '시설',
    subjectId: '7', relatedPersons: ['3'], investigatorId: 'A03', violationType: '영리업무 및 겸직 금지 위반', incidentDate: '2025-08-30',
    status: 'ARCHIVED', summary: '가족 명의 건설하도급 업체 실질 경영 및 관급공사 수주 의혹',
    finalDisposition: '중징계(정직 3월)', dispositionDate: '2025-11-15',
    preliminaryLogs: [], summons: [], interrogations: [], evidence: [], seizedItems: []
  },
];

const initialPreventionLogs: PreventionActivityLog[] = [
  {
    id: 'act-1',
    subjectId: '1',
    date: '2026-09-10',
    category: '청렴 면담·상담',
    riskLevel: '관심',
    inspector: '김감찰관',
    content: '인사 부서 갈등 및 민원 지연 관련 1차 고충 면담 진행. 업무 과중 및 부서 내 소통 애로사항 청취.',
    followUpAction: '2주 후 업무 개선 상태 재확인 면담 예정'
  },
  {
    id: 'act-2',
    subjectId: '1',
    date: '2026-09-22',
    category: '제보·단서 확인',
    riskLevel: '주의',
    inspector: '이조사관',
    content: '최근 외부 청탁성 연락 관련 사실관계 확인 면담 진행. 부서장과의 면담 시 업무 분장 재조정 권고.',
    followUpAction: '부서장에게 직무 배제 권고 및 필요시 조사 계획 수립 검토'
  },
  {
    id: 'act-3',
    subjectId: '2',
    date: '2026-08-20',
    category: '제보·단서 확인',
    riskLevel: '중점관리',
    inspector: '박감찰관',
    content: '부대 내 하급자들에 대한 부당 업무 지시 및 폭언 관련 제보 접수 및 초기 사실관계 확인.',
    followUpAction: '본조사 연계 및 피해자 긴급 보호 조치'
  },
  {
    id: 'act-4',
    subjectId: '3',
    date: '2026-09-05',
    category: '취약시기 예방점검',
    riskLevel: '주의',
    inspector: '김감찰관',
    content: '추석 명절 전후 군수 납품 업체 관계자와의 사적 접촉 예방을 위한 불시 청렴 점검 실시.',
    followUpAction: '업체 대표 유선 통화 내역 및 입출금 의심 정황 추가 파악'
  },
  {
    id: 'act-5',
    subjectId: '6',
    date: '2026-07-28',
    category: '청렴 모니터링',
    riskLevel: '중점관리',
    inspector: '최감찰관',
    content: '회계 결산 과정에서 특정 항목 증빙 누락 지속. 담당자 소명 불명확하며 결재 우회 정황 확인.',
    followUpAction: '재정 장부 압수 및 정밀 감사 개시'
  },
  {
    id: 'act-6',
    subjectId: '7',
    date: '2026-06-15',
    category: '제도개선 지도',
    riskLevel: '관심',
    inspector: '정조사관',
    content: '시설 공사 입찰 업체 관계자와의 유착 방지를 위한 직무윤리 지도 및 공사 현장 불시 실사 진행.',
    followUpAction: '입찰 과정 적격성 사후 검증 지속'
  },
  {
    id: 'act-7',
    subjectId: '4',
    date: '2026-09-18',
    category: '청렴 모니터링',
    riskLevel: '정상',
    inspector: '이조사관',
    content: '분기별 보안 및 청렴 서약 준수 상태 점검. 부서 내 보안 규정 준수 양호하며 특이사항 없음.',
    followUpAction: '정기 점검 유지'
  }
];

export const loadDb = () => {
  const version = localStorage.getItem('dbVersion');
  if (version !== 'v5') {
    localStorage.clear();
    localStorage.setItem('dbVersion', 'v5');
    localStorage.setItem('subjects', JSON.stringify(initialSubjects));
    localStorage.setItem('cases', JSON.stringify(initialCases));
    localStorage.setItem('preventionLogs', JSON.stringify(initialPreventionLogs));
    localStorage.setItem('auditLogs', JSON.stringify([]));
  }
  return {
    subjects: JSON.parse(localStorage.getItem('subjects') || '[]') as Subject[],
    cases: JSON.parse(localStorage.getItem('cases') || '[]') as Case[],
    preventionLogs: JSON.parse(localStorage.getItem('preventionLogs') || '[]') as PreventionActivityLog[],
    auditLogs: JSON.parse(localStorage.getItem('auditLogs') || '[]') as AuditLog[],
  }
};

export const saveCases = (cases: Case[]) => localStorage.setItem('cases', JSON.stringify(cases));
export const saveSubjects = (subjects: Subject[]) => localStorage.setItem('subjects', JSON.stringify(subjects));
export const savePreventionLogs = (logs: PreventionActivityLog[]) => localStorage.setItem('preventionLogs', JSON.stringify(logs));
export const saveAuditLogs = (logs: AuditLog[]) => localStorage.setItem('auditLogs', JSON.stringify(logs));

export const addPreventionLog = (log: Omit<PreventionActivityLog, 'id'>) => {
  const db = loadDb();
  const newLog: PreventionActivityLog = {
    id: 'act-' + Date.now().toString(),
    ...log
  };
  savePreventionLogs([newLog, ...db.preventionLogs]);
  return newLog;
};

export const addAuditLog = (caseId: string, action: string) => {
  const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
  const newLog: AuditLog = {
    id: Date.now().toString(),
    caseId, action, user: 'A01(접속자)', timestamp: new Date().toISOString()
  };
  saveAuditLogs([...logs, newLog]);
};

export const addCaseAndSubject = (primarySubject: Omit<Subject, 'id'>, references: Omit<Subject, 'id'>[], caseData: Omit<Case, 'id'|'subjectId'|'status'|'preliminaryLogs'|'summons'|'interrogations'|'evidence'|'seizedItems'>) => {
  const db = loadDb();
  
  const newPrimary: Subject = { id: Date.now().toString() + '-p', ...primarySubject };
  const newRefs = references.map((r, i) => ({ id: Date.now().toString() + `-r${i}`, ...r }));
  
  const newCase: Case = { 
    id: Date.now().toString() + '-case', 
    subjectId: newPrimary.id, 
    status: 'INTAKE',
    preliminaryLogs: [], summons: [], interrogations: [], evidence: [], seizedItems: [],
    ...caseData 
  };

  saveSubjects([...db.subjects, newPrimary, ...newRefs]);
  saveCases([...db.cases, newCase]);
  addAuditLog(newCase.id, '사건 최초 인지 및 등록 완료');
  return newCase;
};
