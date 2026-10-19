import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ open = true, title, icon: Icon, onClose, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${widths[size] || widths.md} max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 pt-5 pb-4">
          {Icon && (
            <span className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300 flex items-center justify-center shrink-0">
              <Icon size={18} />
            </span>
          )}
          <h3 className="flex-1 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-5 overflow-y-auto space-y-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">{footer}</div>
        )}
      </div>
    </div>
  );
};
