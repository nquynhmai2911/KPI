import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { RbacMatrixTab } from './RbacMatrixTab';
import {
  ShieldCheck,
  Bell,
  KeyRound,
  Database,
  History,
  Send,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Search,
  Lock,
  Users,
} from 'lucide-react';

export const Module6_SystemNonFunctional = () => {
  const {
    auditLogs,
    notifications,
    addNotification,
    resetToDefaultData,
    currentUser,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState('rbac-matrix'); // rbac-matrix, audit-log, sso, notifications, backup
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('ALL');

  // Broadcast Notification Form
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'INFO',
    targetModule: 'planning',
  });

  // SSO Settings State
  const [ssoConfig, setSsoConfig] = useState({
    provider: 'MICROSOFT_AZURE_AD',
    tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
    clientId: 'gov-kpi-enterprise-auth-client',
    discoveryUrl: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
    status: 'CONNECTED',
    domainEnforce: '@gov-kpi.vn',
    twoFactorEnforced: true,
  });

  // Filter Audit Logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.description.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase());
    const matchMod = auditModuleFilter === 'ALL' || log.module.includes(auditModuleFilter);
    return matchSearch && matchMod;
  });

  // Handle Send Broadcast Notification
  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) return;

    addNotification(
      broadcastForm.title,
      broadcastForm.message,
      broadcastForm.type,
      broadcastForm.targetModule
    );
    showToast('Đã phát tán thông báo toàn cơ quan!');
    setBroadcastForm({
      title: '',
      message: '',
      type: 'INFO',
      targetModule: 'planning',
    });
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      backupDate: new Date().toISOString(),
      user: currentUser.name,
      storage: { ...localStorage },
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GovKPI_System_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất bản sao lưu cơ sở dữ liệu hệ thống!');
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck style={{ color: 'var(--primary-600)' }} />
          Module 6: Tiện ích Hệ thống & Phi Chức năng (Non-Functional)
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Nhật ký kiểm toán chống gian lận (Audit Trail), Cấu hình Single Sign-On (SSO), Trung tâm Thông báo phát tán và Sao lưu cơ sở dữ liệu
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'rbac-matrix' ? 'active' : ''}`}
          onClick={() => setActiveTab('rbac-matrix')}
        >
          <Users size={16} />
          Ma trận Phân quyền & SoD (RBAC Matrix)
        </button>
        <button
          className={`tab-btn ${activeTab === 'audit-log' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit-log')}
        >
          <History size={16} />
          Nhật ký Kiểm toán (Audit Log) ({auditLogs.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={16} />
          Trung tâm Thông báo Nhắc hạn ({notifications.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'sso' ? 'active' : ''}`}
          onClick={() => setActiveTab('sso')}
        >
          <KeyRound size={16} />
          Cấu hình Đăng nhập Một lần (SSO)
        </button>
        <button
          className={`tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          <Database size={16} />
          Sao lưu & Khôi phục Dữ liệu
        </button>
      </div>

      {/* TAB 0: RBAC Matrix */}
      {activeTab === 'rbac-matrix' && <RbacMatrixTab />}

      {/* TAB 1: Audit Log */}
      {activeTab === 'audit-log' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-light)' }} />
                <input
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Tìm theo người thực hiện, thao tác, nội dung..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                />
              </div>

              <select
                className="form-control"
                style={{ width: 'auto' }}
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
              >
                <option value="ALL">Tất cả phân hệ</option>
                <option value="Module 1">Module 1: Tổ chức & Kỳ</option>
                <option value="Module 2">Module 2: Thư viện & Lập kế hoạch</option>
                <option value="Module 3">Module 3: Theo dõi Tiến độ</option>
                <option value="Module 4">Module 4: Đánh giá & Chấm điểm</option>
                <option value="Module 6">Module 6: Hệ thống</option>
              </select>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Tổng số vết ghi: <strong>{filteredLogs.length}</strong> hành động
            </div>
          </div>

          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Cán bộ thực hiện</th>
                  <th>Vai trò</th>
                  <th>Phân hệ</th>
                  <th>Hành động (Action)</th>
                  <th>Nội dung chi tiết</th>
                  <th>Địa chỉ IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {log.timestamp}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{log.userName}</strong>
                    </td>
                    <td>
                      <span className="badge badge-gray">{log.role}</span>
                    </td>
                    <td>
                      <span className="badge badge-blue">{log.module}</span>
                    </td>
                    <td>
                      <span className="badge badge-gold" style={{ fontFamily: 'monospace' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ maxWidth: '350px', fontSize: '0.825rem' }}>
                      <div>{log.description}</div>
                      {log.oldValue && log.newValue && (
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <span style={{ textDecoration: 'line-through', color: '#ef4444' }}>{log.oldValue}</span> →{' '}
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{log.newValue}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Notifications */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Left: Danh sách thông báo */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
              Danh Sách Thông Báo & Nhắc Hạn Tự Động
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    borderLeft: `4px solid ${
                      notif.type === 'SUCCESS' ? '#10b981' : notif.type === 'WARNING' ? '#f59e0b' : notif.type === 'ALERT' ? '#ef4444' : '#2563eb'
                    }`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{notif.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Phát thông báo mới */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
              Phát Thông Báo / Nhắc Hạn Toàn Hệ Thống
            </h3>
            <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Gửi thông điệp nhắc nhở chốt KPI, mở đợt đánh giá tới tất cả cán bộ
            </p>

            <form onSubmit={handleSendBroadcast}>
              <div className="form-group">
                <label className="form-label">Tiêu đề thông báo *</label>
                <input
                  className="form-control"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  placeholder="VD: Nhắc nhở hạn chót nộp KPI Quý 4"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mức độ cảnh báo</label>
                <select
                  className="form-control"
                  value={broadcastForm.type}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}
                >
                  <option value="INFO">Thông tin (Xanh dương)</option>
                  <option value="WARNING">Cảnh báo nhắc nhở (Vàng cam)</option>
                  <option value="ALERT">Khẩn cấp / Hạn chót (Đỏ)</option>
                  <option value="SUCCESS">Hoàn tất / Khen thưởng (Xanh lá)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Liên kết điều hướng đến</label>
                <select
                  className="form-control"
                  value={broadcastForm.targetModule}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetModule: e.target.value })}
                >
                  <option value="planning">Module 2: Đăng ký & Duyệt KPI</option>
                  <option value="tracking">Module 3: Check-in & Minh chứng</option>
                  <option value="evaluation">Module 4: Đánh giá & Chấm điểm</option>
                  <option value="dashboards">Module 5: Báo cáo & Bảng điều khiển</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nội dung chi tiết thông điệp *</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  placeholder="Nội dung thông báo cần truyền đạt..."
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Send size={15} /> Phát Tán Thông Báo Ngay
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 3: SSO Authentication */}
      {activeTab === 'sso' && (
        <div style={{ maxWidth: '850px' }}>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0078d4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Single Sign-On (SSO) & Định Danh Điện Tử Doanh Nghiệp / Cơ Quan
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Chuẩn kết nối SAML 2.0 / OpenID Connect (OIDC)
                  </span>
                </div>
              </div>
              <span className="badge badge-green">
                <CheckCircle size={12} /> Đang hoạt động
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Cho phép toàn thể cán bộ công chức đăng nhập tự động bằng tài khoản email công vụ (@gov-kpi.vn) thông qua Microsoft 365, Google Workspace hoặc Cổng Dịch vụ công Quốc gia mà không cần khởi tạo mật khẩu rời.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nhà cung cấp định danh (Identity Provider)</label>
                <select
                  className="form-control"
                  value={ssoConfig.provider}
                  onChange={(e) => setSsoConfig({ ...ssoConfig, provider: e.target.value })}
                >
                  <option value="MICROSOFT_AZURE_AD">Microsoft Entra ID / Microsoft 365</option>
                  <option value="GOOGLE_WORKSPACE">Google Workspace for Government</option>
                  <option value="GOV_ID">Cổng Định danh Điện tử Quốc gia (VNeID / AD)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tenant ID / Directory ID</label>
                  <input
                    className="form-control"
                    value={ssoConfig.tenantId}
                    onChange={(e) => setSsoConfig({ ...ssoConfig, tenantId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Client ID / App ID</label>
                  <input
                    className="form-control"
                    value={ssoConfig.clientId}
                    onChange={(e) => setSsoConfig({ ...ssoConfig, clientId: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">OIDC Metadata Discovery Endpoint</label>
                <input
                  className="form-control"
                  value={ssoConfig.discoveryUrl}
                  onChange={(e) => setSsoConfig({ ...ssoConfig, discoveryUrl: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card-hover)', padding: '14px', borderRadius: '10px' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem' }}>Bắt buộc xác thực 2 yếu tố (2FA / MFA)</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tăng cường bảo mật an ninh mạng theo Nghị định về bảo vệ dữ liệu cá nhân
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={ssoConfig.twoFactorEnforced}
                  onChange={(e) => setSsoConfig({ ...ssoConfig, twoFactorEnforced: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => showToast('Đã lưu cấu hình SSO thành công!')}
              >
                Lưu Cấu Hình SSO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Sao Lưu & Khôi Phục Dữ Liệu */}
      {activeTab === 'backup' && (
        <div style={{ maxWidth: '850px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
              Trung Tâm Quản Trị Cơ Sở Dữ Liệu & Sao Lưu
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Đảm bảo an toàn dữ liệu, chống mất mát số liệu đánh giá của toàn bộ cơ quan
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'var(--bg-card-hover)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>
                    Xuất Bản Sao Lưu Đầy Đủ (JSON Backup)
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Tải về toàn bộ cơ cấu tổ chức, chức danh, chỉ tiêu thư viện, các kế hoạch KPI, minh chứng và nhật ký kiểm toán.
                  </p>
                </div>
                <button className="btn btn-primary" onClick={handleExportBackup}>
                  <Download size={15} /> Tải Về Tệp Sao Lưu (.JSON)
                </button>
              </div>

              <div style={{ background: 'var(--bg-card-hover)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>
                    Khôi Phục Dữ Liệu Mẫu Ban Đầu
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Xóa các thay đổi tạm thời và đưa toàn bộ cơ sở dữ liệu về bộ mẫu chuẩn nghiệp vụ ban đầu.
                  </p>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (window.confirm('Khôi phục toàn bộ hệ thống về dữ liệu mẫu mặc định?')) {
                      resetToDefaultData();
                    }
                  }}
                >
                  Khôi Phục Dữ Liệu Chuẩn Mẫu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
