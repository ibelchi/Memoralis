'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastMessage = {
  id: string; // The ID of the artwork(s)
  title: string; // E.g., "Títol" or "3 obres"
  message: string; // "[Títol] eliminada"
  type: 'delete';
  timeoutId?: NodeJS.Timeout;
};

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'timeoutId'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'timeoutId'>) => {
    const timeoutId = setTimeout(() => {
      removeToast(toast.id);
    }, 10000); // 10 seconds

    setToasts((prev) => [...prev, { ...toast, timeoutId }]);
  }, [removeToast]);

  const handleUndo = async (toast: ToastMessage) => {
    // Clear the timeout to prevent removal while processing
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    removeToast(toast.id);

    try {
      // Handle multiple IDs if comma-separated
      const ids = toast.id.split(',');
      for (const id of ids) {
        await fetch(`/api/artworks/${id}/restore`, { method: 'POST' });
      }
      // Force a reload or dispatch an event to refresh data
      window.dispatchEvent(new Event('artworks-updated'));
    } catch (err) {
      console.error('Error restoring:', err);
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="bg-stone-800 text-white px-5 py-3 rounded-xl shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300"
            >
              <span className="font-medium text-sm">{toast.message}</span>
              <button
                onClick={() => handleUndo(toast)}
                className="text-[#D4752A] hover:text-orange-400 font-bold text-sm uppercase tracking-wider transition-colors"
              >
                Desfés
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
