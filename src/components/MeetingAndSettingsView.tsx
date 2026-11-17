import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileCode,
  HardDrive,
  Info,
  Monitor,
  RefreshCw,
  Settings,
  Share2,
  Upload,
  Volume2,
} from 'lucide-react';
import { MasterStatus, StudioSettings } from '../types/studio';
import { formatBytes } from '../utils/studioLogic';

interface MeetingIntegrationViewProps {
  masterStatus: MasterStatus;
  isPlayingMusic: boolean;
  isPlayingVideo: boolean;
  isSpeakingTTS: boolean;
  onDownloadStandaloneHtml: () => void;
}

export const MeetingIntegrationView: React.FC<MeetingIntegrationViewProps> = ({
  masterStatus,
  isPlayingMusic,
  isPlayingVideo,
  isSpeakingTTS,
  onDownloadStandaloneHtml,
}) => {
  const activeShareState = isSpeakingTTS
    ? 'Reading Text'
    : isPlayingVideo
      ? 'Video Playing'
      : isPlayingMusic
        ? 'Playing Audio'
        : 'Ready to Share';

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Chia sẻ âm thanh & trình chiếu trực tiếp vào Google Meet, Zoom, Discord trên Windows 11
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F5F2EB]">
            Tích Hợp Hội Nghị Trực Tuyến (Meeting Audio Integration)
          </h1>
        </div>

        {/* Authentic Local Audio Output Status (No fake remote connection claims) */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 text-xs">
          <Share2 className="w-4 h-4 text-[#D4AF37]" />
          <div>
            <div className="font-bold text-slate-900 dark:text-[#F5F2EB]">
              Trạng thái nguồn phát Tab: {activeShareState}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              Hệ thống trung tâm: {masterStatus} (Không giả lập kết nối API cuộc họp)
            </div>
          </div>
        </div>
      </div>

      {/* 4 Meeting Status Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(
          [
            {
              key: 'Ready to Share',
              label: 'Ready to Share',
              desc: 'Tab trình duyệt sẵn sàng chia sẻ âm thanh',
            },
            {
              key: 'Playing Audio',
              label: 'Playing Audio',
              desc: 'Đang phát nhạc nền qua Web Audio Engine',
            },
            {
              key: 'Reading Text',
              label: 'Reading Text',
              desc: 'Đang đọc văn bản TTS kèm Audio Ducking',
            },
            {
              key: 'Video Playing',
              label: 'Video Playing',
              desc: 'Đang phát luồng HTML5 Video / Media',
            },
          ] as const
        ).map((st) => {
          const isCurrent = activeShareState === st.key;
          return (
            <div
              key={st.key}
              className={`p-4 rounded-xl border text-xs ${
                isCurrent
                  ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-slate-900 dark:text-[#F5F2EB]'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-500 dark:text-slate-400'
              }`}
            >
              <div className="font-bold text-sm mb-1 flex items-center justify-between">
                <span>{st.label}</span>
                {isCurrent && <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />}
              </div>
              <p className="text-[11px] leading-relaxed">{st.desc}</p>
            </div>
          );
        })}
      </div>

      {/* 3 Platform Integration Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Google Meet */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-3 text-xs">
          <div className="text-[#D4AF37] font-semibold">10.1. Google Meet (Khuyên dùng)</div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-[#F5F2EB]">
            Chia sẻ Tab kèm Âm thanh chất lượng cao
          </h2>
          <ol className="space-y-2 text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
            <li>Mở phòng họp <strong>Google Meet</strong> trên trình duyệt Google Chrome.</li>
            <li>Nhấn nút <strong>Present now (Trình bày ngay)</strong> ở thanh công cụ dưới cùng.</li>
            <li>Chọn <strong>A tab (Một thẻ trình duyệt)</strong> để truyền âm thanh trực tiếp.</li>
            <li>Chọn tab <strong>Literature Studio</strong> trong danh sách.</li>
            <li>Đảm bảo đã bật công tắc <strong>Also share tab audio (Chia sẻ âm thanh của thẻ)</strong>.</li>
            <li>Quay lại Literature Studio, bật <strong>Presentation Mode</strong> và bắt đầu phát nhạc hoặc đọc TTS.</li>
          </ol>
        </div>

        {/* Zoom */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-3 text-xs">
          <div className="text-[#D4AF37] font-semibold">10.2. Zoom Meeting</div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-[#F5F2EB]">
            Chia sẻ Cửa sổ kèm Âm thanh máy tính
          </h2>
          <ol className="space-y-2 text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
            <li>Mở ứng dụng <strong>Zoom Meeting</strong> trên Windows 11.</li>
            <li>Nhấn nút <strong>Share Screen (Chia sẻ màn hình)</strong> màu xanh lá.</li>
            <li>Chọn cửa sổ trình duyệt đang mở <strong>Literature Studio</strong>.</li>
            <li>Tick chọn ô <strong>Share sound (Chia sẻ âm thanh)</strong> ở góc dưới bên trái hộp thoại (chọn chế độ Stereo High-Fidelity nếu có).</li>
            <li>Nhấn <strong>Share</strong> và điều khiển nhạc nền, đọc thơ ngay trên thanh Master Player.</li>
          </ol>
        </div>

        {/* Discord */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-3 text-xs">
          <div className="text-[#D4AF37] font-semibold">10.3. Discord Voice / Stage Channel</div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-[#F5F2EB]">
            Stream Cửa sổ ứng dụng & Lưu ý kỹ thuật
          </h2>
          <ol className="space-y-2 text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
            <li>Tham gia Voice Channel hoặc Stage Channel trên ứng dụng <strong>Discord Desktop</strong>.</li>
            <li>Nhấn <strong>Share Your Screen (Screen)</strong> → chọn tab <strong>Applications</strong>.</li>
            <li>Chọn cửa sổ trình duyệt Chrome đang chạy <strong>Literature Studio</strong> (chế độ Application tự động truyền kèm âm thanh).</li>
          </ol>
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <strong>Lưu ý giới hạn kỹ thuật:</strong> Phiên bản Web chạy trên trình duyệt không thể tự đóng vai một Discord Bot độc lập tham gia Voice Channel nếu không có Node.js Discord Bot Backend và Bot Token riêng.
          </div>
        </div>
      </div>

      {/* Windows 11 Guide & Technical Limitations Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F2EB] flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#D4AF37]" />
              Hướng dẫn chạy ứng dụng trên Windows 11 (Google Chrome)
            </h3>
            <button
              type="button"
              onClick={onDownloadStandaloneHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              Tải index.html độc lập
            </button>
          </div>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed list-disc list-inside">
            <li>
              <strong>Cách 1 (Chạy trực tiếp trên Web/Cloud):</strong> Mở ứng dụng bằng Google Chrome trên Windows 11. Cấp quyền âm thanh tự động và kiểm tra giọng đọc Tiếng Việt (Microsoft HoaiMy / NamMinh Online hoặc Google Tiếng Việt) trong phần Cài đặt Windows 11 (<em>Time &amp; Language → Speech</em>).
            </li>
            <li>
              <strong>Cách 2 (Chạy file index.html độc lập):</strong> Nhấn nút <strong>"Tải index.html độc lập"</strong> để xuất toàn bộ ứng dụng kèm dữ liệu hiện tại thành 1 file <code>index.html</code> duy nhất, sau đó mở trực tiếp trên Chrome Windows 11.
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-3 text-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F2EB] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#D4AF37]" />
            Danh sách các giới hạn kỹ thuật trình duyệt (Minh bạch)
          </h3>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed list-disc list-inside">
            <li>
              <strong>Web Speech API (TTS):</strong> Chất lượng giọng đọc tiếng Việt phụ thuộc vào danh sách giọng <code>vi-VN</code> được cài đặt trên hệ điều hành hoặc trình duyệt (trên Windows 11 Edge/Chrome có giọng đọc tự nhiên tiếng Việt).
            </li>
            <li>
              <strong>YouTube &amp; CORS Media:</strong> Các video YouTube chỉ có thể phát qua khung <code>iframe embed</code> chính thức (đối với video cho phép nhúng). Không thể dùng Web Audio API <code>AnalyserNode</code> để đọc tần số trực tiếp từ iframe ngoại miền (Cross-Origin) hoặc tự động tải luồng âm thanh trái điều khoản dịch vụ.
            </li>
            <li>
              <strong>Autoplay Policy:</strong> Trình duyệt yêu cầu người dùng thực hiện ít nhất 1 thao tác click trước khi khởi chạy <code>AudioContext</code>.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

interface SettingsAndDataViewProps {
  settings: StudioSettings;
  voices: SpeechSynthesisVoice[];
  storageInfo: { usedBytes: number; quotaBytes: number; percent: number };
  onUpdateSettings: (partial: Partial<StudioSettings>) => void;
  onExportBackupJson: () => void;
  onImportBackupJson: (rawJson: string) => void;
  onDownloadStandaloneHtml: () => void;
  onResetAllData: () => void;
}

export const SettingsAndDataView: React.FC<SettingsAndDataViewProps> = ({
  settings,
  voices,
  storageInfo,
  onUpdateSettings,
  onExportBackupJson,
  onImportBackupJson,
  onDownloadStandaloneHtml,
  onResetAllData,
}) => {
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [aiServerStatus, setAiServerStatus] = useState<string>('Đang kiểm tra...');

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((list) => {
          setAudioDevices(list.filter((d) => d.kind === 'audiooutput'));
        })
        .catch(() => {});
    }

    fetch('/api/ai/status')
      .then((r) => r.json())
      .then((d) => {
        setAiServerStatus(
          d.connected
            ? `Đã kết nối máy chủ AI (${d.model})`
            : 'Chế độ Kho Học Liệu Ngữ Văn Nội Bộ (Sẵn sàng 100%)'
        );
      })
      .catch(() => {
        setAiServerStatus('Chế độ Kho Học Liệu Ngữ Văn Nội Bộ (Sẵn sàng 100%)');
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Cấu hình Âm thanh, Giọng đọc, Giao diện & Quản lý Sao lưu Dữ liệu (IndexedDB + LocalStorage)
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F5F2EB]">
            Cài Đặt Hệ Thống & Quản Lý Dữ Liệu (Settings)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDownloadStandaloneHtml}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs hover:bg-[#e2be46] transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            Xuất file index.html độc lập (Windows 11)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Studio Preferences */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-[#F5F2EB] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#D4AF37]" />
              Tùy chọn Giao diện & Thiết bị Âm thanh
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Giao diện (Theme)
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) =>
                    onUpdateSettings({ theme: e.target.value as 'dark' | 'light' })
                  }
                  aria-label="Chọn giao diện Sáng hoặc Tối"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="dark">Dark Mode (Navy & Champagne – Mặc định)</option>
                  <option value="light">Light Mode (Trắng ngà học thuật)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Ngôn ngữ giao diện
                </label>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    onUpdateSettings({ language: e.target.value as 'vi' | 'en' })
                  }
                  aria-label="Chọn ngôn ngữ giao diện"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="vi">Tiếng Việt (Chuẩn Ngữ văn THPT)</option>
                  <option value="en">Tiếng Việt + Thuật ngữ Quốc tế (Bilingual)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Thiết bị đầu ra âm thanh (Audio Output Device)
                </label>
                <select
                  value={settings.audioOutputDeviceId}
                  onChange={(e) =>
                    onUpdateSettings({ audioOutputDeviceId: e.target.value })
                  }
                  aria-label="Chọn thiết bị đầu ra âm thanh"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="default">Thiết bị loa/tai nghe mặc định của hệ thống</option>
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Thiết bị âm thanh (${d.deviceId.slice(0, 8)})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Giọng đọc TTS mặc định
                </label>
                <select
                  value={settings.defaultVoiceURI}
                  onChange={(e) => onUpdateSettings({ defaultVoiceURI: e.target.value })}
                  aria-label="Giọng đọc TTS mặc định"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Tự động ưu tiên Tiếng Việt (vi-VN)</option>
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sliders for Ducking, Default Volume, Default TTS Speed */}
            <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">
                    Mức Audio Ducking (Tỷ lệ âm lượng nhạc nền khi đang đọc TTS)
                  </label>
                  <span className="font-mono-tabular font-bold text-[#D4AF37]">
                    {settings.duckingPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={settings.duckingPercent}
                  onChange={(e) =>
                    onUpdateSettings({ duckingPercent: Number(e.target.value) })
                  }
                  aria-label="Mức giảm âm lượng Audio Ducking"
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mặc định 20%: Khi giọng đọc văn học cất lên, nhạc nền tự động giảm xuống 20% mức âm lượng tổng và khôi phục ngay khi đọc xong.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-slate-500 dark:text-slate-400">
                      Âm lượng tổng mặc định
                    </label>
                    <span className="font-mono-tabular font-semibold">
                      {settings.defaultMasterVolume}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={settings.defaultMasterVolume}
                    onChange={(e) =>
                      onUpdateSettings({ defaultMasterVolume: Number(e.target.value) })
                    }
                    aria-label="Âm lượng tổng mặc định"
                    className="w-full accent-[#D4AF37] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-slate-500 dark:text-slate-400">
                      Tốc độ đọc TTS mặc định
                    </label>
                    <span className="font-mono-tabular font-semibold">
                      {settings.defaultTTSSpeed.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    value={settings.defaultTTSSpeed}
                    onChange={(e) =>
                      onUpdateSettings({ defaultTTSSpeed: Number(e.target.value) })
                    }
                    aria-label="Tốc độ đọc TTS mặc định"
                    className="w-full accent-[#D4AF37] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => onUpdateSettings({ autoSave: e.target.checked })}
                    className="accent-[#D4AF37]"
                  />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    Tự động lưu dữ liệu sau mỗi thao tác (Auto-save IndexedDB &amp; LocalStorage)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Storage & Backup Management */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-[#F5F2EB] flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#D4AF37]" />
              Quản lý Dung Lượng & Sao Lưu Dữ Liệu
            </h2>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Dung lượng lưu trữ trình duyệt (IndexedDB):
                </span>
                <span className="font-mono-tabular font-semibold text-[#D4AF37]">
                  {formatBytes(storageInfo.usedBytes)} / {formatBytes(storageInfo.quotaBytes)} (
                  {storageInfo.percent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    storageInfo.percent > 85 ? 'bg-rose-500' : 'bg-[#D4AF37]'
                  }`}
                  style={{ width: `${Math.max(2, storageInfo.percent)}%` }}
                />
              </div>
              {storageInfo.percent > 80 && (
                <p className="text-rose-400 text-[11px]">
                  Cảnh báo: Dung lượng lưu trữ trình duyệt sắp đầy. Vui lòng xuất bản sao lưu hoặc xóa bớt video lớn.
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Trạng thái Kết nối AI Server
              </div>
              <div className="text-slate-500 dark:text-slate-400">{aiServerStatus}</div>
              <div className="text-[11px] text-slate-400 pt-1">
                Khóa kết nối AI được bảo mật tự động ở tầng máy chủ trung gian, không phơi bày trên trình duyệt.
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={onExportBackupJson}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs hover:bg-[#e2be46] transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Xuất Bản Sao Lưu Toàn Bộ Studio (.JSON)
              </button>

              <input
                ref={backupInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    onImportBackupJson(String(reader.result));
                  };
                  reader.readAsText(f);
                  e.target.value = '';
                }}
              />

              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Nhập Bản Sao Lưu Dữ Liệu (.JSON)
              </button>

              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-rose-500/30 text-rose-500 font-semibold text-xs hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Khôi Phục Cài Đặt & Dữ Liệu Mặc Định
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận khôi phục cài đặt gốc"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#111726] p-6 space-y-4 text-[#F5F2EB]">
            <h3 className="text-lg font-bold text-rose-400">
              Xác nhận khôi phục dữ liệu mặc định
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Thao tác này sẽ xóa các file đã tải lên trong IndexedDB và khôi phục 8 tác phẩm văn học mẫu, 4 bản nhạc không lời mẫu cùng cài đặt mặc định. Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetAllData();
                  setConfirmReset(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
