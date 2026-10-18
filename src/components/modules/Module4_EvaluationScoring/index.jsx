import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Award,
  UserCheck,
  Users2,
  Calculator,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Save,
  Send,
  Star,
  FileCheck,
  Clock,
  Layers,
  AlertTriangle,
  History,
  FileSpreadsheet,
  CheckSquare,
  Shield,
  Briefcase,
  ChevronRight,
  Edit3,
  Lock,
  Vote,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../../common/PageHeader';
import { SectionCard } from '../../common/SectionCard';
import { StatCard } from '../../common/StatCard';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Input } from '../../ui/Input';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { FormField } from '../../common/FormField';
import { DateText } from '../../common/DateText';
import { NumberText } from '../../common/NumberText';
import { StatusBadge } from '../../common/StatusBadge';
import { ProgressBar } from '../../common/ProgressBar';

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
  } = useApp();

  // Top navigation tabs
  const [activeTab, setActiveTab] = useState('evaluation-form'); // 'evaluation-form', 'collective-meeting', 'batch-approval', 'calibration-adjust', '360-review', 'timeline'
  const [wizardStep, setWizardStep] = useState(1); // 1: Self assessment, 2: Manager assessment, 3: Collective/Peer, 4: Final Rank & Conclusion

  // Select target evaluation plan
  const [selectedPlanId, setSelectedPlanId] = useState(() => {
    const userPlan = kpiPlans.find((p) => p.employeeId === currentUser.id);
    return userPlan ? userPlan.id : kpiPlans[0]?.id;
  });

  const targetPlan = kpiPlans.find((p) => p.id === selectedPlanId) || kpiPlans[0];
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => {} },
          { label: 'Quy trình Đánh giá' },
          {
            label:
              activeTab === 'evaluation-form'
                ? 'Phiếu đánh giá nhiều bước'
                : activeTab === 'collective-meeting'
                ? 'Hội nghị tập thể (NĐ 90)'
                : activeTab === 'batch-approval'
                ? 'Duyệt hàng loạt'
                : activeTab === 'calibration-adjust'
                ? 'Hiệu chỉnh xếp loại'
                : 'Đánh giá 360°',
          },
        ]}
        title={
          systemOperatingMode === 'GOVERNMENT'
            ? 'Quy trình Đánh giá & Xếp loại Cán bộ (Nghị định 90/2020 & 48/2023)'
            : 'Quy trình Đánh giá Hiệu suất Toàn diện (Performance Workflow)'
        }
        subtitle="Hỗ trợ State Machine đa bước, điều kiện loại trừ kỷ luật, tiêu chí người đứng đầu và kiểm soát tỷ lệ trần"
        badge={
          <Badge variant="primary" dot>
            Workflow: {systemOperatingMode === 'GOVERNMENT' ? 'Mẫu Nhà nước (NĐ 90)' : 'Mẫu Doanh nghiệp (BSC/360)'}
          </Badge>
        }
        actions={
          <SegmentedControl
            options={[
              { value: 'evaluation-form', label: 'Phiếu đánh giá', icon: Award },
              {
                value: 'collective-meeting',
                label: systemOperatingMode === 'GOVERNMENT' ? 'Hội nghị tập thể' : 'Calibration',
                icon: Vote,
              },
              { value: '360-review', label: 'Góp ý 360°', icon: Users2 },
              { value: 'batch-approval', label: `Duyệt hàng loạt (${kpiPlans.length})`, icon: CheckSquare },
              { value: 'calibration-adjust', label: 'Hiệu chỉnh điểm', icon: Edit3 },
            ]}
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
            size="md"
          />
        }
      />

      {/* Select Employee Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Chọn hồ sơ đánh giá:
          </span>
          <select
            value={selectedPlanId}
            onChange={(e) => handleSelectPlan(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
          >
            {kpiPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.employeeName} — {p.positionTitle} ({p.departmentName}) [{p.statusName || 'Đang thực hiện'}]
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {disciplineInfo && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Có kỷ luật ({disciplineInfo.typeName}) • Giới hạn: {disciplineInfo.maxAllowedRank}
            </span>
          )}

          {isLeader && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              <Briefcase className="w-3.5 h-3.5" />
              Người đứng đầu (70% kết quả đơn vị)
            </span>
          )}
        </div>
      </div>

      {/* ==============================================================================
          TAB 1: PHIẾU ĐÁNH GIÁ NHIỀU BƯỚC (MULTI-STEP FORM)
          ============================================================================== */}
      {activeTab === 'evaluation-form' && (
        <div className="space-y-6">
          {/* Stepper Progress */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs font-semibold">
            <button
              onClick={() => setWizardStep(1)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                wizardStep === 1 ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 font-bold' : 'text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[11px]">1</span>
              <span>Cá nhân tự chấm điểm</span>
            </button>
            <ChevronRight className="w-4 h-4 text-slate-300" />

            <button
              onClick={() => setWizardStep(2)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                wizardStep === 2 ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 font-bold' : 'text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[11px]">2</span>
              <span>Quản lý trực tiếp chấm điểm</span>
            </button>
            <ChevronRight className="w-4 h-4 text-slate-300" />

            <button
              onClick={() => setWizardStep(3)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                wizardStep === 3 ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 font-bold' : 'text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[11px]">3</span>
              <span>{systemOperatingMode === 'GOVERNMENT' ? 'Biểu quyết Hội nghị tập thể' : 'Điểm 360 & Calibration'}</span>
            </button>
            <ChevronRight className="w-4 h-4 text-slate-300" />

            <button
              onClick={() => setWizardStep(4)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                wizardStep === 4 ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 font-bold' : 'text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[11px]">4</span>
              <span>Kết luận & Xếp loại</span>
            </button>
          </div>

          {/* Step 1 & Step 2: Scoring Items */}
          {(wizardStep === 1 || wizardStep === 2) && (
            <SectionCard
              title={
                wizardStep === 1
                  ? `Bước 1: Cá nhân Tự nhận xét & Chấm điểm: ${targetPlan?.employeeName}`
                  : `Bước 2: Trưởng đơn vị Đánh giá & Chấm điểm: ${targetPlan?.employeeName}`
              }
              description="Chấm điểm từng chỉ tiêu theo trọng số. Điểm tối đa không vượt quá 120% trọng số chỉ tiêu."
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
                          <span className="text-slate-400">• Trọng số: {item.weight}%</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                          {item.name}
                        </h4>
                      </div>

                      <div className="text-right text-xs">
                        <span className="text-slate-500">Mục tiêu: {item.target} {item.unit}</span>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          Thực tế: {item.actual || 0} {item.unit} ({item.progressPercent || 0}%)
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Điểm tự chấm (Max: {item.weight * 1.2}đ):
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          disabled={wizardStep !== 1}
                          value={selfScores[item.id] || 0}
                          onChange={(e) =>
                            setSelfScores({ ...selfScores, [item.id]: Number(e.target.value) })
                          }
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Quản lý chấm (Max: {item.weight * 1.2}đ):
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          disabled={wizardStep !== 2}
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
                  <FormField label="Nhận xét của Quản lý trực tiếp về ưu khuyết điểm:">
                    <textarea
                      rows={3}
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                      placeholder="Ghi nhận thái độ công tác, năng lực giải quyết công việc, tinh thần phối hợp..."
                      value={managerFeedback}
                      onChange={(e) => setManagerFeedback(e.target.value)}
                    />
                  </FormField>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-600">
                    Tổng điểm chấm KPI: <strong className="text-primary-600 text-sm tabular-nums">{totalItemScore}</strong> / 100
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleSaveEvaluation(false)}>
                      Lưu nháp điểm
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setWizardStep((prev) => prev + 1)}>
                      Tiếp tục bước sau
                    </Button>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Step 3: Collective Meeting / 360 */}
          {wizardStep === 3 && (
            <SectionCard
              title={systemOperatingMode === 'GOVERNMENT' ? 'Bước 3: Ý kiến của Tập thể & Kết quả Biểu quyết' : 'Bước 3: Tổng hợp Ý kiến 360° & Hiệu chỉnh'}
              description="Nghị định 90/2020 quy định hội nghị tập thể đơn vị họp lấy ý kiến và bỏ phiếu biểu quyết mức xếp loại"
            >
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200">
                    <div className="font-bold">Số phiếu Xuất sắc</div>
                    <div className="text-2xl font-black text-purple-700 tabular-nums">12 / 15</div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
                    <div className="font-bold">Số phiếu Tốt</div>
                    <div className="text-2xl font-black text-emerald-700 tabular-nums">3 / 15</div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200">
                    <div className="font-bold">Số phiếu Hoàn thành</div>
                    <div className="text-2xl font-black text-blue-700 tabular-nums">0 / 15</div>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200">
                    <div className="font-bold">Không hoàn thành</div>
                    <div className="text-2xl font-black text-rose-700 tabular-nums">0 / 15</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <strong className="text-slate-800 dark:text-slate-200">Trích yếu Biên bản Hội nghị lấy ý kiến:</strong>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    "Hội nghị đã nghe đồng chí trình bày bản tự nhận xét đánh giá; các thành viên trong tập thể đã tham gia góp ý thẳng thắn, dân chủ. Toàn thể hội nghị thống nhất đánh giá đồng chí hoàn thành tốt nhiệm vụ được giao."
                  </p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="outline" size="sm" onClick={() => setWizardStep(2)}>
                    Quay lại Bước 2
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setWizardStep(4)}>
                    Tiến hành Xếp loại chung
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Step 4: Final Rank & Conclusion */}
          {wizardStep === 4 && (
            <SectionCard
              title="Bước 4: Kết luận & Ban hành Xếp loại của Người đứng đầu Đơn vị"
              description="Tổng hợp công thức tính điểm, áp dụng điều kiện loại trừ kỷ luật và kiểm soát tỷ lệ khống chế"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Điểm tổng hợp */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Điểm Tổng hợp Tự động
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
                      Mức Xếp loại Đề xuất
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
                        ⚠ Bị chặn không thể xếp loại Xuất sắc/Tốt do có Quyết định kỷ luật!
                      </div>
                    )}
                  </div>

                  {/* Nút thao tác người có thẩm quyền */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Thẩm quyền Quyết định
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        Người đứng đầu có quyền điều chỉnh xếp loại nhưng bắt buộc nhập lý do giải trình.
                      </p>
                    </div>

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
                        Điều chỉnh điểm / Xếp loại
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        icon={FileCheck}
                        onClick={() => handleSaveEvaluation(true)}
                      >
                        Chốt & Ban hành Đánh giá
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Audit trail if adjusted */}
                {targetPlan?.isAdjusted && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <strong>Thông tin điều chỉnh điểm của Người đứng đầu:</strong>
                    <div>Điểm gốc: <strong>{targetPlan.originalScore} ({targetPlan.originalRank})</strong> $\to$ Điểm sau điều chỉnh: <strong>{targetPlan.finalScore} ({targetPlan.finalRank})</strong></div>
                    <div>Người điều chỉnh: <strong>{targetPlan.adjustedBy}</strong> lúc {targetPlan.adjustedAt}</div>
                    <div>Lý do điều chỉnh: <em>"{targetPlan.adjustReason}"</em></div>
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
          title="Nhập Biên bản & Kết quả Biểu quyết của Hội nghị Tập thể (Nghị định 90/2020/NĐ-CP)"
          description="Ghi nhận thành phần tham dự, kết quả bỏ phiếu phân loại của tập thể đơn vị công tác"
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
              <FormField label="Tổng số cán bộ tham dự *" required>
                <Input
                  type="number"
                  value={meetingForm.attendeesCount}
                  onChange={(e) => setMeetingForm({ ...meetingForm, attendeesCount: Number(e.target.value) })}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <FormField label="Phiếu Xuất sắc:">
                <Input
                  type="number"
                  value={meetingForm.voteExcellent}
                  onChange={(e) => setMeetingForm({ ...meetingForm, voteExcellent: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Phiếu Tốt:">
                <Input
                  type="number"
                  value={meetingForm.voteGood}
                  onChange={(e) => setMeetingForm({ ...meetingForm, voteGood: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Phiếu Hoàn thành:">
                <Input
                  type="number"
                  value={meetingForm.voteCompleted}
                  onChange={(e) => setMeetingForm({ ...meetingForm, voteCompleted: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Không hoàn thành:">
                <Input
                  type="number"
                  value={meetingForm.voteFailed}
                  onChange={(e) => setMeetingForm({ ...meetingForm, voteFailed: Number(e.target.value) })}
                />
              </FormField>
            </div>

            <FormField label="Trích yếu biên bản hội nghị lấy ý kiến *">
              <textarea
                rows={4}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                value={meetingForm.meetingMinutes}
                onChange={(e) => setMeetingForm({ ...meetingForm, meetingMinutes: e.target.value })}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="primary" size="sm" type="submit" icon={Save}>
                Lưu Biên bản Hội nghị Tập thể
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
          title={`Phiếu Lấy Ý kiến Đánh giá Chéo 360°: ${targetPlan?.employeeName}`}
          description="Đồng nghiệp đóng góp ý kiến về tinh thần hợp tác, thái độ công vụ và tính kỷ luật"
        >
          <form onSubmit={handleSavePeerReview} className="space-y-4 max-w-xl text-xs">
            <FormField label="Điểm Tinh thần Hợp tác & Hỗ trợ (Max 100):">
              <Input
                type="number"
                value={peerForm.cooperationScore}
                onChange={(e) => setPeerForm({ ...peerForm, cooperationScore: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Điểm Thái độ Phục vụ & Trách nhiệm (Max 100):">
              <Input
                type="number"
                value={peerForm.attitudeScore}
                onChange={(e) => setPeerForm({ ...peerForm, attitudeScore: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Điểm Kỷ luật Công vụ & Giờ giấc (Max 100):">
              <Input
                type="number"
                value={peerForm.disciplineScore}
                onChange={(e) => setPeerForm({ ...peerForm, disciplineScore: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Nhận xét cụ thể của đồng nghiệp:">
              <textarea
                rows={3}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                value={peerForm.comment}
                onChange={(e) => setPeerForm({ ...peerForm, comment: e.target.value })}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="primary" size="sm" type="submit" icon={Send}>
                Gửi Phiếu Đánh giá 360°
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
          title="Màn hình Duyệt Hàng loạt Hồ sơ Đánh giá Đơn vị"
          description="Cho phép Trưởng phòng hoặc Lãnh đạo chọn cùng lúc nhiều cán bộ để duyệt nhanh chốt kết quả"
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
                onClick={() => batchApproveEvaluations(selectedBatchIds, batchNote)}
              >
                Phê duyệt ({selectedBatchIds.length}) hồ sơ
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
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
                        <div className="text-slate-400">{plan.positionTitle} • {plan.departmentName}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-slate-500">Điểm đánh giá:</span>
                        <div className="font-bold text-primary-600 tabular-nums">{plan.finalScore || 88} điểm</div>
                      </div>
                      <Badge variant={plan.finalRank === 'XUẤT SẮC' ? 'excellent' : 'good'}>
                        {plan.finalRank || 'TỐT'}
                      </Badge>
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
          title="Cấu hình Quy tắc Khống chế Tỷ lệ & Hiệu chỉnh Xếp loại"
          description="Thiết lập chính sách cảnh báo hoặc chặn cứng trần 20% Xuất sắc theo quy định"
        >
          <div className="max-w-xl space-y-4 text-xs">
            <FormField label="Chính sách khống chế trần Xuất sắc (Nghị định 90/2020):">
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
              <FormField label="Điểm điều chỉnh mới *" required>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={adjustForm.adjustedScore}
                  onChange={(e) => setAdjustForm({ ...adjustForm, adjustedScore: e.target.value })}
                />
              </FormField>

              <FormField label="Mức xếp loại mới *" required>
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

              <FormField label="Lý do điều chỉnh (BẮT BUỘC theo kiểm toán) *" required>
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
