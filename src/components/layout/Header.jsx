import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Shield,
  UserCheck,
  User,
  Check,
  LogOut,
  RotateCcw,
  Key,
  Search,
  Wrench,
  Building,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { SegmentedControl } from '../ui/SegmentedControl';

export const Header = () => {
  const {
    currentUser,
    users,
    setCurrentUserId,
    activePeriod,
    periods,
    setActivePeriodId,
    darkMode,
    toggleDarkMode,
    resetToDefaultData,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    activeModule,
    setActiveModule,
    toggle2FA,
    resetPassword,
    forgotPassword,
    setMobileSidebarOpen,
    setQuickSearchOpen,
    systemOperatingMode,
    setSystemOperatingMode,
    showToast,
    logout,
    activeRole,
    switchActiveRole,
    rolesConfig,
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showDevToolsDropdown, setShowDevToolsDropdown] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [show2FaModal, setShow2FaModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const devToolsRef = useRef(null);
  const roleSwitcherRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
      if (devToolsRef.current && !devToolsRef.current.contains(event.target)) {
        setShowDevToolsDropdown(false);
      }
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(event.target)) {
        setShowRoleSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Map active module to breadcrumb and page title
  const moduleInfoMap = {
    dashboards: { title: 'Bảng điều khiển Tổng quan', category: 'Tổng quan' },
    'org-system': { title: systemOperatingMode === 'GOVERNMENT' ? 'Cơ cấu Tổ chức & Cán bộ' : 'Sơ đồ Tổ chức & Nhân sự', category: 'Tổ chức' },
    library: { title: systemOperatingMode === 'GOVERNMENT' ? 'Thư viện Tiêu chí & Giao KPI' : 'Thư viện KPI & Lập kế hoạch', category: 'Mục tiêu' },
    'my-kpi': { title: 'Phiếu KPI cá nhân của tôi', category: 'Thực hiện' },
    'team-kpi': { title: systemOperatingMode === 'GOVERNMENT' ? 'Hội đồng & Lãnh đạo Đánh giá' : 'Đánh giá & Duyệt Nhóm (360°)', category: 'Đánh giá' },
    reports: { title: systemOperatingMode === 'GOVERNMENT' ? 'Báo cáo & Xếp loại (NĐ 90/48)' : 'Báo cáo Hiệu suất & Lương thưởng', category: 'Báo cáo' },
    'non-functional': { title: 'Hệ thống, SSO & Nhật ký Kiểm toán', category: 'Hệ thống' },
    'ui-kit': { title: 'UI Kit & Design System Tokens', category: 'Công cụ Dev' },
  };

  const currentModuleInfo = moduleInfoMap[activeModule] || { title: 'Hệ thống KPI', category: 'Hệ thống' };

  // Sample quick accounts for all 10 standard roles
  const sampleAccounts = [
    { id: 'usr-01', role: 'SYSTEM_ADMIN', roleLabel: 'Quản trị viên HT', name: 'Nguyễn Văn An', title: 'System Admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr-06', role: 'EXECUTIVE', roleLabel: 'Người đứng đầu', name: 'Đặng Quốc Bảo', title: 'Thứ trưởng / TGĐ', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr-07', role: 'UNIT_HEAD', roleLabel: 'Trưởng đơn vị', name: 'Hoàng Minh Tuấn', title: 'Cục trưởng / GĐ Khối', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr-02', role: 'LINE_MANAGER', roleLabel: 'Quản lý trực tiếp', name: 'Lê Hoàng Minh', title: 'Trưởng phòng', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr-03', role: 'HR_OFFICER', roleLabel: 'Nhân sự / TCCB', name: 'Trần Thị Thu Hà', title: 'Vụ TCCB & Thi đua', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr-04', role: 'EMPLOYEE', roleLabel: 'Người được ĐG', name: 'Phạm Đức Thắng', title: 'Chuyên viên / Kỹ sư', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr-08', role: 'COUNCIL_MEMBER', roleLabel: 'Hội đồng Thi đua', name: 'GS. Vũ Đình Trọng', title: 'Chủ tịch HĐ Thi đua', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr-09', role: 'SECRETARY', roleLabel: 'Thư ký Hội nghị', name: 'Nguyễn Bích Ngọc', title: 'Thư ký Văn phòng', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr-10', role: 'AUDITOR', roleLabel: 'Kiểm tra giám sát', name: 'Trần Mạnh Cường', title: 'Thanh tra / Kiểm toán', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr-05', role: 'PEER_REVIEWER', roleLabel: 'Đánh giá 360°', name: 'Vũ Mai Linh', title: 'Đồng nghiệp 360°', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  ];

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <header className="sticky top-0 z-20 w-full h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-2xs">
        {/* Left: Mobile hamburger + Breadcrumb & Page title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden"
            aria-label="Mở thanh điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <span className="truncate">{currentModuleInfo.category}</span>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                {currentModuleInfo.title}
              </span>
            </div>
            {/* Page Title */}
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
              {currentModuleInfo.title}
            </h1>
          </div>
        </div>

        {/* Center/Right: Mode Switch Segmented Control (Yêu cầu Bước 2) */}
        <div className="hidden md:flex items-center">
          <SegmentedControl
            options={[
              {
                value: 'GOVERNMENT',
                label: 'Cơ quan Nhà nước (NĐ 90)',
                icon: Building,
              },
              {
                value: 'ENTERPRISE',
                label: 'Doanh nghiệp (KPI / BSC)',
                icon: Briefcase,
              },
            ]}
            value={systemOperatingMode}
            onChange={(val) => setSystemOperatingMode(val)}
            size="sm"
          />
        </div>

        {/* Right Actions Toolbar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Evaluation Period Selector */}
          <div className="hidden xl:flex items-center gap-2 pl-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={activePeriod?.id}
              onChange={(e) => setActivePeriodId(e.target.value)}
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 border-none rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 cursor-pointer"
              aria-label="Chọn kỳ đánh giá"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search Button (Ctrl+K) */}
          <button
            onClick={() => setQuickSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700/70 rounded-lg border border-slate-200/80 dark:border-slate-700 transition-colors"
            title="Tìm kiếm nhanh (Ctrl+K)"
            aria-label="Tìm kiếm nhanh hệ thống"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tìm kiếm...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
              Ctrl K
            </kbd>
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown((prev) => !prev)}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-hidden"
              title="Thông báo"
              aria-label="Xem thông báo"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse tabular-nums">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    Thông báo hệ thống
                  </div>
                  {unreadNotifs > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                    >
                      Đã đọc tất cả
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Không có thông báo nào
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          if (notif.targetModule) setActiveModule(notif.targetModule);
                          setShowNotifDropdown(false);
                        }}
                        className={`p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          !notif.isRead ? 'bg-primary-50/40 dark:bg-primary-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {notif.title}
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {notif.time}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {notif.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-hidden"
            title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            aria-label="Đổi giao diện Sáng / Tối"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Dev Tools Popover (Yêu cầu Bước 2: Chuyển Reset dữ liệu, Tài khoản mẫu vào menu Công cụ demo) */}
          <div className="relative" ref={devToolsRef}>
            <button
              onClick={() => setShowDevToolsDropdown((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 transition-colors focus:outline-hidden"
              title="Công cụ thử nghiệm & Demo"
              aria-label="Công cụ demo"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Công cụ demo</span>
            </button>

            {showDevToolsDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-3 px-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    <span>Công cụ Demo & Môi trường</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    DEV
                  </span>
                </div>

                {/* Mobile Mode Switcher inside Dev Tools */}
                <div className="block md:hidden space-y-1">
                  <div className="text-[11px] font-medium text-slate-500">Chế độ hoạt động</div>
                  <SegmentedControl
                    options={[
                      { value: 'GOVERNMENT', label: 'Nhà nước (NĐ 90)' },
                      { value: 'ENTERPRISE', label: 'Doanh nghiệp' },
                    ]}
                    value={systemOperatingMode}
                    onChange={(val) => setSystemOperatingMode(val)}
                    size="sm"
                  />
                </div>

                {/* Quick Account Switch */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Chuyển nhanh tài khoản mẫu
                  </div>
                  <div className="space-y-1">
                    {sampleAccounts.map((acc) => {
                      const isCurrent = currentUser?.id === acc.id;
                      const Icon = acc.icon;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => {
                            setCurrentUserId(acc.id);
                            setShowDevToolsDropdown(false);
                            showToast(`Đã chuyển sang vai trò: ${acc.roleLabel} (${acc.name})`);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                            isCurrent
                              ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-100 font-semibold ring-1 ring-primary-300 dark:ring-primary-700'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={acc.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                            <div className="truncate">
                              <div className="truncate">{acc.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{acc.roleLabel}</div>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-primary-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reset Data Button */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu? Tất cả thay đổi demo sẽ được reset.')) {
                        resetToDefaultData();
                        setShowDevToolsDropdown(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-300 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                    <span>Reset toàn bộ dữ liệu mẫu</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Role Switcher */}
          <div className="relative" ref={roleSwitcherRef}>
            <button
              onClick={() => setShowRoleSwitcher((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-primary-500/30 bg-primary-50/70 hover:bg-primary-100/70 dark:bg-primary-950/40 dark:hover:bg-primary-900/40 text-primary-700 dark:text-primary-300 transition-colors text-xs font-medium cursor-pointer"
              title="Đổi vai trò làm việc đang chọn"
            >
              <Shield className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span className="font-semibold">{activeRole}</span>
              <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded-full bg-primary-200/60 dark:bg-primary-800/60 font-mono font-bold text-primary-900 dark:text-primary-100">
                {rolesConfig?.find((r) => r.code === activeRole)?.dataScope || 'SELF'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Vai trò làm việc (Role)</span>
                  <span className="text-[10px] text-primary-500 font-semibold lowercase">đổi tức thì</span>
                </div>
                <div className="py-1 space-y-1 max-h-64 overflow-y-auto">
                  {(currentUser?.roles || [currentUser?.role || 'EMPLOYEE']).map((rCode) => {
                    const rObj = rolesConfig?.find((r) => r.code === rCode);
                    const isSelected = activeRole === rCode;
                    return (
                      <button
                        key={rCode}
                        onClick={() => {
                          switchActiveRole(rCode);
                          setShowRoleSwitcher(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-950/70 text-primary-900 dark:text-primary-100 font-bold ring-1 ring-primary-400'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="truncate">{rObj?.name || rCode}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>Phạm vi:</span>
                            <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                              {rObj?.dataScope || 'SELF'}
                            </span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowUserDropdown((prev) => !prev)}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-hidden"
              aria-label="Menu tài khoản cá nhân"
            >
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-primary-500/20"
              />
              <span className="hidden md:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                {currentUser?.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Dropdown */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Profile Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {currentUser?.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {currentUser?.email}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                      <Shield className="w-3 h-3" />
                      <span>Vai trò: {activeRole}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Scope: {rolesConfig?.find((r) => r.code === activeRole)?.dataScope || 'SELF'}
                    </span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1 space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShow2FaModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Bảo mật & Xác thực 2 lớp (2FA)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowForgotModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <Key className="w-4 h-4 text-slate-500" />
                    <span>Đặt lại mật khẩu</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors text-xs font-medium cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất tài khoản</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2FA Modal */}
      {show2FaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary-600" />
              Bảo mật 2 lớp (2FA)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Trạng thái hiện tại: <strong>{currentUser?.isTwoFactorEnabled ? 'Đang BẬT' : 'Đang TẮT'}</strong>
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShow2FaModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  toggle2FA(currentUser.id);
                  setShow2FaModal(false);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-lg text-white ${
                  currentUser?.isTwoFactorEnabled ? 'bg-rose-600 hover:bg-rose-700' : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {currentUser?.isTwoFactorEnabled ? 'Tắt 2FA' : 'Kích hoạt 2FA ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-primary-600" />
              Đặt lại mật khẩu
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Nhập email để nhận liên kết khôi phục mật khẩu hoặc cấp mới:
            </p>
            <input
              type="email"
              value={forgotEmail || currentUser?.email || ''}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Email cán bộ..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  forgotPassword(forgotEmail || currentUser?.email);
                  setShowForgotModal(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700"
              >
                Gửi liên kết
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
