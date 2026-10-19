import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  TrendingUp,
  ClipboardCheck,
  BarChart3,
  Shield,
  ChevronsLeft,
  ChevronsRight,
  Award,
  X,
  CalendarCog,
} from 'lucide-react';
import { getRoleLabel } from '../../utils/labels';

const ALL_ROLES = [
  'SYSTEM_ADMIN', 'EXECUTIVE', 'UNIT_HEAD', 'LINE_MANAGER', 'HR_OFFICER',
  'EMPLOYEE', 'COUNCIL_MEMBER', 'SECRETARY', 'AUDITOR', 'PEER_REVIEWER',
];

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
  } = useApp();

  const isGov = systemOperatingMode === 'GOVERNMENT';
  const pendingCount = kpiPlans.filter((p) => ['SUBMITTED', 'ACCEPTED'].includes(p.status) || p.evaluationStatus === 'SELF_EVALUATED').length;
  const isEmployee = activeRole === 'EMPLOYEE' || activeRole === 'PEER_REVIEWER';

  const menuGroups = [
    {
      items: [{ id: 'dashboards', label: 'Tổng quan', icon: LayoutDashboard, roles: ALL_ROLES }],
    },
    {
      title: 'Quy trình đánh giá',
      process: true,
      items: [
        {
          id: 'periods',
          label: 'Kỳ đánh giá',
          icon: CalendarCog,
          roles: ['SYSTEM_ADMIN', 'EXECUTIVE', 'HR_OFFICER', 'UNIT_HEAD', 'AUDITOR'],
        },
        {
          id: 'library',
          label: 'Giao chỉ tiêu',
          icon: ClipboardList,
          roles: ['SYSTEM_ADMIN', 'EXECUTIVE', 'HR_OFFICER', 'UNIT_HEAD', 'LINE_MANAGER', 'AUDITOR', 'EMPLOYEE'],
        },
        {
          id: 'my-kpi',
          label: 'Thực hiện',
          icon: TrendingUp,
          roles: ['EMPLOYEE', 'LINE_MANAGER', 'UNIT_HEAD', 'SECRETARY', 'PEER_REVIEWER', 'EXECUTIVE', 'SYSTEM_ADMIN'],
        },
        {
          id: 'team-kpi',
          label: isEmployee ? 'Tự đánh giá' : 'Đánh giá',
          icon: ClipboardCheck,
          roles: ['EXECUTIVE', 'UNIT_HEAD', 'LINE_MANAGER', 'COUNCIL_MEMBER', 'SECRETARY', 'PEER_REVIEWER', 'HR_OFFICER', 'EMPLOYEE', 'SYSTEM_ADMIN'],
          badge: !isEmployee && pendingCount > 0 ? pendingCount : null,
        },
        {
          id: 'reports',
          label: isGov ? 'Kết quả & báo cáo' : 'Kết quả & thưởng',
          icon: BarChart3,
          roles: ['EXECUTIVE', 'UNIT_HEAD', 'LINE_MANAGER', 'HR_OFFICER', 'COUNCIL_MEMBER', 'SECRETARY', 'AUDITOR', 'SYSTEM_ADMIN'],
        },
      ],
    },
    {
      title: 'Quản trị',
      items: [
        {
          id: 'org-system',
          label: isGov ? 'Tổ chức & cán bộ' : 'Tổ chức & nhân sự',
          icon: Building2,
          roles: ['SYSTEM_ADMIN', 'EXECUTIVE', 'HR_OFFICER', 'UNIT_HEAD', 'AUDITOR'],
        },
        {
          id: 'non-functional',
          label: 'Hệ thống & phân quyền',
          icon: Shield,
          roles: ['SYSTEM_ADMIN', 'AUDITOR', 'HR_OFFICER'],
        },
      ],
    },
  ];

  const handleSelectModule = (id) => {
    setActiveModule(id);
    if (mobileSidebarOpen) setMobileSidebarOpen(false);
  };

  const collapsed = sidebarCollapsed && !mobileSidebarOpen;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 select-none">
      <div className={`h-16 flex items-center px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <button
          onClick={() => handleSelectModule('dashboards')}
          className="flex items-center gap-3 min-w-0 cursor-pointer"
          title="Về trang tổng quan"
        >
          <span className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-sm shadow-primary-600/30 shrink-0">
            <Award className="w-5 h-5" />
          </span>
          {!collapsed && (
            <span className="text-left min-w-0">
              <span className="block font-bold text-[15px] tracking-tight text-slate-900 dark:text-white truncate">
                Đánh giá KPI
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                {isGov ? 'Cơ quan nhà nước' : 'Doanh nghiệp'}
              </span>
            </span>
          )}
        </button>
        {mobileSidebarOpen && (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {menuGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(activeRole || 'EMPLOYEE'));
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-1">
              {group.title &&
                (!collapsed ? (
                  <div className="px-3 pb-2 text-xs font-medium text-slate-400 dark:text-slate-500">{group.title}</div>
                ) : (
                  <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-3" />
                ))}

              {visibleItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectModule(item.id)}
                    title={item.label}
                    className={`w-full group flex items-center gap-3 h-10 px-3 rounded-xl text-sm transition-colors relative cursor-pointer ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    } ${collapsed ? 'justify-center' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {group.process && !collapsed ? (
                      <span
                        className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums ${
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    ) : (
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    )}
                    {!collapsed && <span className="truncate text-left flex-1">{item.label}</span>}
                    {!collapsed && group.process && (
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    )}
                    {item.badge ? (
                      collapsed ? (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                      ) : (
                        <span className="min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full bg-amber-500 text-white flex items-center justify-center tabular-nums">
                          {item.badge}
                        </span>
                      )
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800">
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <img src={currentUser?.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{currentUser?.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{getRoleLabel(activeRole)}</div>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden lg:inline-flex p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 z-30 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'w-[76px]' : 'w-[256px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setMobileSidebarOpen(false)} aria-hidden="true" />
          <div className="relative w-[280px] max-w-[85vw] h-full shadow-2xl z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
