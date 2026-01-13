import React, { useEffect } from 'react';

export interface ToastType {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastProps extends ToastType {
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'error':
        return 'bg-red-500 border-red-600';
      case 'warning':
        return 'bg-amber-500 border-amber-600';
      case 'info':
      default:
        return 'bg-primary-500 border-primary-600';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      className={`${getToastStyles()} text-white px-4 py-2.5 rounded-md shadow-lg border-2 flex items-center space-x-2 min-w-[240px] max-w-[320px] animate-slideInRight backdrop-blur-sm`}
    >
      <span className="text-lg">{getIcon()}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="text-white hover:bg-white/20 rounded-full p-0.5 transition-colors text-xs"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;

