import { LiteratureCard } from '../types/studio';

export interface AIAnalysisOption {
  id: string;
  label: string;
  description: string;
}

export const AI_TASKS: AIAnalysisOption[] = [
  { id: 'author', label: 'Giới thiệu tác giả', description: 'Tiểu sử, sự nghiệp và phong cách nghệ thuật đặc trưng.' },
  { id: 'context', label: 'Phân tích hoàn cảnh sáng tác', description: 'Bối cảnh lịch sử, xuất xứ và ý nghĩa nhan đề.' },
  { id: 'summary', label: 'Tóm tắt tác phẩm', description: 'Tóm tắt mạch cảm xúc (thơ) hoặc cốt truyện (văn xuôi).' },
  { id: 'character', label: 'Phân tích nhân vật', description: 'Ngoại hình, số phận, diễn biến tâm lý và phẩm chất nhân vật.' },
  { id: 'imagery', label: 'Phân tích hình tượng nghệ thuật', description: 'Giải mã các biểu tượng, hình ảnh trung tâm của tác phẩm.' },
  { id: 'stanza', label: 'Phân tích từng khổ thơ / đoạn văn', description: 'Bóc tách chi tiết từng phần theo bố cục chuẩn SGK.' },
  { id: 'rhetoric', label: 'Phân tích biện pháp tu từ', description: 'Ẩn dụ, hoán dụ, đối lập, điệp cấu trúc, phối thanh bằng – trắc.' },
  { id: 'content_art', label: 'Phân tích nội dung và nghệ thuật', description: 'Tổng hợp toàn diện hai phương diện tư tưởng và thi pháp.' },
  { id: 'compare', label: 'So sánh hai tác phẩm', description: 'Chỉ ra điểm tương đồng và khác biệt giữa hai tác phẩm văn học.' },
  { id: 'intro_outro', label: 'Viết mở bài và kết bài', description: 'Gợi ý mở bài trực tiếp/gián tiếp và kết bài nâng cao lý luận.' },
  { id: 'outline', label: 'Xây dựng dàn ý nghị luận văn học', description: 'Dàn ý chi tiết 3 phần: Mở bài – Thân bài – Kết bài.' },
  { id: 'presentation', label: 'Tạo nội dung thuyết trình', description: 'Soạn lời dẫn chuyên nghiệp dành cho buổi thuyết trình trên lớp.' },
  { id: 'quiz', label: 'Tạo câu hỏi kiểm tra kiến thức', description: 'Bộ câu hỏi đọc hiểu và vận dụng kèm gợi ý đáp án.' },
];

export const AI_STYLES: AIAnalysisOption[] = [
  { id: 'concise', label: 'Ngắn gọn, dễ hiểu', description: 'Cô đọng theo gạch đầu dòng, dễ nhớ nhanh.' },
  { id: 'deep', label: 'Phân tích chuyên sâu', description: 'Lập luận sắc bén, dẫn chứng lý luận văn học.' },
  { id: 'highschool', label: 'Văn phong học sinh THPT', description: 'Chuẩn cấu trúc bài thi Tốt nghiệp THPT & Học sinh giỏi.' },
  { id: 'academic', label: 'Văn phong học thuật', description: 'Ngôn ngữ nghiên cứu phê bình văn học chuẩn mực.' },
  { id: 'slides', label: 'Dàn ý thuyết trình', description: 'Chia theo từng bước trình chiếu trực quan.' },
  { id: 'spoken', label: 'Nội dung đọc thành lời', description: 'Câu văn giàu nhịp điệu, tối ưu cho công cụ đọc TTS.' },
];

/**
 * Generates structured scholarly Vietnamese literary analysis locally when cloud API is offline or not configured.
 * Ensures the application always works 100% with real scholarly data from the Literature Library.
 */
