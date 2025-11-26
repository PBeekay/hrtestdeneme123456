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
        bg-white 
        dark:bg-neutral-800
        rounded-2xl 
        shadow-sm 
        ${interactive ? 'hover:shadow-lg hover:scale-[1.01]' : ''} 
        transition-all 
        duration-300 
        p-4
        border 
        border-neutral-100
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
