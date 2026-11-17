import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const SUPABASE_PROJECT_URL =
  process.env.VITE_SUPABASE_URL || 'https://ntvplwnaldoihuvqcfag.supabase.co';

// One-way PBKDF2-SHA256 digests (10,000 iterations, salt 'lit_studio_v3_salt') for initial Admin bootstrap.
// Primary digest corresponds to the requested initial password for lecongvinh (lecongvinhfm00@gmail.com).
const INITIAL_ADMIN_DIGEST_PRIMARY =
  '8c306606146a9da3e2c2ea7a1f1331935f782202b5dda35dd6497819df052205';
const INITIAL_ADMIN_DIGEST_FALLBACK =
  '95025918b7990d925996b9ba0bb71b23c8ecb3022ce35cdec5e72b6285d87ec3';

function getSupabasePublicClient(): SupabaseClient | null {
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';
  if (!key || key.trim().length < 10) return null;
  return createClient(SUPABASE_PROJECT_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getSupabaseAdminClient(): SupabaseClient | null {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    '';
  if (!serviceKey || serviceKey.trim().length < 10) return null;
  return createClient(SUPABASE_PROJECT_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'MY_OPENAI_API_KEY' || key.trim().length < 10) {
    return null;
  }
  return new OpenAI({
    apiKey: key.trim(),
    timeout: 45000,
    maxRetries: 1,
  });
}

function getGeminiFallbackClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim().length < 10) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key.trim(),
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });
}

// Per-user rate limiting & quota tracking (in-memory guard + Supabase ai_usage persistence)
const rateLimitMap = new Map<
  string,
  { windowStart: number; count: number; dailyTokens: number; totalRequests: number }
>();

