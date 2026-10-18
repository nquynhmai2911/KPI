import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  UserCheck,
  Users2,
  BarChart3,
  Shield,
  Palette,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  X,
  Target,
  FileSpreadsheet,
} from 'lucide-react';

export const Sidebar = () => {
  const {
    activeModule,
    setActiveModule,
    currentUser,
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    kpiPlans,
    systemOperatingMode,
    activeRole,
    rolesConfig,
  } = useApp();

  const pendingCount = kpiPlans.filter((p) => p.status === 'SUBMITTED').length;
  const isEmployee = activeRole === 'EMPLOYEE' || activeRole === 'PEER_REVIEWER';

  const ALL_ROLES = [
    'SYSTEM_ADMIN', 'EXECUTIVE', 'UNIT_HEAD', 'LINE_MANAGER', 'HR_OFFICER',
    'EMPLOYEE', 'COUNCIL_MEMBER', 'SECRETARY', 'AUDITOR', 'PEER_REVIEWER',
  ];

  // Nhóm menu theo chức năng nghiệp vụ và phân quyền theo vai trò (Phase 1.5)
  const menuGroups = [
    {
      groupTitle: 'TỔNG QUAN',
      items: [
        {
          id: 'dashboards',
          label: 'Bảng điều khiển Tổng quan',
          shortLabel: 'Tổng quan',
          icon: LayoutDashboard,
          roles: ALL_ROLES,
          badge: null,
        },
      ],
    },
    {
      groupTitle: systemOperatingMode === 'GOVERNMENT' ? 'QUẢN TRỊ TỔ CHỨC & CHỈ TIÊU' : 'CHIẾN LƯỢC & MỤC TIÊU',
      items: [
        {
          id: 'org-system',
          label: systemOperatingMode === 'GOVERNMENT' ? 'Cơ cấu Tổ chức & Cán bộ' : 'Sơ đồ Tổ chức & Nhân sự',
          shortLabel: 'Tổ chức',
          icon: Building2,
          roles: ['SYSTEM_ADMIN', 'EXECUTIVE', 'HR_OFFICER', 'UNIT_HEAD', 'AUDITOR'],
          badge: null,
        },
        {
          id: 'library',
          label: systemOperatingMode === 'GOVERNMENT' ? 'Thư viện Tiêu chí & Giao KPI' : 'Thư viện KPI / BSC & Kế hoạch',
          shortLabel: 'Thư viện KPI',
          icon: BookOpen,
          roles: ['SYSTEM_ADMIN', 'EXECUTIVE', 'HR_OFFICER', 'UNIT_HEAD', 'LINE_MANAGER', 'AUDITOR'],
          badge: null,
        },
      ],
    },
    {
      groupTitle: 'ĐÁNH GIÁ & THỰC HIỆN',
      items: [
        {
          id: 'my-kpi',
          label: 'Phiếu KPI cá nhân của tôi',
          shortLabel: 'KPI của tôi',
          icon: UserCheck,
          roles: ['EMPLOYEE', 'LINE_MANAGER', 'UNIT_HEAD', 'SECRETARY', 'PEER_REVIEWER', 'EXECUTIVE'],
          badge: null,
        },
        {
          id: 'team-kpi',
          label: isEmployee
            ? (systemOperatingMode === 'GOVERNMENT' ? 'Góp ý Tập thể (NĐ 90/48)' : 'Đánh giá Đồng nghiệp 360°')
            : (systemOperatingMode === 'GOVERNMENT' ? 'Hội đồng & Lãnh đạo Đánh giá' : 'Đánh giá & Duyệt Nhóm'),
          shortLabel: isEmployee ? 'Góp ý 360°' : 'Duyệt nhóm',
          icon: Users2,
          roles: ['EXECUTIVE', 'UNIT_HEAD', 'LINE_MANAGER', 'COUNCIL_MEMBER', 'SECRETARY', 'PEER_REVIEWER', 'HR_OFFICER', 'EMPLOYEE'],
          badge: !isEmployee && pendingCount > 0 ? `${pendingCount}` : null,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'reports',
          label: systemOperatingMode === 'GOVERNMENT' ? 'Báo cáo & Xếp loại (Nghị định 90)' : 'Báo cáo Hiệu suất & Thưởng',
          shortLabel: 'Báo cáo',
          icon: BarChart3,
          roles: ['EXECUTIVE', 'UNIT_HEAD', 'LINE_MANAGER', 'HR_OFFICER', 'COUNCIL_MEMBER', 'SECRETARY', 'AUDITOR', 'SYSTEM_ADMIN'],
          badge: null,
        },
      ],
    },
    {
      groupTitle: 'HỆ THỐNG & CÔNG CỤ',
      items: [
        {
          id: 'non-functional',
          label: 'Hệ thống, Ma trận RBAC & Nhật ký',
          shortLabel: 'Hệ thống & RBAC',
          icon: Shield,
          roles: ['SYSTEM_ADMIN', 'AUDITOR', 'HR_OFFICER'],
          badge: 'RBAC',
          badgeColor: 'bg-purple-600 text-white',
        },
        {
          id: 'ui-kit',
          label: 'UI Kit & Thư viện Component (Dev)',
          shortLabel: 'UI Kit',
          icon: Palette,
          roles: ['SYSTEM_ADMIN'],
          badge: 'Dev',
          badgeColor: 'bg-primary-600 text-white',
        },
      ],
    },
  ];

  const handleSelectModule = (id) => {
    setActiveModule(id);
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 select-none transition-all duration-200">
      {/* Top Logo & Branding */}
      <div className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-800 px-4 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-700 via-primary-600 to-primary-500 text-white flex items-center justify-center font-black shadow-md shadow-primary-500/20 shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="truncate">
              <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                {systemOperatingMode === 'GOVERNMENT' ? 'HỆ THỐNG ĐÁNH GIÁ CBCC' : 'KPI ENTERPRISE OS'}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                <span>{systemOperatingMode === 'GOVERNMENT' ? 'Nghị định 90/2020 & 48/2023' : 'Quản trị BSC & KPI Hiện đại'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-700 via-primary-600 to-primary-500 text-white flex items-center justify-center font-bold shadow-md shadow-primary-500/20 cursor-pointer"
            onClick={toggleSidebar}
            title="Mở rộng Sidebar"
          >
            <Award className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Mobile close button */}
        {mobileSidebarOpen && (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Đóng thanh điều hướng"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {menuGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(activeRole || 'EMPLOYEE')
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-1">
              {/* Group Title Header */}
              {!sidebarCollapsed ? (
                <div className="px-3 pb-1.5 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate">
                  {group.groupTitle}
                </div>
              ) : (
                <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-2" />
              )}

              {/* Items */}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectModule(item.id)}
                    title={item.label}
                    className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    } ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {/* Active Accent Bar on Left (Yêu cầu Bước 2) */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary-600 dark:bg-primary-500 rounded-r-md" />
                    )}

                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-transform ${
                          isActive
                            ? 'text-primary-600 dark:text-primary-400 scale-105'
                            : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                        }`}
                      />
                      {!sidebarCollapsed && (
                        <span className="truncate text-left">{item.label}</span>
                      )}
                    </div>

                    {!sidebarCollapsed && item.badge && (
                      <span
                        className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full tabular-nums shrink-0 ${
                          item.badgeColor || 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsed dot for badge */}
                    {sidebarCollapsed && item.badge && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer: User summary & collapse toggle button */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
              />
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {currentUser?.name}
                </div>
                <div className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold truncate flex items-center gap-1">
                  <span>{activeRole}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-primary-100 dark:bg-primary-950/80 font-mono text-primary-800 dark:text-primary-300">
                    {rolesConfig?.find((r) => r.code === activeRole)?.dataScope || 'SELF'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Thu gọn menu (72px)"
              aria-label="Thu gọn sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Mở rộng menu (260px)"
              aria-label="Mở rộng sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: 260px or 72px */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 z-30 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer with backdrop overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-[280px] max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
