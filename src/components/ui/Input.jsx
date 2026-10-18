import React from 'react';

export const Input = React.forwardRef(
  (
    {
      className = '',
      type = 'text',
      size = 'md',
      error = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: 'h-8 text-xs px-2.5',
      md: 'h-9 text-sm px-3',
      lg: 'h-11 text-base px-3.5',
    };

    const hasLeft = Boolean(LeftIcon);
    const hasRight = Boolean(RightIcon);

    return (
      <div className="relative flex items-center w-full">
        {hasLeft && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <LeftIcon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={`w-full rounded-lg bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-400 dark:border-rose-600 focus-visible:ring-rose-500'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          } ${sizeStyles[size] || sizeStyles.md} ${hasLeft ? 'pl-9' : ''} ${hasRight ? 'pr-9' : ''} ${className}`}
          {...props}
        />
        {hasRight && (
          <div className="absolute right-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <RightIcon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
