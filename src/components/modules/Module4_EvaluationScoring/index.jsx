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

import { EXCELLENT_QUOTA_INFO, checkExcellentQuota, getRankVariant, RANK_LABELS } from '../../../utils/labels';

export const Module4_EvaluationScoring = () => {
  const {
    kpiPlans,
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

  const isSelfOnly = activeRole === 'EMPLOYEE' || activeRole === 'PEER_REVIEWER';
  const canManage = ['SYSTEM_ADMIN', 'EXECUTIVE', 'UNIT_HEAD', 'LINE_MANAGER'].includes(activeRole);
  const canCouncil = ['SYSTEM_ADMIN', 'EXECUTIVE', 'COUNCIL_MEMBER', 'SECRETARY', 'HR_OFFICER'].includes(activeRole);
  const stepFromStatus = (plan) =>
    plan?.evaluationStatus === 'EVALUATED' ? 4 : plan?.evaluationStatus === 'SELF_EVALUATED' ? 2 : 1;

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
      initial[item.id] = item.managerScore || item.selfScore || Math.min(item.weight, Math.round(((item.actual || 0) / (item.target || 1)) * item.weight));
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
        mScores[item.id] = item.managerScore || item.selfScore || Math.min(item.weight, Math.round(((item.actual || 0) / (item.target || 1)) * item.weight));
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
  const batchExcellent = kpiPlans.filter((p) => p.finalRank === 'XUẤT SẮC').length;
  const batchGood = kpiPlans.filter((p) => p.finalRank === 'TỐT').length;
  const batchQuota = checkExcellentQuota(batchExcellent, batchGood);
  const canEditStep = wizardStep === 1 ? isOwner : wizardStep === 2 ? canManage && !isOwner : canManage;
  const meetingRecord = collectiveMeetings?.find((m) => m.planId === targetPlan?.id || m.employeeId === targetPlan?.employeeId);

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
            ? [{ value: 'collective-meeting', label: systemOperatingMode === 'GOVERNMENT' ? 'Họp tập thể' : 'Hiệu chỉnh', icon: Vote }]
            : []),
          { value: '360-review', label: 'Góp ý đồng nghiệp', icon: Users2 },
          ...(canManage || canCouncil
            ? [
                { value: 'batch-approval', label: 'Duyệt hàng loạt', icon: CheckSquare, badge: kpiPlans.length },
                { value: 'calibration-adjust', label: 'Quy tắc tỷ lệ', icon: Edit3 },
              ]
            : []),
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val)}
      />

      {!['batch-approval', 'calibration-adjust'].includes(activeTab) && (
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 flex items-center justify-center text-sm font-semibold shrink-0">
            {targetPlan?.employeeName?.split(' ').pop()?.[0]}
          </span>
          {selectablePlans.length > 1 ? (
            <div className="w-full sm:w-96">
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
              <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{targetPlan?.employeeName}</div>
              <div className="text-xs text-slate-500 truncate">
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
      )}

      {activeTab === 'evaluation-form' && (
        <div className="space-y-6">
          <div className="p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-2 lg:grid-cols-4 gap-1">
            {[
              { step: 1, label: 'Tự đánh giá', icon: UserCheck },
              { step: 2, label: 'Quản lý chấm', icon: ClipboardCheck },
              { step: 3, label: systemOperatingMode === 'GOVERNMENT' ? 'Tập thể góp ý' : 'Góp ý 360°', icon: Vote },
              { step: 4, label: 'Kết luận', icon: Award },
            ].map(({ step, label, icon: StepIcon }) => {
              const active = wizardStep === step;
              const done = stepFromStatus(targetPlan) > step || targetPlan?.evaluationStatus === 'EVALUATED';
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setWizardStep(step)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
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

          {/* Step 1 & Step 2: Scoring Items */}
          {(wizardStep === 1 || wizardStep === 2) && (
            <SectionCard
              icon={wizardStep === 1 ? UserCheck : ClipboardCheck}
              title={wizardStep === 1 ? 'Cán bộ tự chấm điểm' : 'Quản lý trực tiếp chấm điểm'}
              description="Chấm điểm từng chỉ tiêu theo trọng số; điểm mỗi chỉ tiêu tối đa 120% trọng số. Chỉ cán bộ được tự chấm, chỉ quản lý (không phải chính mình) được chấm bước 2."
              action={
                !canEditStep && (
                  <Badge variant="secondary" icon={Eye}>
                    Chỉ xem
                  </Badge>
                )
              }
            >
              <div className="space-y-4">
                {targetPlan?.items?.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-primary-600">{item.kpiCode || item.code}</span>
                          <span className="text-slate-400">· {item.weight}%</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                          {item.name}
                        </h4>
                      </div>

                      <div className="text-right text-xs">
                        <span className="text-slate-500">Mục tiêu {item.target} {item.unit}</span>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          Thực tế {item.actual || 0} {item.unit} ({item.progressPercent || 0}%)
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Tự chấm (tối đa {item.weight * 1.2})
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          disabled={wizardStep !== 1 || !canEditStep}
                          value={selfScores[item.id] || 0}
                          onChange={(e) =>
                            setSelfScores({ ...selfScores, [item.id]: Number(e.target.value) })
                          }
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Quản lý chấm (tối đa {item.weight * 1.2})
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          disabled={wizardStep !== 2 || !canEditStep}
                          value={managerScores[item.id] || 0}
                          onChange={(e) =>
                            setManagerScores({ ...managerScores, [item.id]: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {wizardStep === 2 && (
                  <FormField label="Nhận xét của quản lý">
                    <textarea
                      rows={3}
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                      placeholder="Ưu điểm, hạn chế, tinh thần phối hợp..."
                      disabled={!canEditStep}
                      value={managerFeedback}
                      onChange={(e) => setManagerFeedback(e.target.value)}
                    />
                  </FormField>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-600">
                    Tổng điểm <strong className="text-primary-600 text-sm tabular-nums">{totalItemScore}</strong> / 100
                  </span>
                  <div className="flex gap-2">
                    {canEditStep && (
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
                    )}
                    <Button variant="ghost" size="sm" icon={ChevronRight} onClick={() => setWizardStep((prev) => prev + 1)} aria-label="Bước sau" title="Bước sau" />
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Step 3: Collective Meeting / 360 */}
          {wizardStep === 3 && (
            <SectionCard
              icon={Vote}
              title={systemOperatingMode === 'GOVERNMENT' ? 'Ý kiến tập thể' : 'Góp ý 360°'}
              description="Theo Nghị định 90/2020, tập thể đơn vị họp góp ý và bỏ phiếu đề xuất mức xếp loại trước khi người đứng đầu kết luận."
            >
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200">
                    <div className="font-medium">Xuất sắc</div>
                    <div className="text-2xl font-bold text-purple-700 tabular-nums">{meetingRecord ? `${meetingRecord.voteExcellent} / ${meetingRecord.totalVotes}` : '—'}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
                    <div className="font-medium">Hoàn thành tốt</div>
                    <div className="text-2xl font-bold text-emerald-700 tabular-nums">{meetingRecord ? `${meetingRecord.voteGood} / ${meetingRecord.totalVotes}` : '—'}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200">
                    <div className="font-medium">Hoàn thành</div>
                    <div className="text-2xl font-bold text-blue-700 tabular-nums">{meetingRecord ? `${meetingRecord.voteCompleted} / ${meetingRecord.totalVotes}` : '—'}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200">
                    <div className="font-medium">Không hoàn thành</div>
                    <div className="text-2xl font-bold text-rose-700 tabular-nums">{meetingRecord ? `${meetingRecord.voteFailed} / ${meetingRecord.totalVotes}` : '—'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <strong className="text-slate-800 dark:text-slate-200">Trích yếu biên bản</strong>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {meetingRecord?.meetingMinutes || 'Chưa có biên bản họp tập thể cho cán bộ này.'}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => setWizardStep(2)} aria-label="Quay lại" title="Quay lại" />
                  {canCouncil && !meetingRecord && (
                    <Button variant="outline" size="sm" icon={FileText} onClick={() => setActiveTab('collective-meeting')}>
                      Nhập biên bản
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" icon={ChevronRight} onClick={() => setWizardStep(4)} aria-label="Bước sau" title="Bước sau" />
                </div>
              </div>
            </SectionCard>
          )}

          {/* Step 4: Final Rank & Conclusion */}
          {wizardStep === 4 && (
            <SectionCard
              icon={Award}
              title="Kết luận xếp loại"
              description="Điểm tổng hợp tự động; áp dụng giới hạn do kỷ luật và trần 20% Xuất sắc. Người đứng đầu có thể điều chỉnh nhưng bắt buộc ghi lý do."
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Điểm tổng hợp */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Điểm tổng hợp
                    </span>
                    <div className="text-4xl font-black text-primary-600 tabular-nums">
                      {calculatedFinalScore} <span className="text-sm font-medium text-slate-400">/ 100 điểm</span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {isLeader ? (
                        <>
                          <div>• Điểm KPI cá nhân (30%): <strong>{Math.round(totalItemScore * 0.3 * 10) / 10}</strong></div>
                          <div>• Điểm hoàn thành của đơn vị (70%): <strong>{Math.round(unitKpiAverage * 0.7 * 10) / 10}</strong></div>
                        </>
                      ) : (
                        <>
                          <div>• Điểm Quản lý chấm (80%): <strong>{Math.round(totalItemScore * 0.8 * 10) / 10}</strong></div>
                          <div>• Điểm Đồng nghiệp 360 (20%): <strong>{Math.round((targetPlan?.peerScoreAvg || 90) * 0.2 * 10) / 10}</strong></div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Đề xuất xếp loại & Điều kiện loại trừ */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Xếp loại đề xuất
                    </span>
                    <div>
                      <Badge variant={rankProposal.rank === 'XUẤT SẮC' ? 'excellent' : rankProposal.rank === 'TỐT' ? 'good' : 'completed'}>
                        {rankProposal.rank}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {rankProposal.title}
                    </div>

                    {disciplineInfo && (
                      <div className="p-2 rounded bg-rose-50 text-rose-800 text-[11px] font-semibold">
                        Có quyết định kỷ luật: không được xếp Xuất sắc/Tốt.
                      </div>
                    )}
                  </div>

                  {/* Nút thao tác người có thẩm quyền */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Quyết định
                    </span>

                    {canManage && !isOwner ? (
                    <div className="space-y-2">
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

                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        icon={FileCheck}
                        onClick={() => handleSaveEvaluation(true)}
                      >
                        Chốt kết quả
                      </Button>
                    </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        {targetPlan?.evaluationStatus === 'EVALUATED' ? 'Kết quả đã được chốt.' : 'Chờ người có thẩm quyền kết luận.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Audit trail if adjusted */}
                {targetPlan?.isAdjusted && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <strong>Đã điều chỉnh</strong>
                    <div><strong>{targetPlan.originalScore} ({targetPlan.originalRank})</strong> → <strong>{targetPlan.finalScore} ({targetPlan.finalRank})</strong></div>
                    <div><strong>{targetPlan.adjustedBy}</strong> lúc {targetPlan.adjustedAt}</div>
                    <div><em>"{targetPlan.adjustReason}"</em></div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}
        </div>
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
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
                />
              </FormField>
              <FormField label="Số người dự họp" required>
                <Input
                  type="number"
                  value={meetingForm.attendeesCount}
                  onChange={(e) => setMeetingForm({ ...meetingForm, attendeesCount: Number(e.target.value) })}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <FormField label="Xuất sắc">
                <Input
                  type="number"
                  value={meetingForm.voteExcellent}
                  onChange={(e) => setMeetingForm({ ...meetingForm, voteExcellent: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Hoàn thành tốt">
                <Input
                  type="number"
                  value={meetingForm.voteGood}
                  onChange={(e) => setMeetingForm({ ...meetingForm, voteGood: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Hoàn thành">
                <Input
                  type="number"
                  value={meetingForm.voteCompleted}
                  onChange={(e) => setMeetingForm({ ...meetingForm, voteCompleted: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Không hoàn thành">
                <Input
                  type="number"
                  value={meetingForm.voteFailed}
                  onChange={(e) => setMeetingForm({ ...meetingForm, voteFailed: Number(e.target.value) })}
                />
              </FormField>
            </div>

            <FormField label="Trích yếu biên bản">
              <textarea
                rows={4}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                value={meetingForm.meetingMinutes}
                onChange={(e) => setMeetingForm({ ...meetingForm, meetingMinutes: e.target.value })}
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
          <form onSubmit={handleSavePeerReview} className="space-y-4 max-w-xl text-xs">
            <FormField label="Hợp tác, hỗ trợ">
              <Input
                type="number"
                value={peerForm.cooperationScore}
                onChange={(e) => setPeerForm({ ...peerForm, cooperationScore: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Thái độ, trách nhiệm">
              <Input
                type="number"
                value={peerForm.attitudeScore}
                onChange={(e) => setPeerForm({ ...peerForm, attitudeScore: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Kỷ luật, giờ giấc">
              <Input
                type="number"
                value={peerForm.disciplineScore}
                onChange={(e) => setPeerForm({ ...peerForm, disciplineScore: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Nhận xét">
              <textarea
                rows={3}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
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
        <SectionCard
          icon={CheckSquare}
          title="Duyệt hàng loạt"
          description="Chọn nhiều cán bộ để chốt kết quả cùng lúc."
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelectedBatchIds(
                    selectedBatchIds.length === kpiPlans.length ? [] : kpiPlans.map((p) => p.id)
                  )
                }
              >
                {selectedBatchIds.length === kpiPlans.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={selectedBatchIds.length === 0}
                icon={CheckCircle2}
                onClick={() => batchApproveEvaluations(selectedBatchIds, batchNote)}
              >
                Chốt ({selectedBatchIds.length})
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                batchQuota.withinQuota
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              {batchQuota.withinQuota ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>
                Xuất sắc <strong>{batchExcellent}</strong> / tối đa <strong>{batchQuota.maxAllowed}</strong>
                <span className="opacity-70"> (20% của {batchGood} Hoàn thành tốt)</span>
              </span>
            </div>
            <div className="space-y-2">
              {kpiPlans.map((plan) => {
                const isSelected = selectedBatchIds.includes(plan.id);
                return (
                  <div
                    key={plan.id}
                    onClick={() =>
                      setSelectedBatchIds((prev) =>
                        prev.includes(plan.id) ? prev.filter((id) => id !== plan.id) : [...prev, plan.id]
                      )
                    }
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <strong className="text-sm text-slate-900 dark:text-slate-100">{plan.employeeName}</strong>
                        <div className="text-slate-400">{plan.positionTitle} · {plan.departmentName}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-semibold text-primary-600 tabular-nums">{plan.finalScore ? `${plan.finalScore} điểm` : '—'}</div>
                      </div>
                      {plan.finalRank ? (
                        <Badge variant={getRankVariant(plan.finalRank)}>
                          {RANK_LABELS[plan.finalRank] || plan.finalRank}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Chưa xếp loại</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ==============================================================================
          TAB 5: HIỆU CHỈNH ĐIỂM & QUY TẮC KHỐNG CHẾ
          ============================================================================== */}
      {activeTab === 'calibration-adjust' && (
        <SectionCard
          icon={Shield}
          title="Quy tắc tỷ lệ xếp loại"
          description={EXCELLENT_QUOTA_INFO}
        >
          <div className="max-w-xl space-y-4 text-xs">
            <FormField label="Khi vượt trần 20% Xuất sắc">
              <select
                value={quotaPolicy}
                onChange={(e) => {
                  setQuotaPolicy(e.target.value);
                  showToast('Đã cập nhật chính sách khống chế tỷ lệ!');
                }}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="WARNING_WITH_JUSTIFICATION">
                  Cảnh báo & Bắt buộc nhập văn bản giải trình nếu vượt 20% (Khuyến nghị)
                </option>
                <option value="STRICT_BLOCK">
                  Chặn cứng (Không cho phép lưu phiếu nếu tỷ lệ xuất sắc vượt 20%)
                </option>
              </select>
            </FormField>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <strong>Danh sách cán bộ có điều kiện kỷ luật loại trừ trong kỳ:</strong>
              {disciplineRecords.map((d) => (
                <div key={d.id} className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 text-slate-700 dark:text-slate-300">
                  <div className="font-bold">{d.employeeName} ({d.departmentName})</div>
                  <div className="text-rose-600">Quyết định kỷ luật số: {d.decisionNumber} ({d.typeName})</div>
                  <div className="text-slate-500 text-[11px]">Giới hạn xếp loại trần: <strong>{d.maxAllowedRank}</strong> • Lý do: {d.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Modal Điều chỉnh Điểm / Xếp loại */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Người có thẩm quyền Điều chỉnh Điểm & Xếp loại
            </h3>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <FormField label="Điểm mới" required>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={adjustForm.adjustedScore}
                  onChange={(e) => setAdjustForm({ ...adjustForm, adjustedScore: e.target.value })}
                />
              </FormField>

              <FormField label="Xếp loại mới" required>
                <select
                  value={adjustForm.adjustedRank}
                  onChange={(e) => setAdjustForm({ ...adjustForm, adjustedRank: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="XUẤT SẮC">Hoàn thành xuất sắc nhiệm vụ</option>
                  <option value="TỐT">Hoàn thành tốt nhiệm vụ</option>
                  <option value="HOÀN THÀNH">Hoàn thành nhiệm vụ</option>
                  <option value="KHÔNG HOÀN THÀNH">Không hoàn thành nhiệm vụ</option>
                </select>
              </FormField>

              <FormField label="Lý do điều chỉnh" hint="Bắt buộc, tối thiểu 10 ký tự; được lưu vào nhật ký." required>
                <textarea
                  rows={3}
                  required
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  placeholder="Ghi rõ căn cứ và lý do người đứng đầu điều chỉnh kết quả..."
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setAdjustModalOpen(false)}>
                  Hủy
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Xác nhận lưu điều chỉnh
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