export function buildLocalScholarlyAnalysis(
  card: LiteratureCard,
  taskId: string,
  styleLabel: string,
  compareCard?: LiteratureCard,
  customPrompt?: string
): string {
  const header = `HỒ SƠ PHÂN TÍCH HỌC THUẬT: ${card.title.toUpperCase()} (${card.author})\nPhong cách trình bày: ${styleLabel}\n────────────────────────────────────────────────────\n\n`;

  if (taskId === 'author') {
    return (
      header +
      `1. VỊ TRÍ VĂN HỌC & TIỂU SỬ TÁC GIẢ\n` +
      `• Tác giả: ${card.author}\n` +
      `• Giai đoạn sáng tác tiêu biểu: ${card.period}\n` +
      `• Thể loại sở trường: ${card.genre}\n\n` +
      `2. ĐẶC ĐIỂM PHONG CÁCH NGHỆ THUẬT\n` +
      `• Qua tác phẩm "${card.title}", ${card.author} khẳng định dấu ấn sáng tạo riêng biệt: ${card.artisticValue}\n` +
      `• Tư tưởng nhân sinh và cảm hứng chủ đạo: ${card.theme}\n\n` +
      `3. ĐÁNH GIÁ CHUNG\n` +
      `• ${card.commentary}`
    );
  }

  if (taskId === 'context') {
    return (
      header +
      `1. HOÀN CẢNH RA ĐỜI & XUẤT XỨ\n` +
      `• ${card.creationContext}\n\n` +
      `2. BỐI CẢNH LỊCH SỬ – VĂN HÓA\n` +
      `• Tác phẩm thuộc giai đoạn: ${card.period}.\n` +
      `• Bối cảnh thời đại đã hun đúc nên mạch nguồn cảm xúc và chủ đề xuyên suốt của tác phẩm: ${card.theme}\n\n` +
      `3. Ý NGHĨA ĐỊNH HƯỚNG TIẾP NHẬN\n` +
      `• Việc nắm vững hoàn cảnh sáng tác giúp người đọc lý giải sâu sắc vì sao tác giả lựa chọn thể loại "${card.genre}" và hệ thống hình tượng "${card.artisticImagery}".`
    );
  }

  if (taskId === 'summary') {
    return (
      header +
      `1. TÓM TẮT MẠCH NỘI DUNG CHÍNH\n` +
      `${card.summary}\n\n` +
      `2. CHỦ ĐỀ TRỌNG TÂM\n` +
      `${card.theme}\n\n` +
      `3. HỆ THỐNG NHÂN VẬT / HÌNH TƯỢNG TRUNG TÂM\n` +
      `• Nhân vật / Chủ thể trữ tình: ${card.characters}\n` +
      `• Hình tượng nghệ thuật tiêu biểu: ${card.artisticImagery}`
    );
  }

  if (taskId === 'character') {
    return (
      header +
      `1. HỆ THỐNG NHÂN VẬT / CHỦ THỂ TRỮ TÌNH\n` +
      `• ${card.characters}\n\n` +
      `2. PHÂN TÍCH CHIỀU SÂU TÂM LÝ & PHẨM CHẤT\n` +
      `• Đặt trong hoàn cảnh: ${card.summary}\n` +
      `• Giá trị tư tưởng được kết tinh qua nhân vật: ${card.contentValue}\n\n` +
      `3. NGHỆ THUẬT XÂY DỰNG NHÂN VẬT\n` +
      `• ${card.artisticValue}\n` +
      `• Chi tiết và hình tượng gắn liền với nhân vật: ${card.artisticImagery}`
    );
  }

  if (taskId === 'imagery' || taskId === 'rhetoric' || taskId === 'stanza') {
    return (
      header +
      `1. HÌNH TƯỢNG NGHỆ THUẬT TRUNG TÂM\n` +
      `• ${card.artisticImagery}\n\n` +
      `2. PHÂN TÍCH THI PHÁP & BIỆN PHÁP NGHỆ THUẬT\n` +
      `• Thể loại: ${card.genre}\n` +
      `• Đặc sắc nghệ thuật & Biện pháp tu từ: ${card.artisticValue}\n\n` +
      `3. SỰ THỐNG NHẤT GIỮA HÌNH THỨC VÀ NỘI DUNG\n` +
      `• Các thủ pháp nghệ thuật đã làm nổi bật giá trị nội dung: ${card.contentValue}\n` +
      `• Ghi chú cấu trúc văn bản: ${card.excerpt}`
    );
  }

  if (taskId === 'compare') {
    const second = compareCard || card;
    return (
      header +
      `SO SÁNH ĐỐI CHIẾU: "${card.title}" (${card.author}) & "${second.title}" (${second.author})\n\n` +
      `1. ĐIỂM TƯƠNG ĐỒNG\n` +
      `• Cả hai tác phẩm đều là những kết tinh xuất sắc của văn học Việt Nam hiện đại, giàu giá trị nhân văn và tinh thần dân tộc.\n` +
      `• Cùng thể hiện sự tìm tòi sáng tạo về ngôn từ, giọng điệu và xây dựng hình tượng nghệ thuật giàu sức gợi.\n\n` +
      `2. ĐIỂM KHÁC BIỆT ĐẶC SẮC\n` +
      `• Về "${card.title}" (${card.author} – ${card.period}):\n` +
      `  - Thể loại: ${card.genre}\n` +
      `  - Chủ đề: ${card.theme}\n` +
      `  - Nghệ thuật: ${card.artisticValue}\n\n` +
      `• Về "${second.title}" (${second.author} – ${second.period}):\n` +
      `  - Thể loại: ${second.genre}\n` +
      `  - Chủ đề: ${second.theme}\n` +
      `  - Nghệ thuật: ${second.artisticValue}\n\n` +
      `3. KẾT LUẬN ĐỐI CHIẾU\n` +
      `• Sự gặp gỡ và khác biệt giữa hai tác phẩm khẳng định sự phong phú của diện mạo văn học dân tộc qua từng thời kỳ lịch sử.`
    );
  }

  if (taskId === 'intro_outro') {
    return (
      header +
      `1. MỞ BÀI TRỰC TIẾP (CHUẨN MỰC)\n` +
      `Trong dòng chảy của ${card.period.toLowerCase()}, ${card.author} là một gương mặt tiêu biểu với phong cách nghệ thuật độc đáo. Tác phẩm "${card.title}" (sáng tác trong hoàn cảnh: ${card.creationContext}) đã để lại dấu ấn sâu đậm trong lòng người đọc nhờ sự kết tinh giữa vẻ đẹp tư tưởng (${card.theme.toLowerCase()}) và tài năng nghệ thuật bậc thầy.\n\n` +
      `2. MỞ BÀI GIÁN TIẾP (LÝ LUẬN VĂN HỌC)\n` +
      `Văn học chân chính luôn bắt nguồn từ cuộc đời và hướng tới con người. Mỗi tác phẩm lớn là một khám phá sâu sắc về hiện thực và tâm hồn dân tộc. Đến với "${card.title}" của ${card.author}, người đọc không chỉ bắt gặp bức tranh sinh động về ${card.artisticImagery.toLowerCase()} mà còn cảm nhận trọn vẹn thông điệp: ${card.theme}\n\n` +
      `3. KẾT BÀI NÂNG CAO\n` +
      `Khép lại trang văn "${card.title}", dư âm về ${card.characters.toLowerCase()} cùng nghệ thuật ${card.artisticValue.toLowerCase()} vẫn ngân vang mãi. ${card.commentary} Thời gian có thể trôi qua, nhưng giá trị tư tưởng và thẩm mỹ của tác phẩm vẫn giữ nguyên sức sống bền bỉ trong nền văn học Việt Nam.`
    );
  }

  if (taskId === 'outline') {
    return (
      header +
      `DÀN Ý NGHỊ LUẬN VĂN HỌC CHI TIẾT: "${card.title}" – ${card.author}\n\n` +
      `I. MỞ BÀI\n` +
      `• Giới thiệu tác giả ${card.author} và vị trí trong giai đoạn ${card.period}.\n` +
      `• Giới thiệu tác phẩm "${card.title}" (${card.genre}) và hoàn cảnh ra đời: ${card.creationContext}\n` +
      `• Nêu luận đề trọng tâm: ${card.theme}\n\n` +
      `II. THÂN BÀI\n` +
      `1. Khái quát chung về tác phẩm:\n` +
      `   - Tóm tắt mạch nội dung: ${card.summary}\n` +
      `2. Phân tích các luận điểm nội dung trọng tâm:\n` +
      `   - Luận điểm 1 (Nhân vật / Chủ thể trữ tình): ${card.characters}\n` +
      `   - Luận điểm 2 (Hình tượng nghệ thuật trung tâm): ${card.artisticImagery}\n` +
      `   - Luận điểm 3 (Giá trị tư tưởng & nhân sinh): ${card.contentValue}\n` +
      `3. Đánh giá đặc sắc nghệ thuật:\n` +
      `   - ${card.artisticValue}\n\n` +
      `III. KẾT BÀI\n` +
      `• Khẳng định lại giá trị toàn diện của tác phẩm: ${card.commentary}\n` +
      `• Bài học nhận thức và liên hệ thực tiễn của thế hệ trẻ hôm nay.`
    );
  }

  if (taskId === 'presentation' || styleLabel === 'Nội dung đọc thành lời') {
    return (
      `Kính chào thầy cô và các bạn học sinh.\n\n` +
      `Hôm nay, chúng ta cùng đến với tác phẩm "${card.title}" của tác giả ${card.author}, một dấu ấn tiêu biểu của ${card.period}.\n\n` +
      `Về hoàn cảnh sáng tác: ${card.creationContext}\n\n` +
      `Nội dung trọng tâm của tác phẩm xoay quanh: ${card.summary}\n\n` +
      `Điểm sáng tạo nổi bật nhất của "${card.title}" là cách xây dựng hình tượng: ${card.artisticImagery}. Qua đó, tác giả truyền tải chủ đề sâu sắc: ${card.theme}\n\n` +
      `Về phương diện nghệ thuật, tác phẩm chinh phục người đọc nhờ: ${card.artisticValue}\n\n` +
      `Tóm lại, ${card.commentary} Cảm ơn thầy cô và các bạn đã lắng nghe!`
    );
  }

  if (taskId === 'quiz') {
    return (
      header +
      `BỘ CÂU HỎI ÔN TẬP & KIỂM TRA KIẾN THỨC: "${card.title}"\n\n` +
      `Câu 1 (Nhận biết): Nêu hoàn cảnh sáng tác và thể loại của tác phẩm "${card.title}" (${card.author}).\n` +
      `→ Gợi ý đáp án: Thể loại ${card.genre}. ${card.creationContext}\n\n` +
      `Câu 2 (Thông hiểu): Phân tích ý nghĩa của hệ thống hình tượng nghệ thuật trung tâm trong tác phẩm.\n` +
      `→ Gợi ý đáp án: Hình tượng trung tâm gồm: ${card.artisticImagery}. Các hình tượng này góp phần thể hiện chủ đề: ${card.theme}\n\n` +
      `Câu 3 (Vận dụng): Đánh giá những nét đặc sắc về nghệ thuật của ${card.author} trong "${card.title}".\n` +
      `→ Gợi ý đáp án: ${card.artisticValue}\n\n` +
      `Câu 4 (Vận dụng cao): Từ giá trị nội dung của "${card.title}" (${card.contentValue}), anh/chị hãy rút ra thông điệp ý nghĩa nhất đối với thế hệ trẻ ngày nay.`
    );
  }

  // Default: content_art or custom
  return (
    header +
    (customPrompt ? `Yêu cầu bổ sung: ${customPrompt}\n\n` : '') +
    `1. HOÀN CẢNH SÁNG TÁC & THỂ LOẠI\n` +
    `• Thể loại: ${card.genre} (${card.period})\n` +
    `• Hoàn cảnh ra đời: ${card.creationContext}\n\n` +
    `2. PHÂN TÍCH GIÁ TRỊ NỘI DUNG\n` +
    `• Mạch nội dung chính: ${card.summary}\n` +
    `• Chủ đề tư tưởng: ${card.theme}\n` +
    `• Giá trị hiện thực & nhân đạo: ${card.contentValue}\n` +
    `• Nhân vật & Hình tượng: ${card.characters} — ${card.artisticImagery}\n\n` +
    `3. PHÂN TÍCH GIÁ TRỊ NGHỆ THUẬT\n` +
    `• ${card.artisticValue}\n\n` +
    `4. NHẬN ĐỊNH TỔNG KẾT\n` +
    `• ${card.commentary}`
  );
}
