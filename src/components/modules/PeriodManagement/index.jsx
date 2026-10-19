import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { CalendarCog, Plus, ArrowRight, Lock, Check, ClipboardList, TrendingUp, ClipboardCheck, Eye } from 'lucide-react';
import { PageHeader } from '../../common/PageHeader';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Badge } from '../../ui/Badge';
import { FormField } from '../../common/FormField';
import { ProgressBar } from '../../common/ProgressBar';
import { InfoTip } from '../../ui/InfoTip';
import { calculateDaysLeft } from '../../../types/kpiTaskSchema';

const PERIOD_FLOW = [
  { status: 'REGISTRATION', label: 'Giao chỉ tiêu', icon: ClipboardList, statusName: 'Đang giao chỉ tiêu', dateKey: 'registrationDeadline', dateLabel: 'Hạn' },
  { status: 'IN_PROGRESS', label: 'Thực hiện', icon: TrendingUp, statusName: 'Đang thực hiện', dateKey: 'endDate', dateLabel: 'Đến' },
  { status: 'EVALUATING', label: 'Đánh giá', icon: ClipboardCheck, statusName: 'Đang đánh giá', dateKey: 'evaluationDeadline', dateLabel: 'Hạn' },
  { status: 'CLOSED', label: 'Khóa sổ', icon: Lock, statusName: 'Đã khóa sổ' },
];

const STATUS_VARIANT = { REGISTRATION: 'warning', IN_PROGRESS: 'primary', EVALUATING: 'purple', CLOSED: 'default' };

const STAGE_COUNTDOWN = {
  REGISTRATION: 'tới hạn giao chỉ tiêu',
  IN_PROGRESS: 'đến cuối kỳ',
  EVALUATING: 'tới hạn đánh giá',
};

const statusLabel = (p) => PERIOD_FLOW.find((s) => s.status === p.status)?.statusName || p.statusName;

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const EMPTY_FORM = {
  name: '',
  type: 'QUARTER',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  evaluationDeadline: '',
};

const periodStats = (plans) => {
  const accepted = plans.filter((pl) => ['ACCEPTED', 'APPROVED', 'LOCKED'].includes(pl.status)).length;
  const approved = plans.filter((pl) => ['APPROVED', 'LOCKED'].includes(pl.status)).length;
  const evaluated = plans.filter((pl) => pl.evaluationStatus === 'EVALUATED').length;
  return { total: plans.length, accepted, approved, evaluated };
};

