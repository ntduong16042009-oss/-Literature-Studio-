import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ActionHistoryItem,
  LiteratureCard,
  MasterStatus,
  QueueItem,
  RepeatMode,
  Track,
} from '../types/studio';
import { formatDuration } from '../utils/studioLogic';
import { COVER_PIANO_IMG } from '../data/seedData';
import { VisualizerCanvas } from './VisualizerCanvas';

interface RightInspectorPanelProps {
  queue: QueueItem[];
  currentTrack: Track | null;
  cards: LiteratureCard[];
  history: ActionHistoryItem[];
  analyser: AnalyserNode | null;
  isPlayingMusic: boolean;
  isSpeakingTTS: boolean;
  onPlayQueueItem: (idx: number) => void;
  onRemoveQueueItem: (id: string) => void;
  onSendCardToTTS: (card: LiteratureCard) => void;
}

export const RightInspectorPanel: React.FC<RightInspectorPanelProps> = ({
  queue,
  currentTrack,
  cards,
  history,
  analyser,
  isPlayingMusic,
  isSpeakingTTS,
  onPlayQueueItem,
  onRemoveQueueItem,
  onSendCardToTTS,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'cards' | 'history'>('queue');

  return (
    <aside
      aria-label="Bảng thông tin phụ và danh sách chờ"
      className="w-72 xl:w-80 shrink-0 border-l border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1320] flex flex-col h-full overflow-hidden"
    >
      {/* Current Media & Visualizer Box */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          Thông tin nội dung hiện tại
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
            <img
              src={currentTrack?.coverUrl || COVER_PIANO_IMG}
              alt={currentTrack?.title || 'Literature Studio'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 dark:text-[#F5F2EB] truncate">
              {currentTrack ? currentTrack.title : 'Chưa chọn bài nhạc'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {currentTrack ? `${currentTrack.artist} · ${currentTrack.category}` : 'Sẵn sàng phát'}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <VisualizerCanvas
            analyser={analyser}
            isPlayingAudio={isPlayingMusic}
            isReadingTTS={isSpeakingTTS}
            height={40}
          />
        </div>
      </div>

      {/* Right Panel Sub-navigation */}
      <div className="grid grid-cols-3 gap-1 p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[11px]">
        <button
          type="button"
          onClick={() => setActiveSubTab('queue')}
          className={`py-1.5 px-2 rounded font-medium transition-colors cursor-pointer ${
            activeSubTab === 'queue'
              ? 'bg-[#D4AF37] text-slate-950 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Chờ phát ({queue.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('cards')}
          className={`py-1.5 px-2 rounded font-medium transition-colors cursor-pointer ${
            activeSubTab === 'cards'
              ? 'bg-[#D4AF37] text-slate-950 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Thẻ văn học
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`py-1.5 px-2 rounded font-medium transition-colors cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-[#D4AF37] text-slate-950 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Lịch sử ({history.length})
        </button>
      </div>

      {/* Sub-tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
        {activeSubTab === 'queue' && (
          <>
            {queue.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-1">
                <ListMusic className="w-6 h-6 mx-auto opacity-50" />
                <p>Danh sách chờ phát trống.</p>
              </div>
            ) : (
              queue.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131A2B] flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => onPlayQueueItem(idx)}
                    className="text-left min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="font-semibold text-slate-900 dark:text-[#F5F2EB] truncate">
                      {idx + 1}. {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.subtitle} · {formatDuration(item.duration)}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveQueueItem(item.id)}
                    aria-label={`Xóa ${item.title} khỏi hàng chờ`}
                    className="p-1 text-slate-400 hover:text-rose-400 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </>
        )}

        {activeSubTab === 'cards' && (
          <>
            {cards.slice(0, 6).map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131A2B] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-[#F5F2EB]">
                    {c.title}
                  </span>
                  <span className="text-[10px] text-[#D4AF37]">{c.author}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {c.summary}
                </p>
                <button
                  type="button"
                  onClick={() => onSendCardToTTS(c)}
                  className="text-[11px] text-[#D4AF37] font-semibold hover:underline cursor-pointer"
                >
                  Đọc nhanh bằng TTS →
                </button>
              </div>
            ))}
          </>
        )}

        {activeSubTab === 'history' && (
          <>
            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-6 h-6 mx-auto opacity-50 mb-1" />
                <p>Chưa có lịch sử thao tác.</p>
              </div>
            ) : (
              history.map((h) => (
                <div
                  key={h.id}
                  className="p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800/80 bg-slate-50 dark:bg-[#131A2B]"
                >
                  <div className="text-slate-800 dark:text-slate-200 font-medium">
                    {h.action}
                  </div>
                  <div className="text-[10px] font-mono-tabular text-slate-400 mt-0.5">
                    {new Date(h.timestamp).toLocaleTimeString('vi-VN')}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </aside>
  );
};

interface BottomMasterPlayerProps {
  currentTrack: Track | null;
  masterStatus: MasterStatus;
  isPlayingMusic: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  effectiveVolume: number;
  isMuted: boolean;
  isDucking: boolean;
  duckingPercent: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queueCount: number;
  onTogglePlay: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
  onCycleRepeat: () => void;
  onToggleShuffle: () => void;
  onOpenQueueTab: () => void;
}

export const BottomMasterPlayer: React.FC<BottomMasterPlayerProps> = ({
  currentTrack,
  masterStatus,
  isPlayingMusic,
  currentTime,
  duration,
  masterVolume,
  effectiveVolume,
  isMuted,
  isDucking,
  duckingPercent,
  repeatMode,
  isShuffle,
  queueCount,
  onTogglePlay,
  onStop,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onCycleRepeat,
  onToggleShuffle,
  onOpenQueueTab,
}) => {
  return (
    <footer
      aria-label="Thanh điều khiển âm thanh trung tâm Master Player"
      className="h-20 shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090D15]/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-4 z-30"
    >
      {/* Zone 1: Now Playing Info & Status */}
      <div className="flex items-center gap-3 min-w-0 w-1/4">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700 hidden sm:block">
          <img
            src={currentTrack?.coverUrl || COVER_PIANO_IMG}
            alt={currentTrack?.title || 'Master Player'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F5F2EB] truncate">
            {currentTrack ? currentTrack.title : 'Literature Studio Master'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
            <span className="font-semibold text-[#D4AF37]">{masterStatus}</span>
            <span aria-hidden="true">·</span>
            <span>{currentTrack ? currentTrack.category : 'Audio Engine Ready'}</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Transport Controls & Seek Bar */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-xl space-y-1.5">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleShuffle}
            title="Phát ngẫu nhiên (Shuffle)"
            aria-label="Phát ngẫu nhiên Shuffle"
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isShuffle
                ? 'text-[#D4AF37] bg-[#D4AF37]/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onPrev}
            title="Bài trước (Previous)"
            aria-label="Bài trước Previous"
            className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-[#D4AF37] cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlayingMusic ? 'Tạm dừng nhạc' : 'Phát nhạc'}
            className="w-9 h-9 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center hover:bg-[#e2be46] transition-transform active:scale-95 cursor-pointer"
          >
            {isPlayingMusic ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onStop}
            title="Dừng hẳn (Stop)"
            aria-label="Dừng phát nhạc Stop"
            className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-rose-400 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>

          <button
            type="button"
            onClick={onNext}
            title="Bài tiếp theo (Next)"
            aria-label="Bài tiếp theo Next"
            className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-[#D4AF37] cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onCycleRepeat}
            title={`Chế độ lặp: ${repeatMode}`}
            aria-label="Chuyển đổi chế độ lặp Repeat"
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              repeatMode !== 'none'
                ? 'text-[#D4AF37] bg-[#D4AF37]/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-3.5 h-3.5" />
            ) : (
              <Repeat className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Draggable Seek Bar */}
        <div className="w-full flex items-center gap-2.5 text-[11px] font-mono-tabular text-slate-400">
          <span className="w-10 text-right">{formatDuration(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || currentTrack?.duration || 20}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            aria-label="Thanh tua thời gian bài nhạc"
            className="flex-1 h-1.5 accent-[#D4AF37] cursor-pointer"
          />
          <span className="w-10">
            {formatDuration(duration || currentTrack?.duration || 0)}
          </span>
        </div>
      </div>

      {/* Zone 3: Volume, Audio Ducking Telemetry & Queue Button */}
      <div className="flex items-center justify-end gap-3 w-1/4">
        {isDucking && (
          <span className="hidden xl:inline-block text-[11px] font-semibold text-[#D4AF37] whitespace-nowrap">
            Ducking {duckingPercent}% ({Math.round(effectiveVolume * 100)}%)
          </span>
        )}

        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt tiếng Mute'}
            className="p-1.5 text-slate-500 dark:text-slate-300 hover:text-[#D4AF37] cursor-pointer"
          >
            {isMuted || masterVolume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : masterVolume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            aria-label="Âm lượng tổng Master Volume"
            className="w-20 lg:w-24 accent-[#D4AF37] cursor-pointer"
          />
          <span className="text-[11px] font-mono-tabular text-slate-400 w-8 text-right">
            {isMuted ? '0%' : `${masterVolume}%`}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenQueueTab}
          aria-label="Mở quản lý danh sách chờ Queue"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ListMusic className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="hidden sm:inline">Queue</span>
          <span className="font-mono-tabular">({queueCount})</span>
        </button>
      </div>
    </footer>
  );
};
