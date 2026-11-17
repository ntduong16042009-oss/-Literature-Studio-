import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Shield,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
  User,
  UserCheck,
  WifiOff,
} from 'lucide-react';
import { SyncStateStatus, UserDevice, UserProfile } from '../types/studio';
import {
  changeAccountPassword,
  fetchUserDevices,
  getOrCreateDeviceInfo,
  revokeOtherUserDevices,
  revokeUserDevice,
  saveStoredProfile,
  signOutAccount,
} from '../lib/supabase';
import { validatePasswordChangeInput } from '../utils/studioLogic';

interface AccountAndDeviceViewProps {
  profile: UserProfile;
  accessToken: string;
  syncStatus: SyncStateStatus;
  lastSyncedAt: string | null;
  onProfileChange: (nextProfile: UserProfile, nextToken?: string) => void;
  onTriggerManualSync: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onNavigateAdmin?: () => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AccountAndDeviceView: React.FC<AccountAndDeviceViewProps> = ({
  profile,
  accessToken,
  syncStatus,
  lastSyncedAt,
  onProfileChange,
  onTriggerManualSync,
  onSignOut,
  onNavigateAdmin,
  notify,
}) => {
  const [activeSection, setActiveSection] = useState<
    'profile' | 'password' | 'devices' | 'sync' | 'security'
  >('profile');

  // Personal Profile form state
  const [displayName, setDisplayName] = useState(
    profile.displayName || profile.username
  );
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password form state (Mandatory Section V)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [revokeOthersOnPasswordChange, setRevokeOthersOnPasswordChange] =
    useState(true);
  const [showPass, setShowPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Device Management state (Section VI)
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const currentDeviceInfo = getOrCreateDeviceInfo();

  const loadDevices = useCallback(async () => {
    setLoadingDevices(true);
    const list = await fetchUserDevices(profile.uid);
    setDevices(list);
    setLoadingDevices(false);
  }, [profile.uid]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    setDisplayName(profile.displayName || profile.username);
    setAvatarUrl(profile.avatarUrl || '');
  }, [profile.displayName, profile.username, profile.avatarUrl]);

  const handleSaveProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      notify('Tên hiển thị không được để trống.', 'error');
      return;
    }
    setSavingProfile(true);
    const updated: UserProfile = {
      ...profile,
      displayName: displayName.trim(),
      avatarUrl: avatarUrl.trim(),
    };
    saveStoredProfile(updated, accessToken);
    onProfileChange(updated, accessToken);
    await onTriggerManualSync();
    setSavingProfile(false);
    notify('Đã lưu thông tin hồ sơ cá nhân và đồng bộ lên đám mây!');
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    const validation = validatePasswordChangeInput(
      currentPassword,
      newPassword,
      confirmNewPassword
    );
    if (!validation.valid) {
      setPasswordStatus({
        type: 'error',
        text: validation.error || 'Dữ liệu mật khẩu không hợp lệ.',
      });
      notify(validation.error || 'Dữ liệu mật khẩu không hợp lệ.', 'error');
      return;
    }

    setChangingPassword(true);
    const res = await changeAccountPassword({
      currentPassword,
      newPassword,
      confirmNewPassword,
      revokeOtherSessions: revokeOthersOnPasswordChange,
    });
    setChangingPassword(false);

    if (!res.ok) {
      setPasswordStatus({
        type: 'error',
        text: res.error || 'Không thể cập nhật mật khẩu.',
      });
      notify(res.error || 'Không thể cập nhật mật khẩu.', 'error');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordStatus({
      type: 'success',
      text: res.message || 'Đã cập nhật mật khẩu mới thành công!',
    });
    if (res.user) {
      onProfileChange(res.user, accessToken);
    }
    if (revokeOthersOnPasswordChange) {
      loadDevices();
    }
    notify(res.message || 'Đã cập nhật mật khẩu mới thành công!');
  };

  const handleRevokeDevice = async (deviceId: string) => {
    const res = await revokeUserDevice(profile.uid, deviceId);
    if (!res.ok) {
      notify(res.error || 'Không thể thu hồi thiết bị.', 'error');
      return;
    }
    notify(res.message || 'Đã thu hồi quyền truy cập của thiết bị.');
    loadDevices();
  };

