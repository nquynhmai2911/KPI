import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getRankStats, EXCELLENT_QUOTA_INFO } from '../../utils/labels';
import { InfoTip } from '../ui/InfoTip';

export const RankDistributionChart = () => {
  const { systemOperatingMode, kpiPlans, activePeriod } = useApp();
  const isGov = systemOperatingMode === 'GOVERNMENT';
  const stats = getRankStats(kpiPlans.filter((p) => p.periodId === activePeriod?.id));
  const { counts, quota } = stats;

  const rankData = [
    { name: 'Xuất sắc', code: 'EXCELLENT', count: counts.EXCELLENT, color: '#7c3aed' },
    { name: isGov ? 'Hoàn thành tốt' : 'Tốt', code: 'GOOD', count: counts.GOOD, color: '#059669' },
    { name: isGov ? 'Hoàn thành' : 'Đạt', code: 'COMPLETED', count: counts.COMPLETED, color: '#2563eb' },
    { name: isGov ? 'Không hoàn thành' : 'Không đạt', code: 'FAILED', count: counts.FAILED, color: '#dc2626' },
  ];
  const total = stats.evaluated;

  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
        <div className="font-semibold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          {data.name}: <span className="tabular-nums">{data.count}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="w-full h-[190px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomPieTooltip />} />
            <Pie data={total ? rankData : [{ code: 'NONE', count: 1, color: '#e2e8f0' }]} innerRadius={60} outerRadius={85} paddingAngle={rankData.filter((r) => r.count).length > 1 ? 2 : 0} dataKey="count" stroke="none">
              {(total ? rankData : [{ code: 'NONE', color: '#e2e8f0' }]).map((entry) => (
                <Cell key={entry.code} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{total}</span>
          <span className="text-xs text-slate-400">đã xếp loại</span>
        </div>
      </div>

      <ul className="space-y-2">
        {rankData.map((item) => (
          <li key={item.code} className="flex items-center gap-3 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="flex-1 text-slate-600 dark:text-slate-300">{item.name}</span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{item.count}</span>
            <span className="w-12 text-right text-xs tabular-nums text-slate-400">
              {total ? Math.round((item.count / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>

      {isGov && (
        <div
          className={`mt-auto px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 ${
            quota.withinQuota
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
          }`}
        >
          {quota.withinQuota ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
          <span className="flex-1">
            Xuất sắc <strong className="tabular-nums">{counts.EXCELLENT}</strong> / tối đa{' '}
            <strong className="tabular-nums">{quota.maxAllowed}</strong>
          </span>
          <InfoTip size={14}>{EXCELLENT_QUOTA_INFO}</InfoTip>
        </div>
      )}
    </div>
  );
};
