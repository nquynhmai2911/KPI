import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

const POPOVER_WIDTH = 288;

export const InfoTip = ({ children, title, size = 15, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - POPOVER_WIDTH / 2), window.innerWidth - POPOVER_WIDTH - 8);
    setPos({ top: r.bottom + 8, left });
  };

  useEffect(() => {
    if (!open) return undefined;
    place();
    const onDown = (e) => {
      if (!popRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onMove = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open]);

  if (!children) return null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`inline-flex items-center justify-center shrink-0 rounded-full p-0.5 align-middle transition-colors cursor-pointer ${
          open
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60'
            : 'text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400'
        } ${className}`}
        aria-label="Xem giải thích"
        aria-expanded={open}
      >
        <Info size={size} />
      </button>
      {open &&
        createPortal(
          <div
            ref={popRef}
            role="dialog"
            style={{ top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
            className="fixed z-[100] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="flex items-start gap-2">
              <Info size={16} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-1">
                {title && <div className="font-semibold text-slate-900 dark:text-slate-100">{title}</div>}
                <div className="font-normal normal-case tracking-normal">{children}</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Đóng"
              >
                <X size={14} />
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
