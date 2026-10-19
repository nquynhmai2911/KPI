import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { InfoTip } from '../../ui/InfoTip';
import { ROLE_LABELS, getScopeLabel } from '../../../utils/labels';
import {
  Shield,
  Copy,
  ToggleLeft,
  ToggleRight,
  Check,
  X,
  Search,
  Filter,
  Layers,
  ShieldAlert,
  Info,
  Sparkles,
  Users,
  Lock,
  Plus,
  RotateCcw,
} from 'lucide-react';

export const RbacMatrixTab = () => {
  const {
    rolesConfig,
    permissionsList,
    updateRolePermissions,
    resetRolesToDefault,
    cloneRole,
    toggleRoleActive,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneForm, setCloneForm] = useState({
    sourceRoleCode: 'LINE_MANAGER',
    newRoleCode: '',
    newRoleName: '',
    description: '',
  });

  // Extract unique modules
  const modules = ['ALL', ...new Set(permissionsList.map((p) => p.module))];

  // Filter permissions
  const filteredPermissions = permissionsList.filter((perm) => {
    const matchSearch =
      perm.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      perm.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMod = selectedModule === 'ALL' || perm.module === selectedModule;
    return matchSearch && matchMod;
  });

  // Handle cell toggle
  const handleTogglePermission = (roleCode, permCode) => {
    const role = rolesConfig.find((r) => r.code === roleCode);
    if (!role) return;

    const currentPerms = Array.isArray(role.permissions) ? role.permissions : [];
    const hasPerm = currentPerms.includes(permCode);
    const newPerms = hasPerm
      ? currentPerms.filter((p) => p !== permCode)
      : [...currentPerms, permCode];

    updateRolePermissions(roleCode, newPerms);
  };

  // Handle Clone Role Submission
  const handleCloneSubmit = (e) => {
    e.preventDefault();
    if (!cloneForm.newRoleCode || !cloneForm.newRoleName) {
      showToast('Vui lòng nhập đầy đủ mã và tên vai trò mới!', 'error');
      return;
    }

    const success = cloneRole(
      cloneForm.sourceRoleCode,
      cloneForm.newRoleCode.toUpperCase().trim(),
      cloneForm.newRoleName.trim(),
      cloneForm.description.trim()
    );

    if (success) {
      setShowCloneModal(false);
      setCloneForm({
        sourceRoleCode: 'LINE_MANAGER',
        newRoleCode: '',
        newRoleName: '',
        description: '',
      });
    }
  };

  const activeRolesCount = rolesConfig.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Ma trận phân quyền</h3>
          <Badge variant="success" size="sm">{activeRolesCount}/{rolesConfig.length} vai trò bật</Badge>
          <InfoTip title="Nguyên tắc tách quyền (bắt buộc ở máy chủ)">
            <ol className="list-decimal pl-4 space-y-1">
              <li>Không tự duyệt, tự xếp loại, tự giải quyết khiếu nại của chính mình.</li>
              <li>Người đánh giá phải là cấp trên theo cây tổ chức.</li>
              <li>Quản trị hệ thống không đọc được điểm và nhận xét.</li>
              <li>Thanh tra chỉ được xem, không được sửa dữ liệu.</li>
              <li>Kỳ đã khóa không được sửa; mở khóa phải có lý do và người đứng đầu duyệt.</li>
              <li>Điều chỉnh điểm bắt buộc giải trình tối thiểu 10 ký tự và lưu lịch sử.</li>
            </ol>
          </InfoTip>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={resetRolesToDefault} title="Khôi phục ma trận mặc định">
            Mặc định
          </Button>
          <Button size="sm" icon={Copy} onClick={() => setShowCloneModal(true)}>
            Sao chép vai trò
          </Button>
        </div>
      </div>

      {/* 3. Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm quyền..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedModule(m)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedModule === m
                  ? 'bg-primary-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {m === 'ALL' ? 'Tất cả' : m}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Interactive RBAC Matrix Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 font-bold text-slate-700 dark:text-slate-300 min-w-[240px] sticky left-0 bg-slate-50 dark:bg-slate-800/90 z-10 backdrop-blur-xs">
                  Quyền hạn
                </th>
                {rolesConfig.map((role) => (
                  <th
                    key={role.code}
                    className={`p-3 text-center min-w-[150px] border-l border-slate-200 dark:border-slate-800 transition-colors ${
                      !role.isActive ? 'opacity-50 bg-slate-100/50 dark:bg-slate-950/50' : ''
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {ROLE_LABELS[role.code] || role.name}
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                            role.dataScope === 'ALL'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : role.dataScope === 'UNIT_AND_CHILDREN'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : role.dataScope === 'OWN_UNIT'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {getScopeLabel(role.dataScope)}
                        </span>
                        {/* Toggle active switch */}
                        <button
                          onClick={() => toggleRoleActive(role.code, !role.isActive)}
                          title={role.isActive ? 'Nhấn để tắt vai trò' : 'Nhấn để bật vai trò'}
                          className={`cursor-pointer ${
                            role.isActive ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {role.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPermissions.map((perm) => (
                <tr
                  key={perm.code}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="p-3 sticky left-0 bg-white dark:bg-slate-900 z-10 font-medium">
                    <div className="text-slate-800 dark:text-slate-200 text-xs font-semibold">
                      {perm.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400">{perm.module}</span>
                    </div>
                  </td>

                  {rolesConfig.map((role) => {
                    const perms = Array.isArray(role.permissions) ? role.permissions : [];
                    const hasPerm = perms.includes(perm.code);
                    return (
                      <td
                        key={role.code}
                        className={`p-2 text-center border-l border-slate-100 dark:border-slate-800 ${
                          !role.isActive ? 'opacity-50' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(role.code, perm.code)}
                          disabled={!role.isActive}
                          title={
                            hasPerm
                              ? `Đã cấp: ${perm.name} cho ${role.name}`
                              : `Chưa cấp: ${perm.name} cho ${role.name}`
                          }
                          aria-label={`${role.name}: ${perm.name}`}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer border ${
                            hasPerm
                              ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/20'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-300 dark:text-slate-600'
                          }`}
                        >
                          {hasPerm ? (
                            <Check size={16} strokeWidth={3} className="text-white drop-shadow-xs" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CLONE ROLE MODAL */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Copy className="w-4 h-4 text-primary-600" />
                Sao chép vai trò mới
              </h3>
              <button
                onClick={() => setShowCloneModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloneSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kế thừa quyền từ vai trò gốc <span className="text-rose-500">*</span>
                </label>
                <select
                  value={cloneForm.sourceRoleCode}
                  onChange={(e) =>
                    setCloneForm((prev) => ({ ...prev, sourceRoleCode: e.target.value }))
                  }
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  {rolesConfig.map((r) => (
                    <option key={r.code} value={r.code}>
                      {ROLE_LABELS[r.code] || r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã vai trò (viết liền, không dấu) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: PHO_TRUONG_DON_VI"
                  value={cloneForm.newRoleCode}
                  onChange={(e) =>
                    setCloneForm((prev) => ({ ...prev, newRoleCode: e.target.value }))
                  }
                  required
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg uppercase font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên hiển thị vai trò <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Phó Trưởng đơn vị phụ trách"
                  value={cloneForm.newRoleName}
                  onChange={(e) =>
                    setCloneForm((prev) => ({ ...prev, newRoleName: e.target.value }))
                  }
                  required
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả phạm vi trách nhiệm
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú mục đích sử dụng của vai trò mới này..."
                  value={cloneForm.description}
                  onChange={(e) =>
                    setCloneForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCloneModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Sao chép vai trò
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
