/**
 * AlphabetSpeechService - reliable child-friendly pronunciation.
 *
 * Speech synthesis voices load asynchronously in many browsers. This wrapper
 * waits for voices, prefers clear English voices, sequences multi-part prompts
 * (sound -> word), and resolves only after speech finishes so progress tracking
 * reflects what the child actually heard.
 */
import { isBenignSpeechError } from '../utils/speech';

const delay = ms => new Promise(resolve => { setTimeout(resolve, ms); });

class AlphabetSpeechService {
  constructor() {
    this._voice = null;
    this._initialized = false;
    this.init();
  }

  isSupported() {
    return typeof window !== 'undefined' && (
      'speechSynthesis' in window ||
      'webkitSpeechSynthesis' in window
    );
  }

  init() {
    if (this._initialized || !this.isSupported()) return;
    this._initialized = true;

    const synth = window.speechSynthesis || window.webkitSpeechSynthesis;
    const loadVoices = () => {
      const voices = typeof synth.getVoices === 'function' ? synth.getVoices() : [];
      if (!voices.length) return;

      this._voice = voices.find(v => v.lang?.startsWith('en') && /female|samantha|zira|google uk english/i.test(v.name))
        || voices.find(v => v.lang?.startsWith('en'))
        || voices[0];
    };

    loadVoices();
    if ('onvoiceschanged' in synth) synth.onvoiceschanged = loadVoices;
  }

  getVoice() {
    this.init();
    const synth = window.speechSynthesis || window.webkitSpeechSynthesis;
    const voices = typeof synth?.getVoices === 'function' ? synth.getVoices() : [];
    if (!this._voice && voices.length) {
      this._voice = voices.find(v => v.lang?.startsWith('en')) || voices[0];
    }
    return this._voice;
  }

  cancel() {
    if (!this.isSupported()) return;
    const synth = window.speechSynthesis || window.webkitSpeechSynthesis;
    if (typeof synth.cancel === 'function') synth.cancel();
  }

  speak(text, options = {}) {
    const content = String(text || '').trim();
    if (!content || !this.isSupported()) return Promise.resolve(false);

    const {
      rate = 0.85,
      pitch = 1.05,
      volume = 1,
      lang = 'en-US',
    } = options;

    return new Promise((resolve) => {
      try {
        this.cancel();
        const synth = window.speechSynthesis || window.webkitSpeechSynthesis;
        const Utterance = window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance;
        const utterance = new Utterance(content);

        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        utterance.lang = lang;
        const voice = this.getVoice();
        if (voice) utterance.voice = voice;

        let settled = false;
        // Some mobile browsers never fire onend for short utterances. A bounded
        // fallback keeps the UI responsive and still lets progress be recorded.
        const fallbackMs = Math.min(12000, Math.max(2500, (content.length * 110) / rate + 900));
        const timer = setTimeout(() => finish(true), fallbackMs);

        const finish = (ok) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(ok);
        };

        utterance.onend = () => finish(true);
        utterance.onerror = (event) => {
          finish(false);
          if (!isBenignSpeechError(event)) {
            console.warn('Alphabet speech failed:', event?.error || event);
          }
        };

        synth.speak(utterance);
      } catch (error) {
        console.warn('Alphabet speech unavailable:', error);
        resolve(false);
      }
    });
  }

  async speakSequence(items, options = {}) {
    const { gap = 250 } = options;
    const parts = Array.isArray(items) ? items : [items];
    let allSpoken = true;

    for (let index = 0; index < parts.length; index += 1) {
      const item = parts[index];
      const text = typeof item === 'string' ? item : item?.text;
      const spoken = await this.speak(text, typeof item === 'string' ? options : item);
      if (!spoken) allSpoken = false;
      if (index < parts.length - 1 && gap > 0) await delay(gap);
    }

    return allSpoken;
  }

  pronounceWord(word, options = {}) {
    return this.speakSequence([
      { text: word, rate: 0.75, pitch: 1.05 },
      { text: word, rate: 0.9, pitch: 1.05 },
    ], { gap: 350, ...options });
  }
}

export const alphabetSpeech = new AlphabetSpeechService();
export default alphabetSpeech;
