import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AdminAuditLogItem,
  AdminOverviewStats,
  AIConversation,
  LiteratureCard,
  Playlist,
  PresentationScript,
  QueueItem,
  ReadingProgress,
  StudioSettings,
  StudyMaterial,
  Track,
  UserDevice,
  UserProfile,
  VideoItem,
} from '../types/studio';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ntvplwnaldoihuvqcfag.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseClientConfigured = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && SUPABASE_PUBLISHABLE_KEY.length > 15
);

export const supabase: SupabaseClient | null = isSupabaseClientConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'lit_studio_supabase_auth_v3',
      },
    })
  : null;

const LOCAL_PROFILE_KEY = 'lit_studio_user_profile_v3';
const LOCAL_TOKEN_KEY = 'lit_studio_access_token_v3';
const LOCAL_DEVICE_FP_KEY = 'lit_studio_device_fp_v3';

export interface DeviceEnvironmentInfo {
  deviceFingerprint: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  platform: string;
  browser: string;
}

export function getOrCreateDeviceInfo(): DeviceEnvironmentInfo {
  let fp = localStorage.getItem(LOCAL_DEVICE_FP_KEY);
  if (!fp) {
    fp =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `dev-${crypto.randomUUID().slice(0, 12)}`
        : `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(LOCAL_DEVICE_FP_KEY, fp);
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform =
    ua.includes('iPhone') || ua.includes('iPad')
      ? 'iOS / iPadOS'
      : ua.includes('Android')
      ? 'Android'
      : ua.includes('Win')
      ? 'Windows 11 / PC'
      : ua.includes('Mac')
      ? 'macOS'
      : 'Linux / Web';

  const browser =
    ua.includes('Edg/')
      ? 'Microsoft Edge'
      : ua.includes('Chrome/')
      ? 'Google Chrome'
      : ua.includes('Firefox/')
      ? 'Mozilla Firefox'
      : ua.includes('Safari/')
      ? 'Apple Safari'
      : 'Modern Browser';

  const deviceType: 'desktop' | 'mobile' | 'tablet' =
    ua.includes('iPad') || ua.includes('Tablet')
      ? 'tablet'
      : ua.includes('iPhone') || ua.includes('Android') || ua.includes('Mobile')
      ? 'mobile'
      : 'desktop';

  return {
    deviceFingerprint: fp,
    deviceName: `${browser} trên ${platform}`,
    deviceType,
    platform,
    browser,
  };
}

export function getStoredProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed || !parsed.uid || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredProfile(profile: UserProfile, accessToken?: string): void {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    if (accessToken) {
      localStorage.setItem(LOCAL_TOKEN_KEY, accessToken);
    }
  } catch {
    // ignore storage quota errors
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    localStorage.removeItem(LOCAL_TOKEN_KEY);
    // Also clean legacy v2 anonymous keys if present
    localStorage.removeItem('lit_studio_user_profile_v2');
    localStorage.removeItem('lit_studio_access_token_v2');
  } catch {
    // ignore
  }
}

export function getStoredAccessToken(): string {
  try {
    return localStorage.getItem(LOCAL_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Restores an existing authenticated session on page reload.
 * NEVER auto-creates an anonymous account when the user opens the website.
 * Returns null if the user is not logged in or if their session/device was revoked.
 */
export async function restoreAuthenticatedSession(): Promise<{
  profile: UserProfile;
  accessToken: string;
} | null> {
  const existingProfile = getStoredProfile();
  const existingToken = getStoredAccessToken();
  const devInfo = getOrCreateDeviceInfo();

  // 1. Check active Supabase Auth session first if configured
  if (supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user && sessionData.session.user.email) {
        const token = sessionData.session.access_token;
        const res = await fetch(
          `/api/auth/session?deviceFingerprint=${encodeURIComponent(
            devInfo.deviceFingerprint
          )}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.user) {
            saveStoredProfile(data.user, token);
            return { profile: data.user, accessToken: token };
          }
        } else if (res.status === 401) {
          await supabase.auth.signOut();
          clearStoredSession();
          return null;
        }
      }
    } catch {
      // Fallback to stored token check
    }
  }

  // 2. Verify stored token with backend /api/auth/session
  if (existingToken && existingProfile) {
    try {
      const res = await fetch(
        `/api/auth/session?deviceFingerprint=${encodeURIComponent(
          devInfo.deviceFingerprint
        )}`,
        {
          headers: { Authorization: `Bearer ${existingToken}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.user) {
          saveStoredProfile(data.user, existingToken);
          return { profile: data.user, accessToken: existingToken };
        }
      } else if (res.status === 401 || res.status === 403) {
        clearStoredSession();
        return null;
      }
    } catch {
      // Offline mode: preserve valid stored authenticated session
      return {
        profile: { ...existingProfile, syncStatus: 'offline' },
        accessToken: existingToken,
      };
    }
  }

  return null;
}

/**
 * Registers a new user account with Username, Email, Password, and Confirm Password.
 */
export async function registerAccount(params: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  profile?: UserProfile;
  accessToken?: string;
}> {
  const devInfo = getOrCreateDeviceInfo();
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: params.username.trim(),
        email: params.email.trim(),
        password: params.password,
        confirmPassword: params.confirmPassword,
        displayName: params.username.trim(),
        deviceFingerprint: devInfo.deviceFingerprint,
        deviceName: devInfo.deviceName,
        platform: devInfo.platform,
        browser: devInfo.browser,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Đăng ký tài khoản thất bại.' };
    }
    if (data.user && data.accessToken) {
      saveStoredProfile(data.user, data.accessToken);
    }
    return {
      ok: true,
      message: data.message,
      profile: data.user,
      accessToken: data.accessToken,
    };
  } catch {
    return {
      ok: false,
      error: 'Không thể kết nối máy chủ xác thực. Vui lòng kiểm tra kết nối mạng.',
    };
  }
}

/**
 * Logs in using either Email OR Username + Password.
 * Username -> Email resolution happens securely on the backend.
 */
export async function loginAccount(
  identifier: string,
  password: string
): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  profile?: UserProfile;
  accessToken?: string;
}> {
  const devInfo = getOrCreateDeviceInfo();
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifier.trim(),
        password,
        deviceFingerprint: devInfo.deviceFingerprint,
        deviceName: devInfo.deviceName,
        platform: devInfo.platform,
        browser: devInfo.browser,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error:
          data.error ||
          'Tên người dùng/Email hoặc mật khẩu không chính xác.',
      };
    }
    if (data.user && data.accessToken) {
      saveStoredProfile(data.user, data.accessToken);
    }
    return {
      ok: true,
      message: data.message,
      profile: data.user,
      accessToken: data.accessToken,
    };
  } catch {
    return {
      ok: false,
      error: 'Không thể kết nối máy chủ đăng nhập.',
    };
  }
}

/**
 * Changes the authenticated user's password after verifying their currentPassword.
 */
export async function changeAccountPassword(params: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  revokeOtherSessions?: boolean;
}): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  user?: UserProfile;
}> {
  const token = getStoredAccessToken();
  const devInfo = getOrCreateDeviceInfo();
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: params.currentPassword,
        newPassword: params.newPassword,
        confirmNewPassword: params.confirmNewPassword,
        revokeOtherSessions: Boolean(params.revokeOtherSessions),
        currentDeviceFingerprint: devInfo.deviceFingerprint,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error: data.error || 'Không thể cập nhật mật khẩu.',
      };
    }
    if (data.user) {
      saveStoredProfile(data.user, token);
    }
    return {
      ok: true,
      message: data.message,
      user: data.user,
    };
  } catch {
    return {
      ok: false,
      error: 'Lỗi kết nối máy chủ khi cập nhật mật khẩu.',
    };
  }
}

export async function requestPasswordRecovery(
  email: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  if (supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/?reset_password=1`,
      });
      if (!error) {
        return {
          ok: true,
          message: `Đã gửi liên kết khôi phục mật khẩu tới ${email.trim()}. Vui lòng kiểm tra hộp thư.`,
        };
      }
    } catch {
      // Fallback to server route
    }
  }

  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Không thể gửi yêu cầu khôi phục.' };
    }
    return {
      ok: true,
      message: data.message,
    };
  } catch {
    return { ok: false, error: 'Lỗi kết nối khi gửi yêu cầu khôi phục mật khẩu.' };
  }
}

