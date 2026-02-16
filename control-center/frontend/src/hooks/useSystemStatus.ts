import { useQuery } from '@tanstack/react-query';
import { fetchSystemStatus } from '../api';
import { MonitorTarget } from '../types';

export const useSystemStatus = () => {
    return useQuery<MonitorTarget[], Error>({
        queryKey: ['system-status'],
        queryFn: fetchSystemStatus,
        refetchInterval: 3000,
        staleTime: 1000,
    });
};
