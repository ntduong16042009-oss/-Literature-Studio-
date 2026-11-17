import {
  AIMessage,
  LiteratureAICapabilityId,
  LiteratureCard,
} from '../types/studio';

export interface LiteratureAICapabilityDef {
  id: LiteratureAICapabilityId;
  number: number;
  label: string;
  shortLabel: string;
  category: 'Phân tích' | 'Đọc hiểu & Từ vựng' | 'Nghị luận & Viết' | 'Ôn tập & Thuyết trình';
  promptTemplate: string;
  description: string;
}

export const LITERATURE_AI_CAPABILITIES: LiteratureAICapabilityDef[] = [
  {
    id: 'analyze_work',
    number: 1,
    label: '1. Phân tích tác phẩm toàn diện',
    shortLabel: 'Phân tích tác phẩm',
    category: 'Phân tích',
    promptTemplate:
      'Hãy phân tích toàn diện tác phẩm (hoàn cảnh sáng tác, mạch cảm xúc/bố cục, giá trị nội dung, giá trị nghệ thuật và thông điệp tư tưởng).',
    description: 'Phân tích sâu hoàn cảnh, bố cục, nội dung và nghệ thuật đặc sắc.',
  },
  {
    id: 'analyze_poetry',
    number: 2,
    label: '2. Phân tích thơ (nhịp điệu, vần, nhãn tự)',
    shortLabel: 'Phân tích thơ',
    category: 'Phân tích',
    promptTemplate:
      'Hãy phân tích đặc trưng thi pháp của bài thơ/đoạn thơ: thể thơ, nhịp điệu, cách gieo vần, nhãn tự, hình ảnh ẩn dụ và mạch cảm xúc trữ tình.',
    description: 'Mổ xẻ nhịp thơ, vần điệu, nhãn tự và bức tranh tâm trạng.',
  },
  {
    id: 'analyze_prose',
    number: 3,
    label: '3. Phân tích truyện & tự sự',
    shortLabel: 'Phân tích truyện',
    category: 'Phân tích',
    promptTemplate:
      'Hãy phân tích tình huống truyện, cốt truyện, điểm nhìn trần thuật, nghệ thuật dựng cảnh và giọng điệu văn xuôi của tác phẩm.',
    description: 'Phân tích tình huống truyện, điểm nhìn trần thuật và kết cấu tự sự.',
  },
  {
    id: 'analyze_character',
    number: 4,
    label: '4. Phân tích nhân vật văn học',
    shortLabel: 'Phân tích nhân vật',
    category: 'Phân tích',
    promptTemplate:
      'Hãy phân tích chuyên sâu hình tượng nhân vật: lai lịch, ngoại hình, hành động, diễn biến tâm lý và ý nghĩa biểu tượng của nhân vật.',
    description: 'Khắc họa ngoại hình, hành động, nội tâm và bi kịch/vẻ đẹp nhân vật.',
  },
  {
    id: 'analyze_imagery',
    number: 5,
    label: '5. Phân tích hình tượng nghệ thuật',
    shortLabel: 'Hình tượng nghệ thuật',
    category: 'Phân tích',
    promptTemplate:
      'Hãy phân tích các hình tượng nghệ thuật trung tâm và hệ thống biểu tượng thẩm mỹ trong tác phẩm.',
    description: 'Giải mã các biểu tượng nghệ thuật đa tầng nghĩa trong tác phẩm.',
  },
  {
    id: 'analyze_theme',
    number: 6,
    label: '6. Phân tích chủ đề & tư tưởng nhân đạo',
    shortLabel: 'Phân tích chủ đề',
    category: 'Phân tích',
    promptTemplate:
      'Hãy làm rõ chủ đề chính, giá trị hiện thực và chiều sâu tư tưởng nhân đạo của tác phẩm.',
    description: 'Làm sáng tỏ chủ đề tư tưởng, giá trị hiện thực và nhân đạo.',
  },
  {
    id: 'analyze_author_style',
    number: 7,
    label: '7. Phân tích phong cách nghệ thuật tác giả',
    shortLabel: 'Phong cách tác giả',
    category: 'Phân tích',
    promptTemplate:
      'Hãy phân tích phong cách nghệ thuật độc đáo của tác giả thể hiện qua tác phẩm này và vị trí của tác giả trong nền văn học Việt Nam.',
    description: 'Nhận diện cá tính sáng tạo và giọng điệu riêng của nhà văn/nhà thơ.',
  },
  {
    id: 'compare_works',
    number: 8,
    label: '8. So sánh đối chiếu hai tác phẩm',
    shortLabel: 'So sánh tác phẩm',
    category: 'Phân tích',
    promptTemplate:
      'Hãy lập bảng so sánh điểm tương đồng và khác biệt về đề tài, cảm hứng chủ đạo, bút pháp nghệ thuật và vẻ đẹp hình tượng giữa hai tác phẩm.',
    description: 'Đặt hai tác phẩm lên bàn cân đối sánh có bảng trực quan.',
  },
  {
    id: 'explain_detail',
    number: 9,
    label: '9. Giải thích chi tiết nghệ thuật đắt giá',
    shortLabel: 'Giải thích chi tiết',
    category: 'Đọc hiểu & Từ vựng',
    promptTemplate:
      'Hãy giải thích ý nghĩa của các chi tiết nghệ thuật đắt giá ("nhãn tự", chi tiết giàu kịch tính) trong tác phẩm.',
    description: 'Phân tích các chi tiết nhỏ làm nên nhà văn lớn trong tác phẩm.',
  },
  {
    id: 'summarize_work',
    number: 10,
    label: '10. Tóm tắt tác phẩm chuẩn xác',
    shortLabel: 'Tóm tắt tác phẩm',
    category: 'Đọc hiểu & Từ vựng',
    promptTemplate:
      'Hãy tóm tắt ngắn gọn, súc tích, đúng trình tự sự kiện/mạch cảm xúc của tác phẩm mà không làm mất đi tinh thần nguyên tác.',
    description: 'Tóm tắt cô đọng, chuẩn xác theo bố cục và sự kiện chính.',
  },
  {
    id: 'reading_comprehension',
    number: 11,
    label: '11. Hướng dẫn trả lời Đọc hiểu văn bản',
    shortLabel: 'Hướng dẫn đọc hiểu',
    category: 'Đọc hiểu & Từ vựng',
    promptTemplate:
      'Hãy thiết kế bộ câu hỏi và hướng dẫn trả lời Đọc hiểu theo 4 mức độ: Nhận biết, Thông hiểu, Vận dụng và Vận dụng cao.',
    description: 'Rèn kỹ năng trả lời câu hỏi đọc hiểu theo chuẩn cấu trúc đề thi.',
  },
  {
    id: 'literary_essay',
    number: 12,
    label: '12. Hỗ trợ viết bài Nghị luận văn học',
    shortLabel: 'Nghị luận văn học',
    category: 'Nghị luận & Viết',
    promptTemplate:
      'Hãy viết bài văn hoặc đoạn văn nghị luận văn học hoàn chỉnh, lập luận chặt chẽ, giàu chất văn và có liên hệ mở rộng.',
    description: 'Xây dựng bài viết nghị luận văn học sâu sắc, giàu sức thuyết phục.',
  },
  {
    id: 'build_outline',
    number: 13,
    label: '13. Lập dàn ý chi tiết (Mở – Thân – Kết)',
    shortLabel: 'Lập dàn ý',
    category: 'Nghị luận & Viết',
    promptTemplate:
      'Hãy lập dàn ý chi tiết gồm Mở bài, Thân bài (chia rõ các luận điểm, luận cứ, dẫn chứng) và Kết bài.',
    description: 'Thiết kế hệ thống luận điểm khoa học, dễ nhớ trước khi viết bài.',
  },
  {
    id: 'review_writing',
    number: 14,
    label: '14. Góp ý & nâng cấp bài viết của học sinh',
    shortLabel: 'Góp ý bài viết',
    category: 'Nghị luận & Viết',
    promptTemplate:
      'Hãy nhận xét ưu điểm, chỉ ra điểm cần khắc phục về lập luận/diễn đạt và viết lại đoạn văn nâng cấp giàu hình ảnh hơn.',
    description: 'Chấm chữa, sửa lỗi diễn đạt và nâng tầm văn phong nghị luận.',
  },
  {
    id: 'explain_vocabulary',
    number: 15,
    label: '15. Giải thích từ khó & ngữ cảnh cổ/hiện đại',
    shortLabel: 'Giải thích từ khó',
    category: 'Đọc hiểu & Từ vựng',
    promptTemplate:
      'Hãy giải thích nghĩa gốc, nghĩa chuyển và sắc thái biểu cảm của các từ ngữ khó, từ Hán Việt hoặc phương ngữ trong văn bản.',
    description: 'Giải nghĩa từ Hán Việt, từ cổ và sắc thái tu từ trong ngữ cảnh.',
  },
  {
    id: 'explain_allusion',
    number: 16,
    label: '16. Giải thích điển tích, điển cố văn học',
    shortLabel: 'Điển tích điển cố',
    category: 'Đọc hiểu & Từ vựng',
    promptTemplate:
      'Hãy giải thích nguồn gốc, ý nghĩa văn hóa và tác dụng biểu đạt của các điển tích, điển cố hoặc motif truyền thống trong tác phẩm.',
    description: 'Truy nguyên nguồn gốc và ý nghĩa thẩm mỹ của điển tích, điển cố.',
  },
  {
    id: 'presentation_support',
    number: 17,
    label: '17. Hỗ trợ kịch bản thuyết trình lớp học',
    shortLabel: 'Hỗ trợ thuyết trình',
    category: 'Ôn tập & Thuyết trình',
    promptTemplate:
      'Hãy soạn kịch bản lời dẫn thuyết trình truyền cảm (gồm lời chào mở đầu, dẫn dắt từng phần, điểm nhấn đọc diễn cảm và lời kết lắng đọng).',
    description: 'Soạn lời dẫn thuyết trình sân khấu hóa và gợi ý nhạc nền phù hợp.',
  },
  {
    id: 'generate_quiz',
    number: 18,
    label: '18. Tạo câu hỏi ôn tập & trắc nghiệm/tự luận',
    shortLabel: 'Câu hỏi ôn tập',
    category: 'Ôn tập & Thuyết trình',
    promptTemplate:
      'Hãy tạo bộ 5 câu hỏi ôn tập (kèm đáp án gợi ý chi tiết) bao quát kiến thức trọng tâm của tác phẩm.',
    description: 'Tạo bộ câu hỏi kiểm tra kiến thức kèm đáp án giải thích rõ ràng.',
  },
  {
    id: 'generate_flashcards',
    number: 19,
    label: '19. Tạo bộ Flashcard ghi nhớ nhanh',
    shortLabel: 'Tạo Flashcard',
    category: 'Ôn tập & Thuyết trình',
    promptTemplate:
      'Hãy tạo bộ 6 thẻ Flashcard (Mặt trước: Câu hỏi/Khái niệm ngắn; Mặt sau: Kiến thức cốt lõi cần nhớ) cho tác phẩm này.',
    description: 'Tạo thẻ ghi nhớ hai mặt phục vụ ôn thi nhanh và hiệu quả.',
  },
  {
    id: 'suggest_similar',
    number: 20,
    label: '20. Gợi ý tác phẩm tương đồng để liên hệ mở rộng',
    shortLabel: 'Gợi ý tác phẩm',
    category: 'Ôn tập & Thuyết trình',
    promptTemplate:
      'Hãy gợi ý các tác phẩm văn học cùng đề tài, cùng giai đoạn hoặc cùng cảm hứng để học sinh liên hệ mở rộng khi làm bài nghị luận.',
    description: 'Cung cấp dẫn chứng liên hệ mở rộng ăn điểm sáng tạo.',
  },
];

