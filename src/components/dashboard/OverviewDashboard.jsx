import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Download, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SectionCard } from '../common/SectionCard';
import { PageHeader } from '../common/PageHeader';
import { ProcessFlow } from '../common/ProcessFlow';
import { ProgressBar } from '../common/ProgressBar';
import { DepartmentKPIChart } from './DepartmentKPIChart';
import { RankDistributionChart } from './RankDistributionChart';
import { KPI_PROCESS_STEPS, getPlanStage, getNextAction, EXCELLENT_QUOTA_INFO, RANK_LABELS } from '../../utils/labels';
import { calculateDaysLeft } from '../../types/kpiTaskSchema';

const PERIOD_STAGE = {
  REGISTRATION: 'PLANNING',
  IN_PROGRESS: 'EXECUTION',
  EVALUATING: 'SELF_REVIEW',
  CLOSED: 'PUBLISHED',
};

const Metric = ({ label, value, unit, tone = 'text-slate-900 dark:text-slate-100', onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-start gap-1 px-6 py-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
  >
    <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
    <span className={`text-2xl font-semibold tabular-nums tracking-tight ${tone}`}>
      {value}
      {unit && <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>}
    </span>
  </button>
);

const LinkButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-0.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 cursor-pointer"
  >
    {children}
    <ChevronRight size={16} />
  </button>
);

const EmptyLine = ({ children }) => (
  <p className="flex items-center gap-2 py-3 text-sm text-slate-500 dark:text-slate-400">
    <CheckCircle2 size={18} className="text-emerald-500" />
    {children}
  </p>
);

