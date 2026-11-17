import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeVietnamese,
  matchesSearch,
  calculateDuckedVolume,
  splitTextForTTS,
  parseMediaUrl,
  formatDuration,
  formatBytes,
  deduplicateTracks,
  validateEmailAndPassword,
  resolveSyncConflict,
  validateRegistrationInput,
  validatePasswordChangeInput,
} from './studioLogic';
import { Track } from '../types/studio';

test('normalizeVietnamese strips accents and handles đ/Đ properly', () => {
  assert.equal(normalizeVietnamese('Tây Tiến – Quang Dũng'), 'tay tien – quang dung');
  assert.equal(normalizeVietnamese('Đất Nước - Nguyễn Khoa Điềm'), 'dat nuoc - nguyen khoa diem');
  assert.equal(normalizeVietnamese('Ai đã đặt tên cho dòng sông?'), 'ai da dat ten cho dong song?');
});

test('matchesSearch supports unaccented Vietnamese queries across strings and tag arrays', () => {
  assert.equal(
    matchesSearch('tay tien', 'Tây Tiến', 'Quang Dũng', ['Thơ kháng chiến', 'Tây Bắc']),
    true
  );
  assert.equal(matchesSearch('quang dung', 'Tây Tiến', 'Quang Dũng'), true);
  assert.equal(matchesSearch('xuan quynh', 'Tây Tiến', 'Quang Dũng'), false);
});

test('calculateDuckedVolume reduces volume to 20% of master during TTS ducking without mutating master', () => {
  assert.equal(calculateDuckedVolume(80, false, 20, false), 0.8);
  assert.equal(calculateDuckedVolume(80, true, 20, false), 0.16);
  assert.equal(calculateDuckedVolume(80, true, 20, true), 0);
});

test('splitTextForTTS splits poetry line-by-line and prose by sentences', () => {
  const poem = `Line 1\nLine 2\nLine 3\nLine 4`;
  const poetryChunks = splitTextForTTS(poem, 'poetry', 120);
  assert.equal(poetryChunks.length, 4);
  assert.equal(poetryChunks[0], 'Line 1');

  const prose =
    'Câu văn thứ nhất giải thích bối cảnh lịch sử. Câu văn thứ hai phân tích nghệ thuật miêu tả tâm lý nhân vật.';
  const proseChunks = splitTextForTTS(prose, 'prose', 60);
  assert.equal(proseChunks.length >= 2, true);
});

test('parseMediaUrl distinguishes direct MP3, direct MP4, YouTube embed, and unsupported URLs', () => {
  const mp3 = parseMediaUrl('https://example.com/audio/nhac-nen-piano.mp3');
  assert.equal(mp3.type, 'mp3');

  const mp4 = parseMediaUrl('https://example.com/video/bai-giang-tay-tien.mp4');
  assert.equal(mp4.type, 'mp4');

  const yt = parseMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(yt.type, 'youtube');
  assert.equal(yt.videoId, 'dQw4w9WgXcQ');
  assert.equal(yt.embedUrl, 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0');

  const invalid = parseMediaUrl('https://facebook.com/some-random-post');
  assert.equal(invalid.type, 'unsupported');
});

test('formatDuration and formatBytes format numbers accurately', () => {
  assert.equal(formatDuration(125), '02:05');
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatBytes(512000), '500 KB');
  assert.equal(formatBytes(2 * 1024 * 1024), '2.00 MB');
});

test('deduplicateTracks skips duplicate files with same normalized title and byte size', () => {
  const existing: Track[] = [
    {
      id: '1',
      title: 'Đêm Sông Đà',
      artist: 'Literature Studio',
      category: 'Piano',
      duration: 18,
      size: 102400,
      addedAt: '2026-01-01',
      sourceType: 'uploaded-file',
    },
  ];
  const incoming: Track[] = [
    {
      id: '2',
      title: 'Dem Song Da',
      artist: 'Other',
      category: 'Piano',
      duration: 18,
      size: 102400,
      addedAt: '2026-01-02',
      sourceType: 'uploaded-folder',
    },
    {
      id: '3',
      title: 'Trăng Tả Khuông',
      artist: 'Literature Studio',
      category: 'Sáo trúc',
      duration: 20,
      size: 204800,
      addedAt: '2026-01-02',
      sourceType: 'uploaded-folder',
    },
  ];
  const res = deduplicateTracks(existing, incoming);
  assert.equal(res.skippedCount, 1);
  assert.equal(res.added.length, 1);
  assert.equal(res.added[0].title, 'Trăng Tả Khuông');
});

test('validateEmailAndPassword validates Vietnamese auth rules', () => {
  assert.equal(validateEmailAndPassword('invalid-email', '123456').valid, false);
  assert.equal(validateEmailAndPassword('hocsinh@edu.vn', '123').valid, false);
  assert.equal(validateEmailAndPassword('hocsinh@edu.vn', 'matkhau123').valid, true);
});

test('resolveSyncConflict never overwrites newer state with older state', () => {
  const older = { updatedAt: '2026-10-01T10:00:00.000Z', syncVersion: 2, data: 'old' };
  const newer = { updatedAt: '2026-10-02T10:00:00.000Z', syncVersion: 3, data: 'new' };

  const res1 = resolveSyncConflict(older, newer);
  assert.equal(res1.winner, 'remote');
  assert.equal(res1.resolved.data, 'new');

  const res2 = resolveSyncConflict(newer, older);
  assert.equal(res2.winner, 'local');
  assert.equal(res2.resolved.data, 'new');
});

test('validateRegistrationInput validates username, email, password, and confirmPassword', () => {
  assert.equal(
    validateRegistrationInput('ab', 'hocsinh@edu.vn', 'matkhau123', 'matkhau123').valid,
    false
  );
  assert.equal(
    validateRegistrationInput('lecongvinh', 'hocsinh@edu.vn', 'matkhau123', 'khacnhau').valid,
    false
  );
  assert.equal(
    validateRegistrationInput('lecongvinh', 'hocsinh@edu.vn', 'matkhau123', 'matkhau123').valid,
    true
  );
});

test('validatePasswordChangeInput validates current, new, and confirmation passwords', () => {
  assert.equal(validatePasswordChangeInput('', 'newpass123', 'newpass123').valid, false);
  assert.equal(validatePasswordChangeInput('oldpass', '123', '123').valid, false);
  assert.equal(validatePasswordChangeInput('oldpass', 'newpass123', 'mismatch').valid, false);
  assert.equal(validatePasswordChangeInput('samepass', 'samepass', 'samepass').valid, false);
  assert.equal(validatePasswordChangeInput('oldpass123', 'newpass456', 'newpass456').valid, true);
});
