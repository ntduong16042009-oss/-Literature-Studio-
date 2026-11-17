import {
  LiteratureCard,
  LiteratureCategory,
  Playlist,
  PresentationScript,
  StudioSettings,
  Track,
  VideoItem,
} from '../types/studio';

export const HERO_BACKDROP_IMG = '/src/assets/images/studio_hero_backdrop_1794839370845.jpg';
export const COVER_PIANO_IMG = '/src/assets/images/cover_piano_nocturne_1794839371707.jpg';
export const COVER_FLUTE_IMG = '/src/assets/images/cover_bamboo_flute_1794839372705.jpg';

export const DEFAULT_MUSIC_CATEGORIES: string[] = [
  'Nhạc nền thuyết trình',
  'Nhạc không lời',
  'Piano',
  'Sáo trúc',
  'Nhạc cổ điển',
  'Nhạc cảm xúc',
  'Nhạc theo chủ đề tác phẩm',
  'Nhạc khác',
];

export const LITERATURE_CATEGORIES: LiteratureCategory[] = [
  'Tác giả',
  'Hoàn cảnh sáng tác',
  'Tóm tắt tác phẩm',
  'Phân tích nhân vật',
  'Phân tích hình tượng',
  'Phân tích nghệ thuật',
  'Văn bản và thơ',
  'Nhận định văn học',
  'Tài liệu thuyết trình',
];

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'track-sample-1',
    title: 'Đêm Sông Đà – Độc Tấu Piano Trữ Tình',
    artist: 'Literature Studio Acoustic Ensemble',
    category: 'Piano',
    duration: 16,
    size: 705644,
    addedAt: '2026-09-01T08:00:00.000Z',
    coverUrl: COVER_PIANO_IMG,
    sourceType: 'sample-synth',
    synthPreset: 'piano-song-da',
  },
  {
    id: 'track-sample-2',
    title: 'Trăng Tả Khuông – Sáo Trúc Tây Bắc',
    artist: 'Literature Studio Acoustic Ensemble',
    category: 'Sáo trúc',
    duration: 18,
    size: 793844,
    addedAt: '2026-09-02T09:30:00.000Z',
    coverUrl: COVER_FLUTE_IMG,
    sourceType: 'sample-synth',
    synthPreset: 'flute-tay-bac',
  },
  {
    id: 'track-sample-3',
    title: 'Khúc Giao Mùa – Hoà Tấu Dây Cổ Điển',
    artist: 'Literature Studio Chamber Orchestra',
    category: 'Nhạc cổ điển',
    duration: 16,
    size: 705644,
    addedAt: '2026-09-03T10:15:00.000Z',
    coverUrl: COVER_PIANO_IMG,
    sourceType: 'sample-synth',
    synthPreset: 'strings-mua-thu',
  },
  {
    id: 'track-sample-4',
    title: 'Hương Rừng Tây Bắc – Nhạc Nền Thuyết Trình',
    artist: 'Literature Studio Soundscape',
    category: 'Nhạc nền thuyết trình',
    duration: 20,
    size: 882044,
    addedAt: '2026-09-04T14:20:00.000Z',
    coverUrl: COVER_FLUTE_IMG,
    sourceType: 'sample-synth',
    synthPreset: 'ambient-thuyet-trinh',
  },
];

export const INITIAL_VIDEOS: VideoItem[] = [];

