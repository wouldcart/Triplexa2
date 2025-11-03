
export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  staffCount: number;
  features: DepartmentFeature[];
  workflow: WorkflowConfig;
  permissions: Permission[];
}

export interface DepartmentFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface WorkflowConfig {
  stages: WorkflowStage[];
  autoAssignment: boolean;
  escalationRules: EscalationRule[];
}

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  order: number;
  requiredActions: string[];
  timeLimit?: number;
}

export interface EscalationRule {
  id: string;
  condition: string;
  action: string;
  target: string;
  timeThreshold: number;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  actions: string[];
}

export interface EnhancedStaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  position?: string;
  status: 'active' | 'inactive' | 'on-leave';
  avatar?: string;
  joinDate: string;
  // Optional timestamps from DB
  createdAt?: string;
  updatedAt?: string;
  // Optional profile image stored in staff table
  profileImage?: string;
  dateOfBirth?: string; // Added date of birth field
  skills: string[];
  certifications: string[];
  performance: PerformanceMetrics;
  targets: Target[];
  permissions: string[];
  workingHours: WorkingHours;
  reportingManager?: string;
  teamMembers?: string[];
  // Updated employee ID to be required
  employeeId: string;
  // New operational countries field
  operationalCountries: string[];
  // HR-specific fields
  salaryStructure?: SalaryStructure;
  leaveBalance?: LeaveBalance;
  attendanceRecord?: AttendanceRecord;
}

// HR-specific types
export interface SalaryStructure {
  id: string;
  employeeId: string;
  basicSalary: number;
  allowances: SalaryComponent[];
  deductions: SalaryComponent[];
  variablePay: SalaryComponent[];
  currency: string;
  effectiveDate: string;
  lastUpdated: string;
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

export interface SalaryComponent {
  id: string;
  name: string;
  type: 'allowance' | 'deduction' | 'variable';
  amount: number;
  isPercentage: boolean;
  isFixed: boolean;
  description?: string;
  taxable: boolean;
}

export interface LeaveBalance {
  employeeId: string;
  annualLeave: number;
  sickLeave: number;
  casualLeave: number;
  maternityPaternityLeave: number;
  compensatoryOff: number;
  year: number;
  lastUpdated: string;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'emergency' | 'comp-off';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  documents?: string[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours: number;
  overtime: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
  breaks: BreakRecord[];
  location?: string;
  notes?: string;
}

export interface BreakRecord {
  startTime: string;
  endTime: string;
  duration: number;
  type: 'lunch' | 'tea' | 'other';
}

export interface PayrollRun {
  id: string;
  period: string; // MM-YYYY
  status: 'draft' | 'processing' | 'approved' | 'paid' | 'cancelled';
  employeesCount: number;
  totalAmount: number;
  createdBy: string;
  createdDate: string;
  approvalWorkflow: ApprovalStep[];
  paymentDate?: string;
  currency: string;
}

export interface ApprovalStep {
  level: number;
  approverRole: string;
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvedDate?: string;
}

export interface PayrollEntry {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  basicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalVariablePay: number;
  grossSalary: number;
  netSalary: number;
  overtimePay: number;
  taxDeductions: number;
  pfDeduction: number;
  esiDeduction: number;
  loanDeductions: number;
  advanceDeductions: number;
  componentBreakdown: PayrollComponent[];
}

export interface PayrollComponent {
  componentId: string;
  componentName: string;
  type: 'allowance' | 'deduction' | 'variable';
  amount: number;
  taxable: boolean;
}

export interface HRAnalytics {
  totalEmployees: number;
  activeEmployees: number;
  departmentWiseCount: { [department: string]: number };
  averageSalary: number;
  totalPayrollCost: number;
  leaveUtilization: number;
  attendanceRate: number;
  pendingLeaves: number;
  pendingPayrollApprovals: number;
  upcomingBirthdays: StaffBirthday[];
  complianceAlerts: ComplianceAlert[];
}

export interface StaffBirthday {
  employeeId: string;
  name: string;
  department: string;
  date: string;
  daysUntil: number;
}

export interface ComplianceAlert {
  id: string;
  type: 'tax_filing' | 'pf_return' | 'esi_return' | 'bonus_payment' | 'increment_due';
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  department?: string;
}

export interface PerformanceMetrics {
  daily: DailyMetrics;
  monthly: MonthlyMetrics;
  quarterly: QuarterlyMetrics;
  overall: OverallMetrics;
}

export interface DailyMetrics {
  date: string;
  tasksCompleted: number;
  responseTime: number;
  customerSatisfaction: number;
  revenue?: number;
  enquiriesHandled?: number;
  conversions?: number;
}

export interface MonthlyMetrics {
  month: string;
  totalTasks: number;
  averageResponseTime: number;
  averageCustomerSatisfaction: number;
  totalRevenue?: number;
  totalEnquiries?: number;
  conversionRate?: number;
  targetAchievement: number;
}

export interface QuarterlyMetrics {
  quarter: string;
  performanceRating: number;
  goalsAchieved: number;
  totalGoals: number;
  growthPercentage: number;
}

export interface OverallMetrics {
  totalExperience: string;
  totalRevenue?: number;
  clientRetentionRate?: number;
  performanceScore: number;
  ranking: number;
  badges: string[];
}

export interface Target {
  id: string;
  name: string;
  type: 'revenue' | 'enquiries' | 'conversions' | 'response-time' | 'satisfaction';
  value: number;
  achieved: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'overdue';
}

export interface WorkingHours {
  monday: TimeSlot;
  tuesday: TimeSlot;
  wednesday: TimeSlot;
  thursday: TimeSlot;
  friday: TimeSlot;
  saturday: TimeSlot;
  sunday: TimeSlot;
}

export interface TimeSlot {
  isWorking: boolean;
  startTime?: string;
  endTime?: string;
  breakTime?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  attachments?: string[];
  comments: TaskComment[];
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export interface RealTimeUpdate {
  id: string;
  type: 'enquiry' | 'booking' | 'payment' | 'task' | 'performance' | 'leave' | 'payroll' | 'attendance';
  data: any;
  timestamp: string;
  department: string;
  staffId?: string;
}

// Staff verification documents
export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface StaffDocument {
  id: string;
  staffId: string;
  docType: string;
  fileName: string;
  fileExt?: string;
  mimeType?: string;
  sizeBytes?: number;
  storagePath: string; // path inside staff_docs bucket
  sha256?: string;
  status: DocumentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // UI helper
  signedUrl?: string;
}

// Staff bank account details (masked number on client)
export type BankVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface StaffBankAccount {
  id: string;
  staffId: string;
  bankName: string;
  accountHolderName: string;
  accountNumberLast4: string;
  country?: string;
  ifscOrSwift?: string;
  branch?: string;
  verifiedStatus: BankVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}
