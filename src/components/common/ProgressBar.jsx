import React from 'react';

/**
 * Thanh tiến độ có ngữ nghĩa màu sắc tự động theo tỷ lệ hoàn thành (%)
 */
export const ProgressBar = ({
  value,
  progress,
  max = 100,
  size = 'md', // 'sm' (6px) | 'md' (8px) | 'lg' (12px)
  showValue,
  showLabel,
  className = '',
  customColor,
}) => {
  const percentage = Math.max(0, Number(value ?? progress) || 0);
  showValue = showValue ?? showLabel ?? false;
  const normalizedRatio = max > 0 ? (percentage / max) * 100 : 0;
  const clampedWidth = Math.min(100, normalizedRatio);

  // Ngữ nghĩa màu chuẩn:
  // < 50%: Đỏ (chậm tiến độ nghiêm trọng)
  // 50% - 79%: Vàng (cần đôn đốc)
  // 80% - 100%: Xanh lá (đạt yêu cầu)
  const getSemanticColor = () => {
    if (customColor) return customColor;
    if (percentage >= 80) return 'bg-emerald-500 dark:bg-emerald-400';
    if (percentage >= 50) return 'bg-amber-500 dark:bg-amber-400';
    return 'bg-rose-500 dark:bg-rose-400';
  };

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`flex items-center gap-2.5 w-full ${className}`}>
      <div
        className={`flex-1 w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-full overflow-hidden ${
          sizeStyles[size] || sizeStyles.md
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${getSemanticColor()}`}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
      {showValue && (
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums min-w-[36px] text-right">
          {percentage}%
        </span>
      )}
    </div>
  );
};
