import React from 'react';
import { useApp } from '../../context/AppContext';
import { getDepartmentStats } from '../../utils/labels';
import { ProgressBar } from '../common/ProgressBar';

export const DepartmentKPIChart = () => {
  const { kpiPlans, activePeriod } = useApp();
  const departments = getDepartmentStats(kpiPlans.filter((p) => p.periodId === activePeriod?.id));

  if (departments.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">Chưa có phiếu KPI trong kỳ này.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {departments.map((d) => (
        <li key={d.name} className="py-3.5 first:pt-0 last:pb-0">
          <div className="flex items-baseline justify-between gap-4 mb-2">
            <span className="min-w-0 text-sm text-slate-800 dark:text-slate-200 truncate">
              {d.name}
              <span className="text-xs text-slate-400 tabular-nums">
                {' · '}
                {d.count} người{d.avgScore ? `, ${d.avgScore} điểm` : ''}
              </span>
            </span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0 tabular-nums">{d.progress}%</span>
          </div>
          <ProgressBar value={d.progress} size="sm" />
        </li>
      ))}
    </ul>
  );
};
