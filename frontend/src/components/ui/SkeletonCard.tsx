import React from 'react';

interface SkeletonCardProps {
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div
      className={`
        bg-white 
        dark:bg-neutral-800
        rounded-lg 
        shadow-sm 
        p-6
        border 
        border-neutral-100
        dark:border-neutral-700
        ${className}
      `}
    >
      <div className="animate-pulse h-full flex flex-col space-y-4">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full w-1/3"></div>
        <div className="flex-1 space-y-3">
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full w-full"></div>
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full w-5/6"></div>
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full w-4/6"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;

