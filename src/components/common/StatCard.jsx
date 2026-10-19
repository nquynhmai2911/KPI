import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { InfoTip } from '../ui/InfoTip';

const ICON_VARIANTS = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
  primary: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
  info: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
  success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
  danger: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
};

/**
 * trend: '+8.5%' (kèm trendDirection) hoặc { value, isPositive }.
 * subtext: giải thích phụ, hiển thị trong nút (i).
 */
export const StatCard = ({
  label,
  value,
  unit,
  trend,
  trendDirection,
  icon: Icon,
  colorVariant,
  color,
  subtext,
  onClick,
  className = '',
}) => {
  const variant = colorVariant || color || 'blue';
  const trendObj =
    trend && typeof trend === 'object'
      ? trend
      : typeof trend === 'string' && /^[+-]?\d/.test(trend)
      ? { value: trend, isPositive: trendDirection ? trendDirection === 'up' : !trend.startsWith('-') }
      : null;

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`text-left w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 flex items-center gap-3.5 ${
        onClick ? 'hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md cursor-pointer' : ''
      } ${className}`}
    >
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${ICON_VARIANTS[variant] || ICON_VARIANTS.blue}`}>
          <Icon size={20} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1 text-sm leading-snug text-slate-500 dark:text-slate-400">
          <span>{label}</span>
          {subtext && <InfoTip size={13}>{subtext}</InfoTip>}
        </div>
        <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
            {value}
          </span>
          {unit && <span className="text-sm text-slate-500 dark:text-slate-400">{unit}</span>}
          {trendObj && (
            <span
              className={`ml-auto inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
                trendObj.isPositive
                  ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50'
                  : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/50'
              }`}
            >
              {trendObj.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {trendObj.value}
            </span>
          )}
        </div>
      </div>
    </Wrapper>
  );
};
