import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: 'var(--bg-card)',
        border: `1px solid ${isSuccess ? '#10b981' : isError ? '#ef4444' : 'var(--primary-600)'}`,
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
        borderRadius: '12px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'fadeIn 0.25s ease-out',
        maxWidth: '420px',
      }}
    >
      {isSuccess && <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />}
      {isError && <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />}
      {!isSuccess && !isError && <Info size={20} style={{ color: '#2563eb', flexShrink: 0 }} />}

      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>
        {toast.message}
      </div>
    </div>
  );
};
