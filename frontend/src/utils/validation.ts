/**
 * Form validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate username
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Kullanıcı adı gereklidir' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır' };
  }

  if (username.length > 50) {
    return { isValid: false, error: 'Kullanıcı adı maksimum 50 karakter olabilir' };
  }

  // Only alphanumeric and underscore
  const validUsernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!validUsernameRegex.test(username)) {
    return { isValid: false, error: 'Kullanıcı adı sadece harf, rakam ve _ içerebilir' };
  }

  return { isValid: true };
};

/**
 * Validate password
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Şifre gereklidir' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Şifre en az 6 karakter olmalıdır' };
  }

  if (password.length > 100) {
    return { isValid: false, error: 'Şifre çok uzun' };
  }

  return { isValid: true };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'E-posta adresi gereklidir' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Geçersiz e-posta formatı' };
  }

  return { isValid: true };
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate: string, endDate: string): ValidationResult => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Geçersiz tarih formatı' };
  }

  if (start > end) {
    return { isValid: false, error: 'Başlangıç tarihi bitiş tarihinden sonra olamaz' };
  }

  return { isValid: true };
};

/**
 * Sanitize input (remove potentially dangerous characters)
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>'"]/g, '');
};

