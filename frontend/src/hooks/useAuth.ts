import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from './useToast';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = useCallback(async (username: string, password: string) => {
    setLoginError(null);
    const result = await api.login(username, password);
    
    if (result.data && result.status === 200) {
      setIsAuthenticated(true);
      localStorage.setItem('authToken', result.data.token);
      addToast(result.data.message || 'Giriş başarılı', 'success');
      return true;
    } else {
      setLoginError(result.error || 'Giriş başarısız');
      return false;
    }
  }, [addToast]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    addToast('Başarıyla çıkış yapıldı', 'info');
    navigate('/');
  }, [addToast, navigate]);

  return {
    isAuthenticated,
    loginError,
    handleLogin,
    handleLogout,
  };
};

