import React from 'react';

export const UserAvatarCell = ({
  name = 'Cán bộ',
  avatarUrl,
  avatar,
  subtext,
  subtitle,
  badge,
  size = 'md', // 'sm' (28px) | 'md' (36px) | 'lg' (44px)
  className = '',
}) => {
  const effectiveAvatar = avatarUrl || avatar;
  const effectiveSubtext = subtext || subtitle;
  const getInitials = (n) => {
    if (!n) return 'CB';
    const parts = n.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeStyles = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
  };

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      {effectiveAvatar ? (
        <img
          src={effectiveAvatar}
          alt={name}
          className={`${sizeStyles[size] || sizeStyles.md} rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700`}
        />
      ) : (
        <div
          className={`${sizeStyles[size] || sizeStyles.md} rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 ring-1 ring-blue-200 dark:ring-blue-800`}
        >
          {getInitials(name)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
            {name}
          </span>
          {badge}
        </div>
        {effectiveSubtext && (
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate block mt-0.5">
            {effectiveSubtext}
          </span>
        )}
      </div>
    </div>
  );
};
