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
  ExternalLink,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Server,
  Zap,
  Users,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  Eye,
  Building,
  Target,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../../common/PageHeader';
import { SectionCard } from '../../common/SectionCard';
import { StatCard } from '../../common/StatCard';
import { DataTable } from '../../common/DataTable';
import { UserAvatarCell } from '../../common/UserAvatarCell';
import { DateText } from '../../common/DateText';
import { NumberText } from '../../common/NumberText';
import { ProgressBar } from '../../common/ProgressBar';
import { StatusBadge } from '../../common/StatusBadge';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Input } from '../../ui/Input';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { FormField } from '../../common/FormField';
import { Card } from '../../ui/Card';
import { ProcessFlow } from '../../common/ProcessFlow';
import { getPlanStage, getNextAction } from '../../../utils/labels';

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
    topics: 'Rà soát tiến độ chỉ tiêu sprint và tháo gỡ khó khăn kết nối hạ tầng',
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
        icon={TrendingUp}
        title="Thực hiện & cập nhật kết quả"
        subtitle="Cán bộ cập nhật kết quả định kỳ kèm minh chứng; quản lý xác nhận số liệu và trao đổi 1:1 khi chỉ tiêu chậm tiến độ. Hệ thống tự cảnh báo chỉ tiêu dưới 70%."
      />

      <SegmentedControl
        options={[
          { value: 'my-progress', label: 'Tiến độ của tôi', icon: TrendingUp },
          ...(canVerify ? [{ value: 'manager-review', label: 'Xác nhận số liệu', icon: CheckCircle }] : []),
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
        <Card padding="sm" className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-3 lg:w-72 shrink-0 px-2">
            <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Target size={20} />
            </span>
            <div className="min-w-0">
              <div className="text-xs text-slate-500">Việc cần làm</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {getNextAction(currentPlan, { isOwner: currentPlan.employeeId === currentUser.id, period: activePeriod }).text}
              </div>
            </div>
          </div>
          <ProcessFlow className="flex-1" currentKey={getPlanStage(currentPlan, activePeriod)} />
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Số chỉ tiêu" value={totalKpis} unit="chỉ tiêu" icon={Target} color="primary" subtext={`Phiếu KPI của ${currentPlan?.employeeName || currentUser.name}`} />
        <StatCard label="Tiến độ trung bình" value={avgProgress} unit="%" icon={TrendingUp} color={avgProgress >= 80 ? 'success' : 'warning'} />
        <StatCard label="Đạt (≥ 80%)" value={onTrackCount} unit="chỉ tiêu" icon={CheckCircle2} color="info" />
        <StatCard
          label="Nguy cơ (< 70%)"
          value={atRiskCount}
          unit="chỉ tiêu"
          icon={AlertTriangle}
          color={atRiskCount > 0 ? 'danger' : 'success'}
          subtext="Chỉ tiêu dưới 70% cần lập biên bản trao đổi 1:1 với quản lý."
        />
      </div>

      {/* ==============================================================================
          TAB 1: TIẾN ĐỘ CÁ NHÂN & CẬP NHẬT KẾT QUẢ / MINH CHỨNG
          ============================================================================== */}
      {activeTab === 'my-progress' && (
        <div className="space-y-6">
          <SectionCard
            icon={Target}
            title="Chỉ tiêu trong kỳ"
            description="Bấm nút cập nhật để nhập kết quả định kỳ, đính kèm minh chứng và ghi chú khó khăn. Mỗi lần cập nhật cần quản lý xác nhận."
            action={
              <Badge variant="primary">
                Tổng trọng số {currentPlan?.totalWeight || 100}%
              </Badge>
            }
          >
            <div className="space-y-4">
              {planItems.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary-300 dark:hover:border-primary-700 transition-colors space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded">
                          {item.kpiCode || item.code}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.category}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                          Trọng số: {item.weight}%
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {item.name}
                      </h4>
                    </div>

                    {currentPlan.employeeId === currentUser.id && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={FileUp}
                        onClick={() => {
                          setSelectedKpiItem(item);
                          setShowCheckinModal(true);
                        }}
                      >
                        Cập nhật
                      </Button>
                    </div>
                    )}
                  </div>

                  {/* Chỉ số & Tiến độ bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
                    <div>
                      <span className="text-slate-500">Mục tiêu</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm tabular-nums">
                        <NumberText value={item.target} /> {item.unit}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Thực tế</span>
                      <div className="font-bold text-primary-700 dark:text-primary-400 text-sm tabular-nums">
                        <NumberText value={item.actual || 0} /> {item.unit}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Hoàn thành</span>
                      <div className="mt-1">
                        <ProgressBar progress={item.progressPercent || 0} showLabel size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Lịch sử Check-in & Trạng thái xác nhận (Yêu cầu Phase 3) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Lịch sử cập nhật
                    </div>

                    {item.checkins && item.checkins.length > 0 ? (
                      <div className="space-y-2">
                        {item.checkins.map((chk) => (
                          <div
                            key={chk.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 gap-2 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                                  Ngày {chk.date}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="font-semibold text-primary-600 dark:text-primary-400">
                                  {chk.actualValue} {item.unit}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  chk.verificationStatus === 'CONFIRMED'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : chk.verificationStatus === 'NEEDS_REVISION'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                }`}>
                                  {chk.verificationStatus === 'CONFIRMED'
                                    ? 'Đã xác nhận'
                                    : chk.verificationStatus === 'NEEDS_REVISION'
                                    ? 'Cần bổ sung'
                                    : 'Chờ xác nhận'}
                                </span>
                              </div>
                              <div className="text-slate-600 dark:text-slate-400">
                                {chk.note}
                              </div>
                              {chk.evidenceName && (
                                <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-medium">
                                  <Paperclip className="w-3.5 h-3.5" />
                                  <span>{chk.evidenceName}</span>
                                </div>
                              )}
                              {chk.managerComment && (
                                <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded mt-1">
                                  {chk.verifiedBy}: "{chk.managerComment}"
                                </div>
                              )}
                            </div>

                            {/* Quản lý nút xác nhận nhanh */}
                            {canVerify && currentPlan.employeeId !== currentUser.id && (
                              <div className="flex items-center gap-1.5 self-end sm:self-center">
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
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic py-2">
                        Chưa có lượt cập nhật nào.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ==============================================================================
          TAB 2: QUẢN LÝ XÉT DUYỆT SỐ LIỆU (MANAGER REVIEW & VERIFICATION)
          ============================================================================== */}
      {activeTab === 'manager-review' && (
        <SectionCard
          icon={CheckCircle}
          title="Số liệu chờ xác nhận"
          description="Quản lý kiểm tra số liệu thực tế và minh chứng của cán bộ trước khi tính vào kết quả đánh giá."
        >
          <div className="space-y-4">
            {kpiPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 flex items-center justify-center text-sm font-semibold">
                      {plan.employeeName.split(' ').pop()?.[0]}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {plan.employeeName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {plan.positionTitle} • {plan.departmentName}
                      </p>
                    </div>
                  </div>
                  <Badge variant="primary">
                    {plan.items?.length || 0} chỉ tiêu
                  </Badge>
                </div>

                <div className="space-y-3">
                  {plan.items?.map((it) => (
                    <div
                      key={it.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-slate-900 dark:text-slate-100 text-sm">
                            {it.name}
                          </strong>
                          <div className="text-slate-500">
                            Mục tiêu {it.target} {it.unit} · Thực tế <span className="font-bold text-primary-600">{it.actual || 0} {it.unit}</span> ({it.progressPercent || 0}%)
                          </div>
                        </div>
                        <div className="w-32">
                          <ProgressBar progress={it.progressPercent || 0} showLabel size="sm" />
                        </div>
                      </div>

                      {/* Check-ins needing confirmation */}
                      {it.checkins?.map((chk) => (
                        <div
                          key={chk.id}
                          className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {chk.actualValue} {it.unit} · {chk.date}
                            </span>
                            <span className="text-slate-400 mx-2">•</span>
                            <span className="text-slate-500">{chk.note}</span>
                            {chk.evidenceName && (
                              <span className="text-primary-600 dark:text-primary-400 ml-2 font-medium">
                                {chk.evidenceName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              chk.verificationStatus === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {chk.verificationStatus === 'CONFIRMED' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setVerifyPlanId(plan.id);
                                setVerifyItemId(it.id);
                                setVerifyingCheckin(chk);
                                setShowVerifyModal(true);
                              }}
                            >
                              Xác nhận
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
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
          description="Hằng ngày hệ thống tự quét: nhắc hạn trước 3 ngày; cảnh báo chỉ tiêu dưới 70% khi kỳ đã qua hơn 50% thời gian; gửi thông báo trong hệ thống và email công vụ."
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
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong>Quy tắc hoạt động của Scheduler Service:</strong>
                <p>1. Tự động kiểm tra thời hạn kỳ đánh giá và nhắc nhở cán bộ trước 3 ngày.</p>
                <p>2. Cảnh báo nguy cơ không đạt đối với các KPI có tiến độ hoàn thành dưới 70% khi thời gian kỳ đánh giá đã trôi qua hơn 50%.</p>
                <p>3. Gửi thông báo trực tiếp qua Notification Center và email công vụ của cán bộ.</p>
              </div>
            </div>

            {/* Scheduler Logs */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Lịch sử quét
              </div>
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
