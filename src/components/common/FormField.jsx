import React from 'react';

export const FormField = ({
  label,
  error,
  hint,
  required = false,
  className = '',
  children,
  id,
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500 font-black">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <span className="text-xs text-rose-500 font-medium leading-tight">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
          {hint}
        </span>
      ) : null}
    </div>
  );
};
