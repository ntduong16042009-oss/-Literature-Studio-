import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Film,
  LayoutDashboard,
  ListMusic,
  Menu,
  Mic,
  Music,
  Presentation,
  Settings,
  Share2,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Cloud,
  GraduationCap,
  Shield,
  UserCheck,
  WifiOff,
} from 'lucide-react';
import {
  ActionHistoryItem,
  AIConversation,
  LiteratureCard,
  MasterStatus,
  Playlist,
  PresentationScript,
  QueueItem,
  ReadingProgress,
  RepeatMode,
  StudioSettings,
  StudyMaterial,
  SyncStateStatus,
  TTSMode,
  Track,
  UserProfile,
  VideoItem,
  WorkspaceTab,
} from './types/studio';
import {
  COVER_PIANO_IMG,
  DEFAULT_MUSIC_CATEGORIES,
  DEFAULT_SETTINGS,
  INITIAL_LITERATURE_CARDS,
  INITIAL_PLAYLISTS,
  INITIAL_PRESENTATION_SCRIPTS,
  INITIAL_TRACKS,
  INITIAL_VIDEOS,
} from './data/seedData';
import {
  calculateDuckedVolume,
  deduplicateTracks,
  parseMediaUrl,
  splitTextForTTS,
} from './utils/studioLogic';
import { synthesizeSampleWavBlob } from './utils/wavSynthesizer';
import {
  clearAllMediaBlobs,
  deleteMediaBlob,
  estimateStorageUsage,
  loadLocalStateSync,
  loadMediaBlob,
  saveIndexedState,
  saveMediaBlob,
} from './utils/db';
import { generateStandaloneSingleFileHtml } from './utils/standaloneExporter';
import { DashboardView } from './components/DashboardView';
import { MusicLibraryView } from './components/MusicLibraryView';
import { VideoMediaView } from './components/VideoMediaView';
import { LiteratureLibraryView } from './components/LiteratureLibraryView';
import { TTSStudioView } from './components/TTSAndAIView';
import { LiteratureAIView, StudyHubView } from './components/LiteratureAIView';
import { AccountAndDeviceView } from './components/AccountAndDeviceView';
import { AuthGateView } from './components/AuthGateView';
import { AdminDashboardView } from './components/AdminDashboardView';
import {
  CloudWorkspacePayload,
  getStoredAccessToken,
  getStoredProfile,
  pullCloudWorkspace,
  pushCloudWorkspace,
  restoreAuthenticatedSession,
  subscribeWorkspaceRealtime,
} from './lib/supabase';
import {
  PlaylistsView,
  PresentationModeView,
} from './components/PlaylistsAndPresentationView';
import {
  MeetingIntegrationView,
  SettingsAndDataView,
} from './components/MeetingAndSettingsView';
import {
  BottomMasterPlayer,
  RightInspectorPanel,
} from './components/RightPanelAndPlayer';

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  // Navigation & Responsive state
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isStageFullscreen, setIsStageFullscreen] = useState(false);

  // Persistent Data States hydrated from LocalStorage / Seed Data
  const [settings, setSettings] = useState<StudioSettings>(() =>
    loadLocalStateSync('settings', DEFAULT_SETTINGS)
  );
  const [tracks, setTracks] = useState<Track[]>(() =>
    loadLocalStateSync('tracks', INITIAL_TRACKS)
  );
  const [musicCategories, setMusicCategories] = useState<string[]>(() =>
    loadLocalStateSync('musicCategories', DEFAULT_MUSIC_CATEGORIES)
  );
  const [videos, setVideos] = useState<VideoItem[]>(() =>
    loadLocalStateSync('videos', INITIAL_VIDEOS)
  );
  const [cards, setCards] = useState<LiteratureCard[]>(() =>
    loadLocalStateSync('cards', INITIAL_LITERATURE_CARDS)
  );
  const [playlists, setPlaylists] = useState<Playlist[]>(() =>
    loadLocalStateSync('playlists', INITIAL_PLAYLISTS)
  );
  const [scripts, setScripts] = useState<PresentationScript[]>(() =>
    loadLocalStateSync('scripts', INITIAL_PRESENTATION_SCRIPTS)
  );
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    loadLocalStateSync('queue', [
      {
        id: 'q-init-1',
        mediaId: INITIAL_TRACKS[0].id,
        mediaType: 'music',
        title: INITIAL_TRACKS[0].title,
        subtitle: INITIAL_TRACKS[0].artist,
        duration: INITIAL_TRACKS[0].duration,
        coverUrl: INITIAL_TRACKS[0].coverUrl,
      },
      {
        id: 'q-init-2',
        mediaId: INITIAL_TRACKS[1].id,
        mediaType: 'music',
        title: INITIAL_TRACKS[1].title,
        subtitle: INITIAL_TRACKS[1].artist,
        duration: INITIAL_TRACKS[1].duration,
        coverUrl: INITIAL_TRACKS[1].coverUrl,
      },
    ])
  );
  const [history, setHistory] = useState<ActionHistoryItem[]>(() =>
    loadLocalStateSync('history', [
      {
        id: 'hist-init',
        timestamp: new Date().toISOString(),
        action: 'Khởi tạo Literature Studio thành công',
        category: 'system',
      },
    ])
  );

  // ============================================================================
  // MANDATORY SUPABASE AUTH, MULTI-DEVICE REALTIME SYNC & RBAC STATE
  // ============================================================================
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() =>
    getStoredProfile()
  );
  const [accessToken, setAccessToken] = useState<string>(() =>
    getStoredAccessToken()
  );
  const [syncStatus, setSyncStatus] = useState<SyncStateStatus>('synced');
  const [syncVersion, setSyncVersion] = useState<number>(() =>
    loadLocalStateSync('syncVersion', 1)
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    loadLocalStateSync('lastSyncedAt', null)
  );

  // Study Progress, Favorites, Study Materials & AI Conversations
  const [readingProgress, setReadingProgress] = useState<
    Record<string, ReadingProgress>
  >(() => loadLocalStateSync('readingProgress', {}));
  const [favorites, setFavorites] = useState<string[]>(() =>
    loadLocalStateSync('favorites', [INITIAL_LITERATURE_CARDS[0].id])
  );
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>(() =>
    loadLocalStateSync('studyMaterials', [])
  );
  const [conversations, setConversations] = useState<AIConversation[]>(() =>
    loadLocalStateSync('conversations', [])
  );

  // Context-Aware Text Selection State ("Hỏi Literature AI" anywhere on site)
  const [contextPassage, setContextPassage] = useState<string>('');
  const [floatingSelectionText, setFloatingSelectionText] = useState<string>('');

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const notify = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const logAction = useCallback(
    (action: string, category: ActionHistoryItem['category']) => {
      setHistory((prev) => [
        {
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          action,
          category,
        },
        ...prev.slice(0, 29),
      ]);
    },
    []
  );

  // Sync Dark / Light theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Auto-save persistent states
  useEffect(() => {
    if (!settings.autoSave) return;
    saveIndexedState('settings', settings);
  }, [settings]);

  useEffect(() => {
    if (!settings.autoSave) return;
    saveIndexedState('tracks', tracks);
  }, [tracks, settings.autoSave]);

  useEffect(() => {
    if (!settings.autoSave) return;
    saveIndexedState('musicCategories', musicCategories);
  }, [musicCategories, settings.autoSave]);

  useEffect(() => {
    if (!settings.autoSave) return;
    saveIndexedState('videos', videos);
  }, [videos, settings.autoSave]);

  useEffect(() => {
    if (!settings.autoSave) return;
    saveIndexedState('cards', cards);
  }, [cards, settings.autoSave]);

  useEffect(() => {
    if (!settings.autoSave) return;
    saveIndexedState('playlists', playlists);
  }, [playlists, settings.autoSave]);

  useEffect(() => {
    if (!settings.autoSave) return;
    saveIndexedState('scripts', scripts);
  }, [scripts, settings.autoSave]);

  useEffect(() => {
    if (!settings.autoSave) return;
    saveIndexedState('queue', queue);
  }, [queue, settings.autoSave]);

  useEffect(() => {
    if (!settings.autoSave) return;
    saveIndexedState('history', history);
  }, [history, settings.autoSave]);

  useEffect(() => {
    saveIndexedState('readingProgress', readingProgress);
  }, [readingProgress]);

  useEffect(() => {
    saveIndexedState('favorites', favorites);
  }, [favorites]);

  useEffect(() => {
    saveIndexedState('studyMaterials', studyMaterials);
  }, [studyMaterials]);

  useEffect(() => {
    saveIndexedState('conversations', conversations);
  }, [conversations]);

  // Apply Cloud Workspace Snapshot when pulled or claimed via Device Pairing
  const applyCloudWorkspaceSnapshot = useCallback(
    (cloud: CloudWorkspacePayload) => {
      if (Array.isArray(cloud.cards) && cloud.cards.length > 0) setCards(cloud.cards);
      if (Array.isArray(cloud.playlists) && cloud.playlists.length > 0) {
        setPlaylists(cloud.playlists);
      }
      if (Array.isArray(cloud.scripts) && cloud.scripts.length > 0) {
        setScripts(cloud.scripts);
      }
      if (cloud.settings) setSettings((prev) => ({ ...prev, ...cloud.settings }));
      if (cloud.readingProgress) setReadingProgress(cloud.readingProgress);
      if (Array.isArray(cloud.favorites)) setFavorites(cloud.favorites);
      if (Array.isArray(cloud.studyMaterials)) {
        setStudyMaterials(cloud.studyMaterials);
      }
      if (Array.isArray(cloud.conversations)) {
        setConversations(cloud.conversations);
      }
      if (typeof cloud.syncVersion === 'number') {
        setSyncVersion(cloud.syncVersion);
        saveIndexedState('syncVersion', cloud.syncVersion);
      }
      const nowIso = new Date().toISOString();
      setLastSyncedAt(nowIso);
      saveIndexedState('lastSyncedAt', nowIso);
    },
    []
  );

  // Restore Authenticated User Session on Reload (NEVER auto-creates anonymous accounts)
  const isSessionReadyRef = useRef(false);
  useEffect(() => {
    let mounted = true;
    restoreAuthenticatedSession().then(async (restored) => {
      if (!mounted) return;
      if (!restored) {
        setUserProfile(null);
        setAccessToken('');
        isSessionReadyRef.current = true;
        return;
      }

      setUserProfile(restored.profile);
      setAccessToken(restored.accessToken);
      setSyncStatus(restored.profile.syncStatus || 'synced');

      const pulled = await pullCloudWorkspace(restored.profile.uid);
      if (mounted && pulled.ok && pulled.data) {
        const remoteVer = Number(pulled.data.syncVersion || 0);
        if (remoteVer >= syncVersion) {
          applyCloudWorkspaceSnapshot(pulled.data);
        }
      }
      isSessionReadyRef.current = true;
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to Supabase Realtime workspace changes for automatic multi-device sync by UID
  useEffect(() => {
    if (!userProfile?.uid) return;
    const unsubscribe = subscribeWorkspaceRealtime(userProfile.uid, async () => {
      const pulled = await pullCloudWorkspace(userProfile.uid);
      if (pulled.ok && pulled.data) {
        applyCloudWorkspaceSnapshot(pulled.data);
        setSyncStatus('synced');
      }
    });
    return () => {
      unsubscribe();
    };
  }, [applyCloudWorkspaceSnapshot, userProfile?.uid]);

  // Trigger Manual or Debounced Two-Way Cloud Sync
  const handleManualSync = useCallback(async () => {
    if (!userProfile?.uid) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      return;
    }
    setSyncStatus('syncing');
    const nextVer = syncVersion + 1;
    const payload: CloudWorkspacePayload = {
      cards,
      tracks,
      videos,
      playlists,
      scripts,
      queue,
      settings,
      readingProgress,
      studyMaterials,
      conversations,
      favorites,
      syncVersion: nextVer,
      updatedAt: new Date().toISOString(),
    };
    const res = await pushCloudWorkspace(userProfile.uid, payload);
    if (res.ok) {
      if (res.action === 'kept_remote_newer' && res.data) {
        applyCloudWorkspaceSnapshot(res.data);
        setSyncStatus('conflict-resolved');
      } else {
        setSyncVersion(nextVer);
        saveIndexedState('syncVersion', nextVer);
        const nowIso = new Date().toISOString();
        setLastSyncedAt(nowIso);
        saveIndexedState('lastSyncedAt', nowIso);
        setSyncStatus('synced');
      }
    } else {
      setSyncStatus('offline');
    }
  }, [
    applyCloudWorkspaceSnapshot,
    cards,
    conversations,
    favorites,
    playlists,
    queue,
    readingProgress,
    scripts,
    settings,
    studyMaterials,
    syncVersion,
    tracks,
    userProfile?.uid,
    videos,
  ]);

  // Debounced auto-sync when user workspace changes
  useEffect(() => {
    if (!isSessionReadyRef.current) return;
    const timer = setTimeout(() => {
      handleManualSync();
    }, 1800);
    return () => clearTimeout(timer);
  }, [
    cards,
    playlists,
    scripts,
    settings,
    readingProgress,
    favorites,
    studyMaterials,
    conversations,
  ]);

  // Online / Offline event listeners for automatic reconnect sync
  useEffect(() => {
    const onOnline = () => {
      handleManualSync();
    };
    const onOffline = () => {
      setSyncStatus('offline');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [handleManualSync]);

  // Global Text Selection Listener for Context-Aware "Hỏi Literature AI"
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection()?.toString().trim() || '';
      if (sel.length >= 12 && sel.length <= 1200) {
        setFloatingSelectionText(sel);
      } else if (sel.length === 0) {
        setFloatingSelectionText('');
      }
    };
    document.addEventListener('mouseup', onSelectionChange);
    document.addEventListener('keyup', onSelectionChange);
    return () => {
      document.removeEventListener('mouseup', onSelectionChange);
      document.removeEventListener('keyup', onSelectionChange);
    };
  }, []);

  // Storage usage estimate
  const [storageInfo, setStorageInfo] = useState({
    usedBytes: 2450000,
    quotaBytes: 524288000,
    percent: 0.47,
  });

  useEffect(() => {
    estimateStorageUsage().then(setStorageInfo);
  }, [tracks.length, videos.length, cards.length]);

  // ============================================================================
  // UNIFIED WEB AUDIO ENGINE & MASTER PLAYER STATE
  // ============================================================================
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const currentAudioBlobUrlRef = useRef<string | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(
    () => tracks[0] || null
  );
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(tracks[0]?.duration || 16);
  const [masterVolume, setMasterVolume] = useState(settings.defaultMasterVolume || 80);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [isShuffle, setIsShuffle] = useState(false);

  // Active Video state
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);

  // ============================================================================
  // TEXT-TO-SPEECH (TTS) & AUDIO DUCKING ENGINE
  // ============================================================================
  const [ttsText, setTtsText] = useState<string>(
    () =>
      `${INITIAL_LITERATURE_CARDS[0].title} – Tác giả ${INITIAL_LITERATURE_CARDS[0].author}.\n\n${INITIAL_LITERATURE_CARDS[0].summary}\n\nGiá trị nghệ thuật: ${INITIAL_LITERATURE_CARDS[0].artisticValue}`
  );
  const [ttsMode, setTtsMode] = useState<TTSMode>('poetry');
  const [ttsRate, setTtsRate] = useState<number>(settings.defaultTTSSpeed || 1.0);
  const [ttsVolume, setTtsVolume] = useState<number>(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(
    settings.defaultVoiceURI || ''
  );
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);
  const [isPausedTTS, setIsPausedTTS] = useState(false);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const ttsSessionIdRef = useRef(0);

  // Selected card for AI Assistant
  const [aiSelectedCardId, setAiSelectedCardId] = useState<string>(
    INITIAL_LITERATURE_CARDS[0].id
  );

  const ttsChunks = useMemo(
    () => splitTextForTTS(ttsText, ttsMode),
    [ttsText, ttsMode]
  );

  // Load browser SpeechSynthesis voices (prioritizing vi-VN)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      const list = window.speechSynthesis.getVoices();
      const sorted = [...list].sort((a, b) => {
        const aVi = a.lang.toLowerCase().includes('vi') ? -1 : 1;
        const bVi = b.lang.toLowerCase().includes('vi') ? -1 : 1;
        return aVi - bVi;
      });
      setVoices(sorted);
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Calculate effective volume with Audio Ducking
  const effectiveVolume = useMemo(
    () =>
      calculateDuckedVolume(
        masterVolume,
        isSpeakingTTS,
        settings.duckingPercent,
        isMuted
      ),
    [masterVolume, isSpeakingTTS, settings.duckingPercent, isMuted]
  );

  // Apply effective volume smoothly to Web Audio GainNode and HTMLAudioElement
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      try {
        gainNodeRef.current.gain.setTargetAtTime(
          effectiveVolume,
          audioCtxRef.current.currentTime,
          0.08
        );
      } catch {
        gainNodeRef.current.gain.value = effectiveVolume;
      }
    }
    if (audioElRef.current) {
      audioElRef.current.volume = effectiveVolume;
      audioElRef.current.muted = isMuted;
    }
  }, [effectiveVolume, isMuted]);

  // Initialize Web Audio Graph lazily on first playback
  const ensureAudioGraph = useCallback(() => {
    if (!audioElRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audioElRef.current = audio;
    }
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const source = ctx.createMediaElementSource(audioElRef.current);
        const gain = ctx.createGain();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        gain.gain.value = effectiveVolume;
        source.connect(gain);
        gain.connect(analyser);
        analyser.connect(ctx.destination);

        audioCtxRef.current = ctx;
        gainNodeRef.current = gain;
        setAnalyserNode(analyser);
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, [effectiveVolume]);

  // Resolve or synthesize audio Blob URL for a Track
  const resolveTrackUrl = useCallback(async (track: Track): Promise<string | null> => {
    if (track.sourceType === 'direct-url' && track.directUrl) {
      return track.directUrl;
    }

    // Check IndexedDB first
    const cachedBlob = await loadMediaBlob(track.id);
    if (cachedBlob) {
      return URL.createObjectURL(cachedBlob);
    }

    // If sample-synth track, synthesize real PCM WAV and cache in IndexedDB
    if (track.sourceType === 'sample-synth' && track.synthPreset) {
      const { blob } = synthesizeSampleWavBlob(track.synthPreset);
      await saveMediaBlob(track.id, blob);
      return URL.createObjectURL(blob);
    }

    return null;
  }, []);

  // Play a specific Track
  const handlePlayTrack = useCallback(
    async (track: Track) => {
      ensureAudioGraph();
      const audio = audioElRef.current;
      if (!audio) return;

      // Pause first to prevent overlapping playback
      audio.pause();

      const nextUrl = await resolveTrackUrl(track);
      if (!nextUrl) {
        notify(`Không tìm thấy dữ liệu âm thanh cho "${track.title}".`, 'error');
        return;
      }

      if (
        currentAudioBlobUrlRef.current &&
        currentAudioBlobUrlRef.current.startsWith('blob:')
      ) {
        URL.revokeObjectURL(currentAudioBlobUrlRef.current);
      }
      currentAudioBlobUrlRef.current = nextUrl;

      audio.src = nextUrl;
      audio.currentTime = 0;
      setCurrentTrack(track);
      setDuration(track.duration || 16);
      setCurrentTime(0);

      try {
        await audio.play();
        setIsPlayingMusic(true);
        logAction(`Phát bài nhạc: ${track.title}`, 'audio');
      } catch {
        setIsPlayingMusic(false);
        notify('Trình duyệt cần thao tác click trực tiếp để bắt đầu phát âm thanh.', 'info');
      }
    },
    [ensureAudioGraph, logAction, notify, resolveTrackUrl]
  );

  // Wire HTMLAudioElement timeupdate and ended events
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audioElRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMeta = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      setIsPlayingMusic(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('ended', onEnded);
      if (
        currentAudioBlobUrlRef.current &&
        currentAudioBlobUrlRef.current.startsWith('blob:')
      ) {
        URL.revokeObjectURL(currentAudioBlobUrlRef.current);
      }
    };
  }, [repeatMode]);

  const handleTogglePlayMusic = useCallback(() => {
    const audio = audioElRef.current;
    if (!audio) return;

    if (isPlayingMusic) {
      audio.pause();
      setIsPlayingMusic(false);
      logAction('Tạm dừng nhạc nền', 'audio');
    } else {
      if (!audio.src && currentTrack) {
        handlePlayTrack(currentTrack);
        return;
      }
      ensureAudioGraph();
      audio
        .play()
        .then(() => {
          setIsPlayingMusic(true);
          logAction(`Tiếp tục phát: ${currentTrack?.title || 'Nhạc nền'}`, 'audio');
        })
        .catch(() => {
          if (currentTrack) handlePlayTrack(currentTrack);
        });
    }
  }, [currentTrack, ensureAudioGraph, handlePlayTrack, isPlayingMusic, logAction]);

  const handleStopMusic = useCallback(() => {
    const audio = audioElRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlayingMusic(false);
    setCurrentTime(0);
    logAction('Dừng phát nhạc nền', 'audio');
  }, [logAction]);

  const handlePrevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIdx = idx > 0 ? idx - 1 : tracks.length - 1;
    handlePlayTrack(tracks[prevIdx]);
  }, [currentTrack?.id, handlePlayTrack, tracks]);

  const handleNextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    if (isShuffle && tracks.length > 1) {
      const randomIdx = Math.floor(Math.random() * tracks.length);
      handlePlayTrack(tracks[randomIdx]);
      return;
    }
    const idx = tracks.findIndex((t) => t.id === currentTrack?.id);
    const nextIdx = idx >= 0 && idx < tracks.length - 1 ? idx + 1 : 0;
    handlePlayTrack(tracks[nextIdx]);
  }, [currentTrack?.id, handlePlayTrack, isShuffle, tracks]);

  const handleSeekMusic = useCallback((sec: number) => {
    const audio = audioElRef.current;
    if (audio && audio.src) {
      audio.currentTime = sec;
    }
    setCurrentTime(sec);
  }, []);

  // ============================================================================
  // TTS SPEAKING CONTROLLERS (WITH AUTOMATIC AUDIO DUCKING)
  // ============================================================================
  const stopTTS = useCallback(() => {
    ttsSessionIdRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingTTS(false);
    setIsPausedTTS(false);
    setActiveChunkIndex(0);
  }, []);

  const startTTSWithParams = useCallback(
    (rawText: string, modeToUse: TTSMode) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        notify('Trình duyệt hiện tại không hỗ trợ Web Speech API.', 'error');
        return;
      }

      // Cancel any previous session so voices never overlap
      window.speechSynthesis.cancel();
      const sessionId = ++ttsSessionIdRef.current;

      const chunksToRead = splitTextForTTS(rawText, modeToUse);
      if (chunksToRead.length === 0) {
        notify('Vui lòng nhập nội dung văn bản cần đọc.', 'error');
        return;
      }

      setIsSpeakingTTS(true);
      setIsPausedTTS(false);
      setActiveChunkIndex(0);
      logAction(
        `Bắt đầu đọc TTS (${modeToUse === 'poetry' ? 'Chế độ Đọc thơ' : 'Văn bản'}) – Audio Ducking ${settings.duckingPercent}%`,
        'tts'
      );

      const chosenVoice =
        voices.find((v) => v.voiceURI === selectedVoiceURI) ||
        voices.find((v) => v.lang.toLowerCase().includes('vi')) ||
        voices[0];

      const speakChunkAt = (index: number) => {
        if (ttsSessionIdRef.current !== sessionId) return;
        if (index >= chunksToRead.length) {
          setIsSpeakingTTS(false);
          setIsPausedTTS(false);
          setActiveChunkIndex(0);
          return;
        }

        setActiveChunkIndex(index);
        const utter = new SpeechSynthesisUtterance(chunksToRead[index]);
        utter.lang = chosenVoice?.lang || 'vi-VN';
        if (chosenVoice) utter.voice = chosenVoice;

        // Mode-specific cadence & pitch adjustments
        if (modeToUse === 'poetry') {
          utter.rate = Math.max(0.5, ttsRate * 0.88);
          utter.pitch = 1.05;
        } else if (modeToUse === 'presentation') {
          utter.rate = ttsRate * 0.96;
          utter.pitch = 1.0;
        } else {
          utter.rate = ttsRate;
          utter.pitch = 1.0;
        }
        utter.volume = ttsVolume;

        utter.onend = () => {
          if (ttsSessionIdRef.current !== sessionId) return;
          const pauseMs = modeToUse === 'poetry' ? 420 : 180;
          setTimeout(() => {
            if (ttsSessionIdRef.current === sessionId) {
              speakChunkAt(index + 1);
            }
          }, pauseMs);
        };

        utter.onerror = () => {
          if (ttsSessionIdRef.current !== sessionId) return;
          setIsSpeakingTTS(false);
          setIsPausedTTS(false);
        };

        window.speechSynthesis.speak(utter);
      };

      speakChunkAt(0);
    },
    [
      logAction,
      notify,
      selectedVoiceURI,
      settings.duckingPercent,
      ttsRate,
      ttsVolume,
      voices,
    ]
  );

  const handlePauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPausedTTS(true);
    }
  }, []);

  const handleResumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPausedTTS(false);
    }
  }, []);

  // Compute Master Status (Section 7)
  const masterStatus: MasterStatus = useMemo(() => {
    if (isSpeakingTTS && !isPausedTTS) {
      return ttsMode === 'poetry' ? 'Reading Poetry' : 'Reading Literature';
    }
    if (isPlayingVideo) return 'Playing Video';
    if (isPlayingMusic) return 'Playing Music';
    if (isPausedTTS || (currentTime > 0 && !isPlayingMusic)) return 'Paused';
    return 'Idle';
  }, [currentTime, isPausedTTS, isPlayingMusic, isPlayingVideo, isSpeakingTTS, ttsMode]);

  // ============================================================================
  // UPLOAD & DATA HANDLERS
  // ============================================================================
  const handleUploadMusicFiles = useCallback(
    async (fileList: FileList, isFolder: boolean) => {
      const validExts = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;
      const incoming: Track[] = [];
      const blobsToSave: { id: string; blob: Blob }[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file.type.startsWith('audio/') && !validExts.test(file.name)) {
          continue;
        }

        const relPath =
          (file as unknown as { webkitRelativePath?: string }).webkitRelativePath || '';
        const pathParts = relPath.split('/').filter(Boolean);
        const folderName =
          isFolder && pathParts.length > 1 ? pathParts[0] : undefined;

        // Read audio duration via temporary ObjectURL
        const tempUrl = URL.createObjectURL(file);
        const dur = await new Promise<number>((resolve) => {
          const tempAudio = new Audio();
          tempAudio.preload = 'metadata';
          tempAudio.onloadedmetadata = () => {
            URL.revokeObjectURL(tempUrl);
            resolve(Number.isFinite(tempAudio.duration) ? tempAudio.duration : 180);
          };
          tempAudio.onerror = () => {
            URL.revokeObjectURL(tempUrl);
            resolve(180);
          };
          tempAudio.src = tempUrl;
        });

        const id = `track-up-${Date.now()}-${i}`;
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
        const autoCategory =
          folderName && musicCategories.includes(folderName)
            ? folderName
            : 'Nhạc nền thuyết trình';

        incoming.push({
          id,
          title: cleanTitle,
          artist: folderName || 'Tải lên từ máy tính',
          category: autoCategory,
          duration: dur,
          size: file.size,
          addedAt: new Date().toISOString(),
          coverUrl: COVER_PIANO_IMG,
          sourceType: isFolder ? 'uploaded-folder' : 'uploaded-file',
          folderName,
        });
        blobsToSave.push({ id, blob: file });
      }

      if (incoming.length === 0) {
        notify('Không tìm thấy file âm thanh hợp lệ (MP3, WAV, OGG, M4A, AAC, FLAC).', 'error');
        return;
      }

      const { added, skippedCount } = deduplicateTracks(tracks, incoming);
      for (const item of added) {
        const matchBlob = blobsToSave.find((b) => b.id === item.id);
        if (matchBlob) {
          await saveMediaBlob(item.id, matchBlob.blob);
        }
      }

      if (added.length > 0) {
        setTracks((prev) => [...added, ...prev]);
        logAction(
          `Tải lên ${added.length} bản nhạc mới${skippedCount > 0 ? ` (bỏ qua ${skippedCount} file trùng)` : ''}`,
          'audio'
        );
        notify(
          `Đã thêm ${added.length} bài hát vào thư viện${skippedCount > 0 ? ` (bỏ qua ${skippedCount} bài trùng)` : ''}.`
        );
      } else {
        notify(`Tất cả ${skippedCount} file đã tồn tại trong thư viện.`, 'info');
      }
    },
    [logAction, musicCategories, notify, tracks]
  );

  const handleUploadVideos = useCallback(
    async (fileList: FileList) => {
      const added: VideoItem[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file.type.startsWith('video/') && !/\.(mp4|webm|ogv|ogg)$/i.test(file.name)) {
          continue;
        }
        const id = `vid-up-${Date.now()}-${i}`;
        await saveMediaBlob(id, file);
        added.push({
          id,
          title: file.name.replace(/\.[^/.]+$/, ''),
          sourceType: 'uploaded-video',
          duration: 0,
          size: file.size,
          addedAt: new Date().toISOString(),
        });
      }

      if (added.length === 0) {
        notify('Vui lòng chọn file video định dạng MP4, WebM hoặc OGG.', 'error');
        return;
      }

      setVideos((prev) => [...added, ...prev]);
      notify(`Đã tải lên ${added.length} video vào thư viện.`);
      logAction(`Tải lên ${added.length} file video`, 'video');

      // Auto-select first uploaded video
      const first = added[0];
      const blob = await loadMediaBlob(first.id);
      if (blob) {
        if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
        setVideoObjectUrl(URL.createObjectURL(blob));
        setActiveVideo(first);
      }
    },
    [logAction, notify, videoObjectUrl]
  );

  const handleSelectVideoToPlay = useCallback(
    async (vid: VideoItem) => {
      if (vid.sourceType === 'uploaded-video') {
        const blob = await loadMediaBlob(vid.id);
        if (blob) {
          if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
          setVideoObjectUrl(URL.createObjectURL(blob));
        }
      } else {
        if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
        setVideoObjectUrl(null);
      }
      setActiveVideo(vid);
      setActiveTab('video');
      logAction(`Mở video: ${vid.title}`, 'video');
    },
    [logAction, videoObjectUrl]
  );

  const handleAddUrlMedia = useCallback(
    (title: string, rawUrl: string, mode: 'play-now' | 'add-queue') => {
      const parsed = parseMediaUrl(rawUrl);
      if (parsed.type === 'unsupported') {
        return { ok: false, error: parsed.reason };
      }

      if (parsed.type === 'mp3') {
        const newTrack: Track = {
          id: `track-url-${Date.now()}`,
          title,
          artist: 'Direct Audio URL',
          category: 'Nhạc nền thuyết trình',
          duration: 180,
          size: 0,
          addedAt: new Date().toISOString(),
          sourceType: 'direct-url',
          directUrl: rawUrl,
        };
        setTracks((prev) => [newTrack, ...prev]);
        if (mode === 'play-now') {
          handlePlayTrack(newTrack);
        } else {
          setQueue((prev) => [
            ...prev,
            {
              id: `q-${Date.now()}`,
              mediaId: newTrack.id,
              mediaType: 'music',
              title: newTrack.title,
              subtitle: newTrack.artist,
              duration: newTrack.duration,
            },
          ]);
        }
        notify(`Đã thêm luồng âm thanh URL: ${title}`);
        return { ok: true };
      }

      const newVid: VideoItem = {
        id: `vid-url-${Date.now()}`,
        title,
        sourceType: parsed.type === 'youtube' ? 'youtube-embed' : 'direct-mp4',
        url: rawUrl,
        embedUrl: parsed.embedUrl,
        duration: 0,
        size: 0,
        addedAt: new Date().toISOString(),
      };
      setVideos((prev) => [newVid, ...prev]);
      if (mode === 'play-now') {
        setActiveVideo(newVid);
      } else {
        setQueue((prev) => [
          ...prev,
          {
            id: `q-${Date.now()}`,
            mediaId: newVid.id,
            mediaType: 'video',
            title: newVid.title,
            subtitle:
              newVid.sourceType === 'youtube-embed' ? 'YouTube Embed' : 'Direct MP4',
            duration: 0,
          },
        ]);
      }
      notify(`Đã thêm video URL: ${title}`);
      return { ok: true };
    },
    [handlePlayTrack, notify]
  );

  // Export & Import Full Backup JSON
  const handleExportFullBackup = useCallback(() => {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      musicCategories,
      tracks,
      videos,
      cards,
      playlists,
      scripts,
      queue,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `literature-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Đã xuất file sao lưu toàn bộ dữ liệu Literature Studio (.JSON).');
    logAction('Xuất bản sao lưu JSON toàn hệ thống', 'system');
  }, [cards, logAction, musicCategories, notify, playlists, queue, scripts, settings, tracks, videos]);

  const handleImportFullBackup = useCallback(
    (rawJson: string) => {
      try {
        const data = JSON.parse(rawJson);
        if (data.cards && Array.isArray(data.cards)) setCards(data.cards);
        if (data.tracks && Array.isArray(data.tracks)) setTracks(data.tracks);
        if (data.playlists && Array.isArray(data.playlists)) setPlaylists(data.playlists);
        if (data.scripts && Array.isArray(data.scripts)) setScripts(data.scripts);
        if (data.musicCategories && Array.isArray(data.musicCategories)) {
          setMusicCategories(data.musicCategories);
        }
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
        notify('Đã khôi phục dữ liệu từ bản sao lưu JSON thành công!');
        logAction('Nhập bản sao lưu JSON thành công', 'system');
      } catch {
        notify('File JSON sao lưu không hợp lệ.', 'error');
      }
    },
    [logAction, notify]
  );

  // Download Standalone Single-File index.html (for Windows 11 Chrome)
  const handleDownloadStandaloneHtml = useCallback(() => {
    const htmlContent = generateStandaloneSingleFileHtml({
      cards,
      tracks,
      playlists,
      scripts,
      settings,
    });
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
    notify('Đã tải xuống file index.html độc lập (Standalone Windows 11 Edition)!');
    logAction('Tải xuống file index.html độc lập', 'system');
  }, [cards, logAction, notify, playlists, scripts, settings, tracks]);

  const navItems: { id: WorkspaceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'music', label: 'Music Library', icon: <Music className="w-4 h-4" /> },
    { id: 'video', label: 'Video Library', icon: <Film className="w-4 h-4" /> },
    { id: 'literature', label: 'Literature Library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'study', label: 'Khu Vực Học Tập', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'ai', label: 'Literature AI (OpenAI)', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'tts', label: 'Text-to-Speech', icon: <Mic className="w-4 h-4" /> },
    { id: 'playlists', label: 'Playlists & Queue', icon: <ListMusic className="w-4 h-4" /> },
    {
      id: 'presentation',
      label: 'Presentation Mode',
      icon: <Presentation className="w-4 h-4" />,
    },
    {
      id: 'meeting',
      label: 'Meeting Share',
      icon: <Share2 className="w-4 h-4" />,
    },
    {
      id: 'account',
      label: 'Hồ Sơ & Thiết Bị',
      icon: <UserCheck className="w-4 h-4" />,
    },
    ...(userProfile?.role === 'admin'
      ? [
          {
            id: 'admin' as WorkspaceTab,
            label: 'Literature Studio Admin',
            icon: <Shield className="w-4 h-4" />,
          },
        ]
      : []),
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const hideChromeForStage = activeTab === 'presentation' && isStageFullscreen;

  // MANDATORY AUTH GATE: Require login/registration or initial password change before accessing the studio
  if (!userProfile || userProfile.mustChangePassword) {
    return (
      <AuthGateView
        mustChangePasswordUser={userProfile?.mustChangePassword ? userProfile : null}
        onAuthenticated={async (profile, token) => {
          setUserProfile(profile);
          setAccessToken(token);
          setSyncStatus('synced');
          logAction(
            `Đăng nhập thành công: @${profile.username} (${profile.role})`,
            'auth'
          );
          const pulled = await pullCloudWorkspace(profile.uid);
          if (pulled.ok && pulled.data) {
            applyCloudWorkspaceSnapshot(pulled.data);
            notify('Đã tự động tải dữ liệu đồng bộ đa thiết bị theo UID!');
          } else {
            notify(`Chào mừng @${profile.username} đến với Literature Studio!`);
          }
        }}
        onPasswordChanged={(updated) => {
          if (updated) {
            setUserProfile(updated);
          } else if (userProfile) {
            setUserProfile({ ...userProfile, mustChangePassword: false });
          }
          notify('Đã đổi mật khẩu khởi tạo thành công!');
        }}
        onSignOutForcedChange={() => {
          setUserProfile(null);
          setAccessToken('');
        }}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-[#F5F2EB]">
      {/* Global Context-Aware Floating "Hỏi Literature AI" Pill when text is highlighted */}
      {floatingSelectionText && activeTab !== 'ai' && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#D4AF37] bg-[#111726]/95 text-[#F5F2EB] shadow-2xl text-xs">
          <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span className="max-w-xs truncate italic text-slate-300">
            &ldquo;{floatingSelectionText}&rdquo;
          </span>
          <button
            type="button"
            onClick={() => {
              setContextPassage(floatingSelectionText);
              setFloatingSelectionText('');
              setActiveTab('ai');
              notify('Đã nạp đoạn văn bản đang chọn vào Literature AI.');
            }}
            className="px-3 py-1 rounded-lg bg-[#D4AF37] text-slate-950 font-bold cursor-pointer shrink-0"
          >
            Hỏi Literature AI
          </button>
          <button
            type="button"
            onClick={() => setFloatingSelectionText('')}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toast Notifications */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-xs font-medium transition-all ${
              t.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/40 text-rose-200'
                : 'bg-[#111726]/95 border-[#D4AF37]/50 text-[#F5F2EB]'
            }`}
          >
            {t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
            )}
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* Mobile Top Header Bar */}
      {!hideChromeForStage && (
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1320] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="text-lg font-bold tracking-tight text-[#D4AF37] font-editorial whitespace-nowrap shrink-0 cursor-pointer"
          >
            Literature Studio
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Mở menu điều hướng"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>
      )}

      {/* Upper 3-Column Studio Body (Sidebar + Main Workspace + Right Inspector) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Zone A: Left Sidebar */}
        {!hideChromeForStage && (
          <aside
            aria-label="Thanh điều hướng chính"
            className={`${
              mobileMenuOpen
                ? 'fixed inset-y-0 left-0 z-40 flex'
                : 'hidden lg:flex'
            } w-60 shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1320] flex-col justify-between p-4 overflow-y-auto`}
          >
            <div className="space-y-5">
              {/* Brand Lockup */}
              <div className="px-2 pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left cursor-pointer"
                >
                  <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#F5F2EB] font-editorial">
                    Literature <span className="text-[#D4AF37]">Studio</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    OpenAI · Supabase · Multi-Sync
                  </div>
                </button>
                {mobileMenuOpen && (
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Đóng menu"
                    className="lg:hidden p-1 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#D4AF37] text-slate-950 font-semibold shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Account & Cloud Sync + Audio Ducking Card */}
            <div className="space-y-2 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131A2B] text-left text-[11px] space-y-1 hover:border-[#D4AF37] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                  <span className="truncate">{userProfile.displayName}</span>
                  {syncStatus === 'offline' ? (
                    <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>
                    {userProfile.role === 'admin' ? 'Admin' : 'Thành viên'} · @
                    {userProfile.username}
                  </span>
                  <span className="text-[#D4AF37]">
                    {syncStatus === 'syncing'
                      ? 'Đang đồng bộ'
                      : syncStatus === 'offline'
                      ? 'Offline'
                      : 'Đã đồng bộ'}
                  </span>
                </div>
              </button>

              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131A2B] text-[11px] space-y-0.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Audio Ducking: {settings.duckingPercent}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isSpeakingTTS
                    ? 'Đang giảm nhạc nền ưu tiên giọng đọc.'
                    : 'Tự động giảm nhạc nền khi đọc TTS.'}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Zone B: Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                tracks={tracks}
                videos={videos}
                cards={cards}
                playlists={playlists}
                analyser={analyserNode}
                isPlayingMusic={isPlayingMusic}
                isSpeakingTTS={isSpeakingTTS}
                onNavigateTab={setActiveTab}
                onPlayTrack={handlePlayTrack}
                onSendCardToTTS={(card) => {
                  setTtsText(
                    `${card.title} – Tác giả ${card.author}.\n\n${card.summary}\n\nGiá trị nghệ thuật: ${card.artisticValue}`
                  );
                  setTtsMode(card.genre.toLowerCase().includes('thơ') ? 'poetry' : 'prose');
                  setActiveTab('tts');
                }}
                onSendCardToAI={(card) => {
                  setAiSelectedCardId(card.id);
                  setActiveTab('ai');
                }}
                onPlayPlaylist={(pl) => {
                  const firstId = pl.trackIds[0];
                  const found = tracks.find((t) => t.id === firstId);
                  if (found) handlePlayTrack(found);
                }}
                onDownloadStandaloneHtml={handleDownloadStandaloneHtml}
              />
            )}

            {activeTab === 'music' && (
              <MusicLibraryView
                tracks={tracks}
                categories={musicCategories}
                currentTrackId={currentTrack?.id || null}
                isPlaying={isPlayingMusic}
                onPlayTrack={handlePlayTrack}
                onAddToQueue={(track) => {
                  setQueue((prev) => [
                    ...prev,
                    {
                      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                      mediaId: track.id,
                      mediaType: 'music',
                      title: track.title,
                      subtitle: track.artist,
                      duration: track.duration,
                      coverUrl: track.coverUrl,
                    },
                  ]);
                  notify(`Đã thêm "${track.title}" vào danh sách chờ phát.`);
                  logAction(`Thêm vào Queue: ${track.title}`, 'audio');
                }}
                onUploadFiles={handleUploadMusicFiles}
                onUpdateTrack={(updated) => {
                  setTracks((prev) =>
                    prev.map((t) => (t.id === updated.id ? updated : t))
                  );
                  if (currentTrack?.id === updated.id) setCurrentTrack(updated);
                  notify(`Đã cập nhật thông tin bài hát "${updated.title}".`);
                  logAction(`Cập nhật bài hát: ${updated.title}`, 'audio');
                }}
                onDeleteTracks={async (ids) => {
                  for (const id of ids) {
                    await deleteMediaBlob(id);
                  }
                  setTracks((prev) => prev.filter((t) => !ids.includes(t.id)));
                  setQueue((prev) => prev.filter((q) => !ids.includes(q.mediaId)));
                  notify(`Đã xóa ${ids.length} bài hát khỏi thư viện.`);
                  logAction(`Xóa ${ids.length} bài hát`, 'audio');
                }}
                onClearLibrary={async () => {
                  handleStopMusic();
                  await clearAllMediaBlobs();
                  setTracks([]);
                  setQueue([]);
                  notify('Đã xóa toàn bộ thư viện âm nhạc.');
                  logAction('Xóa toàn bộ thư viện nhạc', 'audio');
                }}
                onAddCategory={(name) => {
                  if (!musicCategories.includes(name)) {
                    setMusicCategories((prev) => [...prev, name]);
                    notify(`Đã thêm danh mục "${name}".`);
                  }
                }}
                onRenameCategory={(oldName, newName) => {
                  setMusicCategories((prev) =>
                    prev.map((c) => (c === oldName ? newName : c))
                  );
                  setTracks((prev) =>
                    prev.map((t) =>
                      t.category === oldName ? { ...t, category: newName } : t
                    )
                  );
                  notify(`Đã đổi tên danh mục "${oldName}" → "${newName}".`);
                }}
                onDeleteCategory={(name) => {
                  setMusicCategories((prev) => prev.filter((c) => c !== name));
                  setTracks((prev) =>
                    prev.map((t) =>
                      t.category === name ? { ...t, category: 'Nhạc khác' } : t
                    )
                  );
                  notify(`Đã xóa danh mục "${name}".`);
                }}
              />
            )}

            {activeTab === 'video' && (
              <VideoMediaView
                videos={videos}
                activeVideo={activeVideo}
                videoObjectUrl={videoObjectUrl}
                onUploadVideos={handleUploadVideos}
                onAddUrlMedia={handleAddUrlMedia}
                onPlayVideo={handleSelectVideoToPlay}
                onAddVideoToQueue={(vid) => {
                  setQueue((prev) => [
                    ...prev,
                    {
                      id: `q-vid-${Date.now()}`,
                      mediaId: vid.id,
                      mediaType: 'video',
                      title: vid.title,
                      subtitle: 'Video Media',
                      duration: vid.duration,
                    },
                  ]);
                  notify(`Đã thêm video "${vid.title}" vào hàng chờ.`);
                }}
                onDeleteVideo={async (id) => {
                  await deleteMediaBlob(id);
                  setVideos((prev) => prev.filter((v) => v.id !== id));
                  if (activeVideo?.id === id) setActiveVideo(null);
                  notify('Đã xóa video khỏi thư viện.');
                }}
                onVideoPlayStateChange={setIsPlayingVideo}
              />
            )}

            {activeTab === 'literature' && (
              <LiteratureLibraryView
                cards={cards}
                onSaveCard={(card, isNew) => {
                  if (isNew) {
                    setCards((prev) => [card, ...prev]);
                    notify(`Đã thêm thẻ tác phẩm "${card.title}".`);
                    logAction(`Thêm thẻ văn học: ${card.title}`, 'literature');
                  } else {
                    setCards((prev) =>
                      prev.map((c) => (c.id === card.id ? card : c))
                    );
                    notify(`Đã lưu chỉnh sửa thẻ "${card.title}".`);
                    logAction(`Cập nhật thẻ văn học: ${card.title}`, 'literature');
                  }
                }}
                onDeleteCard={(id) => {
                  setCards((prev) => prev.filter((c) => c.id !== id));
                  notify('Đã xóa thẻ tác phẩm văn học.');
                  logAction('Xóa thẻ văn học', 'literature');
                }}
                onDuplicateCard={(card) => {
                  const copy: LiteratureCard = {
                    ...card,
                    id: `lit-copy-${Date.now()}`,
                    title: `${card.title} (Bản sao)`,
                    updatedAt: new Date().toISOString(),
                  };
                  setCards((prev) => [copy, ...prev]);
                  notify(`Đã nhân bản thẻ "${card.title}".`);
                }}
                onTogglePin={(id) => {
                  setCards((prev) =>
                    prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
                  );
                }}
                onSendToTTS={(card) => {
                  setTtsText(
                    `${card.title} – Tác giả ${card.author}.\n\nHoàn cảnh sáng tác: ${card.creationContext}\n\nNội dung chính: ${card.summary}\n\nGiá trị nghệ thuật: ${card.artisticValue}\n\nNhận định: ${card.commentary}`
                  );
                  setTtsMode(card.genre.toLowerCase().includes('thơ') ? 'poetry' : 'prose');
                  setActiveTab('tts');
                  notify(`Đã nạp "${card.title}" vào phòng đọc TTS.`);
                }}
                onSendToAI={(card) => {
                  setAiSelectedCardId(card.id);
                  setActiveTab('ai');
                }}
                onImportCardsJson={(imported) => {
                  setCards((prev) => [...imported, ...prev]);
                  notify(`Đã nhập ${imported.length} thẻ văn học từ file JSON.`);
                }}
                onExportCardsJson={() => {
                  const blob = new Blob([JSON.stringify(cards, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'literature-cards.json';
                  a.click();
                  URL.revokeObjectURL(url);
                  notify('Đã xuất dữ liệu Kho Văn Học ra file JSON.');
                }}
              />
            )}

            {activeTab === 'tts' && (
              <TTSStudioView
                cards={cards}
                ttsText={ttsText}
                onChangeTtsText={setTtsText}
                ttsMode={ttsMode}
                onChangeTtsMode={setTtsMode}
                ttsRate={ttsRate}
                onChangeTtsRate={setTtsRate}
                ttsVolume={ttsVolume}
                onChangeTtsVolume={setTtsVolume}
                voices={voices}
                selectedVoiceURI={selectedVoiceURI}
                onChangeVoiceURI={setSelectedVoiceURI}
                isSpeaking={isSpeakingTTS}
                isPaused={isPausedTTS}
                chunks={ttsChunks}
                activeChunkIndex={activeChunkIndex}
                isDuckingActive={isSpeakingTTS}
                duckingPercent={settings.duckingPercent}
                onStartRead={(customSlice) =>
                  startTTSWithParams(customSlice || ttsText, ttsMode)
                }
                onPauseRead={handlePauseTTS}
                onResumeRead={handleResumeTTS}
                onStopRead={stopTTS}
              />
            )}

            {activeTab === 'study' && (
              <StudyHubView
                cards={cards}
                readingProgress={readingProgress}
                onUpdateReadingProgress={(workId, nextProg) => {
                  setReadingProgress((prev) => ({ ...prev, [workId]: nextProg }));
                  logAction(`Cập nhật tiến độ đọc: ${nextProg.workTitle}`, 'literature');
                }}
                favorites={favorites}
                onToggleFavorite={(workId) => {
                  setFavorites((prev) =>
                    prev.includes(workId)
                      ? prev.filter((id) => id !== workId)
                      : [...prev, workId]
                  );
                }}
                studyMaterials={studyMaterials}
                onDeleteStudyMaterial={(id) => {
                  setStudyMaterials((prev) => prev.filter((m) => m.id !== id));
                  notify('Đã xóa tài liệu học tập.');
                }}
                onAskAIAboutPassage={(workId, passage) => {
                  setAiSelectedCardId(workId);
                  setContextPassage(passage);
                  setActiveTab('ai');
                }}
                onReadFromCursorTTS={(text, mode) => {
                  setTtsText(text);
                  setTtsMode(mode);
                  startTTSWithParams(text, mode);
                }}
                notify={notify}
              />
            )}

            {activeTab === 'ai' && (
              <LiteratureAIView
                uid={userProfile.uid}
                cards={cards}
                selectedCardId={aiSelectedCardId}
                onSelectCardId={setAiSelectedCardId}
                conversations={conversations}
                onUpdateConversations={setConversations}
                contextPassage={contextPassage}
                onClearContextPassage={() => setContextPassage('')}
                onSaveResultAsCard={(newCard) => {
                  setCards((prev) => [newCard, ...prev]);
                  notify(`Đã lưu bài phân tích thành thẻ văn học "${newCard.title}".`);
                  logAction(`Lưu phân tích AI: ${newCard.title}`, 'ai');
                }}
                onSaveStudyMaterial={(material) => {
                  setStudyMaterials((prev) => [material, ...prev]);
                  logAction(`Lưu học liệu: ${material.title}`, 'ai');
                }}
                onSendResultToTTS={(text, mode) => {
                  setTtsText(text);
                  setTtsMode(mode);
                  setActiveTab('tts');
                  notify('Đã chuyển bài phân tích sang phòng đọc TTS.');
                }}
                onAppendResultToScript={(stageTitle, workTitle, author, content) => {
                  setScripts((prev) => {
                    const first = prev[0];
                    if (!first) return prev;
                    const updated: PresentationScript = {
                      ...first,
                      steps: [
                        ...first.steps,
                        {
                          id: `step-ai-${Date.now()}`,
                          stepNumber: first.steps.length + 1,
                          stageTitle,
                          workTitle,
                          author,
                          content,
                          ttsText: content,
                          ttsMode: 'presentation',
                          autoReadTTS: false,
                          backgroundTrackId: tracks[0]?.id,
                        },
                      ],
                      updatedAt: new Date().toISOString(),
                    };
                    return [updated, ...prev.slice(1)];
                  });
                  notify(`Đã thêm bước "${stageTitle}" vào Kịch Bản Thuyết Trình.`);
                }}
                notify={notify}
              />
            )}

            {activeTab === 'account' && (
              <AccountAndDeviceView
                profile={userProfile}
                accessToken={accessToken}
                syncStatus={syncStatus}
                lastSyncedAt={lastSyncedAt}
                onProfileChange={async (nextProfile, nextToken) => {
                  setUserProfile(nextProfile);
                  if (nextToken) setAccessToken(nextToken);
                  logAction(
                    `Cập nhật hồ sơ: @${nextProfile.username} (${nextProfile.uid.slice(0, 6)})`,
                    'auth'
                  );
                }}
                onTriggerManualSync={handleManualSync}
                onSignOut={async () => {
                  handleStopMusic();
                  stopTTS();
                  setUserProfile(null);
                  setAccessToken('');
                  setActiveTab('dashboard');
                  notify('Đã đăng xuất khỏi tài khoản thành công.');
                }}
                onNavigateAdmin={
                  userProfile.role === 'admin'
                    ? () => setActiveTab('admin')
                    : undefined
                }
                notify={notify}
              />
            )}

            {activeTab === 'admin' && userProfile.role === 'admin' && (
              <AdminDashboardView
                currentAdmin={userProfile}
                notify={notify}
              />
            )}

            {activeTab === 'playlists' && (
              <PlaylistsView
                playlists={playlists}
                tracks={tracks}
                queue={queue}
                repeatMode={repeatMode}
                isShuffle={isShuffle}
                onCreatePlaylist={(name, description, trackIds) => {
                  const nextPl: Playlist = {
                    id: `pl-${Date.now()}`,
                    name,
                    description,
                    trackIds,
                    createdAt: new Date().toISOString(),
                  };
                  setPlaylists((prev) => [nextPl, ...prev]);
                  notify(`Đã tạo Playlist "${name}".`);
                  logAction(`Tạo Playlist: ${name}`, 'audio');
                }}
                onRenamePlaylist={(id, name, description) => {
                  setPlaylists((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, name, description } : p))
                  );
                  notify(`Đã cập nhật Playlist "${name}".`);
                }}
                onDeletePlaylist={(id) => {
                  setPlaylists((prev) => prev.filter((p) => p.id !== id));
                  notify('Đã xóa Playlist.');
                }}
                onUpdatePlaylistTracks={(plId, trackIds) => {
                  setPlaylists((prev) =>
                    prev.map((p) => (p.id === plId ? { ...p, trackIds } : p))
                  );
                  notify('Đã cập nhật danh sách bài hát trong Playlist.');
                }}
                onPlayPlaylist={(pl, shuffle) => {
                  const list = pl.trackIds
                    .map((id) => tracks.find((t) => t.id === id))
                    .filter((t): t is Track => Boolean(t));
                  if (list.length === 0) {
                    notify('Playlist này chưa có bài hát.', 'info');
                    return;
                  }
                  const ordered = shuffle
                    ? [...list].sort(() => Math.random() - 0.5)
                    : list;
                  setQueue(
                    ordered.map((t, i) => ({
                      id: `q-pl-${Date.now()}-${i}`,
                      mediaId: t.id,
                      mediaType: 'music',
                      title: t.title,
                      subtitle: t.artist,
                      duration: t.duration,
                      coverUrl: t.coverUrl,
                    }))
                  );
                  if (currentTrack?.id !== ordered[0].id || !isPlayingMusic) {
                    handlePlayTrack(ordered[0]);
                  }
                  notify(`Đang phát Playlist: ${pl.name}`);
                }}
                onPlayQueueItem={(idx) => {
                  const item = queue[idx];
                  if (!item) return;
                  if (item.mediaType === 'music') {
                    const tr = tracks.find((t) => t.id === item.mediaId);
                    if (tr) handlePlayTrack(tr);
                  } else {
                    const vid = videos.find((v) => v.id === item.mediaId);
                    if (vid) handleSelectVideoToPlay(vid);
                  }
                }}
                onRemoveQueueItem={(id) => {
                  setQueue((prev) => prev.filter((q) => q.id !== id));
                }}
                onMoveQueueItem={(idx, dir) => {
                  setQueue((prev) => {
                    const arr = [...prev];
                    const target = dir === 'up' ? idx - 1 : idx + 1;
                    if (target < 0 || target >= arr.length) return prev;
                    const tmp = arr[idx];
                    arr[idx] = arr[target];
                    arr[target] = tmp;
                    return arr;
                  });
                }}
                onClearQueue={() => setQueue([])}
                onToggleShuffle={() => setIsShuffle((v) => !v)}
                onCycleRepeatMode={() =>
                  setRepeatMode((m) =>
                    m === 'none' ? 'all' : m === 'all' ? 'one' : 'none'
                  )
                }
              />
            )}

            {activeTab === 'presentation' && (
              <PresentationModeView
                scripts={scripts}
                tracks={tracks}
                analyser={analyserNode}
                isPlayingMusic={isPlayingMusic}
                isSpeakingTTS={isSpeakingTTS}
                isStageFullscreen={isStageFullscreen}
                onToggleStageFullscreen={() => setIsStageFullscreen((v) => !v)}
                onPlayTrackById={(trackId) => {
                  const found = tracks.find((t) => t.id === trackId);
                  if (found) handlePlayTrack(found);
                }}
                onToggleMusicPlay={handleTogglePlayMusic}
                onSpeakStepText={(text, mode) => {
                  setTtsText(text);
                  setTtsMode(mode);
                  startTTSWithParams(text, mode);
                }}
                onStopAllPresentationMedia={() => {
                  handleStopMusic();
                  stopTTS();
                  notify('Đã tạm dừng toàn bộ âm thanh và giọng đọc thuyết trình.');
                }}
                onSaveScript={(updated) => {
                  setScripts((prev) =>
                    prev.map((s) => (s.id === updated.id ? updated : s))
                  );
                  notify('Đã cập nhật Kịch Bản Thuyết Trình.');
                }}
              />
            )}

            {activeTab === 'meeting' && (
              <MeetingIntegrationView
                masterStatus={masterStatus}
                isPlayingMusic={isPlayingMusic}
                isPlayingVideo={isPlayingVideo}
                isSpeakingTTS={isSpeakingTTS}
                onDownloadStandaloneHtml={handleDownloadStandaloneHtml}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsAndDataView
                settings={settings}
                voices={voices}
                storageInfo={storageInfo}
                onUpdateSettings={(partial) => {
                  setSettings((prev) => {
                    const next = { ...prev, ...partial };
                    if (partial.defaultMasterVolume !== undefined) {
                      setMasterVolume(partial.defaultMasterVolume);
                    }
                    if (partial.defaultTTSSpeed !== undefined) {
                      setTtsRate(partial.defaultTTSSpeed);
                    }
                    if (partial.defaultVoiceURI !== undefined) {
                      setSelectedVoiceURI(partial.defaultVoiceURI);
                    }
                    return next;
                  });
                  notify('Đã lưu tùy chọn cài đặt.');
                }}
                onExportBackupJson={handleExportFullBackup}
                onImportBackupJson={handleImportFullBackup}
                onDownloadStandaloneHtml={handleDownloadStandaloneHtml}
                onResetAllData={async () => {
                  handleStopMusic();
                  stopTTS();
                  await clearAllMediaBlobs();
                  localStorage.clear();
                  setSettings(DEFAULT_SETTINGS);
                  setTracks(INITIAL_TRACKS);
                  setMusicCategories(DEFAULT_MUSIC_CATEGORIES);
                  setVideos(INITIAL_VIDEOS);
                  setCards(INITIAL_LITERATURE_CARDS);
                  setPlaylists(INITIAL_PLAYLISTS);
                  setScripts(INITIAL_PRESENTATION_SCRIPTS);
                  notify('Đã khôi phục toàn bộ dữ liệu và cài đặt về mặc định.');
                }}
              />
            )}
          </div>
        </main>

        {/* Zone C: Right Inspector Panel */}
        {!hideChromeForStage && (
          <div className="hidden xl:block h-full">
            <RightInspectorPanel
              queue={queue}
              currentTrack={currentTrack}
              cards={cards}
              history={history}
              analyser={analyserNode}
              isPlayingMusic={isPlayingMusic}
              isSpeakingTTS={isSpeakingTTS}
              onPlayQueueItem={(idx) => {
                const item = queue[idx];
                if (!item) return;
                const tr = tracks.find((t) => t.id === item.mediaId);
                if (tr) handlePlayTrack(tr);
              }}
              onRemoveQueueItem={(id) =>
                setQueue((prev) => prev.filter((q) => q.id !== id))
              }
              onSendCardToTTS={(card) => {
                setTtsText(
                  `${card.title} – Tác giả ${card.author}.\n\n${card.summary}\n\nGiá trị nghệ thuật: ${card.artisticValue}`
                );
                setTtsMode(card.genre.toLowerCase().includes('thơ') ? 'poetry' : 'prose');
                setActiveTab('tts');
              }}
            />
          </div>
        )}
      </div>

      {/* Zone D: Bottom Master Player */}
      <BottomMasterPlayer
        currentTrack={currentTrack}
        masterStatus={masterStatus}
        isPlayingMusic={isPlayingMusic}
        currentTime={currentTime}
        duration={duration}
        masterVolume={masterVolume}
        effectiveVolume={effectiveVolume}
        isMuted={isMuted}
        isDucking={isSpeakingTTS}
        duckingPercent={settings.duckingPercent}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        queueCount={queue.length}
        onTogglePlay={handleTogglePlayMusic}
        onStop={handleStopMusic}
        onPrev={handlePrevTrack}
        onNext={handleNextTrack}
        onSeek={handleSeekMusic}
        onVolumeChange={(val) => {
          setMasterVolume(val);
          if (val > 0 && isMuted) setIsMuted(false);
        }}
        onToggleMute={() => setIsMuted((m) => !m)}
        onCycleRepeat={() =>
          setRepeatMode((m) => (m === 'none' ? 'all' : m === 'all' ? 'one' : 'none'))
        }
        onToggleShuffle={() => setIsShuffle((s) => !s)}
        onOpenQueueTab={() => setActiveTab('playlists')}
      />
    </div>
  );
}
