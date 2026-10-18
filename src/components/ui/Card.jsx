import React from 'react';

export const Card = ({
  children,
  className = '',
  padding = 'default', // 'none' | 'sm' (16px) | 'default' (24px) | 'lg' (32px)
  hover = false,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-all duration-200 ${
        hover ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700' : ''
      } ${paddingStyles[padding] || paddingStyles.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div
    className={`flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3
    className={`text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div
    className={`flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-5 ${className}`}
    {...props}
  >
    {children}
  </div>
);