const DeadlineList = ({ tasks, showAssignee }) => {
  if (tasks.length === 0) return <EmptyLine>Không có việc sắp đến hạn</EmptyLine>;
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800 -my-2">
      {tasks.map((t) => {
        const days = calculateDaysLeft(t.dueDate);
        const late = days < 0;
        return (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-slate-800 dark:text-slate-200 leading-snug" title={t.name}>
                {t.name}
              </span>
              {showAssignee && <span className="block text-xs text-slate-400 truncate">{t.assignee?.name}</span>}
            </span>
            <span
              className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-md tabular-nums ${
                late
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                  : days <= 7
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {late ? `Trễ ${-days} ngày` : days === 0 ? 'Hôm nay' : `Còn ${days} ngày`}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export const OverviewDashboard = () => {
  const { kpiPlans, kpiTasks = [], activePeriod, systemOperatingMode, showToast, setActiveModule, currentUser, activeRole } = useApp();
  const isGov = systemOperatingMode === 'GOVERNMENT';
  const isStaffOnly = ['EMPLOYEE', 'PEER_REVIEWER'].includes(activeRole);

  const periodPlans = useMemo(
    () => kpiPlans.filter((p) => p.periodId === activePeriod?.id),
    [kpiPlans, activePeriod]
  );

  const stageCounts = useMemo(() => {
    const counts = Object.fromEntries(KPI_PROCESS_STEPS.slice(1).map((s) => [s.key, 0]));
    periodPlans.forEach((p) => {
      const stage = getPlanStage(p, activePeriod);
      if (stage in counts) counts[stage] += 1;
    });
    return counts;
  }, [periodPlans, activePeriod]);

  const upcomingTasks = useMemo(
    () =>
      kpiTasks
        .filter((t) => t.status !== 'COMPLETED' && (!isStaffOnly || t.assigneeId === currentUser?.id))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5),
    [kpiTasks, isStaffOnly, currentUser]
  );

  const header = (
    <PageHeader
      title="Tổng quan"
      subtitle={
        isGov
          ? 'Tiến độ quy trình đánh giá và xếp loại theo NĐ 90/2020, NĐ 48/2023.'
          : 'Tiến độ quy trình đánh giá KPI/BSC.'
      }
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {activePeriod?.statusName}
        </span>
      }
      actions={
        !isStaffOnly && (
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => {
              showToast('Đang xuất báo cáo tổng hợp...');
              setTimeout(() => showToast('Đã tải xuống BaoCao_TongHop_KPI.xlsx', 'success'), 800);
            }}
          >
            Xuất báo cáo
          </Button>
        )
      }
    />
  );

  if (isStaffOnly) {
    const myPlan = periodPlans.find((p) => p.employeeId === currentUser?.id);
    const action = getNextAction(myPlan, { isOwner: true, period: activePeriod });
    const actionable = !action.text.startsWith('Chờ') && !action.text.startsWith('Đã');
    const items = myPlan?.items || [];
    const reached = items.filter((it) => (it.progressPercent || 0) >= 100).length;
    const evaluated = myPlan?.evaluationStatus === 'EVALUATED';

    return (
      <div className="space-y-6">
        {header}

        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-stretch divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
            <div className="flex-1 px-6 py-5 flex flex-col justify-center gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Việc tiếp theo của bạn</span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">{action.text}</span>
                {actionable && (
                  <Button size="sm" rightIcon={ArrowRight} onClick={() => setActiveModule(action.module)}>
                    Thực hiện
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
              <Metric label="Chỉ tiêu đạt" value={`${reached}/${items.length}`} onClick={() => setActiveModule('my-kpi')} />
              <Metric label="Điểm" value={evaluated ? myPlan.finalScore : '—'} onClick={() => setActiveModule('team-kpi')} />
              <Metric
                label="Xếp loại"
                value={evaluated ? RANK_LABELS[myPlan.finalRank] || '—' : '—'}
                tone="text-primary-600 dark:text-primary-400 text-xl"
                onClick={() => setActiveModule('reports')}
              />
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-5">
            <ProcessFlow currentKey={getPlanStage(myPlan, activePeriod)} onStepClick={(step) => setActiveModule(step.module)} />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SectionCard
            className="lg:col-span-2"
            title="Chỉ tiêu của tôi"
            action={<LinkButton onClick={() => setActiveModule('my-kpi')}>Cập nhật kết quả</LinkButton>}
          >
            {items.length === 0 ? (
              <EmptyLine>Chưa được giao chỉ tiêu trong kỳ này</EmptyLine>
            ) : (
              <ul className="space-y-4">
                {items.map((it) => (
                  <li key={it.id} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-slate-800 dark:text-slate-200 leading-snug" title={it.name}>
                        {it.name}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400 tabular-nums">
                        {it.actual ?? '—'} / {it.target} {it.unit}
                      </span>
                    </div>
                    <ProgressBar value={Math.min(100, it.progressPercent || 0)} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Sắp đến hạn">
            <DeadlineList tasks={upcomingTasks} />
          </SectionCard>
        </div>
      </div>
    );
  }

  const pendingCount = periodPlans.filter(
    (p) => ['ASSIGNED', 'ACCEPTED', 'SUBMITTED', 'FEEDBACK_REQUESTED'].includes(p.status) || p.evaluationStatus === 'SELF_EVALUATED'
  ).length;
  const evaluated = periodPlans.filter((p) => p.evaluationStatus === 'EVALUATED' && p.finalScore);
  const avgScore = evaluated.length
    ? Math.round((evaluated.reduce((s, p) => s + p.finalScore, 0) / evaluated.length) * 10) / 10
    : '—';
  const allItems = periodPlans.flatMap((p) => p.items || []);
  const reachedItems = allItems.filter((it) => (it.progressPercent || 0) >= 100).length;

  const todoList = periodPlans
    .map((p) => ({ plan: p, action: getNextAction(p, { isOwner: p.employeeId === currentUser?.id, period: activePeriod }) }))
    .filter(({ action }) => !action.text.startsWith('Chờ') && !action.text.startsWith('Đã'))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {header}

      <Card padding="none" className="overflow-hidden">
        <div className="grid grid-cols-2 xl:grid-cols-4 divide-x divide-y xl:divide-y-0 divide-slate-100 dark:divide-slate-800">
          <Metric label="Phiếu KPI" value={periodPlans.length} unit="phiếu" onClick={() => setActiveModule('library')} />
          <Metric
            label="Chờ xử lý"
            value={pendingCount}
            unit="phiếu"
            tone={pendingCount ? 'text-amber-600 dark:text-amber-400' : undefined}
            onClick={() => setActiveModule('team-kpi')}
          />
          <Metric label="Chỉ tiêu đã đạt" value={`${reachedItems}/${allItems.length}`} onClick={() => setActiveModule('my-kpi')} />
          <Metric label="Điểm trung bình" value={avgScore} onClick={() => setActiveModule('reports')} />
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-5">
          <ProcessFlow
            currentKey={PERIOD_STAGE[activePeriod?.status] || 'EXECUTION'}
            counts={stageCounts}
            onStepClick={(step) => setActiveModule(step.module)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Việc cần làm">
            {todoList.length === 0 ? (
              <EmptyLine>Không có việc tồn đọng</EmptyLine>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 -my-2">
                {todoList.map(({ plan, action }) => (
                  <li key={plan.id}>
                    <button
                      onClick={() => setActiveModule(action.module)}
                      className="w-full flex items-center gap-3 py-2.5 text-left group cursor-pointer"
                    >
                      <span className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-semibold shrink-0">
                        {plan.employeeName?.split(' ').pop()?.[0]}
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-snug">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{action.text}</span>
                        <span className="text-slate-400"> · {plan.employeeName}</span>
                      </span>
                      <ArrowRight size={16} className="text-slate-300 group-hover:text-primary-500 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Tiến độ theo đơn vị" description="Tỷ lệ hoàn thành chỉ tiêu trung bình của từng đơn vị trong kỳ.">
            <DepartmentKPIChart />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Xếp loại" description={isGov ? EXCELLENT_QUOTA_INFO : 'Phân bố theo đường cong chuẩn gắn quỹ thưởng.'}>
            <RankDistributionChart />
          </SectionCard>

          <SectionCard title="Sắp đến hạn">
            <DeadlineList tasks={upcomingTasks} showAssignee />
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
