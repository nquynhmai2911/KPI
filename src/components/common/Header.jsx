import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Moon,
  Sun,
  RotateCcw,
  Shield,
  UserCheck,
  Briefcase,
  User,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
} from 'lucide-react';

export const Header = () => {
  const {
    currentUser,
    users,
    setCurrentUserId,
    periods,
    activePeriodId,
    setActivePeriodId,
    darkMode,
    toggleDarkMode,
    resetToDefaultData,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setActiveModule,
  } = useApp();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge badge-red"><Shield size={12} /> Admin</span>;
      case 'HR':
        return <span className="badge badge-gold"><Briefcase size={12} /> HR Cán bộ</span>;
      case 'MANAGER':
        return <span className="badge badge-blue"><UserCheck size={12} /> Quản lý</span>;
      default:
        return <span className="badge badge-green"><User size={12} /> Nhân viên</span>;
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle size={16} className="text-emerald-500" style={{ color: '#10b981' }} />;
      case 'WARNING':
        return <AlertTriangle size={16} className="text-amber-500" style={{ color: '#f59e0b' }} />;
      default:
        return <Info size={16} className="text-blue-500" style={{ color: '#3b82f6' }} />;
    }
  };

  return (
    <header className="app-header" style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Left: Organization Title & Current Period Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              letterSpacing: '0.05em'
            }}>KPI OS</span>
            Hệ thống Quản lý KPI & Đánh giá Hiệu quả Công việc
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Hệ thống thông tin tác nghiệp số hóa tiêu chí, minh chứng và đánh giá cán bộ
          </p>
        </div>

        {/* Evaluation Period Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card-hover)', padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Calendar size={15} style={{ color: 'var(--primary-600)' }} />
          <span style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--text-muted)' }}>Kỳ:</span>
          <select
            value={activePeriodId}
            onChange={(e) => setActivePeriodId(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.825rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                {p.name} ({p.statusName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls: Role Switcher, Notifications, Dark Mode, Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        
        {/* Reset Demo Data Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            if (window.confirm('Khôi phục toàn bộ cơ sở dữ liệu mẫu về trạng thái ban đầu?')) {
              resetToDefaultData();
            }
          }}
          title="Khôi phục dữ liệu mẫu ban đầu"
          style={{ fontSize: '0.75rem' }}
        >
          <RotateCcw size={13} />
          Reset Dữ liệu
        </button>

        {/* Dark Mode Toggle */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={toggleDarkMode}
          title={darkMode ? 'Chuyển chế độ Sáng' : 'Chuyển chế độ Tối'}
          style={{ padding: '7px 10px' }}
        >
          {darkMode ? <Sun size={15} style={{ color: '#f59e0b' }} /> : <Moon size={15} />}
        </button>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            style={{ position: 'relative', padding: '7px 10px' }}
            title="Thông báo hệ thống"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '40px',
              width: '360px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 200,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-card-hover)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={16} />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Thông báo ({notifications.length})</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem' }}>Không có thông báo mới</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.targetModule) setActiveModule(n.targetModule);
                        setShowNotifDropdown(false);
                      }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: n.isRead ? 'transparent' : 'var(--accent-glow)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        display: 'flex',
                        gap: '12px',
                      }}
                    >
                      <div style={{ marginTop: '2px' }}>{getNotifIcon(n.type)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '4px' }}>
                          {n.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher & User Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px',
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentUser.name}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {currentUser.roleTitle}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Role Switcher Menu */}
          {showRoleDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '320px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 200,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Chuyển đổi Tài khoản & Phân quyền (Demo Roles)
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Chọn cán bộ để trải nghiệm từng góc nhìn quyền hạn:
                </p>
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        setCurrentUserId(u.id);
                        setShowRoleDropdown(false);
                      }}
                      style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isCurrent ? 'var(--accent-glow)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={u.avatar}
                          alt={u.name}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: isCurrent ? 700 : 500, color: 'var(--text-main)' }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {u.positionTitle}
                          </div>
                        </div>
                      </div>
                      <div>{getRoleBadge(u.role)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
