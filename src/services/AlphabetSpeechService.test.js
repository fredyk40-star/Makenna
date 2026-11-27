import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlphabetSpeechService } from './AlphabetSpeechService';

describe('AlphabetSpeechService cancellation', () => {
  let utterances;
  let synthesis;
  let service;

  afterEach(() => {
    service?.cancel();
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
    };
    vi.stubGlobal('speechSynthesis', synthesis);
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      constructor(text) {
        this.text = text;
      }
    });
    service = new AlphabetSpeechService();
  };

  it('resolves an active utterance as cancelled', async () => {
    createService();
    const speech = service.speak('A');

    service.cancel();

    await expect(speech).resolves.toBe(false);
    expect(synthesis.cancel).toHaveBeenCalled();
  });

  it('does not continue the next part of a cancelled sequence', async () => {
    createService();
    const sequence = service.speakSequence(['A', 'Apple'], { gap: 0 });

    utterances[0].onend();
    await vi.waitFor(() => expect(synthesis.speak).toHaveBeenCalledTimes(2));
    service.cancel();

    await expect(sequence).resolves.toBe(false);
    expect(synthesis.speak).toHaveBeenCalledTimes(2);
  });
});
