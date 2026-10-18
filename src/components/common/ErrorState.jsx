import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

export const ErrorState = ({
  title = 'Đã xảy ra lỗi tải dữ liệu',
  message = 'Không thể kết nối đến máy chủ hoặc dữ liệu không hợp lệ. Vui lòng thử lại sau.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-12 bg-rose-50/40 dark:bg-rose-950/20 border border-dashed border-rose-200 dark:border-rose-900/50 rounded-xl ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-xs">
        <AlertTriangle size={28} />
      </div>

      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
        {title}
      </h4>

      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} leftIcon={RotateCcw}>
          Thử lại
        </Button>
      )}
    </div>
  );
};
