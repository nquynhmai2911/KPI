import React from 'react';
import { InfoTip } from '../ui/InfoTip';

// Breadcrumb đã hiển thị trên thanh Header nên không lặp lại ở đây
export const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  badge,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-4 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
            <Icon size={20} />
          </span>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h1>
        {subtitle && <InfoTip size={16}>{subtitle}</InfoTip>}
        {badge && <div className="hidden sm:block">{badge}</div>}
      </div>

      {actions && (
        <div className="flex items-center gap-2 max-w-full overflow-x-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
