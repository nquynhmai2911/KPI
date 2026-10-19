import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  TrendingUp,
  FileUp,
  RefreshCw,
  CheckCircle,
  FileText,
  Clock,
  Paperclip,
  Plus,
  Trash2,
  AlertTriangle,
  Server,
  Zap,
  MessageSquare,
  CheckCircle2,
  Play,
  Building,
  Target,
  History,
  ChevronDown,
} from 'lucide-react';
import { PageHeader } from '../../common/PageHeader';
import { SectionCard } from '../../common/SectionCard';
import { InfoTip } from '../../ui/InfoTip';

import { DateText } from '../../common/DateText';
import { NumberText } from '../../common/NumberText';
import { ProgressBar } from '../../common/ProgressBar';

import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Input } from '../../ui/Input';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { FormField } from '../../common/FormField';
import { Card } from '../../ui/Card';
import { ProcessFlow } from '../../common/ProcessFlow';
import { getPlanStage, getNextAction } from '../../../utils/labels';

const CHECKIN_STATUS = {
  PENDING: { label: 'Chờ xác nhận', variant: 'info' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'success' },
  NEEDS_REVISION: { label: 'Cần bổ sung', variant: 'warning' },
};

const SummaryMetric = ({ label, value, unit, tone = 'text-slate-900 dark:text-slate-100', info }) => (
  <div className="flex flex-col gap-1 px-6 py-4">
    <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
      {label}
      {info && <InfoTip size={13}>{info}</InfoTip>}
    </span>
    <span className={`text-2xl font-semibold tabular-nums tracking-tight ${tone}`}>
      {value}
      {unit && <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>}
    </span>
  </div>
);

