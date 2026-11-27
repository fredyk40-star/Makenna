import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cancel: vi.fn(),
  pronounceWord: vi.fn(),
  speak: vi.fn(),
  speakSequence: vi.fn(),
}));

vi.mock('../services/AlphabetSpeechService', () => ({
  default: mocks,
}));

import { usePhonics } from './usePhonics';

describe('usePhonics speech controls', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('stops an active sequence without letting its completion reset a newer run', async () => {
    let finishSequence;
    mocks.speakSequence.mockImplementation(() => new Promise(resolve => {
      finishSequence = resolve;
    }));
    const { result } = renderHook(() => usePhonics());
    let playback;

    act(() => {
      playback = result.current.playWordWithSound('a');
    });
    expect(result.current.isPlaying).toBe(true);

    act(() => result.current.stop());
    expect(result.current.isPlaying).toBe(false);
    expect(mocks.cancel).toHaveBeenCalledOnce();

    await act(async () => {
      finishSequence(false);
      await expect(playback).resolves.toBe(false);
    });
    expect(result.current.isPlaying).toBe(false);
  });
});
