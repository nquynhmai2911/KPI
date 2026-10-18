import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({
  label,
  value,
  unit,
  trend, // { value: '+8.5%', isPositive: true, label: 'so với kỳ trước' }
  icon: Icon,
  colorVariant = 'blue', // 'blue' | 'amber' | 'emerald' | 'purple'
  subtext,
  className = '',
}) => {
  const iconVariants = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          {Icon && (
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                iconVariants[colorVariant] || iconVariants.blue
              }`}
            >
              <Icon size={20} />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {unit}
            </span>
          )}
        </div>
      </div>

      {(trend || subtext) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {trend ? (
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center font-bold tabular-nums ${
                  trend.isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {trend.value}
              </span>
              {trend.label && <span className="text-slate-400 dark:text-slate-500">{trend.label}</span>}
            </div>
          ) : (
            <span>{subtext}</span>
          )}
        </div>
      )}
    </div>
  );
};
