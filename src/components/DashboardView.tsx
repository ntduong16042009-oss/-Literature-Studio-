import React, { useState } from 'react';
import {
  BookOpen,
  FileCode,
  Film,
  ListMusic,
  Mic,
  Music,
  Play,
  Presentation,
  Search,
  Share2,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  LiteratureCard,
  Playlist,
  Track,
  VideoItem,
  WorkspaceTab,
} from '../types/studio';
import { HERO_BACKDROP_IMG } from '../data/seedData';
import { formatDuration, matchesSearch } from '../utils/studioLogic';
import { VisualizerCanvas } from './VisualizerCanvas';

interface DashboardViewProps {
  tracks: Track[];
  videos: VideoItem[];
  cards: LiteratureCard[];
  playlists: Playlist[];
  analyser: AnalyserNode | null;
  isPlayingMusic: boolean;
  isSpeakingTTS: boolean;
  onNavigateTab: (tab: WorkspaceTab) => void;
  onPlayTrack: (track: Track) => void;
  onSendCardToTTS: (card: LiteratureCard) => void;
  onSendCardToAI: (card: LiteratureCard) => void;
  onPlayPlaylist: (pl: Playlist) => void;
  onDownloadStandaloneHtml: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tracks,
  videos,
  cards,
  playlists,
  analyser,
  isPlayingMusic,
  isSpeakingTTS,
  onNavigateTab,
  onPlayTrack,
  onSendCardToTTS,
  onSendCardToAI,
  onPlayPlaylist,
  onDownloadStandaloneHtml,
}) => {
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalFilter, setGlobalFilter] = useState<
    'ALL' | 'music' | 'literature' | 'playlist' | 'video'
  >('ALL');

  const hasSearch = globalQuery.trim().length > 0;

  const matchedTracks =
    globalFilter === 'ALL' || globalFilter === 'music'
      ? tracks.filter((t) =>
          matchesSearch(globalQuery, t.title, t.artist, t.category)
        )
      : [];

  const matchedCards =
    globalFilter === 'ALL' || globalFilter === 'literature'
      ? cards.filter((c) =>
          matchesSearch(
            globalQuery,
            c.title,
            c.author,
            c.genre,
            c.period,
            c.summary,
            c.theme,
            c.characters,
            c.artisticImagery,
            c.tags
          )
        )
      : [];

  const matchedPlaylists =
    globalFilter === 'ALL' || globalFilter === 'playlist'
      ? playlists.filter((p) =>
          matchesSearch(globalQuery, p.name, p.description)
        )
      : [];

  const matchedVideos =
    globalFilter === 'ALL' || globalFilter === 'video'
      ? videos.filter((v) => matchesSearch(globalQuery, v.title, v.notes))
      : [];

  return (
    <div className="space-y-6">
      {/* Studio Hero Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#111726] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#D4AF37]">
                Trung Tâm Điều Khiển Âm Thanh & Nội Dung Văn Học Việt Nam
              </div>
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-[#F5F2EB] leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Literature Studio — AI Music &amp; Presentation Assistant
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Phòng điều khiển tích hợp phát nhạc nền không lời, đọc thơ &amp; văn xuôi Tiếng Việt tự động giảm âm lượng nhạc nền (Audio Ducking 20%), kho học liệu Ngữ văn THPT, trợ lý phân tích AI và chế độ trình chiếu trực tuyến qua Google Meet / Zoom.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('presentation')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4AF37] text-slate-950 font-bold text-xs hover:bg-[#e2be46] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Presentation className="w-4 h-4" />
                Mở Chế Độ Thuyết Trình
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('literature')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                Kho Văn Học ({cards.length})
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('ai')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Trợ Lý AI Ngữ Văn
              </button>

              <button
                type="button"
                onClick={onDownloadStandaloneHtml}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-xs hover:bg-[#D4AF37]/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileCode className="w-4 h-4" />
                Tải file index.html (Windows 11)
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[220px] bg-slate-950 flex flex-col justify-end overflow-hidden">
            <img
              src={HERO_BACKDROP_IMG}
              alt="Không gian Literature Studio"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-85"
            />
            <div className="relative z-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-5 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-200">
                <span className="font-semibold whitespace-nowrap">Tần số âm thanh Studio</span>
                <span className="font-mono-tabular text-[11px] text-[#D4AF37] whitespace-nowrap">
                  Web Audio API
                </span>
              </div>
              <VisualizerCanvas
                analyser={analyser}
                isPlayingAudio={isPlayingMusic}
                isReadingTTS={isSpeakingTTS}
                height={48}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('music')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-left hover:border-[#D4AF37]/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Thư viện Âm nhạc</span>
            <Music className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-[#F5F2EB]">
            {tracks.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Bản nhạc không lời &amp; thuyết trình
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('literature')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-left hover:border-[#D4AF37]/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Thẻ Tài liệu Văn học</span>
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-[#F5F2EB]">
            {cards.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Tác phẩm trọng tâm chuẩn SGK
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('playlists')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-left hover:border-[#D4AF37]/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Playlists Chuyên đề</span>
            <ListMusic className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-[#F5F2EB]">
            {playlists.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Danh sách phát theo buổi học
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('meeting')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-left hover:border-[#D4AF37]/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Meeting Audio Share</span>
            <Share2 className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-lg font-bold text-emerald-500">Ready to Share</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Google Meet · Zoom · Discord
          </div>
        </button>
      </div>

      {/* Module 12: Universal Search & Filter System */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#F5F2EB]">
              Tìm Kiếm Tổng Hợp Toàn Hệ Thống (Universal Search)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tra cứu tức thì bài hát, video, tác giả, tác phẩm, nội dung văn học, playlist và tag (hỗ trợ tiếng Việt không dấu).
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg text-xs">
            {(
              [
                { id: 'ALL', label: 'Tất cả' },
                { id: 'literature', label: 'Văn học' },
                { id: 'music', label: 'Âm nhạc' },
                { id: 'playlist', label: 'Playlist' },
                { id: 'video', label: 'Video' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setGlobalFilter(f.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  globalFilter === f.id
                    ? 'bg-[#D4AF37] text-slate-950 font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="Nhập từ khóa bất kỳ: 'tay tien', 'quang dung', 'sao truc', 'vo nhat', 'song huong'..."
            aria-label="Tìm kiếm tổng hợp toàn bộ Studio"
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {hasSearch && (
          <div className="space-y-3 pt-2">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Kết quả tìm kiếm cho "{globalQuery}": {matchedCards.length} tác phẩm văn học ·{' '}
              {matchedTracks.length} bài hát · {matchedPlaylists.length} playlist ·{' '}
              {matchedVideos.length} video
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {matchedCards.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#D4AF37]">
                      Văn học · {c.author} · {c.category}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-[#F5F2EB] truncate">
                      {c.title}
                    </div>
                    <div className="text-slate-500 truncate">{c.summary}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSendCardToTTS(c)}
                      className="px-2.5 py-1.5 rounded bg-[#D4AF37] text-slate-950 font-semibold cursor-pointer"
                    >
                      Đọc TTS
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendCardToAI(c)}
                      className="px-2.5 py-1.5 rounded bg-slate-800 text-slate-200 cursor-pointer"
                    >
                      AI
                    </button>
                  </div>
                </div>
              ))}

              {matchedTracks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] text-indigo-400">
                      Âm nhạc · {t.category} · {formatDuration(t.duration)}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-[#F5F2EB] truncate">
                      {t.title}
                    </div>
                    <div className="text-slate-500 truncate">{t.artist}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPlayTrack(t)}
                    className="px-3 py-1.5 rounded bg-[#D4AF37] text-slate-950 font-semibold shrink-0 cursor-pointer"
                  >
                    Phát
                  </button>
                </div>
              ))}

              {matchedPlaylists.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] text-emerald-400">
                      Playlist · {p.trackIds.length} bài
                    </div>
                    <div className="font-bold text-slate-900 dark:text-[#F5F2EB] truncate">
                      {p.name}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPlayPlaylist(p)}
                    className="px-3 py-1.5 rounded bg-[#D4AF37] text-slate-950 font-semibold shrink-0 cursor-pointer"
                  >
                    Phát Playlist
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Featured Music & Featured Literature Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Featured Sample Instrumental Tracks */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-[#F5F2EB]">
              Nhạc Nền Không Lời Cài Sẵn
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('music')}
              className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
            >
              Xem toàn bộ →
            </button>
          </div>

          <div className="space-y-2.5">
            {tracks.slice(0, 4).map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-[#F5F2EB] truncate">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.category} · {formatDuration(t.duration)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onPlayTrack(t)}
                  aria-label={`Phát nhạc nền ${t.title}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#D4AF37] text-slate-950 font-semibold shrink-0 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Phát
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Pinned Literary Works */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-[#F5F2EB]">
              Tác Phẩm Văn Học Tiêu Biểu
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('literature')}
              className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
            >
              Mở Kho Văn Học ({cards.length}) →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cards.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col justify-between gap-3 text-xs"
              >
                <div>
                  <div className="text-[11px] text-[#D4AF37] font-medium">
                    {c.author} · {c.genre}
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-[#F5F2EB] mt-0.5">
                    {c.title}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                    {c.summary}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSendCardToTTS(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#D4AF37] text-slate-950 font-semibold text-[11px] cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    Đọc TTS
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendCardToAI(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-[11px] cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    Phân tích AI
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
