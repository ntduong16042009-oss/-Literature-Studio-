import React, { useState } from 'react';
import {
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  BookPlus,
  Presentation,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { LiteratureCard, TTSMode } from '../types/studio';
import { AI_STYLES, AI_TASKS, buildLocalScholarlyAnalysis } from '../utils/aiScholarEngine';

interface TTSStudioViewProps {
  cards: LiteratureCard[];
  ttsText: string;
  onChangeTtsText: (val: string) => void;
  ttsMode: TTSMode;
  onChangeTtsMode: (mode: TTSMode) => void;
  ttsRate: number;
  onChangeTtsRate: (rate: number) => void;
  ttsVolume: number;
  onChangeTtsVolume: (vol: number) => void;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  onChangeVoiceURI: (uri: string) => void;
  isSpeaking: boolean;
  isPaused: boolean;
  chunks: string[];
  activeChunkIndex: number;
  isDuckingActive: boolean;
  duckingPercent: number;
  onStartRead: (fromIndexOrText?: string) => void;
  onPauseRead: () => void;
  onResumeRead: () => void;
  onStopRead: () => void;
}

export const TTSStudioView: React.FC<TTSStudioViewProps> = ({
  cards,
  ttsText,
  onChangeTtsText,
  ttsMode,
  onChangeTtsMode,
  ttsRate,
  onChangeTtsRate,
  ttsVolume,
  onChangeTtsVolume,
  voices,
  selectedVoiceURI,
  onChangeVoiceURI,
  isSpeaking,
  isPaused,
  chunks,
  activeChunkIndex,
  isDuckingActive,
  duckingPercent,
  onStartRead,
  onPauseRead,
  onResumeRead,
  onStopRead,
}) => {
  const [autoScrollTTS, setAutoScrollTTS] = useState(true);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const activeChunkElRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (isSpeaking && autoScrollTTS && activeChunkElRef.current) {
      activeChunkElRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeChunkIndex, autoScrollTTS, isSpeaking]);

  const modes: { id: TTSMode; title: string; subtitle: string }[] = [
    {
      id: 'normal',
      title: 'Chế độ 1: Đọc thông thường',
      subtitle: 'Phát âm rõ ràng · Ngắt nghỉ chuẩn theo dấu câu · Tốc độ ổn định',
    },
    {
      id: 'poetry',
      title: 'Chế độ 2: Đọc thơ truyền cảm',
      subtitle: 'Nhấn nhá theo nhịp thơ · Ngắt nghỉ từng dòng thơ · Chậm và sâu lắng',
    },
    {
      id: 'prose',
      title: 'Chế độ 3: Đọc văn xuôi',
      subtitle: 'Giọng tự nhiên · Ngữ điệu linh hoạt · Ngắt nghỉ theo đoạn văn',
    },
    {
      id: 'presentation',
      title: 'Chế độ 4: Thuyết trình lớp học',
      subtitle: 'Giọng trang trọng · Tốc độ vừa phải · Rõ luận điểm trình bày',
    },
  ];

  const handleLoadFromCard = (cardId: string) => {
    const found = cards.find((c) => c.id === cardId);
    if (!found) return;
    const textToRead = `${found.title} – Tác giả ${found.author}.\n\nHoàn cảnh sáng tác: ${found.creationContext}\n\nNội dung chính: ${found.summary}\n\nGiá trị nghệ thuật: ${found.artisticValue}\n\nNhận định: ${found.commentary}`;
    onChangeTtsText(textToRead);
  };

  const handleReadFromCursor = () => {
    const el = textareaRef.current;
    if (el && el.selectionStart > 0 && el.selectionStart < ttsText.length) {
      const sliced = ttsText.slice(el.selectionStart).trim();
      if (sliced) {
        onStartRead(sliced);
        return;
      }
    }
    onStartRead();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Web Speech API · Ưu tiên giọng đọc Tiếng Việt (vi-VN) · Đọc từ vị trí con trỏ · Audio Ducking
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F5F2EB]">
            Đọc Thơ & Văn Bản (Text-to-Speech Studio)
          </h1>
        </div>

        {/* Audio Ducking Live Banner */}
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            isDuckingActive
              ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] font-semibold'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-300'
          }`}
        >
          <Volume2 className="w-4 h-4 shrink-0" />
          <span>
            {isDuckingActive
              ? `Audio Ducking Đang Bật: Nhạc nền tự động hạ xuống ${duckingPercent}% mức âm lượng gốc`
              : `Chế độ Audio Ducking Sẵn Sàng (Tự động giảm nhạc nền xuống ${duckingPercent}% khi đọc)`}
          </span>
        </div>
      </div>

      {/* 4 Reading Modes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {modes.map((m) => {
          const active = ttsMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChangeTtsMode(m.id)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                active
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-slate-900 dark:text-[#F5F2EB]'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-xs text-[#D4AF37] mb-1">{m.title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {m.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Controls & Text Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="tts-textarea"
                className="text-sm font-semibold text-slate-900 dark:text-[#F5F2EB]"
              >
                Văn bản / Thơ / Lời thuyết trình cần đọc
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) handleLoadFromCard(e.target.value);
                }}
                defaultValue=""
                aria-label="Nạp nhanh văn bản từ Thư viện Văn học"
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="" disabled>
                  + Nạp nhanh từ Thư viện Văn học...
                </option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} – {c.author}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              ref={textareaRef}
              id="tts-textarea"
              rows={9}
              value={ttsText}
              onChange={(e) => onChangeTtsText(e.target.value)}
              placeholder="Nhập hoặc dán bài thơ, đoạn văn xuôi hoặc kịch bản thuyết trình vào đây..."
              className="w-full p-4 text-sm leading-relaxed rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-[#F5F2EB] focus:outline-none focus:border-[#D4AF37]"
            />

            {/* Control Buttons: Read, Read From Cursor, Pause, Resume, Stop */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onStartRead()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs hover:bg-[#e2be46] transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                {isSpeaking ? 'Đọc Lại Từ Đầu' : 'Bắt Đầu Đọc (Read)'}
              </button>

              <button
                type="button"
                onClick={handleReadFromCursor}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-[#D4AF37]/60 text-[#D4AF37] font-semibold text-xs hover:bg-[#D4AF37]/10 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Đọc từ vị trí con trỏ
              </button>

              <button
                type="button"
                onClick={onPauseRead}
                disabled={!isSpeaking || isPaused}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs disabled:opacity-40 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                Tạm dừng
              </button>

              <button
                type="button"
                onClick={onResumeRead}
                disabled={!isPaused}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs disabled:opacity-40 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Tiếp tục
              </button>

              <button
                type="button"
                onClick={onStopRead}
                disabled={!isSpeaking && !isPaused}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 font-semibold text-xs disabled:opacity-40 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Dừng đọc
              </button>
            </div>
          </div>
        </div>

        {/* Voice Settings & Live Highlighted Chunks */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4 text-xs">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F5F2EB] flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#D4AF37]" />
              Cấu hình Giọng Đọc & Tốc Độ (Đồng bộ theo tài khoản)
            </h2>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">
                Lựa chọn giọng đọc (Ưu tiên Tiếng Việt vi-VN)
              </label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => onChangeVoiceURI(e.target.value)}
                aria-label="Chọn giọng đọc TTS"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="">Tự động ưu tiên giọng Tiếng Việt (vi-VN)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-500 dark:text-slate-400">
                  Tốc độ đọc (0.5x – 2.0x)
                </label>
                <span className="font-mono-tabular font-semibold text-[#D4AF37]">
                  {ttsRate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={ttsRate}
                onChange={(e) => onChangeTtsRate(Number(e.target.value))}
                aria-label="Tốc độ đọc TTS"
                className="w-full accent-[#D4AF37] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-500 dark:text-slate-400">
                  Âm lượng giọng đọc
                </label>
                <span className="font-mono-tabular font-semibold text-slate-700 dark:text-slate-200">
                  {Math.round(ttsVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={ttsVolume}
                onChange={(e) => onChangeTtsVolume(Number(e.target.value))}
                aria-label="Âm lượng giọng đọc TTS"
                className="w-full accent-[#D4AF37] cursor-pointer"
              />
            </div>

            <label className="flex items-center justify-between pt-1 cursor-pointer">
              <span className="text-slate-600 dark:text-slate-300">
                Tự động cuộn &amp; làm nổi bật đoạn đang đọc
              </span>
              <input
                type="checkbox"
                checked={autoScrollTTS}
                onChange={(e) => setAutoScrollTTS(e.target.checked)}
                className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          {/* Live Reading Progress & Highlighted Verses/Paragraphs */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-[#F5F2EB]">
                Theo dõi đoạn đang đọc ({chunks.length} đoạn chia tự động)
              </span>
              {isSpeaking && (
                <span className="font-mono-tabular text-[#D4AF37]">
                  Đoạn {activeChunkIndex + 1} / {chunks.length}
                </span>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {chunks.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Chưa có văn bản để tách đoạn.
                </p>
              ) : (
                chunks.map((chunk, idx) => {
                  const isCurrent = isSpeaking && idx === activeChunkIndex;
                  return (
                    <div
                      key={idx}
                      ref={isCurrent ? activeChunkElRef : undefined}
                      className={`p-2.5 rounded-lg text-xs leading-relaxed transition-colors ${
                        isCurrent
                          ? 'bg-[#D4AF37]/20 border border-[#D4AF37] text-slate-900 dark:text-[#F5F2EB] font-medium'
                          : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="font-mono-tabular text-[10px] text-slate-400 mr-2">
                        #{idx + 1}
                      </span>
                      {chunk}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AIWorkspaceViewProps {
  cards: LiteratureCard[];
  selectedCardId: string;
  onSelectCardId: (id: string) => void;
  onSaveResultAsCard: (card: LiteratureCard) => void;
  onSendResultToTTS: (text: string, mode: TTSMode) => void;
  onAppendResultToScript: (title: string, workTitle: string, author: string, content: string) => void;
}

export const AIWorkspaceView: React.FC<AIWorkspaceViewProps> = ({
  cards,
  selectedCardId,
  onSelectCardId,
  onSaveResultAsCard,
  onSendResultToTTS,
  onAppendResultToScript,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('content_art');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('deep');
  const [compareCardId, setCompareCardId] = useState<string>(
    cards[1]?.id || cards[0]?.id || ''
  );
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisOutput, setAnalysisOutput] = useState<string>(() => {
    const initialCard = cards.find((c) => c.id === selectedCardId) || cards[0];
    if (!initialCard) return '';
    return buildLocalScholarlyAnalysis(
      initialCard,
      'content_art',
      'Phân tích chuyên sâu'
    );
  });
  const [engineSource, setEngineSource] = useState<string>('Kho Học Liệu Ngữ Văn Chuẩn');

  const activeCard = cards.find((c) => c.id === selectedCardId) || cards[0];
  const compareCard = cards.find((c) => c.id === compareCardId) || cards[1] || cards[0];
  const activeTask = AI_TASKS.find((t) => t.id === selectedTaskId) || AI_TASKS[0];
  const activeStyle = AI_STYLES.find((s) => s.id === selectedStyleId) || AI_STYLES[0];

  const handleRunAnalysis = async () => {
    if (!activeCard) return;
    setIsLoading(true);

    try {
      const workContext = `Tác giả: ${activeCard.author}. Thể loại: ${activeCard.genre}. Hoàn cảnh: ${activeCard.creationContext}. Nội dung: ${activeCard.summary}. Chủ đề: ${activeCard.theme}. Nghệ thuật: ${activeCard.artisticValue}. Hình tượng: ${activeCard.artisticImagery}.`;

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workTitle: activeCard.title,
          author: activeCard.author,
          taskLabel: activeTask.label,
          styleLabel: activeStyle.label,
          customPrompt: customPrompt.trim(),
          workContext,
          compareWorkTitle:
            selectedTaskId === 'compare' && compareCard
              ? `${compareCard.title} (${compareCard.author})`
              : undefined,
        }),
      });

      const data = await res.json();
      if (data && data.text) {
        setAnalysisOutput(data.text);
        setEngineSource('Gemini AI Server Engine (gemini-4-hydrogen)');
      } else {
        const localText = buildLocalScholarlyAnalysis(
          activeCard,
          selectedTaskId,
          activeStyle.label,
          selectedTaskId === 'compare' ? compareCard : undefined,
          customPrompt.trim()
        );
        setAnalysisOutput(localText);
        setEngineSource('Kho Học Liệu Ngữ Văn Tích Hợp');
      }
    } catch {
      const localText = buildLocalScholarlyAnalysis(
        activeCard,
        selectedTaskId,
        activeStyle.label,
        selectedTaskId === 'compare' ? compareCard : undefined,
        customPrompt.trim()
      );
      setAnalysisOutput(localText);
      setEngineSource('Kho Học Liệu Ngữ Văn Tích Hợp');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            13 Chuyên Đề Phân Tích Văn Học · 6 Phong Cách Trình Bày · Kết nối AI & Học Liệu Sẵn Có
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F5F2EB]">
            Trợ Lý Phân Tích Văn Học AI (AI Literature Assistant)
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-xs text-slate-600 dark:text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Nguồn xử lý: {engineSource}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Configuration Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                1. Chọn tác phẩm văn học cần phân tích
              </label>
              <select
                value={activeCard?.id || ''}
                onChange={(e) => onSelectCardId(e.target.value)}
                aria-label="Chọn tác phẩm văn học"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} – {c.author} ({c.genre})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                2. Chọn nhiệm vụ phân tích (13 chức năng chuyên sâu)
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                aria-label="Chọn nhiệm vụ phân tích văn học"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
              >
                {AI_TASKS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {activeTask.description}
              </p>
            </div>

            {selectedTaskId === 'compare' && (
              <div>
                <label className="block font-semibold text-[#D4AF37] mb-1.5">
                  Chọn tác phẩm thứ hai để so sánh đối chiếu
                </label>
                <select
                  value={compareCardId}
                  onChange={(e) => setCompareCardId(e.target.value)}
                  aria-label="Chọn tác phẩm đối chiếu"
                  className="w-full px-3 py-2 rounded-lg border border-[#D4AF37]/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} – {c.author}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                3. Chọn phong cách trả lời (6 văn phong)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AI_STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyleId(st.id)}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      selectedStyleId === st.id
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-slate-900 dark:text-[#F5F2EB] font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div>{st.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                4. Yêu cầu cụ thể bổ sung (Tùy chọn)
              </label>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="VD: Nhấn mạnh vẻ đẹp bi tráng của người lính Tây Tiến qua đoạn 3..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#D4AF37] text-slate-950 font-bold text-xs hover:bg-[#e2be46] transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang phân tích học liệu...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Thực Hiện Phân Tích Chuyên Sâu
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-7">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] flex flex-col justify-between min-h-[480px] space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs text-[#D4AF37] font-semibold">
                    {activeTask.label} · {activeStyle.label}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-[#F5F2EB]">
                    {activeCard?.title} — {activeCard?.author}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onSendResultToTTS(
                        analysisOutput,
                        selectedStyleId === 'spoken' || selectedTaskId === 'presentation'
                          ? 'presentation'
                          : 'prose'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Đọc bài phân tích (TTS)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!activeCard) return;
                      onAppendResultToScript(
                        activeTask.label,
                        activeCard.title,
                        activeCard.author,
                        analysisOutput
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs cursor-pointer"
                  >
                    <Presentation className="w-3.5 h-3.5" />
                    Thêm vào Kịch Bản Thuyết Trình
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!activeCard) return;
                      onSaveResultAsCard({
                        ...activeCard,
                        id: `lit-ai-${Date.now()}`,
                        title: `${activeCard.title} (${activeTask.label})`,
                        summary: analysisOutput.slice(0, 360),
                        excerpt: analysisOutput,
                        category: 'Tài liệu thuyết trình',
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs cursor-pointer"
                  >
                    <BookPlus className="w-3.5 h-3.5" />
                    Lưu thành Thẻ Văn Học
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line max-h-[420px] overflow-y-auto">
                {analysisOutput}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span>
                Lưu ý học thuật: Nội dung phân tích bám sát dữ liệu tác phẩm trong Kho Văn Học, không tự bịa đặt nguyên tác.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
