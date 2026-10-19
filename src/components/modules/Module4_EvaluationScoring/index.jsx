import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Award,
  UserCheck,
  Users2,
  CheckCircle2,
  Save,
  Send,
  FileCheck,
  AlertTriangle,
  CheckSquare,
  Shield,
  Briefcase,
  ChevronRight,
  Edit3,
  Vote,
  FileText,
  Check,
  ChevronLeft,
  ClipboardCheck,
  Eye,
} from 'lucide-react';
import { PageHeader } from '../../common/PageHeader';
import { SectionCard } from '../../common/SectionCard';

import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { FormField } from '../../common/FormField';
import { Card } from '../../ui/Card';
import { InfoTip } from '../../ui/InfoTip';
import { Modal } from '../../ui/Modal';

import { EXCELLENT_QUOTA_INFO, checkExcellentQuota, getRankVariant, RANK_LABELS } from '../../../utils/labels';

export const Module4_EvaluationScoring = () => {
  const {
    kpiPlans: allPlans,
    currentUser,
    users,
    activePeriod,
    saveEvaluation,
    peerReviews,
    addPeerReview,
    calculateRank,
    calculateRankWithExclusions,
    saveCollectiveMeeting,
    collectiveMeetings,
    adjustScoreAndRank,
    batchApproveEvaluations,
    disciplineRecords,
    quotaPolicy,
    setQuotaPolicy,
    systemOperatingMode,
    showToast,
    activeRole,
  } = useApp();

  const kpiPlans = allPlans.filter((p) => p.periodId === activePeriod?.id);
  const isSelfOnly = activeRole === 'EMPLOYEE' || activeRole === 'PEER_REVIEWER';
  const canManage = ['SYSTEM_ADMIN', 'EXECUTIVE', 'UNIT_HEAD', 'LINE_MANAGER'].includes(activeRole);
  const canCouncil = ['SYSTEM_ADMIN', 'EXECUTIVE', 'COUNCIL_MEMBER', 'SECRETARY', 'HR_OFFICER'].includes(activeRole);
  const stepFromStatus = (plan) => (plan?.evaluationStatus === 'EVALUATED' ? 4 : plan?.evaluationStatus === 'SELF_EVALUATED' ? 2 : 1);

  // Top navigation tabs
  const [activeTab, setActiveTab] = useState('evaluation-form'); // 'evaluation-form', 'collective-meeting', 'batch-approval', 'calibration-adjust', '360-review', 'timeline'
  // Select target evaluation plan
  const [selectedPlanId, setSelectedPlanId] = useState(() => {
    const preferred = canManage
      ? kpiPlans.find((p) => p.employeeId !== currentUser.id)
      : kpiPlans.find((p) => p.employeeId === currentUser.id);
    return preferred ? preferred.id : kpiPlans[0]?.id;
  });

  const targetPlan = kpiPlans.find((p) => p.id === selectedPlanId) || kpiPlans[0];
  const isOwner = targetPlan?.employeeId === currentUser.id;
  const [wizardStep, setWizardStep] = useState(() => stepFromStatus(targetPlan)); // 1: Tự đánh giá, 2: Quản lý chấm, 3: Tập thể/360, 4: Kết luận
  const selectablePlans =
    activeTab === '360-review'
      ? kpiPlans.filter((p) => p.employeeId !== currentUser.id)
      : isSelfOnly
        ? kpiPlans.filter((p) => p.employeeId === currentUser.id)
        : kpiPlans;
  const targetEmployee = users.find((u) => u.id === targetPlan?.employeeId);

  // Scores state
  const [selfScores, setSelfScores] = useState(() => {
    const initial = {};
    targetPlan?.items?.forEach((item) => {
      initial[item.id] = item.selfScore || Math.min(item.weight, Math.round(((item.actual || 0) / (item.target || 1)) * item.weight));
    });
    return initial;
  });

  const [managerScores, setManagerScores] = useState(() => {
    const initial = {};
    targetPlan?.items?.forEach((item) => {
      initial[item.id] =
        item.managerScore || item.selfScore || Math.min(item.weight, Math.round(((item.actual || 0) / (item.target || 1)) * item.weight));
    });
    return initial;
  });

  const [managerFeedback, setManagerFeedback] = useState(targetPlan?.managerNote || '');

  // Collective Meeting Form State (NĐ 90/2020)
  const [meetingForm, setMeetingForm] = useState({
    meetingDate: new Date().toISOString().split('T')[0],
    attendeesCount: 15,
    totalVotes: 15,
    voteExcellent: 12,
    voteGood: 3,
    voteCompleted: 0,
    voteFailed: 0,
    meetingMinutes: 'Tập thể đơn vị biểu quyết thống nhất ghi nhận đồng chí hoàn thành tốt các chỉ tiêu công tác.',
    councilConsensus: 'EXCELLENT',
  });

  // Adjust Score Form State (Hiệu chỉnh điểm có lý do)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    adjustedScore: targetPlan?.finalScore || 88,
    adjustedRank: targetPlan?.finalRank || 'TỐT',
    reason: '',
  });

  // Batch Approval State
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [batchNote, setBatchNote] = useState('Đồng ý phê duyệt và ban hành kết quả đánh giá.');

  // Check if target is a leader (Người đứng đầu đơn vị)
  const isLeader = targetEmployee?.role === 'MANAGER' || targetEmployee?.positionTitle?.includes('Trưởng');
  const unitKpiAverage = 92.0; // Điểm hoàn thành nhiệm vụ của đơn vị phụ trách

  // 360 Peer Review Form State
  const [peerForm, setPeerForm] = useState({
    cooperationScore: 92,
    attitudeScore: 90,
    disciplineScore: 95,
    comment: 'Đồng chí có tinh thần trách nhiệm cao, phối hợp công việc kịp thời.',
  });

  // Check disciplinary restriction
  const disciplineInfo = disciplineRecords.find((d) => d.userId === targetPlan?.employeeId);

  // Switch Target Plan
  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    const plan = kpiPlans.find((p) => p.id === planId);
    if (plan) {
      const sScores = {};
      const mScores = {};
      plan.items?.forEach((item) => {
        sScores[item.id] = item.selfScore || Math.min(item.weight, Math.round(((item.actual || 0) / (item.target || 1)) * item.weight));
        mScores[item.id] =
          item.managerScore || item.selfScore || Math.min(item.weight, Math.round(((item.actual || 0) / (item.target || 1)) * item.weight));
      });
      setSelfScores(sScores);
      setManagerScores(mScores);
      setManagerFeedback(plan.managerNote || '');
      setWizardStep(stepFromStatus(plan));
    }
  };

  // Submit Evaluation Save
  const handleSaveEvaluation = (isFinalize = false) => {
    saveEvaluation({
      planId: targetPlan.id,
      selfScores,
      managerScores,
      managerFeedback,
      isFinalize,
    });
  };

  // Save Collective Meeting Record
  const handleSaveMeetingRecord = (e) => {
    e.preventDefault();
    saveCollectiveMeeting({
      planId: targetPlan.id,
      employeeId: targetPlan.employeeId,
      employeeName: targetPlan.employeeName,
      departmentId: targetPlan.departmentId || 'dept-01',
      departmentName: targetPlan.departmentName,
      ...meetingForm,
    });
  };

  // Save Score Adjustment with mandatory reason
  const handleSaveAdjustment = (e) => {
    e.preventDefault();
    const success = adjustScoreAndRank({
      planId: targetPlan.id,
      adjustedScore: adjustForm.adjustedScore,
      adjustedRank: adjustForm.adjustedRank,
      reason: adjustForm.reason,
    });
    if (success) {
      setAdjustModalOpen(false);
      setAdjustForm({ ...adjustForm, reason: '' });
    }
  };

  // Save 360 Peer Review
  const handleSavePeerReview = (e) => {
    e.preventDefault();
    addPeerReview({
      targetEmployeeId: targetPlan.employeeId,
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      ...peerForm,
    });
  };

  // Compute calculated score
  const totalItemScore = Object.values(managerScores).reduce((sum, v) => sum + Number(v || 0), 0);
  const calculatedFinalScore = isLeader
    ? Math.round((totalItemScore * 0.3 + unitKpiAverage * 0.7) * 10) / 10
    : Math.round((totalItemScore * 0.8 + (targetPlan?.peerScoreAvg || 90) * 0.2) * 10) / 10;

  const rankProposal = calculateRankWithExclusions(calculatedFinalScore, targetPlan?.employeeId);
  const isLocked = targetPlan?.evaluationStatus === 'EVALUATED' && targetPlan?.finalScore != null;
  const shownScore = isLocked ? targetPlan.finalScore : calculatedFinalScore;
  const shownRank = isLocked ? targetPlan.finalRank : rankProposal.rank;
  const batchPlans = kpiPlans.filter((p) => activeRole === 'SYSTEM_ADMIN' || p.employeeId !== currentUser.id);
  const batchExcellent = kpiPlans.filter((p) => p.finalRank === 'XUẤT SẮC').length;
  const batchGood = kpiPlans.filter((p) => p.finalRank === 'TỐT').length;
  const batchQuota = checkExcellentQuota(batchExcellent, batchGood);
  const canEditStep = wizardStep === 1 ? isOwner : wizardStep === 2 ? canManage && !isOwner : canManage;
  const meetingRecord = collectiveMeetings?.find((m) => m.planId === targetPlan?.id || m.employeeId === targetPlan?.employeeId);

  if (!targetPlan) {
    return (
      <div className="space-y-6">
        <PageHeader title="Đánh giá & xếp loại" />
        <Card className="flex flex-col items-center gap-2 py-14 text-sm text-slate-500">
          <Award size={28} className="text-slate-300" />
          Kỳ “{activePeriod?.name}” chưa có phiếu KPI nào để đánh giá.
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đánh giá & xếp loại"
        subtitle={
          systemOperatingMode === 'GOVERNMENT'
            ? 'Theo Nghị định 90/2020 và 48/2023: cán bộ tự đánh giá → quản lý trực tiếp chấm điểm → tập thể đơn vị góp ý, biểu quyết → người đứng đầu kết luận xếp loại. Cán bộ có kỷ luật bị giới hạn mức xếp loại; tỷ lệ Xuất sắc không quá 20% số Hoàn thành tốt.'
            : 'Nhân viên tự đánh giá → quản lý chấm điểm → tổng hợp góp ý 360° và hiệu chỉnh → kết luận xếp loại.'
        }
      />

      <SegmentedControl
        options={[
          { value: 'evaluation-form', label: 'Phiếu đánh giá', icon: Award },
          ...(canManage || canCouncil
            ? [
                {
                  value: 'collective-meeting',
                  label: systemOperatingMode === 'GOVERNMENT' ? 'Họp tập thể' : 'Hiệu chỉnh',
                  icon: Vote,
                },
              ]
            : []),
          { value: '360-review', label: 'Góp ý đồng nghiệp', icon: Users2 },
          ...(canManage || canCouncil
            ? [
                {
                  value: 'batch-approval',
                  label: 'Duyệt hàng loạt',
                  icon: CheckSquare,
                  badge: batchPlans.filter((p) => p.evaluationStatus !== 'EVALUATED').length || undefined,
                },
                {
                  value: 'calibration-adjust',
                  label: 'Quy tắc tỷ lệ',
                  icon: Edit3,
                },
              ]
            : []),
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val)}
      />

      {!['batch-approval', 'calibration-adjust'].includes(activeTab) && (
        <Card padding="none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 flex items-center justify-center text-sm font-semibold shrink-0">
                {targetPlan?.employeeName?.split(' ').pop()?.[0]}
              </span>
              {selectablePlans.length > 1 ? (
                <div className="w-full sm:max-w-lg">
                  <Select value={selectedPlanId} onChange={(e) => handleSelectPlan(e.target.value)} aria-label="Chọn cán bộ">
                    {selectablePlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.employeeName} — {p.departmentName}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{targetPlan?.employeeName}</div>
                  <div className="text-xs text-slate-500">
                    {targetPlan?.positionTitle} · {targetPlan?.departmentName}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {disciplineInfo && (
                <Badge variant="danger" icon={AlertTriangle} title={disciplineInfo.typeName}>
                  Kỷ luật · tối đa {disciplineInfo.maxAllowedRank}
                </Badge>
              )}
              {isLeader && (
                <Badge variant="purple" icon={Briefcase} title="Điểm = 30% KPI cá nhân + 70% kết quả đơn vị phụ trách">
                  Người đứng đầu
                </Badge>
              )}
            </div>
          </div>

          {activeTab === 'evaluation-form' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 p-2 border-t border-slate-100 dark:border-slate-800">
              {[
                { step: 1, label: 'Tự đánh giá', icon: UserCheck },
                { step: 2, label: 'Quản lý chấm', icon: ClipboardCheck },
                {
                  step: 3,
                  label: systemOperatingMode === 'GOVERNMENT' ? 'Tập thể góp ý' : 'Góp ý 360°',
                  icon: Vote,
                },
                { step: 4, label: 'Kết luận', icon: Award },
              ].map(({ step, label, icon: StepIcon }) => {
                const active = wizardStep === step;
                const done = stepFromStatus(targetPlan) > step || targetPlan?.evaluationStatus === 'EVALUATED';
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setWizardStep(step)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                      active
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 font-semibold'
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        done
                          ? 'bg-emerald-500 text-white'
                          : active
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {done ? <Check size={14} /> : <StepIcon size={14} />}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'evaluation-form' && (
        <>
          {(wizardStep === 1 || wizardStep === 2) && (
            <Card padding="none">
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {wizardStep === 1 ? 'Cán bộ tự chấm điểm' : 'Quản lý trực tiếp chấm điểm'}
                  </h3>
                  <InfoTip>
                    Chấm từng chỉ tiêu theo trọng số, tối đa 120% trọng số. Bước 1 do cán bộ tự chấm; bước 2 do quản lý trực tiếp chấm
                    (không tự chấm cho chính mình).
                  </InfoTip>
                </div>
                {!canEditStep && (
                  <Badge variant="secondary" icon={Eye}>
                    Chỉ xem
                  </Badge>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-medium text-slate-500">
                      <th className="px-6 py-2.5 font-medium">Chỉ tiêu</th>
                      <th className="px-3 py-2.5 font-medium text-right">Trọng số</th>
                      <th className="px-3 py-2.5 font-medium">Kết quả</th>
                      <th className="px-3 py-2.5 font-medium w-32">Tự chấm</th>
                      <th className="px-6 py-2.5 font-medium w-32">Quản lý chấm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {targetPlan?.items?.map((item) => (
                      <tr key={item.id} className="align-middle">
                        <td className="px-6 py-3.5">
                          <div className="font-medium text-slate-900 dark:text-slate-100 leading-snug">{item.name}</div>
                          <div className="text-xs font-mono text-primary-600 dark:text-primary-400">{item.kpiCode || item.code}</div>
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{item.weight}%</td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <div className="tabular-nums text-slate-900 dark:text-slate-100">
                            {item.actual || 0} / {item.target} {item.unit}
                          </div>
                          <div
                            className={`text-xs tabular-nums ${(item.progressPercent || 0) >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}
                          >
                            {item.progressPercent || 0}%
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <Input
                            type="number"
                            size="sm"
                            step="0.1"
                            min={0}
                            max={item.weight * 1.2}
                            title={`Tối đa ${item.weight * 1.2}`}
                            disabled={wizardStep !== 1 || !canEditStep}
                            value={selfScores[item.id] || 0}
                            onChange={(e) =>
                              setSelfScores({
                                ...selfScores,
                                [item.id]: Number(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td className="px-6 py-3.5">
                          <Input
                            type="number"
                            size="sm"
                            step="0.1"
                            min={0}
                            max={item.weight * 1.2}
                            title={`Tối đa ${item.weight * 1.2}`}
                            disabled={wizardStep !== 2 || !canEditStep}
                            value={managerScores[item.id] || 0}
                            onChange={(e) =>
                              setManagerScores({
                                ...managerScores,
                                [item.id]: Number(e.target.value),
                              })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 dark:border-slate-700 font-semibold tabular-nums">
                      <td className="px-6 py-3 text-slate-700 dark:text-slate-300">Tổng điểm</td>
                      <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">100%</td>
                      <td />
                      <td className="px-3 py-3 text-slate-900 dark:text-slate-100">
                        {Object.values(selfScores).reduce((sum, v) => sum + Number(v || 0), 0)}
                      </td>
                      <td className="px-6 py-3 text-primary-600 dark:text-primary-400">{totalItemScore}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {wizardStep === 2 && (
                <div className="px-6 pb-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <FormField label="Nhận xét của quản lý">
                    <textarea
                      rows={3}
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 disabled:opacity-60"
                      placeholder="Ưu điểm, hạn chế, tinh thần phối hợp..."
                      disabled={!canEditStep}
                      value={managerFeedback}
                      onChange={(e) => setManagerFeedback(e.target.value)}
                    />
                  </FormField>
                </div>
              )}

              <div className="flex justify-end items-center gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                {wizardStep === 2 && (
                  <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => setWizardStep(1)}>
                    Quay lại
                  </Button>
                )}
                {canEditStep ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Send}
                    onClick={() => {
                      handleSaveEvaluation(false);
                      setWizardStep((prev) => prev + 1);
                    }}
                  >
                    {wizardStep === 1 ? 'Gửi tự đánh giá' : 'Lưu điểm'}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setWizardStep((prev) => prev + 1)}>
                    Bước sau
                    <ChevronRight size={16} />
                  </Button>
                )}
              </div>
            </Card>
          )}

          {wizardStep === 3 && (
            <Card padding="none">
              <div className="flex items-center gap-1.5 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {systemOperatingMode === 'GOVERNMENT' ? 'Ý kiến tập thể' : 'Góp ý 360°'}
                </h3>
                <InfoTip>
                  Theo Nghị định 90/2020, tập thể đơn vị họp góp ý và bỏ phiếu đề xuất mức xếp loại trước khi người đứng đầu kết luận.
                </InfoTip>
                {meetingRecord && (
                  <span className="ml-auto text-sm text-slate-500">
                    <b className="text-slate-900 dark:text-slate-100 tabular-nums">{meetingRecord.totalVotes}</b> phiếu
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
                {[
                  {
                    label: 'Xuất sắc',
                    key: 'voteExcellent',
                    tone: 'text-purple-600 dark:text-purple-400',
                  },
                  {
                    label: 'Hoàn thành tốt',
                    key: 'voteGood',
                    tone: 'text-emerald-600 dark:text-emerald-400',
                  },
                  {
                    label: 'Hoàn thành',
                    key: 'voteCompleted',
                    tone: 'text-blue-600 dark:text-blue-400',
                  },
                  {
                    label: 'Không hoàn thành',
                    key: 'voteFailed',
                    tone: 'text-rose-600 dark:text-rose-400',
                  },
                ].map(({ label, key, tone }) => (
                  <div key={key} className="px-6 py-4">
                    <div className="text-sm text-slate-500">{label}</div>
                    <div className={`text-2xl font-semibold tabular-nums ${meetingRecord ? tone : 'text-slate-300'}`}>
                      {meetingRecord ? meetingRecord[key] : '—'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 space-y-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Trích yếu biên bản</div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {meetingRecord?.meetingMinutes || 'Chưa có biên bản họp tập thể cho cán bộ này.'}
                </p>
              </div>
              <div className="flex justify-end items-center gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => setWizardStep(2)}>
                  Quay lại
                </Button>
                {canCouncil && !meetingRecord && (
                  <Button variant="outline" size="sm" icon={FileText} onClick={() => setActiveTab('collective-meeting')}>
                    Nhập biên bản
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setWizardStep(4)}>
                  Bước sau
                  <ChevronRight size={16} />
                </Button>
              </div>
            </Card>
          )}

          {wizardStep === 4 && (
            <Card padding="none">
              <div className="flex items-center gap-1.5 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Kết luận xếp loại</h3>
                <InfoTip>
                  Điểm tổng hợp tự động; áp dụng giới hạn do kỷ luật và trần 20% Xuất sắc. Người đứng đầu có thể điều chỉnh nhưng bắt buộc
                  ghi lý do.
                </InfoTip>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                <div className="px-6 py-5 space-y-3">
                  <div className="text-sm text-slate-500">{isLocked ? 'Điểm đã chốt' : 'Điểm tổng hợp'}</div>
                  <div className="text-4xl font-semibold tracking-tight text-primary-600 dark:text-primary-400 tabular-nums">
                    {shownScore}
                    <span className="ml-1 text-base font-normal text-slate-400">/ 100</span>
                  </div>
                  <dl className="text-sm space-y-1.5 tabular-nums">
                    {(isLeader
                      ? [
                          ['KPI cá nhân', totalItemScore, 0.3],
                          ['Kết quả đơn vị', unitKpiAverage, 0.7],
                        ]
                      : [
                          ['Quản lý chấm', totalItemScore, 0.8],
                          ['Đồng nghiệp góp ý', targetPlan?.peerScoreAvg || 90, 0.2],
                        ]
                    ).map(([label, raw, w]) => (
                      <div key={label} className="flex justify-between gap-3">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="text-slate-700 dark:text-slate-300">
                          {raw} × {w * 100}% = <b className="text-slate-900 dark:text-slate-100">{Math.round(raw * w * 10) / 10}</b>
                        </dd>
                      </div>
                    ))}
                    {isLocked && canManage && shownScore !== calculatedFinalScore && (
                      <div className="flex justify-between gap-3 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                        <dt className="text-slate-500">Tính lại theo điểm hiện tại</dt>
                        <dd className="font-semibold text-slate-900 dark:text-slate-100">{calculatedFinalScore}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="px-6 py-5 space-y-3">
                  <div className="text-sm text-slate-500">{isLocked ? 'Xếp loại' : 'Xếp loại đề xuất'}</div>
                  <Badge variant={getRankVariant(shownRank)} className="text-sm px-3 py-1">
                    {RANK_LABELS[shownRank] || shownRank}
                  </Badge>
                  {!isLocked && <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{rankProposal.title}</p>}
                  {disciplineInfo && (
                    <p className="flex items-start gap-1.5 text-sm text-rose-700 dark:text-rose-400">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                      Có quyết định kỷ luật: không được xếp Xuất sắc hoặc Tốt.
                    </p>
                  )}
                </div>

                <div className="px-6 py-5 flex flex-col gap-3">
                  <div className="text-sm text-slate-500">Quyết định</div>
                  {canManage && !isOwner ? (
                    <div className="space-y-2">
                      {isLocked ? (
                        <p className="flex items-center gap-2 pb-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 size={18} /> Kết quả đã được chốt
                        </p>
                      ) : (
                        <Button variant="primary" size="sm" className="w-full" icon={FileCheck} onClick={() => handleSaveEvaluation(true)}>
                          Chốt kết quả
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        icon={Edit3}
                        onClick={() => {
                          setAdjustForm({
                            adjustedScore: calculatedFinalScore,
                            adjustedRank: rankProposal.rank,
                            reason: '',
                          });
                          setAdjustModalOpen(true);
                        }}
                      >
                        Điều chỉnh
                      </Button>
                    </div>
                  ) : targetPlan?.evaluationStatus === 'EVALUATED' ? (
                    <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 size={18} /> Kết quả đã được chốt
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">Chờ người có thẩm quyền kết luận.</p>
                  )}
                </div>
              </div>

              {targetPlan?.isAdjusted && (
                <div className="mx-6 mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-sm text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-semibold">
                    Đã điều chỉnh: {targetPlan.originalScore} ({targetPlan.originalRank}) → {targetPlan.finalScore} ({targetPlan.finalRank})
                  </div>
                  <div className="text-xs">
                    {targetPlan.adjustedBy} · {targetPlan.adjustedAt} · “{targetPlan.adjustReason}”
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* ==============================================================================
          TAB 2: BIÊN BẢN HỘI NGHỊ TẬP THỂ LẤY Ý KIẾN (NĐ 90/2020)
          ============================================================================== */}
      {activeTab === 'collective-meeting' && (
        <SectionCard
          icon={Vote}
          title="Biên bản họp tập thể"
          description="Theo Nghị định 90/2020: ghi nhận số người dự họp và kết quả bỏ phiếu đề xuất xếp loại của tập thể đơn vị."
        >
          <form onSubmit={handleSaveMeetingRecord} className="space-y-4 max-w-2xl text-xs">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Ngày họp hội nghị" required>
                <Input
                  type="date"
                  value={meetingForm.meetingDate}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      meetingDate: e.target.value,
                    })
                  }
                />
              </FormField>
              <FormField label="Số người dự họp" required>
                <Input
                  type="number"
                  value={meetingForm.attendeesCount}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      attendeesCount: Number(e.target.value),
                    })
                  }
                />
              </FormField>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <FormField label="Xuất sắc">
                <Input
                  type="number"
                  value={meetingForm.voteExcellent}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      voteExcellent: Number(e.target.value),
                    })
                  }
                />
              </FormField>
              <FormField label="Hoàn thành tốt">
                <Input
                  type="number"
                  value={meetingForm.voteGood}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      voteGood: Number(e.target.value),
                    })
                  }
                />
              </FormField>
              <FormField label="Hoàn thành">
                <Input
                  type="number"
                  value={meetingForm.voteCompleted}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      voteCompleted: Number(e.target.value),
                    })
                  }
                />
              </FormField>
              <FormField label="Không hoàn thành">
                <Input
                  type="number"
                  value={meetingForm.voteFailed}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      voteFailed: Number(e.target.value),
                    })
                  }
                />
              </FormField>
            </div>

            <FormField label="Trích yếu biên bản">
              <textarea
                rows={4}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                value={meetingForm.meetingMinutes}
                onChange={(e) =>
                  setMeetingForm({
                    ...meetingForm,
                    meetingMinutes: e.target.value,
                  })
                }
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="primary" size="sm" type="submit" icon={Save}>
                Lưu biên bản họp
              </Button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* ==============================================================================
          TAB 3: ĐÁNH GIÁ 360° ĐỒNG NGHIỆP
          ============================================================================== */}
      {activeTab === '360-review' && (
        <SectionCard
          icon={Users2}
          title={`Góp ý cho ${targetPlan?.employeeName}`}
          description="Đồng nghiệp chấm điểm (0–100) về tinh thần hợp tác, thái độ phục vụ và kỷ luật. Điểm trung bình chiếm 20% điểm tổng hợp."
        >
          <form onSubmit={handleSavePeerReview} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Hợp tác, hỗ trợ">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={peerForm.cooperationScore}
                  onChange={(e) =>
                    setPeerForm({
                      ...peerForm,
                      cooperationScore: Number(e.target.value),
                    })
                  }
                />
              </FormField>

              <FormField label="Thái độ, trách nhiệm">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={peerForm.attitudeScore}
                  onChange={(e) =>
                    setPeerForm({
                      ...peerForm,
                      attitudeScore: Number(e.target.value),
                    })
                  }
                />
              </FormField>

              <FormField label="Kỷ luật, giờ giấc">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={peerForm.disciplineScore}
                  onChange={(e) =>
                    setPeerForm({
                      ...peerForm,
                      disciplineScore: Number(e.target.value),
                    })
                  }
                />
              </FormField>
            </div>

            <FormField label="Nhận xét">
              <textarea
                rows={3}
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                value={peerForm.comment}
                onChange={(e) => setPeerForm({ ...peerForm, comment: e.target.value })}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="primary" size="sm" type="submit" icon={Send}>
                Gửi phiếu góp ý
              </Button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* ==============================================================================
          TAB 4: DUYỆT HÀNG LOẠT (BATCH APPROVAL) CHO QUẢN LÝ
          ============================================================================== */}
      {activeTab === 'batch-approval' && (
        <Card padding="none">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Duyệt hàng loạt</h3>
              <InfoTip>Chọn nhiều cán bộ để chốt kết quả cùng lúc. {EXCELLENT_QUOTA_INFO}</InfoTip>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 text-sm ${
                  batchQuota.withinQuota ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                }`}
                title={`Tối đa 20% của ${batchGood} Hoàn thành tốt`}
              >
                {batchQuota.withinQuota ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                Xuất sắc {batchExcellent}/{batchQuota.maxAllowed}
              </span>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedBatchIds.length === 0}
                icon={FileCheck}
                onClick={() => batchApproveEvaluations(selectedBatchIds, batchNote)}
              >
                Chốt {selectedBatchIds.length || ''}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-medium text-slate-500">
                  <th className="pl-6 pr-2 py-2.5 w-10">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả"
                      checked={batchPlans.length > 0 && selectedBatchIds.length === batchPlans.length}
                      onChange={() => setSelectedBatchIds(selectedBatchIds.length === batchPlans.length ? [] : batchPlans.map((p) => p.id))}
                      className="w-4 h-4 rounded text-primary-600 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2.5 font-medium">Cán bộ</th>
                  <th className="px-3 py-2.5 font-medium">Đơn vị</th>
                  <th className="px-3 py-2.5 font-medium text-right">Điểm</th>
                  <th className="px-6 py-2.5 font-medium">Xếp loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batchPlans.map((plan) => {
                  const isSelected = selectedBatchIds.includes(plan.id);
                  return (
                    <tr
                      key={plan.id}
                      onClick={() =>
                        setSelectedBatchIds((prev) => (prev.includes(plan.id) ? prev.filter((id) => id !== plan.id) : [...prev, plan.id]))
                      }
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary-50/60 dark:bg-primary-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="pl-6 pr-2 py-3">
                        <input type="checkbox" readOnly checked={isSelected} className="w-4 h-4 rounded text-primary-600 cursor-pointer" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{plan.employeeName}</div>
                        <div className="text-xs text-slate-500">{plan.positionTitle}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{plan.departmentName}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {plan.finalRank ? plan.finalScore : '—'}
                      </td>
                      <td className="px-6 py-3">
                        {plan.finalRank ? (
                          <Badge variant={getRankVariant(plan.finalRank)}>{RANK_LABELS[plan.finalRank] || plan.finalRank}</Badge>
                        ) : (
                          <Badge variant="secondary">Chưa xếp loại</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==============================================================================
          TAB 5: HIỆU CHỈNH ĐIỂM & QUY TẮC KHỐNG CHẾ
          ============================================================================== */}
      {activeTab === 'calibration-adjust' && (
        <SectionCard icon={Shield} title="Quy tắc tỷ lệ xếp loại" description={EXCELLENT_QUOTA_INFO}>
          <div className="max-w-2xl space-y-5">
            <FormField label="Khi vượt trần 20% Xuất sắc">
              <select
                value={quotaPolicy}
                onChange={(e) => {
                  setQuotaPolicy(e.target.value);
                  showToast('Đã cập nhật chính sách khống chế tỷ lệ!');
                }}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="WARNING_WITH_JUSTIFICATION">Cảnh báo và bắt buộc giải trình (khuyến nghị)</option>
                <option value="STRICT_BLOCK">Chặn, không cho lưu khi vượt 20%</option>
              </select>
            </FormField>

            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Cán bộ bị giới hạn xếp loại do kỷ luật</div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {disciplineRecords.map((d) => (
                  <div key={d.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{d.employeeName}</div>
                      <div className="text-xs text-slate-500">
                        {d.departmentName} · Quyết định {d.decisionNumber} ({d.typeName}) · {d.reason}
                      </div>
                    </div>
                    <Badge variant="danger" className="mt-0.5">
                      Tối đa {RANK_LABELS[d.maxAllowedRank] || d.maxAllowedRank}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      <Modal
        open={adjustModalOpen}
        size="sm"
        icon={Edit3}
        title="Điều chỉnh điểm và xếp loại"
        onClose={() => setAdjustModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAdjustModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" form="adjust-form">
              Lưu điều chỉnh
            </Button>
          </>
        }
      >
        <form id="adjust-form" onSubmit={handleSaveAdjustment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Điểm mới" required>
              <Input
                type="number"
                step="0.1"
                required
                value={adjustForm.adjustedScore}
                onChange={(e) =>
                  setAdjustForm({
                    ...adjustForm,
                    adjustedScore: e.target.value,
                  })
                }
              />
            </FormField>
            <FormField label="Xếp loại mới" required>
              <Select value={adjustForm.adjustedRank} onChange={(e) => setAdjustForm({ ...adjustForm, adjustedRank: e.target.value })}>
                {['XUẤT SẮC', 'TỐT', 'HOÀN THÀNH', 'KHÔNG HOÀN THÀNH'].map((r) => (
                  <option key={r} value={r}>
                    {RANK_LABELS[r]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField label="Lý do điều chỉnh" hint="Bắt buộc, tối thiểu 10 ký tự; được lưu vào nhật ký." required>
            <textarea
              rows={3}
              required
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              placeholder="Ghi rõ căn cứ và lý do điều chỉnh kết quả..."
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
