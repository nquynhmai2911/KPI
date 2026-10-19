import React from 'react';
import { InfoTip } from '../ui/InfoTip';

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
          className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
          {hint && <InfoTip size={13}>{hint}</InfoTip>}
        </label>
      )}

      {children}

      {error && <span className="text-xs text-rose-500 font-medium leading-tight">{error}</span>}
    </div>
  );
};
