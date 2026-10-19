import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { InfoTip } from '../ui/InfoTip';

export const SectionCard = ({
  title,
  description,
  icon: Icon,
  action,
  children,
  className = '',
  contentClassName = '',
}) => {
  return (
    <Card className={`p-6 ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <span className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                <Icon size={16} />
              </span>
            )}
            {title && (
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">
                {title}
              </h3>
            )}
            {description && <InfoTip>{description}</InfoTip>}
          </div>
          {action && <div className="flex flex-wrap items-center gap-2 shrink-0">{action}</div>}
        </div>
      )}
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
};
