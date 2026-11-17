import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  ClipboardList,
  Laptop,
  Lock,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Smartphone,
  Tablet,
  Trash2,
  Unlock,
  Users,
} from 'lucide-react';
import {
  AdminAuditLogItem,
  AdminOverviewStats,
  UserDevice,
  UserProfile,
} from '../types/studio';
import {
  AdminSystemSettings,
  AdminUserRow,
  fetchAdminAuditLogs,
  fetchAdminDevices,
  fetchAdminOverview,
  fetchAdminUsers,
  revokeAdminDevice,
  toggleAdminUserLock,
  updateAdminSystemSettings,
} from '../lib/supabase';

interface AdminDashboardViewProps {
  currentAdmin: UserProfile;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentAdmin,
  notify,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'users'
    | 'devices'
    | 'sessions'
    | 'accounts'
    | 'audit'
    | 'ai_usage'
    | 'system'
  >('overview');

  const [stats, setStats] = useState<AdminOverviewStats>({
    totalAccounts: 1,
    activeAccounts: 1,
    lockedAccounts: 0,
    totalDevices: 1,
    activeSessions: 1,
    revokedSessions: 0,
    totalAiRequests: 0,
    totalAiTokens: 0,
  });

  const [systemSettings, setSystemSettings] = useState<AdminSystemSettings>({
    maxReqPerMinute: 15,
    dailyTokenBudget: 500000,
    allowNewRegistrations: true,
    requireStrongPassword: true,
    realtimeSyncEnabled: true,
  });

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceStatusFilter, setDeviceStatusFilter] = useState('all');

  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    const [ovRes, usRes, dvRes, lgRes] = await Promise.all([
      fetchAdminOverview(),
      fetchAdminUsers(userSearch, userStatusFilter),
      fetchAdminDevices(deviceSearch, deviceStatusFilter),
      fetchAdminAuditLogs(),
    ]);

    if (ovRes.ok && ovRes.stats) setStats(ovRes.stats);
    if (ovRes.ok && ovRes.systemSettings) setSystemSettings(ovRes.systemSettings);
    if (usRes.ok) setUsers(usRes.users);
    if (dvRes.ok) setDevices(dvRes.devices);
    if (lgRes.ok) setAuditLogs(lgRes.logs);
    setLoading(false);
  }, [userSearch, userStatusFilter, deviceSearch, deviceStatusFilter]);

  useEffect(() => {
    loadAllAdminData();
  }, [loadAllAdminData]);

  // Security guard: Only role === 'admin' can view this dashboard
  if (currentAdmin.role !== 'admin') {
    return (
      <div className="p-8 rounded-2xl border border-rose-500/40 bg-rose-950/30 text-center space-y-2">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">
          Truy Cập Bị Từ Chối (403 Forbidden)
        </h2>
        <p className="text-xs text-slate-300">
          Khu vực LITERATURE STUDIO ADMIN chỉ dành riêng cho tài khoản Quản trị
          viên.
        </p>
      </div>
    );
  }

  const handleToggleUserLock = async (userRow: AdminUserRow) => {
    const nextLock = !userRow.isLocked;
    const res = await toggleAdminUserLock(userRow.uid, nextLock);
    if (!res.ok) {
      notify(res.error || 'Không thể thay đổi trạng thái tài khoản.', 'error');
      return;
    }
    notify(res.message || 'Đã cập nhật trạng thái tài khoản.');
    loadAllAdminData();
  };

  const handleRevokeDeviceSession = async (dev: UserDevice) => {
    const res = await revokeAdminDevice(dev.id, dev.userId);
    if (!res.ok) {
      notify(res.error || 'Không thể thu hồi phiên thiết bị.', 'error');
      return;
    }
    notify(res.message || 'Đã thu hồi phiên thiết bị.');
    loadAllAdminData();
  };

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateAdminSystemSettings(systemSettings);
    if (!res.ok) {
      notify(res.error || 'Không thể lưu cài đặt hệ thống.', 'error');
      return;
    }
    if (res.systemSettings) setSystemSettings(res.systemSettings);
    notify(res.message || 'Đã lưu cài đặt hệ thống thành công!');
    loadAllAdminData();
  };

  const renderDeviceIcon = (type?: string) => {
    if (type === 'mobile') return <Smartphone className="w-4 h-4 text-[#D4AF37]" />;
    if (type === 'tablet') return <Tablet className="w-4 h-4 text-[#D4AF37]" />;
    return <Laptop className="w-4 h-4 text-[#D4AF37]" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-r from-[#111726] via-[#151D30] to-[#111726] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#D4AF37] text-slate-950 text-[10px] font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            RBAC Role: Admin (@{currentAdmin.username})
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-editorial text-[#F5F2EB]">
            LITERATURE STUDIO <span className="text-[#D4AF37]">ADMIN</span>
          </h1>
          <p className="text-xs text-slate-400">
            Trung tâm quản trị người dùng, giám sát thiết bị, kiểm soát phiên đăng
            nhập, nhật ký bảo mật và hạn mức OpenAI Responses API.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAllAdminData}
          className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e3be42] text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm Mới Dữ Liệu Hệ Thống
        </button>
      </div>

      {/* 8 Admin Module Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          {
            id: 'overview',
            label: '1. Tổng quan',
            icon: <Activity className="w-3.5 h-3.5" />,
          },
          {
            id: 'users',
            label: `2. Quản lý người dùng (${users.length})`,
            icon: <Users className="w-3.5 h-3.5" />,
          },
          {
            id: 'devices',
            label: `3. Quản lý thiết bị (${devices.length})`,
            icon: <Laptop className="w-3.5 h-3.5" />,
          },
          {
            id: 'sessions',
            label: '4. Quản lý phiên đăng nhập',
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          },
          {
            id: 'accounts',
            label: '5. Quản lý tài khoản',
            icon: <Shield className="w-3.5 h-3.5" />,
          },
          {
            id: 'audit',
            label: `6. Nhật ký hoạt động (${auditLogs.length})`,
            icon: <ClipboardList className="w-3.5 h-3.5" />,
          },
          {
            id: 'ai_usage',
            label: '7. Quản lý AI Usage',
            icon: <Bot className="w-3.5 h-3.5" />,
          },
          {
            id: 'system',
            label: '8. Cài đặt hệ thống',
            icon: <Settings className="w-3.5 h-3.5" />,
          },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. TỔNG QUAN (OVERVIEW) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726]">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Tổng số tài khoản
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.totalAccounts}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                Đã xác thực qua hệ thống
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726]">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Tài khoản đang hoạt động
              </div>
              <div className="text-3xl font-bold text-emerald-400 mt-1">
                {stats.activeAccounts}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Trạng thái bình thường
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726]">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Thiết bị đã đăng nhập
              </div>
              <div className="text-3xl font-bold text-[#D4AF37] mt-1">
                {stats.totalDevices}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Desktop, Mobile &amp; Tablet
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726]">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Số phiên đang hoạt động
              </div>
              <div className="text-3xl font-bold text-sky-400 mt-1">
                {stats.activeSessions}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Đã thu hồi: {stats.revokedSessions} phiên
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726]">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Số tài khoản bị khóa
              </div>
              <div className="text-3xl font-bold text-rose-400 mt-1">
                {stats.lockedAccounts}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Vô hiệu hóa đăng nhập
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726]">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Lượt sử dụng AI (OpenAI)
              </div>
              <div className="text-3xl font-bold text-purple-400 mt-1">
                {stats.totalAiRequests}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Tổng token: {stats.totalAiTokens.toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. QUẢN LÝ NGƯỜI DÙNG */}
      {(activeTab === 'users' || activeTab === 'accounts') && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Quản Lý Người Dùng &amp; Phân Quyền Tài Khoản
              </h3>
              <p className="text-xs text-slate-400">
                Tìm kiếm theo tên người dùng, email hoặc UID. Mật khẩu người dùng
                được băm bảo mật tuyệt đối và không bao giờ hiển thị.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Tìm username, email, UID..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white"
                />
              </div>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="locked">Bị khóa</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-3">Người dùng</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">UID</th>
                  <th className="py-3 px-3">Quyền</th>
                  <th className="py-3 px-3">Thiết bị</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      @{u.username}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {u.displayName}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {u.email}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {u.uid.slice(0, 12)}...
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-[#D4AF37] text-slate-950'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {u.deviceCount} thiết bị
                    </td>
                    <td className="py-3 px-3">
                      {u.isLocked ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 text-[10px] font-bold">
                          Đã khóa
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                          Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.uid !== currentAdmin.uid && (
                        <button
                          type="button"
                          onClick={() => handleToggleUserLock(u)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                            u.isLocked
                              ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                          }`}
                        >
                          {u.isLocked ? (
                            <>
                              <Unlock className="w-3 h-3" /> Mở khóa
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" /> Khóa tài khoản
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3 & 4. QUẢN LÝ THIẾT BỊ & PHIÊN ĐĂNG NHẬP TOÀN HỆ THỐNG */}
      {(activeTab === 'devices' || activeTab === 'sessions') && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Giám Sát Toàn Bộ Thiết Bị &amp; Phiên Đăng Nhập
              </h3>
              <p className="text-xs text-slate-400">
                Xem chủ sở hữu, UID, loại thiết bị, thời gian hoạt động gần nhất và
                thu hồi phiên đăng nhập từ xa.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  placeholder="Tìm thiết bị, chủ sở hữu, UID..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white"
                />
              </div>
              <select
                value={deviceStatusFilter}
                onChange={(e) => setDeviceStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white"
              >
                <option value="all">Tất cả phiên</option>
                <option value="active">Đang hoạt động</option>
                <option value="revoked">Đã thu hồi</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5">
            {devices.map((dev) => (
              <div
                key={dev.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                    {renderDeviceIcon(dev.deviceType)}
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {dev.deviceName}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-[#D4AF37]">
                        Chủ sở hữu: @{dev.ownerUsername || 'user'} (
                        {dev.ownerEmail || 'email'})
                      </span>
                      {dev.isRevoked ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] font-bold">
                          Đã thu hồi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                          Đang hoạt động
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      UID: <span className="font-mono">{dev.userId}</span> · Loại:{' '}
                      {dev.deviceType} · Hoạt động gần nhất:{' '}
                      {new Date(dev.lastActiveAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>

                {!dev.isRevoked && (
                  <button
                    type="button"
                    onClick={() => handleRevokeDeviceSession(dev)}
                    className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Thu hồi phiên thiết bị
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. NHẬT KÝ HOẠT ĐỘNG (AUDIT LOGS) */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nhật Ký Hoạt Động Quản Trị (Admin Audit Logs)
          </h3>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400">
              Chưa có bản ghi nhật ký hoạt động nào.
            </p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-mono text-[10px] font-bold">
                        {log.actionType}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Admin: @{log.adminUsername}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      {log.details}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. QUẢN LÝ AI USAGE */}
      {activeTab === 'ai_usage' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
          <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-base">
            <Bot className="w-5 h-5" />
            <h3>Giám Sát Lưu Lượng &amp; Hạn Mức Literature AI (OpenAI)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17]">
              <div className="text-slate-400">Tổng lượt yêu cầu AI</div>
              <div className="text-2xl font-bold text-white mt-1">
                {stats.totalAiRequests} yêu cầu
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17]">
              <div className="text-slate-400">Tổng Token đã sử dụng</div>
              <div className="text-2xl font-bold text-[#D4AF37] mt-1">
                {stats.totalAiTokens.toLocaleString('vi-VN')} tokens
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17]">
              <div className="text-slate-400">Ngân sách Token mỗi ngày</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {systemSettings.dailyTokenBudget.toLocaleString('vi-VN')} tokens
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. CÀI ĐẶT HỆ THỐNG */}
      {activeTab === 'system' && (
        <form
          onSubmit={handleSaveSystemSettings}
          className="max-w-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4"
        >
          <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-base">
            <Settings className="w-5 h-5" />
            <h3>Cấu Hình Quản Trị Hệ Thống</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Giới hạn yêu cầu Literature AI mỗi phút (Rate Limit / user)
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={systemSettings.maxReqPerMinute}
              onChange={(e) =>
                setSystemSettings((prev) => ({
                  ...prev,
                  maxReqPerMinute: Number(e.target.value),
                }))
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Ngân sách Token OpenAI tối đa mỗi ngày
            </label>
            <input
              type="number"
              min={10000}
              step={10000}
              value={systemSettings.dailyTokenBudget}
              onChange={(e) =>
                setSystemSettings((prev) => ({
                  ...prev,
                  dailyTokenBudget: Number(e.target.value),
                }))
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-[#0B0F17] text-xs text-white"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={systemSettings.allowNewRegistrations}
              onChange={(e) =>
                setSystemSettings((prev) => ({
                  ...prev,
                  allowNewRegistrations: e.target.checked,
                }))
              }
              className="rounded border-slate-700 text-[#D4AF37]"
            />
            <span>Cho phép người dùng mới đăng ký tài khoản</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={systemSettings.realtimeSyncEnabled}
              onChange={(e) =>
                setSystemSettings((prev) => ({
                  ...prev,
                  realtimeSyncEnabled: e.target.checked,
                }))
              }
              className="rounded border-slate-700 text-[#D4AF37]"
            />
            <span>Bật đồng bộ 2 chiều thời gian thực (Supabase Realtime)</span>
          </label>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e3be42] text-slate-950 font-bold text-xs cursor-pointer"
          >
            Lưu Cấu Hình Hệ Thống
          </button>
        </form>
      )}
    </div>
  );
};
