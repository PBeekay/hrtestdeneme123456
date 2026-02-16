import { MonitorTarget } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const fetchSystemStatus = async (): Promise<MonitorTarget[]> => {
    const res = await fetch(`${API_URL}/status`);
    if (!res.ok) {
        throw new Error('Network response was not ok');
    }
    return res.json();
};
