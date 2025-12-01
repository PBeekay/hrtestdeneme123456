/**
 * Environment Configuration
 * Centralized place for all environment variables
 */

export const config = {
  // API Configuration
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  
  // App Configuration
  appName: process.env.REACT_APP_NAME || 'HR Dashboard',
  environment: process.env.NODE_ENV || 'development',
  
  // Feature Flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Auth Configuration
  tokenKey: 'authToken',
  tokenExpirationMinutes: 30,
  
  // API Timeouts
  requestTimeout: 30000, // 30 seconds
  
  // Cache Configuration
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
} as const;

export default config;

