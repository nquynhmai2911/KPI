import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Landmark,
  Building2,
  Target,
  TrendingUp,
  ClipboardCheck,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { getRoleLabel } from '../../utils/labels';
import { InfoTip } from '../ui/InfoTip';
import { Modal } from '../ui/Modal';

const STEPS = [
  { icon: Target, label: 'Giao chỉ tiêu' },
  { icon: TrendingUp, label: 'Thực hiện' },
  { icon: ClipboardCheck, label: 'Đánh giá' },
  { icon: Award, label: 'Xếp loại' },
];

const inputClass =
  'w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100';

export const LoginPage = () => {
  const { users, login, showToast, systemOperatingMode, setSystemOperatingMode } = useApp();

  const [username, setUsername] = useState('an.nguyen@gov-kpi.vn');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const isGov = systemOperatingMode === 'GOVERNMENT';

  const handleSubmit = (e) => {
    e?.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login(username, password);
    }, 400);
  };

  const handleQuickLogin = (user) => {
    setUsername(user.email);
    setPassword('MatKhau@2026!');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login(user.id, 'MatKhau@2026!');
    }, 300);
  };

  const seenRoles = new Set();
  const quickUsers = users
    .filter((u) => {
      const role = u.roles?.[0] || u.role;
      if (seenRoles.has(role)) return false;
      seenRoles.add(role);
      return true;
    })
    .slice(0, 6);

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center font-bold">KPI</div>
          <div>
            <div className="font-semibold">Hệ thống đánh giá KPI</div>
            <div className="text-sm text-white/70">{isGov ? 'Cơ quan nhà nước' : 'Doanh nghiệp'}</div>
          </div>
        </div>

        <div className="space-y-8">
          <h1 className="text-4xl font-bold leading-tight">
            Giao việc rõ ràng.
            <br />
            Đánh giá công bằng.
          </h1>
          <div className="grid grid-cols-4 gap-3">
            {STEPS.map(({ icon: Icon, label }, i) => (
              <div key={label} className="rounded-2xl bg-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Icon size={22} />
                  <span className="text-xs text-white/60">{i + 1}</span>
                </div>
                <div className="text-sm font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-white/70">
          <ShieldCheck size={16} />
          {isGov ? 'Theo Nghị định 90/2020 và 48/2023' : 'Theo KPI, OKR và đánh giá 360°'}
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center text-sm font-bold">KPI</div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Hệ thống đánh giá KPI</div>
              <div className="text-sm text-slate-500">{isGov ? 'Cơ quan nhà nước' : 'Doanh nghiệp'}</div>
            </div>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Đăng nhập</h2>
              <p className="text-sm text-slate-500 mt-1">Chào mừng bạn quay lại</p>
            </div>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1" role="group" aria-label="Loại hình đơn vị">
              {[
                { value: 'GOVERNMENT', icon: Landmark, label: 'Nhà nước' },
                { value: 'ENTERPRISE', icon: Building2, label: 'Doanh nghiệp' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSystemOperatingMode(value)}
                  title={label}
                  aria-label={label}
                  className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    systemOperatingMode === value
                      ? 'bg-white text-primary-600 shadow-sm dark:bg-slate-900'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email công vụ</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ten@coquan.gov.vn"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="flex items-center gap-1">
                Tài khoản mẫu
                <InfoTip>Bấm vào một tài khoản để đăng nhập ngay với vai trò tương ứng và trải nghiệm quy trình.</InfoTip>
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-primary-700 text-left transition cursor-pointer"
                >
                  <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{u.name}</div>
                    <div className="text-xs text-slate-500 truncate">{getRoleLabel(u.roles?.[0] || u.role)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showForgotPassword}
        size="sm"
        icon={Key}
        title="Khôi phục mật khẩu"
        onClose={() => setShowForgotPassword(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="px-4 h-9 rounded-lg text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                if (!forgotEmail) {
                  showToast('Vui lòng nhập email!', 'error');
                  return;
                }
                showToast(`Đã gửi mã xác thực tới ${forgotEmail}. Mật khẩu tạm thời: MatKhau@2026!`);
                setShowForgotPassword(false);
              }}
              className="px-4 h-9 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 cursor-pointer"
            >
              Gửi mã
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Nhập email công vụ, hệ thống sẽ gửi mã xác thực.</p>
          <input
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="ten@coquan.gov.vn"
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>
      </Modal>
    </div>
  );
};
