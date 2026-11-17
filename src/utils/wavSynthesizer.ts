/**
 * Real Procedural Instrumental WAV Synthesizer
 * Generates authentic, warm, multi-voice instrumental WAV audio Blobs in browser memory
 * so the 4 built-in sample tracks play real music, support seeking, and drive the Web Audio AnalyserNode visualizer.
 */

export type SynthPreset =
  | 'piano-song-da'
  | 'flute-tay-bac'
  | 'strings-mua-thu'
  | 'ambient-thuyet-trinh';

interface NoteEvent {
  freq: number;
  start: number;
  duration: number;
  amp: number;
}

const N: Record<string, number> = {
  A2: 110.0,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
};

function buildEventsForPreset(preset: SynthPreset): { duration: number; events: NoteEvent[] } {
  const events: NoteEvent[] = [];

  if (preset === 'piano-song-da') {
    // Gentle nocturnal piano arpeggios in A minor / C major (16 seconds)
    const chords = [
      ['A2', 'E3', 'A3', 'C4', 'E4', 'A4', 'E4', 'C4'],
      ['F3', 'C4', 'F4', 'A4', 'C5', 'A4', 'F4', 'C4'],
      ['C3', 'G3', 'C4', 'E4', 'G4', 'E4', 'C4', 'G3'],
      ['G3', 'D4', 'G4', 'B4', 'D5', 'B4', 'G4', 'D4'],
    ];
    let t = 0;
    for (let cycle = 0; cycle < 2; cycle++) {
      for (const chord of chords) {
        for (const noteName of chord) {
          events.push({
            freq: N[noteName] || 220,
            start: t,
            duration: 1.1,
            amp: 0.22,
          });
          t += 0.25;
        }
      }
    }
    return { duration: 16, events };
  }

  if (preset === 'flute-tay-bac') {
    // Pentatonic bamboo flute melody over warm drone (18 seconds)
    const melody: [string, number][] = [
      ['E4', 1.2],
      ['G4', 0.8],
      ['A4', 1.5],
      ['C5', 1.0],
      ['D5', 1.5],
      ['E5', 2.0],
      ['D5', 1.0],
      ['C5', 1.2],
      ['A4', 1.8],
      ['G4', 1.0],
      ['E4', 1.5],
      ['D4', 1.0],
      ['E4', 2.5],
    ];
    let t = 0.2;
    // Pad accompaniment
    for (let padStart = 0; padStart < 16; padStart += 4) {
      events.push({ freq: N.A3, start: padStart, duration: 4.2, amp: 0.1 });
      events.push({ freq: N.E4, start: padStart, duration: 4.2, amp: 0.08 });
    }
    for (const [note, dur] of melody) {
      events.push({
        freq: N[note] || 440,
        start: t,
        duration: dur,
        amp: 0.28,
      });
      t += dur * 0.95;
    }
    return { duration: 18, events };
  }

  if (preset === 'strings-mua-thu') {
    // Warm classical chamber strings progression (16 seconds)
    const prog: [string[], number][] = [
      [['D3', 'A3', 'D4', 'F4'], 4.0],
      [['A2', 'E3', 'A3', 'C4'], 4.0],
      [['C3', 'G3', 'C4', 'E4'], 4.0],
      [['D3', 'A3', 'D4', 'F4'], 4.0],
    ];
    let t = 0;
    for (const [notes, dur] of prog) {
      for (const n of notes) {
        events.push({
          freq: N[n] || 220,
          start: t,
          duration: dur + 0.3,
          amp: 0.16,
        });
      }
      t += dur;
    }
    return { duration: 16, events };
  }

  // 'ambient-thuyet-trinh' - Serene literary presentation background music (20 seconds)
  const ambientChords: [string[], number][] = [
    [['C3', 'G3', 'E4', 'B4'], 5.0],
    [['A2', 'E3', 'C4', 'G4'], 5.0],
    [['F3', 'C4', 'A4', 'E5'], 5.0],
    [['G3', 'D4', 'B4', 'D5'], 5.0],
  ];
  let t = 0;
  for (const [notes, dur] of ambientChords) {
    notes.forEach((n, idx) => {
      events.push({
        freq: N[n] || 261.63,
        start: t + idx * 0.35,
        duration: dur - idx * 0.2,
        amp: 0.15,
      });
    });
    t += dur;
  }
  return { duration: 20, events };
}

export function synthesizeSampleWavBlob(preset: SynthPreset): {
  blob: Blob;
  duration: number;
  size: number;
} {
  const sampleRate = 22050; // Fast synthesis + authentic warm acoustic tone
  const { duration, events } = buildEventsForPreset(preset);
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (const ev of events) {
    const startSample = Math.max(0, Math.floor(ev.start * sampleRate));
    const endSample = Math.min(numSamples, Math.floor((ev.start + ev.duration) * sampleRate));
    const totalEvSamples = endSample - startSample;
    if (totalEvSamples <= 0) continue;

    for (let i = 0; i < totalEvSamples; i++) {
      const localTime = i / sampleRate;
      const normPos = i / totalEvSamples;

      // Envelope shaping based on instrument preset
      let env = 1;
      if (preset === 'piano-song-da') {
        const attack = Math.min(1, localTime / 0.02);
        const decay = Math.exp(-3.2 * normPos);
        env = attack * decay;
      } else if (preset === 'flute-tay-bac') {
        const attack = Math.min(1, localTime / 0.12);
        const release = normPos > 0.8 ? (1 - normPos) / 0.2 : 1;
        const vibrato = 1 + 0.006 * Math.sin(2 * Math.PI * 5.2 * localTime);
        const phase = 2 * Math.PI * ev.freq * vibrato * localTime;
        const fluteWave =
          Math.sin(phase) + 0.35 * Math.sin(2 * phase) + 0.12 * Math.sin(3 * phase);
        samples[startSample + i] += ev.amp * attack * release * fluteWave;
        continue;
      } else {
        // Strings / Ambient slow attack & smooth release
        const attack = Math.min(1, localTime / 0.45);
        const release = normPos > 0.75 ? (1 - normPos) / 0.25 : 1;
        env = attack * release;
      }

      const phase = 2 * Math.PI * ev.freq * localTime;
      // Warm harmonic overtones
      const wave =
        Math.sin(phase) +
        0.28 * Math.sin(2 * phase) +
        0.09 * Math.sin(3 * phase) +
        0.04 * Math.sin(4 * phase);

      samples[startSample + i] += ev.amp * env * wave;
    }
  }

  // Encode 16-bit mono PCM WAV
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // 16-bit
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-0.98, Math.min(0.98, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return {
    blob,
    duration,
    size: buffer.byteLength,
  };
}
