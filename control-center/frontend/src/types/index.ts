export interface MonitorTarget {
    target_id: number;
    name: string;
    url: string;
    status: 'up' | 'down' | 'degraded' | 'unknown';
    latency_ms: number;
    last_check: string;
    history_preview: number[];
}
