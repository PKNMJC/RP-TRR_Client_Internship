import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export default function Alert({ type, message, onClose }: AlertProps) {
  const baseClasses = 'p-4 rounded-lg mb-4 flex items-center justify-between';

  const typeClasses = {
    success: 'bg-green-50 text-green-800 border border-green-200',
    error: 'bg-red-50 text-red-800 border border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border border-blue-200',
  };

  const iconClasses = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold">{iconClasses[type]}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg font-bold hover:opacity-70 transition"
        >
          ✕
        </button>
      )}
    </div>
  );
}
