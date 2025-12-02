import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardData } from '../types';
import api from '../services/api';
import { useToast } from './useToast';

export const useDashboard = (isAuthenticated: boolean) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const hasInitialFetch = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasInitialFetch.current) {
      if (!isAuthenticated) {
        setLoading(false);
      }
      return;
    }

    hasInitialFetch.current = true;

    const fetchData = async () => {
      const result = await api.getDashboard();
      if (result.data && result.status === 200) {
        setDashboardData(result.data);
        setLoading(false);
        addToast('Dashboard yüklendi', 'success');
      } else {
        setError(result.error || 'Veri yüklenemedi');
        setLoading(false);
        addToast(result.error || 'Dashboard yüklenemedi', 'error');
      }
    };

    fetchData();
  }, [isAuthenticated, addToast]);

  const resetFetch = useCallback(() => {
    hasInitialFetch.current = false;
  }, []);

  return {
    dashboardData,
    loading,
    error,
    resetFetch,
  };
};

