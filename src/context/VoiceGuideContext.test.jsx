import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const voiceGuide = vi.hoisted(() => ({
  cancel: vi.fn(),
  encourage: vi.fn(),
  greetChild: vi.fn(),
  init: vi.fn(),
  playError: vi.fn(),
  playSuccess: vi.fn(),
  resume: vi.fn(),
  setRate: vi.fn(),
  speak: vi.fn(),
  speakRepeated: vi.fn(),
  toggleMute: vi.fn(),
  pause: vi.fn(),
}));

vi.mock('../services/VoiceGuideService', () => ({ voiceGuide }));

import { VoiceGuideProvider, useVoiceGuide } from './VoiceGuideContext';

describe('VoiceGuideProvider speech state', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('tracks actual utterance callbacks and ignores callbacks from replaced speech', () => {
    const callbacks = [];
    voiceGuide.speak.mockImplementation((text, options) => {
      callbacks.push(options);
      return true;
    });

    const { result } = renderHook(() => useVoiceGuide(), {
      wrapper: VoiceGuideProvider,
    });

    act(() => result.current.speak('First'));
    act(() => result.current.speak('Second'));
    act(() => callbacks[0].onStart());
    act(() => callbacks[0].onEnd());
    expect(result.current.isSpeaking).toBe(false);

    act(() => callbacks[1].onStart());
    expect(result.current.isSpeaking).toBe(true);
    act(() => callbacks[1].onEnd());
    expect(result.current.isSpeaking).toBe(false);
  });
});
