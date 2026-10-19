import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  BookOpen,
  GitFork,
  FileCheck2,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Send,
  Sparkles,
  Info,
  ChevronDown,
  Layers,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Edit3,
  Lock,
  Unlock,
  History,
  Upload,
  Download,
  FileSpreadsheet,
  Eye,
  RefreshCw,
  Sliders,
  Target,
  Check,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
  X,
  User,
  Building2,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { ProcessFlow } from '../../common/ProcessFlow';
import { FormField } from '../../common/FormField';
import { InfoTip } from '../../ui/InfoTip';
import { Modal } from '../../ui/Modal';
import { getPlanStage } from '../../../utils/labels';
import { PageHeader } from '../../common/PageHeader';
import { SectionCard } from '../../common/SectionCard';
import { StatCard } from '../../common/StatCard';
import { StatusBadge } from '../../common/StatusBadge';
import { ProgressBar } from '../../common/ProgressBar';
import { DateText } from '../../common/DateText';
import { NumberText } from '../../common/NumberText';

const WIZARD_STEPS = [
  { step: 1, label: 'Người nhận', icon: User },
  { step: 2, label: 'Chọn chỉ tiêu', icon: BookOpen },
  { step: 3, label: 'Mục tiêu & trọng số', icon: Sliders },
  { step: 4, label: 'Xác nhận', icon: Send },
];

const GOAL_LEVELS = {
  DIRECTOR: { label: 'Cấp cơ quan', dot: 'bg-amber-500' },
  MANAGER: { label: 'Cấp đơn vị', dot: 'bg-primary-500' },
  EMPLOYEE: { label: 'Cấp cá nhân', dot: 'bg-emerald-500' },
};

const PLAN_STATUS = {
  DRAFT: { label: 'Bản nháp', variant: 'default' },
  ASSIGNED: { label: 'Chờ cán bộ xác nhận', variant: 'primary' },
  FEEDBACK_REQUESTED: { label: 'Cán bộ đề nghị sửa', variant: 'danger' },
  ACCEPTED: { label: 'Chờ phê duyệt', variant: 'warning' },
  APPROVED: { label: 'Đã phê duyệt', variant: 'success' },
  LOCKED: { label: 'Đã khóa', variant: 'purple' },
};

