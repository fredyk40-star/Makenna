import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import audioService from '../services/AudioService';
import { useAudio } from './useAudio';

describe('useAudio text-to-speech playback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses speech synthesis for TTS requests instead of loading a dummy audio buffer', async () => {
    const loadAudio = vi.spyOn(audioService, 'loadAudio');
    const speak = vi.spyOn(audioService, 'speak').mockResolvedValue(true);
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('', { useTTS: true, text: 'Hello there!' });
    });

    expect(speak).toHaveBeenCalledWith(
      'Hello there!',
      expect.objectContaining({ rate: 0.9, pitch: 1.1 }),
    );
    expect(loadAudio).not.toHaveBeenCalled();
  });

  it('speaks the fallback text when an audio file cannot be loaded', async () => {
    const loadAudio = vi.spyOn(audioService, 'loadAudio').mockRejectedValue(new Error('offline'));
    const speak = vi.spyOn(audioService, 'speak').mockResolvedValue(true);
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('/lesson.mp3', { fallbackText: 'Let us learn.' });
    });

    expect(loadAudio).toHaveBeenCalledWith('/lesson.mp3', { fallbackText: 'Let us learn.' });
    expect(speak).toHaveBeenCalledWith(
      'Let us learn.',
      expect.objectContaining({ rate: 0.9, pitch: 1.1 }),
    );
  });
});
