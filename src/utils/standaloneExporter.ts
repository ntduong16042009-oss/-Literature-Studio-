import { LiteratureCard, Playlist, PresentationScript, StudioSettings, Track } from '../types/studio';

/**
 * Generates a complete, self-contained single-file `index.html` (HTML5 + CSS3 + Tailwind CDN + JavaScript)
 * preloaded with the user's current Literature Library, Playlists, Presentation Scripts, and Web Audio synthesizer
 * so the user can open it directly by double-clicking `index.html` on Windows 11 Google Chrome without any server.
 */
export function generateStandaloneSingleFileHtml(payload: {
  cards: LiteratureCard[];
  tracks: Track[];
  playlists: Playlist[];
  scripts: PresentationScript[];
  settings: StudioSettings;
}): string {
  const safeJson = JSON.stringify(payload).replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html>
<html lang="vi" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Literature Studio – AI Music & Presentation Assistant (Standalone Windows 11 Edition)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #0B0F17; color: #F5F2EB; }
    h1, h2, .font-serif-ed { font-family: 'Cormorant Garamond', Georgia, serif; }
    .font-mono-num { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-[#0B0F17] text-[#F5F2EB]">
  <header class="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/80 bg-[#0F1522]">
    <div class="flex items-center gap-3">
      <span class="text-xl font-bold tracking-tight text-[#D4AF37] font-serif-ed">Literature Studio</span>
      <span class="text-xs text-slate-400">· Bản Độc Lập Windows 11 (Single-File HTML5)</span>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="switchTab('music')" class="px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700">Thư viện Nhạc</button>
      <button onclick="switchTab('literature')" class="px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700">Kho Văn Học</button>
      <button onclick="switchTab('tts')" class="px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700">Đọc TTS & Ducking</button>
      <button onclick="switchTab('presentation')" class="px-3 py-1.5 text-xs font-medium rounded bg-[#D4AF37] text-slate-950 font-semibold">Trình Chiếu</button>
    </div>
  </header>

  <main id="app-workspace" class="flex-1 p-6 max-w-7xl w-full mx-auto overflow-y-auto"></main>

  <footer class="border-t border-slate-800 bg-[#0F1522] px-6 py-3 flex items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <button onclick="togglePlay()" id="btn-play" class="px-4 py-2 rounded bg-[#D4AF37] text-slate-950 font-semibold text-xs">Phát / Tạm dừng</button>
      <button onclick="stopAudio()" class="px-3 py-2 rounded bg-slate-800 text-slate-200 text-xs">Dừng</button>
      <div>
        <div id="now-playing-title" class="text-sm font-medium text-[#F5F2EB]">Chưa phát nhạc nền</div>
        <div id="now-playing-status" class="text-xs text-slate-400">Trạng thái: Idle</div>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-xs text-slate-400">Âm lượng:</span>
      <input type="range" min="0" max="100" value="80" oninput="changeVolume(this.value)" class="w-32 accent-[#D4AF37]" />
      <span id="vol-label" class="text-xs font-mono-num text-slate-300">80%</span>
    </div>
  </footer>

  <script>
    const INITIAL_DATA = ${safeJson};
    let state = JSON.parse(localStorage.getItem('lit_standalone_state') || 'null') || INITIAL_DATA;
    let currentTab = 'literature';
    let audioCtx = null;
    let activeOsc = null;
    let gainNode = null;
    let isPlaying = false;
    let masterVol = state.settings?.defaultMasterVolume || 80;
    let isDucking = false;

    function saveState() {
      localStorage.setItem('lit_standalone_state', JSON.stringify(state));
    }

    function updateEffectiveGain() {
      if (!gainNode || !audioCtx) return;
      const ratio = isDucking ? ((state.settings?.duckingPercent || 20) / 100) : 1;
      gainNode.gain.setTargetAtTime((masterVol / 100) * ratio * 0.25, audioCtx.currentTime, 0.08);
    }

    function playSynthTrack(title) {
      stopAudio();
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioCtx.createGain();
      gainNode.connect(audioCtx.destination);
      activeOsc = audioCtx.createOscillator();
      activeOsc.type = 'sine';
      activeOsc.frequency.setValueAtTime(220, audioCtx.currentTime);
      activeOsc.connect(gainNode);
      activeOsc.start();
      isPlaying = true;
      updateEffectiveGain();
      document.getElementById('now-playing-title').textContent = title;
      document.getElementById('now-playing-status').textContent = isDucking ? 'Playing Music (Audio Ducking 20%)' : 'Playing Music';
    }

    function togglePlay() {
      if (isPlaying) {
        stopAudio();
      } else {
        playSynthTrack(state.tracks[0]?.title || 'Nhạc nền Piano');
      }
    }

    function stopAudio() {
      if (activeOsc) {
        try { activeOsc.stop(); activeOsc.disconnect(); } catch (e) {}
        activeOsc = null;
      }
      isPlaying = false;
      document.getElementById('now-playing-status').textContent = 'Trạng thái: Idle';
    }

    function changeVolume(val) {
      masterVol = Number(val);
      document.getElementById('vol-label').textContent = masterVol + '%';
      updateEffectiveGain();
    }

    function speakText(text) {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'vi-VN';
      u.onstart = () => { isDucking = true; updateEffectiveGain(); };
      u.onend = () => { isDucking = false; updateEffectiveGain(); };
      u.onerror = () => { isDucking = false; updateEffectiveGain(); };
      window.speechSynthesis.speak(u);
    }

    function switchTab(tab) {
      currentTab = tab;
      render();
    }

    function render() {
      const el = document.getElementById('app-workspace');
      if (currentTab === 'music') {
        el.innerHTML = '<h1 class="text-3xl font-bold mb-4 font-serif-ed">Thư Viện Âm Nhạc</h1>' +
          '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
          state.tracks.map(t => \`
            <div class="p-4 rounded-lg border border-slate-800 bg-[#121826] flex items-center justify-between">
              <div>
                <div class="font-semibold text-[#F5F2EB]">\${t.title}</div>
                <div class="text-xs text-slate-400">\${t.artist} · \${t.category}</div>
              </div>
              <button onclick="playSynthTrack('\${t.title.replace(/'/g, "\\\\'")}')" class="px-3 py-1.5 rounded bg-[#D4AF37] text-slate-950 text-xs font-semibold">Phát ngay</button>
            </div>
          \`).join('') + '</div>';
      } else if (currentTab === 'tts') {
        el.innerHTML = '<h1 class="text-3xl font-bold mb-4 font-serif-ed">Đọc Văn Bản TTS & Audio Ducking</h1>' +
          '<textarea id="tts-input" rows="6" class="w-full p-4 rounded bg-[#121826] border border-slate-800 text-sm mb-3">' +
          (state.cards[0]?.summary || '') + '</textarea>' +
          '<div class="flex gap-3">' +
          '<button onclick="speakText(document.getElementById(\\'tts-input\\').value)" class="px-4 py-2 rounded bg-[#D4AF37] text-slate-950 font-semibold text-xs">Bắt đầu đọc (Tự động giảm nhạc nền xuống 20%)</button>' +
          '<button onclick="window.speechSynthesis.cancel(); isDucking=false; updateEffectiveGain();" class="px-4 py-2 rounded bg-slate-800 text-xs">Dừng đọc</button>' +
          '</div>';
      } else if (currentTab === 'presentation') {
        const step = state.scripts[0]?.steps[0] || { stageTitle: 'Mở đầu', workTitle: 'Tây Tiến', author: 'Quang Dũng', content: '' };
        el.innerHTML = \`
          <div class="p-8 rounded-xl border border-slate-800 bg-[#121826] text-center max-w-3xl mx-auto">
            <div class="text-xs text-[#D4AF37] mb-2">\${step.stageTitle}</div>
            <h1 class="text-4xl font-bold font-serif-ed mb-2">\${step.workTitle}</h1>
            <div class="text-sm text-slate-400 mb-6">\${step.author}</div>
            <p class="text-base leading-relaxed text-slate-200 mb-6">\${step.content}</p>
            <button onclick="speakText('\${step.content.replace(/'/g, "\\\\'")}')" class="px-4 py-2 rounded bg-[#D4AF37] text-slate-950 font-semibold text-xs">Đọc thuyết trình bước này</button>
          </div>
        \`;
      } else {
        el.innerHTML = '<h1 class="text-3xl font-bold mb-4 font-serif-ed">Kho Tài Liệu Văn Học (' + state.cards.length + ' tác phẩm)</h1>' +
          '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
          state.cards.map(c => \`
            <div class="p-5 rounded-lg border border-slate-800 bg-[#121826]">
              <div class="text-xs text-slate-400 mb-1">\${c.author} · \${c.genre} · \${c.category}</div>
              <h2 class="text-xl font-bold font-serif-ed text-[#D4AF37] mb-2">\${c.title}</h2>
              <p class="text-sm text-slate-300 mb-3">\${c.summary}</p>
              <div class="text-xs text-slate-400 mb-3"><strong>Nghệ thuật:</strong> \${c.artisticValue}</div>
              <button onclick="speakText('\${c.summary.replace(/'/g, "\\\\'")}')" class="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs">Đọc tóm tắt bằng TTS</button>
            </div>
          \`).join('') + '</div>';
      }
    }
    render();
  </script>
</body>
</html>`;
}