export const Module3_TrackingExecution = () => {
  const {
    kpiPlans,
    currentUser,
    activePeriod,
    addCheckin,
    confirmCheckin,
    addEvidence,
    deleteEvidence,
    syncAPIData,
    add1on1Meeting,
    meetings1on1,
    runBackgroundSchedulerJob,
    schedulerJobLogs,
    systemOperatingMode,
    showToast,
    activeRole,
  } = useApp();
  const canVerify = ['SYSTEM_ADMIN', 'EXECUTIVE', 'UNIT_HEAD', 'LINE_MANAGER'].includes(activeRole);
  const canAdminister = ['SYSTEM_ADMIN', 'HR_OFFICER'].includes(activeRole);
  const visibleMeetings = canVerify
    ? meetings1on1
    : meetings1on1.filter((m) => m.employeeId === currentUser.id);

  // Active Tab: 'my-progress' (Tiến độ cá nhân), 'manager-review' (Xác nhận số liệu Quản lý), 'meetings-1on1' (Check-in 1:1), 'job-scheduler' (Job nền tự động), 'api-sync' (Tích hợp API)
  const [activeTab, setActiveTab] = useState('my-progress');
  const [selectedKpiItem, setSelectedKpiItem] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);
  const toggleItem = (id) =>
    setExpandedItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Check-in Modal Form (hỗ trợ nhiều file minh chứng)
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    actualValue: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    evidenceFiles: [
      { name: 'Báo_cáo_tiến_độ_thực_hiện.pdf', size: '2.1 MB' },
    ],
    newFileName: '',
  });

  // 1:1 Meeting Modal Form
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    employeeId: 'usr-04',
    employeeName: 'Phạm Đức Thắng',
    date: new Date().toISOString().split('T')[0],
    topics: 'Rà soát tiến độ chỉ tiêu và tháo gỡ khó khăn kết nối hạ tầng',
    progressNotes: 'Đã hoàn thành 95% mục tiêu cam kết giữa kỳ.',
    blockers: 'Cần mở cổng firewall kết nối máy chủ dữ liệu ngoài.',
    nextMeetingDate: '2026-10-30',
    actionItemsText: 'Kiểm thử tải đợt 2 trước ngày 25/10; Bàn giao tài liệu API trước 28/10',
  });

  // Verification Modal Form (Quản lý duyệt số liệu)
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingCheckin, setVerifyingCheckin] = useState(null);
  const [verifyPlanId, setVerifyPlanId] = useState(null);
  const [verifyItemId, setVerifyItemId] = useState(null);
  const [managerComment, setManagerComment] = useState('');

  // Find current plan
  const currentPlan =
    kpiPlans.find((p) => p.employeeId === currentUser.id && p.periodId === activePeriod.id) ||
    kpiPlans.find((p) => p.periodId === activePeriod.id) ||
    kpiPlans[0];

  const planItems = currentPlan ? currentPlan.items || [] : [];

  // Summary Metrics
  const totalKpis = planItems.length;
  const avgProgress =
    totalKpis > 0
      ? Math.round(planItems.reduce((sum, it) => sum + (it.progressPercent || 0), 0) / totalKpis)
      : 0;
  const reviewQueue = kpiPlans
    .filter((p) => p.periodId === activePeriod?.id && p.employeeId !== currentUser.id)
    .map((plan) => ({
      plan,
      rows: (plan.items || []).flatMap((item) =>
        (item.checkins || [])
          .filter((chk) => !chk.verificationStatus || chk.verificationStatus === 'PENDING')
          .map((chk) => ({ item, chk })),
      ),
    }))
    .filter((g) => g.rows.length > 0);
  const onTrackCount = planItems.filter((it) => (it.progressPercent || 0) >= 80).length;
  const atRiskCount = planItems.filter((it) => (it.progressPercent || 0) < 70).length;

  // Submit Check-in
  const handleSaveCheckin = (e) => {
    e.preventDefault();
    if (!selectedKpiItem || !checkinForm.actualValue) return;

    const fileSummary = checkinForm.evidenceFiles.map((f) => f.name).join(', ');
    addCheckin(currentPlan.id, selectedKpiItem.id, {
      actualValue: checkinForm.actualValue,
      date: checkinForm.date,
      note: checkinForm.note,
      evidenceName: fileSummary || 'Tài_liệu_minh_chứng_kèm_theo.pdf',
    });

    setShowCheckinModal(false);
    setCheckinForm({
      actualValue: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      evidenceFiles: [{ name: 'Báo_cáo_tiến_độ_thực_hiện.pdf', size: '2.1 MB' }],
      newFileName: '',
    });
  };

  // Submit 1:1 Meeting
  const handleSaveMeeting = (e) => {
    e.preventDefault();
    const actionItems = meetingForm.actionItemsText
      .split(';')
      .filter((t) => t.trim())
      .map((t, idx) => ({
        id: `act-${Date.now()}-${idx}`,
        task: t.trim(),
        assignee: meetingForm.employeeName,
        dueDate: meetingForm.nextMeetingDate,
        status: 'PENDING',
      }));

    add1on1Meeting({
      employeeId: meetingForm.employeeId,
      employeeName: meetingForm.employeeName,
      date: meetingForm.date,
      topics: meetingForm.topics,
      progressNotes: meetingForm.progressNotes,
      blockers: meetingForm.blockers,
      nextMeetingDate: meetingForm.nextMeetingDate,
      actionItems,
    });

    setShowMeetingModal(false);
  };

  // Handle Verify Checkin
  const handleConfirmVerification = (status) => {
    if (!verifyPlanId || !verifyItemId || !verifyingCheckin) return;
    confirmCheckin(verifyPlanId, verifyItemId, verifyingCheckin.id, status, managerComment);
    setShowVerifyModal(false);
    setVerifyingCheckin(null);
    setManagerComment('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thực hiện & cập nhật kết quả"
        subtitle="Cán bộ cập nhật kết quả định kỳ kèm minh chứng; quản lý xác nhận số liệu và trao đổi 1:1 khi chỉ tiêu chậm tiến độ. Hệ thống tự cảnh báo chỉ tiêu dưới 70%."
      />

      <SegmentedControl
        options={[
          { value: 'my-progress', label: 'Tiến độ của tôi', icon: TrendingUp },
          ...(canVerify ? [{ value: 'manager-review', label: 'Xác nhận số liệu', icon: CheckCircle, badge: reviewQueue.reduce((n, g) => n + g.rows.length, 0) }] : []),
          { value: 'meetings-1on1', label: 'Trao đổi 1:1', icon: MessageSquare, badge: visibleMeetings.length },
          ...(canVerify || canAdminister
            ? [
                { value: 'job-scheduler', label: 'Cảnh báo tự động', icon: Clock },
                { value: 'api-sync', label: 'Kết nối dữ liệu', icon: Server },
              ]
            : []),
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val)}
      />

      {activeTab === 'my-progress' && currentPlan && (
        <Card padding="none">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5 px-6 py-5">
            <div className="flex items-center gap-3 lg:w-64 shrink-0">
              <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Target size={20} />
              </span>
              <div className="min-w-0">
                <div className="text-xs text-slate-500">Việc cần làm</div>
                <div className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                  {getNextAction(currentPlan, { isOwner: currentPlan.employeeId === currentUser.id, period: activePeriod }).text}
                </div>
              </div>
            </div>
            <ProcessFlow className="flex-1" currentKey={getPlanStage(currentPlan, activePeriod)} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-slate-100 dark:border-slate-800 divide-x divide-y lg:divide-y-0 divide-slate-100 dark:divide-slate-800">
            <SummaryMetric label="Số chỉ tiêu" value={totalKpis} />
            <SummaryMetric
              label="Tiến độ trung bình"
              value={avgProgress}
              unit="%"
              tone={avgProgress >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
            />
            <SummaryMetric label="Đạt từ 80%" value={onTrackCount} unit={`/ ${totalKpis}`} />
            <SummaryMetric
              label="Dưới 70%"
              value={atRiskCount}
              unit={`/ ${totalKpis}`}
              tone={atRiskCount > 0 ? 'text-red-600 dark:text-red-400' : undefined}
              info="Chỉ tiêu dưới 70% cần lập biên bản trao đổi 1:1 với quản lý."
            />
          </div>
        </Card>
      )}

      {/* ==============================================================================
          TAB 1: TIẾN ĐỘ CÁ NHÂN & CẬP NHẬT KẾT QUẢ / MINH CHỨNG
          ============================================================================== */}
      {activeTab === 'my-progress' && (
        <Card padding="none">
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Chỉ tiêu trong kỳ</h3>
              <InfoTip>Bấm “Cập nhật” để nhập kết quả, đính kèm minh chứng. Mỗi lần cập nhật cần quản lý xác nhận mới được tính vào kết quả.</InfoTip>
            </div>
            <span className="text-sm text-slate-500">Tổng trọng số <b className="text-slate-900 dark:text-slate-100 tabular-nums">{currentPlan?.totalWeight || 100}%</b></span>
          </div>

          <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_120px_120px_180px_112px] gap-6 px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500">
            <span>Chỉ tiêu</span>
            <span>Mục tiêu</span>
            <span>Thực tế</span>
            <span>Hoàn thành</span>
            <span />
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {planItems.map((item) => {
              const checkins = item.checkins || [];
              const pending = checkins.filter((c) => !c.verificationStatus || c.verificationStatus === 'PENDING').length;
              const open = expandedItems.includes(item.id);
              return (
                <div key={item.id} className="px-6 py-4">
                  <div className="grid grid-cols-2 lg:grid-cols-[minmax(0,1fr)_120px_120px_180px_112px] gap-x-6 gap-y-3 items-center">
                    <div className="col-span-2 lg:col-span-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">{item.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span className="font-mono text-primary-600 dark:text-primary-400">{item.kpiCode || item.code}</span>
                        <span>·</span>
                        <span>{item.category}</span>
                        <span>·</span>
                        <span className="tabular-nums">Trọng số {item.weight}%</span>
                      </div>
                      <button
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          disabled={!checkins.length}
                          className="mt-1.5 inline-flex text-xs disabled:cursor-default items-center gap-1 font-medium text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 cursor-pointer"
                        >
                          <History size={13} />
                          {checkins.length ? `${checkins.length} lần cập nhật` : 'Chưa cập nhật'}
                          {pending > 0 && <Badge variant="info" size="sm">{pending} chờ xác nhận</Badge>}
                          {checkins.length > 0 && <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
                      </button>
                    </div>
                    <div>
                      <div className="lg:hidden text-xs text-slate-500">Mục tiêu</div>
                      <div className="text-sm font-medium tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <NumberText value={item.target} /> {item.unit}
                      </div>
                    </div>
                    <div>
                      <div className="lg:hidden text-xs text-slate-500">Thực tế</div>
                      <div className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <NumberText value={item.actual || 0} /> {item.unit}
                      </div>
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <ProgressBar progress={item.progressPercent || 0} showLabel size="sm" />
                    </div>
                    <div className="col-span-2 lg:col-span-1 flex lg:justify-end">
                      {currentPlan.employeeId === currentUser.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={FileUp}
                          onClick={() => {
                            setSelectedKpiItem(item);
                            setShowCheckinModal(true);
                          }}
                        >
                          Cập nhật
                        </Button>
                      )}
                    </div>
                  </div>

                  {open && checkins.length > 0 && (
                    <ol className="mt-4 ml-1 space-y-4 border-l-2 border-slate-100 dark:border-slate-800 pl-5">
                      {checkins.map((chk) => (
                        <li key={chk.id} className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-sm">
                          <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-slate-300 dark:bg-slate-600" />
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                                {chk.actualValue} {item.unit}
                              </span>
                              <span className="text-xs text-slate-500 tabular-nums"><DateText date={chk.date} /></span>
                              <Badge variant={CHECKIN_STATUS[chk.verificationStatus]?.variant || 'info'} size="sm">
                                {CHECKIN_STATUS[chk.verificationStatus]?.label || 'Chờ xác nhận'}
                              </Badge>
                            </div>
                            {chk.note && <p className="text-slate-600 dark:text-slate-400 leading-snug">{chk.note}</p>}
                            {chk.evidenceName && (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400">
                                <Paperclip size={13} />
                                <span className="break-all">{chk.evidenceName}</span>
                              </div>
                            )}
                            {chk.managerComment && (
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                <MessageSquare size={12} className="inline mr-1 -mt-0.5" />
                                {chk.verifiedBy}: “{chk.managerComment}”
                              </p>
                            )}
                          </div>
                          {canVerify && currentPlan.employeeId !== currentUser.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setVerifyPlanId(currentPlan.id);
                                setVerifyItemId(item.id);
                                setVerifyingCheckin(chk);
                                setShowVerifyModal(true);
                              }}
                            >
                              Xác nhận
                            </Button>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ==============================================================================
          TAB 2: QUẢN LÝ XÉT DUYỆT SỐ LIỆU (MANAGER REVIEW & VERIFICATION)
          ============================================================================== */}
      {activeTab === 'manager-review' && (
        <Card padding="none">
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Số liệu chờ xác nhận</h3>
              <InfoTip>Kiểm tra số liệu thực tế và minh chứng cán bộ gửi lên. Chỉ số liệu đã xác nhận mới được tính vào kết quả đánh giá.</InfoTip>
            </div>
            <span className="text-sm text-slate-500">
              <b className="text-slate-900 dark:text-slate-100 tabular-nums">{reviewQueue.reduce((n, g) => n + g.rows.length, 0)}</b> lượt cập nhật
            </span>
          </div>

          {reviewQueue.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-sm text-slate-500">
              <CheckCircle2 size={28} className="text-emerald-500" />
              Không còn số liệu nào chờ xác nhận.
            </div>
          ) : (
            reviewQueue.map(({ plan, rows }) => (
              <div key={plan.id} className="border-b last:border-b-0 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-800/50">
                  <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 flex items-center justify-center text-xs font-semibold shrink-0">
                    {plan.employeeName.split(' ').pop()?.[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{plan.employeeName}</span>
                    <span className="ml-2 text-xs text-slate-500">{plan.departmentName}</span>
                  </div>
                  <Badge variant="info" size="sm">{rows.length} chờ xác nhận</Badge>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map(({ item, chk }) => (
                    <div key={chk.id} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)_auto] gap-x-6 gap-y-2 items-center px-6 py-3.5">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">{item.name}</div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          Mục tiêu <NumberText value={item.target} /> {item.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {chk.actualValue} {item.unit}
                        </div>
                        <div className="text-xs text-slate-500"><DateText date={chk.date} /></div>
                      </div>
                      <div className="min-w-0 text-sm text-slate-600 dark:text-slate-400 leading-snug">
                        {chk.note}
                        {chk.evidenceName && (
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400">
                            <Paperclip size={13} className="shrink-0" />
                            <span className="break-all">{chk.evidenceName}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={CheckCircle}
                        onClick={() => {
                          setVerifyPlanId(plan.id);
                          setVerifyItemId(item.id);
                          setVerifyingCheckin(chk);
                          setShowVerifyModal(true);
                        }}
                      >
                        Xác nhận
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {/* ==============================================================================
          TAB 3: CHECK-IN / 1:1 ĐỊNH KỲ (MEETINGS 1:1) (Yêu cầu Phase 3)
          ============================================================================== */}
      {activeTab === 'meetings-1on1' && (
        <SectionCard
          icon={MessageSquare}
          title="Biên bản trao đổi 1:1"
          description="Quản lý và cán bộ trao đổi định kỳ: nội dung, khó khăn vướng mắc, việc cần làm tiếp và lịch hẹn lần sau."
          action={
            canVerify && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setShowMeetingModal(true)}
              >
                Tạo biên bản
              </Button>
            )
          }
        >
          <div className="space-y-4">
            {visibleMeetings.map((meet) => (
              <div
                key={meet.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 flex items-center justify-center font-bold">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {meet.employeeName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {meet.managerName} · <DateText date={meet.date} />
                      </p>
                    </div>
                  </div>
                  <Badge variant="good">
                    {meet.status === 'COMPLETED' ? 'Đã trao đổi' : 'Đã lên lịch'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1">
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      Nội dung
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {meet.topics}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1">
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      Kết quả đạt được
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {meet.progressNotes}
                    </p>
                  </div>
                </div>

                {meet.blockers && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Vướng mắc:</strong> {meet.blockers}
                    </div>
                  </div>
                )}

                {/* Action Items */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    Việc cần làm tiếp
                  </div>
                  <div className="space-y-1.5">
                    {meet.actionItems?.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary-600" />
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {act.task}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 tabular-nums">
                          <span>Hạn: <DateText date={act.dueDate} /></span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Hẹn lần sau: <strong>{meet.nextMeetingDate || 'Sau 2 tuần'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ==============================================================================
          TAB 4: JOB NỀN TỰ ĐỘNG & CẢNH BÁO TIẾN ĐỘ (Yêu cầu Phase 3)
          ============================================================================== */}
      {activeTab === 'job-scheduler' && (
        <SectionCard
          icon={Clock}
          title="Cảnh báo tự động"
          description={
            <ul className="list-disc pl-4 space-y-1">
              <li>Nhắc cán bộ trước hạn 3 ngày.</li>
              <li>Cảnh báo chỉ tiêu dưới 70% khi kỳ đã qua hơn nửa thời gian.</li>
              <li>Gửi qua mục Thông báo và email công vụ.</li>
            </ul>
          }
          action={
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              onClick={runBackgroundSchedulerJob}
            >
              Quét ngay
            </Button>
          }
        >
          <div className="space-y-4">
            {/* Scheduler Logs */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-500">Lịch sử quét</div>
              <div className="space-y-2">
                {schedulerJobLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <strong className="text-slate-900 dark:text-slate-100">
                          {log.timestamp}
                        </strong>
                      </div>
                      <Badge variant="good">{log.status === 'SUCCESS' ? 'Thành công' : log.status}</Badge>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {log.message}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 tabular-nums">
                      <span>Đã quét <strong>{log.scannedKpisCount}</strong></span>
                      <span>Nguy cơ <strong className="text-amber-600">{log.atRiskCount}</strong></span>
                      <span>Thông báo <strong className="text-primary-600">{log.notificationsCreated}</strong></span>
                      <span>Email <strong className="text-emerald-600">{log.emailsSimulated}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ==============================================================================
          TAB 5: CỔNG TÍCH HỢP DỮ LIỆU TỰ ĐỘNG (API INTEGRATIONS)
          ============================================================================== */}
      {activeTab === 'api-sync' && (
        <SectionCard
          icon={Server}
          title="Kết nối dữ liệu"
          description="Tự động lấy số liệu thực tế từ các hệ thống khác, không cần nhập tay."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h4 className="font-bold text-sm">Quản lý công việc</h4>
              <p className="text-xs text-slate-500">Tỷ lệ việc hoàn thành đúng hạn, việc tồn đọng.</p>
              <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => syncAPIData('jira')}>
                Đồng bộ
              </Button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <h4 className="font-bold text-sm">Chấm công</h4>
              <p className="text-xs text-slate-500">Tỷ lệ đi làm đúng giờ, ngày công.</p>
              <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => syncAPIData('timesheet')}>
                Đồng bộ
              </Button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Building size={20} />
              </div>
              <h4 className="font-bold text-sm">Doanh thu & hợp đồng</h4>
              <p className="text-xs text-slate-500">Doanh số thực thu, số hợp đồng ký trong kỳ.</p>
              <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => syncAPIData('crm')}>
                Đồng bộ
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Modal Cập nhật Check-in & Đính kèm Minh chứng */}
      {showCheckinModal && selectedKpiItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Cập nhật kết quả: {selectedKpiItem.name}
            </h3>

            <form onSubmit={handleSaveCheckin} className="space-y-4 text-xs">
              <FormField label="Giá trị thực tế" required hint={`Đơn vị tính: ${selectedKpiItem.unit}`}>
                <Input
                  type="number"
                  step="any"
                  required
                  placeholder={`Mục tiêu: ${selectedKpiItem.target}`}
                  value={checkinForm.actualValue}
                  onChange={(e) => setCheckinForm({ ...checkinForm, actualValue: e.target.value })}
                />
              </FormField>

              <FormField label="Ngày cập nhật" required>
                <Input
                  type="date"
                  required
                  value={checkinForm.date}
                  onChange={(e) => setCheckinForm({ ...checkinForm, date: e.target.value })}
                />
              </FormField>

              <FormField label="Ghi chú">
                <textarea
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  placeholder="Mô tả công việc đã triển khai, các yếu tố hỗ trợ hoặc rào cản..."
                  value={checkinForm.note}
                  onChange={(e) => setCheckinForm({ ...checkinForm, note: e.target.value })}
                />
              </FormField>

              {/* Danh sách file minh chứng đính kèm (Yêu cầu Phase 3) */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Minh chứng đính kèm
                </label>
                <div className="space-y-1.5">
                  {checkinForm.evidenceFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-primary-600" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{f.name}</span>
                        <span className="text-[10px] text-slate-400">({f.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCheckinForm({
                            ...checkinForm,
                            evidenceFiles: checkinForm.evidenceFiles.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Tên tệp, VD: Quyet_dinh.pdf"
                    value={checkinForm.newFileName}
                    onChange={(e) => setCheckinForm({ ...checkinForm, newFileName: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (checkinForm.newFileName.trim()) {
                        setCheckinForm({
                          ...checkinForm,
                          evidenceFiles: [
                            ...checkinForm.evidenceFiles,
                            { name: checkinForm.newFileName.trim(), size: '1.8 MB' },
                          ],
                          newFileName: '',
                        });
                      }
                    }}
                  >
                    Thêm
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setShowCheckinModal(false)}>
                  Hủy
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Lưu kết quả & Gửi quản lý duyệt
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Check-in 1:1 */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Biên bản trao đổi 1:1
            </h3>

            <form onSubmit={handleSaveMeeting} className="space-y-4 text-xs">
              <FormField label="Cán bộ tham dự" required>
                <Input
                  value={meetingForm.employeeName}
                  onChange={(e) => setMeetingForm({ ...meetingForm, employeeName: e.target.value })}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Ngày trao đổi" required>
                  <Input
                    type="date"
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                  />
                </FormField>
                <FormField label="Hẹn lần sau" required>
                  <Input
                    type="date"
                    value={meetingForm.nextMeetingDate}
                    onChange={(e) => setMeetingForm({ ...meetingForm, nextMeetingDate: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Nội dung trao đổi" required>
                <Input
                  value={meetingForm.topics}
                  onChange={(e) => setMeetingForm({ ...meetingForm, topics: e.target.value })}
                />
              </FormField>

              <FormField label="Kết quả đạt được">
                <textarea
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  value={meetingForm.progressNotes}
                  onChange={(e) => setMeetingForm({ ...meetingForm, progressNotes: e.target.value })}
                />
              </FormField>

              <FormField label="Vướng mắc cần hỗ trợ">
                <textarea
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  value={meetingForm.blockers}
                  onChange={(e) => setMeetingForm({ ...meetingForm, blockers: e.target.value })}
                />
              </FormField>

              <FormField label="Việc cần làm tiếp" hint="Mỗi việc cách nhau bằng dấu chấm phẩy (;)">
                <Input
                  value={meetingForm.actionItemsText}
                  onChange={(e) => setMeetingForm({ ...meetingForm, actionItemsText: e.target.value })}
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setShowMeetingModal(false)}>
                  Hủy
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Lưu biên bản
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quản lý Xét duyệt Số liệu */}
      {showVerifyModal && verifyingCheckin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Xác nhận số liệu
            </h3>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <div>Giá trị: <strong className="text-primary-600">{verifyingCheckin.actualValue}</strong></div>
              <div>Ngày: <strong>{verifyingCheckin.date}</strong></div>
              <div>Minh chứng: <strong>{verifyingCheckin.evidenceName || 'Không có file'}</strong></div>
              <div>Ghi chú: {verifyingCheckin.note}</div>
            </div>

            <FormField label="Ý kiến của quản lý">
              <textarea
                rows={3}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                placeholder="Nhập nhận xét hoặc yêu cầu bổ sung thêm minh chứng..."
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setShowVerifyModal(false)}>
                Đóng
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfirmVerification('NEEDS_REVISION')}
              >
                Yêu cầu bổ sung
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleConfirmVerification('CONFIRMED')}
              >
                Xác nhận số liệu hợp lệ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
