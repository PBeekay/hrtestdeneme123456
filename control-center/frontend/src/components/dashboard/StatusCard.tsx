import React from 'react';
import { Server, Globe, Wifi, Clock } from 'lucide-react';
import { MonitorTarget } from '../../types';
import { Card } from '../ui/Card';
import { MetricsChart } from './MetricsChart';

interface StatusCardProps {
    target: MonitorTarget;
}

export const StatusCard: React.FC<StatusCardProps> = ({ target }) => {
    const isUp = target.status === 'up';

    return (
        <Card status={target.status}>
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {target.name.includes('API') ? <Server className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{target.name}</h3>
                            <a href={target.url} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                                {target.url}
                            </a>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isUp ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                        {target.status.toUpperCase()}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                        <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                            <Wifi className="w-3 h-3" /> Latency
                        </div>
                        <div className={`text-xl font-mono font-semibold ${target.latency_ms > 200 ? 'text-amber-400' : 'text-white'}`}>
                            {target.latency_ms.toFixed(0)} ms
                        </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                        <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Uptime
                        </div>
                        <div className="text-xl font-mono font-semibold text-white">
                            99.9%
                        </div>
                    </div>
                </div>

                <MetricsChart data={target.history_preview} isUp={isUp} />
            </div>
        </Card>
    );
};
