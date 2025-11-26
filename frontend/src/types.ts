export interface UserInfo {
  name: string;
  role: string;
  department: string;
  email: string;
  avatar: string;
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
}

export interface DashboardData {
  userInfo: UserInfo;
  leaveBalance: LeaveBalance;
  pendingTasks: Task[];
  performance: PerformanceMetric[];
  announcements: Announcement[];
}

