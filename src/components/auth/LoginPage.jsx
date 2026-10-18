import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  Lock,
  User,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Users,
} from 'lucide-react';

export const LoginPage = () => {
  const { users, login, showToast, systemOperatingMode, setSystemOperatingMode } = useApp();

  const [username, setUsername] = useState('an.nguyen@gov-kpi.vn');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = login(username, password);
      if (!res.success) {
        // notification handled in context
      }
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

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center py-8 px-4 sm:px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans selection:bg-primary-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP: Compact Logo & System Title */}
      <div className="relative z-10 text-center space-y-2 mb-4">
        <div className="inline-flex items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-md shadow-primary-500/20 text-white font-black text-lg tracking-tight border border-white/20">
            KPI
          </div>
          <div className="text-left">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              HỆ THỐNG THÔNG TIN TÁC NGHIỆP
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
                v2.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Nền tảng Quản trị Mục tiêu KPI & Đánh giá Cán bộ
            </p>
          </div>
        </div>
      </div>

      {/* CENTER: Centered Login Card (max-width: 440px) */}
      <div className="relative z-10 w-full max-w-[440px] my-auto bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 backdrop-blur-md space-y-6">
        {/* Form Header */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Cổng Đăng nhập Tác nghiệp
            </div>
            {/* Mode switch */}
            <button
              type="button"
              onClick={() =>
                setSystemOperatingMode(
                  systemOperatingMode === 'GOVERNMENT' ? 'ENTERPRISE' : 'GOVERNMENT'
                )
              }
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              {systemOperatingMode === 'GOVERNMENT' ? '🏛️ Chế độ Nhà nước' : '🏢 Chế độ Doanh nghiệp'}
            </button>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white pt-1">
            Đăng nhập tài khoản
          </h2>
          <p className="text-xs text-slate-400">
            Nhập thông tin xác thực để truy cập hệ thống tác nghiệp.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username / Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Tài khoản / Email tác nghiệp
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="an.nguyen@gov-kpi.vn"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">Mật khẩu</label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-primary-400 hover:text-primary-300 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-primary-500 focus:ring-primary-500 w-3.5 h-3.5"
              />
              <span>Duy trì đăng nhập trên thiết bị này</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang xác thực bảo mật...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập hệ thống</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* QUICK DEMO LOGIN ACCOUNTS */}
        <div className="space-y-2.5 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary-400" />
              Đăng nhập nhanh theo vai trò
            </span>
            <span className="text-[10px] text-slate-500">1-click demo</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {users.slice(0, 4).map((u) => {
              const getRoleBadge = (role) => {
                switch (role) {
                  case 'ADMIN':
                  case 'SYSTEM_ADMIN':
                    return { label: 'Quản trị viên', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
                  case 'EXECUTIVE':
                    return { label: 'Lãnh đạo', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
                  case 'MANAGER':
                  case 'UNIT_HEAD':
                    return { label: 'Trưởng phòng', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
                  case 'HR':
                  case 'HR_OFFICER':
                    return { label: 'Tổ chức Cán bộ', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
                  default:
                    return { label: 'Chuyên viên / NV', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
                }
              };
              const badge = getRoleBadge(u.role || u.roles?.[0]);

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-primary-500/50 text-left transition-all group cursor-pointer"
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700 group-hover:ring-primary-500/50 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-200 group-hover:text-primary-300 truncate">
                      {u.name}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM: Security & Copyright info */}
      <div className="relative z-10 text-center text-xs text-slate-500 pt-4 space-y-1">
        <div className="flex items-center justify-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-primary-400" />
            An toàn cấp độ 3 - Ban Cơ yếu & Bộ TT&TT
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            Mã hóa SSL 256-Bit
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Bản quyền © 2026 KPI OS. Toàn bộ quyền được bảo lưu.
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-primary-400" />
              Khôi phục mật khẩu tài khoản
            </h3>
            <p className="text-xs text-slate-400">
              Nhập địa chỉ email cơ quan của bạn. Hệ thống sẽ gửi mã xác thực OTP 6 số để tạo mật khẩu mới.
            </p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="an.nguyen@gov-kpi.vn"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!forgotEmail) {
                    showToast('Vui lòng nhập email!', 'error');
                    return;
                  }
                  showToast(`Mã OTP đặt lại mật khẩu đã gửi tới ${forgotEmail}! Mật khẩu tạm thời: MatKhau@2026!`);
                  setShowForgotPassword(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 cursor-pointer"
              >
                Gửi mã xác thực
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
