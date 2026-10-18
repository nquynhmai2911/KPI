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
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { PageHeader } from '../../common/PageHeader';
import { SectionCard } from '../../common/SectionCard';
import { StatCard } from '../../common/StatCard';
import { StatusBadge } from '../../common/StatusBadge';
import { ProgressBar } from '../../common/ProgressBar';
import { DateText } from '../../common/DateText';
import { NumberText } from '../../common/NumberText';

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
    importKpiBatch,
    showToast,
  } = useApp();

  // Active top-level tab
  const [activeTab, setActiveTab] = useState('wizard'); // 'wizard', 'cascading', 'workflow', 'library', 'import'

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
  const filteredPlans = useMemo(() => {
    return kpiPlans.filter((p) => {
      const matchPeriod = workflowFilterPeriod === 'ALL' || p.periodId === workflowFilterPeriod;
      const matchStatus = workflowFilterStatus === 'ALL' || p.status === workflowFilterStatus;
      return matchPeriod && matchStatus;
    });
  }, [kpiPlans, workflowFilterPeriod, workflowFilterStatus]);

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
    showToast('Đã tải xuống tệp mẫu Import KPI!');
  };

  const handleProcessExcel = () => {
    if (!excelText.trim()) {
      showToast('Vui lòng dán dữ liệu hoặc chọn tệp Excel/CSV!', 'warning');
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

    const levelStyles = {
      DIRECTOR: {
        border: '#d97706',
        bg: 'rgba(245, 158, 11, 0.08)',
        badge: 'Cấp Ban Lãnh đạo / Cơ quan Bộ',
        badgeClass: 'badge-gold',
      },
      MANAGER: {
        border: '#2563eb',
        bg: 'rgba(37, 99, 235, 0.06)',
        badge: 'Cấp Cục / Khối / Phòng ban',
        badgeClass: 'badge-blue',
      },
      EMPLOYEE: {
        border: '#10b981',
        bg: 'rgba(16, 185, 129, 0.06)',
        badge: 'Cấp Chuyên viên / Cá nhân',
        badgeClass: 'badge-green',
      },
    };

    const style = levelStyles[node.level] || levelStyles.EMPLOYEE;

    return (
      <div key={node.id} style={{ marginLeft: depth > 0 ? '36px' : 0, marginTop: '14px', position: 'relative' }}>
        {/* Connector line */}
        {depth > 0 && (
          <div
            style={{
              position: 'absolute',
              left: '-22px',
              top: '24px',
              width: '20px',
              height: '2px',
              backgroundColor: style.border,
              opacity: 0.5,
            }}
          />
        )}

        <div
          className="card"
          style={{
            padding: '16px 20px',
            borderLeft: `5px solid ${style.border}`,
            backgroundColor: 'var(--bg-card)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className={`badge ${style.badgeClass}`}>{style.badge}</span>
              <span className="badge badge-gray" style={{ fontFamily: 'monospace' }}>
                {node.code}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {node.department}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                Tiến độ: {node.progress}%
              </span>
              <span className="badge badge-blue">Tỷ trọng: {node.weight}%</span>

              {hasChildren && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => toggleNodeCollapse(node.id)}
                >
                  {isCollapsed ? `+ ${node.children.length} nhánh` : 'Thu gọn'}
                </button>
              )}
            </div>
          </div>

          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            {node.title}
          </h4>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.825rem',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-card-hover)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div>
              Chỉ tiêu mục tiêu: <strong style={{ color: 'var(--text-main)' }}>{node.targetValue}</strong>
            </div>
            <div>
              Người phụ trách: <strong style={{ color: 'var(--text-main)' }}>{node.ownerName}</strong>
            </div>
          </div>
        </div>

        {/* Render child cascading goals */}
        {hasChildren && !isCollapsed && (
          <div style={{ position: 'relative' }}>
            {node.children.map((child) => renderCascadingTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Yêu cầu Bước 5) */}
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => {} },
          { label: 'Kế hoạch & Chỉ tiêu' },
          {
            label:
              activeTab === 'wizard'
                ? 'Wizard giao KPI'
                : activeTab === 'cascading'
                ? 'Cây cascade'
                : activeTab === 'workflow'
                ? 'Bảng giao & Duyệt'
                : activeTab === 'library'
                ? 'Thư viện chỉ tiêu'
                : 'Import Excel',
          },
        ]}
        title="Thiết lập Kỳ Đánh giá & Giao KPI"
        subtitle="Quản trị chu kỳ KPI, cây cascade phân cấp mục tiêu, thư viện mẫu vị trí việc làm và engine kiểm soát tổng trọng số 100%."
        badge={
          <Badge variant="primary" dot>
            Kỳ: {activePeriod?.name || 'Q4/2026'} [{activePeriod?.statusName || 'Đang mở'}]
          </Badge>
        }
        actions={
          <SegmentedControl
            options={[
              { value: 'wizard', label: 'Wizard giao KPI (4 bước)', icon: Sparkles },
              { value: 'cascading', label: 'Cây Cascade mục tiêu', icon: GitFork },
              { value: 'workflow', label: `Bảng giao & Duyệt (${kpiPlans.length})`, icon: FileCheck2 },
              { value: 'library', label: `Thư viện KPI (${kpiLibrary.length})`, icon: BookOpen },
              { value: 'import', label: 'Import Excel', icon: Upload },
            ]}
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
            size="md"
          />
        }
      />

      {/* ==============================================================================
          TAB 1: WIZARD GIAO KPI
          ============================================================================== */}
      {activeTab === 'wizard' && (
        <div>
          {/* STEPPER PROGRESS BAR */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              {[
                { step: 1, title: 'Kỳ & Đối tượng nhận', desc: 'Chọn kỳ và nhân sự/đơn vị' },
                { step: 2, title: 'Chọn Chỉ tiêu KPI', desc: 'Từ khung vị trí hoặc thư viện' },
                { step: 3, title: 'Trọng số & Công thức', desc: 'Kiểm soát tổng = 100%' },
                { step: 4, title: 'Cascade & Xác nhận', desc: 'Liên kết mục tiêu cha và giao' },
              ].map((s) => (
                <div
                  key={s.step}
                  onClick={() => setWizardStep(s.step)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    opacity: wizardStep === s.step ? 1 : wizardStep > s.step ? 0.9 : 0.5,
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor:
                        wizardStep === s.step
                          ? 'var(--primary-600)'
                          : wizardStep > s.step
                          ? 'var(--success-600)'
                          : 'var(--border-color)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {wizardStep > s.step ? <Check size={18} /> : s.step}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: CHỌN KỲ & ĐỐI TƯỢNG */}
          {wizardStep === 1 && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
                Bước 1: Chọn Kỳ Đánh giá và Đối tượng Tiếp nhận KPI
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Kỳ đánh giá áp dụng:
                  </label>
                  <select
                    className="input-select"
                    value={wizardPeriodId}
                    onChange={(e) => setWizardPeriodId(e.target.value)}
                    style={{ width: '100%', padding: '10px' }}
                  >
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — [Trạng thái: {p.statusName}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Loại đối tượng giao KPI:
                  </label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="assigneeType"
                        checked={wizardAssigneeType === 'USER'}
                        onChange={() => setWizardAssigneeType('USER')}
                      />
                      <span>Cá nhân / Cán bộ nhân viên</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="assigneeType"
                        checked={wizardAssigneeType === 'DEPARTMENT'}
                        onChange={() => setWizardAssigneeType('DEPARTMENT')}
                      />
                      <span>Đơn vị / Phòng ban</span>
                    </label>
                  </div>
                </div>
              </div>

              {wizardAssigneeType === 'USER' ? (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Chọn Cán bộ nhận KPI:
                  </label>
                  <select
                    className="input-select"
                    value={wizardTargetUserId}
                    onChange={(e) => setWizardTargetUserId(e.target.value)}
                    style={{ width: '100%', padding: '10px' }}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.positionTitle} ({u.departmentName})
                      </option>
                    ))}
                  </select>

                  {wizardSelectedUser && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-card-hover)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        gap: '20px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div>
                        Chức vụ: <strong>{wizardSelectedUser.positionTitle}</strong>
                      </div>
                      <div>
                        Đơn vị: <strong>{wizardSelectedUser.departmentName}</strong>
                      </div>
                      <div>
                        Ngạch/Cấp bậc: <strong>{wizardSelectedUser.cadreRank || 'Chuyên viên'}</strong>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Chọn Đơn vị / Phòng ban nhận KPI:
                  </label>
                  <select
                    className="input-select"
                    value={wizardTargetDeptId}
                    onChange={(e) => setWizardTargetDeptId(e.target.value)}
                    style={{ width: '100%', padding: '10px' }}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — Cấp: {d.levelName || `Cấp ${d.level}`} (Mã: {d.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setWizardStep(2)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Tiếp theo: Chọn Chỉ tiêu KPI <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHỌN CHỈ TIÊU KPI */}
          {wizardStep === 2 && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Bước 2: Nạp Chỉ tiêu từ Khung Mẫu Vị trí việc làm hoặc Thư viện
                </h3>
                <span className="badge badge-blue">Đã chọn: {wizardItems.length} chỉ tiêu</span>
              </div>

              {/* Nạp nhanh từ Khung mẫu vị trí việc làm */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(37, 99, 235, 0.05)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--primary-200)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={18} color="var(--primary-600)" />
                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary-700)' }}>
                    Nạp nhanh từ Khung KPI Mẫu theo Vị trí việc làm:
                  </strong>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {kpiTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      onClick={() => handleApplyTemplateToWizard(tpl.id)}
                    >
                      {tpl.name} ({tpl.items.length} chỉ tiêu)
                    </button>
                  ))}
                </div>
              </div>

              {/* Thư viện chỉ tiêu chuẩn để chọn thêm */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
                Hoặc chọn thêm từng chỉ tiêu từ Thư viện mẫu:
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px', maxHeight: '350px', overflowY: 'auto', marginBottom: '24px', paddingRight: '6px' }}>
                {kpiLibrary.map((item) => {
                  const isAdded = wizardItems.some((i) => i.code === item.code);
                  return (
                    <div
                      key={item.id}
                      className="card"
                      style={{
                        padding: '12px 14px',
                        borderLeft: isAdded ? '4px solid var(--success-500)' : '4px solid var(--border-color)',
                        opacity: isAdded ? 0.7 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                          {item.code}
                        </span>
                        <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                          {item.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, margin: '6px 0', color: 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Đơn vị: {item.unit}</span>
                        <button
                          className={`btn ${isAdded ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          disabled={isAdded}
                          onClick={() => handleAddLibraryItemToWizard(item)}
                        >
                          {isAdded ? 'Đã thêm' : '+ Thêm vào'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setWizardStep(1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={18} /> Quay lại
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (wizardItems.length === 0) {
                      showToast('Vui lòng chọn ít nhất 1 chỉ tiêu KPI!', 'warning');
                      return;
                    }
                    setWizardStep(3);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Tiếp theo: Phân bổ Trọng số & Công thức <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PHÂN BỔ TRỌNG SỐ & CÔNG THỨC */}
          {wizardStep === 3 && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Bước 3: Thiết lập Mục tiêu, Trọng số & Công thức Tính điểm
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Tổng trọng số bắt buộc phải bằng đúng 100% để đảm bảo tính pháp lý.
                  </p>
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={handleAutoBalanceWeights}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <RotateCcw size={16} /> Cân bằng tự động 100%
                </button>
              </div>

              {/* THƯỚC ĐO TỔNG TRỌNG SỐ TƯƠNG TÁC (TOTAL WEIGHT GAUGE) */}
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: wizardWeightCheck.isValid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${wizardWeightCheck.isValid ? 'var(--success-500)' : 'var(--danger-500)'}`,
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {wizardWeightCheck.isValid ? (
                      <CheckCircle size={20} color="var(--success-600)" />
                    ) : (
                      <AlertTriangle size={20} color="var(--danger-600)" />
                    )}
                    <strong style={{ fontSize: '0.95rem', color: wizardWeightCheck.isValid ? 'var(--success-700)' : 'var(--danger-700)' }}>
                      Tổng trọng số hiện tại: {wizardWeightCheck.totalWeight}% / 100%
                    </strong>
                  </div>
                  <span
                    className={`badge ${wizardWeightCheck.isValid ? 'badge-green' : 'badge-red'}`}
                    style={{ fontSize: '0.85rem', padding: '4px 10px' }}
                  >
                    {wizardWeightCheck.message}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(wizardWeightCheck.totalWeight, 100)}%`,
                      backgroundColor: wizardWeightCheck.isValid ? 'var(--success-500)' : wizardWeightCheck.totalWeight > 100 ? 'var(--danger-500)' : 'var(--warning-500)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* BẢNG CẤU HÌNH CHI TIẾT TỪNG CHỈ TIÊU */}
              <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Mã & Tên Chỉ tiêu KPI</th>
                      <th style={{ width: '130px' }}>Loại KPI</th>
                      <th style={{ width: '90px' }}>Đơn vị</th>
                      <th style={{ width: '110px' }}>Chỉ tiêu mục tiêu</th>
                      <th style={{ width: '140px' }}>Công thức</th>
                      <th style={{ width: '140px' }}>Chiều hướng</th>
                      <th style={{ width: '100px' }}>Trọng số (%)</th>
                      <th style={{ width: '50px' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wizardItems.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</div>
                          <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                            {item.code}
                          </span>
                        </td>
                        <td>
                          <select
                            className="input-select"
                            value={item.kpiType || 'QUANTITATIVE'}
                            onChange={(e) => {
                              const updated = [...wizardItems];
                              updated[index].kpiType = e.target.value;
                              setWizardItems(updated);
                            }}
                            style={{ padding: '4px 8px', fontSize: '0.8rem', width: '100%' }}
                          >
                            <option value="QUANTITATIVE">Định lượng</option>
                            <option value="QUALITATIVE">Định tính</option>
                            <option value="BINARY">Đạt/Không đạt</option>
                            <option value="MILESTONE">Mốc thời gian</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input-text"
                            value={item.unit}
                            onChange={(e) => {
                              const updated = [...wizardItems];
                              updated[index].unit = e.target.value;
                              setWizardItems(updated);
                            }}
                            style={{ padding: '4px 8px', fontSize: '0.8rem', width: '100%' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="input-text"
                            value={item.target}
                            onChange={(e) => {
                              const updated = [...wizardItems];
                              updated[index].target = Number(e.target.value);
                              setWizardItems(updated);
                            }}
                            style={{ padding: '4px 8px', fontSize: '0.8rem', width: '100%', fontWeight: 700 }}
                          />
                        </td>
                        <td>
                          <select
                            className="input-select"
                            value={item.scoringMethod || 'LINEAR'}
                            onChange={(e) => {
                              const updated = [...wizardItems];
                              updated[index].scoringMethod = e.target.value;
                              setWizardItems(updated);
                            }}
                            style={{ padding: '4px 8px', fontSize: '0.8rem', width: '100%' }}
                          >
                            <option value="LINEAR">Tuyến tính</option>
                            <option value="STEP">Bậc thang</option>
                            <option value="BINARY_PASS_FAIL">Đạt / Không đạt</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="input-select"
                            value={item.targetDirection || 'HIGHER_IS_BETTER'}
                            onChange={(e) => {
                              const updated = [...wizardItems];
                              updated[index].targetDirection = e.target.value;
                              setWizardItems(updated);
                            }}
                            style={{ padding: '4px 8px', fontSize: '0.8rem', width: '100%' }}
                          >
                            <option value="HIGHER_IS_BETTER">Càng cao càng tốt</option>
                            <option value="LOWER_IS_BETTER">Càng thấp càng tốt</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="input-text"
                            value={item.weight}
                            min="0"
                            max="100"
                            onChange={(e) => {
                              const updated = [...wizardItems];
                              updated[index].weight = Number(e.target.value);
                              setWizardItems(updated);
                            }}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.85rem',
                              width: '100%',
                              fontWeight: 700,
                              color: 'var(--primary-600)',
                            }}
                          />
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px', color: 'var(--danger-500)' }}
                            onClick={() => {
                              setWizardItems(wizardItems.filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setWizardStep(2)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={18} /> Quay lại
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setWizardStep(4)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Tiếp theo: Xem trước & Xác nhận Giao <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: XEM TRƯỚC, CASCADE & XÁC NHẬN GIAO */}
          {wizardStep === 4 && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
                Bước 4: Xem trước Bản Giao KPI & Liên kết Cây Cascade
              </h3>

              {/* Cascade Link Selector */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-card-hover)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                }}
              >
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Liên kết với Mục tiêu Cấp trên (Parent Goal Cascade):
                </label>
                <select
                  className="input-select"
                  value={wizardParentKpiId}
                  onChange={(e) => setWizardParentKpiId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  <option value="">-- Không liên kết trực tiếp (Mục tiêu độc lập) --</option>
                  {cascadingGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      [{g.code}] {g.title} ({g.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Summary Info Box */}
              <div
                style={{
                  padding: '16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kỳ đánh giá:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{wizardSelectedPeriod?.name}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đối tượng nhận:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {wizardAssigneeType === 'USER' ? wizardSelectedUser?.name : wizardSelectedDept?.name}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tổng số chỉ tiêu:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{wizardItems.length} chỉ tiêu</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tổng trọng số:</span>
                    <div style={{ fontWeight: 800, color: wizardWeightCheck.isValid ? 'var(--success-600)' : 'var(--danger-600)' }}>
                      {wizardWeightCheck.totalWeight}% {wizardWeightCheck.isValid ? '✓' : '⚠️'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items preview table */}
              <table className="table" style={{ width: '100%', fontSize: '0.85rem', marginBottom: '24px' }}>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên chỉ tiêu</th>
                    <th>Đơn vị</th>
                    <th>Chỉ tiêu mục tiêu</th>
                    <th>Công thức</th>
                    <th>Trọng số</th>
                  </tr>
                </thead>
                <tbody>
                  {wizardItems.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <span className="badge badge-gray">{it.code}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{it.name}</td>
                      <td>{it.unit}</td>
                      <td style={{ fontWeight: 700 }}>{it.target}</td>
                      <td>{it.scoringMethod}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{it.weight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setWizardStep(3)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={18} /> Quay lại
                </button>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleFinishWizard(true)}
                  >
                    Lưu bản nháp (Draft)
                  </button>

                  <button
                    className="btn btn-primary"
                    disabled={!wizardWeightCheck.isValid}
                    onClick={() => handleFinishWizard(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Send size={18} /> Giao KPI chính thức
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==============================================================================
          TAB 2: CÂY CASCADE MỤC TIÊU (CÂY CHA XUỐNG CON)
          ============================================================================== */}
      {activeTab === 'cascading' && (
        <div>
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Sơ đồ Phân rã Mục tiêu & Cây Cascade (Goal Alignment Tree)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Mục tiêu chiến lược cấp Tổng công ty / Cơ quan Bộ được phân rã xuyên suốt xuống Cục/Khối, Phòng ban và Chuyên viên.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => setCollapsedNodes(new Set())}
                >
                  Mở rộng tất cả
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => {
                    const allIds = new Set();
                    cascadingGoals.forEach((g) => {
                      allIds.add(g.id);
                      if (g.children) g.children.forEach((c) => allIds.add(c.id));
                    });
                    setCollapsedNodes(allIds);
                  }}
                >
                  Thu gọn tất cả
                </button>
              </div>
            </div>
          </div>

          <div>{cascadingGoals.map((node) => renderCascadingTreeNode(node, 0))}</div>
        </div>
      )}

      {/* ==============================================================================
          TAB 3: QUẢN LÝ BẢNG GIAO & DUYỆT KPI (WORKFLOW & REVISIONS)
          ============================================================================== */}
      {activeTab === 'workflow' && (
        <div>
          {/* Filters & Actions Bar */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '6px' }}>
                    Kỳ:
                  </span>
                  <select
                    className="input-select"
                    value={workflowFilterPeriod}
                    onChange={(e) => setWorkflowFilterPeriod(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                  >
                    <option value="ALL">-- Tất cả kỳ --</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '6px' }}>
                    Trạng thái:
                  </span>
                  <select
                    className="input-select"
                    value={workflowFilterStatus}
                    onChange={(e) => setWorkflowFilterStatus(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                  >
                    <option value="ALL">-- Tất cả trạng thái --</option>
                    <option value="DRAFT">Bản nháp</option>
                    <option value="ASSIGNED">Quản lý đã giao</option>
                    <option value="ACCEPTED">Nhân viên đã xác nhận</option>
                    <option value="FEEDBACK_REQUESTED">Đề nghị điều chỉnh</option>
                    <option value="APPROVED">Đã phê duyệt</option>
                    <option value="LOCKED">Đã khóa chỉ tiêu</option>
                  </select>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => {
                  setWizardStep(1);
                  setActiveTab('wizard');
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <Plus size={16} /> Giao KPI mới
              </button>
            </div>
          </div>

          {/* Plans Table */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Đối tượng nhận KPI</th>
                  <th>Vị trí / Chức danh</th>
                  <th>Đơn vị</th>
                  <th>Kỳ đánh giá</th>
                  <th>Phiên bản</th>
                  <th>Trọng số</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => {
                  const statusBadgeMap = {
                    DRAFT: { label: 'Bản nháp', color: 'badge-gray' },
                    ASSIGNED: { label: 'Đã giao', color: 'badge-blue' },
                    FEEDBACK_REQUESTED: { label: 'Đề nghị sửa', color: 'badge-red' },
                    ACCEPTED: { label: 'Đã xác nhận', color: 'badge-gold' },
                    APPROVED: { label: 'Đã duyệt', color: 'badge-green' },
                    LOCKED: { label: 'Đã khóa', color: 'badge-purple' },
                  };
                  const badge = statusBadgeMap[plan.status] || { label: plan.status, color: 'badge-gray' };

                  return (
                    <tr key={plan.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{plan.employeeName}</td>
                      <td>{plan.positionTitle}</td>
                      <td>{plan.departmentName}</td>
                      <td>{plan.periodId}</td>
                      <td>
                        <span className="badge badge-gray" style={{ fontWeight: 700 }}>
                          v{plan.version || 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{plan.totalWeight}%</td>
                      <td>
                        <span className={`badge ${badge.color}`}>{badge.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => setSelectedPlanDetail(plan)}
                          >
                            <Eye size={14} /> Chi tiết
                          </button>

                          {/* Quick workflow actions */}
                          {plan.status === 'ASSIGNED' && (
                            <>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => acceptKpiPlan(plan.id)}
                              >
                                Xác nhận
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--warning-600)' }}
                                onClick={() => {
                                  setFeedbackPlanId(plan.id);
                                  setFeedbackText('');
                                  setShowFeedbackModal(true);
                                }}
                              >
                                Góp ý
                              </button>
                            </>
                          )}

                          {plan.status === 'ACCEPTED' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => approveKpiPlan(plan.id)}
                            >
                              Duyệt chốt
                            </button>
                          )}

                          {plan.status === 'APPROVED' && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--purple-600)' }}
                              onClick={() => lockKpiPlan(plan.id)}
                            >
                              <Lock size={14} /> Khóa
                            </button>
                          )}

                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleOpenRevision(plan)}
                            title="Điều chỉnh giữa kỳ"
                          >
                            <Edit3 size={14} /> Sửa giữa kỳ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Selected Plan Details Drawer/Modal */}
          {selectedPlanDetail && (
            <div className="card" style={{ padding: '24px', borderTop: '4px solid var(--primary-600)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Chi tiết Bảng KPI: {selectedPlanDetail.employeeName} (Phiên bản v{selectedPlanDetail.version || 1})
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {selectedPlanDetail.positionTitle} — {selectedPlanDetail.departmentName}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleOpenRevision(selectedPlanDetail)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    <Edit3 size={16} /> Điều chỉnh giữa kỳ (v{(selectedPlanDetail.version || 1) + 1})
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedPlanDetail(null)}
                  >
                    Đóng
                  </button>
                </div>
              </div>

              {/* Items List */}
              <table className="table" style={{ width: '100%', fontSize: '0.85rem', marginBottom: '20px' }}>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên chỉ tiêu</th>
                    <th>Đơn vị</th>
                    <th>Mục tiêu</th>
                    <th>Thực tế</th>
                    <th>Công thức</th>
                    <th>Trọng số</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedPlanDetail.items || []).map((it) => (
                    <tr key={it.id || it.kpiCode}>
                      <td>
                        <span className="badge badge-gray">{it.kpiCode}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{it.name}</td>
                      <td>{it.unit}</td>
                      <td style={{ fontWeight: 700 }}>{it.target}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{it.actual ?? 0}</td>
                      <td>{it.scoringMethod || it.formulaType}</td>
                      <td style={{ fontWeight: 700 }}>{it.weight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Revision History List */}
              {selectedPlanDetail.revisions && selectedPlanDetail.revisions.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <History size={16} color="var(--primary-600)" />
                    Lịch sử các phiên bản điều chỉnh giữa kỳ:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedPlanDetail.revisions.map((rev, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg-card-hover)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.825rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong>Phiên bản v{rev.version}</strong>
                          <span style={{ color: 'var(--text-muted)' }}>{rev.changedDate} — Bởi: {rev.changedBy}</span>
                        </div>
                        <div style={{ color: 'var(--text-main)' }}>
                          Lý do điều chỉnh: <em>"{rev.reason}"</em>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==============================================================================
          TAB 4: THƯ VIỆN KPI & KHUNG VỊ TRÍ VIỆC LÀM
          ============================================================================== */}
      {activeTab === 'library' && (
        <div>
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Thư viện Chỉ tiêu KPI Chuẩn hóa & Khung Vị trí việc làm
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Áp dụng kép cho cả Doanh nghiệp (BSC, Tài chính, Quy trình) và Cơ quan Nhà nước (Nghị định 90/2020 & 48/2023).
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {kpiLibrary.map((item) => (
              <div key={item.id} className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-gray" style={{ fontFamily: 'monospace' }}>
                      {item.code}
                    </span>
                    <span className="badge badge-blue">{item.category}</span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                    {item.name}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-card-hover)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.785rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Đơn vị: <strong>{item.unit}</strong></span>
                  <span>Mục tiêu mẫu: <strong>{item.defaultTarget}</strong></span>
                  <span>Trọng số mẫu: <strong>{item.defaultWeight || 20}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==============================================================================
          TAB 5: IMPORT EXCEL KPI (ROW-BY-ROW ERROR REPORTING)
          ============================================================================== */}
      {activeTab === 'import' && (
        <div>
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Import Danh mục KPI từ Excel / CSV kèm Báo cáo lỗi chi tiết từng dòng
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Hệ thống kiểm tra tính hợp lệ về định dạng, mã trùng lặp và tính toàn vẹn trọng số trước khi nạp vào CSDL.
                </p>
              </div>

              <button
                className="btn btn-secondary"
                onClick={handleDownloadSampleKpiExcel}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={16} /> Tải tệp mẫu (.CSV / Excel)
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Dán nội dung CSV hoặc bảng tính Excel (có thể dùng tệp mẫu):
              </label>
              <textarea
                className="input-textarea"
                rows={6}
                value={excelText}
                onChange={(e) => setExcelText(e.target.value)}
                placeholder="Dán dữ liệu CSV tại đây hoặc bấm nút nạp tệp mẫu..."
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem', padding: '10px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setExcelText(sampleKpiCsv)}
              >
                Nạp dữ liệu mẫu thử nghiệm
              </button>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={skipExcelErrors}
                    onChange={(e) => setSkipExcelErrors(e.target.checked)}
                  />
                  <span>Bỏ qua dòng lỗi và import các dòng hợp lệ</span>
                </label>

                <button
                  className="btn btn-primary"
                  onClick={handleProcessExcel}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FileSpreadsheet size={18} /> Phân tích & Kiểm tra Lỗi
                </button>
              </div>
            </div>
          </div>

          {/* IMPORT ERROR & VALIDATION REPORT */}
          {importReport && (
            <div className="card" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {importReport.errorCount === 0 ? (
                  <CheckCircle size={20} color="var(--success-600)" />
                ) : (
                  <AlertTriangle size={20} color="var(--danger-600)" />
                )}
                Kết quả Phân tích Dữ liệu Import:
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tổng số dòng</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{importReport.totalRows}</div>
                </div>
                <div className="card" style={{ padding: '12px', textAlign: 'center', color: 'var(--success-600)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hợp lệ</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{importReport.validCount}</div>
                </div>
                <div className="card" style={{ padding: '12px', textAlign: 'center', color: 'var(--danger-600)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Số dòng lỗi</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{importReport.errorCount}</div>
                </div>
                <div className="card" style={{ padding: '12px', textAlign: 'center', color: 'var(--primary-600)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đã nạp vào CSDL</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{importReport.importedCount}</div>
                </div>
              </div>

              {/* BẢNG BÁO CÁO LỖI TỪNG DÒNG NẾU CÓ */}
              {importReport.errors && importReport.errors.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--danger-600)', marginBottom: '8px' }}>
                    Danh sách lỗi chi tiết từng dòng cần khắc phục:
                  </h5>
                  <table className="table" style={{ width: '100%', fontSize: '0.825rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Dòng #</th>
                        <th style={{ width: '150px' }}>Trường dữ liệu</th>
                        <th>Giá trị nhập vào</th>
                        <th>Nguyên nhân lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importReport.errors.map((err, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 700 }}>Dòng {err.rowNumber}</td>
                          <td style={{ fontWeight: 600 }}>{err.column}</td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--danger-600)' }}>
                            {String(err.value)}
                          </td>
                          <td style={{ color: 'var(--danger-600)' }}>{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==============================================================================
          MODAL: ĐIỀU CHỈNH GIỮA KỲ (MID-TERM REVISION)
          ============================================================================== */}
      {showRevisionModal && revisionPlan && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Điều chỉnh Chỉ tiêu Giữa kỳ: {revisionPlan.employeeName} (v{(revisionPlan.version || 1) + 1})
              </h3>
              <button
                className="btn btn-secondary"
                onClick={() => setShowRevisionModal(false)}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid var(--danger-500)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                fontSize: '0.85rem',
                color: 'var(--danger-700)',
              }}
            >
              <strong>Yêu cầu quy chế kiểm toán:</strong> Mọi điều chỉnh chỉ tiêu sau khi đã giao/duyệt bắt buộc phải nhập lý do thuyết minh cụ thể và sẽ được lưu vết phiên bản bất biến.
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Lý do điều chỉnh giữa kỳ (Bắt buộc):
              </label>
              <textarea
                className="input-textarea"
                rows={3}
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Nhập lý do điều chỉnh: thay đổi kế hoạch cơ quan, phát sinh nhiệm vụ đột xuất, biến động nhân sự..."
                style={{ width: '100%', padding: '10px' }}
              />
            </div>

            {/* Revision Items Table */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>
              Điều chỉnh mục tiêu và trọng số:
            </h4>
            <table className="table" style={{ width: '100%', fontSize: '0.85rem', marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên chỉ tiêu</th>
                  <th style={{ width: '110px' }}>Mục tiêu</th>
                  <th style={{ width: '100px' }}>Trọng số (%)</th>
                </tr>
              </thead>
              <tbody>
                {revisionItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="badge badge-gray">{item.kpiCode}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>
                      <input
                        type="number"
                        className="input-text"
                        value={item.target}
                        onChange={(e) => {
                          const updated = [...revisionItems];
                          updated[idx].target = Number(e.target.value);
                          setRevisionItems(updated);
                        }}
                        style={{ padding: '4px 8px', width: '100%' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input-text"
                        value={item.weight}
                        onChange={(e) => {
                          const updated = [...revisionItems];
                          updated[idx].weight = Number(e.target.value);
                          setRevisionItems(updated);
                        }}
                        style={{ padding: '4px 8px', width: '100%', fontWeight: 700 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowRevisionModal(false)}
              >
                Hủy bỏ
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveRevision}
              >
                Lưu Phiên bản Điều chỉnh (v{(revisionPlan.version || 1) + 1})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================================
          MODAL: PHẢN HỒI / GÓP Ý CHỈ TIÊU (FEEDBACK MODAL)
          ============================================================================== */}
      {showFeedbackModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
              Góp ý / Đề xuất Điều chỉnh Chỉ tiêu KPI
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Nội dung phản hồi sẽ được gửi tới Quản lý trực tiếp để xem xét điều chỉnh trước khi chốt cam kết.
            </p>

            <textarea
              className="input-textarea"
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Nhập đề xuất của bạn (ví dụ: xin giảm chỉ tiêu do thiếu dữ liệu hoặc điều chỉnh mốc thời gian)..."
              style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowFeedbackModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!feedbackText.trim()) {
                    showToast('Vui lòng nhập nội dung góp ý!', 'warning');
                    return;
                  }
                  feedbackKpiPlan(feedbackPlanId, feedbackText);
                  setShowFeedbackModal(false);
                }}
              >
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
