export type WorkspaceTab =
  | 'dashboard'
  | 'music'
  | 'video'
  | 'literature'
  | 'playlists'
  | 'tts'
  | 'ai'
  | 'study'
  | 'presentation'
  | 'meeting'
  | 'account'
  | 'admin'
  | 'settings';

export type TTSMode = 'normal' | 'poetry' | 'prose' | 'presentation';

export type MasterStatus =
  | 'Idle'
  | 'Playing Music'
  | 'Playing Video'
  | 'Reading Literature'
  | 'Reading Poetry'
  | 'Paused';

export type RepeatMode = 'none' | 'one' | 'all';

export interface Track {
  id: string;
  title: string;
  artist: string;
  category: string;
  duration: number; // in seconds
  size: number; // in bytes
  addedAt: string; // ISO string
  coverUrl?: string;
  sourceType: 'sample-synth' | 'uploaded-file' | 'uploaded-folder' | 'direct-url';
  folderName?: string;
  directUrl?: string;
  synthPreset?: 'piano-song-da' | 'flute-tay-bac' | 'strings-mua-thu' | 'ambient-thuyet-trinh';
}

export interface VideoItem {
  id: string;
  title: string;
  sourceType: 'uploaded-video' | 'direct-mp4' | 'direct-mp3' | 'youtube-embed';
  url?: string;
  embedUrl?: string;
  duration: number;
  size: number;
  addedAt: string;
  notes?: string;
}

export type LiteratureCategory =
  | 'Tác giả'
  | 'Hoàn cảnh sáng tác'
  | 'Tóm tắt tác phẩm'
  | 'Phân tích nhân vật'
  | 'Phân tích hình tượng'
  | 'Phân tích nghệ thuật'
  | 'Văn bản và thơ'
  | 'Nhận định văn học'
  | 'Tài liệu thuyết trình';

export interface LiteratureCard {
  id: string;
  title: string; // Tên tác phẩm
  author: string; // Tác giả
  genre: string; // Thể loại
  period: string; // Giai đoạn văn học
  creationContext: string; // Hoàn cảnh sáng tác
  summary: string; // Nội dung chính
  theme: string; // Chủ đề
  contentValue: string; // Giá trị nội dung
  artisticValue: string; // Giá trị nghệ thuật
  characters: string; // Nhân vật
  artisticImagery: string; // Hình tượng nghệ thuật
  excerpt: string; // Văn bản hoặc trích đoạn
  commentary: string; // Nhận xét và đánh giá
  category: LiteratureCategory;
  tags: string[];
  pinned: boolean;
  updatedAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  createdAt: string;
}

export interface QueueItem {
  id: string; // unique queue entry id
  mediaId: string;
  mediaType: 'music' | 'video';
  title: string;
  subtitle: string;
  duration: number;
  coverUrl?: string;
}

export interface PresentationStep {
  id: string;
  stepNumber: number;
  stageTitle: string;
  workTitle: string;
  author: string;
  content: string;
  ttsText: string;
  ttsMode: TTSMode;
  autoReadTTS: boolean;
  backgroundTrackId?: string;
  videoId?: string;
  imageUrl?: string;
}

export interface PresentationScript {
  id: string;
  title: string;
  workId?: string;
  steps: PresentationStep[];
  updatedAt: string;
}

export interface ActionHistoryItem {
  id: string;
  timestamp: string;
  action: string;
  category: 'audio' | 'video' | 'literature' | 'tts' | 'ai' | 'system' | 'auth' | 'sync';
}

export interface StudioSettings {
  theme: 'dark' | 'light';
  language: 'vi' | 'en';
  audioOutputDeviceId: string;
  defaultVoiceURI: string;
  defaultTTSSpeed: number;
  ttsAutoScroll?: boolean;
  duckingPercent: number; // Default 20
  defaultMasterVolume: number; // 0 to 100
  autoSave: boolean;
}

// ============================================================================
// AUTH, PROFILE, DEVICE MANAGEMENT, MULTI-DEVICE SYNC & ADMIN RBAC TYPES
// ============================================================================

export type UserRole = 'user' | 'admin';

export type AccountType = 'registered' | 'admin';

export type AccountStatus = 'active' | 'locked';

export type SyncStateStatus = 'synced' | 'syncing' | 'offline' | 'conflict-resolved' | 'error';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: UserRole;
  accountType: AccountType;
  accountStatus: AccountStatus;
  isLocked: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  syncStatus: SyncStateStatus;
}

export interface UserDevice {
  id: string;
  userId?: string;
  ownerUsername?: string;
  ownerEmail?: string;
  deviceFingerprint: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  platform: string;
  browser: string;
  sessionStatus: 'active' | 'revoked' | 'signed_out';
  isRevoked: boolean;
  lastActiveAt: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface AdminAuditLogItem {
  id: string;
  adminId: string | null;
  adminUsername: string;
  actionType: string;
  targetUserId: string | null;
  targetDeviceId: string | null;
  details: string;
  createdAt: string;
}

export interface AdminOverviewStats {
  totalAccounts: number;
  activeAccounts: number;
  lockedAccounts: number;
  totalDevices: number;
  activeSessions: number;
  revokedSessions: number;
  totalAiRequests: number;
  totalAiTokens: number;
}

export interface ReadingProgress {
  workId: string;
  workTitle: string;
  lastChunkIndex: number;
  cursorOffset: number;
  scrollPosition: number;
  completionPercent: number;
  personalNotes: string;
  updatedAt: string;
}

export interface StudyMaterial {
  id: string;
  workId?: string;
  workTitle?: string;
  title: string;
  materialType: 'note' | 'flashcard' | 'quiz' | 'outline';
  content: string;
  flashcards?: { front: string; back: string }[];
  quizItems?: { question: string; answer: string }[];
  updatedAt: string;
}

// ============================================================================
// LITERATURE AI (OPENAI RESPONSES API) TYPES
// ============================================================================

export type LiteratureAICapabilityId =
  | 'analyze_work'
  | 'analyze_poetry'
  | 'analyze_prose'
  | 'analyze_character'
  | 'analyze_imagery'
  | 'analyze_theme'
  | 'analyze_author_style'
  | 'compare_works'
  | 'explain_detail'
  | 'summarize_work'
  | 'reading_comprehension'
  | 'literary_essay'
  | 'build_outline'
  | 'review_writing'
  | 'explain_vocabulary'
  | 'explain_allusion'
  | 'presentation_support'
  | 'generate_quiz'
  | 'generate_flashcards'
  | 'suggest_similar';

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  capability?: LiteratureAICapabilityId;
  selectedPassage?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  rating?: -1 | 0 | 1;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  title: string;
  workId?: string;
  workTitle?: string;
  model: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIUsageStats {
  dailyRequests: number;
  maxDailyRequests: number;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  budgetLimitTokens: number;
}
