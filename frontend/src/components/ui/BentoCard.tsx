import React from 'react';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  interactive?: boolean;
}

const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  delay = 0,
  interactive = true
}) => {
  return (
    <div
      className={`
        bg-stone-50/80
        dark:bg-neutral-800
        rounded-lg 
        shadow-sm 
        ${interactive ? 'hover:shadow-md hover:scale-[1.005]' : ''} 
        transition-all 
        duration-150 
        p-3
        border 
        border-stone-200/50
        dark:border-neutral-700
        animate-fadeInUp
        ${className}
      `}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
};

export default BentoCard;
