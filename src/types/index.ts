export interface User {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
}

export interface Student {
  _id: string;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  currentSemester?: string;
  phone?: string;
  dateOfBirth: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  gender?: string;
  bloodGroup?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelation?: string;
  batch?: string;
  section?: string;
  rollNumber?: string;
  currentCGPA?: number;
  currentAttendance?: number;
  totalCreditsEarned?: number;
  profileImage?: string;
  bio?: string;
}

export interface DashboardSummary {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalStudentsChange: number;
  avgAttendance: number;
  avgAttendanceChange: number;
  avgPerformance: number;
  avgPerformanceChange: number;
  avgCGPA: number;
  lowPerformers: number;
  lowPerformersThreshold: string;
  passPercentage: number;
  failPercentage: number;
  excellentStudents: number;
  goodStudents: number;
  averageStudents: number;
  poorStudents: number;
  criticalRiskStudents: number;
  highRiskStudents: number;
  improvingStudents: number;
  decliningStudents: number;
}

export interface SubjectGrade {
  subjectId?: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  marks: number;
  grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F' | 'Ab';
  gradePoint: number;
  creditPoints: number;
}

export interface SemesterRecord {
  semester: string;
  year: number;
  subjects: SubjectGrade[];
  totalCredits: number;
  totalCreditPoints: number;
  sgpa: number;
  attendancePercentage?: number;
  status: 'in-progress' | 'completed' | 'failed';
  completedDate?: string;
}

export interface AcademicRecord {
  _id: string;
  studentId: string;
  semesters: SemesterRecord[];
  cgpa: number;
  totalCreditsEarned: number;
  totalCreditPointsEarned: number;
  currentSemester?: string;
  academicStatus: 'excellent' | 'good' | 'average' | 'poor' | 'probation';
  lastUpdated: string;
}

export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  value: number;
}

export interface Alert {
  type: 'attendance' | 'performance' | 'subject-failure' | 'probation-risk' | 'improvement';
  severity: 'info' | 'warning' | 'danger' | 'critical';
  message: string;
  actionRequired: boolean;
  createdAt: string;
  acknowledged: boolean;
}

export interface Suggestion {
  category: 'attendance' | 'study-habits' | 'subject-focus' | 'time-management' | 'counseling';
  priority: 'low' | 'medium' | 'high';
  suggestion: string;
  expectedImpact: string;
}

export interface SubjectAnalysis {
  subjectName: string;
  currentMarks: number;
  predictedMarks: number;
  difficulty: 'easy' | 'moderate' | 'difficult' | 'very-difficult';
  failureRisk: number;
  recommendedAction: string;
}

export interface PeerComparison {
  departmentRank: number;
  yearRank: number;
  percentile: number;
  aboveAverage: boolean;
}

export interface AIAnalytics {
  _id: string;
  studentId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  predictedCGPA: number;
  predictedNextSemesterSGPA: number;
  predictedFinalGrade: string;
  confidenceScore: number;
  attendanceTrend: 'improving' | 'stable' | 'declining' | 'critical';
  performanceTrend: 'improving' | 'stable' | 'declining' | 'critical';
  alerts: Alert[];
  suggestions: Suggestion[];
  subjectAnalysis: SubjectAnalysis[];
  peerComparison: PeerComparison;
  engagementScore: number;
  lastAnalyzed: string;
}

export interface ActivityLog {
  _id: string;
  userId?: string;
  userRole: 'admin' | 'faculty' | 'student' | 'system';
  userName?: string;
  action: string;
  targetType: 'student' | 'performance' | 'subject' | 'academic_record' | 'system';
  targetId?: string;
  targetName?: string;
  description: string;
  metadata?: any;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface DepartmentComparison {
  _id: string;
  avgCGPA: number;
  studentCount: number;
  maxCGPA: number;
  minCGPA: number;
}

export interface PerformanceGrowth {
  semester: string;
  year: number;
  sgpa: number;
  growthRate: number;
}