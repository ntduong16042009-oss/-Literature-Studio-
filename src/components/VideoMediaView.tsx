import React, { useEffect, useRef, useState } from 'react';
import {
  Film,
  Link2,
  ListPlus,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  Headphones,
  Monitor,
  AlertCircle,
} from 'lucide-react';
import { VideoItem } from '../types/studio';
import { formatBytes, formatDuration, parseMediaUrl } from '../utils/studioLogic';

interface VideoMediaViewProps {
  videos: VideoItem[];
  activeVideo: VideoItem | null;
  videoObjectUrl: string | null;
  onUploadVideos: (files: FileList) => void;
  onAddUrlMedia: (
    title: string,
    rawUrl: string,
    mode: 'play-now' | 'add-queue'
  ) => { ok: boolean; error?: string };
  onPlayVideo: (video: VideoItem) => void;
  onAddVideoToQueue: (video: VideoItem) => void;
  onDeleteVideo: (id: string) => void;
  onVideoPlayStateChange: (playing: boolean) => void;
}

export const VideoMediaView: React.FC<VideoMediaViewProps> = ({
  videos,
  activeVideo,
  videoObjectUrl,
  onUploadVideos,
  onAddUrlMedia,
  onPlayVideo,
  onAddVideoToQueue,
  onDeleteVideo,
  onVideoPlayStateChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [frameSize, setFrameSize] = useState<'compact' | 'standard' | 'theater'>('standard');
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [activeVideo?.id]);

  const handleTogglePlay = () => {
    const v = videoElRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => {
          setIsPlaying(true);
          onVideoPlayStateChange(true);
        })
        .catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
      onVideoPlayStateChange(false);
    }
  };

  const handleSeek = (val: number) => {
    const v = videoElRef.current;
    if (!v) return;
    v.currentTime = val;
    setCurrentTime(val);
  };

  const handleVolume = (val: number) => {
    const v = videoElRef.current;
    setVolume(val);
    if (v) {
      v.volume = val / 100;
      v.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoElRef.current) {
      videoElRef.current.playbackRate = rate;
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const handleUrlSubmit = (mode: 'play-now' | 'add-queue') => {
    setUrlError(null);
    const parsed = parseMediaUrl(urlInput);
    if (parsed.type === 'unsupported') {
      setUrlError(parsed.reason || 'URL không được hỗ trợ.');
      return;
    }
    const res = onAddUrlMedia(urlTitle.trim() || urlInput.trim(), urlInput.trim(), mode);
    if (!res.ok) {
      setUrlError(res.error || 'Không thể thêm URL này.');
    } else {
      setUrlInput('');
      setUrlTitle('');
    }
  };

  const frameWidthClass =
    frameSize === 'compact'
      ? 'max-w-xl mx-auto'
      : frameSize === 'standard'
        ? 'max-w-4xl mx-auto'
        : 'w-full';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            HTML5 Video & Media Stream · Hỗ trợ MP4, WebM, OGG Video, Link MP3/MP4 trực tiếp & YouTube Embed
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F5F2EB]">
            Trình Phát Video & Media ({videos.length} nội dung)
          </h1>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUploadVideos(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs hover:bg-[#e2be46] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Tải Video (MP4 / WebM / OGG)
          </button>
        </div>
      </div>

      {/* URL Media Input Box */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F5F2EB]">
              Phát nội dung qua URL (Direct MP3 / Direct MP4 / YouTube Embed)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Tuân thủ điều khoản dịch vụ · Không tự động trích xuất luồng trái phép
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <input
              type="text"
              value={urlTitle}
              onChange={(e) => setUrlTitle(e.target.value)}
              placeholder="Tên hiển thị (VD: Tư liệu Tây Tiến)..."
              aria-label="Tên nội dung media URL"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="md:col-span-5">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setUrlError(null);
              }}
              placeholder="https://.../file.mp4, .mp3 hoặc https://www.youtube.com/watch?v=..."
              aria-label="Đường dẫn URL media hoặc YouTube"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleUrlSubmit('play-now')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold text-xs hover:bg-[#e2be46] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Play Now
            </button>
            <button
              type="button"
              onClick={() => handleUrlSubmit('add-queue')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ListPlus className="w-3.5 h-3.5" />
              Add Queue
            </button>
          </div>
        </div>

        {urlError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{urlError}</span>
          </div>
        )}
      </div>

      {/* Main Video Stage */}
      <div
        ref={containerRef}
        className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] overflow-hidden ${frameWidthClass}`}
      >
        {/* Stage Top Controls (Size & Audio/Video Mode Switch) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs">
          <div className="font-semibold text-slate-800 dark:text-[#F5F2EB] truncate">
            {activeVideo ? activeVideo.title : 'Chưa chọn video trình chiếu'}
          </div>
          <div className="flex items-center gap-2">
            {/* Switch between Video & Audio-only mode */}
            <button
              type="button"
              onClick={() => setAudioOnlyMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                audioOnlyMode
                  ? 'bg-[#D4AF37] text-slate-950 font-semibold'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {audioOnlyMode ? (
                <>
                  <Headphones className="w-3.5 h-3.5" />
                  Chế độ chỉ nghe âm thanh
                </>
              ) : (
                <>
                  <Monitor className="w-3.5 h-3.5" />
                  Chế độ xem Video
                </>
              )}
            </button>

            {/* Frame size selector */}
            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-md">
              {(['compact', 'standard', 'theater'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFrameSize(sz)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                    frameSize === sz
                      ? 'bg-[#D4AF37] text-slate-950 font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {sz === 'compact' ? 'Thu gọn' : sz === 'standard' ? 'Tiêu chuẩn' : 'Rộng'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Viewport */}
        {!activeVideo ? (
          <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <Film className="w-12 h-12 text-[#D4AF37] opacity-75" />
            <p className="text-sm font-medium text-slate-200">
              Tải lên file video (MP4, WebM, OGG) hoặc nhập URL trực tiếp / YouTube Embed ở trên để phát.
            </p>
            <p className="text-xs text-slate-400 max-w-md">
              Hỗ trợ điều chỉnh tốc độ phát (0.5x – 2.0x), chuyển đổi linh hoạt giữa chế độ xem hình và chế độ nghe âm thanh.
            </p>
          </div>
        ) : activeVideo.sourceType === 'youtube-embed' && activeVideo.embedUrl ? (
          <div className="aspect-video bg-black relative">
            {audioOnlyMode ? (
              <div className="p-6 text-center text-xs text-slate-300 space-y-2 flex flex-col items-center justify-center h-full">
                <Headphones className="w-10 h-10 text-[#D4AF37]" />
                <p>
                  Đang mở khung nhúng YouTube ở chế độ tối giản hình ảnh. Lưu ý: Trình phát YouTube IFrame tuân theo điều khiển trực tiếp của YouTube.
                </p>
              </div>
            ) : null}
            <iframe
              src={activeVideo.embedUrl}
              title={activeVideo.title}
              className={`w-full h-full ${audioOnlyMode ? 'opacity-20 h-24' : ''}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div>
            <div className="aspect-video bg-slate-950 relative flex items-center justify-center overflow-hidden">
              {audioOnlyMode && (
                <div className="absolute inset-0 z-10 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <Headphones className="w-12 h-12 text-[#D4AF37]" />
                  <div className="text-base font-bold text-[#F5F2EB]">{activeVideo.title}</div>
                  <div className="text-xs text-slate-400">
                    Đang phát ở chế độ chỉ nghe âm thanh (Tiết kiệm tài nguyên hiển thị)
                  </div>
                </div>
              )}
              <video
                ref={videoElRef}
                src={videoObjectUrl || activeVideo.url}
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                onPlay={() => {
                  setIsPlaying(true);
                  onVideoPlayStateChange(true);
                }}
                onPause={() => {
                  setIsPlaying(false);
                  onVideoPlayStateChange(false);
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  onVideoPlayStateChange(false);
                }}
              />
            </div>

            {/* Custom HTML5 Video Controls */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3 text-xs text-slate-200">
              <div className="flex items-center gap-3">
                <span className="font-mono-tabular text-[11px] text-slate-400 w-12">
                  {formatDuration(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  aria-label="Thanh tua video"
                  className="flex-1 accent-[#D4AF37] cursor-pointer"
                />
                <span className="font-mono-tabular text-[11px] text-slate-400 w-12 text-right">
                  {formatDuration(duration)}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D4AF37] text-slate-950 font-semibold cursor-pointer"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        Tạm dừng
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Phát Video
                      </>
                    )}
                  </button>

                  {/* Volume */}
                  <button
                    type="button"
                    onClick={() => handleVolume(isMuted ? 80 : 0)}
                    aria-label="Bật tắt tiếng video"
                    className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolume(Number(e.target.value))}
                    aria-label="Âm lượng video"
                    className="w-24 accent-[#D4AF37] cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-slate-400">Tốc độ:</label>
                  <select
                    value={playbackRate}
                    onChange={(e) => handleRateChange(Number(e.target.value))}
                    aria-label="Tốc độ phát video"
                    className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200"
                  >
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((r) => (
                      <option key={r} value={r}>
                        {r}x
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleFullscreen}
                    aria-label="Toàn màn hình video"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Toàn màn hình
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Library List */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#F5F2EB]">
            Danh sách Video & Media đã thêm ({videos.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  activeVideo?.id === vid.id
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726]'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-900 dark:text-[#F5F2EB] truncate">
                    {vid.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {vid.sourceType === 'youtube-embed'
                      ? 'YouTube Embed'
                      : vid.sourceType === 'uploaded-video'
                        ? `File tải lên · ${formatBytes(vid.size)}`
                        : 'Direct Media URL'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPlayVideo(vid)}
                    className="px-3 py-1.5 rounded-md bg-[#D4AF37] text-slate-950 font-semibold text-xs cursor-pointer"
                  >
                    Phát ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddVideoToQueue(vid)}
                    aria-label={`Thêm ${vid.title} vào Queue`}
                    className="p-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteVideo(vid.id)}
                    aria-label={`Xóa video ${vid.title}`}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
