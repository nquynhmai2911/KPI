import React from 'react';

/**
 * Hiển thị ngày tháng chuẩn quốc gia Việt Nam (luôn định dạng dd/MM/yyyy)
 */
export const DateText = ({ date, withTime = false, className = '' }) => {
  if (!date) return <span className={`text-slate-400 ${className}`}>--/--/----</span>;

  let d;
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    // Check if ISO string, or yyyy-mm-dd or timestamp
    d = new Date(date);
  }

  if (!d || isNaN(d.getTime())) {
    // If it's already in string format like dd/MM/yyyy
    return <span className={`tabular-nums ${className}`}>{String(date)}</span>;
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let formatted = `${day}/${month}/${year}`;

  if (withTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    formatted = `${hours}:${minutes} ${formatted}`;
  }

  return <span className={`tabular-nums ${className}`}>{formatted}</span>;
};
