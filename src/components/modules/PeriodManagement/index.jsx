import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  CalendarCog,
  Plus,
  CalendarDays,
  ArrowRight,
  Lock,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  ClipboardCheck,
  X,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../common/PageHeader';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { FormField } from '../../common/FormField';
import { InfoTip } from '../../ui/InfoTip';

const PERIOD_FLOW = [
  { status: 'REGISTRATION', label: 'Giao chỉ tiêu', icon: ClipboardList, statusName: 'Đang giao chỉ tiêu' },
  { status: 'IN_PROGRESS', label: 'Thực hiện', icon: TrendingUp, statusName: 'Đang thực hiện' },
  { status: 'EVALUATING', label: 'Đánh giá', icon: ClipboardCheck, statusName: 'Đang đánh giá' },
  { status: 'CLOSED', label: 'Khóa sổ', icon: Lock, statusName: 'Đã khóa sổ' },
];

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const EMPTY_FORM = {
  name: '',
  type: 'QUARTER',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  evaluationDeadline: '',
};

export const PeriodManagement = () => {
  const { periods, addPeriod, updatePeriodStatus, kpiPlans, activePeriod, setActivePeriodId, activeRole } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const canManage = ['SYSTEM_ADMIN', 'HR_OFFICER'].includes(activeRole);

  const handleCreate = (e) => {
    e.preventDefault();
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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarCog}
        title="Kỳ đánh giá"
        subtitle="Mỗi kỳ đi qua 4 giai đoạn: Giao chỉ tiêu → Thực hiện → Đánh giá → Khóa sổ. Chỉ Tổ chức cán bộ hoặc Quản trị hệ thống được chuyển giai đoạn."
        actions={
          canManage && (
            <Button icon={Plus} onClick={() => setShowForm(true)}>
              Mở kỳ mới
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {periods.map((p) => {
          const stepIdx = Math.max(0, PERIOD_FLOW.findIndex((s) => s.status === p.status));
          const next = PERIOD_FLOW[stepIdx + 1];
          const plans = kpiPlans.filter((pl) => pl.periodId === p.id);
          const evaluated = plans.filter((pl) => pl.evaluationStatus === 'EVALUATED').length;
          const isActive = activePeriod?.id === p.id;

          return (
            <Card key={p.id} className={isActive ? 'ring-2 ring-primary-500/40 border-primary-300 dark:border-primary-700' : ''}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{p.name}</h3>
                    {p.description && <InfoTip>{p.description}</InfoTip>}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <CalendarDays size={14} />
                    {formatDate(p.startDate)} – {formatDate(p.endDate)}
                  </div>
                </div>
                {isActive ? (
                  <span className="whitespace-nowrap inline-flex items-center gap-1 text-xs font-medium text-primary-700 bg-primary-50 dark:text-primary-300 dark:bg-primary-950/60 px-2 py-1 rounded-lg shrink-0">
                    <CheckCircle2 size={14} /> Đang xem
                  </span>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setActivePeriodId(p.id)}>
                    Xem kỳ này
                  </Button>
                )}
              </div>

              {/* Giai đoạn của kỳ */}
              <div className="mt-6 grid grid-cols-4 gap-2">
                {PERIOD_FLOW.map((s, i) => {
                  const Icon = s.icon;
                  const done = i < stepIdx || p.status === 'CLOSED';
                  const current = i === stepIdx && p.status !== 'CLOSED';
                  return (
                    <div key={s.status} className="flex flex-col items-center gap-1.5 text-center">
                      <div className="w-full flex items-center">
                        <span className={`flex-1 h-0.5 ${i === 0 ? 'invisible' : done || current ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            current
                              ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                              : done
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                          }`}
                        >
                          {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                        </span>
                        <span className={`flex-1 h-0.5 ${i === PERIOD_FLOW.length - 1 ? 'invisible' : done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      </div>
                      <span className={`text-xs ${current ? 'font-semibold text-primary-700 dark:text-primary-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                  <div className="text-xs text-slate-500">Hạn giao chỉ tiêu</div>
                  <div className="mt-0.5 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">{formatDate(p.registrationDeadline)}</div>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                  <div className="text-xs text-slate-500">Hạn đánh giá</div>
                  <div className="mt-0.5 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">{formatDate(p.evaluationDeadline)}</div>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                  <div className="text-xs text-slate-500 flex items-center gap-1"><Users size={12} /> Đã đánh giá</div>
                  <div className="mt-0.5 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                    {evaluated}/{plans.length} phiếu
                  </div>
                </div>
              </div>

              {canManage && next && (
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button
                    variant={next.status === 'CLOSED' ? 'outline' : 'primary'}
                    size="sm"
                    rightIcon={next.status === 'CLOSED' ? Lock : ArrowRight}
                    onClick={() => {
                      if (next.status === 'CLOSED' && !window.confirm('Khóa sổ kỳ này? Sau khi khóa không thể sửa số liệu.')) return;
                      updatePeriodStatus(p.id, next.status, next.statusName);
                    }}
                  >
                    Chuyển sang: {next.label}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarCog className="w-5 h-5 text-primary-600" /> Mở kỳ đánh giá mới
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Đóng">
                <X size={16} />
              </button>
            </div>
            <FormField label="Tên kỳ" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Kỳ đánh giá Quý 1 / 2027" />
            </FormField>
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
              <FormField label="Hạn đánh giá" hint="Hạn chót hoàn thành tự đánh giá và cấp trên đánh giá.">
                <Input type="date" value={form.evaluationDeadline} onChange={(e) => setForm({ ...form, evaluationDeadline: e.target.value })} />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Hủy</Button>
              <Button type="submit" icon={Plus}>Mở kỳ</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
