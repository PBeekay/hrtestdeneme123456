/**
 * Centralized API Service
 * Handles all API calls with authentication
 */

import config from '../config/env';

// API Configuration
const API_BASE_URL = config.apiUrl;

/**
 * Decode JWT token to get user_id
 */
const getUserIdFromToken = (): number | null => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    // JWT format: header.payload.signature
    const payload = token.split('.')[1];
    if (!payload) return null;

    // Decode base64 (handle URL-safe base64)
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

    // Backend includes user_id in token payload
    if (decoded.user_id) {
      return typeof decoded.user_id === 'number' ? decoded.user_id : parseInt(decoded.user_id);
    }

    return null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Fetch with automatic authentication
 */
export const fetchWithAuth = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('authToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
      return { status: 401, error: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.' };
    }

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        error: data.detail || data.message || 'Bir hata oluştu'
      };
    }

    return { status: response.status, data };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        status: 0,
        error: 'Sunucuya bağlanılamadı. Backend çalışıyor mu kontrol edin.'
      };
    }
    return {
      status: 0,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
};

/**
 * API Methods
 */
export const api = {
  // Authentication
  login: async (username: string, password: string) => {
    return fetchWithAuth<{ token: string; message: string; user_role: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout: async () => {
    const token = localStorage.getItem('authToken');
    return fetchWithAuth('/api/logout', {
      method: 'POST',
      body: JSON.stringify({ token: token || '' })
    });
  },

  // Dashboard
  getDashboard: async () => {
    return fetchWithAuth<any>('/api/dashboard');
  },

  // Tasks
  updateTaskStatus: async (taskId: number, status: 'pending' | 'completed' | 'cancelled') => {
    return fetchWithAuth(`/api/tasks/${taskId}/status?status=${status}`, { method: 'PUT' });
  },

  // Leave Requests
  createLeaveRequest: async (data: any) => {
    const userId = getUserIdFromToken();
    if (!userId) {
      return { status: 401, error: 'Kullanıcı kimliği bulunamadı' };
    }
    return fetchWithAuth(`/api/leave-requests?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getLeaveRequests: async (userId?: number, status?: string) => {
    let queryArgs: string[] = [];

    if (userId) {
      queryArgs.push(`user_id=${userId}`);
    }
    if (status) {
      queryArgs.push(`status=${status}`);
    }

    const queryString = queryArgs.length > 0 ? `?${queryArgs.join('&')}` : '';
    return fetchWithAuth(`/api/leave-requests${queryString}`);
  },

  updateLeaveRequest: async (requestId: number, approved: boolean, reason?: string) => {
    const adminId = getUserIdFromToken();
    if (!adminId) {
      return { status: 401, error: 'Kullanıcı kimliği bulunamadı' };
    }
    let query = `?admin_id=${adminId}&approved=${approved}`;
    if (reason) {
      query += `&reason=${encodeURIComponent(reason)}`;
    }
    return fetchWithAuth(`/api/leave-requests/${requestId}/approve${query}`, {
      method: 'PUT',
    });
  },

  // Widgets
  getUserWidgets: async () => {
    const userId = getUserIdFromToken();
    if (!userId) {
      return { status: 401, error: 'Kullanıcı kimliği bulunamadı' };
    }
    return fetchWithAuth(`/api/widgets?user_id=${userId}`);
  },

  updateUserWidgets: async (widgets: any) => {
    const userId = getUserIdFromToken();
    if (!userId) {
      return { status: 401, error: 'Kullanıcı kimliği bulunamadı' };
    }
    return fetchWithAuth(`/api/widgets?user_id=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(widgets),
    });
  },

  // Assets (Zimmet)
  getMyAssets: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return fetchWithAuth<any>(`/api/assets/my${query}`);
  },

  getAllAssets: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return fetchWithAuth<any>(`/api/assets/all${query}`);
  },

  getAssetCategories: async () => {
    return fetchWithAuth<any>('/api/assets/categories');
  },

  createAsset: async (data: any) => {
    return fetchWithAuth('/api/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAsset: async (assetId: number, data: any) => {
    return fetchWithAuth(`/api/assets/${assetId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  returnAsset: async (assetId: number) => {
    return fetchWithAuth(`/api/assets/${assetId}/return`, {
      method: 'POST',
    });
  },

  deleteAsset: async (assetId: number) => {
    return fetchWithAuth(`/api/assets/${assetId}`, {
      method: 'DELETE',
    });
  },

  // Employees
  getEmployeeStats: async () => {
    return fetchWithAuth('/api/employees/stats');
  },

  getEmployees: async () => {
    return fetchWithAuth('/api/employees');
  },



  getReminders: async () => {
    return fetchWithAuth('/api/reminders');
  },

  uploadEmployeeDocument: async (
    employeeId: number,
    payload: { title: string; type: string }
  ) => {
    return fetchWithAuth(`/api/employees/${employeeId}/documents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateEmployeeDocument: async (
    employeeId: number,
    documentId: number,
    payload: { title: string; type: string }
  ) => {
    return fetchWithAuth(`/api/employees/${employeeId}/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteEmployeeDocument: async (employeeId: number, documentId: number) => {
    return fetchWithAuth(`/api/employees/${employeeId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  },

  updateEmployee: async (employeeId: number, payload: any) => {
    return fetchWithAuth(`/api/employees/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteEmployee: async (employeeId: number, deactivateOnly: boolean = true) => {
    return fetchWithAuth(`/api/employees/${employeeId}?deactivate_only=${deactivateOnly}`, {
      method: 'DELETE',
    });
  },

  approveDocument: async (employeeId: number, documentId: number, approved: boolean, rejectionReason?: string) => {
    return fetchWithAuth(`/api/employees/${employeeId}/documents/${documentId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approved, rejection_reason: rejectionReason }),
    });
  },

  // User Management
  getUsers: async () => {
    return fetchWithAuth('/api/users');
  },

  createAdmin: async (payload: { username: string; email: string; password: string; full_name: string; department?: string }) => {
    return fetchWithAuth('/api/users/admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateUserRole: async (userId: number, userRole: string) => {
    return fetchWithAuth(`/api/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ user_role: userRole }),
    });
  },

  resetUserPassword: async (userId: number, newPassword: string) => {
    return fetchWithAuth(`/api/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password: newPassword }),
    });
  },

  // Departments
  getDepartments: async () => {
    return fetchWithAuth('/api/departments');
  },

  // Settings
  getSettings: async () => {
    return fetchWithAuth('/api/settings');
  },

  updateSettings: async (settings: any) => {
    return fetchWithAuth('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  createEmployee: async (payload: any) => {
    return fetchWithAuth('/api/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Announcements
  createAnnouncement: async (payload: { title: string; content: string; category: string; announcement_date: string }) => {
    return fetchWithAuth('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export default api;