export async function confirmResetPassword(params: {
  email?: string;
  newPassword: string;
  accessToken?: string;
}): Promise<{ ok: boolean; message?: string; error?: string }> {
  if (supabase && params.accessToken) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: params.newPassword,
      });
      if (!error) {
        return {
          ok: true,
          message: 'Đã cập nhật mật khẩu mới thành công!',
        };
      }
    } catch {
      // Fallback to server route
    }
  }

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Không thể đặt lại mật khẩu.' };
    }
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, error: 'Lỗi kết nối khi đặt lại mật khẩu.' };
  }
}

/**
 * Signs out the current user session completely and returns to the Login Gate.
 * Does NOT create any anonymous session.
 */
export async function signOutAccount(): Promise<void> {
  const token = getStoredAccessToken();
  const devInfo = getOrCreateDeviceInfo();
  try {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceFingerprint: devInfo.deviceFingerprint,
        }),
      });
    }
  } catch {
    // ignore network error on logout
  }

  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }

  clearStoredSession();
}

// ============================================================================
// LOGGED-IN DEVICE MANAGEMENT HELPERS
// ============================================================================

export async function fetchUserDevices(uid: string): Promise<UserDevice[]> {
  const devInfo = getOrCreateDeviceInfo();
  const token = getStoredAccessToken();
  try {
    const res = await fetch(`/api/devices/list?uid=${encodeURIComponent(uid)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (data.ok && Array.isArray(data.devices)) {
      return data.devices.map((d: Record<string, unknown>) => ({
        id: String(d.id || ''),
        userId: String(d.userId || d.user_id || uid),
        deviceFingerprint: String(d.device_fingerprint || d.deviceFingerprint || ''),
        deviceName: String(d.device_name || d.deviceName || 'Thiết bị Web'),
        deviceType:
          (d.deviceType as 'desktop' | 'mobile' | 'tablet') ||
          (d.device_type as 'desktop' | 'mobile' | 'tablet') ||
          'desktop',
        platform: String(d.platform || 'Web'),
        browser: String(d.browser || 'Browser'),
        sessionStatus:
          (d.sessionStatus as 'active' | 'revoked' | 'signed_out') ||
          (d.session_status as 'active' | 'revoked' | 'signed_out') ||
          (d.isRevoked || d.is_revoked ? 'revoked' : 'active'),
        isRevoked: Boolean(d.is_revoked ?? d.isRevoked ?? false),
        lastActiveAt: String(
          d.last_active_at || d.lastActiveAt || new Date().toISOString()
        ),
        createdAt: String(d.created_at || d.createdAt || new Date().toISOString()),
        isCurrent:
          String(d.device_fingerprint || d.deviceFingerprint || '') ===
          devInfo.deviceFingerprint,
      }));
    }
  } catch {
    // Fallback current device
  }
  return [
    {
      id: `local-${devInfo.deviceFingerprint}`,
      userId: uid,
      deviceFingerprint: devInfo.deviceFingerprint,
      deviceName: devInfo.deviceName,
      deviceType: devInfo.deviceType,
      platform: devInfo.platform,
      browser: devInfo.browser,
      sessionStatus: 'active',
      isRevoked: false,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isCurrent: true,
    },
  ];
}

export async function revokeUserDevice(
  uid: string,
  deviceId: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const token = getStoredAccessToken();
  try {
    const res = await fetch('/api/devices/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uid, deviceId }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Không thể thu hồi thiết bị.' };
    }
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, error: 'Lỗi kết nối khi thu hồi thiết bị.' };
  }
}

export async function revokeOtherUserDevices(): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
}> {
  const token = getStoredAccessToken();
  const devInfo = getOrCreateDeviceInfo();
  try {
    const res = await fetch('/api/devices/revoke-others', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentDeviceFingerprint: devInfo.deviceFingerprint,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error: data.error || 'Không thể đăng xuất các thiết bị khác.',
      };
    }
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, error: 'Lỗi kết nối khi thu hồi phiên thiết bị.' };
  }
}

// ============================================================================
// TWO-WAY CLOUD WORKSPACE SYNC & SUPABASE REALTIME SUBSCRIPTION
// ============================================================================

export interface CloudWorkspacePayload {
  cards?: LiteratureCard[];
  tracks?: Track[];
  musicCategories?: string[];
  videos?: VideoItem[];
  playlists?: Playlist[];
  scripts?: PresentationScript[];
  queue?: QueueItem[];
  settings?: StudioSettings;
  readingProgress?: Record<string, ReadingProgress>;
  studyMaterials?: StudyMaterial[];
  conversations?: AIConversation[];
  favorites?: string[];
  history?: unknown[];
  syncVersion: number;
  updatedAt: string;
}

export async function pullCloudWorkspace(
  uid: string
): Promise<{ ok: boolean; data?: CloudWorkspacePayload | null }> {
  const token = getStoredAccessToken();
  if (!token) return { ok: false, data: null };
  try {
    const res = await fetch(`/api/user-data?uid=${encodeURIComponent(uid)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (json.ok) {
      return { ok: true, data: json.data || json.workspace || null };
    }
  } catch {
    // offline
  }
  return { ok: false, data: null };
}

export async function pushCloudWorkspace(
  uid: string,
  payload: CloudWorkspacePayload,
  profileUpdate?: { displayName?: string; avatarUrl?: string }
): Promise<{
  ok: boolean;
  action?: string;
  data?: CloudWorkspacePayload;
}> {
  const token = getStoredAccessToken();
  if (!token) return { ok: false };
  try {
    const res = await fetch('/api/user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uid,
        workspace: payload,
        settings: payload.settings,
        profile: profileUpdate,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      return {
        ok: true,
        action: json.action,
        data: json.data,
      };
    }
  } catch {
    // offline
  }
  return { ok: false };
}

/**
 * Subscribes to Supabase Realtime changes on user_workspace_sync for this UID
 * so when Device A updates reading progress, notes, or library items, Device B updates automatically.
 */
export function subscribeWorkspaceRealtime(
  uid: string,
  onRemoteUpdate: () => void
): () => void {
  if (!supabase || !uid) {
    return () => {};
  }
  try {
    const channel = supabase
      .channel(`workspace_sync_${uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_workspace_sync',
          filter: `user_id=eq.${uid}`,
        },
        () => {
          onRemoteUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  } catch {
    return () => {};
  }
}

// ============================================================================
// ADMIN DASHBOARD API HELPERS (RBAC PROTECTED)
// ============================================================================

export interface AdminUserRow {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  accountStatus: 'active' | 'locked';
  isLocked: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  deviceCount: number;
}

export interface AdminSystemSettings {
  maxReqPerMinute: number;
  dailyTokenBudget: number;
  allowNewRegistrations: boolean;
  requireStrongPassword: boolean;
  realtimeSyncEnabled: boolean;
}

export async function fetchAdminOverview(): Promise<{
  ok: boolean;
  stats?: AdminOverviewStats;
  systemSettings?: AdminSystemSettings;
  error?: string;
}> {
  const token = getStoredAccessToken();
  try {
    const res = await fetch('/api/admin/overview', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Không thể tải dữ liệu tổng quan Admin.' };
    }
    return {
      ok: true,
      stats: data.stats,
      systemSettings: data.systemSettings,
    };
  } catch {
    return { ok: false, error: 'Lỗi kết nối máy chủ quản trị.' };
  }
}

export async function fetchAdminUsers(
  q = '',
  status = 'all'
): Promise<{ ok: boolean; users: AdminUserRow[]; error?: string }> {
  const token = getStoredAccessToken();
  try {
    const res = await fetch(
      `/api/admin/users?q=${encodeURIComponent(q)}&status=${encodeURIComponent(
        status
      )}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, users: [], error: data.error };
    }
    return { ok: true, users: data.users || [] };
  } catch {
    return { ok: false, users: [], error: 'Lỗi kết nối khi tải danh sách người dùng.' };
  }
}

export async function toggleAdminUserLock(
  targetUid: string,
  lock: boolean
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const token = getStoredAccessToken();
  try {
    const res = await fetch('/api/admin/users/toggle-lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetUid, lock }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Không thể thay đổi trạng thái khóa.' };
    }
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, error: 'Lỗi kết nối khi khóa/mở khóa tài khoản.' };
  }
}

