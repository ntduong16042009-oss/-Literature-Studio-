import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Copy,
  Download,
  Edit3,
  Pin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import { LiteratureCard, LiteratureCategory } from '../types/studio';
import { LITERATURE_CATEGORIES } from '../data/seedData';
import { matchesSearch } from '../utils/studioLogic';

interface LiteratureLibraryViewProps {
  cards: LiteratureCard[];
  onSaveCard: (card: LiteratureCard, isNew: boolean) => void;
  onDeleteCard: (id: string) => void;
  onDuplicateCard: (card: LiteratureCard) => void;
  onTogglePin: (id: string) => void;
  onSendToTTS: (card: LiteratureCard) => void;
  onSendToAI: (card: LiteratureCard) => void;
  onImportCardsJson: (cards: LiteratureCard[]) => void;
  onExportCardsJson: () => void;
}

const EMPTY_CARD: Omit<LiteratureCard, 'id' | 'updatedAt'> = {
  title: '',
  author: '',
  genre: 'Thơ hiện đại',
  period: 'Văn học Việt Nam hiện đại (1945–1975)',
  creationContext: '',
  summary: '',
  theme: '',
  contentValue: '',
  artisticValue: '',
  characters: '',
  artisticImagery: '',
  excerpt: '',
  commentary: '',
  category: 'Tóm tắt tác phẩm',
  tags: [],
  pinned: false,
};

