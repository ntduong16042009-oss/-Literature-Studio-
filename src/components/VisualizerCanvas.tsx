import React, { useEffect, useRef } from 'react';

interface VisualizerCanvasProps {
  analyser: AnalyserNode | null;
  isPlayingAudio: boolean;
  isReadingTTS: boolean;
  height?: number;
  className?: string;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  analyser,
  isPlayingAudio,
  isReadingTTS,
  height = 56,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ analyser, isPlayingAudio, isReadingTTS });

  useEffect(() => {
    stateRef.current = { analyser, isPlayingAudio, isReadingTTS };
  }, [analyser, isPlayingAudio, isReadingTTS]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastDraw = 0;
    const freqData = new Uint8Array(64);
    let phase = 0;

    const renderFrame = (timestamp: number) => {
      animId = requestAnimationFrame(renderFrame);
      // Throttle to ~24fps to keep CPU usage light on software rendering
      if (timestamp - lastDraw < 42) return;
      lastDraw = timestamp;

      const { analyser: currentAnalyser, isPlayingAudio: activeAudio, isReadingTTS: activeTTS } =
        stateRef.current;

      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      const barCount = 36;
      const gap = 3;
      const barWidth = Math.max(2, (width - (barCount - 1) * gap) / barCount);

      if (currentAnalyser && activeAudio) {
        currentAnalyser.getByteFrequencyData(freqData);
      }

      phase += 0.14;

      for (let i = 0; i < barCount; i++) {
        let normalized = 0.08;

        if (currentAnalyser && activeAudio) {
          const val = freqData[i % freqData.length] || 0;
          normalized = Math.max(0.1, val / 255);
        } else if (activeAudio) {
          normalized =
            0.2 +
            0.45 * Math.abs(Math.sin(phase + i * 0.28)) * Math.cos(phase * 0.5 + i * 0.15);
        }

        if (activeTTS) {
          // Overlay gentle vocal modulation when TTS is speaking
          const vocalWave = 0.25 * Math.abs(Math.sin(phase * 1.4 + i * 0.35));
          normalized = Math.min(0.95, normalized * 0.45 + vocalWave + 0.15);
        }

        const barHeight = Math.max(3, Math.round(normalized * (h - 6)));
        const x = i * (barWidth + gap);
        const y = h - barHeight;

        if (activeTTS) {
          ctx.fillStyle = '#D4AF37'; // Champagne gold priority during TTS reading
        } else if (activeAudio) {
          ctx.fillStyle = i % 2 === 0 ? '#D4AF37' : '#818CF8';
        } else {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={height}
      data-testid="audio-visualizer-canvas"
      aria-label="Biểu đồ tần số âm thanh trực tiếp"
      className={`w-full block ${className}`}
    />
  );
};