export async function fetchAdminDevices(
  q = '',
  status = 'all'
): Promise<{ ok: boolean; devices: UserDevice[]; error?: string }> {
  const token = getStoredAccessToken();
  try {
    const res = await fetch(
      `/api/admin/devices?q=${encodeURIComponent(q)}&status=${encodeURIComponent(
        status
      )}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, devices: [], error: data.error };
    }
    return { ok: true, devices: data.devices || [] };
  } catch {
    return { ok: false, devices: [], error: 'Lỗi kết nối khi tải danh sách thiết bị.' };
  }
}

export async function revokeAdminDevice(
  deviceId: string,
  targetUserId?: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const token = getStoredAccessToken();
  try {
    const res = await fetch('/api/admin/devices/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ deviceId, targetUserId }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Không thể thu hồi phiên thiết bị.' };
    }
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, error: 'Lỗi kết nối khi thu hồi thiết bị.' };
  }
}

export async function fetchAdminAuditLogs(): Promise<{
  ok: boolean;
  logs: AdminAuditLogItem[];
  error?: string;
}> {
  const token = getStoredAccessToken();
  try {
    const res = await fetch('/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, logs: [], error: data.error };
    }
    return { ok: true, logs: data.logs || [] };
  } catch {
    return { ok: false, logs: [], error: 'Lỗi kết nối khi tải nhật ký hoạt động.' };
  }
}

export async function updateAdminSystemSettings(
  settings: Partial<AdminSystemSettings>
): Promise<{
  ok: boolean;
  systemSettings?: AdminSystemSettings;
  message?: string;
  error?: string;
}> {
  const token = getStoredAccessToken();
  try {
    const res = await fetch('/api/admin/system-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Không thể lưu cài đặt hệ thống.' };
    }
    return {
      ok: true,
      systemSettings: data.systemSettings,
      message: data.message,
    };
  } catch {
    return { ok: false, error: 'Lỗi kết nối khi lưu cài đặt hệ thống.' };
  }
}
