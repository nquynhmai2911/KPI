import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_POSITIONS,
  INITIAL_USERS,
  INITIAL_PERIODS,
  INITIAL_KPI_LIBRARY,
  INITIAL_CASCADING_GOALS,
  INITIAL_KPI_PLANS,
  INITIAL_PEER_REVIEWS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_KPI_TEMPLATES,
  INITIAL_ROLES,
  INITIAL_PERMISSIONS,
} from '../data/initialData';
import { INITIAL_KPI_TASKS } from '../data/initialTasks';
import { getRoleLabel } from '../utils/labels';

const AppContext = createContext();

const STORAGE_KEY = 'GOV_KPI_SYSTEM_STATE_V3';

export const AppProvider = ({ children }) => {
  // Load state from localStorage or initialData
  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_DEPARTMENTS`);
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_POSITIONS`);
    return saved ? JSON.parse(saved) : INITIAL_POSITIONS;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_USERS`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_CURRENT_USER_ID`);
    return saved || 'usr-04'; // Default: Phạm Đức Thắng (Employee) or usr-02 (Manager)
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_IS_AUTHENTICATED`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [rolesConfig, setRolesConfig] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_ROLES_CONFIG`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const totalPerms = parsed.reduce(
            (sum, r) => sum + (Array.isArray(r.permissions) ? r.permissions.length : 0),
            0
          );
          if (totalPerms > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error parsing rolesConfig from localStorage', e);
      }
    }
    return INITIAL_ROLES;
  });

  const [permissionsList] = useState(INITIAL_PERMISSIONS);

  const [activeRole, setActiveRoleState] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_ACTIVE_ROLE`);
    return saved || 'EMPLOYEE';
  });

  const [periods, setPeriods] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_PERIODS`);
    return saved ? JSON.parse(saved) : INITIAL_PERIODS;
  });

  const [activePeriodId, setActivePeriodId] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_ACTIVE_PERIOD`);
    return saved || 'period-2026-q4';
  });

  const [kpiLibrary, setKpiLibrary] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_KPI_LIBRARY`);
    return saved ? JSON.parse(saved) : INITIAL_KPI_LIBRARY;
  });

  const [cascadingGoals, setCascadingGoals] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_CASCADING`);
    return saved ? JSON.parse(saved) : INITIAL_CASCADING_GOALS;
  });

  const [kpiPlans, setKpiPlans] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_PLANS`);
    return saved ? JSON.parse(saved) : INITIAL_KPI_PLANS;
  });

  const [kpiTasks, setKpiTasks] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_TASKS`);
    return saved ? JSON.parse(saved) : INITIAL_KPI_TASKS;
  });

  const [kpiTemplates, setKpiTemplates] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_KPI_TEMPLATES`);
    return saved ? JSON.parse(saved) : INITIAL_KPI_TEMPLATES;
  });

  const [peerReviews, setPeerReviews] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_PEER_REVIEWS`);
    return saved ? JSON.parse(saved) : INITIAL_PEER_REVIEWS;
  });

  // Phase 3: 1:1 Meetings State
  const [meetings1on1, setMeetings1on1] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_MEETINGS_1ON1`);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'meet-01',
            employeeId: 'usr-04',
            employeeName: 'Phạm Đức Thắng',
            managerId: 'usr-02',
            managerName: 'Lê Hoàng Minh',
            date: '2026-10-14',
            topics: 'Rà soát tiến độ tối ưu hóa API và bàn giải pháp bổ sung cache Redis',
            progressNotes: 'Sprint 2 đã hoàn thành 98%, các API chính đạt độ trễ 185ms.',
            blockers: 'Cần sự hỗ trợ của phòng Hạ tầng để mở thêm port kết nối Redis Cluster.',
            actionItems: [
              { id: 'act-1', task: 'Làm việc với Đỗ Hải Nam (PHT) cấp quyền kết nối Redis', assignee: 'Phạm Đức Thắng', dueDate: '2026-10-18', status: 'IN_PROGRESS' },
              { id: 'act-2', task: 'Chạy lại benchmark tải 5000 CCU trước ngày 22/10', assignee: 'Phạm Đức Thắng', dueDate: '2026-10-22', status: 'PENDING' },
            ],
            status: 'COMPLETED',
            nextMeetingDate: '2026-10-28',
          },
        ];
  });

  // Phase 3: Scheduler Job Logs
  const [schedulerJobLogs, setSchedulerJobLogs] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_SCHEDULER_LOGS`);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'job-init',
            timestamp: new Date().toLocaleString('vi-VN'),
            scannedKpisCount: 18,
            atRiskCount: 2,
            overdueCount: 2,
            notificationsCreated: 4,
            emailsSimulated: 4,
            status: 'SUCCESS',
            message: 'Đã quét toàn bộ KPI kỳ Q4/2026, phát hiện 2 chỉ tiêu chậm tiến độ và 2 chỉ tiêu quá hạn.',
          },
        ];
  });

  // Phase 4: Collective Meeting Records (Hội nghị tập thể lấy ý kiến)
  const [collectiveMeetings, setCollectiveMeetings] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_COLLECTIVE_MEETINGS`);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'cm-01',
            planId: 'plan-thang-q4',
            employeeId: 'usr-04',
            employeeName: 'Phạm Đức Thắng',
            departmentId: 'dept-01-01-01',
            departmentName: 'Tổ Kỹ thuật Backend & Dữ liệu lớn',
            meetingDate: '2026-10-16',
            attendeesCount: 12,
            totalVotes: 12,
            voteExcellent: 10,
            voteGood: 2,
            voteCompleted: 0,
            voteFailed: 0,
            meetingMinutes: 'Hội nghị biểu quyết nhất trí cao đánh giá đồng chí Phạm Đức Thắng hoàn thành xuất sắc nhiệm vụ.',
            councilConsensus: 'EXCELLENT',
            status: 'CONFIRMED',
          },
        ];
  });

  // Phase 4: Discipline & Exclusion Records (Hồ sơ kỷ luật phục vụ điều kiện loại trừ)
  const [disciplineRecords, setDisciplineRecords] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_DISCIPLINE_RECORDS`);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'disc-01',
            userId: 'usr-08',
            employeeName: 'Nguyễn Văn Định',
            departmentName: 'Khối Kinh doanh & Dịch vụ',
            type: 'KHIEN_TRACH',
            typeName: 'Khiển trách',
            decisionNumber: '142/QĐ-TCCB',
            effectiveDate: '2026-06-15',
            reason: 'Vi phạm quy chế bảo mật thông tin nội bộ đơn vị',
            maxAllowedRank: 'HOÀN THÀNH', // Bị kỷ luật thì trần tối đa không quá "Hoàn thành nhiệm vụ"
          },
        ];
  });

  // Phase 4: Quota Policy Configuration
  const [quotaPolicy, setQuotaPolicy] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_QUOTA_POLICY`);
    return saved || 'WARNING_WITH_JUSTIFICATION'; // WARNING_WITH_JUSTIFICATION or STRICT_BLOCK
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_AUDIT_LOGS`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_NOTIFS`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // dashboards, periods, org-system, library, my-kpi, team-kpi, reports, non-functional
  const MODULE_ALIASES = { planning: 'library', tracking: 'my-kpi', evaluation: 'team-kpi' };
  const moduleFromHash = () => {
    const id = window.location.hash.replace('#', '');
    return MODULE_ALIASES[id] || id || 'dashboards';
  };
  const [activeModule, setActiveModuleState] = useState(moduleFromHash);
  const setActiveModule = (id) => {
    const next = MODULE_ALIASES[id] || id;
    setActiveModuleState(next);
    if (window.location.hash !== `#${next}`) window.history.pushState(null, '', `#${next}`);
  };
  useEffect(() => {
    const onPop = () => setActiveModuleState(moduleFromHash());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem(`${STORAGE_KEY}_DARK_MODE`) === 'true';
  });

  // Operating Mode: GOVERNMENT (Nghị định 90/48) or ENTERPRISE (Doanh nghiệp KPI/BSC/OKR)
  const [systemOperatingMode, setSystemOperatingModeState] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_OPERATING_MODE`);
    return saved || 'GOVERNMENT';
  });

  const setSystemOperatingMode = (mode) => {
    setSystemOperatingModeState(mode);
    localStorage.setItem(`${STORAGE_KEY}_OPERATING_MODE`, mode);
    showToast(
      mode === 'GOVERNMENT'
        ? 'Chuyển sang chế độ Cơ quan Nhà nước (Nghị định 90/2020 & 48/2023)'
        : 'Chuyển sang chế độ Doanh nghiệp (KPI / BSC / OKR & Lương thưởng)',
      'info'
    );
  };

  // Sidebar collapse & mobile state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem(`${STORAGE_KEY}_SIDEBAR_COLLAPSED`) === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(`${STORAGE_KEY}_SIDEBAR_COLLAPSED`, next ? 'true' : 'false');
      return next;
    });
  };

  // Toast alert system
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_DEPARTMENTS`, JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_POSITIONS`, JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_USERS`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_CURRENT_USER_ID`, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_IS_AUTHENTICATED`, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ROLES_CONFIG`, JSON.stringify(rolesConfig));
  }, [rolesConfig]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ACTIVE_ROLE`, activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_PERIODS`, JSON.stringify(periods));
  }, [periods]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ACTIVE_PERIOD`, activePeriodId);
  }, [activePeriodId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_KPI_LIBRARY`, JSON.stringify(kpiLibrary));
  }, [kpiLibrary]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_CASCADING`, JSON.stringify(cascadingGoals));
  }, [cascadingGoals]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_PLANS`, JSON.stringify(kpiPlans));
  }, [kpiPlans]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_TASKS`, JSON.stringify(kpiTasks));
  }, [kpiTasks]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ROLES_CONFIG`, JSON.stringify(rolesConfig));
  }, [rolesConfig]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ACTIVE_ROLE`, activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_KPI_TEMPLATES`, JSON.stringify(kpiTemplates));
  }, [kpiTemplates]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_PEER_REVIEWS`, JSON.stringify(peerReviews));
  }, [peerReviews]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_AUDIT_LOGS`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_NOTIFS`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_MEETINGS_1ON1`, JSON.stringify(meetings1on1));
  }, [meetings1on1]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_SCHEDULER_LOGS`, JSON.stringify(schedulerJobLogs));
  }, [schedulerJobLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_COLLECTIVE_MEETINGS`, JSON.stringify(collectiveMeetings));
  }, [collectiveMeetings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_DISCIPLINE_RECORDS`, JSON.stringify(disciplineRecords));
  }, [disciplineRecords]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_QUOTA_POLICY`, quotaPolicy);
  }, [quotaPolicy]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_DARK_MODE`, darkMode ? 'true' : 'false');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Current User info
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const activePeriod = periods.find((p) => p.id === activePeriodId) || periods[0];

  // Vai trò đang làm việc luôn phải thuộc danh sách vai trò của tài khoản hiện tại
  useEffect(() => {
    const userRoles = currentUser?.roles || [currentUser?.role || 'EMPLOYEE'];
    if (!userRoles.includes(activeRole)) setActiveRoleState(userRoles[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // Helper: Log audit trail
  const logAudit = (action, moduleName, description, oldValue = '', newValue = '') => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action,
      module: moduleName,
      description,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
      oldValue: String(oldValue),
      newValue: String(newValue),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Helper: Send notification
  const addNotification = (title, message, type = 'INFO', targetModule = 'dashboards') => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      time: 'Vừa xong',
      isRead: false,
      targetModule,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // 1. Department Actions
  const addDepartment = (dept) => {
    const newDept = {
      ...dept,
      id: `dept-${Date.now()}`,
      headcount: 0,
    };
    setDepartments((prev) => [...prev, newDept]);
    logAudit('CREATE_DEPARTMENT', 'Module 1: Tổ chức', `Thêm mới đơn vị phòng ban: ${dept.name}`, '', dept.code);
    showToast(`Đã thêm phòng ban "${dept.name}" thành công!`);
  };

  const updateDepartment = (id, updatedFields) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updatedFields } : d))
    );
    logAudit('UPDATE_DEPARTMENT', 'Module 1: Tổ chức', `Cập nhật thông tin đơn vị ID: ${id}`);
    showToast('Cập nhật đơn vị thành công!');
  };

  const deleteDepartment = (id) => {
    const target = departments.find((d) => d.id === id);
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    logAudit('DELETE_DEPARTMENT', 'Module 1: Tổ chức', `Xóa đơn vị: ${target?.name || id}`);
    showToast('Đã xóa đơn vị thành công!');
  };

  // 2. Position Actions
  const addPosition = (pos) => {
    const newPos = { ...pos, id: `pos-${Date.now()}` };
    setPositions((prev) => [...prev, newPos]);
    logAudit('CREATE_POSITION', 'Module 1: Vị trí việc làm', `Thêm vị trí: ${pos.title}`);
    showToast(`Đã thêm chức danh "${pos.title}"`);
  };

  const updatePosition = (id, updatedFields) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
    logAudit('UPDATE_POSITION', 'Module 1: Vị trí việc làm', `Sửa thông tin chức danh ID: ${id}`);
    showToast('Cập nhật chức danh thành công!');
  };

  // 3. User & RBAC Actions
  const updateUserRole = (userId, newRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    logAudit('UPDATE_ROLE', 'Module 1: Phân quyền', `Đổi vai trò người dùng ID ${userId} thành ${newRole}`);
    showToast('Cập nhật phân quyền thành công!');
  };

  const updateUser = (userId, updatedFields) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updatedFields } : u))
    );
    logAudit('UPDATE_USER', 'Module 1: Nhân sự', `Cập nhật hồ sơ nhân sự ID: ${userId}`);
    showToast('Cập nhật thông tin cán bộ thành công!');
  };

  const addUser = (userData) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      employeeCode: userData.employeeCode || `CB-${Math.floor(1000 + Math.random() * 9000)}`,
      name: userData.name || userData.fullName,
      email: userData.email,
      phone: userData.phone || '0901 000 000',
      idCardNumber: userData.idCardNumber || '001090012345',
      employeeType: userData.employeeType || 'CONG_CHUC', // CAN_BO, CONG_CHUC, VIEN_CHUC, NHAN_VIEN_HOP_DONG, DOANH_NGHIEP
      cadreRank: userData.cadreRank || 'Chuyên viên',
      contractType: userData.contractType || 'KHONG_XAC_DINH_THOI_HAN',
      salaryCoefficient: Number(userData.salaryCoefficient) || 2.34,
      role: userData.role || 'EMPLOYEE',
      roleTitle: userData.roleTitle || 'Cán bộ / Chuyên viên',
      dataScope: userData.dataScope || (userData.role === 'ADMIN' ? 'ALL' : userData.role === 'MANAGER' ? 'DEPARTMENT_AND_CHILDREN' : 'SELF_ONLY'),
      positionId: userData.positionId || positions[0]?.id,
      positionTitle: userData.positionTitle || positions[0]?.title,
      departmentId: userData.departmentId || departments[0]?.id,
      departmentName: departments.find((d) => d.id === userData.departmentId)?.name || 'Cơ quan Bộ',
      avatar: userData.avatar || `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`,
      status: 'ACTIVE',
      isTwoFactorEnabled: false,
      joinedDate: userData.joinedDate || new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [newUser, ...prev]);
    logAudit('CREATE_USER', 'Module 1: Nhân sự', `Thêm mới hồ sơ cán bộ: ${newUser.name} (${newUser.employeeCode})`);
    showToast(`Đã thêm cán bộ "${newUser.name}" thành công!`);
    return newUser;
  };

  const deleteUser = (userId) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    logAudit('DELETE_USER', 'Module 1: Nhân sự', `Xóa hồ sơ cán bộ: ${target.name} (${target.employeeCode || userId})`);
    showToast(`Đã xóa cán bộ "${target.name}"!`, 'warning');
  };

  const toggle2FA = (userId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextState = !u.isTwoFactorEnabled;
          logAudit('TOGGLE_2FA', 'Bảo mật tài khoản', `${nextState ? 'Bật' : 'Tắt'} bảo mật 2 lớp 2FA cho người dùng: ${u.name}`);
          showToast(`${nextState ? 'Đã kích hoạt' : 'Đã hủy'} bảo mật 2 lớp (2FA)!`);
          return { ...u, isTwoFactorEnabled: nextState };
        }
        return u;
      })
    );
  };

  const resetPassword = (userId, newPassword) => {
    const target = users.find((u) => u.id === userId);
    logAudit('RESET_PASSWORD', 'Bảo mật', `Đặt lại mật khẩu cho tài khoản: ${target?.name}`);
    showToast(`Đã cấp lại mật khẩu mới cho cán bộ "${target?.name}"!`);
  };

  const forgotPassword = (email) => {
    const target = users.find((u) => u.email === email);
    logAudit('FORGOT_PASSWORD', 'Bảo mật', `Yêu cầu quên mật khẩu gửi tới email: ${email}`);
    showToast(`Đã gửi liên kết khôi phục mật khẩu đến email ${email}!`);
    return { success: true, email };
  };

  /**
   * Import nhân sự từ Excel với bộ kiểm tra lỗi chi tiết từng dòng
   */
  const importUsersBatch = (rows, skipErrors = false) => {
    const errors = [];
    const validRows = [];
    const seenEmails = new Set(users.map((u) => u.email.toLowerCase()));
    const seenCodes = new Set(users.filter((u) => u.employeeCode).map((u) => u.employeeCode.toUpperCase()));
    const batchEmails = new Set();
    const batchCodes = new Set();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      let hasError = false;

      // 1. Kiểm tra họ tên
      if (!row.name || !row.name.trim()) {
        errors.push({ rowNumber: rowNum, column: 'Họ và tên', value: row.name || '(Trống)', message: 'Họ và tên không được để trống' });
        hasError = true;
      }

      // 2. Kiểm tra Email
      if (!row.email || !row.email.trim()) {
        errors.push({ rowNumber: rowNum, column: 'Email', value: row.email || '(Trống)', message: 'Email không được để trống' });
        hasError = true;
      } else if (!emailRegex.test(row.email.trim())) {
        errors.push({ rowNumber: rowNum, column: 'Email', value: row.email, message: 'Định dạng email không hợp lệ' });
        hasError = true;
      } else {
        const eLower = row.email.trim().toLowerCase();
        if (seenEmails.has(eLower)) {
          errors.push({ rowNumber: rowNum, column: 'Email', value: row.email, message: `Email '${row.email}' đã tồn tại trong hệ thống` });
          hasError = true;
        } else if (batchEmails.has(eLower)) {
          errors.push({ rowNumber: rowNum, column: 'Email', value: row.email, message: `Email '${row.email}' bị trùng lặp trong file` });
          hasError = true;
        } else {
          batchEmails.add(eLower);
        }
      }

      // 3. Kiểm tra Mã nhân viên
      if (row.employeeCode && row.employeeCode.trim()) {
        const cUpper = row.employeeCode.trim().toUpperCase();
        if (seenCodes.has(cUpper) || batchCodes.has(cUpper)) {
          errors.push({ rowNumber: rowNum, column: 'Mã cán bộ', value: row.employeeCode, message: `Mã cán bộ '${row.employeeCode}' đã tồn tại` });
          hasError = true;
        } else {
          batchCodes.add(cUpper);
        }
      }

      // 4. Kiểm tra Phòng ban
      const dept = departments.find((d) => d.code === row.departmentCode || d.id === row.departmentId);
      if (!dept) {
        errors.push({ rowNumber: rowNum, column: 'Mã phòng ban', value: row.departmentCode || row.departmentId || '(Trống)', message: 'Mã đơn vị không tồn tại trên cây tổ chức' });
        hasError = true;
      }

      if (!hasError) {
        validRows.push({
          ...row,
          departmentId: dept.id,
          departmentName: dept.name,
        });
      }
    });

    let importedCount = 0;
    if (validRows.length > 0 && (skipErrors || errors.length === 0)) {
      const newUsersList = validRows.map((item, idx) => ({
        id: `usr-imp-${Date.now()}-${idx}`,
        employeeCode: item.employeeCode || `CB-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
        name: item.name.trim(),
        email: item.email.trim(),
        phone: item.phone || '0901 000 000',
        idCardNumber: item.idCardNumber || '001090012345',
        employeeType: item.employeeType || 'CONG_CHUC',
        cadreRank: item.cadreRank || 'Chuyên viên',
        contractType: item.contractType || 'KHONG_XAC_DINH_THOI_HAN',
        salaryCoefficient: Number(item.salaryCoefficient) || 2.34,
        role: item.role || 'EMPLOYEE',
        roleTitle: item.roleTitle || 'Chuyên viên',
        dataScope: 'SELF_ONLY',
        positionId: positions[0]?.id,
        positionTitle: item.positionTitle || 'Chuyên viên chuyên môn',
        departmentId: item.departmentId,
        departmentName: item.departmentName,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + idx}?w=150&auto=format&fit=crop&q=80`,
        status: 'ACTIVE',
        isTwoFactorEnabled: false,
        joinedDate: item.joinedDate || new Date().toISOString().split('T')[0],
      }));

      setUsers((prev) => [...newUsersList, ...prev]);
      importedCount = newUsersList.length;
      logAudit('IMPORT_EXCEL', 'Module 1: Nhân sự', `Import thành công ${importedCount} hồ sơ cán bộ từ file Excel`);
      showToast(`Đã import thành công ${importedCount} cán bộ vào hệ thống!`);
    }

    return {
      success: errors.length === 0 || (skipErrors && importedCount > 0),
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errors.length,
      importedCount,
      errors,
    };
  };

  // 4. Period Actions
  const addPeriod = (period) => {
    const newPeriod = {
      ...period,
      id: `period-${Date.now()}`,
      status: 'REGISTRATION',
      statusName: 'Đang mở đăng ký chỉ tiêu',
    };
    setPeriods((prev) => [newPeriod, ...prev]);
    logAudit('CREATE_PERIOD', 'Module 1: Kỳ đánh giá', `Mở kỳ đánh giá mới: ${period.name}`);
    addNotification('Kỳ đánh giá mới đã mở', `Kỳ ${period.name} đã được tạo và mở đăng ký chỉ tiêu.`, 'INFO', 'planning');
    showToast(`Đã mở kỳ đánh giá "${period.name}"`);
  };

  const updatePeriodStatus = (id, newStatus, newStatusName) => {
    setPeriods((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus, statusName: newStatusName } : p))
    );
    logAudit('UPDATE_PERIOD_STATUS', 'Module 1: Kỳ đánh giá', `Chuyển trạng thái kỳ đánh giá sang ${newStatusName}`);
    showToast(`Trạng thái kỳ đánh giá đã chuyển thành: ${newStatusName}`);
  };

  // 5. KPI Library Actions
  const addKpiToLibrary = (kpi) => {
    const newKpi = {
      ...kpi,
      id: `lib-${Date.now()}`,
    };
    setKpiLibrary((prev) => [newKpi, ...prev]);
    logAudit('CREATE_KPI_LIBRARY', 'Module 2: Thư viện KPI', `Thêm chỉ tiêu mẫu: ${kpi.name} (${kpi.code})`);
    showToast(`Đã thêm chỉ tiêu "${kpi.name}" vào thư viện!`);
  };

  const updateKpiInLibrary = (id, fields) => {
    setKpiLibrary((prev) =>
      prev.map((k) => (k.id === id ? { ...k, ...fields } : k))
    );
    logAudit('UPDATE_KPI_LIBRARY', 'Module 2: Thư viện KPI', `Cập nhật chỉ tiêu thư viện ID: ${id}`);
    showToast('Cập nhật chỉ tiêu thành công!');
  };

  const deleteKpiFromLibrary = (id) => {
    setKpiLibrary((prev) => prev.filter((k) => k.id !== id));
    logAudit('DELETE_KPI_LIBRARY', 'Module 2: Thư viện KPI', `Xóa chỉ tiêu thư viện ID: ${id}`);
    showToast('Đã xóa chỉ tiêu khỏi thư viện!');
  };

  // 6. KPI Plan Actions (Registration & Cascading)
  const createOrUpdatePlan = (planData) => {
    const existingIndex = kpiPlans.findIndex(
      (p) => p.employeeId === planData.employeeId && p.periodId === planData.periodId
    );
    if (existingIndex >= 0) {
      const updated = [...kpiPlans];
      updated[existingIndex] = { ...updated[existingIndex], ...planData };
      setKpiPlans(updated);
    } else {
      const newPlan = {
        id: `plan-${Date.now()}`,
        status: 'DRAFT',
        statusName: 'Bản nháp',
        submittedDate: null,
        approvedDate: null,
        overallSelfScore: 0,
        overallManagerScore: 0,
        finalScore: 0,
        finalRank: 'CHƯA XẾP LOẠI',
        evaluationStatus: 'NOT_EVALUATED',
        peerScoreAvg: 0,
        ...planData,
      };
      setKpiPlans((prev) => [newPlan, ...prev]);
    }
    logAudit('SAVE_KPI_PLAN', 'Module 2: Đăng ký KPI', `Lưu kế hoạch KPI cho nhân viên ${planData.employeeName}`);
    showToast('Đã lưu bản kế hoạch KPI!');
  };

  const submitKpiPlan = (planId) => {
    setKpiPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            status: 'SUBMITTED',
            statusName: 'Chờ Quản lý Phê duyệt',
            submittedDate: new Date().toISOString().split('T')[0],
          };
        }
        return p;
      })
    );
    logAudit('SUBMIT_KPI_PLAN', 'Module 2: Đăng ký KPI', `Trình duyệt kế hoạch KPI ID: ${planId}`, 'DRAFT', 'SUBMITTED');
    addNotification('Kế hoạch KPI đã gửi duyệt', 'Phiếu đăng ký chỉ tiêu đã được gửi tới Quản lý xét duyệt.', 'INFO', 'planning');
    showToast('Đã gửi kế hoạch KPI lên Quản lý phê duyệt!');
  };

  const approveKpiPlan = (planId, managerNote = 'Đồng ý phê duyệt.') => {
    setKpiPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            status: 'APPROVED',
            statusName: 'Đã duyệt (Đang thực hiện)',
            approvedDate: new Date().toISOString().split('T')[0],
            managerNote,
          };
        }
        return p;
      })
    );
    logAudit('APPROVE_KPI_PLAN', 'Module 2: Phê duyệt KPI', `Quản lý phê duyệt kế hoạch KPI ID: ${planId}`, 'SUBMITTED', 'APPROVED');
    addNotification('Kế hoạch KPI đã được duyệt!', `Quản lý đã phê duyệt: "${managerNote}"`, 'SUCCESS', 'tracking');
    showToast('Đã phê duyệt kế hoạch KPI thành công!');
  };

  const rejectKpiPlan = (planId, reason = 'Cần điều chỉnh mục tiêu.') => {
    setKpiPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            status: 'REJECTED',
            statusName: 'Yêu cầu điều chỉnh lại',
            managerNote: reason,
          };
        }
        return p;
      })
    );
    logAudit('REJECT_KPI_PLAN', 'Module 2: Phê duyệt KPI', `Quản lý từ chối kế hoạch KPI ID: ${planId} Lý do: ${reason}`, 'SUBMITTED', 'REJECTED');
    addNotification('Kế hoạch KPI bị từ chối', `Quản lý yêu cầu sửa đổi: "${reason}"`, 'ALERT', 'planning');
    showToast('Đã từ chối và gửi yêu cầu điều chỉnh lại!');
  };

  // Phase 2: Workflow Extensions (Assign, Accept, Feedback, Lock, Revise, Validate)
  const validateKpiWeight = (items) => {
    if (!items || items.length === 0) {
      return { isValid: false, totalWeight: 0, difference: 100, message: 'Danh sách KPI chưa có chỉ tiêu nào.' };
    }
    const rawSum = items.reduce((sum, it) => sum + (Number(it.weight) || 0), 0);
    const roundedSum = Math.round(rawSum * 10) / 10;
    const diff = Math.round((100 - roundedSum) * 10) / 10;
    const isValid = Math.abs(diff) <= 0.05;
    return {
      isValid,
      totalWeight: roundedSum,
      difference: diff,
      message: isValid
        ? 'Tổng trọng số đạt chuẩn 100%.'
        : diff > 0
        ? `Tổng trọng số là ${roundedSum}%, còn thiếu ${diff}% để đạt 100%.`
        : `Tổng trọng số là ${roundedSum}%, vượt quá ${Math.abs(diff)}% so với 100%.`,
    };
  };

  const assignKpiPlan = (planId, assignedById = currentUser.id) => {
    setKpiPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            status: 'ASSIGNED',
            statusName: 'Quản lý đã giao',
            assignedDate: new Date().toISOString().split('T')[0],
            assignedById,
          };
        }
        return p;
      })
    );
    logAudit('ASSIGN_KPI', 'Module 2: Giao KPI', `Quản lý giao chỉ tiêu KPI cho bảng ID: ${planId}`, 'DRAFT', 'ASSIGNED');
    addNotification('KPI mới được giao', 'Bạn vừa nhận được bảng giao chỉ tiêu KPI kỳ mới cần xác nhận.', 'INFO', 'planning');
    showToast('Đã giao chỉ tiêu KPI thành công!');
  };

  const acceptKpiPlan = (planId) => {
    setKpiPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            status: 'ACCEPTED',
            statusName: 'Nhân viên đã xác nhận',
            acceptedDate: new Date().toISOString().split('T')[0],
          };
        }
        return p;
      })
    );
    logAudit('ACCEPT_KPI', 'Module 2: Xác nhận KPI', `Nhân viên xác nhận đồng thuận bảng KPI ID: ${planId}`, 'ASSIGNED', 'ACCEPTED');
    addNotification('Nhân viên đã xác nhận KPI', 'Cán bộ đã đồng thuận tiếp nhận toàn bộ chỉ tiêu KPI.', 'SUCCESS', 'planning');
    showToast('Đã xác nhận cam kết thực hiện chỉ tiêu KPI!');
  };

  const feedbackKpiPlan = (planId, feedbackText) => {
    setKpiPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            status: 'FEEDBACK_REQUESTED',
            statusName: 'Đề nghị điều chỉnh',
            feedbackText,
          };
        }
        return p;
      })
    );
    logAudit('FEEDBACK_KPI', 'Module 2: Đề nghị điều chỉnh', `Nhân viên gửi phản hồi bảng KPI ID: ${planId}: ${feedbackText}`, 'ASSIGNED', 'FEEDBACK_REQUESTED');
    addNotification('Đề nghị điều chỉnh KPI', `Nhân viên có ý kiến: "${feedbackText}"`, 'WARNING', 'planning');
    showToast('Đã gửi phản hồi đề nghị điều chỉnh đến Quản lý!');
  };

  const lockKpiPlan = (planId, reason = 'Khóa theo quy chế định kỳ') => {
    setKpiPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            status: 'LOCKED',
            statusName: 'Đã khóa chỉ tiêu',
            lockedDate: new Date().toISOString().split('T')[0],
            lockReason: reason,
          };
        }
        return p;
      })
    );
    logAudit('LOCK_KPI', 'Module 2: Khóa KPI', `Khóa bảng chỉ tiêu KPI ID: ${planId}. Lý do: ${reason}`);
    showToast(`Đã khóa bảng chỉ tiêu KPI!`);
  };

  const reviseKpiPlan = (planId, revisionReason, newItems) => {
    if (!revisionReason || !revisionReason.trim()) {
      showToast('Lý do điều chỉnh giữa kỳ là BẮT BUỘC theo quy định kiểm toán!', 'error');
      return false;
    }
    const weightCheck = validateKpiWeight(newItems);
    if (!weightCheck.isValid) {
      showToast(weightCheck.message, 'error');
      return false;
    }

    setKpiPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          const currentVersion = p.version || 1;
          const nextVersion = currentVersion + 1;
          const historyEntry = {
            version: currentVersion,
            reason: revisionReason,
            changedBy: currentUser.name,
            changedDate: new Date().toLocaleString('vi-VN'),
            snapshotItems: JSON.parse(JSON.stringify(p.items || [])),
            totalWeight: p.totalWeight,
          };

          return {
            ...p,
            version: nextVersion,
            status: 'ASSIGNED',
            statusName: `Đã điều chỉnh (v${nextVersion}) - Chờ duyệt lại`,
            items: newItems,
            totalWeight: weightCheck.totalWeight,
            revisions: [historyEntry, ...(p.revisions || [])],
          };
        }
        return p;
      })
    );
    logAudit('REVISE_KPI', 'Module 2: Điều chỉnh giữa kỳ', `Điều chỉnh giữa kỳ KPI bảng ID: ${planId}. Lý do: ${revisionReason}`);
    addNotification('KPI đã được điều chỉnh giữa kỳ', `Bảng chỉ tiêu được cập nhật với lý do: "${revisionReason}".`, 'INFO', 'planning');
    showToast(`Đã lưu phiên bản điều chỉnh giữa kỳ thành công!`);
    return true;
  };

  const importKpiBatch = (rows, skipErrors = false) => {
    const errors = [];
    const validRows = [];
    const batchCodes = new Set();

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      let hasError = false;

      // 1. Mã KPI
      if (!row.code || !row.code.trim()) {
        errors.push({ rowNumber: rowNum, column: 'Mã KPI', value: row.code || '(Trống)', message: 'Mã chỉ tiêu không được để trống' });
        hasError = true;
      } else {
        const cUpper = row.code.trim().toUpperCase();
        if (batchCodes.has(cUpper)) {
          errors.push({ rowNumber: rowNum, column: 'Mã KPI', value: row.code, message: `Mã chỉ tiêu '${row.code}' bị trùng lặp trong file` });
          hasError = true;
        } else {
          batchCodes.add(cUpper);
        }
      }

      // 2. Tên KPI
      if (!row.name || !row.name.trim()) {
        errors.push({ rowNumber: rowNum, column: 'Tên chỉ tiêu', value: row.name || '(Trống)', message: 'Tên chỉ tiêu không được để trống' });
        hasError = true;
      }

      // 3. Đơn vị tính
      if (!row.unit || !row.unit.trim()) {
        errors.push({ rowNumber: rowNum, column: 'Đơn vị tính', value: row.unit || '(Trống)', message: 'Đơn vị tính không được để trống' });
        hasError = true;
      }

      // 4. Trọng số
      const w = Number(row.weight);
      if (isNaN(w) || w <= 0 || w > 100) {
        errors.push({ rowNumber: rowNum, column: 'Trọng số (%)', value: row.weight, message: 'Trọng số phải là số lớn hơn 0 và <= 100' });
        hasError = true;
      }

      // 5. Mục tiêu
      const tgt = Number(row.target ?? row.targetValue);
      if (isNaN(tgt)) {
        errors.push({ rowNumber: rowNum, column: 'Chỉ tiêu mục tiêu', value: row.target ?? row.targetValue, message: 'Chỉ tiêu mục tiêu phải là số hợp lệ' });
        hasError = true;
      }

      if (!hasError) {
        validRows.push({
          id: `lib-imp-${Date.now()}-${index}`,
          code: row.code.trim().toUpperCase(),
          name: row.name.trim(),
          category: row.category || 'Quy trình nội bộ',
          unit: row.unit.trim(),
          defaultTarget: tgt,
          defaultWeight: w,
          formulaType: row.formulaType || 'PERCENT',
          scoringMethod: row.scoringMethod || 'LINEAR',
          targetDirection: row.targetDirection || 'MAX',
          minThreshold: Number(row.minThreshold) || (tgt * 0.8),
          maxThreshold: Number(row.maxThreshold) || (tgt * 1.2),
          description: row.description || `Chỉ tiêu nhập từ file Excel dòng ${rowNum}`,
          guidance: row.guidance || 'Nhập số liệu thực hiện định kỳ',
          apiSyncable: false,
          dataSource: 'Nhập thủ công',
        });
      }
    });

    let importedCount = 0;
    if (validRows.length > 0 && (skipErrors || errors.length === 0)) {
      setKpiLibrary((prev) => [...validRows, ...prev]);
      importedCount = validRows.length;
      logAudit('IMPORT_EXCEL', 'Module 2: Thư viện KPI', `Import thành công ${importedCount} chỉ tiêu KPI từ file Excel`);
      showToast(`Đã import thành công ${importedCount} chỉ tiêu KPI vào thư viện!`);
    }

    return {
      success: errors.length === 0 || (skipErrors && importedCount > 0),
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errors.length,
      importedCount,
      errors,
      validRows,
    };
  };

  // Phase 2.6: CRUD KpiTask & Deadline Management
  const updateKpiTask = (taskId, updates) => {
    setKpiTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    logAudit('UPDATE_KPI_TASK', 'Module 2: Quản lý KPI', `Cập nhật thông tin nhiệm vụ ID: ${taskId}`);
    showToast('Đã cập nhật chỉ tiêu công việc thành công!');
    return true;
  };

  const changeTaskDueDate = (taskId, newDueDate, reason) => {
    const task = kpiTasks.find((t) => t.id === taskId);
    if (!task) return false;
    const oldDueDate = task.dueDate;
    const historyEntry = {
      id: `hist-${Date.now()}`,
      oldDueDate,
      newDueDate,
      reason: reason || 'Gia hạn theo yêu cầu điều hành',
      changedBy: currentUser?.id || 'usr-01',
      changedByName: currentUser?.name || 'Lãnh đạo',
      changedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setKpiTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const days = Math.round(
          (new Date(newDueDate + 'T23:59:59').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          ...t,
          dueDate: newDueDate,
          daysLeft: days,
          status: t.status === 'COMPLETED' ? 'COMPLETED' : days < 0 ? 'OVERDUE' : 'IN_PROGRESS',
          dueDateHistory: [historyEntry, ...(t.dueDateHistory || [])],
        };
      })
    );

    logAudit(
      'EXTEND_TASK_DEADLINE',
      'Module 2: Quản lý KPI',
      `Gia hạn nhiệm vụ "${task.name}" từ ${oldDueDate} sang ${newDueDate}. Lý do: ${reason}`
    );
    showToast(`Đã cập nhật hạn chót mới: ${newDueDate}`);
    return true;
  };

  const deleteKpiTask = (taskId, isHardDelete = false) => {
    const task = kpiTasks.find((t) => t.id === taskId);
    if (!task) return false;

    if (isHardDelete) {
      setKpiTasks((prev) => prev.filter((t) => t.id !== taskId));
      logAudit('HARD_DELETE_TASK', 'Module 2: Quản lý KPI', `Xóa vĩnh viễn nhiệm vụ ${task.name} (${task.code})`);
      showToast('Đã xóa vĩnh viễn nhiệm vụ khỏi hệ thống!');
    } else {
      setKpiTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, deletedAt: new Date().toISOString(), status: 'CANCELLED' }
            : t
        )
      );
      logAudit('SOFT_DELETE_TASK', 'Module 2: Quản lý KPI', `Xóa mềm nhiệm vụ ${task.name} (${task.code})`);
      showToast('Đã chuyển nhiệm vụ vào thùng rác (xóa mềm)!');
    }
    return true;
  };

  // 7. Tracking & Execution Actions (Check-in & Evidence)
  const addCheckin = (planId, itemId, checkinData) => {
    setKpiPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const updatedItems = p.items.map((item) => {
          if (item.id !== itemId) return item;
          const newActual = Number(checkinData.actualValue);
          // calculate progress percentage
          let progress = 0;
          if (item.targetDirection === 'MIN') {
            progress = item.target > 0 ? Math.round((item.target / (newActual || 1)) * 100) : 100;
          } else {
            progress = item.target > 0 ? Math.round((newActual / item.target) * 100) : 100;
          }

          const newCheckinItem = {
            id: `chk-${Date.now()}`,
            date: checkinData.date || new Date().toISOString().split('T')[0],
            actualValue: newActual,
            note: checkinData.note,
            evidenceName: checkinData.evidenceName || null,
            evidenceUrl: checkinData.evidenceUrl || null,
          };

          return {
            ...item,
            actual: newActual,
            progressPercent: progress,
            checkins: [newCheckinItem, ...(item.checkins || [])],
          };
        });
        return { ...p, items: updatedItems };
      })
    );

    logAudit('CHECKIN_PROGRESS', 'Module 3: Theo dõi Tiến độ', `Check-in chỉ tiêu: Giá trị mới = ${checkinData.actualValue}`);
    showToast('Đã cập nhật kết quả thực hiện!');
  };

  const addEvidence = (planId, itemId, evidenceData) => {
    setKpiPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const updatedItems = p.items.map((item) => {
          if (item.id !== itemId) return item;
          const newEvi = {
            id: `evi-${Date.now()}`,
            fileName: evidenceData.fileName || 'MinhChung_DinhKem.pdf',
            fileSize: evidenceData.fileSize || '1.8 MB',
            uploadDate: new Date().toLocaleString('vi-VN'),
            fileType: evidenceData.fileType || 'PDF',
            verified: true,
            description: evidenceData.description || 'Tài liệu báo cáo chứng minh kết quả công tác',
            fileUrl: evidenceData.fileUrl || '#',
          };
          return {
            ...item,
            evidences: [newEvi, ...(item.evidences || [])],
          };
        });
        return { ...p, items: updatedItems };
      })
    );

    logAudit('UPLOAD_EVIDENCE', 'Module 3: Minh chứng', `Tải lên minh chứng: ${evidenceData.fileName}`);
    showToast('Đã tải lên và lưu minh chứng thành công!');
  };

  const deleteEvidence = (planId, itemId, evidenceId) => {
    setKpiPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const updatedItems = p.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            evidences: (item.evidences || []).filter((e) => e.id !== evidenceId),
          };
        });
        return { ...p, items: updatedItems };
      })
    );
    logAudit('DELETE_EVIDENCE', 'Module 3: Minh chứng', `Xóa minh chứng ID: ${evidenceId}`);
    showToast('Đã gỡ bỏ minh chứng!');
  };

  // 8. API Integration Simulator (CRM, Timesheet, Jira/OneStop)
  const syncAPIData = (apiType) => {
    let syncedCount = 0;
    setKpiPlans((prev) =>
      prev.map((plan) => {
        const updatedItems = plan.items.map((item) => {
          if (item.apiSource === apiType || (!item.apiSource && apiType === 'all')) {
            syncedCount++;
            let simulatedActual = item.actual;
            if (item.unit === '%') {
              simulatedActual = Math.min(100, Math.floor(Math.random() * 8) + 93);
            } else if (item.unit === 'ms') {
              simulatedActual = Math.floor(Math.random() * 30) + 175;
            } else if (item.unit === 'triệu VNĐ') {
              simulatedActual = Math.floor(Math.random() * 200) + 1550;
            } else {
              simulatedActual = item.target + Math.floor(Math.random() * 3);
            }

            let progress = 0;
            if (item.targetDirection === 'MIN') {
              progress = item.target > 0 ? Math.round((item.target / (simulatedActual || 1)) * 100) : 100;
            } else {
              progress = item.target > 0 ? Math.round((simulatedActual / item.target) * 100) : 100;
            }

            const autoCheckin = {
              id: `chk-api-${Date.now()}-${Math.random()}`,
              date: new Date().toISOString().split('T')[0],
              actualValue: simulatedActual,
              note: `[Đồng bộ tự động] Lấy dữ liệu lúc ${new Date().toLocaleTimeString('vi-VN')}`,
              evidenceName: `API_Sync_${apiType.toUpperCase()}_Log.json`,
              evidenceUrl: '#',
            };

            return {
              ...item,
              actual: simulatedActual,
              progressPercent: progress,
              checkins: [autoCheckin, ...(item.checkins || [])],
            };
          }
          return item;
        });
        return { ...plan, items: updatedItems };
      })
    );

    const apiNameMap = {
      jira: 'Hệ thống quản lý công việc',
      timesheet: 'Máy chấm công sinh trắc học',
      crm: 'Hệ thống CRM Doanh thu & Hợp đồng',
      all: 'Tất cả nguồn dữ liệu kết nối',
    };

    logAudit('API_SYNC', 'Module 3: Tích hợp API', `Đồng bộ dữ liệu tự động từ ${apiNameMap[apiType] || apiType}`);
    addNotification('Đồng bộ dữ liệu tự động thành công', `Hệ thống vừa đồng bộ số liệu thực tế từ ${apiNameMap[apiType] || apiType}.`, 'SUCCESS', 'tracking');
    showToast(`Đã đồng bộ dữ liệu tự động từ ${apiNameMap[apiType] || apiType}!`);
  };

  // 9. Evaluation & Scoring Engine
  // Công thức:
  // Item Score = Math.min(Weight * 1.2, Math.round(((Actual / Target) * Weight) * 10) / 10)
  // Total Score = Sum of Item Scores (80%) + 360 Peer Score (20%)
  // Rank: >= 90: Xuất sắc, 80-89.9: Tốt, 65-79.9: Hoàn thành, < 65: Không hoàn thành
  const calculateRank = (score) => {
    if (score >= 90) return { rank: 'XUẤT SẮC', badgeClass: 'badge-gold', title: 'Hoàn thành xuất sắc nhiệm vụ (Loại A)' };
    if (score >= 80) return { rank: 'TỐT', badgeClass: 'badge-green', title: 'Hoàn thành tốt nhiệm vụ (Loại B)' };
    if (score >= 65) return { rank: 'HOÀN THÀNH', badgeClass: 'badge-blue', title: 'Hoàn thành nhiệm vụ (Loại C)' };
    return { rank: 'KHÔNG HOÀN THÀNH', badgeClass: 'badge-red', title: 'Không hoàn thành nhiệm vụ (Loại D)' };
  };

  const saveEvaluation = ({ planId, selfScores, managerScores, managerFeedback, isFinalize = false }) => {
    setKpiPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;

        let totalSelf = 0;
        let totalManager = 0;

        const updatedItems = plan.items.map((item) => {
          const selfScore = selfScores && selfScores[item.id] !== undefined ? Number(selfScores[item.id]) : item.selfScore;
          const managerScore = managerScores && managerScores[item.id] !== undefined ? Number(managerScores[item.id]) : item.managerScore;

          totalSelf += selfScore;
          totalManager += managerScore;

          return {
            ...item,
            selfScore,
            managerScore,
            finalScore: managerScore || selfScore,
          };
        });

        const peerAvg = plan.peerScoreAvg || 90;
        // Điểm đánh giá chung = 80% điểm KPI quản lý chấm + 20% điểm đồng nghiệp 360
        const calculatedFinal = Math.round(((totalManager * 0.8) + (peerAvg * 0.2)) * 10) / 10;
        const rankInfo = calculateRank(calculatedFinal);

        return {
          ...plan,
          items: updatedItems,
          overallSelfScore: Math.round(totalSelf * 10) / 10,
          overallManagerScore: Math.round(totalManager * 10) / 10,
          finalScore: calculatedFinal,
          finalRank: rankInfo.rank,
          managerNote: managerFeedback || plan.managerNote,
          evaluationStatus: isFinalize ? 'EVALUATED' : 'SELF_EVALUATED',
        };
      })
    );

    logAudit('SAVE_EVALUATION', 'Module 4: Đánh giá & Chấm điểm', `Lưu kết quả đánh giá cho phiếu KPI ID: ${planId}`);
    if (isFinalize) {
      addNotification('Kết quả đánh giá KPI đã ban hành', `Phiếu đánh giá KPI đã được Quản lý chốt điểm chính thức.`, 'SUCCESS', 'evaluation');
      showToast('Đã chốt điểm và ban hành kết quả đánh giá xếp loại!');
    } else {
      showToast('Đã lưu kết quả đánh giá!');
    }
  };

  const confirmCheckin = (planId, itemId, checkinId, status, managerComment = '') => {
    setKpiPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const updatedItems = p.items.map((it) => {
          if (it.id !== itemId) return it;
          const updatedCheckins = (it.checkins || []).map((chk) => {
            if (chk.id === checkinId) {
              return {
                ...chk,
                verificationStatus: status, // 'CONFIRMED' | 'NEEDS_REVISION' | 'REJECTED'
                verifiedBy: currentUser.name,
                verifiedAt: new Date().toLocaleDateString('vi-VN'),
                managerComment: managerComment || (status === 'CONFIRMED' ? 'Quản lý đã duyệt số liệu.' : 'Cần bổ sung thêm minh chứng kết quả.'),
              };
            }
            return chk;
          });
          return { ...it, checkins: updatedCheckins };
        });
        return { ...p, items: updatedItems };
      })
    );
    logAudit('CONFIRM_CHECKIN', 'Module 3: Xác nhận Số liệu', `Quản lý xác nhận check-in ID: ${checkinId} trạng thái: ${status}`);
    showToast(status === 'CONFIRMED' ? 'Đã xác nhận kết quả thực hiện thành công!' : 'Đã gửi yêu cầu bổ sung minh chứng!');
  };

  const add1on1Meeting = (meetingData) => {
    const newMeeting = {
      id: `meet-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
      managerId: currentUser.id,
      managerName: currentUser.name,
      ...meetingData,
    };
    setMeetings1on1((prev) => [newMeeting, ...prev]);
    logAudit('SCHEDULE_1ON1', 'Module 3: Check-in 1:1', `Lưu biên bản trao đổi 1:1 với cán bộ: ${meetingData.employeeName}`);
    addNotification('Biên bản trao đổi 1:1 mới', `Quản lý vừa cập nhật nội dung trao đổi và hành động tiếp theo kỳ này.`, 'INFO', 'my-kpi');
    showToast('Đã lưu biên bản trao đổi 1:1!');
  };

  const runBackgroundSchedulerJob = () => {
    let atRiskCount = 0;
    let overdueCount = 0;
    let totalScanned = 0;

    kpiPlans.forEach((plan) => {
      plan.items?.forEach((item) => {
        totalScanned++;
        if (item.progressPercent < 70) {
          atRiskCount++;
          addNotification(
            'Cảnh báo KPI có nguy cơ chậm tiến độ',
            `Chỉ tiêu "${item.name}" của cán bộ ${plan.employeeName} mới đạt ${item.progressPercent}% (dưới ngưỡng 70%).`,
            'WARNING',
            'tracking'
          );
        }
      });
    });

    const logEntry = {
      id: `job-${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      scannedKpisCount: totalScanned,
      atRiskCount,
      overdueCount: 2,
      notificationsCreated: atRiskCount,
      emailsSimulated: atRiskCount,
      status: 'SUCCESS',
      message: `Đã quét ${totalScanned} chỉ tiêu toàn cơ quan. Phát hiện ${atRiskCount} chỉ tiêu có nguy cơ không đạt, tự động phát tán email & thông báo in-app.`,
    };

    setSchedulerJobLogs((prev) => [logEntry, ...prev]);
    logAudit('RUN_SCHEDULER_JOB', 'Hệ thống Job Nền', `Chạy quét cảnh báo tiến độ tự động: ${atRiskCount} cảnh báo.`);
    showToast(`Đã quét ${totalScanned} chỉ tiêu, gửi ${atRiskCount} cảnh báo!`, 'success');
    return logEntry;
  };

  // Phase 4: Evaluation State Machine, Disciplinary Exclusion & Quotas
  const calculateRankWithExclusions = (score, userId) => {
    const discipline = disciplineRecords.find((d) => d.userId === userId);
    const baseRank = calculateRank(score);

    if (discipline) {
      if (discipline.maxAllowedRank === 'HOÀN THÀNH' && (baseRank.rank === 'XUẤT SẮC' || baseRank.rank === 'TỐT')) {
        return {
          rank: 'HOÀN THÀNH',
          badgeClass: 'badge-blue',
          title: `Hoàn thành nhiệm vụ (Hạ bậc do QĐ kỷ luật số ${discipline.decisionNumber})`,
          isDisciplineRestricted: true,
          disciplineReason: discipline.reason,
        };
      }
      if (discipline.maxAllowedRank === 'KHÔNG HOÀN THÀNH') {
        return {
          rank: 'KHÔNG HOÀN THÀNH',
          badgeClass: 'badge-red',
          title: `Không hoàn thành nhiệm vụ (Do QĐ kỷ luật số ${discipline.decisionNumber})`,
          isDisciplineRestricted: true,
          disciplineReason: discipline.reason,
        };
      }
    }
    return baseRank;
  };

  const saveCollectiveMeeting = (meetingData) => {
    const newRecord = {
      id: `cm-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED',
      ...meetingData,
    };
    setCollectiveMeetings((prev) => [newRecord, ...prev]);
    logAudit('COLLECTIVE_MEETING', 'Module 4: Hội nghị tập thể', `Lưu biên bản hội nghị lấy ý kiến tập thể cho cán bộ ${meetingData.employeeName}`);
    showToast('Đã lưu biên bản và kết quả biểu quyết của Hội nghị tập thể!');
  };

  const adjustScoreAndRank = ({ planId, adjustedScore, adjustedRank, reason }) => {
    if (!reason || !reason.trim()) {
      showToast('Lý do điều chỉnh xếp loại là BẮT BUỘC theo quy định kiểm toán!', 'error');
      return false;
    }
    setKpiPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          originalScore: plan.originalScore || plan.finalScore,
          originalRank: plan.originalRank || plan.finalRank,
          finalScore: Number(adjustedScore),
          finalRank: adjustedRank,
          isAdjusted: true,
          adjustReason: reason,
          adjustedBy: currentUser.name,
          adjustedAt: new Date().toLocaleString('vi-VN'),
        };
      })
    );
    logAudit('ADJUST_SCORE', 'Module 4: Hiệu chỉnh điểm', `Người đứng đầu điều chỉnh phiếu ${planId}: Sang ${adjustedScore} (${adjustedRank}). Lý do: ${reason}`);
    showToast(`Đã lưu kết quả điều chỉnh xếp loại (${adjustedRank}) kèm lý do giải trình!`);
    return true;
  };

  const batchApproveEvaluations = (planIds, note = 'Đồng ý phê duyệt hàng loạt.') => {
    setKpiPlans((prev) =>
      prev.map((p) => {
        if (planIds.includes(p.id)) {
          return {
            ...p,
            evaluationStatus: 'EVALUATED',
            approvedDate: new Date().toISOString().split('T')[0],
            managerNote: p.managerNote ? `${p.managerNote} | [Duyệt hàng loạt]: ${note}` : `[Duyệt hàng loạt]: ${note}`,
          };
        }
        return p;
      })
    );
    logAudit('BATCH_APPROVE_EVALUATION', 'Module 4: Duyệt hàng loạt', `Phê duyệt cùng lúc ${planIds.length} hồ sơ đánh giá`);
    showToast(`Đã phê duyệt hàng loạt thành công ${planIds.length} hồ sơ đánh giá!`);
  };

  // Authentication: Login
  const login = (userIdOrEmail, password = '', otp = '') => {
    const foundUser = users.find(
      (u) =>
        u.id === userIdOrEmail ||
        u.email.toLowerCase() === String(userIdOrEmail).toLowerCase() ||
        u.name.toLowerCase() === String(userIdOrEmail).toLowerCase()
    );

    if (!foundUser) {
      showToast('Tài khoản hoặc email không tồn tại trong hệ thống!', 'error');
      return { success: false, message: 'Tài khoản không tồn tại' };
    }

    if (foundUser.isTwoFactorEnabled && otp && otp !== '123456') {
      showToast('Mã OTP 2FA không chính xác (Thử mã: 123456)!', 'error');
      return { success: false, message: 'Mã OTP không đúng' };
    }

    setCurrentUserId(foundUser.id);
    setIsAuthenticated(true);
    logAudit('LOGIN', 'Hệ thống', `Người dùng ${foundUser.name} (${getRoleLabel(foundUser.role)}) đăng nhập thành công`);
    showToast(`Xin chào ${foundUser.name}, đăng nhập thành công!`, 'success');
    return { success: true, user: foundUser };
  };

  // Authentication: Logout
  const logout = () => {
    logAudit('LOGOUT', 'Hệ thống', `Người dùng ${currentUser?.name || ''} đã đăng xuất khỏi phiên làm việc`);
    setIsAuthenticated(false);
    showToast('Đã đăng xuất phiên làm việc an toàn!');
  };

  // Reset to initial demo data
  const resetToDefaultData = () => {
    setDepartments(INITIAL_DEPARTMENTS);
    setPositions(INITIAL_POSITIONS);
    setUsers(INITIAL_USERS);
    setCurrentUserId('usr-04');
    setIsAuthenticated(true);
    setPeriods(INITIAL_PERIODS);
    setActivePeriodId('period-2026-q4');
    setKpiLibrary(INITIAL_KPI_LIBRARY);
    setCascadingGoals(INITIAL_CASCADING_GOALS);
    setKpiPlans(INITIAL_KPI_PLANS);
    setKpiTasks(INITIAL_KPI_TASKS);
    setPeerReviews(INITIAL_PEER_REVIEWS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setRolesConfig(INITIAL_ROLES);
    setActiveRoleState('EMPLOYEE');

    // clear storage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    });

    logAudit('RESET_SYSTEM_DATA', 'Module 6: Hệ thống', 'Khôi phục toàn bộ cơ sở dữ liệu mẫu ban đầu');
    showToast('Đã khôi phục dữ liệu mẫu ban đầu thành công!');
  };

  // 1. Chuyển đổi vai trò làm việc đang chọn (Active Role Switcher)
  const switchActiveRole = (newRole) => {
    const userRoles = currentUser.roles || [currentUser.role || 'EMPLOYEE'];
    if (!userRoles.includes(newRole)) {
      showToast(`Tài khoản của bạn không được gán vai trò: ${getRoleLabel(newRole)}`, 'error');
      return;
    }
    setActiveRoleState(newRole);
    logAudit('SWITCH_ROLE', 'Phân quyền RBAC', `Người dùng ${currentUser.name} chuyển vai trò làm việc sang "${newRole}"`);
    showToast(`Đã chuyển vai trò: ${getRoleLabel(newRole)}`, 'info');
  };

  // 2. Kiểm tra quyền hạn "resource:action" của vai trò đang làm việc
  const hasPermission = (permissionCode) => {
    const role = rolesConfig.find((r) => r.code === activeRole);
    if (!role || !role.isActive) return false;
    return role.permissions?.includes(permissionCode) ?? false;
  };

  // 3. Cập nhật ma trận quyền cho vai trò
  const updateRolePermissions = (roleCode, newPermissions) => {
    setRolesConfig((prev) =>
      prev.map((r) => (r.code === roleCode ? { ...r, permissions: newPermissions } : r))
    );
    logAudit('UPDATE_RBAC_MATRIX', 'Quản trị phân quyền', `Cập nhật danh sách quyền cho vai trò "${roleCode}"`);
    showToast(`Đã cập nhật quyền cho vai trò ${getRoleLabel(roleCode)}!`);
  };

  // 4. Sao chép vai trò (Clone Role)
  const cloneRole = (sourceRoleCode, newRoleCode, newRoleName, description = '') => {
    const source = rolesConfig.find((r) => r.code === sourceRoleCode);
    if (!source) {
      showToast(`Không tìm thấy vai trò nguồn "${sourceRoleCode}"!`, 'error');
      return false;
    }
    if (rolesConfig.some((r) => r.code === newRoleCode)) {
      showToast(`Mã vai trò "${newRoleCode}" đã tồn tại trong hệ thống!`, 'error');
      return false;
    }

    const cloned = {
      code: newRoleCode,
      name: newRoleName,
      description: description || `Sao chép từ vai trò ${source.name}`,
      dataScope: source.dataScope,
      isActive: true,
      isSystem: false,
      permissions: [...source.permissions],
    };

    setRolesConfig((prev) => [...prev, cloned]);
    logAudit('CLONE_ROLE', 'Quản trị phân quyền', `Sao chép vai trò mới "${newRoleName}" (${newRoleCode}) từ "${sourceRoleCode}"`);
    showToast(`Đã sao chép thành công vai trò mới: ${newRoleName}!`, 'success');
    return true;
  };

  // 5. Bật / Tắt vai trò theo đặc thù tổ chức
  const toggleRoleActive = (roleCode, isActive) => {
    if (roleCode === 'SYSTEM_ADMIN' && !isActive) {
      showToast('Không thể tắt vai trò Quản trị hệ thống!', 'error');
      return;
    }

    setRolesConfig((prev) =>
      prev.map((r) => (r.code === roleCode ? { ...r, isActive } : r))
    );
    logAudit('TOGGLE_ROLE', 'Quản trị phân quyền', `${isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} vai trò "${roleCode}"`);
    showToast(`Đã ${isActive ? 'bật' : 'tắt'} vai trò ${getRoleLabel(roleCode)}!`);
  };

  const resetRolesToDefault = () => {
    setRolesConfig(INITIAL_ROLES);
    localStorage.setItem(`${STORAGE_KEY}_ROLES_CONFIG`, JSON.stringify(INITIAL_ROLES));
    logAudit('RESET_ROLES_DEFAULT', 'Quản trị phân quyền', 'Khôi phục ma trận phân quyền về chuẩn mặc định ban đầu');
    showToast('Đã khôi phục ma trận phân quyền về chuẩn mặc định ban đầu!', 'success');
  };

  // 6. Kiểm tra phạm vi dữ liệu ở frontend (chống truy cập chéo)
  const canAccessData = (target) => {
    const currentRoleConfig = rolesConfig.find((r) => r.code === activeRole) || {};
    const scope = currentRoleConfig.dataScope || currentUser.dataScope || 'SELF';

    if (scope === 'ALL') return true;

    if (scope === 'SELF') {
      const targetUserId = target?.userId || target?.id;
      return targetUserId === currentUser.id;
    }

    if (scope === 'OWN_UNIT') {
      return target?.departmentId === currentUser.departmentId;
    }

    if (scope === 'UNIT_AND_CHILDREN') {
      if (!target?.departmentPath) return true;
      return target.departmentPath.startsWith(currentUser.departmentPath || '');
    }

    if (scope === 'ASSIGNED') {
      const targetId = target?.userId || target?.id;
      return currentUser.assignedTargetIds?.includes(targetId) ?? false;
    }

    return true;
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        // User & Role State & Auth
        currentUser,
        users,
        currentUserId,
        setCurrentUserId,
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        updateUserRole,
        updateUser,
        addUser,
        deleteUser,
        toggle2FA,
        resetPassword,
        forgotPassword,
        importUsersBatch,

        // Phase 1.5: RBAC & Permissions
        rolesConfig,
        permissionsList,
        activeRole,
        setActiveRole: switchActiveRole,
        switchActiveRole,
        hasPermission,
        updateRolePermissions,
        resetRolesToDefault,
        cloneRole,
        toggleRoleActive,
        canAccessData,
        updateUser,
        addUser,
        deleteUser,
        toggle2FA,
        resetPassword,
        forgotPassword,
        importUsersBatch,

        // Period State
        periods,
        activePeriod,
        activePeriodId,
        setActivePeriodId,
        addPeriod,
        updatePeriodStatus,

        // Module 1: Org & Position
        departments,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        positions,
        addPosition,
        updatePosition,

        // Module 2: KPI Library & Planning
        kpiLibrary,
        addKpiToLibrary,
        updateKpiInLibrary,
        deleteKpiFromLibrary,
        kpiTemplates,
        cascadingGoals,
        kpiPlans,
        kpiTasks,
        setKpiTasks,
        updateKpiTask,
        changeTaskDueDate,
        deleteKpiTask,
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

        // Module 3: Tracking & Execution
        addCheckin,
        confirmCheckin,
        addEvidence,
        deleteEvidence,
        syncAPIData,
        add1on1Meeting,
        meetings1on1,
        runBackgroundSchedulerJob,
        schedulerJobLogs,

        // Module 4: Evaluation & Scoring
        saveEvaluation,
        calculateRank,
        calculateRankWithExclusions,
        saveCollectiveMeeting,
        collectiveMeetings,
        adjustScoreAndRank,
        batchApproveEvaluations,
        disciplineRecords,
        quotaPolicy,
        setQuotaPolicy,

        // Module 6: Non-functional & Utilities
        auditLogs,
        logAudit,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        addNotification,
        resetToDefaultData,

        // UI & Navigation
        activeModule,
        setActiveModule,
        darkMode,
        toggleDarkMode,
        systemOperatingMode,
        setSystemOperatingMode,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        quickSearchOpen,
        setQuickSearchOpen,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