export const INITIAL_LITERATURE_CARDS: LiteratureCard[] = [
  {
    id: 'lit-tay-tien',
    title: 'Tây Tiến',
    author: 'Quang Dũng',
    genre: 'Thơ thất ngôn hiện đại',
    period: 'Văn học kháng chiến chống Pháp (1945–1954)',
    creationContext:
      'Sáng tác năm 1948 tại Phù Lưu Chanh (Hà Đông) khi Quang Dũng rời đoàn quân Tây Tiến chuyển sang đơn vị khác. Ban đầu có tên là Nhớ Tây Tiến, in trong tập Mây đầu ô (1986).',
    summary:
      'Bài thơ khắc họa nỗi nhớ da diết của người lính về thiên nhiên Tây Bắc hùng vĩ, dữ dội mà thơ mộng, đêm liên hoan doanh trại ấm tình quân dân và bức chân dung người lính Tây Tiến hào hoa, bi tráng.',
    theme:
      'Vẻ đẹp lãng mạn, hào hùng và tinh thần bi tráng của đoàn quân Tây Tiến trong những năm đầu kháng chiến.',
    contentValue:
      'Tái hiện sinh động bức tranh thiên nhiên miền Tây và tượng đài bất tử về người chiến sĩ trí thức Hà Nội dấn thân vì Tổ quốc.',
    artisticValue:
      'Cảm hứng lãng mạn kết hợp bút pháp bi tráng; phối thanh bằng – trắc giàu nhạc tính; sử dụng từ Hán Việt trang trọng và hình ảnh đối lập độc đáo.',
    characters: 'Hình tượng tập thể những người lính Tây Tiến trẻ trung, lãng mạn, kiên cường.',
    artisticImagery:
      'Con đường hành quân sương lấp, đêm lửa trại khèn man điệu, tượng đài người lính vệ quốc và dòng sông Mã lịch sử.',
    excerpt:
      '[Ghi chú học liệu]: Tác phẩm gồm 4 đoạn theo mạch cảm xúc nỗi nhớ Tây Tiến (14 câu đầu: chặng đường hành quân; 8 câu tiếp: đêm liên hoan và cảnh sông nước; 8 câu tiếp: chân dung người lính; 4 câu cuối: lời thề gắn bó). Người dùng có thể dán trích đoạn cần đọc từ SGK Ngữ văn vào đây để sử dụng TTS.',
    commentary:
      'Một kiệt tác của thơ ca kháng chiến chống Pháp, kết tinh hồn thơ phóng khoáng, tài hoa của Quang Dũng.',
    category: 'Phân tích hình tượng',
    tags: ['Quang Dũng', 'Thơ kháng chiến', 'Bi tráng', 'Tây Bắc'],
    pinned: true,
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'lit-dat-nuoc',
    title: 'Đất Nước (trích Mặt đường khát vọng)',
    author: 'Nguyễn Khoa Điềm',
    genre: 'Trường ca – Thơ tự do',
    period: 'Văn học kháng chiến chống Mỹ (1954–1975)',
    creationContext:
      'Hoàn thành tại chiến khu Trị – Thiên năm 1971, trích từ chương V của bản trường ca Mặt đường khát vọng, hướng tới tuổi trẻ đô thị miền Nam.',
    summary:
      'Cảm nhận mới mẻ về nguồn gốc Đất Nước từ những điều bình dị, gần gũi trong đời sống văn hóa dân gian và khẳng định tư tưởng cốt lõi: Đất Nước của Nhân dân.',
    theme:
      'Tư tưởng Đất Nước của Nhân dân, do Nhân dân làm ra và bảo vệ qua hàng ngàn năm lịch sử.',
    contentValue:
      'Đánh thức ý thức trách nhiệm của thế hệ trẻ đối với vận mệnh dân tộc bằng giọng thơ tâm tình, triết luận sâu sắc.',
    artisticValue:
      'Thể thơ tự do phóng khoáng, vận dụng sáng tạo chất liệu văn hóa dân gian (ca dao, tục ngữ, truyền thuyết, phong tục) và giọng điệu trữ tình – chính luận.',
    characters:
      'Chủ thể trữ tình "anh và em" trong cuộc trò chuyện tâm tình về cội nguồn dân tộc.',
    artisticImagery:
      'Miếng trầu, cây tre, hạt gạo, những danh thắng gắn liền với hóa thân của nhân dân vô danh.',
    excerpt:
      '[Ghi chú học liệu]: Đoạn trích gồm 2 phần: Phần 1 lý giải cội nguồn và định nghĩa Đất Nước trên các bình diện văn hóa – lịch sử – địa lý; Phần 2 tập trung làm sáng tỏ tư tưởng Đất Nước của Nhân dân. Bạn có thể bổ sung trích đoạn văn bản phục vụ buổi thuyết trình tại mục chỉnh sửa.',
    commentary:
      'Đóng góp đặc sắc về tư tưởng "Đất Nước của Nhân dân" trong dòng thơ trữ tình chính luận hiện đại.',
    category: 'Phân tích nghệ thuật',
    tags: ['Nguyễn Khoa Điềm', 'Trường ca', 'Văn hóa dân gian', 'Trữ tình chính luận'],
    pinned: true,
    updatedAt: '2026-10-02T08:00:00.000Z',
  },
  {
    id: 'lit-viet-bac',
    title: 'Việt Bắc',
    author: 'Tố Hữu',
    genre: 'Thơ lục bát truyền thống',
    period: 'Văn học kháng chiến chống Pháp (1945–1954)',
    creationContext:
      'Sáng tác tháng 10/1954 khi Trung ương Đảng và Chính phủ rời chiến khu Việt Bắc trở về Hà Nội sau chiến thắng Điện Biên Phủ và Hiệp định Giơ-ne-vơ.',
    summary:
      'Khúc hát ân tình thủy chung giữa người cán bộ kháng chiến về xuôi và đồng bào chiến khu Việt Bắc, tái hiện thiên nhiên bốn mùa tươi đẹp cùng những chiến công hào hùng.',
    theme:
      'Nghĩa tình cách mạng thủy chung, đạo lý uống nước nhớ nguồn của dân tộc Việt Nam.',
    contentValue:
      'Bản tổng kết bằng thơ giàu cảm xúc về cuộc kháng chiến 15 năm gian khổ mà nghĩa tình ở căn cứ địa cách mạng.',
    artisticValue:
      'Thể thơ lục bát nhuần nhị, kết cấu đối đáp "mình – ta" như ca dao giao duyên, ngôn ngữ giàu tính dân tộc và nhạc điệu ngân vang.',
    characters: 'Người ở lại chiến khu và người cán bộ kháng chiến ra đi trong buổi chia tay lịch sử.',
    artisticImagery:
      'Bức tranh tứ bình bốn mùa Việt Bắc, hình ảnh những ngả đường ra trận và ngọn lửa hồng sưởi ấm tình quân dân.',
    excerpt:
      '[Ghi chú học liệu]: Đoạn trích mở đầu bằng khung cảnh chia tay lưu luyến (20 câu đầu), tiếp nối bằng những kỷ niệm thiên nhiên – con người Việt Bắc và bức tranh kháng chiến hào hùng. Nhập đoạn thơ cụ thể để đọc mẫu bằng chế độ Đọc thơ.',
    commentary:
      'Đỉnh cao của thơ Tố Hữu và là thành tựu xuất sắc của thơ ca kháng chiến chống Pháp.',
    category: 'Văn bản và thơ',
    tags: ['Tố Hữu', 'Thơ lục bát', 'Khuynh hướng sử thi', 'Tứ bình'],
    pinned: false,
    updatedAt: '2026-10-03T08:00:00.000Z',
  },
  {
    id: 'lit-song',
    title: 'Sóng',
    author: 'Xuân Quỳnh',
    genre: 'Thơ ngũ ngôn hiện đại',
    period: 'Văn học giai đoạn 1954–1975',
    creationContext:
      'Sáng tác ngày 29/12/1967 trong chuyến thực tế tại vùng biển Diêm Điền (Thái Bình), in trong tập Hoa dọc chiến hào (1968).',
    summary:
      'Mượn hình tượng con sóng biển khơi để giãi bày những cung bậc tâm trạng, nỗi nhớ, lòng thủy chung và khát vọng tình yêu vĩnh cửu của người phụ nữ.',
    theme:
      'Vẻ đẹp tâm hồn người phụ nữ trong tình yêu: vừa truyền thống đằm thắm, vừa hiện đại chủ động.',
    contentValue:
      'Thể hiện khát vọng tình yêu chân thành, mãnh liệt và ước muốn hòa nhập tình yêu cá nhân vào biển lớn cuộc đời.',
    artisticValue:
      'Thể thơ 5 chữ giàu nhịp điệu mô phỏng nhịp sóng vỗ; kết cấu song hành giữa hai hình tượng "Sóng" và "Em".',
    characters: 'Nhân vật trữ tình "Em" hóa thân và soi chiếu vào hình tượng "Sóng".',
    artisticImagery:
      'Con sóng đại dương với các đối cực dữ dội – dịu êm, ồn ào – lặng lẽ, hướng về bờ xa.',
    excerpt:
      '[Ghi chú học liệu]: Bài thơ gồm 9 khổ thơ 5 chữ, tạo âm hưởng nhịp nhàng như nhịp sóng biển và nhịp đập trái tim đang yêu. Hãy thêm các khổ thơ cần trình chiếu vào kịch bản thuyết trình.',
    commentary:
      'Bài thơ tình tiêu biểu nhất của Xuân Quỳnh, kết tinh vẻ đẹp nữ tính, hồn nhiên mà sâu sắc.',
    category: 'Phân tích hình tượng',
    tags: ['Xuân Quỳnh', 'Thơ tình yêu', 'Thơ 5 chữ', 'Hình tượng sóng'],
    pinned: false,
    updatedAt: '2026-10-04T08:00:00.000Z',
  },
  {
    id: 'lit-vo-chong-a-phu',
    title: 'Vợ chồng A Phủ',
    author: 'Tô Hoài',
    genre: 'Truyện ngắn hiện đại',
    period: 'Văn học kháng chiến chống Pháp (1945–1954)',
    creationContext:
      'Sáng tác năm 1952 sau chuyến đi thực tế 8 tháng cùng bộ đội vào giải phóng Tây Bắc, in trong tập Truyện Tây Bắc (Giải Nhất Hội Văn nghệ Việt Nam 1954–1955).',
    summary:
      'Số phận bi thảm của Mị và A Phủ dưới ách thống trị thần quyền – cường quyền của nhà thống lý Pá Tra ở Hồng Ngài, cùng hành trình thức tỉnh, tự giải phóng tìm đến cách mạng ở Phiềng Sa.',
    theme:
      'Sức sống tiềm tàng mãnh liệt và khát vọng tự do của người lao động miền núi Tây Bắc.',
    contentValue:
      'Giá trị hiện thực tố cáo tội ác phong kiến miền núi và giá trị nhân đạo sâu sắc khi phát hiện vẻ đẹp tâm hồn, sức phản kháng của con người bị áp bức.',
    artisticValue:
      'Nghệ thuật miêu tả tâm lý nhân vật bậc thầy, đậm đà phong vị dân tộc miền núi, ngôn ngữ trần thuật sinh động.',
    characters: 'Mị (cô gái Mèo giàu sức sống tiềm tàng), A Phủ (chàng trai gan góc, mạnh mẽ), thống lý Pá Tra, A Sử.',
    artisticImagery:
      'Tiếng sáo gọi bạn tình đêm xuân, nắm lá ngón, ngọn lửa sưởi đêm đông và giọt nước mắt của A Phủ.',
    excerpt:
      '[Ghi chú học liệu]: Trọng tâm phân tích thường gồm hai diễn biến tâm lý lớn của nhân vật Mị: đêm tình mùa xuân ở Hồng Ngài và đêm đông cởi trói cứu A Phủ. Có thể dùng chế độ Đọc văn xuôi để thuyết minh phân tích nhân vật.',
    commentary:
      'Tác phẩm tiêu biểu cho phong cách văn xuôi Tô Hoài: giàu chất thơ, am hiểu sâu sắc phong tục Tây Bắc.',
    category: 'Phân tích nhân vật',
    tags: ['Tô Hoài', 'Truyện Tây Bắc', 'Giá trị nhân đạo', 'Nhân vật Mị'],
    pinned: true,
    updatedAt: '2026-10-05T08:00:00.000Z',
  },
  {
    id: 'lit-vo-nhat',
    title: 'Vợ nhặt',
    author: 'Kim Lân',
    genre: 'Truyện ngắn hiện đại',
    period: 'Văn học giai đoạn 1945–1975',
    creationContext:
      'Tiền thân là tiểu thuyết Xóm ngụ cư viết ngay sau Cách mạng tháng Tám nhưng dang dở; năm 1954 Kim Lân viết lại thành truyện ngắn Vợ nhặt, in trong tập Con chó xấu xí (1962).',
    summary:
      'Trong nạn đói khủng khiếp năm Ất Dậu 1945, anh cu Tràng – dân ngụ cư nghèo khổ – bất ngờ "nhặt" được vợ chỉ sau vài câu nói đùa và bốn bát bánh đúc, thắp lên niềm hy vọng sống cho cả gia đình.',
    theme:
      'Dù đứng bên bờ vực của cái chết, con người lao động vẫn khao khát hạnh phúc gia đình, cưu mang đùm bọc nhau và hướng về tương lai tươi sáng.',
    contentValue:
      'Phản ánh chân thực thảm cảnh nạn đói 1945 và ca ngợi vẻ đẹp tình người, niềm tin bất diệt vào sự sống.',
    artisticValue:
      'Xây dựng tình huống truyện độc đáo (vừa éo le vừa cảm động), đối thoại giản dị, miêu tả tâm lý tinh tế của ba nhân vật Tràng – người vợ nhặt – bà cụ Tứ.',
    characters: 'Tràng, Người vợ nhặt, Bà cụ Tứ.',
    artisticImagery:
      'Bữa cơm ngày đói với chè khoán chát xịt, tiếng trống thúc thuế, đàn quạ đen và hình ảnh đoàn người phá kho thóc kèm lá cờ đỏ cuối truyện.',
    excerpt:
      '[Ghi chú học liệu]: Tình huống "nhặt vợ" giữa nạn đói là hạt nhân nghệ thuật làm nổi bật diễn biến tâm lý của Tràng, người đàn bà không tên và tấm lòng người mẹ nghèo bà cụ Tứ.',
    commentary:
      'Một bài ca nhân đạo cảm động về tình người và ánh sáng hy vọng giữa bóng tối nạn đói năm 1945.',
    category: 'Tóm tắt tác phẩm',
    tags: ['Kim Lân', 'Tình huống truyện', 'Nạn đói 1945', 'Nhân đạo'],
    pinned: false,
    updatedAt: '2026-10-06T08:00:00.000Z',
  },
  {
    id: 'lit-chi-pheo',
    title: 'Chí Phèo',
    author: 'Nam Cao',
    genre: 'Truyện ngắn hiện thực phê phán',
    period: 'Văn học hiện thực phê phán (1930–1945)',
    creationContext:
      'Sáng tác tháng 2/1941 dựa trên những nguyên mẫu có thật ở làng Đại Hoàng (Hà Nam). Tên gọi qua các lần xuất bản: Cái lò gạch cũ, Đôi lứa xứng đôi, và Chí Phèo (1946).',
    summary:
      'Bi kịch của người nông dân hiền lành bị xã hội thực dân nửa phong kiến và nhà tù lưu manh hóa thành con quỷ dữ của làng Vũ Đại, được bát cháo hành của Thị Nở thức tỉnh nhân tính nhưng cuối cùng bị cự tuyệt quyền làm người.',
    theme:
      'Bi kịch bị tha hóa và bi kịch bị cự tuyệt quyền làm người của người nông dân nghèo trước Cách mạng tháng Tám.',
    contentValue:
      'Đòn đanh thép tố cáo chế độ cường hào ác bá làng Vũ Đại và khẳng định bản chất lương thiện bất diệt trong tâm hồn người lao động.',
    artisticValue:
      'Kết cấu vòng tròn đầu cuối tương ứng (hình ảnh cái lò gạch cũ), nghệ thuật điển hình hóa nhân vật, ngôn ngữ nửa trực tiếp đa thanh.',
    characters: 'Chí Phèo, Bá Kiến, Thị Nở.',
    artisticImagery:
      'Tiếng chửi mở đầu truyện, bát cháo hành thơm mùi hành hoa của Thị Nở, và hình ảnh cái lò gạch bỏ không.',
    excerpt:
      '[Ghi chú học liệu]: Tác phẩm mở đầu bằng tiếng chửi vật vã của Chí Phèo giữa làng Vũ Đại và khép lại bằng bi kịch đòi lương thiện tại nhà Bá Kiến. Phù hợp để tạo dàn ý nghị luận văn học chuyên sâu.',
    commentary:
      'Kiệt tác đỉnh cao của dòng văn học hiện thực phê phán Việt Nam giai đoạn 1930–1945.',
    category: 'Nhận định văn học',
    tags: ['Nam Cao', 'Hiện thực phê phán', 'Bi kịch tha hóa', 'Làng Vũ Đại'],
    pinned: true,
    updatedAt: '2026-10-07T08:00:00.000Z',
  },
  {
    id: 'lit-song-huong',
    title: 'Ai đã đặt tên cho dòng sông?',
    author: 'Hoàng Phủ Ngọc Tường',
    genre: 'Bút ký văn học',
    period: 'Văn học Việt Nam sau 1975',
    creationContext:
      'Viết tại Huế ngày 4/1/1981, in trong tập sách cùng tên xuất bản năm 1986.',
    summary:
      'Hành trình thủy trình đầy chất thơ của dòng sông Hương từ thượng nguồn Trường Sơn hùng vĩ, qua vùng ngoại vi, về giữa lòng thành phố Huế mộng mơ và dòng chảy lịch sử – văn hóa – thi ca của cố đô.',
    theme:
      'Ngợi ca vẻ đẹp thiên nhiên, bề dày văn hóa và linh hồn lịch sử của xứ Huế qua hình tượng dòng sông Hương.',
    contentValue:
      'Bộc lộ tình yêu quê hương xứ sở đằm thắm cùng vốn hiểu biết uyên bác về địa lý, lịch sử, âm nhạc và văn chương Huế.',
    artisticValue:
      'Sự kết hợp nhuần nhuyễn giữa chất trí tuệ và chất trữ tình, liên tưởng bất ngờ, ngôn từ phong phú giàu hình ảnh và nhạc điệu.',
    characters: 'Hình tượng dòng sông Hương được nhân hóa như người con gái Digan phóng khoáng và người tình dịu dàng, chung thủy của kinh thành Huế.',
    artisticImagery:
      'Bản trường ca của rừng già, điệu slow tình cảm dành riêng cho Huế, dòng sông sử thi và dòng sông thi ca.',
    excerpt:
      '[Ghi chú học liệu]: Bút ký khám phá sông Hương từ góc nhìn địa lý (thượng nguồn – ngoại vi – trong lòng thành phố Huế – trước khi từ biệt) đến góc nhìn lịch sử và thi ca.',
    commentary:
      'Một trong những thiên bút ký xuất sắc nhất của văn học Việt Nam hiện đại, thấm đẫm phong vị văn hóa Huế.',
    category: 'Tài liệu thuyết trình',
    tags: ['Hoàng Phủ Ngọc Tường', 'Bút ký', 'Sông Hương', 'Văn hóa Huế'],
    pinned: false,
    updatedAt: '2026-10-08T08:00:00.000Z',
  },
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-tay-tien',
    name: 'Playlist 1: Tây Tiến – Hào Hoa & Bi Tráng',
    description: 'Nhạc nền sáo trúc Tây Bắc và piano trầm lắng dùng cho buổi thuyết trình bài thơ Tây Tiến.',
    trackIds: ['track-sample-2', 'track-sample-1'],
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'pl-dat-nuoc',
    name: 'Playlist 2: Đất Nước – Cội Nguồn Văn Hóa',
    description: 'Âm hưởng thính phòng và nhạc nền êm dịu cho chuyên đề Đất Nước – Nguyễn Khoa Điềm.',
    trackIds: ['track-sample-4', 'track-sample-3'],
    createdAt: '2026-10-02T10:00:00.000Z',
  },
  {
    id: 'pl-khang-chien',
    name: 'Playlist 3: Văn Học Kháng Chiến',
    description: 'Tổng hợp nhạc nền phục vụ các bài giảng Việt Bắc, Tây Tiến, Vợ chồng A Phủ.',
    trackIds: ['track-sample-2', 'track-sample-3', 'track-sample-4'],
    createdAt: '2026-10-03T10:00:00.000Z',
  },
  {
    id: 'pl-thuyet-trinh',
    name: 'Playlist 4: Nhạc Nền Thuyết Trình Lớp Học',
    description: 'Toàn bộ 4 bản nhạc không lời chuẩn mực hỗ trợ Audio Ducking khi đọc văn bản.',
    trackIds: ['track-sample-4', 'track-sample-1', 'track-sample-2', 'track-sample-3'],
    createdAt: '2026-10-04T10:00:00.000Z',
  },
];

