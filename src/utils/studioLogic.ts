import { TTSMode, Track } from '../types/studio';

/**
 * Strips Vietnamese diacritics and normalizes text for case-insensitive and accent-insensitive search.
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Checks if a search query matches any of the provided text or tag fields (supports unaccented Vietnamese).
 */
export function matchesSearch(
  query: string,
  ...fields: (string | string[] | undefined | null)[]
): boolean {
  const normQuery = normalizeVietnamese(query);
  if (!normQuery) return true;

  for (const field of fields) {
    if (!field) continue;
    if (Array.isArray(field)) {
      for (const item of field) {
        if (normalizeVietnamese(item).includes(normQuery)) return true;
      }
    } else {
      if (normalizeVietnamese(field).includes(normQuery)) return true;
    }
  }
  return false;
}

/**
 * Computes effective background music gain [0.0 - 1.0] taking Audio Ducking and Mute into account.
 * Does NOT mutate the user's masterVolume setting.
 */
export function calculateDuckedVolume(
  masterVolume: number,
  isDucking: boolean,
  duckingPercent = 20,
  isMuted = false
): number {
  if (isMuted) return 0;
  const clampedMaster = Math.max(0, Math.min(100, masterVolume)) / 100;
  if (!isDucking) {
    return Number(clampedMaster.toFixed(4));
  }
  const ratio = Math.max(0, Math.min(100, duckingPercent)) / 100;
  return Number((clampedMaster * ratio).toFixed(4));
}

/**
 * Splits long literary or poetic text into clean TTS utterance chunks according to reading mode.
 */
export function splitTextForTTS(
  text: string,
  mode: TTSMode,
  maxChunkLength = 220
): string[] {
  if (!text || !text.trim()) return [];
  const cleaned = text.replace(/\r\n/g, '\n').trim();

  if (mode === 'poetry') {
    const lines = cleaned
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const result: string[] = [];
    for (const line of lines) {
      if (line.length <= maxChunkLength) {
        result.push(line);
      } else {
        const subParts = line.split(/([,;])/);
        let acc = '';
        for (const part of subParts) {
          if ((acc + part).length > maxChunkLength && acc.trim()) {
            result.push(acc.trim());
            acc = part;
          } else {
            acc += part;
          }
        }
        if (acc.trim()) result.push(acc.trim());
      }
    }
    return result;
  }

  const paragraphs = cleaned
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const para of paragraphs) {
    if (para.length <= maxChunkLength) {
      chunks.push(para);
      continue;
    }
    const sentences = para.match(/[^.!?…]+[.!?…]*/g) || [para];
    let current = '';
    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;
      if (!current) {
        if (s.length <= maxChunkLength) {
          current = s;
        } else {
          const words = s.split(/\s+/);
          let wordAcc = '';
          for (const w of words) {
            if ((wordAcc + ' ' + w).trim().length > maxChunkLength && wordAcc) {
              chunks.push(wordAcc.trim());
              wordAcc = w;
            } else {
              wordAcc = (wordAcc + ' ' + w).trim();
            }
          }
          if (wordAcc) current = wordAcc;
        }
      } else if ((current + ' ' + s).length <= maxChunkLength) {
        current += ' ' + s;
      } else {
        chunks.push(current);
        current = s;
      }
    }
    if (current) chunks.push(current);
  }

  return chunks;
}

/**
 * Parses and validates media URLs (Direct MP3/audio, Direct MP4/video, YouTube Embed, or Unsupported).
 */