const StageFlow = ({ period }) => {
  const stepIdx = Math.max(0, PERIOD_FLOW.findIndex((s) => s.status === period.status));
  const closed = period.status === 'CLOSED';
  return (
    <ol className="grid grid-cols-4">
      {PERIOD_FLOW.map((s, i) => {
        const Icon = s.icon;
        const done = i < stepIdx || closed;
        const current = i === stepIdx && !closed;
        return (
          <li key={s.status} className="relative flex flex-col items-center text-center gap-1.5">
            {i < PERIOD_FLOW.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute top-5 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-0.5 rounded-full ${
                  done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                current
                  ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/60'
                  : done
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}
            >
              {done ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} />}
            </span>
            <span className={`text-sm ${current ? 'font-semibold text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400'}`}>
              {s.label}
            </span>
            <span className="text-xs text-slate-400 tabular-nums h-4">
              {s.dateKey && period[s.dateKey] ? `${s.dateLabel} ${formatDate(period[s.dateKey])}` : ''}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export const PeriodManagement = () => {
  const { periods, addPeriod, updatePeriodStatus, kpiPlans, activePeriod, setActivePeriodId, activeRole } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const canManage = ['SYSTEM_ADMIN', 'HR_OFFICER'].includes(activeRole);
  const current = activePeriod || periods[0];

  const handleCreate = (e) => {
    e?.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) return;
    addPeriod({
      ...form,
      code: `KPI-${form.startDate.slice(0, 4)}-${Date.now().toString().slice(-4)}`,
      typeName: { MONTH: 'Định kỳ tháng', QUARTER: 'Định kỳ quý', HALF: 'Định kỳ 6 tháng', YEAR: 'Tổng kết năm' }[form.type],
      allowEvidenceUpload: true,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const stepIdx = Math.max(0, PERIOD_FLOW.findIndex((s) => s.status === current?.status));
  const currentStage = PERIOD_FLOW[stepIdx];
  const next = PERIOD_FLOW[stepIdx + 1];
  const stats = periodStats(kpiPlans.filter((pl) => pl.periodId === current?.id));
  const stageDeadline = currentStage?.dateKey ? current?.[currentStage.dateKey] : null;
  const daysLeft = stageDeadline ? calculateDaysLeft(stageDeadline) : null;

  const advance = () => {
    if (next.status === 'CLOSED' && !window.confirm('Khóa sổ kỳ này? Sau khi khóa không thể sửa số liệu.')) return;
    updatePeriodStatus(current.id, next.status, next.statusName);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kỳ đánh giá"
        subtitle="Mỗi kỳ đi qua 4 giai đoạn: Giao chỉ tiêu, Thực hiện, Đánh giá, Khóa sổ. Chỉ Tổ chức cán bộ hoặc Quản trị hệ thống được chuyển giai đoạn."
        actions={
          canManage && (
            <Button icon={Plus} onClick={() => setShowForm(true)}>
              Mở kỳ mới
            </Button>
          )
        }
      />

      {current && (
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{current.name}</h2>
                <Badge size="sm" variant={STATUS_VARIANT[current.status]}>{statusLabel(current)}</Badge>
                {current.description && <InfoTip>{current.description}</InfoTip>}
              </div>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                {formatDate(current.startDate)} – {formatDate(current.endDate)}
                {daysLeft !== null && current.status !== 'CLOSED' && (
                  <span className={daysLeft < 0 ? 'text-rose-600' : daysLeft <= 7 ? 'text-amber-600' : ''}>
                    {' · '}
                    {daysLeft < 0
                      ? `Quá ${-daysLeft} ngày ${STAGE_COUNTDOWN[current.status]}`
                      : `Còn ${daysLeft} ngày ${STAGE_COUNTDOWN[current.status]}`}
                  </span>
                )}
              </p>
            </div>
            {canManage && next && (
              <Button
                variant={next.status === 'CLOSED' ? 'outline' : 'primary'}
                size="sm"
                rightIcon={next.status === 'CLOSED' ? Lock : ArrowRight}
                onClick={advance}
              >
                {next.status === 'CLOSED' ? 'Khóa sổ kỳ' : `Chuyển sang ${next.label.toLowerCase()}`}
              </Button>
            )}
          </div>

          <div className="px-6 py-6">
            <StageFlow period={current} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
            {[
              { label: 'Cán bộ đã xác nhận', done: stats.accepted },
              { label: 'Đã phê duyệt chỉ tiêu', done: stats.approved },
              { label: 'Đã đánh giá', done: stats.evaluated },
            ].map((m) => ({ ...m, value: `${m.done}/${stats.total}`, pct: stats.total ? (m.done / stats.total) * 100 : 0 })).map((m) => (
              <div key={m.label} className="px-6 py-4 space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{m.label}</span>
                  <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">{m.value}</span>
                </div>
                <ProgressBar value={Math.round(m.pct)} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Tất cả các kỳ</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-medium text-slate-500">
              <tr>
                <th className="px-6 py-2.5">Tên kỳ</th>
                <th className="px-4 py-2.5">Thời gian</th>
                <th className="px-4 py-2.5">Giai đoạn</th>
                <th className="px-4 py-2.5 text-right">Đã đánh giá</th>
                <th className="px-6 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {periods.map((p) => {
                const s = periodStats(kpiPlans.filter((pl) => pl.periodId === p.id));
                const isActive = current?.id === p.id;
                return (
                  <tr key={p.id} className={isActive ? 'bg-primary-50/40 dark:bg-primary-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}>
                    <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500 tabular-nums whitespace-nowrap">
                      {formatDate(p.startDate)} – {formatDate(p.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge size="sm" variant={STATUS_VARIANT[p.status]}>{statusLabel(p)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {s.total ? `${s.evaluated}/${s.total}` : '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {isActive ? (
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400 whitespace-nowrap">Đang xem</span>
                      ) : (
                        <Button size="sm" variant="ghost" icon={Eye} onClick={() => setActivePeriodId(p.id)}>
                          Xem
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={showForm}
        title="Mở kỳ đánh giá mới"
        icon={CalendarCog}
        onClose={() => setShowForm(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button icon={Plus} onClick={handleCreate} disabled={!form.name || !form.startDate || !form.endDate}>
              Mở kỳ
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <FormField label="Tên kỳ" required>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Kỳ đánh giá Quý 1 / 2027" />
              </FormField>
            </div>
            <FormField label="Loại kỳ">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              >
                <option value="MONTH">Tháng</option>
                <option value="QUARTER">Quý</option>
                <option value="HALF">6 tháng</option>
                <option value="YEAR">Năm</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Bắt đầu" required>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </FormField>
            <FormField label="Kết thúc" required>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </FormField>
            <FormField label="Hạn giao chỉ tiêu" hint="Sau hạn này phiếu KPI bị khóa, chỉ điều chỉnh giữa kỳ khi có lý do.">
              <Input type="date" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} />
            </FormField>
            <FormField label="Hạn đánh giá" hint="Hạn chót tự đánh giá và cấp trên đánh giá.">
              <Input type="date" value={form.evaluationDeadline} onChange={(e) => setForm({ ...form, evaluationDeadline: e.target.value })} />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
};
