import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  ListMusic,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  Square,
} from 'lucide-react';
import {
  Playlist,
  PresentationScript,
  PresentationStep,
  QueueItem,
  RepeatMode,
  TTSMode,
  Track,
} from '../types/studio';
import { formatDuration } from '../utils/studioLogic';
import { VisualizerCanvas } from './VisualizerCanvas';
import { HERO_BACKDROP_IMG } from '../data/seedData';

interface PlaylistsViewProps {
  playlists: Playlist[];
  tracks: Track[];
  queue: QueueItem[];
  repeatMode: RepeatMode;
  isShuffle: boolean;
  onCreatePlaylist: (name: string, description: string, trackIds: string[]) => void;
  onRenamePlaylist: (id: string, name: string, description: string) => void;
  onDeletePlaylist: (id: string) => void;
  onUpdatePlaylistTracks: (playlistId: string, trackIds: string[]) => void;
  onPlayPlaylist: (playlist: Playlist, shuffle?: boolean) => void;
  onPlayQueueItem: (index: number) => void;
  onRemoveQueueItem: (id: string) => void;
  onMoveQueueItem: (index: number, direction: 'up' | 'down') => void;
  onClearQueue: () => void;
  onToggleShuffle: () => void;
  onCycleRepeatMode: () => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  tracks,
  queue,
  repeatMode,
  isShuffle,
  onCreatePlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  onUpdatePlaylistTracks,
  onPlayPlaylist,
  onPlayQueueItem,
  onRemoveQueueItem,
  onMoveQueueItem,
  onClearQueue,
  onToggleShuffle,
  onCycleRepeatMode,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(
    playlists[0]?.id || ''
  );
  const [newPlName, setNewPlName] = useState('');
  const [newPlDesc, setNewPlDesc] = useState('');
  const [editingPl, setEditingPl] = useState<Playlist | null>(null);
  const [selectedAddTrackIds, setSelectedAddTrackIds] = useState<string[]>([]);

  const activePlaylist =
    playlists.find((p) => p.id === selectedPlaylistId) || playlists[0] || null;

