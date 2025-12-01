/**
 * Application Constants
 * Centralized location for all magic numbers and configuration values
 */

export const TIMING = {
  // Animation delays (ms)
  CONFETTI_DURATION: 100,
  TOAST_AUTO_DISMISS: 5000,
  SKELETON_MIN_DISPLAY: 500,
  
  // Update intervals (ms)
  TIME_UPDATE_INTERVAL: 60 * 1000, // 1 minute
  DATA_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Animation delays for staggered effects (ms)
  ANIMATION_DELAY_STEP: 50,
  ANIMATION_DELAY_BASE: 350,
} as const;

export const UI_LIMITS = {
  // Display limits
  MAX_VISIBLE_TASKS: 3,
  MAX_VISIBLE_ANNOUNCEMENTS: 3,
  MAX_TOAST_COUNT: 5,
  
  // Text lengths
  MAX_USERNAME_LENGTH: 50,
  MIN_USERNAME_LENGTH: 3,
  MAX_PASSWORD_LENGTH: 100,
  MIN_PASSWORD_LENGTH: 6,
  
  // Widget dimensions
  PROFILE_AVATAR_SIZE: 20, // w-20 h-20 (80px)
  STAT_CARD_ICON_SIZE: 24,
} as const;

export const COLORS = {
  // Priority colors
  PRIORITY_HIGH: 'from-red-500 to-pink-600',
  PRIORITY_MEDIUM: 'from-amber-500 to-orange-600',
  PRIORITY_LOW: 'from-blue-500 to-cyan-600',
  
  // Performance thresholds
  PERFORMANCE_EXCELLENT: 80,
  PERFORMANCE_GOOD: 60,
} as const;

export const API_CONFIG = {
  // Timeout values (ms)
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Auth
  TOKEN_EXPIRATION_MINUTES: 30,
} as const;

export const MESSAGES = {
  // Success messages
  LOGIN_SUCCESS: 'Giriş başarılı!',
  LOGOUT_SUCCESS: 'Başarıyla çıkış yapıldı',
  TASK_COMPLETED: 'Görev tamamlandı!',
  DASHBOARD_LOADED: 'Kontrol paneli başarıyla yüklendi! 🎉',
  
  // Error messages
  LOGIN_FAILED: 'Giriş başarısız',
  NETWORK_ERROR: 'Sunucuya bağlanılamadı',
  UNAUTHORIZED: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.',
  DATA_LOAD_ERROR: 'Veri yüklenirken hata oluştu',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
} as const;

// Export all for easy import
export default {
  TIMING,
  UI_LIMITS,
  COLORS,
  API_CONFIG,
  MESSAGES,
  ROUTES,
};

