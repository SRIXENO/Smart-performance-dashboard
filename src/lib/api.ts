import axios from 'axios';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : '/api');

const normalizedApiBase = API_BASE_URL.replace(/\/+$/, '');
const apiOrigin = normalizedApiBase.endsWith('/api')
  ? normalizedApiBase.slice(0, -4)
  : normalizedApiBase;
const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 15000);
const LOGIN_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_LOGIN_TIMEOUT_MS || 12000);
const LOGIN_RETRY_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_LOGIN_RETRY_TIMEOUT_MS || 18000);
const LOGIN_RETRY_DELAY_MS = Number(process.env.NEXT_PUBLIC_LOGIN_RETRY_DELAY_MS || 1200);
const LOGIN_MAX_RETRIES = Number(process.env.NEXT_PUBLIC_LOGIN_MAX_RETRIES || 1);
const STUDENT_CREATE_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_STUDENT_CREATE_TIMEOUT_MS || 45000);
const AUTH_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_AUTH_TIMEOUT_MS || 8000);
const WARMUP_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_WARMUP_TIMEOUT_MS || 6000);

export const GOOGLE_AUTH_URL =
  normalizedApiBase === '/api' ? '/api/auth/google' : `${apiOrigin}/api/auth/google`;

const api = axios.create({
  baseURL: normalizedApiBase,
  timeout: Number.isFinite(API_TIMEOUT_MS) ? API_TIMEOUT_MS : 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

const isTimeoutError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === 'ECONNABORTED' || message.includes('timeout');
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toPositiveNumber = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const isServiceStartingError = (error: any) => {
  const status = Number(error?.response?.status || 0);
  const message = String(error?.response?.data?.error || '').toLowerCase();
  return status === 503 || message.includes('service is starting') || message.includes('waking up');
};

const withTimeoutRetry = async <T>(fn: () => Promise<T>, retries = 1): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && isTimeoutError(error)) {
      await sleep(600);
      return withTimeoutRetry(fn, retries - 1);
    }
    throw error;
  }
};

const warmupBackend = async () => {
  try {
    await api.get('/healthz', {
      timeout: toPositiveNumber(WARMUP_TIMEOUT_MS, 6000),
    });
    return true;
  } catch {
    return false;
  }
};

const loginWithRetry = async (data: any) => {
  const retries = Math.max(0, Math.min(3, Math.floor(Number.isFinite(LOGIN_MAX_RETRIES) ? LOGIN_MAX_RETRIES : 1)));
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await api.post('/auth/login', data, {
        timeout: attempt === 0
          ? toPositiveNumber(LOGIN_TIMEOUT_MS, 12000)
          : toPositiveNumber(LOGIN_RETRY_TIMEOUT_MS, 18000),
      });
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < retries && (isTimeoutError(error) || isServiceStartingError(error));
      if (!shouldRetry) throw error;

      await warmupBackend();
      await sleep(toPositiveNumber(LOGIN_RETRY_DELAY_MS, 1200));
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Login request failed after retries.');
};

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => loginWithRetry(data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me', { timeout: Number.isFinite(AUTH_TIMEOUT_MS) ? AUTH_TIMEOUT_MS : 8000 }),
};

export const systemAPI = {
  warmup: () => warmupBackend(),
};

export const approvalsAPI = {
  getPending: () => api.get('/auth/approvals/pending'),
  updateDecision: (id: string, decision: 'approved' | 'rejected') =>
    api.put(`/auth/approvals/${id}`, { decision }),
};

export const viewersAPI = {
  getAll: () => api.get('/auth/viewers'),
  updateStatus: (id: string, status: 'active' | 'blocked') =>
    api.patch(`/auth/viewers/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/auth/viewers/${id}`),
};

export const studentsAPI = {
  getAll: (params?: any) => withTimeoutRetry(() => api.get('/students', { params }), 1),
  getById: (id: string) => api.get(`/students/${id}`),
  getProfile: (id: string) => api.get(`/students/${id}/profile`),
  getSubjects: (id: string) => api.get(`/students/${id}/subjects`),
  getAnalytics: (id: string) => api.get(`/students/${id}/analytics`),
  create: (data: any) =>
    api.post('/students', data, {
      timeout: Number.isFinite(STUDENT_CREATE_TIMEOUT_MS) ? STUDENT_CREATE_TIMEOUT_MS : 45000,
    }),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
};

