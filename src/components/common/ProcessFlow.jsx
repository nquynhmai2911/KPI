import React from 'react';
import { Check } from 'lucide-react';
import { KPI_PROCESS_STEPS, getStepIndex } from '../../utils/labels';

/**
 * Thanh quy trình đánh giá KPI.
 * - currentKey: bước hiện tại (các bước trước được đánh dấu hoàn thành)
 * - counts: { [stepKey]: số phiếu đang ở bước đó } – dùng cho góc nhìn tổng hợp
 */
export const ProcessFlow = ({ currentKey, counts, onStepClick, className = '' }) => {
  const currentIdx = currentKey ? getStepIndex(currentKey) : -1;

  return (
    <ol className={`grid grid-cols-4 lg:grid-cols-7 gap-y-4 ${className}`}>
      {KPI_PROCESS_STEPS.map((step, idx) => {
        const Icon = step.icon;
        const done = currentIdx > idx;
        const active = currentIdx === idx;
        const count = counts?.[step.key] || 0;

        return (
          <li key={step.key} className="relative">
            {idx < KPI_PROCESS_STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`hidden lg:block absolute top-5 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-0.5 rounded-full ${
                  done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
            <div
              role={onStepClick ? 'button' : undefined}
              tabIndex={onStepClick ? 0 : undefined}
              title={`${step.owner}: ${step.info}`}
              onClick={() => onStepClick?.(step)}
              onKeyDown={(e) => e.key === 'Enter' && onStepClick?.(step)}
              className={`group flex flex-col items-center text-center gap-1.5 ${onStepClick ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  active
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/60'
                    : done
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                {done ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} />}
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-semibold flex items-center justify-center tabular-nums bg-amber-500 text-white ring-2 ring-white dark:ring-slate-900">
                    {count}
                  </span>
                )}
              </span>
              <span
                className={`text-[13px] leading-tight ${
                  active ? 'font-semibold text-primary-700 dark:text-primary-300' : done ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