  const handleRevokeAllOtherDevices = async () => {
    const res = await revokeOtherUserDevices();
    if (!res.ok) {
      notify(res.error || 'Không thể đăng xuất các thiết bị khác.', 'error');
      return;
    }
    notify(res.message || 'Đã đăng xuất toàn bộ các thiết bị khác.');
    loadDevices();
  };

  const handleSignOutClick = async () => {
    await signOutAccount();
    await onSignOut();
  };

  const renderDeviceIcon = (type?: string) => {
    if (type === 'mobile') return <Smartphone className="w-4 h-4 text-[#D4AF37]" />;
    if (type === 'tablet') return <Tablet className="w-4 h-4 text-[#D4AF37]" />;
    return <Laptop className="w-4 h-4 text-[#D4AF37]" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Personal Identity Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border-2 border-[#D4AF37] bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] font-bold text-2xl font-editorial shrink-0 overflow-hidden">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                (profile.displayName || profile.username || 'U')
                  .slice(0, 1)
                  .toUpperCase()
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold font-editorial text-slate-900 dark:text-[#F5F2EB]">
                  {profile.displayName || profile.username}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    profile.role === 'admin'
                      ? 'bg-[#D4AF37] text-slate-950'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {profile.role === 'admin'
                    ? 'Quản trị viên (Admin)'
                    : 'Tài khoản Chính thức'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  @{profile.username}
                </span>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {profile.email}
                </span>
                <span>
                  Ngày tạo:{' '}
                  {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                </span>
                <span className="text-emerald-400 font-medium">
                  Trạng thái:{' '}
                  {profile.isLocked ? 'Đang bị khóa' : 'Đang hoạt động'}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                  UID: {profile.uid}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.uid);
                    notify('Đã sao chép UID tài khoản vào bộ nhớ tạm.');
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#D4AF37] text-slate-500 dark:text-slate-300 cursor-pointer"
                  title="Sao chép UID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {profile.role === 'admin' && onNavigateAdmin && (
              <button
                type="button"
                onClick={onNavigateAdmin}
                className="px-3.5 py-2 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#D4AF37] hover:text-slate-950 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Mở Bảng Quản Trị Admin
              </button>
            )}

            <button
              type="button"
              onClick={onTriggerManualSync}
              className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#e4be44] text-slate-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  syncStatus === 'syncing' ? 'animate-spin' : ''
                }`}
              />
              {syncStatus === 'syncing' ? 'Đang đồng bộ...' : 'Đồng Bộ Ngay'}
            </button>

            <button
              type="button"
              onClick={handleSignOutClick}
              className="px-3.5 py-2 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Đăng Xuất
            </button>
          </div>
        </div>

        {/* Live Cloud Sync Status Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {syncStatus === 'offline' ? (
              <WifiOff className="w-4 h-4 text-amber-400" />
            ) : (
              <Cloud className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-slate-600 dark:text-slate-300">
              Trạng thái đồng bộ đa thiết bị theo UID:{' '}
              <strong className="text-slate-900 dark:text-white">
                {syncStatus === 'synced' && 'Đã đồng bộ 2 chiều (Supabase Cloud)'}
                {syncStatus === 'syncing' && 'Đang đồng bộ dữ liệu...'}
                {syncStatus === 'offline' &&
                  'Đang ngoại tuyến (Tự động đồng bộ khi có mạng)'}
                {syncStatus === 'conflict-resolved' &&
                  'Đã hợp nhất phiên bản mới nhất'}
                {syncStatus === 'error' && 'Lỗi kết nối đồng bộ'}
              </strong>
            </span>
          </div>
          {lastSyncedAt && (
            <span className="text-[11px] text-slate-400">
              Cập nhật lần cuối:{' '}
              {new Date(lastSyncedAt).toLocaleTimeString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      {/* Navigation Sub-tabs for the 6 Profile Sections */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          {
            id: 'profile',
            label: '1. Thông tin cá nhân',
            icon: <User className="w-3.5 h-3.5" />,
          },
          {
            id: 'password',
            label: '2. ĐỔI MẬT KHẨU',
            icon: <KeyRound className="w-3.5 h-3.5" />,
          },
          {
            id: 'devices',
            label: `3. Quản lý thiết bị (${
              devices.filter((d) => !d.isRevoked).length
            })`,
            icon: <Laptop className="w-3.5 h-3.5" />,
          },
          {
            id: 'sync',
            label: '4. Cài đặt đồng bộ',
            icon: <Cloud className="w-3.5 h-3.5" />,
          },
          {
            id: 'security',
            label: '5. Bảo mật & Đăng xuất',
            icon: <ShieldCheck className="w-3.5 h-3.5" />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeSection === tab.id
                ? 'bg-[#D4AF37] text-slate-950'
                : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: THÔNG TIN CÁ NHÂN & KHU VỰC ĐỔI MẬT KHẨU NHANH */}
      {activeSection === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveProfileInfo}
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4"
          >
            <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-sm">
              <UserCheck className="w-4 h-4" />
              <h3>Thông Tin Hồ Sơ Cá Nhân</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">
                  Tên người dùng (Username)
                </div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  @{profile.username}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">
                  Địa chỉ Email
                </div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                  {profile.email}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tên hiển thị trên Literature Studio
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Đường dẫn Ảnh đại diện (Avatar URL - Tùy chọn)
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e2be42] text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              {savingProfile
                ? 'Đang lưu hồ sơ...'
                : 'Lưu Thông Tin Hồ Sơ Cá Nhân'}
            </button>
          </form>

          {/* Direct Embedded Change Password Card so it is ALWAYS visible in Profile */}
          <form
            onSubmit={handlePasswordChangeSubmit}
            className="p-6 rounded-2xl border border-[#D4AF37]/40 bg-white dark:bg-[#111726] space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-sm">
                <KeyRound className="w-4 h-4" />
                <h3>ĐỔI MẬT KHẨU TÀI KHOẢN</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {showPass ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Ẩn
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Hiện
                  </>
                )}
              </button>
            </div>

            {passwordStatus && (
              <div
                className={`p-3 rounded-xl text-xs border ${
                  passwordStatus.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-950/50 text-emerald-200'
                    : 'border-rose-500/40 bg-rose-950/50 text-rose-200'
                }`}
              >
                {passwordStatus.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại..."
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mật khẩu mới (tối thiểu 6 ký tự)
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={revokeOthersOnPasswordChange}
                onChange={(e) =>
                  setRevokeOthersOnPasswordChange(e.target.checked)
                }
                className="rounded border-slate-600 text-[#D4AF37] focus:ring-[#D4AF37]"
              />
              <span>Đăng xuất các phiên thiết bị khác sau khi đổi mật khẩu</span>
            </label>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e2be42] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              {changingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>
      )}

      {/* SECTION 2: DEDICATED CHANGE PASSWORD VIEW */}
      {activeSection === 'password' && (
        <div className="max-w-xl p-6 rounded-2xl border border-[#D4AF37]/40 bg-white dark:bg-[#111726] space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-base">
              <KeyRound className="w-5 h-5" />
              <h3>ĐỔI MẬT KHẨU TÀI KHOẢN</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hệ thống kiểm tra mật khẩu hiện tại trước khi cho phép đổi sang mật
              khẩu mới qua Supabase Auth.
            </p>
          </div>

          {passwordStatus && (
            <div
              className={`p-3.5 rounded-xl text-xs border ${
                passwordStatus.type === 'success'
                  ? 'border-emerald-500/40 bg-emerald-950/50 text-emerald-200'
                  : 'border-rose-500/40 bg-rose-950/50 text-rose-200'
              }`}
            >
              {passwordStatus.text}
            </div>
          )}

          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu hiện tại
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang sử dụng..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu mới (ít nhất 6 ký tự, khác mật khẩu cũ)
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Xác nhận mật khẩu mới
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={revokeOthersOnPasswordChange}
                  onChange={(e) =>
                    setRevokeOthersOnPasswordChange(e.target.checked)
                  }
                  className="rounded border-slate-600 text-[#D4AF37]"
                />
                <span>Đăng xuất các phiên khác sau khi đổi mật khẩu</span>
              </label>

              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
              >
                {showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              </button>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#e2be42] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {changingPassword ? 'Đang cập nhật mật khẩu...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>
      )}

      {/* SECTION 3: QUẢN LÝ THIẾT BỊ ĐÃ ĐĂNG NHẬP */}
      {activeSection === 'devices' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Danh Sách Thiết Bị Đã Đăng Nhập Cùng Tài Khoản (@{profile.username})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mọi thiết bị đăng nhập vào cùng tài khoản này đều tự động đồng bộ
                dữ liệu theo UID. Bạn có thể thu hồi quyền truy cập của bất kỳ thiết
                bị nào từ xa.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRevokeAllOtherDevices}
                className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 cursor-pointer"
              >
                Đăng xuất các thiết bị khác
              </button>
              <button
                type="button"
                onClick={loadDevices}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1.5 hover:border-[#D4AF37] cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    loadingDevices ? 'animate-spin' : ''
                  }`}
                />
                Làm mới
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {devices.map((dev) => {
              const isCurrent =
                dev.isCurrent ||
                dev.deviceFingerprint === currentDeviceInfo.deviceFingerprint;
              return (
                <div
                  key={dev.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                      {renderDeviceIcon(dev.deviceType)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {dev.deviceName}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                            Thiết bị hiện tại
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase">
                          {dev.deviceType === 'mobile'
                            ? 'Điện thoại'
                            : dev.deviceType === 'tablet'
                            ? 'Máy tính bảng'
                            : 'Máy tính'}
                        </span>
                        {dev.isRevoked ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 text-[10px] font-bold">
                            Đã thu hồi phiên
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px]">
                            Phiên đang hoạt động
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Nền tảng: {dev.platform} · Trình duyệt: {dev.browser} ·
                        Hoạt động gần nhất:{' '}
                        {new Date(dev.lastActiveAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  {!dev.isRevoked && !isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeDevice(dev.id)}
                      className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Thu hồi thiết bị
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: CÀI ĐẶT ĐỒNG BỘ ĐA THIẾT BỊ TỰ ĐỘNG */}
      {activeSection === 'sync' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
          <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-base">
            <Cloud className="w-5 h-5" />
            <h3>Cơ Chế Tự Động Đồng Bộ Đa Thiết Bị Theo UID</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Hệ thống đồng bộ hoàn toàn tự động thông qua tài khoản và{' '}
            <strong>UID ({profile.uid})</strong> trên Supabase PostgreSQL &amp;
            Supabase Realtime mà không cần bất kỳ mã ghép nối thủ công nào:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] space-y-1">
              <div className="font-bold text-[#D4AF37]">
                1. Tiến độ &amp; Lịch sử đọc
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Vị trí câu thơ, đoạn văn đang đọc dở và phần trăm hoàn thành tác
                phẩm được lưu tự động.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] space-y-1">
              <div className="font-bold text-[#D4AF37]">
                2. Thư viện, Ghi chú &amp; Học liệu
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Thẻ tác phẩm văn học, danh sách yêu thích, Flashcards, câu hỏi ôn
                tập và kịch bản thuyết trình.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] space-y-1">
              <div className="font-bold text-[#D4AF37]">
                3. Hội thoại AI &amp; Cài đặt TTS
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Toàn bộ lịch sử trò chuyện với Literature AI (OpenAI) và cấu hình
                giọng đọc, tốc độ đọc, Audio Ducking.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onTriggerManualSync}
              className="px-4 py-2.5 rounded-xl bg-[#D4AF37] text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  syncStatus === 'syncing' ? 'animate-spin' : ''
                }`}
              />
              Đồng Bộ Dữ Liệu Lên Supabase Cloud Ngay
            </button>
          </div>
        </div>
      )}

      {/* SECTION 5 & 6: BẢO MẬT TÀI KHOẢN & ĐĂNG XUẤT */}
      {activeSection === 'security' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-5">
          <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-base">
            <ShieldCheck className="w-5 h-5" />
            <h3>Bảo Mật Tài Khoản &amp; Quản Lý Phiên</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Xác thực bắt buộc &amp; Row Level Security (RLS)
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Tài khoản ẩn danh đã được vô hiệu hóa hoàn toàn. Mọi truy vấn dữ
                liệu cá nhân đều kiểm tra chính xác <code>auth.uid() = user_id</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[#D4AF37]">
                <Lock className="w-4 h-4" />
                Bảo vệ Mật khẩu &amp; Khóa Phiên Từ Xa
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Bạn có thể đổi mật khẩu bất cứ lúc nào tại mục Đổi Mật Khẩu hoặc
                đăng xuất toàn bộ thiết bị từ xa.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRevokeAllOtherDevices}
              className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 font-semibold text-xs cursor-pointer"
            >
              Đăng xuất tất cả thiết bị khác
            </button>
            <button
              type="button"
              onClick={handleSignOutClick}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Đăng Xuất Khỏi Thiết Bị Này
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