export interface StreamLiteratureAIParams {
  uid?: string;
  conversationId?: string;
  prompt: string;
  capability: LiteratureAICapabilityId;
  activeCard?: LiteratureCard;
  compareCard?: LiteratureCard;
  selectedPassage?: string;
  historyMessages?: AIMessage[];
  signal?: AbortSignal;
  onToken: (delta: string, accumulated: string) => void;
}

export interface StreamLiteratureAIResult {
  text: string;
  model: string;
  source: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Builds a structured scholarly response locally if the server is offline or OPENAI_API_KEY is not yet configured.
 */
export function buildScholarlyFallbackResponse(params: {
  capability: LiteratureAICapabilityId;
  prompt: string;
  activeCard?: LiteratureCard;
  compareCard?: LiteratureCard;
  selectedPassage?: string;
}): string {
  const card = params.activeCard;
  const capDef =
    LITERATURE_AI_CAPABILITIES.find((c) => c.id === params.capability) ||
    LITERATURE_AI_CAPABILITIES[0];

  if (!card) {
    return `### ${capDef.shortLabel}\n\n**Yêu cầu của bạn:** ${params.prompt}\n\nHãy chọn một tác phẩm trong danh mục phía trên để **Literature AI** trích xuất dẫn chứng và phân tích học thuật chi tiết nhất.`;
  }

  const passageBlock = params.selectedPassage
    ? `> **Đoạn trích đang chọn:** *"${params.selectedPassage}"*\n\n`
    : '';

  if (params.capability === 'compare_works' && params.compareCard) {
    const c2 = params.compareCard;
    return `## Đối sánh học thuật: **${card.title}** (${card.author}) & **${c2.title}** (${c2.author})

${passageBlock}### 1. Bảng đối chiếu trực quan

| Tiêu chí so sánh | ${card.title} (${card.author}) | ${c2.title} (${c2.author}) |
| :--- | :--- | :--- |
| **Thể loại & Giai đoạn** | ${card.genre} · ${card.period} | ${c2.genre} · ${c2.period} |
| **Hoàn cảnh sáng tác** | ${card.creationContext} | ${c2.creationContext} |
| **Chủ đề trung tâm** | ${card.theme} | ${c2.theme} |
| **Hình tượng nghệ thuật** | ${card.artisticImagery} | ${c2.artisticImagery} |
| **Bút pháp đặc trưng** | ${card.artisticValue} | ${c2.artisticValue} |

### 2. Điểm gặp gỡ tư tưởng
* Cả hai tác phẩm đều kết tinh chiều sâu nhân bản và vẻ đẹp tâm hồn con người Việt Nam trong những hoàn cảnh thử thách của lịch sử.
* Đều thể hiện tài năng sử dụng ngôn từ điêu luyện, giàu sức gợi hình và nhạc tính của hai cây bút lớn.

### 3. Nét độc đáo riêng biệt
* **${card.title}**: ${card.commentary}
* **${c2.title}**: ${c2.commentary}`;
  }

  if (params.capability === 'generate_flashcards') {
    return `## Bộ Flashcard Ôn Tập Nhanh: **${card.title}** — *${card.author}*

${passageBlock}| Thẻ # | Mặt trước (Câu hỏi / Khái niệm) | Mặt sau (Kiến thức cốt lõi cần nhớ) |
| :--- | :--- | :--- |
| **Flashcard 01** | Tác giả & Hoàn cảnh ra đời của *${card.title}*? | **${card.author}** (${card.period}). ${card.creationContext} |
| **Flashcard 02** | Thể loại và Chủ đề tư tưởng chính? | **Thể loại:** ${card.genre}. **Chủ đề:** ${card.theme} |
| **Flashcard 03** | Giá trị nội dung cốt lõi? | ${card.contentValue} |
| **Flashcard 04** | Hình tượng trung tâm & Nhân vật? | **Nhân vật:** ${card.characters}. **Hình tượng:** ${card.artisticImagery} |
| **Flashcard 05** | Đặc sắc nghệ thuật tiêu biểu? | ${card.artisticValue} |
| **Flashcard 06** | Nhận định lý luận / Đánh giá tổng quát? | ${card.commentary} |`;
  }

  if (params.capability === 'generate_quiz') {
    return `## Bộ Câu Hỏi Ôn Tập & Đọc Hiểu: **${card.title}** (${card.author})

${passageBlock}### Câu 1 (Nhận biết)
**Câu hỏi:** Nêu hoàn cảnh sáng tác và thể loại của tác phẩm *${card.title}* của tác giả ${card.author}.
* **Đáp án gợi ý:** Tác phẩm thuộc thể loại **${card.genre}** (${card.period}). Hoàn cảnh sáng tác: ${card.creationContext}

### Câu 2 (Thông hiểu)
**Câu hỏi:** Chủ đề chính và mạch nội dung cốt lõi của *${card.title}* là gì?
* **Đáp án gợi ý:** ${card.summary} Chủ đề xuyên suốt: ${card.theme}

### Câu 3 (Thông hiểu – Nghệ thuật)
**Câu hỏi:** Phân tích ngắn gọn những nét đặc sắc về nghệ thuật và hình tượng trong tác phẩm.
* **Đáp án gợi ý:** ${card.artisticValue} Hình tượng nổi bật: ${card.artisticImagery}

### Câu 4 (Vận dụng)
**Câu hỏi:** Hình tượng nhân vật / chủ thể trữ tình (${card.characters}) được khắc họa với vẻ đẹp như thế nào?
* **Đáp án gợi ý:** ${card.contentValue}

### Câu 5 (Vận dụng cao)
**Câu hỏi:** Từ nhận định *"${card.commentary}"*, anh/chị hãy rút ra thông điệp nhân sinh sâu sắc nhất của tác phẩm đối với thế hệ trẻ hôm nay.
* **Đáp án gợi ý:** Khẳng định sức sống vượt thời gian của tác phẩm và bài học về nhân cách, tình yêu quê hương đất nước và khát vọng sống cao đẹp.`;
  }

  if (params.capability === 'build_outline') {
    return `## Dàn Ý Nghị Luận Văn Học Chi Tiết: **${card.title}** — *${card.author}*

${passageBlock}### I. MỞ BÀI
1. **Giới thiệu tác giả & tác phẩm:** Giới thiệu vị trí của **${card.author}** trong giai đoạn *${card.period}* và hoàn cảnh ra đời của **${card.title}** (${card.creationContext}).
2. **Nêu vấn đề nghị luận:** Khái quát chủ đề tư tưởng (${card.theme}) và yêu cầu trọng tâm: *${params.prompt}*.

### II. THÂN BÀI
* **Luận điểm 1: Khái quát chung & Mạch vận động của tác phẩm**
  * Thể loại: ${card.genre}.
  * Tóm tắt nội dung cốt lõi: ${card.summary}
* **Luận điểm 2: Phân tích giá trị nội dung & Hình tượng trung tâm**
  * Khắc họa nhân vật / chủ thể trữ tình: ${card.characters}.
  * Chiều sâu tư tưởng: ${card.contentValue}
  * Giải mã hình tượng nghệ thuật: ${card.artisticImagery}
* **Luận điểm 3: Đánh giá đặc sắc nghệ thuật**
  * Bút pháp, ngôn từ, giọng điệu: ${card.artisticValue}
  * Dẫn chứng tiêu biểu: *${card.excerpt}*

### III. KẾT BÀI
1. **Khẳng định giá trị tác phẩm:** ${card.commentary}
2. **Liên hệ mở rộng:** Sức sống lâu bền của tác phẩm trong lòng người đọc nhiều thế hệ.`;
  }

  return `## ${capDef.label}: **${card.title}** — *${card.author}*

${passageBlock}**Trọng tâm phân tích:** ${params.prompt}

### 1. Bối cảnh sáng tác & Vị trí văn học sử
* **Tác giả:** ${card.author} (${card.genre} — *${card.period}*).
* **Hoàn cảnh ra đời:** ${card.creationContext}
* **Chủ đề tư tưởng:** ${card.theme}

### 2. Phân tích chiều sâu Nội dung & Hình tượng
* **Mạch nội dung cốt lõi:** ${card.summary}
* **Giá trị nội dung & Nhân bản:** ${card.contentValue}
* **Hình tượng trung tâm (${card.characters}):** ${card.artisticImagery}

### 3. Thi pháp & Giá trị Nghệ thuật đặc sắc
* **Đặc trưng bút pháp:** ${card.artisticValue}
* **Ghi chú văn bản & Điểm nhấn:** ${card.excerpt}

### 4. Đánh giá tổng hợp & Mở rộng
> ${card.commentary}`;
}

/**
 * Streams response from /api/ai (OpenAI Responses API with SSE streaming)
 * and supports instant cancellation via AbortSignal.
 */
export async function streamLiteratureAI(
  params: StreamLiteratureAIParams
): Promise<StreamLiteratureAIResult> {
  const {
    uid,
    conversationId,
    prompt,
    capability,
    activeCard,
    compareCard,
    selectedPassage,
    historyMessages = [],
    signal,
    onToken,
  } = params;

  const workContext = activeCard
    ? [
        `Tác phẩm: ${activeCard.title}`,
        `Tác giả: ${activeCard.author}`,
        `Thể loại: ${activeCard.genre} (${activeCard.period})`,
        `Hoàn cảnh sáng tác: ${activeCard.creationContext}`,
        `Tóm tắt: ${activeCard.summary}`,
        `Chủ đề: ${activeCard.theme}`,
        `Giá trị nội dung: ${activeCard.contentValue}`,
        `Giá trị nghệ thuật: ${activeCard.artisticValue}`,
        `Nhân vật: ${activeCard.characters}`,
        `Hình tượng nghệ thuật: ${activeCard.artisticImagery}`,
        `Ghi chú trích đoạn: ${activeCard.excerpt}`,
        `Nhận định: ${activeCard.commentary}`,
        compareCard
          ? `Tác phẩm đối sánh: ${compareCard.title} (${compareCard.author}) - Chủ đề: ${compareCard.theme} - Nghệ thuật: ${compareCard.artisticValue}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        uid,
        conversationId,
        prompt,
        capability,
        workTitle: activeCard?.title,
        author: activeCard?.author,
        genre: activeCard?.genre,
        workContext,
        selectedPassage,
        stream: true,
        history: historyMessages.slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream') && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';
      let finalModel = 'gpt-4.1-mini';
      let finalSource = 'OpenAI Responses API';
      let inputTokens = 0;
      let outputTokens = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const line = evt
            .split('\n')
            .find((l) => l.startsWith('data: '));
          if (!line) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'delta' && typeof parsed.delta === 'string') {
              accumulated += parsed.delta;
              onToken(parsed.delta, accumulated);
            } else if (parsed.type === 'done') {
              if (parsed.model) finalModel = parsed.model;
              if (parsed.source) finalSource = parsed.source;
              if (parsed.inputTokens) inputTokens = parsed.inputTokens;
              if (parsed.outputTokens) outputTokens = parsed.outputTokens;
            }
          } catch {
            // ignore partial JSON chunk
          }
        }
      }

      if (accumulated.trim().length > 0) {
        return {
          text: accumulated,
          model: finalModel,
          source: finalSource,
          inputTokens,
          outputTokens,
        };
      }
    } else {
      const json = await response.json();
      if (json && typeof json.text === 'string' && json.text.trim()) {
        onToken(json.text, json.text);
        return {
          text: json.text,
          model: json.model || 'gpt-4.1-mini',
          source: json.source || 'OpenAI Responses API',
          inputTokens: json.inputTokens || 120,
          outputTokens: json.outputTokens || 240,
        };
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
  }

  // Fallback progressive streaming from scholarly engine
  const fallbackFull = buildScholarlyFallbackResponse({
    capability,
    prompt,
    activeCard,
    compareCard,
    selectedPassage,
  });

  const words = fallbackFull.split(/(?=[ \n])/);
  let acc = '';
  const step = Math.max(4, Math.floor(words.length / 28));
  for (let i = 0; i < words.length; i += step) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const chunk = words.slice(i, i + step).join('');
    acc += chunk;
    onToken(chunk, acc);
    await new Promise((r) => setTimeout(r, 18));
  }

  return {
    text: acc,
    model: 'literature-scholar-fallback',
    source: 'Literature AI Scholarly Fallback (Sẵn sàng kết nối OPENAI_API_KEY)',
    inputTokens: Math.ceil(prompt.length / 4),
    outputTokens: Math.ceil(acc.length / 4),
  };
}
