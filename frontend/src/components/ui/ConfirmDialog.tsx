import React, { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  type = 'warning',
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmButton: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white',
          iconBg: 'bg-red-100 dark:bg-red-900/30'
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmButton: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white',
          iconBg: 'bg-amber-100 dark:bg-amber-900/30'
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          confirmButton: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white',
          iconBg: 'bg-indigo-100 dark:bg-indigo-900/30'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onCancel}
    >
      <div 
        className="bg-stone-50 dark:bg-neutral-800 rounded-lg shadow-2xl max-w-sm w-full border-2 border-stone-200/50 dark:border-neutral-700 animate-fadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon and Title */}
        <div className="p-4 pb-3">
          <div className={`${styles.iconBg} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
            <span className="text-2xl">{styles.icon}</span>
          </div>
          <h3 className="text-lg font-bold text-center text-neutral-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 p-4 pt-3">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg text-sm transition-all duration-100"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-3 py-2 ${styles.confirmButton} font-semibold rounded-lg text-sm transition-all duration-100 shadow-lg hover:shadow-xl transform hover:scale-[1.02]`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

