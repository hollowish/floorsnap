import { useState, useEffect, useCallback } from 'react';

/**
 * Simple toast notification system.
 *
 * Usage:
 *   const { showToast, ToastContainer } = useToast();
 *   showToast('Saved!', 'success');
 *   // render <ToastContainer /> in your layout
 */

// Global toast state (simple pub/sub to avoid prop drilling)
let toastListener = null;

export function fireToast(message, type = 'info') {
  if (toastListener) toastListener({ message, type, id: Date.now() });
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastListener = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3500);
    };
    return () => { toastListener = null; };
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    fireToast(message, type);
  }, []);

  return { showToast, toasts };
}

export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null;

  const typeStyles = {
    success: 'bg-green-800 text-green-50',
    error: 'bg-red-800 text-red-50',
    warning: 'bg-amber-700 text-amber-50',
    info: 'bg-blueprint-800 text-blueprint-50',
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg animate-[slideDown_250ms_ease-out] ${typeStyles[toast.type] || typeStyles.info}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
