import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  BookPlus,
  Check,
  Copy,
  Edit3,
  Heart,
  Loader2,
  MessageSquarePlus,
  Presentation,
  Send,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import {
  AIConversation,
  AIMessage,
  LiteratureAICapabilityId,
  LiteratureCard,
  ReadingProgress,
  StudyMaterial,
  TTSMode,
} from '../types/studio';
import {
  LITERATURE_AI_CAPABILITIES,
  streamLiteratureAI,
} from '../lib/ai';

/**
 * Lightweight, safe Markdown renderer supporting headings, bold/italic, blockquotes,
 * bullet lists, code blocks, and Markdown tables.
 */
export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={idx} className="font-bold text-slate-950 dark:text-[#F5F2EB]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={idx} className="italic text-[#D4AF37]">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px] text-[#D4AF37]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Group lines into logical blocks (headings, tables, lists, blockquotes, paragraphs)
  const rawLines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // Markdown Table block
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (
        i < rawLines.length &&
        rawLines[i].trim().startsWith('|') &&
        rawLines[i].trim().endsWith('|')
      ) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headers = tableLines[0]
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        const dataRows = tableLines
          .slice(2)
          .map((r) =>
            r
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim())
          );
        elements.push(
          <div
            key={`tbl-${i}`}
            className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 my-2"
          >
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-[#D4AF37]">
                  {headers.map((h, hIdx) => (
                    <th
                      key={hIdx}
                      className="p-2.5 border-b border-slate-200 dark:border-slate-700 font-semibold"
                    >
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="border-b border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2.5 align-top">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4
          key={`h3-${i}`}
          className="text-sm font-bold text-[#D4AF37] pt-2 font-editorial"
        >
          {renderInline(line.slice(4))}
        </h4>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h3
          key={`h2-${i}`}
          className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F5F2EB] pt-1 border-b border-slate-200 dark:border-slate-800 pb-1.5 font-editorial"
        >
          {renderInline(line.slice(3))}
        </h3>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="pl-3.5 py-2 border-l-2 border-[#D4AF37] bg-[#D4AF37]/10 rounded-r-lg italic text-slate-700 dark:text-slate-200"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Bullet or numbered list
    if (/^(\*|-|\d+\.)\s+/.test(line)) {
      const listItems: string[] = [];
      while (
        i < rawLines.length &&
        /^(\*|-|\d+\.)\s+/.test(rawLines[i].trim())
      ) {
        listItems.push(rawLines[i].trim().replace(/^(\*|-|\d+\.)\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 space-y-1.5">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-slate-700 dark:text-slate-200">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-slate-700 dark:text-slate-200">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return (
    <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed">
      {elements}
    </div>
  );
};

interface LiteratureAIViewProps {
  uid: string;
  cards: LiteratureCard[];
  selectedCardId: string;
  onSelectCardId: (id: string) => void;
  conversations: AIConversation[];
  onUpdateConversations: (next: AIConversation[]) => void;
  contextPassage: string;
  onClearContextPassage: () => void;
  onSaveResultAsCard: (card: LiteratureCard) => void;
  onSaveStudyMaterial: (material: StudyMaterial) => void;
  onSendResultToTTS: (text: string, mode: TTSMode) => void;
  onAppendResultToScript: (
    stageTitle: string,
    workTitle: string,
    author: string,
    content: string
  ) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LiteratureAIView: React.FC<LiteratureAIViewProps> = ({
  uid,
  cards,
  selectedCardId,
  onSelectCardId,
  conversations,
  onUpdateConversations,
  contextPassage,
  onClearContextPassage,
  onSaveResultAsCard,
  onSaveStudyMaterial,
  onSendResultToTTS,
  onAppendResultToScript,
  notify,
}) => {
  const [activeConvId, setActiveConvId] = useState<string>(
    () => conversations[0]?.id || ''
  );
  const [selectedCapability, setSelectedCapability] =
    useState<LiteratureAICapabilityId>('analyze_work');
  const [compareCardId, setCompareCardId] = useState<string>(
    cards[1]?.id || cards[0]?.id || ''
  );
  const [inputPrompt, setInputPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [engineBadge, setEngineBadge] = useState('OpenAI Responses API (Streaming)');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const activeCard = cards.find((c) => c.id === selectedCardId) || cards[0];
  const compareCard =
    cards.find((c) => c.id === compareCardId) || cards[1] || cards[0];
  const currentConv =
    conversations.find((c) => c.id === activeConvId) || conversations[0] || null;
  const activeCapDef =
    LITERATURE_AI_CAPABILITIES.find((c) => c.id === selectedCapability) ||
    LITERATURE_AI_CAPABILITIES[0];

  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [activeConvId, conversations]);

  const handleCreateNewConversation = () => {
    const newConv: AIConversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: activeCard
        ? `Phân tích: ${activeCard.title}`
        : 'Hội thoại Văn học mới',
      workId: activeCard?.id,
      workTitle: activeCard?.title,
      model: 'gpt-4.1-mini',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateConversations([newConv, ...conversations]);
    setActiveConvId(newConv.id);
    notify('Đã tạo cuộc trò chuyện Literature AI mới.');
  };

  const handleRenameConversation = (convId: string) => {
    if (!renameTitleInput.trim()) return;
    const updated = conversations.map((c) =>
      c.id === convId
        ? { ...c, title: renameTitleInput.trim(), updatedAt: new Date().toISOString() }
        : c
    );
    onUpdateConversations(updated);
    setRenamingConvId(null);
    notify('Đã đổi tên cuộc trò chuyện.');
  };

  const handleDeleteConversation = (convId: string) => {
    const remaining = conversations.filter((c) => c.id !== convId);
    onUpdateConversations(remaining);
    if (activeConvId === convId) {
      setActiveConvId(remaining[0]?.id || '');
    }
    notify('Đã xóa cuộc trò chuyện.');
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    notify('Đã dừng phản hồi AI theo yêu cầu.', 'info');
  };

  const handleSendPrompt = async (
    overridePrompt?: string,
    overrideCap?: LiteratureAICapabilityId
  ) => {
    const capToUse = overrideCap || selectedCapability;
    const capDef =
      LITERATURE_AI_CAPABILITIES.find((c) => c.id === capToUse) || activeCapDef;
    const textPrompt = (overridePrompt ?? inputPrompt).trim() || capDef.promptTemplate;

    let targetConv = currentConv;
    let convList = [...conversations];
    if (!targetConv) {
      targetConv = {
        id: `conv-${Date.now()}`,
        title: activeCard
          ? `${capDef.shortLabel}: ${activeCard.title}`
          : capDef.shortLabel,
        workId: activeCard?.id,
        workTitle: activeCard?.title,
        model: 'gpt-4.1-mini',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      convList = [targetConv, ...convList];
      setActiveConvId(targetConv.id);
    }

    const userMsg: AIMessage = {
      id: `msg-u-${Date.now()}`,
      conversationId: targetConv.id,
      role: 'user',
      content: textPrompt,
      capability: capToUse,
      selectedPassage: contextPassage || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedWithUser = convList.map((c) =>
      c.id === targetConv!.id
        ? {
            ...c,
            messages: [...c.messages, userMsg],
            updatedAt: new Date().toISOString(),
          }
        : c
    );
    onUpdateConversations(updatedWithUser);
    setInputPrompt('');
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await streamLiteratureAI({
        uid,
        conversationId: targetConv.id,
        prompt: textPrompt,
        capability: capToUse,
        activeCard,
        compareCard: capToUse === 'compare_works' ? compareCard : undefined,
        selectedPassage: contextPassage || undefined,
        historyMessages: targetConv.messages,
        signal: controller.signal,
        onToken: (_delta, acc) => {
          setStreamingContent(acc);
        },
      });

      setEngineBadge(result.source);

      const assistantMsg: AIMessage = {
        id: `msg-a-${Date.now()}`,
        conversationId: targetConv.id,
        role: 'assistant',
        content: result.text,
        capability: capToUse,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        rating: 0,
        createdAt: new Date().toISOString(),
      };

      const finalConvs = updatedWithUser.map((c) =>
        c.id === targetConv!.id
          ? {
              ...c,
              messages: [...c.messages, assistantMsg],
              updatedAt: new Date().toISOString(),
            }
          : c
      );
      onUpdateConversations(finalConvs);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        if (streamingContent.trim()) {
          const partialMsg: AIMessage = {
            id: `msg-a-${Date.now()}`,
            conversationId: targetConv.id,
            role: 'assistant',
            content: `${streamingContent}\n\n*(Đã dừng phản hồi)*`,
            capability: capToUse,
            createdAt: new Date().toISOString(),
          };
          onUpdateConversations(
            updatedWithUser.map((c) =>
              c.id === targetConv!.id
                ? { ...c, messages: [...c.messages, partialMsg] }
                : c
            )
          );
        }
      } else {
        notify('Đã xảy ra lỗi khi kết nối trợ lý AI.', 'error');
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  };

  const handleRateMessage = (msgId: string, rating: 1 | -1) => {
    if (!currentConv) return;
    const updated = conversations.map((c) =>
      c.id === currentConv.id
        ? {
            ...c,
            messages: c.messages.map((m) =>
              m.id === msgId ? { ...m, rating } : m
            ),
          }
        : c
    );
    onUpdateConversations(updated);
    notify(
      rating === 1
        ? 'Cảm ơn đánh giá tích cực của bạn!'
        : 'Đã ghi nhận phản hồi để cải thiện chất lượng câu trả lời.'
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            OpenAI Responses API · Streaming thời gian thực · 20 Năng lực Ngữ văn · Nhận thức ngữ cảnh
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F5F2EB] font-editorial">
            LITERATURE AI – Trợ Lý Văn Học Thông Minh
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{engineBadge}</span>
          </div>

          <button
            type="button"
            onClick={handleCreateNewConversation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D4AF37] text-slate-950 font-semibold text-xs hover:bg-[#e1be49] cursor-pointer"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Cuộc trò chuyện mới
          </button>
        </div>
      </div>

      {/* Context-Aware Selected Passage Bar (When user highlights text anywhere on site) */}
      {contextPassage && (
        <div className="p-4 rounded-xl border-2 border-[#D4AF37] bg-[#D4AF37]/10 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#D4AF37]">
                ĐOẠN VĂN BẢN ĐANG CHỌN (CONTEXT-AWARE AI)
              </div>
              <p className="text-xs italic text-slate-800 dark:text-slate-200 mt-1 line-clamp-3">
                &ldquo;{contextPassage}&rdquo;
              </p>
            </div>
            <button
              type="button"
              onClick={onClearContextPassage}
              className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Bỏ đoạn trích đang chọn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              {
                label: 'Giải thích đoạn văn',
                cap: 'explain_detail' as LiteratureAICapabilityId,
                prompt: 'Hãy giải thích ý nghĩa nội dung và mạch cảm xúc của đoạn văn bản đang chọn.',
              },
              {
                label: 'Phân tích nghệ thuật',
                cap: 'analyze_poetry' as LiteratureAICapabilityId,
                prompt: 'Hãy phân tích các biện pháp tu từ, nhịp điệu và nghệ thuật ngôn từ trong đoạn trích đang chọn.',
              },
              {
                label: 'Giải thích từ khó & điển tích',
                cap: 'explain_vocabulary' as LiteratureAICapabilityId,
                prompt: 'Hãy giải thích các từ ngữ khó, từ Hán Việt hoặc điển tích trong đoạn trích đang chọn.',
              },
              {
                label: 'Tóm tắt ý chính',
                cap: 'summarize_work' as LiteratureAICapabilityId,
                prompt: 'Hãy tóm tắt ngắn gọn luận điểm / ý chính của đoạn trích đang chọn.',
              },
              {
                label: 'Đặt câu hỏi đọc hiểu sâu hơn',
                cap: 'reading_comprehension' as LiteratureAICapabilityId,
                prompt: 'Hãy đặt 3 câu hỏi đọc hiểu sâu sắc kèm gợi ý trả lời từ đoạn trích đang chọn.',
              },
            ].map((act, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedCapability(act.cap);
                  handleSendPrompt(act.prompt, act.cap);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs hover:bg-[#e2be46] cursor-pointer"
              >
                {act.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main 12-Col Layout: Left Sidebar (Conversations + 20 Capabilities) & Right Chat Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Context Work Selector & 20 Capabilities Selector */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Tác phẩm ngữ cảnh hiện tại
              </label>
              <select
                value={activeCard?.id || ''}
                onChange={(e) => onSelectCardId(e.target.value)}
                aria-label="Chọn tác phẩm ngữ cảnh"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} – {c.author}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Năng lực Literature AI (20 Chức năng)
              </label>
              <select
                value={selectedCapability}
                onChange={(e) =>
                  setSelectedCapability(e.target.value as LiteratureAICapabilityId)
                }
                aria-label="Chọn năng lực Literature AI"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
              >
                {LITERATURE_AI_CAPABILITIES.map((cap) => (
                  <option key={cap.id} value={cap.id}>
                    {cap.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {activeCapDef.description}
              </p>
            </div>

            {selectedCapability === 'compare_works' && (
              <div>
                <label className="block font-semibold text-[#D4AF37] mb-1">
                  Tác phẩm đối sánh thứ hai
                </label>
                <select
                  value={compareCardId}
                  onChange={(e) => setCompareCardId(e.target.value)}
                  aria-label="Chọn tác phẩm đối sánh"
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

            <button
              type="button"
              onClick={() => handleSendPrompt(activeCapDef.promptTemplate, selectedCapability)}
              disabled={isStreaming}
              className="w-full py-2.5 rounded-lg bg-[#D4AF37] text-slate-950 font-bold text-xs hover:bg-[#e1be49] transition-colors cursor-pointer"
            >
              Thực hiện nhanh: {activeCapDef.shortLabel}
            </button>
          </div>

          {/* Saved Conversations List */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-[#F5F2EB]">
                Lịch sử Hội thoại ({conversations.length})
              </span>
              <button
                type="button"
                onClick={handleCreateNewConversation}
                className="text-[#D4AF37] hover:underline font-semibold cursor-pointer"
              >
                + Tạo mới
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {conversations.length === 0 ? (
                <p className="text-slate-500 py-2">
                  Chưa có cuộc trò chuyện nào. Hãy đặt câu hỏi đầu tiên!
                </p>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === currentConv?.id;
                  return (
                    <div
                      key={conv.id}
                      className={`p-2.5 rounded-lg border transition-colors ${
                        isActive
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {renamingConvId === conv.id ? (
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={renameTitleInput}
                            onChange={(e) => setRenameTitleInput(e.target.value)}
                            className="flex-1 px-2 py-1 rounded bg-slate-900 text-white text-xs border border-[#D4AF37]"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameConversation(conv.id)}
                            className="px-2 py-1 rounded bg-[#D4AF37] text-slate-950 font-semibold cursor-pointer"
                          >
                            Lưu
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveConvId(conv.id)}
                            className="text-left flex-1 truncate font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                          >
                            {conv.title}
                            <div className="text-[10px] text-slate-400">
                              {conv.messages.length} tin nhắn ·{' '}
                              {new Date(conv.updatedAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingConvId(conv.id);
                                setRenameTitleInput(conv.title);
                              }}
                              aria-label="Đổi tên hội thoại"
                              className="p-1 text-slate-400 hover:text-[#D4AF37] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteConversation(conv.id)}
                              aria-label="Xóa hội thoại"
                              className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Conversational Streaming Interface (8 cols) */}
        <div className="lg:col-span-8 flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] min-h-[560px] max-h-[720px]">
          {/* Conversation Top Bar */}
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs text-[#D4AF37] font-semibold">
                {activeCard ? `${activeCard.title} — ${activeCard.author}` : 'Hội thoại Học thuật'}
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#F5F2EB]">
                {currentConv?.title || 'Trợ Lý Văn Học Thông Minh'}
              </h2>
            </div>

            {isStreaming && (
              <button
                type="button"
                onClick={handleStopStreaming}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Dừng phản hồi
              </button>
            )}
          </div>

          {/* Messages Stream Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {(!currentConv || currentConv.messages.length === 0) && !isStreaming ? (
              <div className="space-y-4 py-6">
                <div className="text-center max-w-lg mx-auto space-y-2">
                  <Sparkles className="w-8 h-8 text-[#D4AF37] mx-auto" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F2EB] font-editorial">
                    Bắt đầu phiên nghiên cứu &amp; phân tích cùng Literature AI
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Đang kết nối ngữ cảnh tác phẩm <strong>{activeCard?.title}</strong> ({activeCard?.author}). Chọn một gợi ý dưới đây hoặc nhập bất kỳ câu hỏi văn học nào.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {[
                    {
                      cap: 'analyze_work' as LiteratureAICapabilityId,
                      title: 'Phân tích toàn diện tác phẩm',
                      desc: 'Hoàn cảnh sáng tác, mạch cảm xúc, giá trị nội dung & nghệ thuật',
                    },
                    {
                      cap: 'analyze_character' as LiteratureAICapabilityId,
                      title: 'Phân tích hình tượng & nhân vật',
                      desc: `Mổ xẻ chiều sâu tâm lý và vẻ đẹp hình tượng trong ${activeCard?.title || 'tác phẩm'}`,
                    },
                    {
                      cap: 'build_outline' as LiteratureAICapabilityId,
                      title: 'Lập dàn ý Nghị luận văn học',
                      desc: 'Hệ thống luận điểm Mở – Thân – Kết chặt chẽ phục vụ bài viết',
                    },
                    {
                      cap: 'generate_flashcards' as LiteratureAICapabilityId,
                      title: 'Tạo bộ Flashcard & Câu hỏi ôn tập',
                      desc: 'Bảng thẻ ghi nhớ nhanh kiến thức cốt lõi của tác phẩm',
                    },
                  ].map((sug, i) => {
                    const def = LITERATURE_AI_CAPABILITIES.find(
                      (c) => c.id === sug.cap
                    )!;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedCapability(sug.cap);
                          handleSendPrompt(def.promptTemplate, sug.cap);
                        }}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-[#D4AF37] text-left transition-colors cursor-pointer"
                      >
                        <div className="text-xs font-bold text-[#D4AF37]">
                          {sug.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {sug.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              currentConv?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-3xl w-full rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-slate-900 dark:text-[#F5F2EB]'
                        : 'bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                      <span className="font-semibold text-[#D4AF37]">
                        {msg.role === 'user' ? 'Bạn' : 'Literature AI'}
                      </span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {msg.selectedPassage && (
                      <div className="mb-2 p-2.5 rounded-lg bg-slate-200/60 dark:bg-slate-800/80 border-l-2 border-[#D4AF37] text-[11px] italic text-slate-600 dark:text-slate-300">
                        Đoạn trích: &ldquo;{msg.selectedPassage}&rdquo;
                      </div>
                    )}

                    <MarkdownRenderer content={msg.content} />

                    {/* Action Toolbar for Assistant Messages */}
                    {msg.role === 'assistant' && (
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-[11px]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(msg.content);
                              setCopiedMsgId(msg.id);
                              setTimeout(() => setCopiedMsgId(null), 2000);
                              notify('Đã sao chép câu trả lời.');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#D4AF37] cursor-pointer"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Sao chép</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSendResultToTTS(msg.content, 'prose')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#D4AF37] cursor-pointer"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Đọc TTS</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onSaveStudyMaterial({
                                id: `mat-${Date.now()}`,
                                workId: activeCard?.id,
                                workTitle: activeCard?.title,
                                title: `${activeCard?.title || 'Văn học'} – ${activeCapDef.shortLabel}`,
                                materialType:
                                  msg.capability === 'generate_flashcards'
                                    ? 'flashcard'
                                    : msg.capability === 'generate_quiz'
                                    ? 'quiz'
                                    : msg.capability === 'build_outline'
                                    ? 'outline'
                                    : 'note',
                                content: msg.content,
                                updatedAt: new Date().toISOString(),
                              });
                              notify('Đã lưu vào Khu Vực Học Tập & Ghi Chú.');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#D4AF37] cursor-pointer"
                          >
                            <Bookmark className="w-3 h-3" />
                            <span>Lưu Học Liệu</span>
                          </button>

                          {activeCard && (
                            <button
                              type="button"
                              onClick={() =>
                                onSaveResultAsCard({
                                  ...activeCard,
                                  id: `lit-ai-${Date.now()}`,
                                  title: `${activeCard.title} (${activeCapDef.shortLabel})`,
                                  summary: msg.content.slice(0, 320),
                                  excerpt: msg.content,
                                  category: 'Tài liệu thuyết trình',
                                  updatedAt: new Date().toISOString(),
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#D4AF37] cursor-pointer"
                            >
                              <BookPlus className="w-3 h-3" />
                              <span>Lưu Thẻ Văn Học</span>
                            </button>
                          )}

                          {activeCard && (
                            <button
                              type="button"
                              onClick={() =>
                                onAppendResultToScript(
                                  activeCapDef.shortLabel,
                                  activeCard.title,
                                  activeCard.author,
                                  msg.content
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#D4AF37] cursor-pointer"
                            >
                              <Presentation className="w-3 h-3" />
                              <span>Thêm vào Trình chiếu</span>
                            </button>
                          )}
                        </div>

                        {/* Rating Thumbs Up / Down */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleRateMessage(msg.id, 1)}
                            aria-label="Đánh giá hữu ích"
                            className={`p-1 rounded cursor-pointer ${
                              msg.rating === 1
                                ? 'text-emerald-400 bg-emerald-500/20'
                                : 'text-slate-400 hover:text-emerald-400'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRateMessage(msg.id, -1)}
                            aria-label="Đánh giá cần cải thiện"
                            className={`p-1 rounded cursor-pointer ${
                              msg.rating === -1
                                ? 'text-rose-400 bg-rose-500/20'
                                : 'text-slate-400 hover:text-rose-400'
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Live Streaming Bubble */}
            {isStreaming && (
              <div className="flex flex-col items-start">
                <div className="max-w-3xl w-full rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/90 border border-[#D4AF37]/50 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Literature AI đang phân tích và phản hồi...</span>
                  </div>
                  {streamingContent ? (
                    <MarkdownRenderer content={streamingContent} />
                  ) : (
                    <p className="text-xs text-slate-400">
                      Đang tổng hợp dẫn chứng văn học và cấu trúc luận điểm...
                    </p>
                  )}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2.5 items-end"
          >
            <textarea
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isStreaming) handleSendPrompt();
                }
              }}
              placeholder={`Đặt câu hỏi về "${activeCard?.title || 'tác phẩm'}" hoặc yêu cầu phân tích, lập dàn ý, giải thích từ khó...`}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-[#F5F2EB] focus:outline-none focus:border-[#D4AF37]"
            />
            <button
              type="submit"
              disabled={isStreaming}
              className="px-5 py-3 rounded-xl bg-[#D4AF37] text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-[#e1be49] disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STUDY HUB VIEW (KHU VỰC HỌC TẬP, TIẾN ĐỘ ĐỌC, GHI CHÚ & TÀI LIỆU ĐÃ LƯU)
// ============================================================================

interface StudyHubViewProps {
  cards: LiteratureCard[];
  readingProgress: Record<string, ReadingProgress>;
  onUpdateReadingProgress: (workId: string, next: ReadingProgress) => void;
  favorites: string[];
  onToggleFavorite: (workId: string) => void;
  studyMaterials: StudyMaterial[];
  onDeleteStudyMaterial: (id: string) => void;
  onAskAIAboutPassage: (workId: string, passage: string) => void;
  onReadFromCursorTTS: (text: string, mode: TTSMode) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudyHubView: React.FC<StudyHubViewProps> = ({
  cards,
  readingProgress,
  onUpdateReadingProgress,
  favorites,
  onToggleFavorite,
  studyMaterials,
  onDeleteStudyMaterial,
  onAskAIAboutPassage,
  onReadFromCursorTTS,
  notify,
}) => {
  const [selectedWorkId, setSelectedWorkId] = useState<string>(
    cards[0]?.id || ''
  );
  const activeWork = cards.find((c) => c.id === selectedWorkId) || cards[0];
  const currentProg: ReadingProgress = readingProgress[activeWork?.id || ''] || {
    workId: activeWork?.id || '',
    workTitle: activeWork?.title || '',
    lastChunkIndex: 0,
    cursorOffset: 0,
    scrollPosition: 0,
    completionPercent: 25,
    personalNotes: '',
    updatedAt: new Date().toISOString(),
  };

  const [noteDraft, setNoteDraft] = useState(currentProg.personalNotes);
  const [progressPercent, setProgressPercent] = useState(
    currentProg.completionPercent
  );
  const readerTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const p = readingProgress[activeWork?.id || ''];
    setNoteDraft(p?.personalNotes || '');
    setProgressPercent(p?.completionPercent ?? 25);
  }, [activeWork?.id, readingProgress]);

  const fullReaderText = activeWork
    ? `${activeWork.title} — ${activeWork.author}\n\n[Hoàn cảnh sáng tác]\n${activeWork.creationContext}\n\n[Tóm tắt & Mạch tác phẩm]\n${activeWork.summary}\n\n[Giá trị nội dung]\n${activeWork.contentValue}\n\n[Giá trị nghệ thuật]\n${activeWork.artisticValue}\n\n[Ghi chú trích đoạn]\n${activeWork.excerpt}\n\n[Nhận định học thuật]\n${activeWork.commentary}`
    : '';

  const handleSaveNoteAndProgress = () => {
    if (!activeWork) return;
    onUpdateReadingProgress(activeWork.id, {
      workId: activeWork.id,
      workTitle: activeWork.title,
      lastChunkIndex: currentProg.lastChunkIndex,
      cursorOffset: readerTextareaRef.current?.selectionStart || 0,
      scrollPosition: readerTextareaRef.current?.scrollTop || 0,
      completionPercent: progressPercent,
      personalNotes: noteDraft,
      updatedAt: new Date().toISOString(),
    });
    notify(`Đã lưu tiến độ đọc (${progressPercent}%) và ghi chú cho "${activeWork.title}".`);
  };

  const handleReadFromCursor = () => {
    if (!activeWork) return;
    const el = readerTextareaRef.current;
    const offset = el ? el.selectionStart : 0;
    const sliced =
      offset > 0 && offset < fullReaderText.length
        ? fullReaderText.slice(offset)
        : fullReaderText;
    onReadFromCursorTTS(
      sliced,
      activeWork.genre.toLowerCase().includes('thơ') ? 'poetry' : 'prose'
    );
    notify(
      offset > 0
        ? `Bắt đầu đọc TTS từ vị trí con trỏ (ký tự #${offset}).`
        : 'Bắt đầu đọc TTS toàn văn bản.'
    );
  };

  const handleAskSelectedInReader = () => {
    if (!activeWork) return;
    const el = readerTextareaRef.current;
    const selected =
      el && el.selectionStart !== el.selectionEnd
        ? fullReaderText.slice(el.selectionStart, el.selectionEnd).trim()
        : activeWork.summary;
    onAskAIAboutPassage(activeWork.id, selected);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Đồng bộ tiến độ đọc · Đọc từ vị trí con trỏ · Ghi chú cá nhân · Kho học liệu &amp; Flashcard
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F5F2EB] font-editorial">
            Khu Vực Học Tập, Đọc Tác Phẩm &amp; Ghi Chú Đồng Bộ
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Reader with Cursor TTS & AI Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <select
                value={activeWork?.id || ''}
                onChange={(e) => setSelectedWorkId(e.target.value)}
                aria-label="Chọn tác phẩm học tập"
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} – {c.author}
                  </option>
                ))}
              </select>

              {activeWork && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(activeWork.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                    favorites.includes(activeWork.id)
                      ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                      : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      favorites.includes(activeWork.id) ? 'fill-current text-rose-400' : ''
                    }`}
                  />
                  <span>
                    {favorites.includes(activeWork.id) ? 'Đã Yêu Thích' : 'Yêu Thích'}
                  </span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Mẹo: Đặt con trỏ chuột tại bất kỳ vị trí nào trong văn bản bên dưới và bấm <strong>&ldquo;Đọc TTS từ vị trí con trỏ&rdquo;</strong>, hoặc bôi đen một câu/đoạn để bấm <strong>&ldquo;Hỏi Literature AI&rdquo;</strong>.
            </div>

            <textarea
              ref={readerTextareaRef}
              readOnly
              rows={12}
              value={fullReaderText}
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#D4AF37]"
            />

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleReadFromCursor}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#D4AF37] text-slate-950 font-bold text-xs cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                Đọc TTS từ vị trí con trỏ
              </button>

              <button
                type="button"
                onClick={handleAskSelectedInReader}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:border-[#D4AF37] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Hỏi Literature AI về đoạn bôi đen
              </button>
            </div>
          </div>
        </div>

        {/* Right: Personal Notes, Reading Progress & Saved Study Materials (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-[#F5F2EB] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
              Tiến Độ Đọc &amp; Ghi Chú Cá Nhân ({activeWork?.title})
            </h2>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500 dark:text-slate-400">
                  Mức độ hoàn thành nghiên cứu tác phẩm
                </span>
                <span className="font-mono font-bold text-[#D4AF37]">
                  {progressPercent}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progressPercent}
                onChange={(e) => setProgressPercent(Number(e.target.value))}
                className="w-full accent-[#D4AF37] cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sổ tay ghi chú cá nhân (Đồng bộ tự động theo UID)
              </label>
              <textarea
                rows={4}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Ghi lại luận điểm tâm đắc, dẫn chứng liên hệ mở rộng hoặc câu hỏi cần ôn tập..."
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveNoteAndProgress}
              className="w-full py-2.5 rounded-lg bg-[#D4AF37] text-slate-950 font-bold text-xs cursor-pointer"
            >
              Lưu Tiến Độ &amp; Ghi Chú Đồng Bộ
            </button>
          </div>

          {/* Saved Materials / Flashcards / Outlines */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F2EB]">
              Kho Học Liệu &amp; Flashcard Đã Lưu ({studyMaterials.length})
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {studyMaterials.length === 0 ? (
                <p className="text-slate-500">
                  Chưa có học liệu lưu trữ. Trong mục Literature AI, bấm &ldquo;Lưu Học Liệu&rdquo; dưới bất kỳ phản hồi nào để lưu về đây.
                </p>
              ) : (
                studyMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#D4AF37]">{mat.title}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteStudyMaterial(mat.id)}
                        className="text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-line">
                      {mat.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
