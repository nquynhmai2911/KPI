import React from 'react';
import { InfoTip } from './InfoTip';

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
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 ${
        hover ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700' : ''
      } ${paddingStyles[padding] || paddingStyles.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Tiêu đề và nút (i) mô tả luôn nằm cùng một hàng
export const CardHeader = ({ children, className = '', ...props }) => (
  <div
    className={`flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 [&>div:first-child]:flex [&>div:first-child]:flex-wrap [&>div:first-child]:items-center [&>div:first-child]:gap-x-1.5 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3
    className={`text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-snug ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <InfoTip className={className}>{children}</InfoTip>
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
