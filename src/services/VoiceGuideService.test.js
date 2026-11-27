import { afterEach, describe, expect, it, vi } from 'vitest';
import { VoiceGuideService } from './VoiceGuideService';

describe('VoiceGuideService speech lifecycle', () => {
  let utterances;
  let synthesis;
  let service;

  afterEach(() => {
    service?.cancel();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const createService = () => {
    utterances = [];
    synthesis = {
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
      speak: vi.fn(utterance => utterances.push(utterance)),
      speaking: false,
      pending: false,
      paused: false,
    };
    vi.stubGlobal('speechSynthesis', synthesis);
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      constructor(text) {
        this.text = text;
      }
    });
    service = new VoiceGuideService();
  };

  it('ignores callbacks from an utterance replaced by newer speech', () => {
    createService();
    const oldOnEnd = vi.fn();
    service.speak('Old', { onEnd: oldOnEnd });
    const oldUtterance = utterances[0];
    service.speak('New');
    const newUtterance = utterances[1];

    newUtterance.onstart();
    oldUtterance.onend();

    expect(oldOnEnd).not.toHaveBeenCalled();
    expect(service.isSpeaking()).toBe(true);

    newUtterance.onend();
    expect(service.isSpeaking()).toBe(false);
  });

  it('clears scheduled repeats when cancelled', async () => {
    vi.useFakeTimers();
    createService();
    service.speakRepeated('Again', 3);

    utterances[0].onend();
    expect(service.isSpeaking()).toBe(true);
    service.cancel();
    await vi.advanceTimersByTimeAsync(500);

    expect(synthesis.speak).toHaveBeenCalledOnce();
    expect(service.isSpeaking()).toBe(false);
  });
});