export const LiteratureLibraryView: React.FC<LiteratureLibraryViewProps> = ({
  cards,
  onSaveCard,
  onDeleteCard,
  onDuplicateCard,
  onTogglePin,
  onSendToTTS,
  onSendToAI,
  onImportCardsJson,
  onExportCardsJson,
}) => {
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'pinned'>('pinned');

  const [viewingCard, setViewingCard] = useState<LiteratureCard | null>(null);
  const [editingCard, setEditingCard] = useState<{
    card: LiteratureCard;
    isNew: boolean;
    tagsInput: string;
  } | null>(null);
  const [deletingCard, setDeletingCard] = useState<LiteratureCard | null>(null);

  // Collect all unique tags
  const allTags = Array.from(
    new Set(cards.flatMap((c) => c.tags))
  ).sort((a, b) => a.localeCompare(b, 'vi'));

  const filteredCards = cards
    .filter((c) => {
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
      if (selectedTag !== 'ALL' && !c.tags.includes(selectedTag)) return false;
      return matchesSearch(
        searchQuery,
        c.title,
        c.author,
        c.genre,
        c.period,
        c.summary,
        c.theme,
        c.characters,
        c.artisticImagery,
        c.tags
      );
    })
    .sort((a, b) => {
      if (sortBy === 'pinned') {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return a.title.localeCompare(b.title, 'vi');
      }
      if (sortBy === 'author') return a.author.localeCompare(b.author, 'vi');
      return a.title.localeCompare(b.title, 'vi');
    });

  const handleOpenNewModal = () => {
    setEditingCard({
      isNew: true,
      tagsInput: 'Văn học THPT, Thuyết trình',
      card: {
        ...EMPTY_CARD,
        id: `lit-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Kho Học Liệu Ngữ Văn · 9 Danh Mục Chuẩn · Xuất / Nhập JSON
          </p>
          <h1
            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F5F2EB]"
            style={{ textWrap: 'balance' }}
          >
            Thư Viện Văn Học ({cards.length} tác phẩm)
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenNewModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs hover:bg-[#e2be46] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm Thẻ Mới
          </button>

          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const parsed = JSON.parse(String(reader.result));
                  const arr = Array.isArray(parsed) ? parsed : parsed.cards;
                  if (Array.isArray(arr)) {
                    onImportCardsJson(arr);
                  }
                } catch {
                  // handled by parent toast if needed
                }
              };
              reader.readAsText(file);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Nhập JSON
          </button>

          <button
            type="button"
            onClick={onExportCardsJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất JSON
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tác phẩm, tác giả, nhân vật, hình tượng (hỗ trợ không dấu)..."
            aria-label="Tìm kiếm tác phẩm văn học"
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Lọc theo danh mục văn học"
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Tất cả 9 danh mục</option>
            {LITERATURE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            aria-label="Lọc theo nhãn Tag"
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Tất cả Tag</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'title' | 'author' | 'pinned')}
            aria-label="Sắp xếp thẻ văn học"
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-800 dark:text-slate-200"
          >
            <option value="pinned">Sắp xếp: Ghim yêu thích & Tên</option>
            <option value="title">Sắp xếp: Tên tác phẩm (A–Z)</option>
            <option value="author">Sắp xếp: Tên tác giả (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-[#D4AF37] text-slate-950 font-semibold'
              : 'bg-slate-200/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
          }`}
        >
          Tất cả ({cards.length})
        </button>
        {LITERATURE_CATEGORIES.map((cat) => {
          const count = cards.filter((c) => c.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#D4AF37] text-slate-950 font-semibold'
                  : 'bg-slate-200/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Literature Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCards.map((card) => (
          <article
            key={card.id}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#111726] flex flex-col justify-between gap-4 hover:border-[#D4AF37]/50 transition-colors"
          >
            <div className="space-y-3">
              {/* Clean unboxed metadata row */}
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-[#D4AF37]">{card.author}</span>
                  <span aria-hidden="true">·</span>
                  <span>{card.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>{card.category}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onTogglePin(card.id)}
                  aria-label={`Ghim yêu thích ${card.title}`}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    card.pinned
                      ? 'text-[#D4AF37]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Pin className="w-4 h-4 fill-current" />
                </button>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-[#F5F2EB]">
                {card.title}
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                {card.summary}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                <div className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Chủ đề:{' '}
                  </span>
                  {card.theme}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Hình tượng nghệ thuật:{' '}
                  </span>
                  {card.artisticImagery}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  Từ khóa: {card.tags.join(' · ')}
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewingCard(card)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Chi tiết (13 mục)
                </button>
                <button
                  type="button"
                  onClick={() => onSendToTTS(card)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#D4AF37] text-slate-950 text-xs font-semibold hover:bg-[#e2be46] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Đọc TTS
                </button>
                <button
                  type="button"
                  onClick={() => onSendToAI(card)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium hover:bg-indigo-500/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Phân tích AI
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setEditingCard({
                      card: { ...card },
                      isNew: false,
                      tagsInput: card.tags.join(', '),
                    })
                  }
                  title="Chỉnh sửa thẻ"
                  aria-label={`Chỉnh sửa tác phẩm ${card.title}`}
                  className="p-1.5 rounded text-slate-400 hover:text-[#D4AF37] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicateCard(card)}
                  title="Nhân bản thẻ"
                  aria-label={`Nhân bản tác phẩm ${card.title}`}
                  className="p-1.5 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingCard(card)}
                  title="Xóa thẻ"
                  aria-label={`Xóa tác phẩm ${card.title}`}
                  className="p-1.5 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Full 13-Field Detail Modal */}
      {viewingCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Hồ sơ văn học ${viewingCard.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-xl border border-slate-700 bg-[#0F1523] p-6 space-y-4 text-[#F5F2EB]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs text-[#D4AF37] mb-1">
                  {viewingCard.author} · {viewingCard.genre} · {viewingCard.period}
                </div>
                <h2 className="text-2xl font-bold">{viewingCard.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingCard(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="font-semibold text-[#D4AF37] mb-1">1. Hoàn cảnh sáng tác</div>
                <p className="text-slate-300">{viewingCard.creationContext}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="font-semibold text-[#D4AF37] mb-1">2. Nội dung chính</div>
                <p className="text-slate-300">{viewingCard.summary}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="font-semibold text-[#D4AF37] mb-1">3. Chủ đề tư tưởng</div>
                <p className="text-slate-300">{viewingCard.theme}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="font-semibold text-[#D4AF37] mb-1">4. Giá trị nội dung</div>
                <p className="text-slate-300">{viewingCard.contentValue}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="font-semibold text-[#D4AF37] mb-1">5. Giá trị nghệ thuật</div>
                <p className="text-slate-300">{viewingCard.artisticValue}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="font-semibold text-[#D4AF37] mb-1">6. Nhân vật / Chủ thể trữ tình</div>
                <p className="text-slate-300">{viewingCard.characters}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 md:col-span-2">
                <div className="font-semibold text-[#D4AF37] mb-1">7. Hình tượng nghệ thuật</div>
                <p className="text-slate-300">{viewingCard.artisticImagery}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 md:col-span-2">
                <div className="font-semibold text-[#D4AF37] mb-1">
                  8. Văn bản / Trích đoạn & Ghi chú học liệu
                </div>
                <p className="text-slate-300 whitespace-pre-line">{viewingCard.excerpt}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 md:col-span-2">
                <div className="font-semibold text-[#D4AF37] mb-1">9. Nhận xét và đánh giá</div>
                <p className="text-slate-300">{viewingCard.commentary}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const c = viewingCard;
                  setViewingCard(null);
                  onSendToTTS(c);
                }}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs cursor-pointer"
              >
                Đọc tác phẩm này bằng TTS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Literature Card Modal */}
      {editingCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingCard.isNew ? 'Thêm thẻ văn học mới' : 'Chỉnh sửa thẻ văn học'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-[#0F1523] p-6 space-y-4 text-[#F5F2EB]">
            <h3 className="text-xl font-bold">
              {editingCard.isNew ? 'Thêm Thẻ Tài Liệu Văn Học Mới' : `Chỉnh sửa: ${editingCard.card.title}`}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tên tác phẩm *</label>
                <input
                  type="text"
                  value={editingCard.card.title}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, title: e.target.value },
                    })
                  }
                  placeholder="VD: Đàn ghi ta của Lor-ca"
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tác giả *</label>
                <input
                  type="text"
                  value={editingCard.card.author}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, author: e.target.value },
                    })
                  }
                  placeholder="VD: Thanh Thảo"
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Thể loại</label>
                <input
                  type="text"
                  value={editingCard.card.genre}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, genre: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Danh mục</label>
                <select
                  value={editingCard.card.category}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: {
                        ...editingCard.card,
                        category: e.target.value as LiteratureCategory,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                >
                  {LITERATURE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Giai đoạn văn học & Hoàn cảnh sáng tác</label>
                <textarea
                  rows={2}
                  value={editingCard.card.creationContext}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, creationContext: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Nội dung chính / Tóm tắt</label>
                <textarea
                  rows={2}
                  value={editingCard.card.summary}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, summary: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Chủ đề</label>
                <input
                  type="text"
                  value={editingCard.card.theme}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, theme: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nhân vật / Hình tượng trung tâm</label>
                <input
                  type="text"
                  value={editingCard.card.artisticImagery}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, artisticImagery: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Giá trị nội dung</label>
                <textarea
                  rows={2}
                  value={editingCard.card.contentValue}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, contentValue: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Giá trị nghệ thuật</label>
                <textarea
                  rows={2}
                  value={editingCard.card.artisticValue}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, artisticValue: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">
                  Văn bản / Trích đoạn phục vụ đọc TTS
                </label>
                <textarea
                  rows={3}
                  value={editingCard.card.excerpt}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, excerpt: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nhận xét & Đánh giá</label>
                <input
                  type="text"
                  value={editingCard.card.commentary}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, commentary: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nhãn Tag (ngăn cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={editingCard.tagsInput}
                  onChange={(e) =>
                    setEditingCard({ ...editingCard, tagsInput: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingCard.card.title.trim() || !editingCard.card.author.trim()) {
                    return;
                  }
                  const cleanTags = editingCard.tagsInput
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);
                  onSaveCard(
                    {
                      ...editingCard.card,
                      tags: cleanTags.length ? cleanTags : ['Văn học'],
                      updatedAt: new Date().toISOString(),
                    },
                    editingCard.isNew
                  );
                  setEditingCard(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs cursor-pointer"
              >
                Lưu Thẻ Văn Học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận xóa thẻ văn học"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#111726] p-6 space-y-4 text-[#F5F2EB]">
            <h3 className="text-lg font-bold text-rose-400">Xác nhận xóa thẻ văn học</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa thẻ tác phẩm "{deletingCard.title}" ({deletingCard.author}) khỏi Kho Tài Liệu Văn Học?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCard(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCard(deletingCard.id);
                  setDeletingCard(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
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
