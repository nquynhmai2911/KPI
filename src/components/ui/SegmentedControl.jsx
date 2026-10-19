import React from 'react';

export const SegmentedControl = ({
  options = [],
  value,
  onChange,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'p-0.5 text-sm',
    md: 'p-1 text-sm',
    lg: 'p-1.5 text-sm',
  };

  const itemSizeStyles = {
    sm: 'px-3 py-1.5',
    md: 'px-3.5 py-2',
    lg: 'px-4 py-2',
  };

  return (
    <div
      className={`inline-flex max-w-full overflow-x-auto items-center rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 ${
        sizeStyles[size] || sizeStyles.md
      } ${className}`}
      role="tablist"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={`relative flex shrink-0 whitespace-nowrap items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 select-none cursor-pointer ${
              itemSizeStyles[size] || itemSizeStyles.md
            } ${
              isSelected
                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
            <span>{option.label}</span>
            {option.badge !== undefined && option.badge !== null && (
              <span
                className={`px-1.5 rounded-full tabular-nums text-[10px] font-bold ${
                  isSelected
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
