/**
 * VoiceGuideService - Text-to-speech wrapper with full control
 * Provides a reusable voice guidance system for the learning app
 */
import { isBenignSpeechError, reportSpeechError } from '../utils/speech';

export class VoiceGuideService {
  /**
   * Check if speech synthesis is supported in this browser
   */
  static isSupported() {
    return typeof window !== 'undefined' && 
           ('speechSynthesis' in window || 'webkitSpeechSynthesis' in window);
  }

  constructor() {
    this.synth = typeof window !== 'undefined'
      ? window.speechSynthesis || window.webkitSpeechSynthesis
      : null;
    this.utterance = null;
    this._muted = false;
    this._rate = 0.9;
    this._pitch = 1.1;
    this._volume = 1;
    this._voice = null;
    this._onEnd = null;
    this._onStart = null;
    this._onError = null;
    this._voicesLoaded = false;
    this._queued = [];
    this._speaking = false;
    this._initialized = false;
    this._speechGeneration = 0;
    this._repeatGeneration = 0;
    this._repeatTimer = null;
  }

  /**
   * Initialize the service and load voices
   */
  init() {
    if (!this.synth) {
      console.warn('Speech synthesis not supported');
      return;
    }
    // Load voices
    const loadVoices = () => {
      const voices = typeof this.synth.getVoices === 'function' ? this.synth.getVoices() : [];
      if (voices.length > 0) {
        // Prefer a friendly female voice
        this._voice = voices.find(v => 
          v.lang.startsWith('en') && v.name.includes('Female')
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        this._voicesLoaded = true;
      }
    };
    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Speak text with optional callback
   */
  speak(text, options = {}) {
    if (!this.synth || this._muted || !String(text || '').trim()) return false;
    this._cancelRepeat();
    return this._startSpeech(text, options);
  }

  _startSpeech(text, options = {}, processQueue = true) {
    const {
      rate = this._rate,
      pitch = this._pitch,
      volume = this._volume,
    } = options;

    const generation = ++this._speechGeneration;
    this.utterance = null;
    this._speaking = false;
    this.synth.cancel();

    const Utterance = window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance;
    if (!Utterance) {
      const error = new Error('Speech synthesis is not supported');
      reportSpeechError(error);
      options.onError?.(error);
      return false;
    }

    const utterance = new Utterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    if (this._voice) utterance.voice = this._voice;
    utterance.lang = 'en-US';
    this.utterance = utterance;

    const isCurrent = () =>
      generation === this._speechGeneration && this.utterance === utterance;

    utterance.onend = () => {
      if (!isCurrent()) return;
      this._speaking = false;
      this.utterance = null;
      try {
        options.onEnd?.();
        this._onEnd?.();
      } finally {
        if (processQueue && generation === this._speechGeneration) this._processQueue();
      }
    };

    utterance.onstart = () => {
      if (!isCurrent()) return;
      this._speaking = true;
      options.onStart?.();
      this._onStart?.();
    };

    utterance.onerror = (errorEvent) => {
      if (!isCurrent()) return;
      this._speaking = false;
      this.utterance = null;
      reportSpeechError(errorEvent);
      try {
        if (!isBenignSpeechError(errorEvent)) {
          options.onError?.(errorEvent);
          this._onError?.(errorEvent);
        }
      } finally {
        if (processQueue && generation === this._speechGeneration) this._processQueue();
      }
    };

    try {
      this.synth.speak(utterance);
      return true;
    } catch (error) {
      if (isCurrent()) {
        this._speaking = false;
        this.utterance = null;
      }
      reportSpeechError(error);
      options.onError?.(error);
      if (processQueue && generation === this._speechGeneration) this._processQueue();
      return false;
    }
  }

  /**
   * Speak text multiple times (for celebration announcements)
   */
  speakRepeated(text, times = 3, options = {}) {
    const repeatCount = Math.floor(Number(times));
    if (!this.synth || this._muted || !String(text || '').trim() || repeatCount < 1) return false;

    this._cancelRepeat();
    const repeatGeneration = this._repeatGeneration;
    let count = 0;
    const speakNext = () => {
      if (repeatGeneration !== this._repeatGeneration) return;
      count += 1;
      this._startSpeech(text, {
          ...options,
          onEnd: () => {
            if (repeatGeneration !== this._repeatGeneration) return;
            if (count < repeatCount) {
              this._repeatTimer = setTimeout(() => {
                this._repeatTimer = null;
                speakNext();
              }, 500);
            } else {
              try {
                options.onEnd?.();
              } finally {
                if (repeatGeneration === this._repeatGeneration) this._processQueue();
              }
            }
          },
          onError: (e) => {
            this._cancelRepeat();
            try {
              options.onError?.(e);
            } finally {
              this._processQueue();
            }
          },
        }, false);
    };
    speakNext();
    return true;
  }

  _cancelRepeat() {
    this._repeatGeneration += 1;
    if (this._repeatTimer !== null) {
      clearTimeout(this._repeatTimer);
      this._repeatTimer = null;
    }
  }

  /**
   * Queue a message to speak after current one finishes
   */
  queue(text, options = {}) {
    this._queued.push({ text, options });
    if (!this.isSpeaking()) {
      this._processQueue();
    }
  }

  /**
   * Process queued messages
   */
  _processQueue() {
    if (this._queued.length > 0 && !this.isSpeaking()) {
      const next = this._queued.shift();
      this.speak(next.text, next.options);
    }
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  /**
   * Resume speech
   */
  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Cancel all speech
   */
  cancel() {
    this._speechGeneration += 1;
    this._cancelRepeat();
    this.utterance = null;
    if (this.synth) {
      this.synth.cancel();
    }
    this._speaking = false;
    this._queued = [];
  }

  /**
   * Set speech rate
   */
  setRate(rate) {
    this._rate = Math.max(0.1, Math.min(2, rate));
  }

  /**
   * Set speech pitch
   */
  setPitch(pitch) {
    this._pitch = Math.max(0.1, Math.min(2, pitch));
  }

  /**
   * Mute/unmute
   */
  setMuted(muted) {
    this._muted = muted;
    if (muted) this.cancel();
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.setMuted(!this._muted);
    return this._muted;
  }

  /**
   * Check if currently speaking
   */
  isSpeaking() {
    return this._speaking || this._repeatTimer !== null || Boolean(
      this.synth && (this.synth.speaking || this.synth.pending || this.synth.paused),
    );
  }

  /**
   * Check if muted
   */
  isMuted() {
    return this._muted;
  }

  /**
   * Get current rate
   */
  getRate() {
    return this._rate;
  }

  /**
   * Greet a child by name
   */
  greetChild(name, options = {}) {
    const greetings = [
      `Hello ${name}! Welcome to Makenna Learning Lab!`,
      `Hi ${name}! Are you ready to learn something fun today?`,
      `Hey ${name}! Let's have some fun learning!`,
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    return this.speak(greeting, options);
  }

  /**
   * Encourage a child
   */
  encourage(options = {}) {
    const messages = [
      'Great job! Keep going!',
      'You are doing amazing!',
      'Wonderful work!',
      'Fantastic! You are so smart!',
      'Excellent! Keep it up!',
      'You are a star learner!',
      'Brilliant! Well done!',
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    return this.speak(message, options);
  }

  /**
   * Play error sound/voice
   */
  playError(options = {}) {
    return this.speak('Oops! Let me try again.', { pitch: 0.8, rate: 0.8, ...options });
  }

  /**
   * Play success sound/voice
   */
  playSuccess(options = {}) {
    return this.speak('Yay! That is correct!', { pitch: 1.2, rate: 1.1, ...options });
  }

  /**
   * Read a lesson or story text
   */
  readText(text, options = {}) {
    this.speak(text, { rate: 0.8, pitch: 1, ...options });
  }

  /**
   * Clean up
   */
  destroy() {
    this.cancel();
    this.synth = null;
    this.utterance = null;
  }
}

// Singleton instance
export const voiceGuide = new VoiceGuideService();