export function parseMediaUrl(rawUrl: string): {
  type: 'mp3' | 'mp4' | 'youtube' | 'unsupported';
  embedUrl?: string;
  videoId?: string;
  reason?: string;
} {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { type: 'unsupported', reason: 'URL trống. Vui lòng nhập đường dẫn hợp lệ.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      type: 'unsupported',
      reason: 'Định dạng URL không hợp lệ (cần bắt đầu bằng https:// hoặc http://).',
    };
  }

  const host = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  if (
    host === 'youtube.com' ||
    host === 'www.youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'youtu.be'
  ) {
    let videoId = '';
    if (host === 'youtu.be') {
      videoId = parsed.pathname.replace(/^\//, '').split('/')[0];
    } else if (pathname.startsWith('/watch')) {
      videoId = parsed.searchParams.get('v') || '';
    } else if (pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0] || '';
    } else if (pathname.startsWith('/shorts/')) {
      videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || '';
    }

    if (videoId && /^[a-zA-Z0-9_-]{6,15}$/.test(videoId)) {
      return {
        type: 'youtube',
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0`,
      };
    }
    return {
      type: 'unsupported',
      reason: 'Không tìm thấy mã Video ID hợp lệ từ đường dẫn YouTube này.',
    };
  }

  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(pathname)) {
    return { type: 'mp3' };
  }

  if (/\.(mp4|webm|ogv)$/i.test(pathname)) {
    return { type: 'mp4' };
  }

  return {
    type: 'unsupported',
    reason:
      'Chỉ hỗ trợ link file trực tiếp (.mp3, .wav, .ogg, .mp4, .webm) hoặc link YouTube cho phép nhúng (Embed). Không tự động trích xuất luồng âm thanh trái điều khoản dịch vụ.',
  };
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function deduplicateTracks(
  existing: Track[],
  incoming: Track[]
): { added: Track[]; skippedCount: number } {
  const seenKeys = new Set(
    existing.map((t) => `${normalizeVietnamese(t.title)}__${t.size}`)
  );
  const added: Track[] = [];
  let skippedCount = 0;

  for (const track of incoming) {
    const key = `${normalizeVietnamese(track.title)}__${track.size}`;
    if (seenKeys.has(key)) {
      skippedCount++;
    } else {
      seenKeys.add(key);
      added.push(track);
    }
  }

  return { added, skippedCount };
}

/**
 * Validates email and password with clear Vietnamese messages.
 */
export function validateEmailAndPassword(
  email: string,
  password?: string
): { valid: boolean; error?: string } {
  const cleanEmail = (email || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return {
      valid: false,
      error: 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại định dạng (ví dụ: ten@email.com).',
    };
  }
  if (password !== undefined) {
    if (password.length < 6) {
      return {
        valid: false,
        error: 'Mật khẩu phải có ít nhất 6 ký tự để đảm bảo an toàn bảo mật.',
      };
    }
  }
  return { valid: true };
}

/**
 * Resolves multi-device sync conflicts using syncVersion and updatedAt ISO timestamps.
 * Never overwrites newer data with older data.
 */
export function resolveSyncConflict<
  T extends { updatedAt?: string; syncVersion?: number }
>(
  localState: T,
  remoteState: T
): { winner: 'local' | 'remote'; resolved: T } {
  const localTime = localState.updatedAt ? new Date(localState.updatedAt).getTime() : 0;
  const remoteTime = remoteState.updatedAt
    ? new Date(remoteState.updatedAt).getTime()
    : 0;

  if (localTime > 0 && remoteTime > 0 && localTime !== remoteTime) {
    return localTime >= remoteTime
      ? { winner: 'local', resolved: localState }
      : { winner: 'remote', resolved: remoteState };
  }

  const localVer = localState.syncVersion ?? 0;
  const remoteVer = remoteState.syncVersion ?? 0;
  if (remoteVer > localVer) {
    return { winner: 'remote', resolved: remoteState };
  }
  return { winner: 'local', resolved: localState };
}

/**
 * Validates registration input (username, email, password, confirmPassword) with Vietnamese error messages.
 */
export function validateRegistrationInput(
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): { valid: boolean; error?: string } {
  const cleanUser = (username || '').trim();
  if (!cleanUser || cleanUser.length < 3 || cleanUser.length > 32) {
    return {
      valid: false,
      error: 'Tên người dùng phải từ 3 đến 32 ký tự.',
    };
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUser)) {
    return {
      valid: false,
      error: 'Tên người dùng chỉ được chứa chữ cái không dấu, chữ số và các ký tự _, ., -.',
    };
  }
  const emailCheck = validateEmailAndPassword(email, password);
  if (!emailCheck.valid) {
    return emailCheck;
  }
  if (password !== confirmPassword) {
    return {
      valid: false,
      error: 'Mật khẩu nhập lại không khớp với mật khẩu đã nhập.',
    };
  }
  return { valid: true };
}

/**
 * Validates password change input (current password, new password, confirm new password).
 */
export function validatePasswordChangeInput(
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string
): { valid: boolean; error?: string } {
  if (!currentPassword || currentPassword.length < 1) {
    return {
      valid: false,
      error: 'Vui lòng nhập mật khẩu hiện tại để xác thực danh tính.',
    };
  }
  if (!newPassword || newPassword.length < 6) {
    return {
      valid: false,
      error: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
    };
  }
  if (newPassword !== confirmNewPassword) {
    return {
      valid: false,
      error: 'Mật khẩu xác nhận không trùng khớp với mật khẩu mới.',
    };
  }
  if (currentPassword === newPassword) {
    return {
      valid: false,
      error: 'Mật khẩu mới phải khác với mật khẩu hiện tại.',
    };
  }
  return { valid: true };
}