export const Module2_KPILibraryPlanning = () => {
  const {
    kpiLibrary,
    addKpiToLibrary,
    updateKpiInLibrary,
    deleteKpiFromLibrary,
    kpiTemplates = [],
    cascadingGoals,
    kpiPlans,
    currentUser,
    users,
    departments,
    periods,
    activePeriod,
    setActivePeriodId,
    createOrUpdatePlan,
    submitKpiPlan,
    approveKpiPlan,
    rejectKpiPlan,
    assignKpiPlan,
    acceptKpiPlan,
    feedbackKpiPlan,
    lockKpiPlan,
    reviseKpiPlan,
    validateKpiWeight,
    activeRole,
    importKpiBatch,
    showToast,
  } = useApp();

  // Active top-level tab
  const [activeTab, setActiveTab] = useState('workflow'); // 'wizard', 'cascading', 'workflow', 'library', 'import'

  // ==============================================================================
  // 1. WIZARD GIAO KPI STATE & LOGIC
  // ==============================================================================
  const [wizardStep, setWizardStep] = useState(1); // 1: Period & Target, 2: Select KPIs, 3: Configure Weights/Formulas, 4: Preview & Assign
  const [wizardPeriodId, setWizardPeriodId] = useState(activePeriod?.id || periods[0]?.id);
  const [wizardAssigneeType, setWizardAssigneeType] = useState('USER'); // 'USER' or 'DEPARTMENT'
  const [wizardTargetUserId, setWizardTargetUserId] = useState(users[0]?.id || '');
  const [wizardTargetDeptId, setWizardTargetDeptId] = useState(departments[0]?.id || '');
  const [wizardSelectedTemplateId, setWizardSelectedTemplateId] = useState('');
  const [wizardParentKpiId, setWizardParentKpiId] = useState('');

  // Items currently configured in the wizard
  const [wizardItems, setWizardItems] = useState([
    {
      id: 'w-item-1',
      code: 'KPI-DEV-01',
      name: 'Tỷ lệ hoàn thành đúng hạn các nhiệm vụ / tính năng phần mềm',
      category: 'Quy trình nội bộ',
      kpiType: 'QUANTITATIVE',
      unit: '%',
      targetDirection: 'HIGHER_IS_BETTER',
      target: 95,
      minThreshold: 80,
      maxThreshold: 120,
      scoringMethod: 'LINEAR',
      weight: 35,
      bonusPoints: 0,
      penaltyPoints: 0,
    },
    {
      id: 'w-item-2',
      code: 'KPI-DEV-02',
      name: 'Thời gian phản hồi API trung bình hệ thống tác nghiệp (Response Time)',
      category: 'Chất lượng & Kỹ thuật',
      kpiType: 'QUANTITATIVE',
      unit: 'ms',
      targetDirection: 'LOWER_IS_BETTER',
      target: 200,
      minThreshold: 150,
      maxThreshold: 350,
      scoringMethod: 'LINEAR',
      weight: 35,
      bonusPoints: 0,
      penaltyPoints: 0,
    },
    {
      id: 'w-item-3',
      code: 'KPI-LRN-01',
      name: 'Số giờ hoàn thành các khóa bồi dưỡng chuyên môn & chứng chỉ nghề nghiệp',
      category: 'Học hỏi & Phát triển (BSC)',
      kpiType: 'QUANTITATIVE',
      unit: 'Giờ',
      targetDirection: 'HIGHER_IS_BETTER',
      target: 24,
      minThreshold: 16,
      maxThreshold: 40,
      scoringMethod: 'LINEAR',
      weight: 30,
      bonusPoints: 0,
      penaltyPoints: 0,
    },
  ]);

  // Total weight validation for wizard
  const wizardWeightCheck = useMemo(() => {
    return validateKpiWeight(wizardItems);
  }, [wizardItems, validateKpiWeight]);

  // Selected target object
  const wizardSelectedUser = users.find((u) => u.id === wizardTargetUserId);
  const wizardSelectedDept = departments.find((d) => d.id === wizardTargetDeptId);
  const wizardSelectedPeriod = periods.find((p) => p.id === wizardPeriodId);

  // Load items from template into wizard
  const handleApplyTemplateToWizard = (templateId) => {
    const tpl = kpiTemplates.find((t) => t.id === templateId);
    if (!tpl) return;
    const loadedItems = tpl.items.map((it, idx) => ({
      id: `w-tpl-${Date.now()}-${idx}`,
      code: it.kpiCode,
      name: it.name,
      category: it.category,
      kpiType: it.kpiType || 'QUANTITATIVE',
      unit: it.unit,
      targetDirection: it.targetDirection || 'HIGHER_IS_BETTER',
      target: it.target,
      minThreshold: it.minThreshold || Math.round(it.target * 0.8),
      maxThreshold: it.maxThreshold || Math.round(it.target * 1.2),
      scoringMethod: it.scoringMethod || 'LINEAR',
      weight: it.weight || 25,
      bonusPoints: 0,
      penaltyPoints: 0,
    }));
    setWizardItems(loadedItems);
    setWizardSelectedTemplateId(templateId);
    showToast(`Đã nạp ${loadedItems.length} chỉ tiêu từ khung "${tpl.name}"!`);
  };

  // Add Item to Wizard from KPI Library
  const handleAddLibraryItemToWizard = (libItem) => {
    if (wizardItems.some((i) => i.code === libItem.code)) {
      showToast('Chỉ tiêu này đã có trong danh sách thiết lập!', 'warning');
      return;
    }
    const newItem = {
      id: `w-add-${Date.now()}`,
      code: libItem.code,
      name: libItem.name,
      category: libItem.category,
      kpiType: libItem.kpiType || 'QUANTITATIVE',
      unit: libItem.unit,
      targetDirection: libItem.targetDirection === 'MIN' ? 'LOWER_IS_BETTER' : 'HIGHER_IS_BETTER',
      target: libItem.defaultTarget || 100,
      minThreshold: libItem.minThreshold || (libItem.defaultTarget ? Math.round(libItem.defaultTarget * 0.8) : 80),
      maxThreshold: libItem.maxThreshold || (libItem.defaultTarget ? Math.round(libItem.defaultTarget * 1.2) : 120),
      scoringMethod: libItem.formulaType === 'PERCENT' ? 'LINEAR' : 'STEP',
      weight: 10,
      bonusPoints: 0,
      penaltyPoints: 0,
    };
    setWizardItems([...wizardItems, newItem]);
    showToast(`Đã thêm "${libItem.name}" vào danh sách!`);
  };

  const updateWizardItem = (index, patch) =>
    setWizardItems((items) => items.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  // Auto-balance weights to exactly 100%
  const handleAutoBalanceWeights = () => {
    if (wizardItems.length === 0) return;
    const count = wizardItems.length;
    const baseWeight = Math.floor(100 / count);
    const remainder = 100 - baseWeight * count;

    const balanced = wizardItems.map((item, idx) => ({
      ...item,
      weight: idx === 0 ? baseWeight + remainder : baseWeight,
    }));
    setWizardItems(balanced);
    showToast('Đã tự động cân bằng tổng trọng số về đúng 100%!');
  };

  // Finalize Wizard: Assign KPI
  const handleFinishWizard = (isDraft = false) => {
    if (!isDraft && !wizardWeightCheck.isValid) {
      showToast(wizardWeightCheck.message, 'error');
      return;
    }

    const targetName =
      wizardAssigneeType === 'USER'
        ? wizardSelectedUser?.name || 'Nhân sự'
        : wizardSelectedDept?.name || 'Đơn vị';

    const newPlan = {
      id: `plan-${Date.now()}`,
      periodId: wizardPeriodId,
      periodName: wizardSelectedPeriod?.name,
      employeeId: wizardAssigneeType === 'USER' ? wizardTargetUserId : null,
      employeeName: targetName,
      departmentId: wizardAssigneeType === 'DEPARTMENT' ? wizardTargetDeptId : wizardSelectedUser?.departmentId,
      departmentName: wizardAssigneeType === 'DEPARTMENT' ? wizardSelectedDept?.name : wizardSelectedUser?.departmentName,
      positionTitle: wizardSelectedUser?.positionTitle || 'Đơn vị / Phòng ban',
      status: isDraft ? 'DRAFT' : 'ASSIGNED',
      statusName: isDraft ? 'Bản nháp' : 'Quản lý đã giao',
      assignedById: currentUser.id,
      assignedByName: currentUser.name,
      assignedDate: new Date().toISOString().split('T')[0],
      version: 1,
      totalWeight: wizardWeightCheck.totalWeight,
      parentKpiId: wizardParentKpiId || null,
      items: wizardItems.map((it, idx) => ({
        id: `pi-${Date.now()}-${idx}`,
        kpiCode: it.code,
        name: it.name,
        category: it.category,
        unit: it.unit,
        target: Number(it.target),
        actual: 0,
        weight: Number(it.weight),
        kpiType: it.kpiType,
        scoringMethod: it.scoringMethod,
        targetDirection: it.targetDirection,
        minThreshold: Number(it.minThreshold),
        maxThreshold: Number(it.maxThreshold),
        bonusPoints: Number(it.bonusPoints || 0),
        penaltyPoints: Number(it.penaltyPoints || 0),
      })),
    };

    createOrUpdatePlan(newPlan);
    showToast(isDraft ? 'Đã lưu bản nháp bảng KPI!' : `Đã giao KPI chính thức cho ${targetName}!`);
    setActiveTab('workflow');
  };

  // ==============================================================================
  // 2. WORKFLOW (DANH SÁCH BẢNG GIAO & DUYỆT & ĐIỀU CHỈNH GIỮA KỲ)
  // ==============================================================================
  const [workflowFilterPeriod, setWorkflowFilterPeriod] = useState('ALL');
  const [workflowFilterStatus, setWorkflowFilterStatus] = useState('ALL');
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null);

  // Mid-term revision modal state
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionPlan, setRevisionPlan] = useState(null);
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionItems, setRevisionItems] = useState([]);

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackPlanId, setFeedbackPlanId] = useState(null);

  // Filtered plans list
  const isSelfOnly = activeRole === 'EMPLOYEE' || activeRole === 'PEER_REVIEWER';
  const canApprove = ['SYSTEM_ADMIN', 'EXECUTIVE', 'UNIT_HEAD', 'LINE_MANAGER'].includes(activeRole);
  const canLock = ['SYSTEM_ADMIN', 'HR_OFFICER', 'EXECUTIVE'].includes(activeRole);

  const filteredPlans = useMemo(() => {
    return kpiPlans.filter((p) => {
      const matchOwner = !isSelfOnly || p.employeeId === currentUser.id;
      const matchPeriod = workflowFilterPeriod === 'ALL' || p.periodId === workflowFilterPeriod;
      const matchStatus = workflowFilterStatus === 'ALL' || p.status === workflowFilterStatus;
      return matchOwner && matchPeriod && matchStatus;
    });
  }, [kpiPlans, workflowFilterPeriod, workflowFilterStatus, isSelfOnly, currentUser.id]);

  // Open Revision Modal
  const handleOpenRevision = (plan) => {
    setRevisionPlan(plan);
    setRevisionReason('');
    setRevisionItems(JSON.parse(JSON.stringify(plan.items || [])));
    setShowRevisionModal(true);
  };

  // Submit Revision
  const handleSaveRevision = () => {
    if (!revisionReason.trim()) {
      showToast('Lý do điều chỉnh giữa kỳ là BẮT BUỘC theo quy định kiểm toán!', 'error');
      return;
    }
    const success = reviseKpiPlan(revisionPlan.id, revisionReason, revisionItems);
    if (success) {
      setShowRevisionModal(false);
      if (selectedPlanDetail?.id === revisionPlan.id) {
        setSelectedPlanDetail((prev) => ({
          ...prev,
          version: (prev.version || 1) + 1,
          items: revisionItems,
          status: 'ASSIGNED',
          statusName: `Đã điều chỉnh (v${(prev.version || 1) + 1}) - Chờ duyệt lại`,
        }));
      }
    }
  };

  // ==============================================================================
  // 3. EXCEL IMPORT KPI STATE & LOGIC
  // ==============================================================================
  const [excelText, setExcelText] = useState('');
  const [importReport, setImportReport] = useState(null);
  const [skipExcelErrors, setSkipExcelErrors] = useState(false);

  // Sample CSV format for KPI
  const sampleKpiCsv = `Mã KPI,Tên chỉ tiêu,Phân loại,Đơn vị tính,Chỉ tiêu mục tiêu,Trọng số (%),Phương pháp tính,Chiều hướng
KPI-DEV-01,Tỷ lệ hoàn thành đúng hạn tính năng,Quy trình nội bộ,%,95,35,LINEAR,HIGHER_IS_BETTER
KPI-DEV-02,Thời gian phản hồi API trung bình,Chất lượng & Kỹ thuật,ms,200,35,LINEAR,LOWER_IS_BETTER
KPI-LRN-01,Số giờ hoàn thành chứng chỉ chuyên môn,Học hỏi & Phát triển (BSC),Giờ,24,30,LINEAR,HIGHER_IS_BETTER`;

  const handleDownloadSampleKpiExcel = () => {
    const blob = new Blob([sampleKpiCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_Import_Chi_Tieu_KPI.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải tệp mẫu!');
  };

  const handleProcessExcel = () => {
    if (!excelText.trim()) {
      showToast('Vui lòng dán dữ liệu hoặc chọn tệp Excel!', 'warning');
      return;
    }

    const lines = excelText.trim().split('\n');
    const rows = [];

    // Parse lines (skipping header if first line)
    const startIndex = lines[0].includes('Mã KPI') ? 1 : 0;
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      rows.push({
        code: cols[0] || '',
        name: cols[1] || '',
        category: cols[2] || 'Quy trình nội bộ',
        unit: cols[3] || '%',
        target: cols[4] || 100,
        weight: cols[5] || 0,
        scoringMethod: cols[6] || 'LINEAR',
        targetDirection: cols[7] || 'MAX',
      });
    }

    const report = importKpiBatch(rows, skipExcelErrors);
    setImportReport(report);
  };

  // ==============================================================================
  // 4. CASCADING TREE RENDERER
  // ==============================================================================
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  const toggleNodeCollapse = (nodeId) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const renderCascadingTreeNode = (node, depth = 0) => {
    const isCollapsed = collapsedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const level = GOAL_LEVELS[node.level] || GOAL_LEVELS.EMPLOYEE;

    return (
      <div key={node.id} className={depth > 0 ? 'ml-6 pl-4 border-l border-slate-200 dark:border-slate-800' : ''}>
        <div className="flex items-center gap-3 py-3">
          <button
            type="button"
            onClick={() => hasChildren && toggleNodeCollapse(node.id)}
            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
              hasChildren ? 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800' : 'invisible'
            }`}
            aria-label={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            <ChevronDown size={16} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
          </button>
          <span className={`w-2 h-2 rounded-full shrink-0 ${level.dot}`} title={level.label} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">{node.title}</div>
            <div className="text-xs text-slate-500 leading-snug">
              {node.ownerName} · {node.department} · Mục tiêu {node.targetValue}
            </div>
          </div>
          <span className="hidden sm:block text-xs text-slate-400 tabular-nums w-16 text-right">{node.weight}%</span>
          <div className="w-32 shrink-0">
            <ProgressBar value={node.progress} showValue size="sm" />
          </div>
        </div>
        {hasChildren && !isCollapsed && node.children.map((child) => renderCascadingTreeNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Yêu cầu Bước 5) */}
      <PageHeader
        icon={Target}
        title="Giao chỉ tiêu KPI"
        subtitle="Mục tiêu cơ quan được phân rã xuống đơn vị và từng cá nhân. Quản lý giao phiếu KPI (tổng trọng số phải đúng 100%), cán bộ xác nhận hoặc góp ý, lãnh đạo phê duyệt rồi khóa phiếu trước khi thực hiện."
      />

      <SegmentedControl
        options={[
          { value: 'workflow', label: 'Phiếu KPI', icon: FileCheck2, badge: filteredPlans.length },
          ...(canApprove ? [{ value: 'wizard', label: 'Giao mới', icon: Sparkles }] : []),
          { value: 'cascading', label: 'Mục tiêu phân cấp', icon: GitFork },
          { value: 'library', label: 'Thư viện', icon: BookOpen, badge: kpiLibrary.length },
          ...(canApprove || canLock ? [{ value: 'import', label: 'Nhập Excel', icon: Upload }] : []),
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val)}
      />

      {/* ==============================================================================
          TAB 1: WIZARD GIAO KPI
          ============================================================================== */}
      {activeTab === 'wizard' && (
        <Card padding="none">
          <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800">
            {WIZARD_STEPS.map(({ step, label, icon: StepIcon }) => {
              const active = wizardStep === step;
              const done = wizardStep > step;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => step < wizardStep && setWizardStep(step)}
                  className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 sm:px-6 py-4 text-sm border-b-2 -mb-px transition-colors ${
                    active
                      ? 'border-primary-600 text-primary-700 dark:text-primary-300 font-semibold'
                      : done
                      ? 'border-transparent text-slate-600 dark:text-slate-300 hover:text-primary-600 cursor-pointer'
                      : 'border-transparent text-slate-400 cursor-default'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      done ? 'bg-emerald-500 text-white' : active ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {done ? <Check size={14} /> : <StepIcon size={14} />}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6 space-y-6">
            {wizardStep === 1 && (
              <div className="grid gap-5 sm:grid-cols-2 max-w-3xl">
                <FormField label="Kỳ đánh giá">
                  <Select value={wizardPeriodId} onChange={(e) => setWizardPeriodId(e.target.value)}>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Giao cho">
                  <SegmentedControl
                    options={[
                      { value: 'USER', label: 'Cá nhân', icon: User },
                      { value: 'DEPARTMENT', label: 'Đơn vị', icon: Building2 },
                    ]}
                    value={wizardAssigneeType}
                    onChange={setWizardAssigneeType}
                    size="sm"
                  />
                </FormField>
                <div className="sm:col-span-2">
                  {wizardAssigneeType === 'USER' ? (
                    <FormField label="Cán bộ">
                      <Select value={wizardTargetUserId} onChange={(e) => setWizardTargetUserId(e.target.value)}>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} — {u.positionTitle}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  ) : (
                    <FormField label="Đơn vị">
                      <Select value={wizardTargetDeptId} onChange={(e) => setWizardTargetDeptId(e.target.value)}>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  )}
                  {wizardAssigneeType === 'USER' && wizardSelectedUser && (
                    <p className="mt-2 text-sm text-slate-500">
                      {wizardSelectedUser.departmentName} · {wizardSelectedUser.cadreRank || 'Chuyên viên'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <>
                {kpiTemplates.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Dùng bộ mẫu theo vị trí
                      <InfoTip>Nạp toàn bộ chỉ tiêu của một vị trí việc làm, thay cho danh sách đang chọn.</InfoTip>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {kpiTemplates.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleApplyTemplateToWizard(tpl.id)}
                          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:border-primary-400 hover:text-primary-700 transition-colors"
                        >
                          <Sparkles size={14} className="text-primary-500" />
                          {tpl.name}
                          <span className="text-xs text-slate-400">{tpl.items.length}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Thư viện chỉ tiêu</span>
                    <span className="text-slate-500">
                      Đã chọn <strong className="text-primary-600">{wizardItems.length}</strong>
                    </span>
                  </div>
                  <ul className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
                    {kpiLibrary.map((item) => {
                      const isAdded = wizardItems.some((i) => i.code === item.code);
                      return (
                        <li key={item.id} className="flex items-center gap-4 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">{item.name}</div>
                            <div className="text-xs text-slate-400">
                              {item.category} · {item.unit}
                            </div>
                          </div>
                          {isAdded ? (
                            <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                              <Check size={16} /> Đã chọn
                            </span>
                          ) : (
                            <Button size="sm" variant="outline" icon={Plus} onClick={() => handleAddLibraryItemToWizard(item)}>
                              Chọn
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}

            {wizardStep === 3 && (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Chỉ tiêu</th>
                        <th className="px-4 py-3 font-medium w-40">Mục tiêu</th>
                        <th className="px-4 py-3 font-medium w-48">Chiều đánh giá</th>
                        <th className="px-4 py-3 font-medium w-28">Trọng số</th>
                        <th className="px-2 py-3 w-12" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {wizardItems.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{item.name}</div>
                            <div className="text-xs text-slate-400">{item.code}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={item.target}
                                onChange={(e) => updateWizardItem(index, { target: Number(e.target.value) })}
                              />
                              <span className="text-xs text-slate-400 shrink-0">{item.unit}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={item.targetDirection || 'HIGHER_IS_BETTER'}
                              onChange={(e) => updateWizardItem(index, { targetDirection: e.target.value })}
                            >
                              <option value="HIGHER_IS_BETTER">Càng cao càng tốt</option>
                              <option value="LOWER_IS_BETTER">Càng thấp càng tốt</option>
                            </Select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={item.weight}
                                onChange={(e) => updateWizardItem(index, { weight: Number(e.target.value) })}
                              />
                              <span className="text-xs text-slate-400">%</span>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={Trash2}
                              aria-label="Bỏ chỉ tiêu"
                              title="Bỏ chỉ tiêu"
                              onClick={() => setWizardItems(wizardItems.filter((_, i) => i !== index))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  className={`flex flex-wrap items-center gap-4 rounded-xl px-4 py-3 ${
                    wizardWeightCheck.isValid
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}
                >
                  {wizardWeightCheck.isValid ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  <span className="text-sm">
                    Tổng trọng số <strong className="tabular-nums">{wizardWeightCheck.totalWeight}%</strong>
                    {!wizardWeightCheck.isValid && ' — cần đúng 100%'}
                  </span>
                  <div className="flex-1" />
                  {!wizardWeightCheck.isValid && (
                    <Button size="sm" variant="outline" icon={RotateCcw} onClick={handleAutoBalanceWeights}>
                      Chia đều
                    </Button>
                  )}
                </div>
              </>
            )}

            {wizardStep === 4 && (
              <>
                <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                  {[
                    ['Kỳ', wizardSelectedPeriod?.name],
                    ['Giao cho', wizardAssigneeType === 'USER' ? wizardSelectedUser?.name : wizardSelectedDept?.name],
                    ['Số chỉ tiêu', wizardItems.length],
                    ['Tổng trọng số', `${wizardWeightCheck.totalWeight}%`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-slate-500">{k}</dt>
                      <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="max-w-xl">
                  <FormField label="Gắn với mục tiêu cấp trên" hint="Giúp theo dõi chỉ tiêu cá nhân đóng góp vào mục tiêu nào của đơn vị, cơ quan.">
                    <Select value={wizardParentKpiId} onChange={(e) => setWizardParentKpiId(e.target.value)}>
                      <option value="">Không gắn</option>
                      {cascadingGoals.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                <ul className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {wizardItems.map((it) => (
                    <li key={it.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                      <span className="flex-1 min-w-0 leading-snug text-slate-800 dark:text-slate-200">{it.name}</span>
                      <span className="text-slate-500 tabular-nums">
                        {it.target} {it.unit}
                      </span>
                      <span className="w-12 text-right font-medium tabular-nums">{it.weight}%</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            {wizardStep > 1 ? (
              <Button variant="ghost" icon={ArrowLeft} onClick={() => setWizardStep(wizardStep - 1)}>
                Quay lại
              </Button>
            ) : (
              <span />
            )}
            {wizardStep < 4 ? (
              <Button
                rightIcon={ArrowRight}
                onClick={() => {
                  if (wizardStep === 2 && wizardItems.length === 0) {
                    showToast('Vui lòng chọn ít nhất 1 chỉ tiêu!', 'warning');
                    return;
                  }
                  setWizardStep(wizardStep + 1);
                }}
              >
                Tiếp tục
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleFinishWizard(true)}>
                  Lưu nháp
                </Button>
                <Button icon={Send} disabled={!wizardWeightCheck.isValid} onClick={() => handleFinishWizard(false)}>
                  Giao KPI
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ==============================================================================
          TAB 2: CÂY CASCADE MỤC TIÊU (CÂY CHA XUỐNG CON)
          ============================================================================== */}
      {activeTab === 'cascading' && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              {Object.values(GOAL_LEVELS).map((l) => (
                <span key={l.label} className="inline-flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                  {l.label}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setCollapsedNodes(new Set())}>
                Mở hết
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const allIds = new Set();
                  cascadingGoals.forEach((g) => {
                    allIds.add(g.id);
                    g.children?.forEach((c) => allIds.add(c.id));
                  });
                  setCollapsedNodes(allIds);
                }}
              >
                Thu gọn
              </Button>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {cascadingGoals.map((node) => renderCascadingTreeNode(node, 0))}
          </div>
        </Card>
      )}

      {/* ==============================================================================
          TAB 3: QUẢN LÝ BẢNG GIAO & DUYỆT KPI (WORKFLOW & REVISIONS)
          ============================================================================== */}
      {activeTab === 'workflow' && (
        <div className="space-y-6">
          <Card padding="none" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex flex-wrap items-center gap-3 [&>div]:w-52">
                <Select
                  value={workflowFilterPeriod}
                  onChange={(e) => setWorkflowFilterPeriod(e.target.value)}
                  aria-label="Kỳ đánh giá"
                >
                  <option value="ALL">Tất cả kỳ</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={workflowFilterStatus}
                  onChange={(e) => setWorkflowFilterStatus(e.target.value)}
                  aria-label="Trạng thái"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  {Object.entries(PLAN_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </div>
              {canApprove && (
                <Button
                  icon={Plus}
                  onClick={() => {
                    setWizardStep(1);
                    setActiveTab('wizard');
                  }}
                >
                  Giao KPI
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cán bộ</th>
                    <th className="px-4 py-3 font-medium">Đơn vị</th>
                    <th className="px-4 py-3 font-medium text-center">Chỉ tiêu</th>
                    <th className="px-4 py-3 font-medium text-center">Trọng số</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPlans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        Chưa có phiếu KPI nào.
                      </td>
                    </tr>
                  )}
                  {filteredPlans.map((plan) => {
                    const st = PLAN_STATUS[plan.status] || { label: plan.status, variant: 'default' };
                    const isOwner = plan.employeeId === currentUser.id;
                    const weightOk = Number(plan.totalWeight) === 100;
                    return (
                      <tr key={plan.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {plan.employeeName}
                            {isOwner && <span className="ml-2 text-xs text-primary-600">(bạn)</span>}
                          </div>
                          <div className="text-xs text-slate-500">{plan.positionTitle}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{plan.departmentName}</td>
                        <td className="px-4 py-3 text-center tabular-nums">{plan.items?.length || 0}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`tabular-nums font-semibold ${weightOk ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {plan.totalWeight}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={st.variant} size="sm" dot>
                            {st.label}
                          </Badge>
                          {(plan.version || 1) > 1 && (
                            <span className="ml-1.5 text-[11px] text-slate-400">v{plan.version}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {isOwner && plan.status === 'ASSIGNED' && (
                              <>
                                <Button size="sm" icon={Check} onClick={() => acceptKpiPlan(plan.id)}>
                                  Xác nhận
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  icon={MessageSquare}
                                  onClick={() => {
                                    setFeedbackPlanId(plan.id);
                                    setFeedbackText('');
                                    setShowFeedbackModal(true);
                                  }}
                                >
                                  Góp ý
                                </Button>
                              </>
                            )}
                            {!isOwner && canApprove && plan.status === 'ACCEPTED' && (
                              <Button size="sm" icon={CheckCircle2} onClick={() => approveKpiPlan(plan.id)}>
                                Phê duyệt
                              </Button>
                            )}
                            {canLock && plan.status === 'APPROVED' && (
                              <Button size="sm" variant="outline" icon={Lock} onClick={() => lockKpiPlan(plan.id)}>
                                Khóa
                              </Button>
                            )}
                            {canApprove && !isOwner && ['APPROVED', 'LOCKED'].includes(plan.status) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={Edit3}
                                onClick={() => handleOpenRevision(plan)}
                                title="Điều chỉnh giữa kỳ"
                                aria-label="Điều chỉnh giữa kỳ"
                              />
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={Eye}
                              onClick={() => setSelectedPlanDetail(plan)}
                              title="Xem chi tiết"
                              aria-label="Xem chi tiết"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {selectedPlanDetail && (
            <Card className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {selectedPlanDetail.employeeName}
                    <span className="ml-2 text-xs font-normal text-slate-400">v{selectedPlanDetail.version || 1}</span>
                  </h3>
                  <div className="text-sm text-slate-500">
                    {selectedPlanDetail.positionTitle} · {selectedPlanDetail.departmentName}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={X}
                  onClick={() => setSelectedPlanDetail(null)}
                  aria-label="Đóng"
                />
              </div>

              <ProcessFlow currentKey={getPlanStage(selectedPlanDetail, periods.find((p) => p.id === selectedPlanDetail.periodId))} />

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Chỉ tiêu</th>
                      <th className="px-4 py-2.5 font-medium text-right">Mục tiêu</th>
                      <th className="px-4 py-2.5 font-medium text-right">Thực tế</th>
                      <th className="px-4 py-2.5 font-medium text-right">Trọng số</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(selectedPlanDetail.items || []).map((it) => (
                      <tr key={it.id || it.kpiCode}>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{it.name}</div>
                          <div className="text-xs text-slate-400">{it.kpiCode}</div>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {it.target} <span className="text-xs text-slate-400">{it.unit}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-primary-600 font-medium">{it.actual ?? 0}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium">{it.weight}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedPlanDetail.revisions?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <History size={16} className="text-primary-600" />
                    Lịch sử điều chỉnh
                  </div>
                  {selectedPlanDetail.revisions.map((rev, idx) => (
                    <div key={idx} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">v{rev.version}</span>
                        <span>
                          {rev.changedDate} · {rev.changedBy}
                        </span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">{rev.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {activeTab === 'library' && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Chỉ tiêu</th>
                  <th className="px-5 py-3 font-medium">Nhóm</th>
                  <th className="px-5 py-3 font-medium text-right">Mục tiêu mẫu</th>
                  <th className="px-5 py-3 font-medium text-right">Trọng số mẫu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {kpiLibrary.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        {item.name}
                        {item.description && <InfoTip>{item.description}</InfoTip>}
                      </div>
                      <div className="text-xs text-slate-400">{item.code}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{item.category}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      {item.defaultTarget} <span className="text-xs text-slate-400">{item.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">{item.defaultWeight || 20}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'import' && (
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                Dán dữ liệu từ Excel
                <InfoTip>
                  Mỗi dòng một chỉ tiêu, các cột cách nhau bằng dấu phẩy theo đúng thứ tự của tệp mẫu. Hệ thống kiểm tra định dạng, mã trùng và trọng số trước khi lưu.
                </InfoTip>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setExcelText(sampleKpiCsv)}>
                  Dùng dữ liệu mẫu
                </Button>
                <Button size="sm" variant="outline" icon={Download} onClick={handleDownloadSampleKpiExcel}>
                  Tải tệp mẫu
                </Button>
              </div>
            </div>
            <textarea
              rows={7}
              value={excelText}
              onChange={(e) => setExcelText(e.target.value)}
              placeholder="Mã KPI, Tên chỉ tiêu, Nhóm, Đơn vị tính, Mục tiêu, Trọng số, ..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" checked={skipExcelErrors} onChange={(e) => setSkipExcelErrors(e.target.checked)} />
                Bỏ qua dòng lỗi, chỉ nhập dòng hợp lệ
              </label>
              <Button icon={FileSpreadsheet} onClick={handleProcessExcel}>
                Kiểm tra & nhập
              </Button>
            </div>
          </Card>

          {importReport && (
            <Card className="space-y-5">
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  ['Tổng số dòng', importReport.totalRows, 'text-slate-900 dark:text-slate-100'],
                  ['Hợp lệ', importReport.validCount, 'text-emerald-600'],
                  ['Lỗi', importReport.errorCount, 'text-rose-600'],
                  ['Đã nhập', importReport.importedCount, 'text-primary-600'],
                ].map(([k, v, cls]) => (
                  <div key={k}>
                    <dt className="text-xs text-slate-500">{k}</dt>
                    <dd className={`text-2xl font-semibold tabular-nums ${cls}`}>{v}</dd>
                  </div>
                ))}
              </dl>
              {importReport.errors?.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-rose-200 dark:border-rose-900">
                  <table className="w-full text-sm">
                    <thead className="bg-rose-50 dark:bg-rose-950/40 text-left text-xs text-rose-700 dark:text-rose-300">
                      <tr>
                        <th className="px-4 py-2.5 font-medium w-20">Dòng</th>
                        <th className="px-4 py-2.5 font-medium w-40">Cột</th>
                        <th className="px-4 py-2.5 font-medium">Giá trị</th>
                        <th className="px-4 py-2.5 font-medium">Lỗi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100 dark:divide-rose-900/50">
                      {importReport.errors.map((err, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 tabular-nums">{err.rowNumber}</td>
                          <td className="px-4 py-2.5">{err.column}</td>
                          <td className="px-4 py-2.5 font-mono text-xs">{String(err.value)}</td>
                          <td className="px-4 py-2.5 text-rose-600">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      <Modal
        open={showRevisionModal && !!revisionPlan}
        size="lg"
        icon={Edit3}
        title={`Điều chỉnh giữa kỳ · ${revisionPlan?.employeeName || ''}`}
        onClose={() => setShowRevisionModal(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRevisionModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveRevision}>Lưu phiên bản v{(revisionPlan?.version || 1) + 1}</Button>
          </>
        }
      >
        <FormField label="Lý do điều chỉnh" required hint="Bắt buộc. Mỗi lần điều chỉnh tạo một phiên bản mới, phiếu quay lại bước chờ cán bộ xác nhận.">
          <textarea
            rows={3}
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            placeholder="VD: phát sinh nhiệm vụ đột xuất, thay đổi kế hoạch đơn vị..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </FormField>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Chỉ tiêu</th>
                <th className="px-4 py-2.5 font-medium w-36">Mục tiêu</th>
                <th className="px-4 py-2.5 font-medium w-28">Trọng số</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {revisionItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">{item.name}</td>
                  <td className="px-4 py-2.5">
                    <Input
                      type="number"
                      value={item.target}
                      onChange={(e) =>
                        setRevisionItems((list) => list.map((it, i) => (i === idx ? { ...it, target: Number(e.target.value) } : it)))
                      }
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <Input
                      type="number"
                      value={item.weight}
                      onChange={(e) =>
                        setRevisionItems((list) => list.map((it, i) => (i === idx ? { ...it, weight: Number(e.target.value) } : it)))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal
        open={showFeedbackModal}
        size="sm"
        icon={MessageSquare}
        title="Góp ý chỉ tiêu"
        onClose={() => setShowFeedbackModal(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowFeedbackModal(false)}>
              Hủy
            </Button>
            <Button
              icon={Send}
              onClick={() => {
                if (!feedbackText.trim()) {
                  showToast('Vui lòng nhập nội dung góp ý!', 'warning');
                  return;
                }
                feedbackKpiPlan(feedbackPlanId, feedbackText);
                setShowFeedbackModal(false);
              }}
            >
              Gửi
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500">Góp ý được gửi tới quản lý trực tiếp để xem xét trước khi chốt phiếu.</p>
        <textarea
          rows={4}
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="VD: đề nghị giảm mục tiêu do thiếu dữ liệu đầu vào..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </Modal>
    </div>
  );
};
