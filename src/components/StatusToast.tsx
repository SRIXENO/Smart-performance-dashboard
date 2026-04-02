'use client';

import { useEffect } from 'react';

type StatusToastProps = {
  message: string;
  onClose: () => void;
  variant?: 'success' | 'error' | 'info';
};

const variantClasses = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-rose-600 text-white',
  info: 'bg-slate-900 text-white',
};

export default function StatusToast({
  message,
  onClose,
  variant = 'info',
}: StatusToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed right-4 top-4 z-50 max-w-md animate-slideIn">
      <div className={`${variantClasses[variant]} flex items-start gap-3 rounded-lg px-5 py-4 shadow-lg`}>
        <div className="mt-0.5">
          {variant === 'success' ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10A8 8 0 114 4.222V4a1 1 0 112 0v4a1 1 0 11-2 0V6.11A6 6 0 1016 10a1 1 0 112 0zm-7-3a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 15z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <p className="flex-1 text-sm font-medium leading-6">{message}</p>
        <button onClick={onClose} className="text-white/80 transition hover:text-white" aria-label="Close notification">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
