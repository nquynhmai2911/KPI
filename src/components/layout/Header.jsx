import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Check,
  LogOut,
  RotateCcw,
  Key,
  Search,
  Settings2,
  Building,
  Briefcase,
  CalendarDays,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';
import { getRoleLabel, getScopeLabel } from '../../utils/labels';

const MODULE_TITLES = {
  dashboards: { GOVERNMENT: 'Tổng quan', ENTERPRISE: 'Tổng quan' },
  periods: { GOVERNMENT: 'Kỳ đánh giá', ENTERPRISE: 'Kỳ đánh giá' },
  'org-system': { GOVERNMENT: 'Tổ chức & cán bộ', ENTERPRISE: 'Tổ chức & nhân sự' },
  library: { GOVERNMENT: 'Giao chỉ tiêu KPI', ENTERPRISE: 'Giao chỉ tiêu KPI' },
  'my-kpi': { GOVERNMENT: 'Thực hiện & cập nhật kết quả', ENTERPRISE: 'Thực hiện & cập nhật kết quả' },
  'team-kpi': { GOVERNMENT: 'Đánh giá & xếp loại', ENTERPRISE: 'Đánh giá & xếp loại' },
  reports: { GOVERNMENT: 'Kết quả & báo cáo', ENTERPRISE: 'Kết quả & lương thưởng' },
  'non-functional': { GOVERNMENT: 'Quản trị hệ thống', ENTERPRISE: 'Quản trị hệ thống' },
  'ui-kit': { GOVERNMENT: 'Bộ giao diện mẫu', ENTERPRISE: 'Bộ giao diện mẫu' },
};

const SAMPLE_ACCOUNTS = [
  { id: 'usr-01', role: 'SYSTEM_ADMIN', name: 'Nguyễn Văn An' },
  { id: 'usr-06', role: 'EXECUTIVE', name: 'Đặng Quốc Bảo' },
  { id: 'usr-07', role: 'UNIT_HEAD', name: 'Hoàng Minh Tuấn' },
  { id: 'usr-02', role: 'LINE_MANAGER', name: 'Lê Hoàng Minh' },
  { id: 'usr-03', role: 'HR_OFFICER', name: 'Trần Thị Thu Hà' },
  { id: 'usr-04', role: 'EMPLOYEE', name: 'Phạm Đức Thắng' },
  { id: 'usr-08', role: 'COUNCIL_MEMBER', name: 'GS. Vũ Đình Trọng' },
  { id: 'usr-09', role: 'SECRETARY', name: 'Nguyễn Bích Ngọc' },
  { id: 'usr-10', role: 'AUDITOR', name: 'Trần Mạnh Cường' },
  { id: 'usr-05', role: 'PEER_REVIEWER', name: 'Vũ Mai Linh' },
];

