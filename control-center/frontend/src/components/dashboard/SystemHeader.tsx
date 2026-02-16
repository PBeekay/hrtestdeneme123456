import React from 'react';
import { Activity } from 'lucide-react';

interface SystemHeaderProps {
    lastUpdate: Date;
    loading: boolean;
}

export const SystemHeader: React.FC<SystemHeaderProps> = ({ lastUpdate }) => {
    return (
        <header className="flex items-center justify-between mb-10">
            <div className="flex items-center space-x-3">
                <div className="bg-emerald-500/10 p-3 rounded-full border border-emerald-500/20">
                    <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Pulse Control Center</h1>
                    <p className="text-slate-400 text-sm">Real-time System Monitoring</p>
                </div>
            </div>
            <div className="flex items-center space-x-4 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-mono text-emerald-400">OPERATIONAL</span>
                </div>
                <div className="h-4 w-px bg-slate-700"></div>
                <span className="text-xs text-slate-500">
                    Updated: {lastUpdate.toLocaleTimeString()}
                </span>
            </div>
        </header>
    );
};