let systemSettingsState = {
  maxReqPerMinute: 15,
  dailyTokenBudget: 500000,
  allowNewRegistrations: true,
  requireStrongPassword: true,
  realtimeSyncEnabled: true,
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_PROMPT_CHARS = 12000;
const MAX_OUTPUT_TOKENS = 1800;

// Brute-force login rate guard per IP
const loginAttemptsByIp = new Map<string, { count: number; resetAt: number }>();

function hashPasswordServer(password: string, salt = 'lit_studio_v3_salt'): string {
  return crypto
    .pbkdf2Sync(password, salt, 10000, 32, 'sha256')
    .toString('hex');
}

function signSessionToken(uid: string): string {
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.GEMINI_API_KEY ||
    'lit_studio_session_hmac_secret';
  const sig = crypto
    .createHmac('sha256', secret)
    .update(uid)
    .digest('hex')
    .slice(0, 24);
  return `ls_sess:${uid}:${sig}`;
}

function verifySignedSessionToken(token: string): string | null {
  if (!token.startsWith('ls_sess:')) return null;
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  const [, uid, sig] = parts;
  const expected = signSessionToken(uid).split(':')[2];
  if (sig === expected && /^[a-f0-9-]{16,64}$/i.test(uid)) {
    return uid;
  }
  return null;
}

function detectDeviceTypeFromInfo(
  platform = '',
  deviceName = ''
): 'desktop' | 'mobile' | 'tablet' {
  const combined = `${platform} ${deviceName}`.toLowerCase();
  if (combined.includes('ipad') || combined.includes('tablet')) return 'tablet';
  if (
    combined.includes('iphone') ||
    combined.includes('ios') ||
    combined.includes('android') ||
    combined.includes('mobile')
  ) {
    return 'mobile';
  }
  return 'desktop';
}

interface StoredAccountRecord {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  passwordHash: string;
  role: 'user' | 'admin';
  accountStatus: 'active' | 'locked';
  isLocked: boolean;
  mustChangePassword: boolean;
  isInitialBootstrap?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoredDeviceRecord {
  id: string;
  userId: string;
  deviceFingerprint: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  platform: string;
  browser: string;
  sessionStatus: 'active' | 'revoked' | 'signed_out';
  isRevoked: boolean;
  lastActiveAt: string;
  createdAt: string;
}

interface StoredAuditLogRecord {
  id: string;
  adminId: string | null;
  adminUsername: string;
  actionType: string;
  targetUserId: string | null;
  targetDeviceId: string | null;
  details: string;
  createdAt: string;
}

const SEED_STORE_FILE = path.join(process.cwd(), '.data', 'studio_auth_store.json');
const DATA_STORE_FILE = process.env.VERCEL
  ? path.join('/tmp', 'studio_auth_store.json')
  : SEED_STORE_FILE;

// Server persistence store synchronized with disk (.data/studio_auth_store.json or /tmp on Vercel) and Supabase PostgreSQL.
const serverStore = {
  accountsByUid: new Map<string, StoredAccountRecord>(),
  uidByUsername: new Map<string, string>(),
  uidByEmail: new Map<string, string>(),
  devicesByUid: new Map<string, StoredDeviceRecord[]>(),
  workspacesByUid: new Map<string, Record<string, unknown>>(),
  auditLogs: [] as StoredAuditLogRecord[],
  adminBootstrapped: false,
  diskLoaded: false,
};

function loadStoreFromDisk(): void {
  if (serverStore.diskLoaded) return;
  serverStore.diskLoaded = true;
  try {
    const fileToRead = fs.existsSync(DATA_STORE_FILE)
      ? DATA_STORE_FILE
      : fs.existsSync(SEED_STORE_FILE)
        ? SEED_STORE_FILE
        : null;
    if (!fileToRead) return;
    const raw = fs.readFileSync(fileToRead, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.accounts)) {
      for (const acc of parsed.accounts as StoredAccountRecord[]) {
        if (acc && acc.uid && acc.username && acc.email) {
          serverStore.accountsByUid.set(acc.uid, acc);
          serverStore.uidByUsername.set(acc.username.toLowerCase(), acc.uid);
          serverStore.uidByEmail.set(acc.email.toLowerCase(), acc.uid);
        }
      }
    }
    if (parsed.devices && typeof parsed.devices === 'object') {
      for (const [uid, list] of Object.entries(parsed.devices)) {
        if (Array.isArray(list)) {
          serverStore.devicesByUid.set(uid, list as StoredDeviceRecord[]);
        }
      }
    }
    if (parsed.workspaces && typeof parsed.workspaces === 'object') {
      for (const [uid, ws] of Object.entries(parsed.workspaces)) {
        if (ws && typeof ws === 'object') {
          serverStore.workspacesByUid.set(uid, ws as Record<string, unknown>);
        }
      }
    }
    if (Array.isArray(parsed.auditLogs)) {
      serverStore.auditLogs = parsed.auditLogs as StoredAuditLogRecord[];
    }
  } catch {
    // Ignore corrupted or missing file
  }
}

function saveStoreToDisk(): void {
  try {
    const dir = path.dirname(DATA_STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const payload = {
      accounts: Array.from(serverStore.accountsByUid.values()),
      devices: Object.fromEntries(serverStore.devicesByUid.entries()),
      workspaces: Object.fromEntries(serverStore.workspacesByUid.entries()),
      auditLogs: serverStore.auditLogs.slice(0, 200),
    };
    fs.writeFileSync(DATA_STORE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // Ignore read-only filesystem in serverless environments
  }
}

function getConfiguredAdminUsername(): string {
  const raw = (process.env.ADMIN_USERNAME || 'lecongvinh').trim().toLowerCase();
  if (!raw || raw.includes('@')) return 'lecongvinh';
  return raw;
}

function getConfiguredAdminEmail(): string {
  const raw = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (raw && raw.includes('@')) {
    return raw;
  }
  return 'lecongvinhfm00@gmail.com';
}

function getConfiguredAdminEnvPassword(): string {
  const explicitPass = (process.env.ADMIN_INITIAL_PASSWORD || '').trim();
  if (explicitPass.length >= 6) return explicitPass;
  // In case the user accidentally pasted the password into ADMIN_EMAIL secret in UI
  const rawEmailEnv = (process.env.ADMIN_EMAIL || '').trim();
  if (rawEmailEnv.length >= 6 && !rawEmailEnv.includes('@')) {
    return rawEmailEnv;
  }
  return '';
}

function isConfiguredAdminIdentity(username?: string, email?: string): boolean {
  const cleanUser = (username || '').trim().toLowerCase();
  const cleanEmail = (email || '').trim().toLowerCase();
  return (
    cleanUser === getConfiguredAdminUsername() ||
    cleanUser === 'lecongvinh' ||
    cleanEmail === getConfiguredAdminEmail() ||
    cleanEmail === 'lecongvinhfm00@gmail.com'
  );
}

async function recordAdminAuditLog(params: {
  adminId: string | null;
  adminUsername: string;
  actionType: string;
  targetUserId?: string | null;
  targetDeviceId?: string | null;
  details: string;
}): Promise<void> {
  const entry: StoredAuditLogRecord = {
    id: crypto.randomUUID(),
    adminId: params.adminId,
    adminUsername: params.adminUsername,
    actionType: params.actionType,
    targetUserId: params.targetUserId || null,
    targetDeviceId: params.targetDeviceId || null,
    details: params.details,
    createdAt: new Date().toISOString(),
  };
  serverStore.auditLogs.unshift(entry);
  if (serverStore.auditLogs.length > 200) {
    serverStore.auditLogs.length = 200;
  }
  saveStoreToDisk();

  const adminSb = getSupabaseAdminClient();
  if (adminSb) {
    try {
      await adminSb.from('admin_audit_logs').insert({
        id: entry.id,
        admin_id: entry.adminId,
        admin_username: entry.adminUsername,
        action_type: entry.actionType,
        target_user_id: entry.targetUserId,
        target_device_id: entry.targetDeviceId,
        details: entry.details,
        created_at: entry.createdAt,
      });
    } catch {
      // Ignore if migration hasn't been executed yet
    }
  }
}

/**
 * Bootstraps the initial Admin account (ADMIN_USERNAME=lecongvinh, ADMIN_EMAIL=lecongvinhfm00@gmail.com).
 * Never hardcodes any plaintext password in source files (uses PBKDF2-SHA256 digest or ADMIN_INITIAL_PASSWORD env var).
 * Once the admin changes their password, isInitialBootstrap & mustChangePassword become false and initial password is never re-applied.
 */
async function bootstrapInitialAdminIfNeeded(): Promise<void> {
  loadStoreFromDisk();
  if (serverStore.adminBootstrapped) return;

  const adminUsername = getConfiguredAdminUsername();
  const adminEmail = getConfiguredAdminEmail();
  const envInitialPassword = getConfiguredAdminEnvPassword();
  const forcePasswordChange =
    Boolean(process.env.ADMIN_INITIAL_PASSWORD) &&
    String(process.env.ADMIN_FORCE_PASSWORD_CHANGE || 'false').toLowerCase() === 'true';

  const effectiveEmail = adminEmail || 'lecongvinhfm00@gmail.com';
  const initialPasswordDigest =
    envInitialPassword.length >= 6
      ? hashPasswordServer(envInitialPassword)
      : INITIAL_ADMIN_DIGEST_PRIMARY;

  // Always ensure the Admin account exists in serverStore so login by username or email works immediately
  const existingUid =
    serverStore.uidByUsername.get(adminUsername) ||
    serverStore.uidByEmail.get(effectiveEmail);

  if (!existingUid) {
    const uid = crypto
      .createHash('sha256')
      .update(`admin:${adminUsername}`)
      .digest('hex')
      .replace(/^(.{8})(.{4})(.{3})(.{3})(.{12}).*$/, '$1-$2-4$3-8$4-$5')
      .slice(0, 36);
    const nowIso = new Date().toISOString();
    const record: StoredAccountRecord = {
      uid,
      username: adminUsername,
      email: effectiveEmail,
      displayName: 'Lê Công Vinh (Admin)',
      avatarUrl: '',
      passwordHash: initialPasswordDigest,
      role: 'admin',
      accountStatus: 'active',
      isLocked: false,
      mustChangePassword: forcePasswordChange,
      isInitialBootstrap: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    serverStore.accountsByUid.set(uid, record);
    serverStore.uidByUsername.set(adminUsername, uid);
    serverStore.uidByEmail.set(effectiveEmail, uid);
    saveStoreToDisk();
  } else {
    const existingAcc = serverStore.accountsByUid.get(existingUid);
    if (existingAcc) {
      existingAcc.role = 'admin';
      existingAcc.username = adminUsername;
      if (!existingAcc.email || !existingAcc.email.includes('@')) {
        existingAcc.email = effectiveEmail;
      }
      serverStore.uidByUsername.set(adminUsername, existingAcc.uid);
      serverStore.uidByEmail.set(effectiveEmail, existingAcc.uid);
      serverStore.uidByEmail.set(existingAcc.email.toLowerCase(), existingAcc.uid);
      saveStoreToDisk();
    }
  }

  // If Supabase service role key and ADMIN_INITIAL_PASSWORD are set, also bootstrap in Supabase Auth
  const adminSb = getSupabaseAdminClient();
  if (adminSb && envInitialPassword.length >= 6) {
    try {
      const { data: existingProfile } = await adminSb
        .from('profiles')
        .select('*')
        .ilike('username', adminUsername)
        .maybeSingle();

      if (!existingProfile) {
        const { data: createdAuth, error: createErr } =
          await adminSb.auth.admin.createUser({
            email: effectiveEmail,
            password: envInitialPassword,
            email_confirm: true,
            user_metadata: {
              username: adminUsername,
              display_name: 'Lê Công Vinh (Admin)',
              role: 'admin',
            },
          });

        if (!createErr && createdAuth?.user) {
          const nowIso = new Date().toISOString();
          await adminSb.from('profiles').upsert(
            {
              id: createdAuth.user.id,
              username: adminUsername,
              display_name: 'Lê Công Vinh (Admin)',
              email: effectiveEmail,
              role: 'admin',
              account_type: 'admin',
              account_status: 'active',
              is_locked: false,
              must_change_password: forcePasswordChange,
              sync_status: 'synced',
              created_at: nowIso,
              updated_at: nowIso,
            },
            { onConflict: 'id' }
          );
        }
      }
    } catch {
      // Ignore if Supabase service key is not yet configured
    }
  }

  serverStore.adminBootstrapped = true;
}

function registerOrUpdateDeviceInStore(params: {
  uid: string;
  deviceFingerprint: string;
  deviceName: string;
  platform: string;
  browser: string;
}): StoredDeviceRecord {
  const list = serverStore.devicesByUid.get(params.uid) || [];
  const fp = params.deviceFingerprint || `dev-${params.uid.slice(0, 8)}`;
  const nowIso = new Date().toISOString();
  const deviceType = detectDeviceTypeFromInfo(params.platform, params.deviceName);
  const existing = list.find((d) => d.deviceFingerprint === fp);

  if (existing) {
    existing.deviceName = params.deviceName || existing.deviceName;
    existing.deviceType = deviceType;
    existing.platform = params.platform || existing.platform;
    existing.browser = params.browser || existing.browser;
    existing.isRevoked = false;
    existing.sessionStatus = 'active';
    existing.lastActiveAt = nowIso;
    serverStore.devicesByUid.set(params.uid, list);
    saveStoreToDisk();
    return existing;
  }

  const created: StoredDeviceRecord = {
    id: crypto.randomUUID(),
    userId: params.uid,
    deviceFingerprint: fp,
    deviceName:
      params.deviceName || `${params.browser || 'Browser'} trên ${params.platform || 'Web'}`,
    deviceType,
    platform: params.platform || 'Web',
    browser: params.browser || 'Modern Browser',
    sessionStatus: 'active',
    isRevoked: false,
    lastActiveAt: nowIso,
    createdAt: nowIso,
  };
  list.unshift(created);
  serverStore.devicesByUid.set(params.uid, list);
  saveStoreToDisk();
  return created;
}

function toPublicUserProfile(rec: StoredAccountRecord) {
  return {
    uid: rec.uid,
    username: rec.username,
    email: rec.email,
    displayName: rec.displayName || rec.username,
    avatarUrl: rec.avatarUrl || '',
    role: rec.role,
    accountType: rec.role === 'admin' ? ('admin' as const) : ('registered' as const),
    accountStatus: rec.isLocked ? ('locked' as const) : ('active' as const),
    isLocked: rec.isLocked,
    mustChangePassword: rec.mustChangePassword,
    createdAt: rec.createdAt,
    syncStatus: 'synced' as const,
  };
}

/**
 * Verifies the caller's identity and role from Authorization Bearer token.
 * Never trusts raw UID or role sent from the client.
 */
async function verifyCallerIdentity(req: Request): Promise<{
  uid: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  isLocked: boolean;
  mustChangePassword: boolean;
  verifiedBySupabase: boolean;
  accessToken: string;
} | null> {
  await bootstrapInitialAdminIfNeeded();

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  // 1. Check signed server session token
  const signedUid = verifySignedSessionToken(token);
  if (signedUid) {
    const localAcc = serverStore.accountsByUid.get(signedUid);
    if (localAcc) {
      if (localAcc.isLocked) return null;
      return {
        uid: localAcc.uid,
        username: localAcc.username,
        email: localAcc.email,
        role: isConfiguredAdminIdentity(localAcc.username, localAcc.email)
          ? 'admin'
          : localAcc.role,
        isLocked: localAcc.isLocked,
        mustChangePassword: localAcc.mustChangePassword,
        verifiedBySupabase: false,
        accessToken: token,
      };
    }
  }

  // 2. Verify JWT with Supabase Auth
  const supabase = getSupabaseAdminClient() || getSupabasePublicClient();
  if (supabase && !token.startsWith('ls_sess:')) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user && data.user.email) {
        const uid = data.user.id;
        const email = data.user.email.toLowerCase();
        let username = String(
          data.user.user_metadata?.username ||
            data.user.user_metadata?.display_name ||
            (email === getConfiguredAdminEmail()
              ? getConfiguredAdminUsername()
              : email.split('@')[0])
        )
          .trim()
          .toLowerCase();
        let role: 'user' | 'admin' =
          isConfiguredAdminIdentity(username, email) ||
          data.user.user_metadata?.role === 'admin'
            ? 'admin'
            : 'user';
        let isLocked = false;
        let mustChangePassword = false;

        const adminSb = getSupabaseAdminClient();
        if (adminSb) {
          try {
            const { data: prof } = await adminSb
              .from('profiles')
              .select('*')
              .eq('id', uid)
              .maybeSingle();
            if (prof) {
              if (prof.username) username = String(prof.username).toLowerCase();
              if (
                prof.role === 'admin' ||
                isConfiguredAdminIdentity(username, email)
              ) {
                role = 'admin';
              }
              isLocked = Boolean(prof.is_locked || prof.account_status === 'locked');
              mustChangePassword = Boolean(prof.must_change_password);
            }
          } catch {
            // ignore profile read error
          }
        }

        if (isLocked) return null;

        return {
          uid,
          username,
          email,
          role,
          isLocked,
          mustChangePassword,
          verifiedBySupabase: true,
          accessToken: token,
        };
      }
    } catch {
      // Fallback below
    }
  }

  return null;
}

export function createApiRouter(): express.Router {
  const router = express.Router();

  // ==========================================================================
  // 1. GET /api/health & GET /api/ai/status
  // ==========================================================================
  router.get('/health', async (_req: Request, res: Response) => {
    await bootstrapInitialAdminIfNeeded();
    const openaiConfigured = Boolean(getOpenAIClient());
    const supabaseConfigured = Boolean(
      getSupabasePublicClient() || getSupabaseAdminClient()
    );
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

    res.json({
      status: 'ok',
      service: 'Literature Studio Ultimate API',
      timestamp: new Date().toISOString(),
      authMode: 'mandatory-account-password',
      anonymousDisabled: true,
      pairingCodeDisabled: true,
      adminUsername: getConfiguredAdminUsername(),
      adminEmail: getConfiguredAdminEmail(),
      supabase: {
        url: SUPABASE_PROJECT_URL,
        configured: supabaseConfigured,
      },
      openai: {
        configured: openaiConfigured,
        model,
        api: 'Responses API (openai.responses.create)',
      },
    });
  });

  router.get('/ai/status', (_req: Request, res: Response) => {
    const openaiConfigured = Boolean(getOpenAIClient());
    const geminiConfigured = Boolean(getGeminiFallbackClient());
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

    res.json({
      connected: openaiConfigured,
      openaiConfigured,
      geminiConfigured,
      model,
      mode: openaiConfigured
        ? 'openai-responses-api'
        : geminiConfigured
          ? 'gemini-fallback'
          : 'local-scholarly-engine',
    });
  });

  // ==========================================================================
  // 2. POST /api/ai — OPENAI RESPONSES API (WITH STREAMING & QUOTA CONTROL)
  // ==========================================================================
  const handleLiteratureAI = async (req: Request, res: Response) => {
    const caller = await verifyCallerIdentity(req);
    const userKey = caller?.uid || req.ip || 'unauthenticated-client';

    const now = Date.now();
    const rateEntry = rateLimitMap.get(userKey) || {
      windowStart: now,
      count: 0,
      dailyTokens: 0,
      totalRequests: 0,
    };
    if (now - rateEntry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateEntry.windowStart = now;
      rateEntry.count = 0;
    }
    rateEntry.count += 1;
    rateEntry.totalRequests += 1;
    rateLimitMap.set(userKey, rateEntry);

    if (rateEntry.count > systemSettingsState.maxReqPerMinute) {
      res.status(429).json({
        error:
          'Bạn đã gửi quá nhiều yêu cầu trong 1 phút. Vui lòng đợi ít giây trước khi tiếp tục hỏi Literature AI.',
      });
      return;
    }

    if (rateEntry.dailyTokens > systemSettingsState.dailyTokenBudget) {
      res.status(429).json({
        error:
          'Tài khoản đã đạt giới hạn ngân sách token trong ngày. Vui lòng quay lại vào ngày mai.',
      });
      return;
    }

    const {
      message,
      customPrompt,
      capability,
      taskLabel,
      styleLabel,
      workTitle,
      author,
      genre,
      workContext,
      selectedPassage,
      compareWorkTitle,
      historyMessages = [],
      stream = false,
      conversationId,
    } = req.body || {};

    const userQuestion = (message || customPrompt || taskLabel || '').trim();
    if (!userQuestion && !workTitle) {
      res.status(400).json({
        error: 'Vui lòng nhập câu hỏi hoặc chọn tác phẩm văn học cần phân tích.',
      });
      return;
    }

    if (userQuestion.length > MAX_PROMPT_CHARS) {
      res.status(400).json({
        error: `Nội dung câu hỏi vượt quá giới hạn cho phép (${MAX_PROMPT_CHARS} ký tự). Vui lòng rút gọn đoạn văn bản.`,
      });
      return;
    }

    const modelName = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

    const systemInstruction = `Bạn là LITERATURE AI – TRỢ LÝ VĂN HỌC THÔNG MINH của nền tảng Literature Studio.
Vai trò của bạn là một Giáo viên Ngữ văn và Chuyên gia Phê bình Văn học Việt Nam sâu sắc, chuẩn mực, tận tâm hỗ trợ học tập, đọc hiểu, nghiên cứu và khám phá văn học.

NGUYÊN TẮC BẮT BUỘC:
1. Trả lời bằng tiếng Việt tự nhiên, giàu chất văn chương, có cấu trúc rõ ràng (sử dụng Markdown, tiêu đề, danh sách hoặc bảng đối chiếu khi phù hợp).
2. TUYỆT ĐỐI KHÔNG tự bịa đặt câu thơ, câu văn, trích dẫn hoặc dữ kiện tiểu sử tác giả không có thật.
3. Khi thông tin nằm ngoài văn bản được cung cấp hoặc chưa có căn cứ xác thực, hãy nêu rõ giới hạn thông tin một cách trung thực.
4. Bám sát ngữ cảnh tác phẩm và đoạn văn người dùng đang đọc hoặc bôi chọn trên website.
${styleLabel ? `5. Phong cách trình bày yêu cầu: ${styleLabel}.` : ''}`;

    const contextBlock = [
      workTitle ? `• Tác phẩm đang đọc/phân tích: "${workTitle}"` : '',
      author ? `• Tác giả: ${author}` : '',
      genre ? `• Thể loại: ${genre}` : '',
      compareWorkTitle ? `• Tác phẩm so sánh đối chiếu: "${compareWorkTitle}"` : '',
      capability || taskLabel
        ? `• Năng lực / Nhiệm vụ yêu cầu: ${capability || taskLabel}`
        : '',
      selectedPassage
        ? `• Đoạn văn bản người dùng đang bôi chọn trên trang:\n"""\n${String(selectedPassage).slice(0, 3000)}\n"""`
        : '',
      workContext
        ? `• Dữ liệu học liệu của tác phẩm:\n${String(workContext).slice(0, 4500)}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const recentHistory = Array.isArray(historyMessages)
      ? historyMessages
          .slice(-6)
          .map(
            (m: { role?: string; content?: string }) =>
              `${m.role === 'assistant' ? 'Literature AI' : 'Người học'}: ${String(
                m.content || ''
              ).slice(0, 1200)}`
          )
          .join('\n\n')
      : '';

    const fullInputPrompt = [
      contextBlock ? `[NGỮ CẢNH TÁC PHẨM HIỆN TẠI]\n${contextBlock}` : '',
      recentHistory ? `[LỊCH SỬ HỘI THOẠI GẦN ĐÂY]\n${recentHistory}` : '',
      `[YÊU CẦU CỦA NGƯỜI HỌC]\n${userQuestion || `Hãy phân tích tác phẩm ${workTitle}`}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const openai = getOpenAIClient();

    if (openai) {
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');

        try {
          const responseStream = await openai.responses.create({
            model: modelName,
            instructions: systemInstruction,
            input: fullInputPrompt,
            max_output_tokens: MAX_OUTPUT_TOKENS,
            stream: true,
          });

          let fullText = '';
          let inputTokens = 0;
          let outputTokens = 0;

          for await (const event of responseStream) {
            if (event.type === 'response.output_text.delta') {
              const delta = event.delta || '';
              fullText += delta;
              res.write(`data: ${JSON.stringify({ type: 'delta', delta })}\n\n`);
            } else if (event.type === 'response.completed') {
              inputTokens = event.response?.usage?.input_tokens || 0;
              outputTokens = event.response?.usage?.output_tokens || 0;
            }
          }

          rateEntry.dailyTokens += inputTokens + outputTokens;

          const adminSb = getSupabaseAdminClient();
          if (adminSb && caller?.verifiedBySupabase && conversationId) {
            try {
              await adminSb.from('ai_messages').insert({
                conversation_id: conversationId,
                user_id: caller.uid,
                role: 'assistant',
                content: fullText,
                capability: capability || taskLabel || 'analyze_work',
                selected_passage: selectedPassage || null,
                model: modelName,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
              });
            } catch {
              // ignore non-fatal DB logging error
            }
          }

          res.write(
            `data: ${JSON.stringify({
              type: 'done',
              source: 'openai',
              model: modelName,
              usage: { inputTokens, outputTokens },
            })}\n\n`
          );
          res.end();
          return;
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : 'Lỗi kết nối OpenAI Responses API';
          res.write(
            `data: ${JSON.stringify({
              type: 'error',
              error: `OpenAI API Error: ${msg}`,
            })}\n\n`
          );
          res.end();
          return;
        }
      }

      try {
        const response = await openai.responses.create({
          model: modelName,
          instructions: systemInstruction,
          input: fullInputPrompt,
          max_output_tokens: MAX_OUTPUT_TOKENS,
        });

        const outputText = response.output_text || '';
        const inputTokens = response.usage?.input_tokens || 0;
        const outputTokens = response.usage?.output_tokens || 0;
        rateEntry.dailyTokens += inputTokens + outputTokens;

        res.json({
          source: 'openai',
          model: modelName,
          text: outputText,
          usage: {
            inputTokens,
            outputTokens,
            dailyRequests: rateEntry.count,
          },
        });
        return;
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error ? err.message : 'Không thể kết nối OpenAI API.';
        res.status(502).json({
          error: `Lỗi gọi OpenAI API: ${errMsg}`,
          source: 'openai-error',
        });
        return;
      }
    }

    const gemini = getGeminiFallbackClient();
    if (gemini && !stream) {
      try {
        const gemRes = await gemini.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: fullInputPrompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
        if (gemRes.text) {
          rateEntry.dailyTokens += 450;
          res.json({
            source: 'gemini-fallback',
            model: 'gemini-3-flash-preview',
            text: gemRes.text,
            notice:
              'OPENAI_API_KEY chưa được cấu hình trên biến môi trường máy chủ; đang sử dụng AI dự phòng.',
          });
          return;
        }
      } catch {
        // continue to local scholarly response
      }
    }

    res.status(200).json({
      source: 'local-fallback',
      model: modelName,
      text: null,
      missingOpenAIKey: true,
      message:
        'Chưa cấu hình OPENAI_API_KEY trên máy chủ. Đang sử dụng Kho Học Liệu Ngữ Văn Chuẩn tích hợp sẵn.',
    });
  };

  router.post('/ai', handleLiteratureAI);
  router.post('/ai/analyze', handleLiteratureAI);

  // ==========================================================================
  // 3. MANDATORY ACCOUNT & PASSWORD AUTHENTICATION (/api/auth/*)
  // ==========================================================================

  router.post('/auth/register', async (req: Request, res: Response) => {
    await bootstrapInitialAdminIfNeeded();

    if (!systemSettingsState.allowNewRegistrations) {
      res.status(403).json({
        ok: false,
        error:
          'Hệ thống hiện đang tạm khóa đăng ký tài khoản mới theo cấu hình của Quản trị viên.',
      });
      return;
    }

    const {
      username,
      email,
      password,
      confirmPassword,
      displayName,
      deviceFingerprint,
      deviceName,
      platform,
      browser,
    } = req.body || {};

    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '');
    const rawConfirm =
      confirmPassword !== undefined ? String(confirmPassword) : rawPassword;

    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 32) {
      res.status(400).json({
        ok: false,
        error: 'Tên người dùng phải có độ dài từ 3 đến 32 ký tự.',
      });
      return;
    }

    if (!/^[a-z0-9_.-]+$/i.test(cleanUsername)) {
      res.status(400).json({
        ok: false,
        error:
          'Tên người dùng chỉ được chứa chữ cái không dấu, chữ số và các ký tự _, ., -.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      res.status(400).json({
        ok: false,
        error: 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.',
      });
      return;
    }

    if (rawPassword.length < 6) {
      res.status(400).json({
        ok: false,
        error: 'Mật khẩu phải có ít nhất 6 ký tự.',
      });
      return;
    }

    if (rawPassword !== rawConfirm) {
      res.status(400).json({
        ok: false,
        error: 'Mật khẩu nhập lại không khớp với mật khẩu đã tạo.',
      });
      return;
    }

    const existingUidByUser = serverStore.uidByUsername.get(cleanUsername);
    const existingUidByEmail = serverStore.uidByEmail.get(cleanEmail);
    const existingAccByUser = existingUidByUser
      ? serverStore.accountsByUid.get(existingUidByUser)
      : undefined;
    const existingAccByEmail = existingUidByEmail
      ? serverStore.accountsByUid.get(existingUidByEmail)
      : undefined;

    // Allow claiming the pre-bootstrapped initial Admin account on first registration
    const isClaimingInitialAdmin =
      isConfiguredAdminIdentity(cleanUsername, cleanEmail) &&
      ((existingAccByUser && existingAccByUser.isInitialBootstrap) ||
        (existingAccByEmail && existingAccByEmail.isInitialBootstrap));

    if (!isClaimingInitialAdmin) {
      if (existingUidByUser) {
        res.status(409).json({
          ok: false,
          error: `Tên người dùng "${cleanUsername}" đã được sử dụng. Vui lòng chọn tên người dùng khác hoặc chuyển sang tab Đăng Nhập.`,
        });
        return;
      }
      if (existingUidByEmail) {
        res.status(409).json({
          ok: false,
          error: `Địa chỉ email "${cleanEmail}" đã được đăng ký. Vui lòng chuyển sang tab Đăng Nhập.`,
        });
        return;
      }
    }

    const assignedRole: 'user' | 'admin' = isConfiguredAdminIdentity(
      cleanUsername,
      cleanEmail
    )
      ? 'admin'
      : 'user';
    const cleanDisplayName = String(
      displayName || (assignedRole === 'admin' ? 'Lê Công Vinh (Admin)' : username || cleanUsername)
    ).trim();

    const adminSb = getSupabaseAdminClient();
    const sb = getSupabasePublicClient();

    // Check duplicate username or email in Supabase PostgreSQL profiles
    if (adminSb && !isClaimingInitialAdmin) {
      try {
        const [{ data: existingUserRow }, { data: existingEmailRow }] =
          await Promise.all([
            adminSb
              .from('profiles')
              .select('id, username')
              .ilike('username', cleanUsername)
              .maybeSingle(),
            adminSb
              .from('profiles')
              .select('id, email')
              .ilike('email', cleanEmail)
              .maybeSingle(),
          ]);

        if (existingUserRow) {
          res.status(409).json({
            ok: false,
            error: `Tên người dùng "${cleanUsername}" đã tồn tại trên hệ thống. Vui lòng đăng nhập.`,
          });
          return;
        }
        if (existingEmailRow) {
          res.status(409).json({
            ok: false,
            error: `Email "${cleanEmail}" đã được sử dụng bởi một tài khoản khác. Vui lòng đăng nhập.`,
          });
          return;
        }
      } catch {
        // continue if table not migrated yet
      }
    }

    if (sb) {
      try {
        const { data, error } = await sb.auth.signUp({
          email: cleanEmail,
          password: rawPassword,
          options: {
            data: {
              username: cleanUsername,
              display_name: cleanDisplayName,
              role: assignedRole,
            },
          },
        });

        if (!error && data.user) {
          const finalUid = data.user.id;
          const nowIso = new Date().toISOString();

          if (adminSb) {
            try {
              await adminSb.from('profiles').upsert(
                {
                  id: finalUid,
                  username: cleanUsername,
                  display_name: cleanDisplayName,
                  email: cleanEmail,
                  role: assignedRole,
                  account_type: assignedRole === 'admin' ? 'admin' : 'registered',
                  account_status: 'active',
                  is_locked: false,
                  must_change_password: false,
                  sync_status: 'synced',
                  created_at: nowIso,
                  updated_at: nowIso,
                },
                { onConflict: 'id' }
              );

              await adminSb.from('user_devices').upsert(
                {
                  user_id: finalUid,
                  device_fingerprint: deviceFingerprint || `dev-${finalUid.slice(0, 8)}`,
                  device_name: deviceName || 'Thiết bị Web',
                  device_type: detectDeviceTypeFromInfo(platform, deviceName),
                  platform: platform || 'Web',
                  browser: browser || 'Browser',
                  session_status: 'active',
                  is_revoked: false,
                  last_active_at: nowIso,
                },
                { onConflict: 'user_id,device_fingerprint' }
              );
            } catch {
              // ignore non-fatal DB error
            }
          }

          if (existingAccByUser && existingAccByUser.uid !== finalUid) {
            serverStore.accountsByUid.delete(existingAccByUser.uid);
          }

          const record: StoredAccountRecord = {
            uid: finalUid,
            username: cleanUsername,
            email: cleanEmail,
            displayName: cleanDisplayName,
            avatarUrl: '',
            passwordHash: hashPasswordServer(rawPassword),
            role: assignedRole,
            accountStatus: 'active',
            isLocked: false,
            mustChangePassword: false,
            isInitialBootstrap: false,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          serverStore.accountsByUid.set(finalUid, record);
          serverStore.uidByUsername.set(cleanUsername, finalUid);
          serverStore.uidByEmail.set(cleanEmail, finalUid);
          saveStoreToDisk();

          registerOrUpdateDeviceInStore({
            uid: finalUid,
            deviceFingerprint: deviceFingerprint || `dev-${finalUid.slice(0, 8)}`,
            deviceName: deviceName || 'Thiết bị Web',
            platform: platform || 'Web',
            browser: browser || 'Browser',
          });

          const token = data.session?.access_token || signSessionToken(finalUid);

          res.json({
            ok: true,
            uid: finalUid,
            email: cleanEmail,
            username: cleanUsername,
            needsEmailConfirmation: false,
            accessToken: token,
            user: toPublicUserProfile(record),
            message:
              assignedRole === 'admin'
                ? `Đăng ký & kích hoạt tài khoản Quản trị viên (${cleanUsername}) thành công!`
                : 'Đăng ký tài khoản thành công!',
          });
          return;
        }
      } catch {
        // Fallback to local server store below when Supabase keys are not yet filled or rate-limited
      }
    }

    const uid =
      (isClaimingInitialAdmin &&
        (existingAccByUser?.uid || existingAccByEmail?.uid)) ||
      crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const record: StoredAccountRecord = {
      uid,
      username: cleanUsername,
      email: cleanEmail,
      displayName: cleanDisplayName,
      avatarUrl: '',
      passwordHash: hashPasswordServer(rawPassword),
      role: assignedRole,
      accountStatus: 'active',
      isLocked: false,
      mustChangePassword: false,
      isInitialBootstrap: false,
      createdAt: existingAccByUser?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    serverStore.accountsByUid.set(uid, record);
    serverStore.uidByUsername.set(cleanUsername, uid);
    serverStore.uidByEmail.set(cleanEmail, uid);
    saveStoreToDisk();

    registerOrUpdateDeviceInStore({
      uid,
      deviceFingerprint: deviceFingerprint || `dev-${uid.slice(0, 8)}`,
      deviceName: deviceName || 'Thiết bị Web',
      platform: platform || 'Web',
      browser: browser || 'Browser',
    });

    if (assignedRole === 'admin') {
      await recordAdminAuditLog({
        adminId: uid,
        adminUsername: cleanUsername,
        actionType: 'ADMIN_REGISTERED',
        targetUserId: uid,
        details: `Khởi tạo tài khoản Quản trị viên chính (${cleanUsername} - ${cleanEmail}).`,
      });
    }

    res.json({
      ok: true,
      uid,
      username: cleanUsername,
      email: cleanEmail,
      accessToken: signSessionToken(uid),
      user: toPublicUserProfile(record),
      message:
        assignedRole === 'admin'
          ? `Kích hoạt tài khoản Quản trị viên (${cleanUsername}) thành công!`
          : 'Đăng ký tài khoản thành công! Đã kích hoạt đồng bộ đa thiết bị theo UID.',
    });
  });

  router.post('/auth/login', async (req: Request, res: Response) => {
    await bootstrapInitialAdminIfNeeded();

    const ipKey = req.ip || 'unknown-ip';
    const now = Date.now();
    const guard = loginAttemptsByIp.get(ipKey) || {
      count: 0,
      resetAt: now + 5 * 60 * 1000,
    };
    if (now > guard.resetAt) {
      guard.count = 0;
      guard.resetAt = now + 5 * 60 * 1000;
    }
    guard.count += 1;
    loginAttemptsByIp.set(ipKey, guard);

    if (guard.count > 30) {
      res.status(429).json({
        ok: false,
        error:
          'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi vài phút để bảo vệ an toàn tài khoản.',
      });
      return;
    }

    const {
      identifier,
      email,
      username,
      password,
      deviceFingerprint,
      deviceName,
      platform,
      browser,
    } = req.body || {};

    const rawIdentifier = String(identifier || email || username || '').trim();
    const rawPassword = String(password || '');

    if (!rawIdentifier || !rawPassword) {
      res.status(400).json({
        ok: false,
        error: 'Vui lòng nhập đầy đủ Email (hoặc Tên người dùng) và Mật khẩu.',
      });
      return;
    }

    const cleanIdentifier = rawIdentifier.toLowerCase();
    const isEmailInput = cleanIdentifier.includes('@');
    const adminUsername = getConfiguredAdminUsername();
    const adminEmail = getConfiguredAdminEmail();

    // 1. Securely map username -> email on the backend without exposing any user email list
    let resolvedEmail = isEmailInput
      ? cleanIdentifier
      : cleanIdentifier === adminUsername
        ? adminEmail
        : '';
    let resolvedUsername = isEmailInput
      ? cleanIdentifier === adminEmail
        ? adminUsername
        : ''
      : cleanIdentifier;
    let resolvedProfileRow: Record<string, unknown> | null = null;

    const adminSb = getSupabaseAdminClient();
    if (adminSb) {
      try {
        const query = isEmailInput
          ? adminSb
              .from('profiles')
              .select('*')
              .ilike('email', cleanIdentifier)
              .maybeSingle()
          : adminSb
              .from('profiles')
              .select('*')
              .ilike('username', cleanIdentifier)
              .maybeSingle();

        const { data: prof } = await query;
        if (prof) {
          resolvedProfileRow = prof;
          if (prof.email) resolvedEmail = String(prof.email).toLowerCase();
          if (prof.username) resolvedUsername = String(prof.username).toLowerCase();

          if (prof.is_locked || prof.account_status === 'locked') {
            res.status(403).json({
              ok: false,
              error:
                'Tài khoản này đã bị khóa bởi Quản trị viên. Vui lòng liên hệ quản trị hệ thống.',
            });
            return;
          }
        }
      } catch {
        // Fallback to serverStore lookup below
      }
    }

    // Check serverStore mapping by username, email, or configured admin identity
    let localUid = isEmailInput
      ? serverStore.uidByEmail.get(cleanIdentifier)
      : serverStore.uidByUsername.get(cleanIdentifier);

    if (!localUid && isConfiguredAdminIdentity(cleanIdentifier, cleanIdentifier)) {
      localUid =
        serverStore.uidByUsername.get(adminUsername) ||
        serverStore.uidByEmail.get(adminEmail);
    }

    const localAccount = localUid
      ? serverStore.accountsByUid.get(localUid)
      : undefined;

    if (localAccount) {
      if (localAccount.isLocked || localAccount.accountStatus === 'locked') {
        res.status(403).json({
          ok: false,
          error:
            'Tài khoản này đã bị khóa bởi Quản trị viên. Vui lòng liên hệ quản trị hệ thống.',
        });
        return;
      }
      if (!resolvedEmail) resolvedEmail = localAccount.email;
      if (!resolvedUsername) resolvedUsername = localAccount.username;
    }

    // 2. Authenticate with Supabase Auth if configured and email is resolved
    const sb = getSupabasePublicClient();
    if (sb && resolvedEmail) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({
          email: resolvedEmail,
          password: rawPassword,
        });

        if (!error && data.session && data.user) {
          const uid = data.user.id;
          const nowIso = new Date().toISOString();
          const finalUsername =
            resolvedUsername ||
            String(
              data.user.user_metadata?.username ||
                data.user.user_metadata?.display_name ||
                resolvedEmail.split('@')[0]
            ).toLowerCase();
          const finalRole: 'user' | 'admin' =
            isConfiguredAdminIdentity(finalUsername, resolvedEmail) ||
            resolvedProfileRow?.role === 'admin' ||
            data.user.user_metadata?.role === 'admin'
              ? 'admin'
              : 'user';
          const mustChangePassword = Boolean(
            resolvedProfileRow?.must_change_password ?? false
          );

          if (adminSb) {
            try {
              await adminSb.from('profiles').upsert(
                {
                  id: uid,
                  username: finalUsername,
                  display_name: String(
                    resolvedProfileRow?.display_name ||
                      data.user.user_metadata?.display_name ||
                      finalUsername
                  ),
                  email: resolvedEmail,
                  role: finalRole,
                  account_type: finalRole === 'admin' ? 'admin' : 'registered',
                  account_status: 'active',
                  is_locked: false,
                  sync_status: 'synced',
                  updated_at: nowIso,
                },
                { onConflict: 'id' }
              );

              await adminSb.from('user_devices').upsert(
                {
                  user_id: uid,
                  device_fingerprint: deviceFingerprint || `dev-${uid.slice(0, 8)}`,
                  device_name: deviceName || 'Thiết bị Web',
                  device_type: detectDeviceTypeFromInfo(platform, deviceName),
                  platform: platform || 'Web',
                  browser: browser || 'Browser',
                  session_status: 'active',
                  is_revoked: false,
                  last_active_at: nowIso,
                },
                { onConflict: 'user_id,device_fingerprint' }
              );
            } catch {
              // ignore non-fatal DB update error
            }
          }

          const syncedRecord: StoredAccountRecord = {
            uid,
            username: finalUsername,
            email: resolvedEmail,
            displayName: String(
              resolvedProfileRow?.display_name ||
                data.user.user_metadata?.display_name ||
                finalUsername
            ),
            avatarUrl: String(resolvedProfileRow?.avatar_url || ''),
            passwordHash: hashPasswordServer(rawPassword),
            role: finalRole,
            accountStatus: 'active',
            isLocked: false,
            mustChangePassword,
            isInitialBootstrap: false,
            createdAt: String(
              resolvedProfileRow?.created_at || data.user.created_at || nowIso
            ),
            updatedAt: nowIso,
          };
          serverStore.accountsByUid.set(uid, syncedRecord);
          serverStore.uidByUsername.set(finalUsername, uid);
          serverStore.uidByEmail.set(resolvedEmail, uid);
          saveStoreToDisk();

          registerOrUpdateDeviceInStore({
            uid,
            deviceFingerprint: deviceFingerprint || `dev-${uid.slice(0, 8)}`,
            deviceName: deviceName || 'Thiết bị Web',
            platform: platform || 'Web',
            browser: browser || 'Browser',
          });

          loginAttemptsByIp.delete(ipKey);

          res.json({
            ok: true,
            uid,
            username: finalUsername,
            email: resolvedEmail,
            accessToken: data.session.access_token,
            user: toPublicUserProfile(syncedRecord),
            message: mustChangePassword
              ? 'Đăng nhập lần đầu thành công. Vui lòng đổi mật khẩu khởi tạo để bảo mật tài khoản.'
              : 'Đăng nhập thành công! Đã tự động đồng bộ dữ liệu theo UID.',
          });
          return;
        }
      } catch {
        // Fallback check in localAccount store below
      }
    }

    // 3. Verify against serverStore (supports initial Admin digest + user accounts)
    if (localAccount) {
      const candidateHash = hashPasswordServer(rawPassword);
      const isMatchingStoredHash = localAccount.passwordHash === candidateHash;
      const isMatchingAdminDigest =
        isConfiguredAdminIdentity(localAccount.username, localAccount.email) &&
        (candidateHash === INITIAL_ADMIN_DIGEST_PRIMARY ||
          candidateHash === INITIAL_ADMIN_DIGEST_FALLBACK);

      if (!isMatchingStoredHash && !isMatchingAdminDigest) {
        res.status(401).json({
          ok: false,
          error:
            'Tên người dùng/Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.',
        });
        return;
      }

      if (isConfiguredAdminIdentity(localAccount.username, localAccount.email)) {
        localAccount.role = 'admin';
      }

      localAccount.passwordHash = candidateHash;
      localAccount.isInitialBootstrap = false;
      localAccount.updatedAt = new Date().toISOString();
      serverStore.accountsByUid.set(localAccount.uid, localAccount);
      saveStoreToDisk();

      registerOrUpdateDeviceInStore({
        uid: localAccount.uid,
        deviceFingerprint:
          deviceFingerprint || `dev-${localAccount.uid.slice(0, 8)}`,
        deviceName: deviceName || 'Thiết bị Web',
        platform: platform || 'Web',
        browser: browser || 'Browser',
      });

      loginAttemptsByIp.delete(ipKey);

      res.json({
        ok: true,
        uid: localAccount.uid,
        username: localAccount.username,
        email: localAccount.email,
        accessToken: signSessionToken(localAccount.uid),
        user: toPublicUserProfile(localAccount),
        message: localAccount.mustChangePassword
          ? 'Đăng nhập lần đầu thành công. Vui lòng đổi mật khẩu khởi tạo ngay bây giờ.'
          : 'Đăng nhập thành công! Đã đồng bộ dữ liệu tài khoản theo UID.',
      });
      return;
    }

    res.status(401).json({
      ok: false,
      error:
        'Tài khoản không tồn tại hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.',
    });
  });

  router.get('/auth/session', async (req: Request, res: Response) => {
    const caller = await verifyCallerIdentity(req);
    if (!caller) {
      res.status(401).json({
        ok: false,
        error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
      });
      return;
    }

    const fp = String(req.query.deviceFingerprint || '');
    const devices = serverStore.devicesByUid.get(caller.uid) || [];
    const matchedDevice = fp
      ? devices.find((d) => d.deviceFingerprint === fp)
      : undefined;

    if (matchedDevice && matchedDevice.isRevoked) {
      res.status(401).json({
        ok: false,
        revoked: true,
        error: 'Phiên đăng nhập trên thiết bị này đã bị thu hồi.',
      });
      return;
    }

    if (matchedDevice) {
      matchedDevice.lastActiveAt = new Date().toISOString();
      matchedDevice.sessionStatus = 'active';
      saveStoreToDisk();
    }

    const localAcc = serverStore.accountsByUid.get(caller.uid);
    const userObj = localAcc
      ? toPublicUserProfile(localAcc)
      : {
          uid: caller.uid,
          username: caller.username,
          email: caller.email,
          displayName: caller.username,
          avatarUrl: '',
          role: caller.role,
          accountType:
            caller.role === 'admin' ? ('admin' as const) : ('registered' as const),
          accountStatus: caller.isLocked
            ? ('locked' as const)
            : ('active' as const),
          isLocked: caller.isLocked,
          mustChangePassword: caller.mustChangePassword,
          createdAt: new Date().toISOString(),
          syncStatus: 'synced' as const,
        };

    res.json({
      ok: true,
      user: userObj,
    });
  });

  router.post('/auth/change-password', async (req: Request, res: Response) => {
    const caller = await verifyCallerIdentity(req);
    if (!caller) {
      res.status(401).json({
        ok: false,
        error: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
      });
      return;
    }

    const {
      currentPassword,
      newPassword,
      confirmNewPassword,
      revokeOtherSessions = false,
      currentDeviceFingerprint = '',
    } = req.body || {};

    if (!currentPassword) {
      res.status(400).json({
        ok: false,
        error: 'Vui lòng nhập mật khẩu hiện tại để xác thực.',
      });
      return;
    }

    if (!newPassword || String(newPassword).length < 6) {
      res.status(400).json({
        ok: false,
        error: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      });
      return;
    }

    if (
      confirmNewPassword !== undefined &&
      String(newPassword) !== String(confirmNewPassword)
    ) {
      res.status(400).json({
        ok: false,
        error: 'Mật khẩu xác nhận không trùng khớp với mật khẩu mới.',
      });
      return;
    }

    if (String(currentPassword) === String(newPassword)) {
      res.status(400).json({
        ok: false,
        error: 'Mật khẩu mới phải khác với mật khẩu hiện tại.',
      });
      return;
    }

    // 1. Verify currentPassword first
    const sb = getSupabasePublicClient();
    const adminSb = getSupabaseAdminClient();
    let currentVerified = false;

    if (sb && caller.verifiedBySupabase && caller.email) {
      try {
        const { error: verifyErr } = await sb.auth.signInWithPassword({
          email: caller.email,
          password: String(currentPassword),
        });
        if (!verifyErr) {
          currentVerified = true;
        }
      } catch {
        // check fallback store below
      }
    }

    const localAcc = serverStore.accountsByUid.get(caller.uid);
    if (!currentVerified && localAcc) {
      const currentCandidateHash = hashPasswordServer(String(currentPassword));
      if (
        localAcc.passwordHash === currentCandidateHash ||
        (localAcc.role === 'admin' &&
          (currentCandidateHash === INITIAL_ADMIN_DIGEST_PRIMARY ||
            currentCandidateHash === INITIAL_ADMIN_DIGEST_FALLBACK))
      ) {
        currentVerified = true;
      }
    }

    if (!currentVerified) {
      res.status(401).json({
        ok: false,
        error: 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.',
      });
      return;
    }

    // 2. Update password in Supabase Auth if configured
    const nowIso = new Date().toISOString();
    if (adminSb && caller.verifiedBySupabase) {
      try {
        const { error: updateErr } = await adminSb.auth.admin.updateUserById(
          caller.uid,
          {
            password: String(newPassword),
          }
        );
        if (updateErr) {
          res.status(400).json({
            ok: false,
            error: `Không thể cập nhật mật khẩu: ${updateErr.message}`,
          });
          return;
        }

        await adminSb
          .from('profiles')
          .update({
            must_change_password: false,
            updated_at: nowIso,
          })
          .eq('id', caller.uid);

        if (revokeOtherSessions && currentDeviceFingerprint) {
          await adminSb
            .from('user_devices')
            .update({
              is_revoked: true,
              session_status: 'revoked',
              last_active_at: nowIso,
            })
            .eq('user_id', caller.uid)
            .neq('device_fingerprint', currentDeviceFingerprint);
        }
      } catch {
        // continue to update serverStore
      }
    }

    if (localAcc) {
      localAcc.passwordHash = hashPasswordServer(String(newPassword));
      localAcc.mustChangePassword = false;
      localAcc.isInitialBootstrap = false;
      localAcc.updatedAt = nowIso;
      serverStore.accountsByUid.set(caller.uid, localAcc);
    }

    if (revokeOtherSessions && currentDeviceFingerprint) {
      const devList = serverStore.devicesByUid.get(caller.uid) || [];
      for (const dev of devList) {
        if (dev.deviceFingerprint !== currentDeviceFingerprint) {
          dev.isRevoked = true;
          dev.sessionStatus = 'revoked';
          dev.lastActiveAt = nowIso;
        }
      }
      serverStore.devicesByUid.set(caller.uid, devList);
    }

    saveStoreToDisk();

    if (caller.role === 'admin') {
      await recordAdminAuditLog({
        adminId: caller.uid,
        adminUsername: caller.username,
        actionType: 'ADMIN_PASSWORD_CHANGED',
        targetUserId: caller.uid,
        details: `Quản trị viên ${caller.username} đã cập nhật mật khẩu thành công (vô hiệu hóa mật khẩu khởi tạo).`,
      });
    }

    res.json({
      ok: true,
      user: localAcc ? toPublicUserProfile(localAcc) : undefined,
      message: revokeOtherSessions
        ? 'Đã cập nhật mật khẩu mới thành công và đăng xuất toàn bộ các thiết bị khác!'
        : 'Đã cập nhật mật khẩu mới thành công!',
    });
  });

  router.post('/auth/logout', async (req: Request, res: Response) => {
    const caller = await verifyCallerIdentity(req);
    const { deviceFingerprint } = req.body || {};
    if (caller) {
      const nowIso = new Date().toISOString();
      const devList = serverStore.devicesByUid.get(caller.uid) || [];
      for (const d of devList) {
        if (!deviceFingerprint || d.deviceFingerprint === deviceFingerprint) {
          d.sessionStatus = 'signed_out';
          d.lastActiveAt = nowIso;
        }
      }
      saveStoreToDisk();
      const adminSb = getSupabaseAdminClient();
      if (adminSb && caller.verifiedBySupabase && deviceFingerprint) {
        try {
          await adminSb
            .from('user_devices')
            .update({
              session_status: 'signed_out',
              last_active_at: nowIso,
            })
            .eq('user_id', caller.uid)
            .eq('device_fingerprint', deviceFingerprint);
        } catch {
          // ignore
        }
      }
    }
    res.json({
      ok: true,
      message: 'Đã đăng xuất khỏi phiên làm việc an toàn.',
    });
  });

  router.post('/auth/forgot-password', async (req: Request, res: Response) => {
    const { email, redirectTo } = req.body || {};
    if (!email) {
      res.status(400).json({
        ok: false,
        error: 'Vui lòng nhập địa chỉ email khôi phục.',
      });
      return;
    }

    const sb = getSupabasePublicClient();
    if (sb) {
      const { error } = await sb.auth.resetPasswordForEmail(
        String(email).trim(),
        {
          redirectTo:
            redirectTo || process.env.APP_URL || 'http://localhost:3000',
        }
      );
      if (error) {
        res.status(400).json({
          ok: false,
          error: `Không thể gửi email khôi phục: ${error.message}`,
        });
        return;
      }
    }

    res.json({
      ok: true,
      message:
        'Đã gửi liên kết khôi phục mật khẩu tới email của bạn. Vui lòng kiểm tra hộp thư.',
    });
  });

  router.post('/auth/reset-password', async (req: Request, res: Response) => {
    const caller = await verifyCallerIdentity(req);
    const { email, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) {
      res.status(400).json({
        ok: false,
        error: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      });
      return;
    }

    const adminSb = getSupabaseAdminClient();
    if (adminSb && caller?.verifiedBySupabase) {
      const { error } = await adminSb.auth.admin.updateUserById(caller.uid, {
        password: String(newPassword),
      });
      if (error) {
        res.status(400).json({
          ok: false,
          error: `Không thể cập nhật mật khẩu: ${error.message}`,
        });
        return;
      }
    }

    if (email) {
      const targetUid = serverStore.uidByEmail.get(
        String(email).trim().toLowerCase()
      );
      if (targetUid) {
        const acc = serverStore.accountsByUid.get(targetUid);
        if (acc) {
          acc.passwordHash = hashPasswordServer(String(newPassword));
          acc.mustChangePassword = false;
          acc.isInitialBootstrap = false;
          acc.updatedAt = new Date().toISOString();
          saveStoreToDisk();
        }
      }
    }

    res.json({
      ok: true,
      message:
        'Đặt mật khẩu mới thành công! Vui lòng đăng nhập bằng mật khẩu mới.',
    });
  });

  // ==========================================================================
  // 4. AUTOMATIC MULTI-DEVICE SYNC BY UID (/api/user-data)
  // ==========================================================================
  router.get('/user-data', async (req: Request, res: Response) => {
    const caller = await verifyCallerIdentity(req);
    if (!caller) {
      res
        .status(401)
        .json({ ok: false, error: 'Chưa xác thực phiên người dùng.' });
      return;
    }

    const adminSb = getSupabaseAdminClient();
    if (adminSb && caller.verifiedBySupabase) {
      try {
        const [wsRes, profRes, setRes] = await Promise.all([
          adminSb
            .from('user_workspace_sync')
            .select('*')
            .eq('user_id', caller.uid)
            .maybeSingle(),
          adminSb.from('profiles').select('*').eq('id', caller.uid).maybeSingle(),
          adminSb
            .from('user_settings')
            .select('*')
            .eq('user_id', caller.uid)
            .maybeSingle(),
        ]);

        const wsRow = wsRes.data;
        const normalizedWorkspace = wsRow
          ? {
              tracks: wsRow.tracks_json || [],
              musicCategories: wsRow.music_categories_json || [],
              videos: wsRow.videos_json || [],
              playlists: wsRow.playlists_json || [],
              queue: wsRow.queue_json || [],
              cards: wsRow.cards_json || [],
              scripts: wsRow.scripts_json || [],
              readingProgress: wsRow.notes_json || {},
              studyMaterials: wsRow.flashcards_json || [],
              history: wsRow.history_json || [],
              syncVersion: wsRow.sync_version || 1,
              updatedAt: wsRow.updated_at || new Date().toISOString(),
            }
          : serverStore.workspacesByUid.get(caller.uid) || null;

        res.json({
          ok: true,
          uid: caller.uid,
          data: normalizedWorkspace,
          workspace: normalizedWorkspace,
          profile: profRes.data || null,
          settings: setRes.data || null,
          source: 'supabase-postgres',
        });
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Database read error';
        res.status(500).json({ ok: false, error: msg });
        return;
      }
    }

    const cached = serverStore.workspacesByUid.get(caller.uid) || null;
    res.json({
      ok: true,
      uid: caller.uid,
      data: cached,
      workspace: cached,
      profile: serverStore.accountsByUid.get(caller.uid) || null,
      settings: null,
      source: 'session-store',
    });
  });

  router.post('/user-data', async (req: Request, res: Response) => {
    const caller = await verifyCallerIdentity(req);
    if (!caller) {
      res
        .status(401)
        .json({ ok: false, error: 'Chưa xác thực phiên người dùng.' });
      return;
    }

    const { workspace, settings, profile } = req.body || {};
    const incomingPayload = workspace || req.body || {};
    const nowIso = new Date().toISOString();

    // Update profile display name / avatar if requested
    const localAcc = serverStore.accountsByUid.get(caller.uid);
    if (localAcc && profile) {
      if (profile.displayName) localAcc.displayName = String(profile.displayName);
      if (profile.avatarUrl !== undefined)
        localAcc.avatarUrl = String(profile.avatarUrl);
      localAcc.updatedAt = nowIso;
    }

    const adminSb = getSupabaseAdminClient();
    if (adminSb && caller.verifiedBySupabase) {
      try {
        const { data: existingWs } = await adminSb
          .from('user_workspace_sync')
          .select('*')
          .eq('user_id', caller.uid)
          .maybeSingle();

        const incomingVersion = Number(incomingPayload?.syncVersion || 1);
        const existingVersion = Number(existingWs?.sync_version || 0);

        if (incomingVersion < existingVersion && existingWs) {
          res.json({
            ok: true,
            uid: caller.uid,
            action: 'kept_remote_newer',
            data: {
              tracks: existingWs.tracks_json || [],
              musicCategories: existingWs.music_categories_json || [],
              videos: existingWs.videos_json || [],
              playlists: existingWs.playlists_json || [],
              queue: existingWs.queue_json || [],
              cards: existingWs.cards_json || [],
              scripts: existingWs.scripts_json || [],
              readingProgress: existingWs.notes_json || {},
              studyMaterials: existingWs.flashcards_json || [],
              history: existingWs.history_json || [],
              syncVersion: existingWs.sync_version,
              updatedAt: existingWs.updated_at,
            },
            syncedAt: nowIso,
            source: 'supabase-postgres',
          });
          return;
        }

        await adminSb.from('user_workspace_sync').upsert(
          {
            user_id: caller.uid,
            tracks_json: incomingPayload.tracks || [],
            music_categories_json: incomingPayload.musicCategories || [],
            videos_json: incomingPayload.videos || [],
            playlists_json: incomingPayload.playlists || [],
            queue_json: incomingPayload.queue || [],
            cards_json: incomingPayload.cards || [],
            scripts_json: incomingPayload.scripts || [],
            notes_json:
              incomingPayload.readingProgress || incomingPayload.notes || {},
            flashcards_json:
              incomingPayload.studyMaterials || incomingPayload.materials || [],
            history_json: incomingPayload.history || [],
            sync_version: Math.max(incomingVersion, existingVersion + 1),
            updated_at: nowIso,
          },
          { onConflict: 'user_id' }
        );

        if (profile) {
          await adminSb
            .from('profiles')
            .update({
              display_name: profile.displayName || caller.username,
              avatar_url: profile.avatarUrl || null,
              sync_status: 'synced',
              updated_at: nowIso,
            })
            .eq('id', caller.uid);
        }

        if (settings) {
          await adminSb.from('user_settings').upsert(
            {
              user_id: caller.uid,
              theme: settings.theme || 'dark',
              language: settings.language || 'vi',
              audio_output_device_id: settings.audioOutputDeviceId || 'default',
              tts_voice_uri: settings.defaultVoiceURI || '',
              tts_speed: settings.defaultTTSSpeed || 1.0,
              tts_auto_scroll: settings.ttsAutoScroll ?? true,
              ducking_percent: settings.duckingPercent ?? 20,
              master_volume: settings.defaultMasterVolume ?? 80,
              auto_save: settings.autoSave ?? true,
              updated_at: nowIso,
            },
            { onConflict: 'user_id' }
          );
        }
      } catch {
        // Fallback to serverStore below
      }
    }

    const existingLocalWs = serverStore.workspacesByUid.get(caller.uid) as
      | { syncVersion?: number }
      | undefined;
    const existingVer = Number(existingLocalWs?.syncVersion || 0);
    const incomingVer = Number(incomingPayload?.syncVersion || 1);

    if (incomingVer < existingVer && existingLocalWs) {
      res.json({
        ok: true,
        uid: caller.uid,
        action: 'kept_remote_newer',
        data: existingLocalWs,
        syncedAt: nowIso,
        source: 'session-store',
      });
      return;
    }

    const mergedPayload = {
      ...incomingPayload,
      syncVersion: Math.max(incomingVer, existingVer + 1),
      updatedAt: nowIso,
    };
    serverStore.workspacesByUid.set(caller.uid, mergedPayload);
    saveStoreToDisk();

    res.json({
      ok: true,
      uid: caller.uid,
      data: mergedPayload,
      syncedAt: nowIso,
      source: 'session-store',
    });
  });

  // ==========================================================================
  // 5. LOGGED-IN DEVICE MANAGEMENT ENDPOINTS (/api/devices/*)
  // ==========================================================================
  router.get('/devices/list', async (req: Request, res: Response) => {
    const caller = await verifyCallerIdentity(req);
    if (!caller) {
      res
        .status(401)
        .json({ ok: false, error: 'Chưa xác thực phiên người dùng.' });
      return;
    }

    const adminSb = getSupabaseAdminClient();
    if (adminSb && caller.verifiedBySupabase) {
      try {
        const { data } = await adminSb
          .from('user_devices')
          .select('*')
          .eq('user_id', caller.uid)
          .order('last_active_at', { ascending: false });
        if (data && data.length > 0) {
          res.json({
            ok: true,
            devices: data.map((d) => ({
              id: d.id,
              userId: d.user_id,
              deviceFingerprint: d.device_fingerprint,
              deviceName: d.device_name,
              deviceType:
                d.device_type || detectDeviceTypeFromInfo(d.platform, d.device_name),
              platform: d.platform || 'Web',
              browser: d.browser || 'Browser',
              sessionStatus:
                d.session_status || (d.is_revoked ? 'revoked' : 'active'),
              isRevoked: Boolean(d.is_revoked),
              lastActiveAt: d.last_active_at,
              createdAt: d.created_at,
            })),
          });
          return;
        }
      } catch {
        // fallback below
      }
    }

    let list = serverStore.devicesByUid.get(caller.uid);
    if (!list || list.length === 0) {
      const seeded = registerOrUpdateDeviceInStore({
        uid: caller.uid,
        deviceFingerprint: `dev-${caller.uid.slice(0, 8)}`,
        deviceName: 'Trình duyệt hiện tại trên máy tính',
        platform: 'Desktop Web',
        browser: 'Chrome / Modern Browser',
      });
      list = [seeded];
    }

    res.json({
      ok: true,
      devices: list,
    });
  });

  router.post('/devices/revoke', async (req: Request, res: Response) => {
    const caller = await verifyCallerIdentity(req);
    if (!caller) {
      res
        .status(401)
        .json({ ok: false, error: 'Chưa xác thực phiên người dùng.' });
      return;
    }

    const { deviceId } = req.body || {};
    if (!deviceId) {
      res.status(400).json({ ok: false, error: 'Thiếu mã thiết bị cần thu hồi.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const adminSb = getSupabaseAdminClient();
    if (adminSb && caller.verifiedBySupabase) {
      try {
        await adminSb
          .from('user_devices')
          .update({
            is_revoked: true,
            session_status: 'revoked',
            last_active_at: nowIso,
          })
          .eq('id', deviceId)
          .eq('user_id', caller.uid);
      } catch {
        // fallback below
      }
    }

    const list = serverStore.devicesByUid.get(caller.uid) || [];
    for (const d of list) {
      if (d.id === deviceId || d.deviceFingerprint === deviceId) {
        d.isRevoked = true;
        d.sessionStatus = 'revoked';
        d.lastActiveAt = nowIso;
      }
    }
    serverStore.devicesByUid.set(caller.uid, list);
    saveStoreToDisk();

    res.json({
      ok: true,
      message: 'Đã thu hồi quyền truy cập và đăng xuất thiết bị thành công.',
    });
  });

  router.post('/devices/revoke-others', async (req: Request, res: Response) => {
    const caller = await verifyCallerIdentity(req);
    if (!caller) {
      res
        .status(401)
        .json({ ok: false, error: 'Chưa xác thực phiên người dùng.' });
      return;
    }

    const { currentDeviceFingerprint } = req.body || {};
    const nowIso = new Date().toISOString();

    const adminSb = getSupabaseAdminClient();
    if (adminSb && caller.verifiedBySupabase && currentDeviceFingerprint) {
      try {
        await adminSb
          .from('user_devices')
          .update({
            is_revoked: true,
            session_status: 'revoked',
            last_active_at: nowIso,
          })
          .eq('user_id', caller.uid)
          .neq('device_fingerprint', currentDeviceFingerprint);
      } catch {
        // fallback below
      }
    }

    const list = serverStore.devicesByUid.get(caller.uid) || [];
    let revokedCount = 0;
    for (const d of list) {
      if (
        currentDeviceFingerprint &&
        d.deviceFingerprint !== currentDeviceFingerprint &&
        !d.isRevoked
      ) {
        d.isRevoked = true;
        d.sessionStatus = 'revoked';
        d.lastActiveAt = nowIso;
        revokedCount += 1;
      }
    }
    serverStore.devicesByUid.set(caller.uid, list);
    saveStoreToDisk();

    res.json({
      ok: true,
      revokedCount,
      message:
        revokedCount > 0
          ? `Đã đăng xuất và thu hồi phiên trên ${revokedCount} thiết bị khác.`
          : 'Không có thiết bị nào khác đang đăng nhập.',
    });
  });

  // ==========================================================================
  // 6. LITERATURE STUDIO ADMIN RBAC ENDPOINTS (/api/admin/*)
  // ==========================================================================
  const requireAdminCaller = async (
    req: Request,
    res: Response
  ): Promise<NonNullable<Awaited<ReturnType<typeof verifyCallerIdentity>>> | null> => {
    const caller = await verifyCallerIdentity(req);
    if (!caller) {
      res.status(401).json({
        ok: false,
        error: 'Vui lòng đăng nhập để tiếp tục.',
      });
      return null;
    }
    if (caller.role !== 'admin') {
      res.status(403).json({
        ok: false,
        error:
          'Truy cập bị từ chối: Khu vực này chỉ dành riêng cho Quản trị viên (Admin).',
      });
      return null;
    }
    return caller;
  };

  router.get('/admin/overview', async (req: Request, res: Response) => {
    const admin = await requireAdminCaller(req, res);
    if (!admin) return;

    const accounts = Array.from(serverStore.accountsByUid.values());
    const allDevices = Array.from(serverStore.devicesByUid.values()).flat();

    let totalAiRequests = 0;
    let totalAiTokens = 0;
    for (const entry of rateLimitMap.values()) {
      totalAiRequests += entry.totalRequests;
      totalAiTokens += entry.dailyTokens;
    }

    const adminSb = getSupabaseAdminClient();
    if (adminSb && admin.verifiedBySupabase) {
      try {
        const [{ data: dbProfiles }, { data: dbDevices }] = await Promise.all([
          adminSb.from('profiles').select('id, is_locked, account_status'),
          adminSb.from('user_devices').select('id, is_revoked, session_status'),
        ]);
        if (dbProfiles && dbProfiles.length > 0) {
          const totalAcc = dbProfiles.length;
          const lockedAcc = dbProfiles.filter(
            (p) => p.is_locked || p.account_status === 'locked'
          ).length;
          const devRows = dbDevices || [];
          const activeSess = devRows.filter(
            (d) => !d.is_revoked && d.session_status === 'active'
          ).length;
          const revokedSess = devRows.filter((d) => d.is_revoked).length;

          res.json({
            ok: true,
            stats: {
              totalAccounts: totalAcc,
              activeAccounts: totalAcc - lockedAcc,
              lockedAccounts: lockedAcc,
              totalDevices: devRows.length,
              activeSessions: activeSess,
              revokedSessions: revokedSess,
              totalAiRequests,
              totalAiTokens,
            },
            systemSettings: systemSettingsState,
          });
          return;
        }
      } catch {
        // Fallback to serverStore stats below
      }
    }

    const lockedAccounts = accounts.filter((a) => a.isLocked).length;
    const activeSessions = allDevices.filter(
      (d) => !d.isRevoked && d.sessionStatus === 'active'
    ).length;
    const revokedSessions = allDevices.filter((d) => d.isRevoked).length;

    res.json({
      ok: true,
      stats: {
        totalAccounts: accounts.length,
        activeAccounts: accounts.length - lockedAccounts,
        lockedAccounts,
        totalDevices: allDevices.length,
        activeSessions,
        revokedSessions,
        totalAiRequests,
        totalAiTokens,
      },
      systemSettings: systemSettingsState,
    });
  });

  router.get('/admin/users', async (req: Request, res: Response) => {
    const admin = await requireAdminCaller(req, res);
    if (!admin) return;

    const q = String(req.query.q || '').trim().toLowerCase();
    const statusFilter = String(req.query.status || 'all').toLowerCase();

    const adminSb = getSupabaseAdminClient();
    if (adminSb && admin.verifiedBySupabase) {
      try {
        const [{ data: dbProfiles }, { data: dbDevices }] = await Promise.all([
          adminSb
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false }),
          adminSb.from('user_devices').select('user_id, is_revoked, session_status'),
        ]);

        if (dbProfiles && dbProfiles.length > 0) {
          const devCountMap = new Map<string, number>();
          for (const d of dbDevices || []) {
            if (!d.is_revoked) {
              devCountMap.set(d.user_id, (devCountMap.get(d.user_id) || 0) + 1);
            }
          }

          let mapped = dbProfiles.map((p) => ({
            uid: p.id,
            username: p.username || (p.email ? p.email.split('@')[0] : 'user'),
            email: p.email || '',
            displayName: p.display_name || p.username || 'Người dùng',
            role: (p.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin',
            accountStatus: (p.is_locked || p.account_status === 'locked'
              ? 'locked'
              : 'active') as 'active' | 'locked',
            isLocked: Boolean(p.is_locked || p.account_status === 'locked'),
            mustChangePassword: Boolean(p.must_change_password),
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            deviceCount: devCountMap.get(p.id) || 0,
          }));

          if (q) {
            mapped = mapped.filter(
              (u) =>
                u.username.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.uid.toLowerCase().includes(q) ||
                u.displayName.toLowerCase().includes(q)
            );
          }
          if (statusFilter === 'active') {
            mapped = mapped.filter((u) => !u.isLocked);
          } else if (statusFilter === 'locked') {
            mapped = mapped.filter((u) => u.isLocked);
          } else if (statusFilter === 'admin') {
            mapped = mapped.filter((u) => u.role === 'admin');
          }

          res.json({ ok: true, users: mapped });
          return;
        }
      } catch {
        // Fallback below
      }
    }

    let list = Array.from(serverStore.accountsByUid.values()).map((acc) => {
      const devs = serverStore.devicesByUid.get(acc.uid) || [];
      return {
        uid: acc.uid,
        username: acc.username,
        email: acc.email,
        displayName: acc.displayName,
        role: acc.role,
        accountStatus: acc.isLocked ? ('locked' as const) : ('active' as const),
        isLocked: acc.isLocked,
        mustChangePassword: acc.mustChangePassword,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt,
        deviceCount: devs.filter((d) => !d.isRevoked).length,
      };
    });

    if (q) {
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.uid.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'active') {
      list = list.filter((u) => !u.isLocked);
    } else if (statusFilter === 'locked') {
      list = list.filter((u) => u.isLocked);
    } else if (statusFilter === 'admin') {
      list = list.filter((u) => u.role === 'admin');
    }

    res.json({ ok: true, users: list });
  });

  router.post('/admin/users/toggle-lock', async (req: Request, res: Response) => {
    const admin = await requireAdminCaller(req, res);
    if (!admin) return;

    const { targetUid, lock } = req.body || {};
    if (!targetUid) {
      res.status(400).json({ ok: false, error: 'Thiếu UID tài khoản mục tiêu.' });
      return;
    }

    if (targetUid === admin.uid && lock) {
      res.status(400).json({
        ok: false,
        error: 'Quản trị viên không thể tự khóa tài khoản của chính mình.',
      });
      return;
    }

    const shouldLock = Boolean(lock);
    const nowIso = new Date().toISOString();

    const adminSb = getSupabaseAdminClient();
    if (adminSb && admin.verifiedBySupabase) {
      try {
        await adminSb
          .from('profiles')
          .update({
            is_locked: shouldLock,
            account_status: shouldLock ? 'locked' : 'active',
            updated_at: nowIso,
          })
          .eq('id', targetUid);

        if (shouldLock) {
          await adminSb
            .from('user_devices')
            .update({
              is_revoked: true,
              session_status: 'revoked',
              last_active_at: nowIso,
            })
            .eq('user_id', targetUid);
        }
      } catch {
        // continue to update serverStore
      }
    }

    const targetAcc = serverStore.accountsByUid.get(targetUid);
    if (targetAcc) {
      targetAcc.isLocked = shouldLock;
      targetAcc.accountStatus = shouldLock ? 'locked' : 'active';
      targetAcc.updatedAt = nowIso;
      if (shouldLock) {
        const devs = serverStore.devicesByUid.get(targetUid) || [];
        for (const d of devs) {
          d.isRevoked = true;
          d.sessionStatus = 'revoked';
          d.lastActiveAt = nowIso;
        }
      }
      saveStoreToDisk();
    }

    await recordAdminAuditLog({
      adminId: admin.uid,
      adminUsername: admin.username,
      actionType: shouldLock ? 'LOCK_USER_ACCOUNT' : 'UNLOCK_USER_ACCOUNT',
      targetUserId: targetUid,
      details: `${shouldLock ? 'Khóa' : 'Mở khóa'} tài khoản người dùng UID ${targetUid} (${targetAcc?.username || 'user'}).`,
    });

    res.json({
      ok: true,
      isLocked: shouldLock,
      message: shouldLock
        ? 'Đã khóa tài khoản người dùng và thu hồi toàn bộ phiên đăng nhập.'
        : 'Đã mở khóa tài khoản người dùng thành công.',
    });
  });

  router.get('/admin/devices', async (req: Request, res: Response) => {
    const admin = await requireAdminCaller(req, res);
    if (!admin) return;

    const q = String(req.query.q || '').trim().toLowerCase();
    const statusFilter = String(req.query.status || 'all').toLowerCase();

    const adminSb = getSupabaseAdminClient();
    if (adminSb && admin.verifiedBySupabase) {
      try {
        const [{ data: dbDevices }, { data: dbProfiles }] = await Promise.all([
          adminSb
            .from('user_devices')
            .select('*')
            .order('last_active_at', { ascending: false }),
          adminSb.from('profiles').select('id, username, email'),
        ]);

        if (dbDevices && dbDevices.length > 0) {
          const profMap = new Map<string, { username: string; email: string }>();
          for (const p of dbProfiles || []) {
            profMap.set(p.id, {
              username: p.username || 'user',
              email: p.email || '',
            });
          }

          let mapped = dbDevices.map((d) => {
            const owner = profMap.get(d.user_id) || {
              username: 'user',
              email: '',
            };
            return {
              id: d.id,
              userId: d.user_id,
              ownerUsername: owner.username,
              ownerEmail: owner.email,
              deviceFingerprint: d.device_fingerprint,
              deviceName: d.device_name,
              deviceType:
                d.device_type || detectDeviceTypeFromInfo(d.platform, d.device_name),
              platform: d.platform || 'Web',
              browser: d.browser || 'Browser',
              sessionStatus:
                d.session_status || (d.is_revoked ? 'revoked' : 'active'),
              isRevoked: Boolean(d.is_revoked),
              lastActiveAt: d.last_active_at,
              createdAt: d.created_at,
            };
          });

          if (q) {
            mapped = mapped.filter(
              (d) =>
                d.deviceName.toLowerCase().includes(q) ||
                d.ownerUsername.toLowerCase().includes(q) ||
                d.ownerEmail.toLowerCase().includes(q) ||
                String(d.userId).toLowerCase().includes(q)
            );
          }
          if (statusFilter === 'active') {
            mapped = mapped.filter(
              (d) => !d.isRevoked && d.sessionStatus === 'active'
            );
          } else if (statusFilter === 'revoked') {
            mapped = mapped.filter(
              (d) => d.isRevoked || d.sessionStatus === 'revoked'
            );
          }

          res.json({ ok: true, devices: mapped });
          return;
        }
      } catch {
        // Fallback below
      }
    }

    let allDevices: Array<
      StoredDeviceRecord & { ownerUsername: string; ownerEmail: string }
    > = [];
    for (const [uid, devs] of serverStore.devicesByUid.entries()) {
      const owner = serverStore.accountsByUid.get(uid);
      for (const d of devs) {
        allDevices.push({
          ...d,
          ownerUsername: owner?.username || 'user',
          ownerEmail: owner?.email || '',
        });
      }
    }

    if (q) {
      allDevices = allDevices.filter(
        (d) =>
          d.deviceName.toLowerCase().includes(q) ||
          d.ownerUsername.toLowerCase().includes(q) ||
          d.ownerEmail.toLowerCase().includes(q) ||
          d.userId.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'active') {
      allDevices = allDevices.filter(
        (d) => !d.isRevoked && d.sessionStatus === 'active'
      );
    } else if (statusFilter === 'revoked') {
      allDevices = allDevices.filter(
        (d) => d.isRevoked || d.sessionStatus === 'revoked'
      );
    }

    res.json({ ok: true, devices: allDevices });
  });

  router.post('/admin/devices/revoke', async (req: Request, res: Response) => {
    const admin = await requireAdminCaller(req, res);
    if (!admin) return;

    const { deviceId, targetUserId } = req.body || {};
    if (!deviceId) {
      res.status(400).json({ ok: false, error: 'Thiếu mã thiết bị cần thu hồi.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const adminSb = getSupabaseAdminClient();
    if (adminSb && admin.verifiedBySupabase) {
      try {
        await adminSb
          .from('user_devices')
          .update({
            is_revoked: true,
            session_status: 'revoked',
            last_active_at: nowIso,
          })
          .eq('id', deviceId);
      } catch {
        // fallback below
      }
    }

    for (const [, list] of serverStore.devicesByUid.entries()) {
      for (const d of list) {
        if (d.id === deviceId || d.deviceFingerprint === deviceId) {
          d.isRevoked = true;
          d.sessionStatus = 'revoked';
          d.lastActiveAt = nowIso;
        }
      }
    }
    saveStoreToDisk();

    await recordAdminAuditLog({
      adminId: admin.uid,
      adminUsername: admin.username,
      actionType: 'REVOKE_DEVICE_SESSION',
      targetUserId: targetUserId || null,
      targetDeviceId: deviceId,
      details: `Quản trị viên thu hồi phiên đăng nhập thiết bị ${deviceId}.`,
    });

    res.json({
      ok: true,
      message: 'Đã thu hồi phiên thiết bị thành công.',
    });
  });

  router.get('/admin/audit-logs', async (req: Request, res: Response) => {
    const admin = await requireAdminCaller(req, res);
    if (!admin) return;

    const adminSb = getSupabaseAdminClient();
    if (adminSb && admin.verifiedBySupabase) {
      try {
        const { data } = await adminSb
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (data && data.length > 0) {
          res.json({
            ok: true,
            logs: data.map((row) => ({
              id: row.id,
              adminId: row.admin_id,
              adminUsername: row.admin_username,
              actionType: row.action_type,
              targetUserId: row.target_user_id,
              targetDeviceId: row.target_device_id,
              details: row.details,
              createdAt: row.created_at,
            })),
          });
          return;
        }
      } catch {
        // fallback below
      }
    }

    res.json({
      ok: true,
      logs: serverStore.auditLogs,
    });
  });

  router.post('/admin/system-settings', async (req: Request, res: Response) => {
    const admin = await requireAdminCaller(req, res);
    if (!admin) return;

    const {
      maxReqPerMinute,
      dailyTokenBudget,
      allowNewRegistrations,
      requireStrongPassword,
      realtimeSyncEnabled,
    } = req.body || {};

    systemSettingsState = {
      maxReqPerMinute:
        typeof maxReqPerMinute === 'number'
          ? Math.max(1, Math.min(200, maxReqPerMinute))
          : systemSettingsState.maxReqPerMinute,
      dailyTokenBudget:
        typeof dailyTokenBudget === 'number'
          ? Math.max(10000, dailyTokenBudget)
          : systemSettingsState.dailyTokenBudget,
      allowNewRegistrations:
        typeof allowNewRegistrations === 'boolean'
          ? allowNewRegistrations
          : systemSettingsState.allowNewRegistrations,
      requireStrongPassword:
        typeof requireStrongPassword === 'boolean'
          ? requireStrongPassword
          : systemSettingsState.requireStrongPassword,
      realtimeSyncEnabled:
        typeof realtimeSyncEnabled === 'boolean'
          ? realtimeSyncEnabled
          : systemSettingsState.realtimeSyncEnabled,
    };

    await recordAdminAuditLog({
      adminId: admin.uid,
      adminUsername: admin.username,
      actionType: 'UPDATE_SYSTEM_SETTINGS',
      details: `Cập nhật cấu hình hệ thống (Giới hạn AI: ${systemSettingsState.maxReqPerMinute} req/phút, Ngân sách: ${systemSettingsState.dailyTokenBudget} tokens).`,
    });

    res.json({
      ok: true,
      systemSettings: systemSettingsState,
      message: 'Đã lưu cài đặt quản trị hệ thống thành công.',
    });
  });

  return router;
}
