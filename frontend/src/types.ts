export interface UserInfo {
  name: string;
  role: string;
  department: string;
  email: string;
  avatar: string;
  userRole?: 'admin' | 'employee';
  startDate?: string | null;
}

export interface LeaveBalance {
  annual: number;
  sick: number;
  personal: number;
}

export interface Task {
  id: number;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
}

export interface PerformanceMetric {
  label: string;
  value: number;
  maxValue: number;
}

export interface Announcement {
  id: number;
  title: string;
  date: string;
  category: string;
  description?: string;
  author_name?: string;
}

export interface WorkDay {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

export interface LeaveRequest {
  id: number;
  leaveType: 'annual' | 'sick' | 'personal';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Widget {
  widgetType: string;
  position: number;
  isVisible: boolean;
  settings?: any;
}

export interface EmployeeDocument {
  id: number;
  title: string;
  type: 'contract' | 'performance' | 'discipline' | 'other';
  uploadedAt: string;
  status: 'approved' | 'pending' | 'rejected';
  uploadedBy: string;
  downloadUrl?: string;
}

export interface EmployeeProfile {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  phone?: string;
  avatar?: string;
  startDate: string;
  status: 'active' | 'on_leave' | 'terminated';
  manager?: string;
  location?: string;
  documents?: EmployeeDocument[];
}

export interface EmployeeStats {
  totalEmployees: number;
  onLeave: number;
  pendingDocuments: number;
  onboarding: number;
}

export interface DashboardData {
  userInfo: UserInfo;
  leaveBalance: LeaveBalance;
  pendingTasks: Task[];
  performance: PerformanceMetric[];
  announcements: Announcement[];
  workSchedule?: WorkDay[];
  leaveRequests?: LeaveRequest[];
  widgets?: Widget[];
  assets?: EmployeeAsset[];
  assetStatistics?: AssetStatistics;
  employeeStats?: EmployeeStats;
  employees?: EmployeeProfile[];
}

// Zimmet (Asset Assignment) Types
export interface AssetCategory {
  id: number;
  name: string;
  description?: string;
  icon: string;
  created_at: string;
}

export interface EmployeeAsset {
  id: number;
  assetName: string;
  categoryName: string;
  categoryIcon: string;
  serialNumber?: string;
  description?: string;
  assignedDate: string;
  returnDate?: string;
  documentUrl?: string;
  documentFilename?: string;
  status: 'active' | 'returned' | 'damaged' | 'lost';
  assignedByName: string;
  notes?: string;
}

export interface AllAssets extends EmployeeAsset {
  employeeId: number;
  employeeName: string;
}

export interface AssetStatistics {
  active_count: number;
  returned_count: number;
  damaged_count: number;
  lost_count: number;
  total_count: number;
  employee_count?: number;
}

export interface Reminder {
  id: number;
  title: string;
  date: string;
  type: 'probation' | 'birthday' | 'tax' | 'other';
  priority: 'high' | 'medium' | 'low';
}

export interface EmployeeNote {
  id: number;
  note: string;
  created_at: string;
  created_by_name?: string;
}
