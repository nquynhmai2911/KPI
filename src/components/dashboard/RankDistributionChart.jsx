import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RankDistributionChart = () => {
  const { systemOperatingMode } = useApp();

  const rankData = [
    {
      name: systemOperatingMode === 'GOVERNMENT' ? 'Hoàn thành xuất sắc' : 'Xuất sắc (A)',
      code: 'EXCELLENT',
      count: 28,
      percent: 18.9,
      color: '#7c3aed', // Purple solid (design-tokens)
    },
    {
      name: systemOperatingMode === 'GOVERNMENT' ? 'Hoàn thành tốt' : 'Tốt (B)',
      code: 'GOOD',
      count: 78,
      percent: 52.7,
      color: '#059669', // Emerald solid (design-tokens)
    },
    {
      name: systemOperatingMode === 'GOVERNMENT' ? 'Hoàn thành' : 'Đạt yêu cầu (C)',
      code: 'COMPLETED',
      count: 36,
      percent: 24.3,
      color: '#2563eb', // Blue solid (design-tokens)
    },
    {
      name: systemOperatingMode === 'GOVERNMENT' ? 'Không hoàn thành' : 'Không đạt (D)',
      code: 'FAILED',
      count: 6,
      percent: 4.1,
      color: '#dc2626', // Red solid (design-tokens)
    },
  ];

  const total = rankData.reduce((sum, item) => sum + item.count, 0);
  const excellentRate = rankData.find((r) => r.code === 'EXCELLENT')?.percent || 0;
  const isCapped = excellentRate <= 20;

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs">
          <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </div>
          <div className="mt-1 text-slate-300">
            Số lượng: <strong className="text-white tabular-nums">{data.count}</strong> cán bộ
          </div>
          <div className="text-slate-300">
            Tỷ lệ: <strong className="text-white tabular-nums">{data.percent}%</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full justify-between space-y-4">
      {/* Donut Chart */}
      <div className="w-full h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomPieTooltip />} />
            <Pie
              data={rankData}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="count"
            >
              {rankData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
            {total}
          </span>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Nhân sự
          </span>
        </div>
      </div>

      {/* Legend with count & percentage */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {rankData.map((item) => (
          <div
            key={item.code}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                {item.name}
              </span>
            </div>
            <div className="text-right shrink-0 font-semibold tabular-nums text-slate-900 dark:text-slate-100 ml-1">
              {item.count} <span className="text-[11px] text-slate-400 font-normal">({item.percent}%)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quota limit warning alert (Nghị định 90/2020: Xuất sắc <= 20%) */}
      {systemOperatingMode === 'GOVERNMENT' ? (
        <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
          isCapped
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
            : 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
        }`}>
          {isCapped ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="leading-relaxed">
            <strong>Tỷ lệ Xuất sắc: {excellentRate}%</strong> (Tối đa 20% theo Nghị định 90/2020/NĐ-CP).{' '}
            {isCapped ? 'Đạt tiêu chuẩn khống chế.' : 'Vượt trần quy định, cần rà soát lại!'}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/70 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Phân bổ xếp loại tuân thủ theo đường cong chuông chuẩn (Bell Curve) gắn quỹ thưởng doanh nghiệp.
          </div>
        </div>
      )}
    </div>
  );
};
