import React from 'react';

interface DarkModeToggleProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <button
      onClick={toggleDarkMode}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden"
      aria-label="Toggle dark mode"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Sun Icon */}
        <span
          className={`absolute text-lg transform transition-all duration-500 ${
            isDarkMode
              ? 'rotate-90 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100'
          }`}
        >
          ☀️
        </span>
        
        {/* Moon Icon */}
        <span
          className={`absolute text-lg transform transition-all duration-500 ${
            isDarkMode
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0'
          }`}
        >
          🌙
        </span>
      </div>
      
      {/* Hover effect background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-400/0 to-primary-600/0 group-hover:from-primary-400/10 group-hover:to-primary-600/10 transition-all duration-300 rounded-2xl"></div>
    </button>
  );
};

export default DarkModeToggle;