const IconButton = ({ children, active, className = '', ...props }) => (
  <button
    type="button"
    className={`relative w-9 h-9 inline-flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
      active
        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Popover = ({ children, className = '' }) => (
  <div
    className={`absolute right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 ${className}`}
  >
    {children}
  </div>
);

const Modal = ({ title, icon: Icon, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary-600" />
          {title}
        </h3>
        <IconButton onClick={onClose} aria-label="Đóng">
          <X className="w-4 h-4" />
        </IconButton>
      </div>
      {children}
    </div>
  </div>
);

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

  const [openMenu, setOpenMenu] = useState(null); // 'notif' | 'settings' | 'user'
  const [show2FaModal, setShow2FaModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const barRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const toggleMenu = (name) => setOpenMenu((cur) => (cur === name ? null : name));

  const title = MODULE_TITLES[activeModule]?.[systemOperatingMode] || 'Hệ thống KPI';
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const activeScope = rolesConfig?.find((r) => r.code === activeRole)?.dataScope || 'SELF';
  const userRoles = currentUser?.roles || [currentUser?.role || 'EMPLOYEE'];

  return (
    <>
      <header
        ref={barRef}
        className="sticky top-0 z-20 w-full h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <IconButton className="lg:hidden" onClick={() => setMobileSidebarOpen(true)} aria-label="Mở menu">
            <Menu className="w-5 h-5" />
          </IconButton>
          <h1 className="lg:hidden text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</h1>
          <label
            className="hidden sm:flex items-center gap-2 h-9 pl-3 pr-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shrink-0"
            title="Kỳ đánh giá"
          >
            <CalendarDays className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
            <select
              value={activePeriod?.id}
              onChange={(e) => setActivePeriodId(e.target.value)}
              className="text-sm font-medium bg-transparent border-none focus:ring-0 focus:outline-none cursor-pointer max-w-[180px] truncate"
              aria-label="Kỳ đánh giá"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name.replace(/^Kỳ Đánh giá\s*/i, '')}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setQuickSearchOpen(true)}
            className="hidden md:flex items-center gap-2 h-9 w-full max-w-xs px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left truncate">Tìm cán bộ, chỉ tiêu…</span>
            <kbd className="hidden lg:inline text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700">
              Ctrl K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <IconButton className="md:hidden" onClick={() => setQuickSearchOpen(true)} title="Tìm kiếm" aria-label="Tìm kiếm">
            <Search className="w-[18px] h-[18px]" />
          </IconButton>

          {/* Thông báo */}
          <div className="relative">
            <IconButton active={openMenu === 'notif'} onClick={() => toggleMenu('notif')} title="Thông báo" aria-label="Thông báo">
              <Bell className="w-[18px] h-[18px]" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums ring-2 ring-white dark:ring-slate-900">
                  {unreadNotifs}
                </span>
              )}
            </IconButton>
            {openMenu === 'notif' && (
              <Popover className="w-80 sm:w-96 py-2">
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">Thông báo</div>
                  {unreadNotifs > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Đã đọc hết
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-400">Chưa có thông báo</div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          if (notif.targetModule) setActiveModule(notif.targetModule);
                          setOpenMenu(null);
                        }}
                        className="w-full flex gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-primary-500'}`} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{notif.title}</span>
                            <span className="text-[11px] text-slate-400 whitespace-nowrap">{notif.time}</span>
                          </span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.message}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </Popover>
            )}
          </div>

          <IconButton
            onClick={toggleDarkMode}
            title={darkMode ? 'Giao diện sáng' : 'Giao diện tối'}
            aria-label="Đổi giao diện sáng / tối"
          >
            {darkMode ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px]" />}
          </IconButton>

          {/* Cài đặt: chế độ hoạt động + công cụ thử nghiệm */}
          <div className="relative">
            <IconButton active={openMenu === 'settings'} onClick={() => toggleMenu('settings')} title="Cài đặt" aria-label="Cài đặt">
              <Settings2 className="w-[18px] h-[18px]" />
            </IconButton>
            {openMenu === 'settings' && (
              <Popover className="w-80 p-3 space-y-4">
                <div className="space-y-2">
                  <div className="px-1 text-xs font-medium text-slate-500">Chế độ áp dụng</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'GOVERNMENT', label: 'Cơ quan nhà nước', icon: Building },
                      { value: 'ENTERPRISE', label: 'Doanh nghiệp', icon: Briefcase },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const selected = systemOperatingMode === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setSystemOperatingMode(opt.value)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                            selected
                              ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="px-1 text-xs font-medium text-slate-500">Đăng nhập nhanh tài khoản mẫu</div>
                  <div className="max-h-64 overflow-y-auto -mx-1">
                    {SAMPLE_ACCOUNTS.map((acc) => {
                      const isCurrent = currentUser?.id === acc.id;
                      const avatar = users.find((u) => u.id === acc.id)?.avatar;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => {
                            setCurrentUserId(acc.id);
                            setOpenMenu(null);
                            showToast(`Đã chuyển sang ${acc.name} (${getRoleLabel(acc.role)})`);
                          }}
                          className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-100'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {avatar ? (
                            <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <span className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{acc.name}</span>
                            <span className="block text-xs text-slate-400 truncate">{getRoleLabel(acc.role)}</span>
                          </span>
                          {isCurrent && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu?')) {
                      resetToDefaultData();
                      setOpenMenu(null);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 dark:text-rose-300 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Khôi phục dữ liệu mẫu
                </button>
              </Popover>
            )}
          </div>

          {/* Tài khoản + vai trò */}
          <span className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" aria-hidden="true" />
          <div className="relative">
            <button
              onClick={() => toggleMenu('user')}
              className={`flex items-center gap-2.5 h-10 pl-1 pr-2 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                openMenu === 'user' ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-label="Tài khoản"
            >
              <img src={currentUser?.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              <span className="hidden lg:block text-left leading-tight">
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100 max-w-[140px] truncate">
                  {currentUser?.name}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 max-w-[140px] truncate">
                  {getRoleLabel(activeRole)}
                </span>
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {openMenu === 'user' && (
              <Popover className="w-80 py-2">
                <div className="px-4 py-3 flex items-center gap-3">
                  <img src={currentUser?.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{currentUser?.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</div>
                  </div>
                </div>

                <div className="px-2 pb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-slate-500">Vai trò đang làm việc</div>
                  {userRoles.map((rCode) => {
                    const scope = rolesConfig?.find((r) => r.code === rCode)?.dataScope;
                    const selected = activeRole === rCode;
                    return (
                      <button
                        key={rCode}
                        onClick={() => {
                          switchActiveRole(rCode);
                          setOpenMenu(null);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                          selected
                            ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-100'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <ShieldCheck className={`w-4 h-4 shrink-0 ${selected ? 'text-primary-600' : 'text-slate-400'}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{getRoleLabel(rCode)}</span>
                          <span className="block text-xs text-slate-400">Phạm vi: {getScopeLabel(scope)}</span>
                        </span>
                        {selected && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 p-2 text-sm text-slate-700 dark:text-slate-300">
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setShow2FaModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    Xác thực 2 lớp
                    <span className={`ml-auto text-xs ${currentUser?.isTwoFactorEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {currentUser?.isTwoFactorEnabled ? 'Đang bật' : 'Đang tắt'}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setShowForgotModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-slate-400" />
                    Đổi mật khẩu
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
                <div className="px-4 pt-1 pb-1 text-[11px] text-slate-400">
                  Phạm vi dữ liệu hiện tại: {getScopeLabel(activeScope)}
                </div>
              </Popover>
            )}
          </div>
        </div>
      </header>

      {show2FaModal && (
        <Modal title="Xác thực 2 lớp" icon={Lock} onClose={() => setShow2FaModal(false)}>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Trạng thái: <strong>{currentUser?.isTwoFactorEnabled ? 'Đang bật' : 'Đang tắt'}</strong>
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShow2FaModal(false)}
              className="h-9 px-4 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                toggle2FA(currentUser.id);
                setShow2FaModal(false);
              }}
              className={`h-9 px-4 text-sm font-semibold rounded-xl text-white cursor-pointer ${
                currentUser?.isTwoFactorEnabled ? 'bg-rose-600 hover:bg-rose-700' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {currentUser?.isTwoFactorEnabled ? 'Tắt' : 'Bật ngay'}
            </button>
          </div>
        </Modal>
      )}

      {showForgotModal && (
        <Modal title="Đổi mật khẩu" icon={Key} onClose={() => setShowForgotModal(false)}>
          <input
            type="email"
            value={forgotEmail || currentUser?.email || ''}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="Email"
            className="w-full h-10 px-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForgotModal(false)}
              className="h-9 px-4 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={() => {
                forgotPassword(forgotEmail || currentUser?.email);
                setShowForgotModal(false);
              }}
              className="h-9 px-4 text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 cursor-pointer"
            >
              Gửi liên kết
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};
