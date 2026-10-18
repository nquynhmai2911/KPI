import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

const data = [
  { department: 'Ban Lãnh đạo', fullDepartment: 'Văn phòng Ban Lãnh đạo Cơ quan', rate: 96, target: 90 },
  { department: 'Công nghệ', fullDepartment: 'Trung tâm Công nghệ thông tin & Số hóa', rate: 92, target: 90 },
  { department: 'Tổ chức CB', fullDepartment: 'Vụ Tổ chức Cán bộ & Thi đua', rate: 94, target: 90 },
  { department: 'KH - Tài chính', fullDepartment: 'Vụ Kế hoạch - Tài chính', rate: 88, target: 90 },
  { department: 'Kinh doanh & DV', fullDepartment: 'Khối Kinh doanh & Dịch vụ Khách hàng', rate: 84, target: 90 },
  { department: 'Pháp chế', fullDepartment: 'Vụ Pháp chế & Thanh tra Nội bộ', rate: 89, target: 90 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const isMet = item.rate >= item.target;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[220px]">
        <p className="font-bold text-sm mb-1.5 text-slate-100">{item.fullDepartment}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Tỷ lệ hoàn thành:</span>
            <span className={`font-bold tabular-nums text-sm ${isMet ? 'text-emerald-400' : 'text-amber-400'}`}>
              {item.rate}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Đường chuẩn mục tiêu:</span>
            <span className="font-semibold text-slate-200 tabular-nums">{item.target}%</span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Đánh giá:</span>
            <span className={`font-semibold ${isMet ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isMet ? '✓ Đạt chuẩn (>=90%)' : '⚠ Cần đôn đốc (<90%)'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const DepartmentKPIChart = () => {
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 25, left: -10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
          <XAxis
            dataKey="department"
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-slate-600 dark:text-slate-400 font-medium"
            axisLine={{ stroke: 'currentColor', className: 'text-slate-300 dark:text-slate-700' }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-slate-500 dark:text-slate-400 font-mono"
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Đường tham chiếu 90% (Yêu cầu Bước 4) */}
          <ReferenceLine
            y={90}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: 'Chuẩn 90%',
              position: 'insideTopRight',
              fill: '#d97706',
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.rate >= 90 ? '#10b981' : '#f59e0b'} // Đạt: xanh emerald, Cần đôn đốc: cam
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
