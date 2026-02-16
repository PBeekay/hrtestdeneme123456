import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    status?: 'up' | 'down' | 'degraded' | 'unknown';
}

export const Card: React.FC<CardProps> = ({ children, className = '', status }) => {
    const statusStyles = status
        ? status === 'up'
            ? 'bg-slate-800/60 border-slate-700 hover:border-emerald-500/50'
            : 'bg-rose-900/10 border-rose-500/50 hover:border-rose-500'
        : 'bg-slate-800/60 border-slate-700';

    return (
        <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${statusStyles} ${className}`}>
            {children}
            {/* Glow Effect */}
            {status && (
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none opacity-20 ${status === 'up' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
            )}
        </div>
    );
};