  const handleMoveTrackInPlaylist = (idx: number, dir: 'up' | 'down') => {
    if (!activePlaylist) return;
    const arr = [...activePlaylist.trackIds];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= arr.length) return;
    const temp = arr[idx];
    arr[idx] = arr[target];
    arr[target] = temp;
    onUpdatePlaylistTracks(activePlaylist.id, arr);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Quản lý Danh sách phát theo chuyên đề văn học & Hàng chờ phát (Queue)
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F5F2EB]">
            Playlists & Queue Manager ({playlists.length} Playlists)
          </h1>
        </div>

        {/* Create new playlist inline form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newPlName.trim()) return;
            onCreatePlaylist(
              newPlName.trim(),
              newPlDesc.trim() || 'Danh sách phát phục vụ thuyết trình văn học.',
              tracks.slice(0, 2).map((t) => t.id)
            );
            setNewPlName('');
            setNewPlDesc('');
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="text"
            value={newPlName}
            onChange={(e) => setNewPlName(e.target.value)}
            placeholder="Tên Playlist mới (VD: Chuyên đề Sóng)..."
            aria-label="Tên Playlist mới"
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo Playlist
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Playlists List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F5F2EB]">
            Danh sách Playlist theo buổi học
          </h2>
          {playlists.map((pl) => {
            const isSelected = activePlaylist?.id === pl.id;
            return (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylistId(pl.id)}
                className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-[#F5F2EB]">
                      {pl.name}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {pl.description}
                    </p>
                    <div className="text-[11px] text-[#D4AF37] mt-2 font-mono-tabular">
                      {pl.trackIds.length} bài hát
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onPlayPlaylist(pl, false)}
                      title="Phát Playlist này"
                      aria-label={`Phát ${pl.name}`}
                      className="p-1.5 rounded bg-[#D4AF37] text-slate-950 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPl({ ...pl })}
                      aria-label={`Đổi tên ${pl.name}`}
                      className="p-1.5 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePlaylist(pl.id)}
                      aria-label={`Xóa ${pl.name}`}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center: Active Playlist Tracks & Multi-Add */}
        <div className="lg:col-span-5 space-y-4">
          {activePlaylist ? (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F2EB]">
                    {activePlaylist.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sắp xếp thứ tự hoặc thêm nhiều bài hát vào Playlist
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPlayPlaylist(activePlaylist, false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Phát tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => onPlayPlaylist(activePlaylist, true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    Phát ngẫu nhiên
                  </button>
                </div>
              </div>

              {/* Tracks inside Playlist */}
              <div className="space-y-2">
                {activePlaylist.trackIds.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Playlist trống. Hãy chọn bài hát bên dưới để thêm vào.
                  </p>
                ) : (
                  activePlaylist.trackIds.map((tid, idx) => {
                    const tr = tracks.find((t) => t.id === tid);
                    if (!tr) return null;
                    return (
                      <div
                        key={`${tid}-${idx}`}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {idx + 1}. {tr.title}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {tr.category} · {formatDuration(tr.duration)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveTrackInPlaylist(idx, 'up')}
                            aria-label="Chuyển lên"
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTrackInPlaylist(idx, 'down')}
                            aria-label="Chuyển xuống"
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextIds = activePlaylist.trackIds.filter(
                                (_, i) => i !== idx
                              );
                              onUpdatePlaylistTracks(activePlaylist.id, nextIds);
                            }}
                            aria-label={`Xóa ${tr.title} khỏi playlist`}
                            className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Multi-select Add Tracks to Playlist */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Chọn bài hát từ thư viện để thêm vào Playlist
                  </span>
                  {selectedAddTrackIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const merged = Array.from(
                          new Set([...activePlaylist.trackIds, ...selectedAddTrackIds])
                        );
                        onUpdatePlaylistTracks(activePlaylist.id, merged);
                        setSelectedAddTrackIds([]);
                      }}
                      className="px-2.5 py-1 rounded bg-[#D4AF37] text-slate-950 font-semibold text-[11px] cursor-pointer"
                    >
                      + Thêm {selectedAddTrackIds.length} bài đã chọn
                    </button>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {tracks.map((t) => {
                    const checked = selectedAddTrackIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedAddTrackIds((prev) =>
                                prev.includes(t.id)
                                  ? prev.filter((id) => id !== t.id)
                                  : [...prev, t.id]
                              )
                            }
                            className="accent-[#D4AF37]"
                          />
                          <span className="truncate text-slate-800 dark:text-slate-200">
                            {t.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono-tabular">
                          {formatDuration(t.duration)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: Active Playback Queue */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F2EB] flex items-center gap-1.5">
                <ListMusic className="w-4 h-4 text-[#D4AF37]" />
                Hàng Chờ (Queue: {queue.length})
              </h3>
              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={onClearQueue}
                  className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                >
                  Xóa hết
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleShuffle}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 cursor-pointer ${
                  isShuffle
                    ? 'bg-[#D4AF37] text-slate-950 font-semibold'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                Shuffle
              </button>
              <button
                type="button"
                onClick={onCycleRepeatMode}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 cursor-pointer ${
                  repeatMode !== 'none'
                    ? 'bg-[#D4AF37] text-slate-950 font-semibold'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                {repeatMode === 'none'
                  ? 'Repeat Off'
                  : repeatMode === 'one'
                    ? 'Repeat 1'
                    : 'Repeat All'}
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {queue.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Hàng chờ đang trống.
                </p>
              ) : (
                queue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => onPlayQueueItem(idx)}
                      className="text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.subtitle}
                      </div>
                    </button>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onMoveQueueItem(idx, 'up')}
                        aria-label="Lên"
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveQueueItem(idx, 'down')}
                        aria-label="Xuống"
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveQueueItem(item.id)}
                        aria-label={`Xóa ${item.title} khỏi hàng chờ`}
                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rename Playlist Modal */}
      {editingPl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Đổi tên Playlist"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#111726] p-6 space-y-4 text-[#F5F2EB]">
            <h3 className="text-lg font-bold">Đổi tên & mô tả Playlist</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tên Playlist</label>
                <input
                  type="text"
                  value={editingPl.name}
                  onChange={(e) => setEditingPl({ ...editingPl, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Mô tả</label>
                <input
                  type="text"
                  value={editingPl.description}
                  onChange={(e) =>
                    setEditingPl({ ...editingPl, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPl(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingPl.name.trim()) {
                    onRenamePlaylist(
                      editingPl.id,
                      editingPl.name.trim(),
                      editingPl.description.trim()
                    );
                    setEditingPl(null);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs cursor-pointer"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface PresentationModeViewProps {
  scripts: PresentationScript[];
  tracks: Track[];
  analyser: AnalyserNode | null;
  isPlayingMusic: boolean;
  isSpeakingTTS: boolean;
  isStageFullscreen: boolean;
  onToggleStageFullscreen: () => void;
  onPlayTrackById: (trackId: string) => void;
  onToggleMusicPlay: () => void;
  onSpeakStepText: (text: string, mode: TTSMode) => void;
  onStopAllPresentationMedia: () => void;
  onSaveScript: (script: PresentationScript) => void;
}

export const PresentationModeView: React.FC<PresentationModeViewProps> = ({
  scripts,
  tracks,
  analyser,
  isPlayingMusic,
  isSpeakingTTS,
  isStageFullscreen,
  onToggleStageFullscreen,
  onPlayTrackById,
  onToggleMusicPlay,
  onSpeakStepText,
  onStopAllPresentationMedia,
  onSaveScript,
}) => {
  const activeScript = scripts[0];
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [showStepEditor, setShowStepEditor] = useState(false);

  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepContent, setNewStepContent] = useState('');
  const [newStepTrackId, setNewStepTrackId] = useState(tracks[0]?.id || '');

  const steps = activeScript?.steps || [];
  const currentStep: PresentationStep | undefined =
    steps[currentStepIdx] || steps[0];

  const goToStep = (idx: number) => {
    if (idx < 0 || idx >= steps.length) return;
    setCurrentStepIdx(idx);
    const target = steps[idx];
    if (target.backgroundTrackId && autoAdvance) {
      onPlayTrackById(target.backgroundTrackId);
    }
    if (target.autoReadTTS || autoAdvance) {
      onSpeakStepText(target.ttsText || target.content, target.ttsMode || 'presentation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stage Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs text-[#D4AF37] font-semibold">
            Chế Độ Trình Chiếu Chuyên Nghiệp (Presentation Stage)
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F5F2EB]">
            {activeScript?.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="accent-[#D4AF37]"
            />
            Tự động phát nhạc & đọc TTS khi chuyển bước
          </label>

          <button
            type="button"
            onClick={() => setShowStepEditor((v) => !v)}
            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium cursor-pointer"
          >
            {showStepEditor ? 'Ẩn Soạn Kịch Bản' : '+ Thêm Bước Kịch Bản'}
          </button>

          <button
            type="button"
            onClick={onToggleStageFullscreen}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs cursor-pointer"
          >
            {isStageFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                Hiện Sidebar & Bảng phụ
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                Tối Giản Toàn Màn Hình
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step Indicator Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {steps.map((st, idx) => (
          <button
            key={st.id}
            type="button"
            onClick={() => goToStep(idx)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              idx === currentStepIdx
                ? 'bg-[#D4AF37] text-slate-950 font-bold'
                : 'bg-slate-200/70 dark:bg-[#111726] border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Bước {idx + 1}: {st.stageTitle}
          </button>
        ))}
      </div>

      {/* Add Step Editor Drawer */}
      {showStepEditor && activeScript && (
        <div className="p-5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111726] space-y-3 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-[#F5F2EB]">
            Thêm bước mới vào kịch bản thuyết trình
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Tiêu đề bước (VD: Liên hệ thực tiễn)</label>
              <input
                type="text"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Nhạc nền đi kèm</label>
              <select
                value={newStepTrackId}
                onChange={(e) => setNewStepTrackId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Nội dung trình chiếu & đọc TTS</label>
              <textarea
                rows={3}
                value={newStepContent}
                onChange={(e) => setNewStepContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!newStepTitle.trim() || !newStepContent.trim()) return;
                const nextStep: PresentationStep = {
                  id: `step-${Date.now()}`,
                  stepNumber: steps.length + 1,
                  stageTitle: newStepTitle.trim(),
                  workTitle: currentStep?.workTitle || 'Tây Tiến',
                  author: currentStep?.author || 'Quang Dũng',
                  content: newStepContent.trim(),
                  ttsText: newStepContent.trim(),
                  ttsMode: 'presentation',
                  autoReadTTS: false,
                  backgroundTrackId: newStepTrackId,
                  imageUrl: HERO_BACKDROP_IMG,
                };
                onSaveScript({
                  ...activeScript,
                  steps: [...activeScript.steps, nextStep],
                  updatedAt: new Date().toISOString(),
                });
                setNewStepTitle('');
                setNewStepContent('');
                setShowStepEditor(false);
              }}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs cursor-pointer"
            >
              Lưu Bước Kịch Bản
            </button>
          </div>
        </div>
      )}

      {/* Main Presentation Stage */}
      {currentStep && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1320] overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Left Stage Content */}
            <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-xs font-mono-tabular text-[#D4AF37] tracking-wide">
                  BƯỚC {currentStepIdx + 1} / {steps.length} · {currentStep.stageTitle.toUpperCase()}
                </div>

                <h2
                  className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-[#F5F2EB] leading-tight"
                  style={{ textWrap: 'balance' }}
                >
                  {currentStep.workTitle}
                </h2>

                <div className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
                  Tác giả: <span className="text-slate-800 dark:text-slate-200">{currentStep.author}</span>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
                  <p className="text-base sm:text-lg leading-relaxed text-slate-800 dark:text-[#F5F2EB]/95">
                    {currentStep.content}
                  </p>
                </div>
              </div>

              {/* Stage Quick Controls: TTS, Background Music, Pause All, Prev/Next */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      onSpeakStepText(
                        currentStep.ttsText || currentStep.content,
                        currentStep.ttsMode
                      )
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4AF37] text-slate-950 font-bold text-xs hover:bg-[#e2be46] transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    {isSpeakingTTS ? 'Đang Đọc Thuyết Trình...' : 'Đọc Nội Dung Bước Này (TTS)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep.backgroundTrackId && !isPlayingMusic) {
                        onPlayTrackById(currentStep.backgroundTrackId);
                      } else {
                        onToggleMusicPlay();
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {isPlayingMusic ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        Tạm dừng nhạc nền
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Phát nhạc nền bước này
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onStopAllPresentationMedia}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-rose-500/30 text-rose-400 font-semibold text-xs hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Tạm dừng toàn bộ
                  </button>
                </div>

                {/* Step Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => goToStep(currentStepIdx - 1)}
                    disabled={currentStepIdx === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium disabled:opacity-40 cursor-pointer"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                    Bước trước
                  </button>

                  <span className="text-xs font-mono-tabular text-slate-400">
                    Bước {currentStepIdx + 1} / {steps.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => goToStep(currentStepIdx + 1)}
                    disabled={currentStepIdx >= steps.length - 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Bước tiếp theo
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Stage Visual & Live Audio Visualizer */}
            <div className="lg:col-span-5 bg-slate-950 flex flex-col justify-between p-6 border-t lg:border-t-0 lg:border-l border-slate-800">
              <div className="rounded-xl overflow-hidden border border-slate-800 relative aspect-video lg:aspect-auto lg:h-64 bg-slate-900">
                <img
                  src={currentStep.imageUrl || HERO_BACKDROP_IMG}
                  alt={currentStep.workTitle}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex items-end p-4">
                  <div>
                    <div className="text-[11px] text-[#D4AF37] font-medium">
                      Minh họa trình chiếu
                    </div>
                    <div className="text-sm font-bold text-white">
                      {currentStep.stageTitle} — {currentStep.workTitle}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    Audio Visualizer (Tần số âm thanh thực tế)
                  </span>
                  <span className="text-[11px] font-mono-tabular text-[#D4AF37]">
                    {isSpeakingTTS
                      ? 'TTS Active · Ducking 20%'
                      : isPlayingMusic
                        ? 'Music Active'
                        : 'Standby'}
                  </span>
                </div>
                <VisualizerCanvas
                  analyser={analyser}
                  isPlayingAudio={isPlayingMusic}
                  isReadingTTS={isSpeakingTTS}
                  height={64}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