export const dashboardAPI = {
  getAnalytics: () => api.get('/dashboard/analytics'),
  getMetrics: () => api.get('/dashboard/metrics'),
  getSummary: (params?: any) => api.get('/dashboard/summary', { params }),
  getAttendanceTrend: () => api.get('/dashboard/attendance-trend'),
  getGradeDistribution: () => api.get('/dashboard/grade-distribution'),
  getSubjectPerformance: () => api.get('/dashboard/subject-performance'),
  getAtRiskStudents: (params?: any) => api.get('/dashboard/at-risk-students', { params }),
  getDepartmentComparison: () => api.get('/dashboard/department-comparison'),
  getSemesterDistribution: () => api.get('/dashboard/semester-distribution'),
  getAttendanceHeatmap: () => api.get('/dashboard/attendance-heatmap'),
  getCGPADistribution: () => api.get('/dashboard/cgpa-distribution'),
  getPerformanceGrowth: () => api.get('/dashboard/performance-growth'),
  getDifficultSubjects: (params?: any) => api.get('/dashboard/difficult-subjects', { params }),
  getAttendancePerformanceCorrelation: () => api.get('/dashboard/attendance-performance-correlation'),
  getRecentStudents: (params?: any) => api.get('/dashboard/recent-students', { params }),
};

export const academicAPI = {
  getAcademicRecord: (studentId: string) => api.get(`/academic/student/${studentId}`),
  updateSemesterData: (studentId: string, data: any) => api.post(`/academic/student/${studentId}/semester`, data),
  completeSemester: (studentId: string, data: any) => api.put(`/academic/student/${studentId}/semester/complete`, data),
  getYearWiseSGPA: (studentId: string) => api.get(`/academic/student/${studentId}/year-wise`),
  getCGPATrend: (studentId: string) => api.get(`/academic/student/${studentId}/cgpa-trend`),
  getSubjectWiseGrades: (studentId: string, params?: any) => api.get(`/academic/student/${studentId}/subjects`, { params }),
  getDepartmentRankings: (department: string) => api.get(`/academic/rankings/department/${department}`),
  getTopPerformers: (params?: any) => api.get('/academic/top-performers', { params }),
  getGradeStatistics: (params?: any) => api.get('/academic/statistics', { params }),
};

export const aiAnalyticsAPI = {
  getStudentAnalytics: (studentId: string) => api.get(`/ai-analytics/student/${studentId}`),
  batchAnalyzeStudents: (params?: any) => api.post('/ai-analytics/batch-analyze', {}, { params }),
  getAtRiskStudentsAI: (params?: any) => api.get('/ai-analytics/at-risk', { params }),
  getDashboardInsights: () => api.get('/ai-analytics/dashboard-insights'),
};

export const activityAPI = {
  getStudentTimeline: (studentId: string, params?: any) => api.get(`/activities/student/${studentId}`, { params }),
  getRecentActivities: (params?: any) => api.get('/activities/recent', { params }),
  getByAction: (action: string, params?: any) => api.get(`/activities/by-action/${action}`, { params }),
  getLoginHistory: (params?: any) => api.get('/activities/login-history', { params }),
  clearLoginHistory: (from: string, to: string) => api.delete('/activities/login-history', { params: { from, to } }),
};

export const subjectsAPI = {
  assign: (data: any) => api.post('/subjects/assign', data),
  getAll: () => api.get('/subjects'),
  getByDeptYear: (department: string, year: number, semester?: number) =>
    api.get(`/subjects/department/${department}/year/${year}`, { params: semester ? { semester } : undefined }),
  getStudentSubjects: (studentId: string) => api.get(`/subjects/student/${studentId}`),
  update: (id: string, data: any) => api.put(`/subjects/${id}`, data),
  delete: (id: string) => api.delete(`/subjects/${id}`),
};

export const facultyAPI = {
  getAll: (params?: any) => api.get('/faculty', { params }),
  create: (data: any) => api.post('/faculty', data),
  update: (id: string, data: any) => api.put(`/faculty/${id}`, data),
  delete: (id: string) => api.delete(`/faculty/${id}`),
};

export const performanceAPI = {
  getAll: (params?: any) => api.get('/performance', { params }),
  getMissingSummary: (params?: any) => api.get('/performance/missing-summary', { params }),
  bootstrapMissing: (data: any) => api.post('/performance/bootstrap-missing', data),
  create: (data: any) => api.post('/performance', data),
  update: (id: string, data: any) => api.put(`/performance/${id}`, data),
  delete: (id: string) => api.delete(`/performance/${id}`),
};

export default api;