export const INITIAL_PRESENTATION_SCRIPTS: PresentationScript[] = [
  {
    id: 'script-tay-tien',
    title: 'Kịch bản thuyết trình: Vẻ đẹp bi tráng trong bài thơ Tây Tiến (Quang Dũng)',
    workId: 'lit-tay-tien',
    updatedAt: '2026-10-10T09:00:00.000Z',
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        stageTitle: 'Mở đầu',
        workTitle: 'Tây Tiến',
        author: 'Quang Dũng',
        content:
          'Chào mừng thầy cô và các bạn đến với buổi thuyết trình chuyên đề Văn học kháng chiến chống Pháp: Khám phá vẻ đẹp lãng mạn và tinh thần bi tráng trong thi phẩm Tây Tiến của nhà thơ Quang Dũng.',
        ttsText:
          'Chào mừng thầy cô và các bạn đến với buổi thuyết trình chuyên đề Ngữ văn: Khám phá vẻ đẹp hào hoa và tinh thần bi tráng trong bài thơ Tây Tiến của nhà thơ Quang Dũng.',
        ttsMode: 'presentation',
        autoReadTTS: false,
        backgroundTrackId: 'track-sample-4',
        imageUrl: HERO_BACKDROP_IMG,
      },
      {
        id: 'step-2',
        stepNumber: 2,
        stageTitle: 'Giới thiệu tác giả',
        workTitle: 'Tây Tiến',
        author: 'Quang Dũng (1921–1988)',
        content:
          'Quang Dũng tên thật là Bùi Đình Diệm, quê ở Phượng Trì, Đan Phượng, Hà Tây. Ông là một nghệ sĩ đa tài: làm thơ, viết văn, vẽ tranh và soạn nhạc. Hồn thơ Quang Dũng phóng khoáng, hồn hậu, lãng mạn và tài hoa.',
        ttsText:
          'Quang Dũng là một nghệ sĩ đa tài: làm thơ, viết văn, vẽ tranh và soạn nhạc. Hồn thơ của ông phóng khoáng, hồn hậu, lãng mạn và tài hoa, đặc biệt khi viết về người lính Tây Tiến và xứ Đoài.',
        ttsMode: 'presentation',
        autoReadTTS: false,
        backgroundTrackId: 'track-sample-1',
        imageUrl: COVER_PIANO_IMG,
      },
      {
        id: 'step-3',
        stepNumber: 3,
        stageTitle: 'Giới thiệu tác phẩm & Hoàn cảnh sáng tác',
        workTitle: 'Tây Tiến',
        author: 'Quang Dũng',
        content:
          'Đoàn quân Tây Tiến được thành lập đầu năm 1947 với nhiệm vụ phối hợp với bộ đội Lào bảo vệ biên giới Việt – Lào. Cuối năm 1948, tại Phù Lưu Chanh, Quang Dũng viết bài thơ Nhớ Tây Tiến (sau đổi thành Tây Tiến).',
        ttsText:
          'Đoàn quân Tây Tiến được thành lập đầu năm 1947. Phần lớn chiến sĩ là thanh niên, sinh viên trí thức Hà Nội chiến đấu trong điều kiện vô cùng gian khổ nhưng vẫn lạc quan, yêu đời.',
        ttsMode: 'presentation',
        autoReadTTS: false,
        backgroundTrackId: 'track-sample-2',
        imageUrl: COVER_FLUTE_IMG,
      },
      {
        id: 'step-4',
        stepNumber: 4,
        stageTitle: 'Phân tích bức tranh thiên nhiên Tây Bắc',
        workTitle: 'Tây Tiến',
        author: 'Quang Dũng',
        content:
          'Thiên nhiên Tây Bắc hiện lên với hai nét vẻ đối lập mà thống nhất: vừa hùng vĩ, hiểm trở, dữ dội với dốc cao ngàn thước, thác gầm thét; vừa thơ mộng, trữ tình với hoa về trong đêm hơi và cơm lên khói bản làng.',
        ttsText:
          'Thiên nhiên Tây Bắc trong nỗi nhớ của Quang Dũng vừa hùng vĩ, hiểm trở với dốc cao vực thẳm, vừa trữ tình thơ mộng với sương khói Mường Lát và hương lúa nếp Mai Châu.',
        ttsMode: 'prose',
        autoReadTTS: false,
        backgroundTrackId: 'track-sample-2',
        imageUrl: COVER_FLUTE_IMG,
      },
      {
        id: 'step-5',
        stepNumber: 5,
        stageTitle: 'Hình tượng người lính Tây Tiến',
        workTitle: 'Tây Tiến',
        author: 'Quang Dũng',
        content:
          'Bức tượng đài người lính Tây Tiến mang vẻ đẹp bi tráng: ngoại hình kiêu dũng vượt lên gian khổ sốt rét rừng, tâm hồn hào hoa lãng mạn mơ về Hà Nội và lý tưởng quyết tử cho Tổ quốc quyết sinh.',
        ttsText:
          'Hình tượng người lính Tây Tiến là sự kết tinh giữa vẻ đẹp hào hoa, lãng mạn của người trai Hà Nội và khí phách bi tráng, coi cái chết nhẹ tựa lông hồng.',
        ttsMode: 'presentation',
        autoReadTTS: false,
        backgroundTrackId: 'track-sample-3',
        imageUrl: COVER_PIANO_IMG,
      },
      {
        id: 'step-6',
        stepNumber: 6,
        stageTitle: 'Phân tích đặc sắc nghệ thuật',
        workTitle: 'Tây Tiến',
        author: 'Quang Dũng',
        content:
          'Sự kết hợp hài hòa giữa cảm hứng lãng mạn và bút pháp bi tráng; nghệ thuật đối lập; sử dụng hệ thống địa danh miền Tây cùng lớp từ Hán Việt cổ kính, trang trọng và nhạc điệu biến hóa linh hoạt.',
        ttsText:
          'Về nghệ thuật, bài thơ kết hợp nhuần nhuyễn cảm hứng lãng mạn và tinh thần bi tráng, phối thanh bằng trắc tài tình cùng lớp từ Hán Việt trang trọng.',
        ttsMode: 'presentation',
        autoReadTTS: false,
        backgroundTrackId: 'track-sample-1',
        imageUrl: HERO_BACKDROP_IMG,
      },
      {
        id: 'step-7',
        stepNumber: 7,
        stageTitle: 'Tổng kết',
        workTitle: 'Tây Tiến',
        author: 'Quang Dũng',
        content:
          'Tây Tiến là một kiệt tác bất hủ của thơ ca kháng chiến chống Pháp, dựng lên bức tượng đài nghệ thuật độc đáo về người chiến sĩ vệ quốc buổi đầu kháng chiến. Cảm ơn thầy cô và các bạn đã lắng nghe!',
        ttsText:
          'Tây Tiến mãi mãi là một kiệt tác của nền thơ ca hiện đại Việt Nam. Xin trân trọng cảm ơn thầy cô và các bạn đã chú ý lắng nghe buổi thuyết trình.',
        ttsMode: 'presentation',
        autoReadTTS: false,
        backgroundTrackId: 'track-sample-4',
        imageUrl: HERO_BACKDROP_IMG,
      },
    ],
  },
];

export const DEFAULT_SETTINGS: StudioSettings = {
  theme: 'dark',
  language: 'vi',
  audioOutputDeviceId: 'default',
  defaultVoiceURI: '',
  defaultTTSSpeed: 1.0,
  duckingPercent: 20,
  defaultMasterVolume: 80,
  autoSave: true,
};
