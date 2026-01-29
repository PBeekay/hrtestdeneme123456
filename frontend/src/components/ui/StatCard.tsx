import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delay?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
  ctaLabel?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  delay = 0,
  trend,
  trendValue,
  onClick,
  ctaLabel,
  disabled = false,
  ariaLabel,
}) => {
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

  const interactive = Boolean(onClick) && !disabled;

  return (
    <div
      role={interactive ? 'button' : undefined}
      aria-label={interactive && ariaLabel ? ariaLabel : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={interactive ? 0 : -1}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick?.();
            }
          }
          : undefined
      }
      className={`bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700 shadow-sm transition-all duration-150 animate-fadeInUp group ${interactive
        ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500'
        : ''
        } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
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
      {interactive && ctaLabel && (
        <div className="mt-2 flex items-center space-x-1 text-[10px] font-semibold text-primary-600 dark:text-primary-400">
          <span>{ctaLabel}</span>
          <span>→</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;

