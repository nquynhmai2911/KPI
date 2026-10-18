import React from 'react';

/**
 * Định dạng số chuẩn Việt Nam (vi-VN) có tabular-nums
 */
export const NumberText = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  fallback = '0',
  className = '',
}) => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return <span className={`tabular-nums ${className}`}>{fallback}</span>;
  }

  const num = Number(value);
  const formatted = new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
