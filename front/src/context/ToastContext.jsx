import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: Check,
  error: AlertCircle,
  info: Info,
};

const STYLES = {
  success: 'border-green-500/40 text-green-300',
  error: 'border-red-500/40 text-red-300',
  info: 'border-zinc-600 text-zinc-200',
};

let counter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++counter;
    setToasts((list) => [...list, { id, message, type }]);
    if (duration) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = {
    success: (m, d) => push(m, 'success', d),
    error: (m, d) => push(m, 'error', d),
    info: (m, d) => push(m, 'info', d),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              role="status"
              className={`flex items-start gap-3 bg-zinc-900 border rounded-sm px-4 py-3 shadow-lg animate-in slide-in-from-right-4 fade-in duration-200 ${STYLES[t.type] || STYLES.info}`}
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1 text-zinc-100">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-zinc-500 hover:text-white transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans un <ToastProvider>');
  return ctx;
};
