import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(
  ({ children, className = '', size = 'md', error = false, disabled = false, ...props }, ref) => {
    const sizeStyles = {
      sm: 'h-8 text-xs pl-2.5 pr-8',
      md: 'h-9 text-sm pl-3 pr-9',
      lg: 'h-11 text-base pl-3.5 pr-10',
    };

    return (
      <div className="relative inline-flex items-center w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={`w-full appearance-none rounded-lg bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
            error
              ? 'border-rose-400 dark:border-rose-600 focus-visible:ring-rose-500'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          } ${sizeStyles[size] || sizeStyles.md} ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 pointer-events-none text-slate-400 dark:text-slate-500">
          <ChevronDown size={size === 'sm' ? 14 : 16} />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
