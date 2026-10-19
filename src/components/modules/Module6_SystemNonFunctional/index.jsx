import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { RbacMatrixTab } from './RbacMatrixTab';
import {
  Shield,
  Bell,
  KeyRound,
  Database,
  History,
  Send,
  Download,
  RotateCcw,
  CheckCircle2,
  Search,
  Users,
  Info,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import { PageHeader } from '../../common/PageHeader';
import { SectionCard } from '../../common/SectionCard';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { FormField } from '../../common/FormField';
import { Badge } from '../../ui/Badge';
import { InfoTip } from '../../ui/InfoTip';
import { getRoleLabel } from '../../../utils/labels';

const NOTIF_STYLE = {
  SUCCESS: { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' },
  WARNING: { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' },
  ALERT: { icon: AlertOctagon, cls: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' },
  INFO: { icon: Info, cls: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' },
};

const selectCls =
  'h-9 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100';

export const Module6_SystemNonFunctional = () => {
  const { auditLogs, notifications, addNotification, resetToDefaultData, currentUser, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('rbac-matrix');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('ALL');
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', type: 'INFO', targetModule: 'library' });
  const [ssoConfig, setSsoConfig] = useState({
    provider: 'MICROSOFT_AZURE_AD',
    tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
    clientId: 'gov-kpi-enterprise-auth-client',
    discoveryUrl: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
    twoFactorEnforced: true,
  });

  const q = auditSearch.toLowerCase();
  const filteredLogs = auditLogs.filter(
    (log) =>
      (log.userName.toLowerCase().includes(q) || log.description.toLowerCase().includes(q)) &&
      (auditModuleFilter === 'ALL' || log.module.includes(auditModuleFilter))
  );

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) return;
    addNotification(broadcastForm.title, broadcastForm.message, broadcastForm.type, broadcastForm.targetModule);
    showToast('Đã gửi thông báo toàn cơ quan!');
    setBroadcastForm({ title: '', message: '', type: 'INFO', targetModule: 'library' });
  };

  const handleExportBackup = () => {
    const backupData = { backupDate: new Date().toISOString(), user: currentUser.name, storage: { ...localStorage } };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `SaoLuu_KPI_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã tải bản sao lưu dữ liệu!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Shield}
        title="Quản trị hệ thống"
        subtitle="Phân quyền theo vai trò, nhật ký thao tác (phục vụ thanh tra, kiểm tra), gửi thông báo, đăng nhập một lần và sao lưu dữ liệu."
      />

      <SegmentedControl
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { value: 'rbac-matrix', label: 'Phân quyền', icon: Users },
          { value: 'audit-log', label: 'Nhật ký thao tác', icon: History, badge: auditLogs.length },
          { value: 'notifications', label: 'Thông báo', icon: Bell, badge: notifications.length },
          { value: 'sso', label: 'Đăng nhập một lần', icon: KeyRound },
          { value: 'backup', label: 'Sao lưu', icon: Database },
        ]}
      />

      {activeTab === 'rbac-matrix' && <RbacMatrixTab />}

      {activeTab === 'audit-log' && (
        <SectionCard
          title="Nhật ký thao tác"
          icon={History}
          description="Mọi thao tác thêm, sửa, duyệt, chấm điểm đều được ghi lại kèm người thực hiện, thời gian và địa chỉ IP. Không ai được sửa hoặc xóa nhật ký."
          action={<span className="text-sm text-slate-500 tabular-nums">{filteredLogs.length} bản ghi</span>}
        >
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[260px]">
              <Input leftIcon={Search} placeholder="Tìm người thực hiện, nội dung..." value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} />
            </div>
            <select className={`${selectCls} w-auto`} value={auditModuleFilter} onChange={(e) => setAuditModuleFilter(e.target.value)}>
              <option value="ALL">Tất cả phân hệ</option>
              <option value="Module 1">Tổ chức & kỳ đánh giá</option>
              <option value="Module 2">Giao chỉ tiêu</option>
              <option value="Module 3">Thực hiện</option>
              <option value="Module 4">Đánh giá & xếp loại</option>
              <option value="Module 6">Hệ thống</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Thời gian</th>
                  <th className="px-4 py-3 font-medium">Người thực hiện</th>
                  <th className="px-4 py-3 font-medium">Phân hệ</th>
                  <th className="px-4 py-3 font-medium">Nội dung</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 tabular-nums">{log.timestamp}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{log.userName}</div>
                      <div className="text-xs text-slate-400">{getRoleLabel(log.role)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge size="sm" variant="primary">{log.module.replace(/^Module \d+:\s*/, '')}</Badge>
                    </td>
                    <td className="px-4 py-3 max-w-md text-slate-700 dark:text-slate-300">
                      {log.description}
                      {log.oldValue && log.newValue && (
                        <div className="text-xs mt-0.5">
                          <span className="line-through text-rose-500">{log.oldValue}</span> →{' '}
                          <span className="text-emerald-600 font-medium">{log.newValue}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SectionCard className="lg:col-span-2" title="Thông báo đã gửi" icon={Bell}>
            <ul className="space-y-3">
              {notifications.map((notif) => {
                const st = NOTIF_STYLE[notif.type] || NOTIF_STYLE.INFO;
                const Icon = st.icon;
                return (
                  <li key={notif.id} className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${st.cls}`}>
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{notif.title}</span>
                        <span className="text-xs text-slate-400 whitespace-nowrap">{notif.time}</span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{notif.message}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <SectionCard title="Gửi thông báo mới" icon={Send} description="Nhắc hạn giao chỉ tiêu, mở đợt đánh giá... tới toàn bộ cán bộ.">
            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <FormField label="Tiêu đề" required>
                <Input value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} placeholder="VD: Nhắc hạn nộp KPI Quý 4" required />
              </FormField>
              <FormField label="Mức độ">
                <select className={selectCls} value={broadcastForm.type} onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}>
                  <option value="INFO">Thông tin</option>
                  <option value="WARNING">Nhắc nhở</option>
                  <option value="ALERT">Khẩn cấp</option>
                  <option value="SUCCESS">Hoàn tất</option>
                </select>
              </FormField>
              <FormField label="Bấm vào sẽ mở">
                <select className={selectCls} value={broadcastForm.targetModule} onChange={(e) => setBroadcastForm({ ...broadcastForm, targetModule: e.target.value })}>
                  <option value="library">Giao chỉ tiêu</option>
                  <option value="my-kpi">Thực hiện</option>
                  <option value="team-kpi">Đánh giá & xếp loại</option>
                  <option value="reports">Kết quả & báo cáo</option>
                </select>
              </FormField>
              <FormField label="Nội dung" required>
                <textarea
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm"
                  rows={4}
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  required
                />
              </FormField>
              <Button type="submit" icon={Send} className="w-full">Gửi ngay</Button>
            </form>
          </SectionCard>
        </div>
      )}

      {activeTab === 'sso' && (
        <SectionCard
          className="max-w-3xl"
          title="Đăng nhập một lần"
          icon={KeyRound}
          description="Cán bộ đăng nhập bằng tài khoản email công vụ qua Microsoft 365, Google Workspace hoặc định danh điện tử quốc gia (VNeID), không cần mật khẩu riêng. Hỗ trợ chuẩn SAML 2.0 và OpenID Connect."
          action={<Badge variant="success" dot>Đang hoạt động</Badge>}
        >
          <div className="space-y-4">
            <FormField label="Nhà cung cấp định danh">
              <select className={selectCls} value={ssoConfig.provider} onChange={(e) => setSsoConfig({ ...ssoConfig, provider: e.target.value })}>
                <option value="MICROSOFT_AZURE_AD">Microsoft 365</option>
                <option value="GOOGLE_WORKSPACE">Google Workspace</option>
                <option value="GOV_ID">Định danh điện tử quốc gia (VNeID)</option>
              </select>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Mã tổ chức (Tenant ID)">
                <Input value={ssoConfig.tenantId} onChange={(e) => setSsoConfig({ ...ssoConfig, tenantId: e.target.value })} />
              </FormField>
              <FormField label="Mã ứng dụng (Client ID)">
                <Input value={ssoConfig.clientId} onChange={(e) => setSsoConfig({ ...ssoConfig, clientId: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Địa chỉ cấu hình" hint="Đường dẫn tự động lấy thông tin cấu hình của nhà cung cấp (OIDC Discovery).">
              <Input value={ssoConfig.discoveryUrl} onChange={(e) => setSsoConfig({ ...ssoConfig, discoveryUrl: e.target.value })} />
            </FormField>
            <label className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                Bắt buộc xác thực 2 lớp
                <InfoTip size={13}>Tăng cường bảo mật theo quy định về bảo vệ dữ liệu cá nhân.</InfoTip>
              </span>
              <input
                type="checkbox"
                checked={ssoConfig.twoFactorEnforced}
                onChange={(e) => setSsoConfig({ ...ssoConfig, twoFactorEnforced: e.target.checked })}
                className="w-5 h-5 accent-primary-600"
              />
            </label>
            <div className="flex justify-end">
              <Button icon={CheckCircle2} onClick={() => showToast('Đã lưu cấu hình đăng nhập một lần!')}>Lưu cấu hình</Button>
            </div>
          </div>
        </SectionCard>
      )}

      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <SectionCard title="Tải bản sao lưu" icon={Download} description="Toàn bộ cơ cấu tổ chức, chức danh, thư viện chỉ tiêu, phiếu KPI, minh chứng và nhật ký thao tác.">
            <Button icon={Download} onClick={handleExportBackup} className="w-full">Tải tệp sao lưu</Button>
          </SectionCard>
          <SectionCard title="Khôi phục dữ liệu mẫu" icon={RotateCcw} description="Xóa các thay đổi và đưa hệ thống về bộ dữ liệu mẫu ban đầu.">
            <Button
              variant="danger"
              icon={RotateCcw}
              className="w-full"
              onClick={() => window.confirm('Khôi phục toàn bộ hệ thống về dữ liệu mẫu?') && resetToDefaultData()}
            >
              Khôi phục
            </Button>
          </SectionCard>
        </div>
      )}
    </div>
  );
};
