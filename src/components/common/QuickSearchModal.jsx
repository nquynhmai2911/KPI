import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  LayoutDashboard,
  Building2,
  BookOpen,
  UserCheck,
  Users2,
  BarChart3,
  Shield,
  Palette,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const QuickSearchModal = () => {
  const {
    quickSearchOpen,
    setQuickSearchOpen,
    setActiveModule,
    users,
    kpiLibrary,
    setCurrentUserId,
    showToast,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Global keydown listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setQuickSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && quickSearchOpen) {
        setQuickSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickSearchOpen, setQuickSearchOpen]);

  // Focus input when opened
  useEffect(() => {
    if (quickSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [quickSearchOpen]);

  if (!quickSearchOpen) return null;

  // Search items: Modules
  const moduleItems = [
    { type: 'module', id: 'dashboards', title: 'Bảng điều khiển Tổng quan', subtitle: 'Thống kê KPI, biểu đồ tiến độ & xếp loại', icon: LayoutDashboard },
    { type: 'module', id: 'org-system', title: 'Cơ cấu Tổ chức & Nhân sự', subtitle: 'Cây đơn vị, vị trí việc làm, cán bộ', icon: Building2 },
    { type: 'module', id: 'library', title: 'Thư viện KPI & Lập kế hoạch', subtitle: 'Ngân hàng chỉ tiêu, công thức tính điểm', icon: BookOpen },
    { type: 'module', id: 'my-kpi', title: 'Phiếu KPI cá nhân của tôi', subtitle: 'Theo dõi tiến độ, check-in, minh chứng', icon: UserCheck },
    { type: 'module', id: 'team-kpi', title: 'Đánh giá & Duyệt KPI Đơn vị', subtitle: 'Chấm điểm quản lý, ý kiến 360', icon: Users2 },
    { type: 'module', id: 'reports', title: 'Báo cáo & Phân loại Đánh giá', subtitle: 'Báo cáo NĐ 90/48, xuất báo cáo', icon: BarChart3 },
    { type: 'module', id: 'non-functional', title: 'Hệ thống, SSO & Audit Logs', subtitle: 'Nhật ký kiểm toán, bảo mật, thông báo', icon: Shield },
    { type: 'module', id: 'ui-kit', title: 'UI Kit & Design System (Dev)', subtitle: 'Thư viện component dùng chung & tokens', icon: Palette },
  ];

  const q = query.trim().toLowerCase();

  const filteredModules = moduleItems.filter(
    (m) => m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)
  );

  const filteredUsers = q
    ? users
        .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.employeeCode && u.employeeCode.toLowerCase().includes(q)))
        .slice(0, 5)
        .map((u) => ({
          type: 'user',
          id: u.id,
          title: u.name,
          subtitle: `${u.roleTitle || u.positionTitle || 'Cán bộ'} • ${u.departmentName || 'Cơ quan'}`,
          avatar: u.avatar,
          user: u,
        }))
    : [];

  const filteredKpis = q
    ? kpiLibrary
        .filter((k) => k.name.toLowerCase().includes(q) || k.code.toLowerCase().includes(q))
        .slice(0, 4)
        .map((k) => ({
          type: 'kpi',
          id: k.id,
          title: `[${k.code}] ${k.name}`,
          subtitle: `Mục tiêu: ${k.defaultTarget} ${k.unit} • Trọng số: ${k.defaultWeight}%`,
          icon: Sparkles,
        }))
    : [];

  const allResults = [...filteredModules, ...filteredUsers, ...filteredKpis];

  const handleSelect = (item) => {
    if (!item) return;
    if (item.type === 'module') {
      setActiveModule(item.id);
      setQuickSearchOpen(false);
      showToast(`Đã chuyển tới trang "${item.title}"`);
    } else if (item.type === 'user') {
      setCurrentUserId(item.id);
      setQuickSearchOpen(false);
      showToast(`Đã chuyển tài khoản mẫu sang "${item.title}"`);
    } else if (item.type === 'kpi') {
      setActiveModule('library');
      setQuickSearchOpen(false);
      showToast(`Đã mở thư viện chỉ tiêu: "${item.title}"`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setQuickSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm nhanh hệ thống"
      >
        {/* Search Input bar */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="w-full py-4 text-base bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
            placeholder="Tìm chức năng, cán bộ, chỉ tiêu KPI... (Gõ để tìm kiếm)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1 < allResults.length ? prev + 1 : 0));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : allResults.length - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (allResults[selectedIndex]) {
                  handleSelect(allResults[selectedIndex]);
                }
              }
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 ml-2 text-xs font-mono font-medium text-slate-500 bg-slate-200/70 dark:bg-slate-800 dark:text-slate-400 rounded-md border border-slate-300 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Modules */}
          {filteredModules.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Chức năng & Phân hệ
              </div>
              <div className="space-y-1">
                {filteredModules.map((item, idx) => {
                  const Icon = item.icon;
                  const isCurrent = allResults[selectedIndex]?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isCurrent
                          ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-900 dark:text-primary-100 ring-1 ring-primary-200 dark:ring-primary-800'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${isCurrent ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-medium">{item.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</div>
                        </div>
                      </div>
                      <ArrowRight className={`w-4 h-4 text-slate-400 shrink-0 ml-2 ${isCurrent ? 'opacity-100 text-primary-600' : 'opacity-0'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Users */}
          {filteredUsers.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Cán bộ / Nhân sự (Click để chuyển tài khoản mẫu)
              </div>
              <div className="space-y-1">
                {filteredUsers.map((item) => {
                  const isCurrent = allResults[selectedIndex]?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isCurrent
                          ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-900 dark:text-primary-100'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={item.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                        <div className="truncate">
                          <div className="text-sm font-medium">{item.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Đổi vai trò
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* KPIs */}
          {filteredKpis.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Chỉ tiêu trong Thư viện KPI
              </div>
              <div className="space-y-1">
                {filteredKpis.map((item) => {
                  const isCurrent = allResults[selectedIndex]?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isCurrent
                          ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-900 dark:text-primary-100'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-medium">{item.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {allResults.length === 0 && (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Không tìm thấy kết quả phù hợp cho "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Thử tìm theo tên chức năng, tên cán bộ hoặc mã chỉ tiêu KPI</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">↑</kbd> <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">↓</kbd> để chọn</span>
            <span><kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">↵</kbd> để mở</span>
          </div>
          <span>Phím tắt: <strong className="font-mono">Ctrl + K</strong></span>
        </div>
      </div>
    </div>
  );
};
