import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { getRoleLabel, getScopeLabel } from '../../../utils/labels';
import {
  Network,
  Briefcase,
  Users,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Building,
  Check,
  Search,
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Key,
  Smartphone,
  UserPlus,
} from 'lucide-react';

import { SegmentedControl } from '../../ui/SegmentedControl';
import { PageHeader } from '../../common/PageHeader';

const MAIN_ROLES = ['SYSTEM_ADMIN', 'EXECUTIVE', 'UNIT_HEAD', 'LINE_MANAGER', 'HR_OFFICER', 'EMPLOYEE', 'COUNCIL_MEMBER', 'SECRETARY', 'AUDITOR'];
const DEFAULT_SCOPE = {
  SYSTEM_ADMIN: 'ALL',
  EXECUTIVE: 'ALL',
  HR_OFFICER: 'ALL',
  AUDITOR: 'ALL',
  UNIT_HEAD: 'UNIT_AND_CHILDREN',
  LINE_MANAGER: 'OWN_UNIT',
  COUNCIL_MEMBER: 'ASSIGNED',
  SECRETARY: 'ASSIGNED',
  EMPLOYEE: 'SELF',
};

export const Module1_OrgSystem = () => {
  const {
    departments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    positions,
    addPosition,
    updatePosition,
    users,
    addUser,
    updateUser,
    deleteUser,
    toggle2FA,
    resetPassword,
    importUsersBatch,
    showToast,
    currentUser,
  } = useApp();

  // Active Tab: 'org-tree' (Cây đơn vị), 'employees' (Hồ sơ cán bộ), 'positions' (Vị trí việc làm)
  const [activeTab, setActiveTab] = useState('org-tree');

  // ============================================================================
  // TAB 1: CÂY ĐƠN VỊ TỔ CHỨC (TREE VIEW) STATE & HANDLERS
  // ============================================================================
  const [deptSearch, setDeptSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(() => {
    const allIds = new Set(departments.map((d) => d.id));
    return allIds;
  });
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({
    code: '',
    name: '',
    level: 3,
    levelName: 'Phòng ban / Vụ',
    parentId: '',
    operatingMode: 'GOVERNMENT', // GOVERNMENT, ENTERPRISE, HYBRID
    managerName: '',
    description: '',
  });

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const expandAll = () => setExpandedNodes(new Set(departments.map((d) => d.id)));
  const collapseAll = () => setExpandedNodes(new Set());

  // Xây dựng cấu trúc cây đệ quy
  const buildTree = (parentId = null) => {
    return departments
      .filter((d) => d.parentId === parentId)
      .map((d) => ({
        ...d,
        children: buildTree(d.id),
      }));
  };

  const fullTree = useMemo(() => buildTree(null), [departments]);

  const selectedDept = departments.find((d) => d.id === selectedDeptId);
  const deptStaff = users.filter((u) => u.departmentId === selectedDeptId);

  const handleOpenAddDept = (parentId = '') => {
    setEditingDept(null);
    setDeptForm({
      code: '',
      name: '',
      level: parentId ? 3 : 1,
      levelName: parentId ? 'Phòng ban / Đơn vị' : 'Cơ quan Bộ / Tổng Công ty',
      parentId: parentId || '',
      operatingMode: 'GOVERNMENT',
      managerName: '',
      description: '',
    });
    setShowDeptModal(true);
  };

  const handleOpenEditDept = (dept) => {
    setEditingDept(dept);
    setDeptForm({
      code: dept.code,
      name: dept.name,
      level: dept.level,
      levelName: dept.levelName || 'Phòng ban',
      parentId: dept.parentId || '',
      operatingMode: dept.operatingMode || 'GOVERNMENT',
      managerName: dept.managerName || '',
      description: dept.description || '',
    });
    setShowDeptModal(true);
  };

  const handleSaveDept = (e) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) {
      showToast('Vui lòng điền đủ mã và tên đơn vị!', 'warning');
      return;
    }

    if (editingDept) {
      updateDepartment(editingDept.id, deptForm);
    } else {
      addDepartment(deptForm);
    }
    setShowDeptModal(false);
  };

  const handleDeleteDept = (deptId) => {
    const hasChildren = departments.some((d) => d.parentId === deptId);
    if (hasChildren) {
      showToast('Không thể xóa đơn vị đang có các phòng ban trực thuộc!', 'warning');
      return;
    }
    const hasStaff = users.some((u) => u.departmentId === deptId);
    if (hasStaff) {
      showToast('Không thể xóa đơn vị đang có cán bộ, nhân sự được phân công!', 'warning');
      return;
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa đơn vị này?')) {
      deleteDepartment(deptId);
      if (selectedDeptId === deptId) setSelectedDeptId(departments[0]?.id || null);
    }
  };

  // ============================================================================
  // TAB 2: QUẢN LÝ CÁN BỘ & NHÂN SỰ STATE & FILTERS
  // ============================================================================
  const [userSearch, setUserSearch] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterEmployeeType, setFilterEmployeeType] = useState('ALL'); // ALL, CAN_BO, CONG_CHUC, VIEN_CHUC, NHAN_VIEN_HOP_DONG, DOANH_NGHIEP
  const [filterCadreRank, setFilterCadreRank] = useState('ALL'); // Chuyên viên cao cấp, Chuyên viên chính, Chuyên viên, Cán sự
  const [filterRole, setFilterRole] = useState('ALL');

  // Modal Thêm/Sửa Cán bộ
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    employeeCode: '',
    name: '',
    email: '',
    phone: '',
    idCardNumber: '',
    joinedDate: new Date().toISOString().split('T')[0],
    departmentId: '',
    positionId: '',
    employeeType: 'CONG_CHUC',
    cadreRank: 'Chuyên viên',
    contractType: 'KHONG_XAC_DINH_THOI_HAN',
    salaryCoefficient: 2.34,
    role: 'EMPLOYEE',
    roleTitle: 'Chuyên viên',
    dataScope: 'SELF_ONLY',
  });

  // Modal Import Excel & Báo cáo Lỗi
  const [showImportModal, setShowImportModal] = useState(false);
  const [importReport, setImportReport] = useState(null);
  const [importSkipErrors, setImportSkipErrors] = useState(true);

  // Dữ liệu mẫu kiểm thử Import Excel (gồm cả dòng chuẩn và dòng lỗi nghiệp vụ để kiểm tra)
  const sampleExcelData = [
    {
      employeeCode: 'CB-2026-101',
      name: 'Vũ Thị Thanh Hằng',
      email: 'hang.vt@kpi.gov.vn',
      phone: '0912 334 556',
      departmentCode: 'PPM-03',
      positionTitle: 'Chuyên viên Phát triển Hệ thống',
      employeeType: 'CONG_CHUC',
      cadreRank: 'Chuyên viên',
      salaryCoefficient: 3.0,
    },
    {
      employeeCode: 'CB-2026-102',
      name: '', // LỖI 1: Thiếu họ tên bắt buộc
      email: 'trang.nt@kpi.gov.vn',
      phone: '0933 445 667',
      departmentCode: 'PPM-03',
      positionTitle: 'Kỹ sư Phần mềm',
      employeeType: 'VIEN_CHUC',
      cadreRank: 'Chuyên viên',
      salaryCoefficient: 2.67,
    },
    {
      employeeCode: 'CB-2026-103',
      name: 'Đỗ Hùng Dũng',
      email: 'dung.do-sai-dinh-dang', // LỖI 2: Email sai format
      phone: '0988 776 554',
      departmentCode: 'KCDS-02',
      positionTitle: 'Chuyên viên Chuyển đổi số',
      employeeType: 'CONG_CHUC',
      cadreRank: 'Chuyên viên chính',
      salaryCoefficient: 4.4,
    },
    {
      employeeCode: 'CB-2026-104',
      name: 'Ngô Quốc Bảo',
      email: 'bao.nq@kpi.gov.vn',
      phone: '0909 112 233',
      departmentCode: 'PHONG-MA-KHONG-TON-TAI', // LỖI 3: Mã đơn vị không tồn tại trên cây
      positionTitle: 'Chuyên viên Quản trị',
      employeeType: 'NHAN_VIEN_HOP_DONG',
      cadreRank: 'Cán sự',
      salaryCoefficient: 2.0,
    },
    {
      employeeCode: 'CB-2026-105',
      name: 'Phạm Thị Bích Ngọc',
      email: 'an.nguyen@gov-kpi.vn', // LỖI 4: Trùng email đã có trên hệ thống của usr-01
      phone: '0977 889 900',
      departmentCode: 'dept-01',
      positionTitle: 'Chuyên viên Tổng hợp',
      employeeType: 'CONG_CHUC',
      cadreRank: 'Chuyên viên',
      salaryCoefficient: 2.34,
    },
    {
      employeeCode: 'CB-2026-106',
      name: 'Lý Gia Hưng',
      email: 'hung.lg@kpi.gov.vn',
      phone: '0944 556 677',
      departmentCode: 'dept-01-01',
      positionTitle: 'Kỹ sư Cơ sở Dữ liệu',
      employeeType: 'VIEN_CHUC',
      cadreRank: 'Chuyên viên',
      salaryCoefficient: 3.33,
    },
  ];

  // Lọc danh sách cán bộ
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Tìm kiếm từ khóa
      const matchSearch =
        userSearch === '' ||
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.employeeCode?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.phone?.includes(userSearch);

      // 2. Lọc đơn vị
      const matchDept = filterDept === 'ALL' || u.departmentId === filterDept;

      // 3. Lọc loại đối tượng (Cán bộ / Công chức / Viên chức / Hợp đồng)
      const matchType =
        filterEmployeeType === 'ALL' || (u.employeeType || 'CONG_CHUC') === filterEmployeeType;

      // 4. Lọc ngạch
      const matchCadre =
        filterCadreRank === 'ALL' || (u.cadreRank || 'Chuyên viên') === filterCadreRank;

      // 5. Lọc vai trò
      const matchRole = filterRole === 'ALL' || u.role === filterRole;

      return matchSearch && matchDept && matchType && matchCadre && matchRole;
    });
  }, [users, userSearch, filterDept, filterEmployeeType, filterCadreRank, filterRole]);

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({
      employeeCode: `CB-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      email: '',
      phone: '',
      idCardNumber: '00109' + Math.floor(1000000 + Math.random() * 9000000),
      joinedDate: new Date().toISOString().split('T')[0],
      departmentId: selectedDeptId || departments[0]?.id,
      positionId: positions[0]?.id,
      employeeType: 'CONG_CHUC',
      cadreRank: 'Chuyên viên',
      contractType: 'KHONG_XAC_DINH_THOI_HAN',
      salaryCoefficient: 2.34,
      role: 'EMPLOYEE',
      roleTitle: 'Chuyên viên',
      dataScope: 'SELF_ONLY',
    });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      employeeCode: u.employeeCode || '',
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      idCardNumber: u.idCardNumber || '',
      joinedDate: u.joinedDate || new Date().toISOString().split('T')[0],
      departmentId: u.departmentId,
      positionId: u.positionId,
      employeeType: u.employeeType || 'CONG_CHUC',
      cadreRank: u.cadreRank || 'Chuyên viên',
      contractType: u.contractType || 'KHONG_XAC_DINH_THOI_HAN',
      salaryCoefficient: u.salaryCoefficient || 2.34,
      role: u.role,
      roleTitle: u.roleTitle,
      dataScope: u.dataScope || DEFAULT_SCOPE[u.role] || 'SELF',
    });
    setShowUserModal(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) {
      showToast('Vui lòng nhập họ tên và email hợp lệ!', 'warning');
      return;
    }

    const pos = positions.find((p) => p.id === userForm.positionId);
    const dept = departments.find((d) => d.id === userForm.departmentId);

    const payload = {
      ...userForm,
      positionTitle: pos?.title || 'Chuyên viên',
      departmentName: dept?.name || 'Cơ quan',
    };

    if (editingUser) {
      updateUser(editingUser.id, payload);
    } else {
      addUser(payload);
    }
    setShowUserModal(false);
  };

  // Chạy giả lập kiểm tra dữ liệu Excel và sinh báo cáo lỗi từng dòng
  const handleRunExcelValidation = () => {
    const report = importUsersBatch(sampleExcelData, false);
    setImportReport(report);
  };

  const handleConfirmImport = () => {
    if (!importReport) return;
    importUsersBatch(sampleExcelData, importSkipErrors);
    setShowImportModal(false);
    setImportReport(null);
  };

  // Helper render huy hiệu loại đối tượng
  const renderEmployeeTypeBadge = (type) => {
    switch (type) {
      case 'CAN_BO':
        return (
          <span className="whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            Cán bộ
          </span>
        );
      case 'CONG_CHUC':
        return (
          <span className="whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            Công chức
          </span>
        );
      case 'VIEN_CHUC':
        return (
          <span className="whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Viên chức
          </span>
        );
      case 'NHAN_VIEN_HOP_DONG':
        return (
          <span className="whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Hợp đồng NĐ 111
          </span>
        );
      default:
        return (
          <span className="whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Doanh nghiệp
          </span>
        );
    }
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedDeptId === node.id;

    // Filter highlight
    const matchSearch =
      deptSearch === '' || node.name.toLowerCase().includes(deptSearch.toLowerCase()) || node.code.toLowerCase().includes(deptSearch.toLowerCase());

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => setSelectedDeptId(node.id)}
          className={`group flex items-center justify-between py-2 px-2.5 rounded-lg cursor-pointer transition-all border my-1 ${
            isSelected
              ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 shadow-sm'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'
          } ${!matchSearch && deptSearch !== '' ? 'opacity-40' : 'opacity-100'}`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <div className="w-5" />
            )}

            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
              node.level === 1
                ? 'bg-red-500 text-white'
                : node.level === 2
                ? 'bg-blue-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}>
              C{node.level}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold leading-snug ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                  {node.name}
                </span>
                <span className="whitespace-nowrap text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {node.code}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-400">
                  Trưởng đơn vị: <strong className="text-slate-600 dark:text-slate-300">{node.managerName || 'Chưa bổ nhiệm'}</strong>
                </span>
                <span className="text-[10px] text-slate-400">•</span>
                <span className="text-[10px] text-slate-400">
                  Sĩ số: <strong className="text-blue-600 dark:text-blue-400">{users.filter((u) => u.departmentId === node.id).length}</strong> người
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              node.operatingMode === 'GOVERNMENT'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : node.operatingMode === 'ENTERPRISE'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}>
              {node.operatingMode === 'GOVERNMENT' ? 'Nhà nước (NĐ 90)' : node.operatingMode === 'ENTERPRISE' ? 'Doanh nghiệp' : 'Kết hợp'}
            </span>

            <button
              title="Thêm đơn vị con"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAddDept(node.id);
              }}
              className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600"
            >
              <Plus size={14} />
            </button>
            <button
              title="Sửa thông tin"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditDept(node);
              }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <Edit2 size={13} />
            </button>
            <button
              title="Xóa đơn vị"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDept(node.id);
              }}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Yêu cầu Bước 5) */}
      <PageHeader
        title="Tổ chức & cán bộ"
        subtitle="Cây đơn vị, vị trí việc làm và hồ sơ cán bộ là nền tảng để giao KPI đúng người, xác định cấp trên đánh giá và phạm vi dữ liệu (Nghị định 90/2020, 48/2023)."
      />

      <SegmentedControl
        options={[
          { value: 'org-tree', label: 'Cây đơn vị', icon: Network, badge: departments.length },
          { value: 'employees', label: 'Cán bộ', icon: Users, badge: users.length },
          { value: 'positions', label: 'Vị trí việc làm', icon: Briefcase, badge: positions.length },
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val)}
      />

      {/* ====================================================================== */}
      {/* TAB 1: CÂY ĐƠN VỊ TỔ CHỨC (TREE VIEW)                                    */}
      {/* ====================================================================== */}
      {activeTab === 'org-tree' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái: Cây đơn vị đệ quy */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col h-[750px]">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm đơn vị theo tên hoặc mã..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200"
                >
                  Mở hết
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200"
                >
                  Thu gọn
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddDept('')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  <Plus size={14} />
                  Thêm đơn vị
                </button>
              </div>
            </div>

            {/* Tree Container */}
            <div className="flex-1 overflow-y-auto pr-1">
              {fullTree.length > 0 ? (
                fullTree.map((rootNode) => renderTreeNode(rootNode, 0))
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">Chưa có đơn vị nào</div>
              )}
            </div>

            {/* Tree Summary Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Tổng số: <strong>{departments.length}</strong> đơn vị hành chính</span>
              <span>Độ sâu tối đa: <strong>3 cấp</strong> (Bộ &gt; Cục &gt; Phòng)</span>
            </div>
          </div>

          {/* Cột phải: Thông tin chi tiết Đơn vị được chọn */}
          <div className="lg:col-span-5 space-y-5">
            {selectedDept ? (
              <>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {selectedDept.levelName || `Cấp ${selectedDept.level}`}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {selectedDept.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        Mã: {selectedDept.code} • Phân cấp C{selectedDept.level}
                      </p>
                    </div>

                    <span className={`whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedDept.operatingMode === 'GOVERNMENT'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : selectedDept.operatingMode === 'ENTERPRISE'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                    }`}>
                      {selectedDept.operatingMode === 'GOVERNMENT' ? 'Cơ quan Nhà nước' : selectedDept.operatingMode === 'ENTERPRISE' ? 'Khối Doanh nghiệp' : 'Kết hợp'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    {selectedDept.description || 'Chưa cập nhật mô tả chức năng nhiệm vụ.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Người đứng đầu</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {selectedDept.managerName || 'Chưa bổ nhiệm'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Số cán bộ</div>
                      <div className="font-extrabold text-blue-600 text-base mt-0.5">
                        {deptStaff.length} <span className="text-xs font-normal text-slate-400">cán bộ</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleOpenAddDept(selectedDept.id)}
                      className="flex-1 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg flex items-center justify-center gap-1.5"
                    >
                      <Plus size={13} /> Thêm cấp con
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditDept(selectedDept)}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center gap-1"
                    >
                      <Edit2 size={13} /> Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDept(selectedDept.id)}
                      className="px-3 py-1.5 text-xs font-bold bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-600 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Xóa
                    </button>
                  </div>
                </div>

                {/* Danh sách nhân sự của đơn vị */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Cán bộ trực thuộc ({deptStaff.length})
                    </h4>
                    <button
                      onClick={() => {
                        handleOpenAddUser();
                        setUserForm((prev) => ({ ...prev, departmentId: selectedDept.id }));
                      }}
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Bổ nhiệm cán bộ
                    </button>
                  </div>

                  {deptStaff.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {deptStaff.map((staff) => (
                        <div
                          key={staff.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={staff.avatar}
                              alt={staff.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug break-words">
                                {staff.name}
                              </div>
                              <div className="text-[10px] text-slate-400 leading-snug break-words">
                                {staff.positionTitle || 'Chuyên viên'} • {staff.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {renderEmployeeTypeBadge(staff.employeeType || 'CONG_CHUC')}
                            <button
                              onClick={() => handleOpenEditUser(staff)}
                              className="p-1 text-slate-400 hover:text-blue-600"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Chưa có cán bộ nào được phân công về đơn vị này
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs">
                Chọn một đơn vị trên cây để xem chi tiết
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: QUẢN LÝ CÁN BỘ & NHÂN SỰ (EMPLOYEES & USERS)                    */}
      {/* ====================================================================== */}
      {activeTab === 'employees' && (
        <div className="space-y-5">
          {/* Action Toolbar & Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo Tên, Email, Mã cán bộ, SĐT, CCCD..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all"
                >
                  <FileSpreadsheet size={15} />
                  Nhập từ Excel
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all"
                >
                  <UserPlus size={15} />
                  Thêm cán bộ
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Đơn vị
                </label>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">Tất cả đơn vị</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Đối tượng
                </label>
                <select
                  value={filterEmployeeType}
                  onChange={(e) => setFilterEmployeeType(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">Tất cả loại đối tượng</option>
                  <option value="CAN_BO">Cán bộ (Bầu cử/Nhiệm kỳ)</option>
                  <option value="CONG_CHUC">Công chức (Ngạch biên chế)</option>
                  <option value="VIEN_CHUC">Viên chức (Đơn vị sự nghiệp)</option>
                  <option value="NHAN_VIEN_HOP_DONG">Hợp đồng Nghị định 111</option>
                  <option value="DOANH_NGHIEP">Hợp đồng Doanh nghiệp</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Ngạch
                </label>
                <select
                  value={filterCadreRank}
                  onChange={(e) => setFilterCadreRank(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">Tất cả ngạch bậc</option>
                  <option value="Chuyên viên cao cấp">Chuyên viên cao cấp</option>
                  <option value="Chuyên viên chính">Chuyên viên chính</option>
                  <option value="Chuyên viên">Chuyên viên</option>
                  <option value="Cán sự">Cán sự</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Vai trò
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  {MAIN_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {getRoleLabel(r)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-medium text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Cán bộ</th>
                    <th className="py-3 px-4">Đơn vị</th>
                    <th className="py-3 px-4">Ngạch</th>
                    <th className="py-3 px-4">Vai trò</th>
                    <th className="py-3 px-4">Xác thực 2 lớp</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Họ tên & Avatar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 whitespace-nowrap">
                                {u.name}
                                {u.id === currentUser?.id && (
                                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 rounded">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                                <span className="font-mono">{u.employeeCode || `CB-${u.id.substring(4, 8)}`}</span> · {u.email}
                                {u.idCardNumber && <> · CCCD {u.idCardNumber}</>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Đơn vị & Chức danh */}
                        <td className="py-3 px-4 min-w-[220px]">
                          <div className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                            {u.departmentName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            {u.positionTitle || 'Chuyên viên'}
                          </div>
                        </td>

                        {/* Loại đối tượng & Ngạch */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {renderEmployeeTypeBadge(u.employeeType || 'CONG_CHUC')}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
                            {u.cadreRank || 'Chuyên viên'} · hệ số <strong>{u.salaryCoefficient || 2.34}</strong>
                          </div>
                        </td>

                        {/* Vai trò RBAC */}
                        <td className="py-3 px-4">
                          <span className={`whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            u.role === 'SYSTEM_ADMIN' || u.role === 'ADMIN'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                              : ['EXECUTIVE', 'UNIT_HEAD', 'LINE_MANAGER', 'MANAGER'].includes(u.role)
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {getRoleLabel(u.role)}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {getScopeLabel(u.dataScope || DEFAULT_SCOPE[u.role] || 'SELF')}
                          </div>
                        </td>

                        {/* Trạng thái 2FA */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => toggle2FA(u.id)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              u.isTwoFactorEnabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                                : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                            }`}
                          >
                            <Smartphone size={12} className={u.isTwoFactorEnabled ? 'text-emerald-600' : 'text-slate-400'} />
                            {u.isTwoFactorEnabled ? 'Đã bật' : 'Chưa bật'}
                          </button>
                        </td>

                        {/* Thao tác */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              title="Chỉnh sửa hồ sơ"
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              title="Cấp lại mật khẩu"
                              onClick={() => resetPassword(u.id)}
                              className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600"
                            >
                              <Key size={13} />
                            </button>
                            <button
                              title="Xóa hồ sơ"
                              onClick={() => {
                                if (window.confirm(`Xác nhận xóa hồ sơ cán bộ: ${u.name}?`)) {
                                  deleteUser(u.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                        Không tìm thấy cán bộ nào thỏa mãn bộ lọc tìm kiếm
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Summary */}
            <div className="py-3 px-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Hiển thị <strong>{filteredUsers.length}</strong> / tổng số <strong>{users.length}</strong> cán bộ
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Đã kích hoạt 2FA: {users.filter((u) => u.isTwoFactorEnabled).length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 3: DANH MỤC VỊ TRÍ VIỆC LÀM (POSITIONS)                           */}
      {/* ====================================================================== */}
      {activeTab === 'positions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Vị trí việc làm
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cấu hình vị trí lãnh đạo, chuyên môn nghiệp vụ theo Nghị định 62/2020 & 106/2020
              </p>
            </div>
            <button
              onClick={() => showToast('Chức năng thêm danh mục vị trí việc làm')}
              className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} /> Thêm vị trí việc làm
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {positions.map((pos) => (
              <div
                key={pos.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold">
                      {pos.code}
                    </span>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mt-1.5">
                      {pos.title}
                    </h4>
                  </div>
                  <span className="whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {pos.civilServantRank || 'Chuyên viên'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {pos.description || 'Chưa cập nhật bản mô tả vị trí việc làm.'}
                </p>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Nhóm: <strong className="text-slate-600 dark:text-slate-300">{pos.category}</strong></span>
                  <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Chi tiết</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 1: THÊM / SỬA ĐƠN VỊ TỔ CHỨC                                     */}
      {/* ====================================================================== */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="text-blue-600" size={18} />
                {editingDept ? 'Sửa đơn vị' : 'Thêm đơn vị'}
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Mã đơn vị <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: PPM-03"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Cấp đơn vị
                  </label>
                  <select
                    value={deptForm.level}
                    onChange={(e) => {
                      const lvl = Number(e.target.value);
                      const name = lvl === 1 ? 'Cơ quan Bộ / Tập đoàn' : lvl === 2 ? 'Cục / Khối' : 'Phòng ban / Vụ';
                      setDeptForm({ ...deptForm, level: lvl, levelName: name });
                    }}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value={1}>Cấp 1: Cơ quan Bộ / Tập đoàn</option>
                    <option value={2}>Cấp 2: Cục / Khối Nghiệp vụ</option>
                    <option value={3}>Cấp 3: Phòng ban / Vụ chuyên môn</option>
                    <option value={4}>Cấp 4: Tổ / Nhóm công tác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Tên đơn vị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phòng Phát triển Phần mềm & Ứng dụng nghiệp vụ"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Đơn vị cấp trên
                  </label>
                  <select
                    value={deptForm.parentId || ''}
                    onChange={(e) => setDeptForm({ ...deptForm, parentId: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">(Không có - Là đơn vị gốc / Root)</option>
                    {departments
                      .filter((d) => d.id !== editingDept?.id)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Chế độ đánh giá
                  </label>
                  <select
                    value={deptForm.operatingMode}
                    onChange={(e) => setDeptForm({ ...deptForm, operatingMode: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="GOVERNMENT">Cơ quan Nhà nước (Nghị định 90/2020)</option>
                    <option value="ENTERPRISE">Doanh nghiệp (KPI / OKR / BSC / 360°)</option>
                    <option value="HYBRID">Kết hợp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Chức năng, nhiệm vụ
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả chức năng, nhiệm vụ quyền hạn của đơn vị..."
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  {editingDept ? 'Lưu thay đổi' : 'Thêm đơn vị'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 2: THÊM / SỬA HỒ SƠ CÁN BỘ                                      */}
      {/* ====================================================================== */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="text-blue-600" size={18} />
                {editingUser ? 'Sửa hồ sơ cán bộ' : 'Thêm cán bộ'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Mã cán bộ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.employeeCode}
                    onChange={(e) => setUserForm({ ...userForm, employeeCode: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Số CCCD / Định danh
                  </label>
                  <input
                    type="text"
                    value={userForm.idCardNumber}
                    onChange={(e) => setUserForm({ ...userForm, idCardNumber: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="canbo@kpi.gov.vn"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    placeholder="0912 345 678"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Đơn vị <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={userForm.departmentId}
                    onChange={(e) => setUserForm({ ...userForm, departmentId: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Vị trí việc làm
                  </label>
                  <select
                    value={userForm.positionId}
                    onChange={(e) => setUserForm({ ...userForm, positionId: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.civilServantRank})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Loại đối tượng
                  </label>
                  <select
                    value={userForm.employeeType}
                    onChange={(e) => setUserForm({ ...userForm, employeeType: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="CAN_BO">Cán bộ (Nhiệm kỳ)</option>
                    <option value="CONG_CHUC">Công chức (Ngạch)</option>
                    <option value="VIEN_CHUC">Viên chức (Sự nghiệp)</option>
                    <option value="NHAN_VIEN_HOP_DONG">Hợp đồng NĐ 111</option>
                    <option value="DOANH_NGHIEP">Doanh nghiệp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Ngạch
                  </label>
                  <select
                    value={userForm.cadreRank}
                    onChange={(e) => setUserForm({ ...userForm, cadreRank: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Chuyên viên cao cấp">Chuyên viên cao cấp</option>
                    <option value="Chuyên viên chính">Chuyên viên chính</option>
                    <option value="Chuyên viên">Chuyên viên</option>
                    <option value="Cán sự">Cán sự</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Hệ số lương
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={userForm.salaryCoefficient}
                    onChange={(e) => setUserForm({ ...userForm, salaryCoefficient: Number(e.target.value) })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Vai trò
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      const roleTitle = getRoleLabel(role);
                      const dataScope = DEFAULT_SCOPE[role] || 'SELF';
                      setUserForm({ ...userForm, role, roleTitle, dataScope });
                    }}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {MAIN_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {getRoleLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Phạm vi dữ liệu
                  </label>
                  <select
                    value={userForm.dataScope}
                    onChange={(e) => setUserForm({ ...userForm, dataScope: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="ALL">Toàn hệ thống (ALL)</option>
                    <option value="DEPARTMENT_AND_CHILDREN">Đơn vị & Cấp trực thuộc (DEPARTMENT_AND_CHILDREN)</option>
                    <option value="DEPARTMENT_ONLY">Chỉ trong đơn vị (DEPARTMENT_ONLY)</option>
                    <option value="SELF_ONLY">Chỉ bản thân (SELF_ONLY)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  {editingUser ? 'Lưu hồ sơ' : 'Thêm cán bộ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 3: IMPORT EXCEL & BÁO CÁO LỖI CHI TIẾT TỪNG DÒNG (ROW-BY-ROW)   */}
      {/* ====================================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-600" size={20} />
                  Nhập cán bộ từ Excel
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kiểm tra tính toàn vẹn của dữ liệu: trùng mã, sai format email, sai mã đơn vị trước khi lưu vào CSDL
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportReport(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Step 1: File template & upload */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center justify-center">
                    <Download size={20} />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white">Tệp Excel mẫu</div>
                    <div className="text-[11px] text-slate-400">Gồm 9 cột: Mã CB, Họ tên, Email, SĐT, Mã phòng ban, Chức danh, Loại đối tượng, Ngạch, Hệ số lương</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," + 
                        "Mã cán bộ,Họ và tên,Email,Số điện thoại,Mã phòng ban,Chức vụ,Loại đối tượng,Ngạch,Hệ số lương\n" +
                        "CB-001,Nguyễn Văn Mẫu,mau.nv@kpi.gov.vn,0901234567,PPM-03,Chuyên viên,CONG_CHUC,Chuyên viên,2.34\n";
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "Mau_Import_CanBo_KPI.csv");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      showToast('Đã tải xuống file mẫu thành công!');
                    }}
                    className="px-3 py-1.5 font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <Download size={13} /> Tải tệp mẫu .CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleRunExcelValidation}
                    className="px-3.5 py-1.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload size={13} /> Dùng dữ liệu mẫu (6 dòng)
                  </button>
                </div>
              </div>

              {/* Step 2: Validation Report (Báo cáo lỗi chi tiết từng dòng) */}
              {importReport && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Tổng số dòng</div>
                      <div className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                        {importReport.totalRows}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase">Hợp lệ</div>
                      <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={18} /> {importReport.validCount}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-center">
                      <div className="text-[10px] font-bold text-red-600 uppercase">Lỗi</div>
                      <div className="text-xl font-extrabold text-red-700 dark:text-red-300 mt-1 flex items-center justify-center gap-1.5">
                        <XCircle size={18} /> {importReport.errorCount}
                      </div>
                    </div>
                  </div>

                  {/* Bảng báo cáo lỗi chi tiết */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                      <span className="flex items-center gap-2">
                        <AlertTriangle size={15} className="text-amber-500" />
                        Chi tiết lỗi ({importReport.errors.length} lỗi)
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">
                        Hệ thống kiểm tra tính hợp lệ của từng ô dữ liệu
                      </span>
                    </div>

                    {importReport.errors.length > 0 ? (
                      <div className="max-h-[220px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-medium text-slate-500">
                            <tr>
                              <th className="py-2 px-3">Dòng #</th>
                              <th className="py-2 px-3">Trường dữ liệu</th>
                              <th className="py-2 px-3">Giá trị nhập</th>
                              <th className="py-2 px-3">Nguyên nhân lỗi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                            {importReport.errors.map((err, idx) => (
                              <tr key={idx} className="bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300">
                                <td className="py-2 px-3 font-bold">Dòng {err.rowNumber}</td>
                                <td className="py-2 px-3 font-semibold">{err.column}</td>
                                <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                                  {err.value || '<Trống>'}
                                </td>
                                <td className="py-2 px-3 font-sans font-medium">{err.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-emerald-600 font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} /> Tất cả các dòng dữ liệu đều hợp lệ 100%!
                      </div>
                    )}
                  </div>

                  {/* Lựa chọn xử lý */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importSkipErrors}
                        onChange={(e) => setImportSkipErrors(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                        Bỏ qua các dòng lỗi và chỉ nhập {importReport.validCount} dòng hợp lệ
                      </span>
                    </label>

                    <span className="text-[11px] text-slate-400">
                      Mật khẩu mặc định sau khi import: <strong className="font-mono text-blue-600">MatKhau@2026!</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportReport(null);
                }}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
              >
                Đóng
              </button>

              {importReport && (
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importReport.validCount === 0 || (!importSkipErrors && importReport.errorCount > 0)}
                  className={`px-5 py-2 font-bold rounded-xl text-white shadow-sm flex items-center gap-2 ${
                    importReport.validCount === 0 || (!importSkipErrors && importReport.errorCount > 0)
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Check size={16} />
                  Xác nhận nhập ({importSkipErrors ? importReport.validCount : importReport.totalRows} cán bộ)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
