import React from 'react';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  delay?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, delay = 0, trend, trendValue }) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return <span className="text-green-500">↗</span>;
      case 'down':
        return <span className="text-red-500">↘</span>;
      case 'neutral':
        return <span className="text-neutral-500">→</span>;
    }
  };

  return (
    <div
      className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-xl p-3 border border-white dark:border-neutral-700 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 animate-fadeInUp cursor-pointer group"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center space-x-2">
        <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium truncate">{label}</p>
          <div className="flex items-baseline space-x-1.5">
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{value}</p>
            {trend && trendValue && (
              <span className="text-[10px] font-semibold flex items-center space-x-0.5">
                {getTrendIcon()}
                <span>{trendValue}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;

