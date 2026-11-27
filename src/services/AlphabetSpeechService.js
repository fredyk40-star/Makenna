/**
 * AlphabetSpeechService - reliable child-friendly pronunciation.
 *
 * Speech synthesis voices load asynchronously in many browsers. This wrapper
 * waits for voices, prefers clear English voices, sequences multi-part prompts
 * (sound -> word), and resolves only after speech finishes so progress tracking
 * reflects what the child actually heard.
 */
import { isBenignSpeechError } from '../utils/speech';

export class AlphabetSpeechService {
  constructor() {
    this._voice = null;
    this._initialized = false;
    this._activeSpeech = null;
    this._sequenceId = 0;
    this._sequenceWait = null;
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

  _clearSequenceWait() {
    if (!this._sequenceWait) return;
    clearTimeout(this._sequenceWait.timer);
    this._sequenceWait.resolve();
    this._sequenceWait = null;
  }

  _cancelActive() {
    const synth = typeof window !== 'undefined'
      ? window.speechSynthesis || window.webkitSpeechSynthesis
      : null;
    const active = this._activeSpeech;
    this._activeSpeech = null;
    if (active) {
      clearTimeout(active.timer);
      active.finish(false);
    }
    if (typeof synth?.cancel === 'function') synth.cancel();
  }

  cancel() {
    this._sequenceId += 1;
    this._clearSequenceWait();
    this._cancelActive();
  }

  speak(text, options = {}) {
    const content = String(text || '').trim();
    if (!content || !this.isSupported()) return Promise.resolve(false);
    this._sequenceId += 1;
    this._clearSequenceWait();
    this._cancelActive();

    return this._speak(content, options);
  }

  _speak(content, options = {}) {
    if (!content || !this.isSupported()) return Promise.resolve(false);

    const {
      rate = 0.85,
      pitch = 1.05,
      volume = 1,
      lang = 'en-US',
    } = options;

    return new Promise((resolve) => {
      let active;
      try {
        const synth = window.speechSynthesis || window.webkitSpeechSynthesis;
        const Utterance = window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance;
        if (!synth || !Utterance) {
          resolve(false);
          return;
        }
        const utterance = new Utterance(content);

        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        utterance.lang = lang;
        const voice = this.getVoice();
        if (voice) utterance.voice = voice;

        let settled = false;
        const finish = (ok) => {
          if (settled) return;
          settled = true;
          clearTimeout(active.timer);
          if (this._activeSpeech === active) this._activeSpeech = null;
          resolve(ok);
        };

        active = { utterance, timer: null, finish };
        this._activeSpeech = active;
        const fallbackMs = Math.min(120000, Math.max(2500, (content.length * 110) / rate + 900));
        active.timer = setTimeout(() => {
          if (this._activeSpeech !== active) return;
          if (synth.speaking || synth.pending) {
            console.warn('Alphabet speech did not finish before timeout');
            this._cancelActive();
          } else {
            finish(true);
          }
        }, fallbackMs);

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
        if (active) active.finish(false);
        else resolve(false);
      }
    });
  }

  async speakSequence(items, options = {}) {
    if (!this.isSupported()) return false;
    const { gap = 250 } = options;
    const parts = Array.isArray(items) ? items : [items];
    this.cancel();
    const sequenceId = this._sequenceId;

    for (let index = 0; index < parts.length; index += 1) {
      if (sequenceId !== this._sequenceId) return false;
      const item = parts[index];
      const text = typeof item === 'string' ? item : item?.text;
      const spoken = await this._speak(String(text || '').trim(), typeof item === 'string' ? options : item);
      if (!spoken || sequenceId !== this._sequenceId) return false;
      if (index < parts.length - 1 && gap > 0) {
        await new Promise(resolve => {
          const wait = {
            timer: setTimeout(() => {
              if (this._sequenceWait === wait) this._sequenceWait = null;
              resolve();
            }, gap),
            resolve,
          };
          this._sequenceWait = wait;
        });
      }
    }

    return sequenceId === this._sequenceId;
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
