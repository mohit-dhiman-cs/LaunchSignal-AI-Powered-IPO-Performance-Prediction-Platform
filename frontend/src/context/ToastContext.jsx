import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: 28,
      right: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      zIndex: 99999,
    }}>
      {toasts.map(t => <Toast key={t.id} {...t} />)}
    </div>
  );
}

const TOAST_STYLES = {
  success: { border: 'rgba(16,185,129,0.4)',  icon: '✅', color: '#10b981' },
  error:   { border: 'rgba(239,68,68,0.4)',   icon: '❌', color: '#ef4444' },
  info:    { border: 'rgba(59,130,246,0.4)',   icon: '💡', color: '#3b82f6' },
  warning: { border: 'rgba(245,158,11,0.4)',   icon: '⚠️', color: '#f59e0b' },
};

function Toast({ message, type }) {
  const s = TOAST_STYLES[type] || TOAST_STYLES.info;
  return (
    <div style={{
      background: 'rgba(13,18,32,0.97)',
      border: `1px solid ${s.border}`,
      borderLeft: `3px solid ${s.color}`,
      borderRadius: 12,
      padding: '12px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minWidth: 260,
      maxWidth: 380,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'slideInToast 0.3s cubic-bezier(0.4,0,0.2,1)',
      backdropFilter: 'blur(16px)',
    }}>
      <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500 }}>
        {message}
      </span>
    </div>
  );
}
