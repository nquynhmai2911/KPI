import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  BookOpenCheck,
  TrendingUp,
  Award,
  ShieldAlert,
  ChevronRight,
  Layers,
} from 'lucide-react';

export const Sidebar = () => {
  const { activeModule, setActiveModule, currentUser, kpiPlans } = useApp();

  // Calculate quick badges
  const pendingApprovals = kpiPlans.filter((p) => p.status === 'SUBMITTED').length;

  const navItems = [
    {
      id: 'dashboards',
      label: '5. Báo cáo & Bảng điều khiển',
      subtext: 'Personal, Manager, Báo cáo HR',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'org-system',
      label: '1. Quản trị Hệ thống & Tổ chức',
      subtext: 'Sơ đồ tổ chức, Vị trí, Phân quyền, Kỳ',
      icon: Building2,
      badge: null,
    },
    {
      id: 'planning',
      label: '2. Thư viện KPI & Kế hoạch',
      subtext: 'Chỉ tiêu BSC, Cascading, Đăng ký & Duyệt',
      icon: BookOpenCheck,
      badge: pendingApprovals > 0 ? `${pendingApprovals} Chờ duyệt` : null,
      badgeType: 'warning',
    },
    {
      id: 'tracking',
      label: '3. Theo dõi & Cập nhật Tiến độ',
      subtext: 'Check-in, Đính kèm Minh chứng, API Sync',
      icon: TrendingUp,
      badge: 'Trực tuyến',
      badgeType: 'success',
    },
    {
      id: 'evaluation',
      label: '4. Đánh giá & Chấm điểm',
      subtext: 'Tự chấm, Quản lý duyệt, Đánh giá 360',
      icon: Award,
      badge: null,
    },
    {
      id: 'non-functional',
      label: '6. Hệ thống & Phi chức năng',
      subtext: 'Audit Log, SSO Auth, Thông báo',
      icon: ShieldAlert,
      badge: null,
    },
  ];

  return (
    <aside
      className="sidebar-container"
      style={{
        width: '290px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand Logo & Institution Info */}
      <div
        style={{
          padding: '20px 20px 16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
          }}
        >
          <Layers size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
            KPI Enterprise
          </h1>
          <span style={{ fontSize: '0.725rem', color: 'var(--primary-600)', fontWeight: 700, letterSpacing: '0.02em' }}>
            HỆ THỐNG TÁC NGHIỆP SỐ
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <p
          style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 800,
            color: 'var(--text-light)',
            padding: '0 12px 10px 12px',
          }}
        >
          CÁC PHÂN HỆ NGHIỆP VỤ (6 MODULES)
        </p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive
                    ? 'linear-gradient(90deg, var(--primary-600), var(--primary-700))'
                    : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                }}
              >
                <div
                  style={{
                    color: isActive ? '#ffffff' : 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: isActive ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px',
                    }}
                  >
                    {item.subtext}
                  </div>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '10px',
                      background:
                        isActive
                          ? 'rgba(255, 255, 255, 0.25)'
                          : item.badgeType === 'warning'
                          ? '#fef3c7'
                          : '#d1fae5',
                      color:
                        isActive
                          ? '#ffffff'
                          : item.badgeType === 'warning'
                          ? '#b45309'
                          : '#047857',
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                <ChevronRight
                  size={14}
                  style={{
                    color: isActive ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-light)',
                    marginLeft: 'auto',
                  }}
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile Box */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-card-hover)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.825rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser.name}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser.departmentName}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
