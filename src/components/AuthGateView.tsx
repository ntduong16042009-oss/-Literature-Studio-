import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react';
import { UserProfile } from '../types/studio';
import {
  changeAccountPassword,
  confirmResetPassword,
  loginAccount,
  registerAccount,
  requestPasswordRecovery,
} from '../lib/supabase';
import {
  validateEmailAndPassword,
  validatePasswordChangeInput,
  validateRegistrationInput,
} from '../utils/studioLogic';

interface AuthGateViewProps {
  mustChangePasswordUser?: UserProfile | null;
  onAuthenticated: (profile: UserProfile, accessToken: string) => void;
  onPasswordChanged?: (updatedProfile?: UserProfile) => void;
  onSignOutForcedChange?: () => void;
}

export const AuthGateView: React.FC<AuthGateViewProps> = ({
  mustChangePasswordUser,
  onAuthenticated,
  onPasswordChanged,
  onSignOutForcedChange,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(
    () => {
      if (
        typeof window !== 'undefined' &&
        window.location.search.includes('reset_password=1')
      ) {
        return 'reset';
      }
      return 'login';
    }
  );

  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberSession, setRememberSession] = useState(true);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  // Forgot / Reset fields
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  // Forced initial password change fields (for initial Admin login)
  const [forceCurrentPassword, setForceCurrentPassword] = useState('');
  const [forceNewPassword, setForceNewPassword] = useState('');
  const [forceConfirmPassword, setForceConfirmPassword] = useState('');
  const [showForcePass, setShowForcePass] = useState(false);

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clearFeedback = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setErrorMsg('Vui lòng nhập Email hoặc Tên người dùng.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Vui lòng nhập mật khẩu.');
      return;
    }

    setBusy(true);
    const res = await loginAccount(cleanId, loginPassword);
    setBusy(false);

    if (!res.ok || !res.profile || !res.accessToken) {
      setErrorMsg(
        res.error || 'Tên người dùng/Email hoặc mật khẩu không chính xác.'
      );
      return;
    }

    setSuccessMsg(res.message || 'Đăng nhập thành công!');
    onAuthenticated(res.profile, res.accessToken);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const validation = validateRegistrationInput(
      regUsername,
      regEmail,
      regPassword,
      regConfirmPassword
    );
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Thông tin đăng ký chưa hợp lệ.');
      return;
    }

    setBusy(true);
    const res = await registerAccount({
      username: regUsername.trim(),
      email: regEmail.trim(),
      password: regPassword,
      confirmPassword: regConfirmPassword,
    });
    setBusy(false);

    if (!res.ok) {
      setErrorMsg(res.error || 'Đăng ký tài khoản không thành công.');
      return;
    }

    if (res.profile && res.accessToken) {
      setSuccessMsg(res.message || 'Đăng ký tài khoản thành công!');
      onAuthenticated(res.profile, res.accessToken);
    } else {
      setSuccessMsg(
        res.message ||
          'Đăng ký thành công! Vui lòng kiểm tra email hoặc đăng nhập.'
      );
      setMode('login');
      setLoginIdentifier(regUsername.trim());
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const check = validateEmailAndPassword(recoveryEmail);
    if (!check.valid) {
      setErrorMsg(check.error || 'Địa chỉ email không hợp lệ.');
      return;
    }

    setBusy(true);
    const res = await requestPasswordRecovery(recoveryEmail.trim());
    setBusy(false);

    if (!res.ok) {
      setErrorMsg(res.error || 'Không thể gửi email khôi phục mật khẩu.');
      return;
    }

    setSuccessMsg(
      res.message ||
        'Đã gửi hướng dẫn khôi phục mật khẩu tới hộp thư email của bạn.'
    );
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setBusy(true);
    const res = await confirmResetPassword({
      email: recoveryEmail.trim() || undefined,
      newPassword: resetNewPassword,
    });
    setBusy(false);

    if (!res.ok) {
      setErrorMsg(res.error || 'Không thể cập nhật mật khẩu mới.');
      return;
    }

    setSuccessMsg(
      res.message || 'Đặt mật khẩu mới thành công! Vui lòng đăng nhập.'
    );
    setMode('login');
  };

  const handleForcedPasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const check = validatePasswordChangeInput(
      forceCurrentPassword,
      forceNewPassword,
      forceConfirmPassword
    );
    if (!check.valid) {
      setErrorMsg(check.error || 'Thông tin đổi mật khẩu không hợp lệ.');
      return;
    }

    setBusy(true);
    const res = await changeAccountPassword({
      currentPassword: forceCurrentPassword,
      newPassword: forceNewPassword,
      confirmNewPassword: forceConfirmPassword,
      revokeOtherSessions: true,
    });
    setBusy(false);

    if (!res.ok) {
      setErrorMsg(res.error || 'Không thể cập nhật mật khẩu khởi tạo.');
      return;
    }

    setSuccessMsg(
      'Đã đổi mật khẩu khởi tạo thành công! Cơ chế mật khẩu ban đầu đã được vô hiệu hóa.'
    );
    if (onPasswordChanged) {
      onPasswordChanged(res.user);
    }
  };

  // If user logged in with an account that requires mandatory initial password change
  if (mustChangePasswordUser) {
    return (
      <div className="min-h-screen w-screen bg-[#0B0F17] text-[#F5F2EB] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/40 bg-[#111726]/95 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-editorial text-[#F5F2EB]">
              Bắt Buộc Đổi Mật Khẩu Lần Đầu
            </h1>
            <p className="text-xs text-slate-400">
              Tài khoản{' '}
              <span className="text-[#D4AF37] font-semibold">
                {mustChangePasswordUser.username}
              </span>{' '}
              đang sử dụng mật khẩu khởi tạo. Vì lý do bảo mật, vui lòng thiết lập
              mật khẩu mới trước khi truy cập hệ thống.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/60 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/60 text-emerald-200 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleForcedPasswordChangeSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Mật khẩu khởi tạo hiện tại
              </label>
              <div className="relative">
                <input
                  type={showForcePass ? 'text' : 'password'}
                  value={forceCurrentPassword}
                  onChange={(e) => setForceCurrentPassword(e.target.value)}
                  required
                  placeholder="Nhập mật khẩu khởi tạo..."
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowForcePass((v) => !v)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showForcePass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Mật khẩu mới (tối thiểu 6 ký tự)
              </label>
              <input
                type={showForcePass ? 'text' : 'password'}
                value={forceNewPassword}
                onChange={(e) => setForceNewPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu mới an toàn..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Xác nhận mật khẩu mới
              </label>
              <input
                type={showForcePass ? 'text' : 'password'}
                value={forceConfirmPassword}
                onChange={(e) => setForceConfirmPassword(e.target.value)}
                required
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#e3be42] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {busy ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Cập Nhật Mật Khẩu & Vào Hệ Thống
            </button>

            {onSignOutForcedChange && (
              <button
                type="button"
                onClick={onSignOutForcedChange}
                className="w-full py-2 text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                Đăng xuất và quay lại màn hình đăng nhập
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#0B0F17] text-[#F5F2EB] flex flex-col lg:flex-row overflow-y-auto">
      {/* Left Column: Dark Academia Editorial Showcase */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative flex-col justify-between p-12 xl:p-16 border-r border-[#D4AF37]/20 bg-gradient-to-br from-[#0B0F17] via-[#101726] to-[#171E30]">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-[11px] font-semibold tracking-wider uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            Literature Studio · Digital Humanities Platform
          </div>
        </div>

        <div className="max-w-xl space-y-6 my-auto">
          <h1 className="text-4xl xl:text-5xl font-bold font-editorial leading-tight text-[#F5F2EB]">
            Không Gian Văn Học Số &amp;{' '}
            <span className="text-[#D4AF37]">Trí Tuệ Nhân Tạo</span> Học Thuật
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Hệ thống nghiên cứu tác phẩm văn học, điều khiển âm thanh thuyết trình
            chuyên nghiệp với Audio Ducking, trợ lý phân tích chuyên sâu OpenAI
            Responses API và đồng bộ đa thiết bị tự động theo tài khoản thực.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-[#0B0F17]/70 space-y-1.5">
              <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                Đồng Bộ Tự Động Theo UID
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Đăng nhập cùng một tài khoản trên máy tính và điện thoại để tự động
                đồng bộ lịch sử đọc, ghi chú, học liệu và hội thoại AI.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-[#0B0F17]/70 space-y-1.5">
              <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                Bảo Mật Tài Khoản &amp; Thiết Bị
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Quản lý danh sách thiết bị đang đăng nhập, thu hồi phiên từ xa và
                bảo vệ dữ liệu bằng Supabase Row Level Security.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-6">
          <span>Literature Studio Ultimate · Dark Academia Edition</span>
          <span className="text-[#D4AF37]">Supabase Auth · OpenAI Responses API</span>
        </div>
      </div>

      {/* Right Column: Mandatory Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header Brand */}
          <div className="text-center lg:text-left space-y-1.5">
            <div className="inline-flex lg:hidden items-center gap-2 px-3 py-1 rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-semibold uppercase mb-2">
              <BookOpen className="w-3 h-3" />
              Literature Studio
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-[#F5F2EB]">
              {mode === 'login' && 'Đăng Nhập Tài Khoản'}
              {mode === 'register' && 'Đăng Ký Tài Khoản Mới'}
              {mode === 'forgot' && 'Khôi Phục Mật Khẩu'}
              {mode === 'reset' && 'Thiết Lập Mật Khẩu Mới'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'login' &&
                'Đăng nhập bằng Email hoặc Tên người dùng để truy cập không gian văn học của bạn.'}
              {mode === 'register' &&
                'Tạo tài khoản chính thức để lưu trữ và tự động đồng bộ dữ liệu trên mọi thiết bị.'}
              {mode === 'forgot' &&
                'Nhập địa chỉ email đã đăng ký để nhận liên kết đặt lại mật khẩu.'}
              {mode === 'reset' &&
                'Nhập mật khẩu mới của bạn để hoàn tất quá trình khôi phục.'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-[#111726] border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearFeedback();
              }}
              className={`py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                clearFeedback();
              }}
              className={`py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Đăng Ký
            </button>
          </div>

          {/* Status Notifications */}
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/60 text-rose-200 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/60 text-emerald-200 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* A. LOGIN FORM */}
          {mode === 'login' && (
            <form
              onSubmit={handleLoginSubmit}
              className="p-6 rounded-2xl border border-slate-800/90 bg-[#111726]/90 shadow-xl space-y-4"
            >
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-[11px] font-semibold text-slate-300 mb-1.5"
                >
                  Email hoặc Tên người dùng
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Ví dụ: lecongvinh hoặc email@domain.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-[11px] font-semibold text-slate-300"
                  >
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      clearFeedback();
                    }}
                    className="text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    id="login-password"
                    type={showLoginPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn..."
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={showLoginPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    onClick={() => setShowLoginPass((v) => !v)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showLoginPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="rounded border-slate-700 bg-[#0B0F17] text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span>Ghi nhớ phiên đăng nhập an toàn</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#e3be42] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {busy ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                Đăng Nhập Vào Literature Studio
              </button>
            </form>
          )}

          {/* B. REGISTER FORM */}
          {mode === 'register' && (
            <form
              onSubmit={handleRegisterSubmit}
              className="p-6 rounded-2xl border border-slate-800/90 bg-[#111726]/90 shadow-xl space-y-4"
            >
              <div>
                <label
                  htmlFor="reg-username"
                  className="block text-[11px] font-semibold text-slate-300 mb-1.5"
                >
                  Tên người dùng (Username)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    id="reg-username"
                    type="text"
                    autoComplete="username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Ví dụ: nguyenvana (3-32 ký tự, không dấu)"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-[11px] font-semibold text-slate-300 mb-1.5"
                >
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="tenban@email.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-[11px] font-semibold text-slate-300 mb-1.5"
                >
                  Mật khẩu (tối thiểu 6 ký tự)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    id="reg-password"
                    type={showRegPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tạo mật khẩu mạnh..."
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={showRegPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    onClick={() => setShowRegPass((v) => !v)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showRegPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className="block text-[11px] font-semibold text-slate-300 mb-1.5"
                >
                  Nhập lại mật khẩu
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    id="reg-confirm-password"
                    type={showRegPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Nhập lại đúng mật khẩu bên trên..."
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#e3be42] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {busy ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Tạo Tài Khoản &amp; Bắt Đầu Sử Dụng
              </button>
            </form>
          )}

          {/* C. FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form
              onSubmit={handleForgotSubmit}
              className="p-6 rounded-2xl border border-slate-800/90 bg-[#111726]/90 shadow-xl space-y-4"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Email đã đăng ký tài khoản
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="tenban@email.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#e3be42] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {busy ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Gửi Email Khôi Phục Mật Khẩu
              </button>

              <div className="flex items-center justify-between pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearFeedback();
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ← Quay lại Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    clearFeedback();
                  }}
                  className="text-[#D4AF37] hover:underline cursor-pointer"
                >
                  Đặt mật khẩu mới ngay →
                </button>
              </div>
            </form>
          )}

          {/* D. RESET PASSWORD FORM */}
          {mode === 'reset' && (
            <form
              onSubmit={handleResetSubmit}
              className="p-6 rounded-2xl border border-slate-800/90 bg-[#111726]/90 shadow-xl space-y-4"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Email tài khoản
                </label>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="tenban@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Mật khẩu mới (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#e3be42] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {busy ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                Xác Nhận Đặt Mật Khẩu Mới
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  clearFeedback();
                }}
                className="w-full text-center text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                ← Quay lại màn hình Đăng nhập
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
