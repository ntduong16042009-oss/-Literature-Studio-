# LITERATURE STUDIO ULTIMATE
**OpenAI Responses API + Supabase PostgreSQL & Auth + Automatic Multi-Device Sync by UID + Device Management + Admin RBAC + Vercel Serverless**

Nền tảng văn học số, điều khiển âm thanh thuyết trình và trợ lý học thuật thông minh **Literature Studio Ultimate**.

---

## Kiến Trúc Hệ Thống

* **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Web Audio API + Web Speech API (TTS).
* **Backend**: Express / Vercel Serverless Functions (`/api/ai.ts`, `/api/index.ts`, `src/server/apiRouter.ts`).
* **Database & Auth**: Supabase PostgreSQL (16 bảng chuẩn hóa, Row Level Security - RLS phân quyền `user` & `admin`) & Supabase Auth (Bắt buộc Đăng ký / Đăng nhập bằng Email hoặc Tên người dùng + Mật khẩu, Đổi mật khẩu xác thực mật khẩu cũ, Khôi phục mật khẩu).
* **AI Engine**: Chính thức `openai` SDK (`openai.responses.create` với SSE Streaming thời gian thực, 20 năng lực phân tích văn học, nhận thức ngữ cảnh đoạn văn đang chọn).
* **Automatic Multi-Device Sync**: Tự động đồng bộ hai chiều theo `UID` và Supabase Realtime ngay khi đăng nhập cùng tài khoản trên nhiều thiết bị (không dùng tài khoản ẩn danh hoặc mã ghép nối 6 ký tự).
* **Device & Admin RBAC**: Quản lý thiết bị đăng nhập, thu hồi phiên từ xa, khóa/mở khóa tài khoản và nhật ký hoạt động quản trị (`LITERATURE STUDIO ADMIN`).

---

## HƯỚNG DẪN CÀI ĐẶT & TRIỂN KHAI TỪ ĐẦU ĐẾN CUỐI

### Bước 1: Chuẩn bị Supabase Project
1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard) và mở project của bạn:
   * **Project URL**: `https://ntvplwnaldoihuvqcfag.supabase.co`
2. Vào **Authentication** -> **Providers**:
   * Bật **Email** provider.
   * Tắt **Anonymous Sign-Ins** để đảm bảo toàn bộ người dùng phải đăng ký / đăng nhập bằng tài khoản chính thức.

### Bước 2: Chạy SQL Migration trên Supabase
1. Trong Supabase Dashboard, mở mục **SQL Editor** -> **New Query**.
2. Mở file `supabase/migrations/001_literature_studio_ultimate.sql` trong mã nguồn dự án này, sao chép toàn bộ nội dung SQL và dán vào **SQL Editor**.
3. Nhấn **Run** để khởi tạo hoặc cập nhật an toàn toàn bộ 16 bảng (`profiles`, `authors`, `categories`, `works`, `reading_history`, `reading_progress`, `favorites`, `lessons`, `materials`, `user_workspace_sync`, `ai_conversations`, `ai_messages`, `ai_usage`, `user_devices`, `admin_audit_logs`, `user_settings`), các khóa ngoại, chỉ mục (indexes) và chính sách bảo mật **Row Level Security (RLS)** mà không làm mất dữ liệu hiện có.

### Bước 3: Lấy OpenAI API Key
1. Truy cập [OpenAI Platform](https://platform.openai.com/api-keys).
2. Nhấn **Create new secret key** và sao chép khóa `sk-...`.
3. Mặc định hệ thống sử dụng model `gpt-4.1-mini` thông qua **OpenAI Responses API** (`openai.responses.create`).

### Bước 4: Cấu hình Biến Môi Trường (`.env`) & Khởi Tạo Admin
Tạo file `.env` tại thư mục gốc (hoặc cấu hình trong mục **Environment Variables** trên Vercel) theo đúng cấu trúc trong `.env.example`:

```env
# PUBLIC VARIABLES (Được phép dùng ở trình duyệt)
VITE_SUPABASE_URL="https://ntvplwnaldoihuvqcfag.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."

# SERVER-ONLY VARIABLES (Chỉ chạy trên Backend / Vercel Serverless - Tuyệt đối không thêm tiền tố VITE_)
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4.1-mini"

# CẤU HÌNH KHỞI TẠO TÀI KHOẢN QUẢN TRỊ VIÊN (SERVER-ONLY)
ADMIN_USERNAME="lecongvinh"
ADMIN_EMAIL="lecongvinhfm00@gmail.com"
ADMIN_INITIAL_PASSWORD="MatKhauKhoiTaoCuaBan_TrenServer"
ADMIN_FORCE_PASSWORD_CHANGE="true"
```

> **Lưu ý bảo mật Admin**: Mật khẩu khởi tạo chỉ được truyền qua biến môi trường máy chủ (`ADMIN_INITIAL_PASSWORD`), tuyệt đối không nằm trong mã nguồn frontend hay GitHub. Khi đăng nhập lần đầu với tài khoản `lecongvinh`, hệ thống bắt buộc đổi mật khẩu mới và tự động vô hiệu hóa cơ chế mật khẩu khởi tạo (`must_change_password = false`). Ngoài ra, nếu bạn đăng ký trực tiếp tài khoản có tên người dùng trùng với `ADMIN_USERNAME` (`lecongvinh`), hệ thống cũng tự động gán quyền `role = 'admin'`.

### Bước 5: Deploy trên Vercel
1. Đẩy dự án lên GitHub và kết nối repository với [Vercel Dashboard](https://vercel.com/dashboard).
2. Nhập đầy đủ các biến môi trường ở **Bước 4** vào mục **Environment Variables** trên Vercel.
3. Nhấn **Deploy** và thêm tên miền chính thức của bạn vào **Authentication -> URL Configuration** trên Supabase Dashboard.
