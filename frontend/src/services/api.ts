/**
 * Centralized API Service
 * Handles all API calls with authentication
 */

import config from '../config/env';

// API Configuration
const API_BASE_URL = config.apiUrl;

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
    return fetchWithAuth('/api/logout', { method: 'POST' });
  },

  // Dashboard
  getDashboard: async () => {
    return fetchWithAuth<any>('/api/dashboard');
  },

  // Tasks
  completeTask: async (taskId: number) => {
    return fetchWithAuth(`/api/tasks/${taskId}/complete`, { method: 'POST' });
  },

  // Leave Requests
  createLeaveRequest: async (data: any) => {
    return fetchWithAuth('/api/leave-request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getLeaveRequests: async () => {
    return fetchWithAuth('/api/admin/leave-requests');
  },

  updateLeaveRequest: async (requestId: number, status: string) => {
    return fetchWithAuth(`/api/admin/leave-requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Widgets
  getUserWidgets: async () => {
    return fetchWithAuth('/api/user/widgets');
  },

  updateUserWidgets: async (widgets: any) => {
    return fetchWithAuth('/api/user/widgets', {
      method: 'POST',
      body: JSON.stringify({ widgets }),
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

  addEmployeeNote: async (employeeId: number, note: string) => {
    return fetchWithAuth(`/api/employees/${employeeId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
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

  createEmployee: async (payload: any) => {
    return fetchWithAuth('/api/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export default api;

