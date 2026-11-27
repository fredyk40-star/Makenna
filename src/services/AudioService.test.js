import { afterEach, describe, expect, it, vi } from 'vitest';
import audioService from './AudioService';

describe('AudioService speech synthesis', () => {
  let utterances;
  let synthesis;

  afterEach(() => {
    audioService.stop();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const stubSpeechSynthesis = () => {
    utterances = [];
    synthesis = {
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
      pause: vi.fn(),
      resume: vi.fn(),
      speak: vi.fn(utterance => utterances.push(utterance)),
      paused: false,
    };
    vi.stubGlobal('speechSynthesis', synthesis);
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      constructor(text) {
        this.text = text;
      }
    });
  };

  it('resolves only after the utterance finishes', async () => {
    stubSpeechSynthesis();
    const onEnd = vi.fn();
    let result;

    const speech = audioService.speak('Hello there!', { onEnd }).then(value => {
      result = value;
    });

    expect(synthesis.speak).toHaveBeenCalledOnce();
    expect(result).toBeUndefined();
    utterances[0].onend();
    await speech;

    expect(result).toBe(true);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('resolves as cancelled when stopped before the utterance ends', async () => {
    stubSpeechSynthesis();
    const onEnd = vi.fn();
    const speech = audioService.speak('Hello there!', { onEnd });

    audioService.stop();

    await expect(speech).resolves.toBe(false);
    expect(onEnd).not.toHaveBeenCalled();
    expect(synthesis.cancel).toHaveBeenCalled();
  });
});
