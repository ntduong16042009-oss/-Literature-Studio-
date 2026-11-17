import React, { useRef, useState } from 'react';
import {
  FolderUp,
  Music,
  Play,
  Plus,
  Search,
  Trash2,
  Upload,
  Edit3,
  ListPlus,
  CheckSquare,
  Square,
  Tag,
} from 'lucide-react';
import { Track } from '../types/studio';
import { formatBytes, formatDuration, matchesSearch } from '../utils/studioLogic';
import { COVER_PIANO_IMG } from '../data/seedData';

interface MusicLibraryViewProps {
  tracks: Track[];
  categories: string[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onUploadFiles: (files: FileList, isFolder: boolean) => void;
  onUpdateTrack: (track: Track) => void;
  onDeleteTracks: (ids: string[]) => void;
  onClearLibrary: () => void;
  onAddCategory: (name: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (name: string) => void;
}

export const MusicLibraryView: React.FC<MusicLibraryViewProps> = ({
  tracks,
  categories,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onAddToQueue,
  onUploadFiles,
  onUpdateTrack,
  onDeleteTracks,
  onClearLibrary,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'title' | 'duration' | 'addedAt'>('addedAt');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'single' | 'multi' | 'clear-all';
    ids?: string[];
    title?: string;
  } | null>(null);

  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [renamingCat, setRenamingCat] = useState<{ oldName: string; newName: string } | null>(
    null
  );

  const filteredTracks = tracks
    .filter((t) => {
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
      return matchesSearch(searchQuery, t.title, t.artist, t.category, t.folderName);
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'vi');
      if (sortBy === 'duration') return b.duration - a.duration;
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTracks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTracks.map((t) => t.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Upload Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Quản lý âm thanh · Hỗ trợ MP3, WAV, OGG, M4A, AAC, FLAC
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F5F2EB]">
            Thư Viện Âm Nhạc ({tracks.length} bản nhạc)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUploadFiles(e.target.files, false);
                e.target.value = '';
              }
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-expect-error webkitdirectory is standard in Chromium/modern browsers
            webkitdirectory="true"
            directory="true"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUploadFiles(e.target.files, true);
                e.target.value = '';
              }
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs hover:bg-[#e0bd46] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Tải File Nhạc
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FolderUp className="w-3.5 h-3.5" />
            Tải Thư Mục
          </button>

          <button
            type="button"
            onClick={() => setShowCategoryManager((v) => !v)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            Quản lý danh mục ({categories.length})
          </button>

          {tracks.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmModal({ type: 'clear-all' })}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-500/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa toàn bộ
            </button>
          )}
        </div>
      </div>

      {/* Category Manager Panel */}
      {showCategoryManager && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111726] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-[#F5F2EB]">
                Quản lý danh mục âm nhạc
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thêm mới, đổi tên hoặc xóa danh mục phân loại nhạc nền thuyết trình.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newCategoryName.trim()) {
                  onAddCategory(newCategoryName.trim());
                  setNewCategoryName('');
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Tên danh mục mới..."
                aria-label="Tên danh mục âm nhạc mới"
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm danh mục
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {categories.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 text-xs"
              >
                {renamingCat?.oldName === cat ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      value={renamingCat.newName}
                      onChange={(e) =>
                        setRenamingCat({ oldName: cat, newName: e.target.value })
                      }
                      aria-label={`Đổi tên danh mục ${cat}`}
                      className="flex-1 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (renamingCat.newName.trim()) {
                          onRenameCategory(cat, renamingCat.newName.trim());
                        }
                        setRenamingCat(null);
                      }}
                      className="text-emerald-500 font-semibold px-1.5 cursor-pointer"
                    >
                      Lưu
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {cat}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setRenamingCat({ oldName: cat, newName: cat })}
                        aria-label={`Sửa danh mục ${cat}`}
                        className="p-1 text-slate-400 hover:text-[#D4AF37] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {cat !== 'Nhạc khác' && (
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(cat)}
                          aria-label={`Xóa danh mục ${cat}`}
                          className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search, Filter & Batch Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bài hát, nghệ sĩ, danh mục (hỗ trợ không dấu)..."
            aria-label="Tìm kiếm bài hát trong thư viện"
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Lọc theo danh mục nhạc"
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'title' | 'duration' | 'addedAt')}
            aria-label="Sắp xếp danh sách bài hát"
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-800 dark:text-slate-200"
          >
            <option value="addedAt">Sắp xếp: Mới thêm gần đây</option>
            <option value="title">Sắp xếp: Tên bài hát (A–Z)</option>
            <option value="duration">Sắp xếp: Thời lượng giảm dần</option>
          </select>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmModal({ type: 'multi', ids: selectedIds })}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa {selectedIds.length} bài đã chọn
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-[#D4AF37] text-slate-950 font-semibold'
              : 'bg-slate-200/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          Tất cả ({tracks.length})
        </button>
        {categories.map((cat) => {
          const count = tracks.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#D4AF37] text-slate-950 font-semibold'
                  : 'bg-slate-200/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Tracks Table or Empty State */}
      {filteredTracks.length === 0 ? (
        <div className="p-12 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111726] text-center space-y-3">
          <Music className="w-10 h-10 text-[#D4AF37] mx-auto opacity-80" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F5F2EB]">
            Không tìm thấy bản nhạc nào phù hợp
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Hãy tải lên file âm thanh (MP3, WAV, OGG, M4A, FLAC) hoặc chọn cả thư mục nhạc từ máy tính của bạn.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs cursor-pointer"
            >
              Tải File Nhạc Lên Ngay
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111726] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-900/40">
                  <th className="py-3 px-4 w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      aria-label="Chọn tất cả bài hát"
                      className="text-slate-400 hover:text-[#D4AF37] cursor-pointer"
                    >
                      {selectedIds.length === filteredTracks.length &&
                      filteredTracks.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 font-medium">Bài hát & Nghệ sĩ</th>
                  <th className="py-3 px-3 font-medium hidden md:table-cell">Danh mục</th>
                  <th className="py-3 px-3 font-medium text-right">Thời lượng</th>
                  <th className="py-3 px-3 font-medium text-right hidden sm:table-cell">
                    Dung lượng
                  </th>
                  <th className="py-3 px-3 font-medium text-right hidden lg:table-cell">
                    Ngày thêm
                  </th>
                  <th className="py-3 px-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/60 text-xs">
                {filteredTracks.map((track) => {
                  const active = currentTrackId === track.id;
                  const checked = selectedIds.includes(track.id);
                  return (
                    <tr
                      key={track.id}
                      className={`group transition-colors ${
                        active
                          ? 'bg-[#D4AF37]/10 dark:bg-[#D4AF37]/10'
                          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSelect(track.id)}
                          aria-label={`Chọn bài ${track.title}`}
                          className="text-slate-400 hover:text-[#D4AF37] cursor-pointer"
                        >
                          {checked ? (
                            <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-md overflow-hidden bg-slate-800 shrink-0">
                            <img
                              src={track.coverUrl || COVER_PIANO_IMG}
                              alt={track.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div
                              className={`font-semibold truncate max-w-[240px] sm:max-w-xs ${
                                active
                                  ? 'text-[#D4AF37]'
                                  : 'text-slate-900 dark:text-[#F5F2EB]'
                              }`}
                            >
                              {track.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {track.artist}
                              {track.folderName ? ` · Thư mục: ${track.folderName}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell text-slate-600 dark:text-slate-300">
                        {track.category}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular text-slate-700 dark:text-slate-300">
                        {formatDuration(track.duration)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        {formatBytes(track.size)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                        {new Date(track.addedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onPlayTrack(track)}
                            aria-label={`Phát ngay ${track.title}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#D4AF37] text-slate-950 font-semibold text-[11px] hover:bg-[#e2be46] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            {active && isPlaying ? 'Đang phát' : 'Phát'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onAddToQueue(track)}
                            title="Thêm vào danh sách chờ (Queue)"
                            aria-label={`Thêm ${track.title} vào hàng chờ`}
                            className="p-1.5 rounded-md text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
                          >
                            <ListPlus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTrack({ ...track })}
                            title="Đổi tên & Chỉnh sửa thông tin"
                            aria-label={`Chỉnh sửa thông tin ${track.title}`}
                            className="p-1.5 rounded-md text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({
                                type: 'single',
                                ids: [track.id],
                                title: track.title,
                              })
                            }
                            title="Xóa bài hát"
                            aria-label={`Xóa bài hát ${track.title}`}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Track Modal */}
      {editingTrack && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chỉnh sửa thông tin bài hát"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#111726] p-6 space-y-4 text-[#F5F2EB]">
            <h3 className="text-lg font-bold">Chỉnh sửa thông tin bài hát</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tên bài hát</label>
                <input
                  type="text"
                  value={editingTrack.title}
                  onChange={(e) =>
                    setEditingTrack({ ...editingTrack, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nghệ sĩ / Nguồn</label>
                <input
                  type="text"
                  value={editingTrack.artist}
                  onChange={(e) =>
                    setEditingTrack({ ...editingTrack, artist: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Danh mục</label>
                <select
                  value={editingTrack.category}
                  onChange={(e) =>
                    setEditingTrack({ ...editingTrack, category: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Ảnh bìa (URL tùy chọn)</label>
                <input
                  type="text"
                  value={editingTrack.coverUrl || ''}
                  onChange={(e) =>
                    setEditingTrack({ ...editingTrack, coverUrl: e.target.value })
                  }
                  placeholder="/src/assets/images/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTrack(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingTrack.title.trim()) {
                    onUpdateTrack(editingTrack);
                    setEditingTrack(null);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 text-xs font-semibold cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận xóa dữ liệu âm nhạc"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#111726] p-6 space-y-4 text-[#F5F2EB]">
            <h3 className="text-lg font-bold text-rose-400">Xác nhận xóa dữ liệu</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmModal.type === 'clear-all'
                ? 'Bạn có chắc chắn muốn xóa toàn bộ bài hát trong thư viện âm nhạc? Hành động này không thể hoàn tác.'
                : confirmModal.type === 'multi'
                  ? `Bạn có chắc chắn muốn xóa ${confirmModal.ids?.length} bài hát đã chọn khỏi thư viện?`
                  : `Bạn có chắc chắn muốn xóa bài hát "${confirmModal.title}" khỏi thư viện?`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.type === 'clear-all') {
                    onClearLibrary();
                    setSelectedIds([]);
                  } else if (confirmModal.ids) {
                    onDeleteTracks(confirmModal.ids);
                    setSelectedIds((prev) =>
                      prev.filter((id) => !confirmModal.ids?.includes(id))
                    );
                  }
                  setConfirmModal(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
