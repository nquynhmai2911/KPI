import React from 'react';

export const SegmentedControl = ({
  options = [],
  value,
  onChange,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'p-0.5 text-xs h-8',
    md: 'p-1 text-xs h-9',
    lg: 'p-1.5 text-sm h-11',
  };

  const itemSizeStyles = {
    sm: 'px-2.5 py-1',
    md: 'px-3.5 py-1.5',
    lg: 'px-4 py-2',
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 ${
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
            className={`relative flex items-center justify-center gap-1.5 font-bold rounded-md transition-all duration-150 select-none cursor-pointer ${
              itemSizeStyles[size] || itemSizeStyles.md
            } ${
              isSelected
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
            <span>{option.label}</span>
            {option.badge !== undefined && option.badge !== null && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
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
