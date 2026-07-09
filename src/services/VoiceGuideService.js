/**
 * VoiceGuideService - Text-to-speech wrapper with full control
 * Provides a reusable voice guidance system for the learning app
 */
export class VoiceGuideService {
  /**
   * Check if speech synthesis is supported in this browser
   */
  static isSupported() {
    return typeof window !== 'undefined' && 
           ('speechSynthesis' in window || 'webkitSpeechSynthesis' in window);
  }

  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
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
      const voices = this.synth.getVoices();
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
    if (!this.synth || this._muted || !text) return;

    const {
      rate = this._rate,
      pitch = this._pitch,
      volume = this._volume,
      onEnd,
      onStart,
      onError,
    } = options;

    // Cancel any current speech
    this.synth.cancel();

    const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance;
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = rate;
    this.utterance.pitch = pitch;
    this.utterance.volume = volume;
    if (this._voice) this.utterance.voice = this._voice;
    this.utterance.lang = 'en-US';

    this.utterance.onend = () => {
      this._speaking = false;
      if (onEnd) onEnd();
      if (this._onEnd) this._onEnd();
      this._processQueue();
    };

    this.utterance.onstart = () => {
      this._speaking = true;
      if (onStart) onStart();
      if (this._onStart) this._onStart();
    };

     this.utterance.onerror = (e) => {
       this._speaking = false;
       // Handle autoplay policy blocked error gracefully
       if (e.error === 'not-allowed') {
         console.warn('Speech synthesis blocked by browser - requires user interaction');
       } else {
         console.warn('Speech error:', e);
       }
       if (onError) onError(e);
       if (this._onError) this._onError(e);
       this._processQueue();
     };

    this.synth.speak(this.utterance);
  }

  /**
   * Speak text multiple times (for celebration announcements)
   */
  speakRepeated(text, times = 3, options = {}) {
    let count = 0;
    const speakNext = () => {
      if (count < times) {
        count++;
        this.speak(text, {
          ...options,
          onEnd: () => {
            if (count < times) {
              setTimeout(speakNext, 500);
            } else {
              if (options.onEnd) options.onEnd();
            }
          },
          onError: (e) => {
            if (options.onError) options.onError(e);
          },
        });
      }
    };
    speakNext();
  }

  /**
   * Queue a message to speak after current one finishes
   */
  queue(text, options = {}) {
    this._queued.push({ text, options });
    if (!this._speaking) {
      this._processQueue();
    }
  }

  /**
   * Process queued messages
   */
  _processQueue() {
    if (this._queued.length > 0 && !this._speaking) {
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
    return this._speaking || (this.synth && this.synth.speaking);
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
  greetChild(name) {
    const greetings = [
      `Hello ${name}! Welcome to Makenna Learning Lab!`,
      `Hi ${name}! Are you ready to learn something fun today?`,
      `Hey ${name}! Let's have some fun learning!`,
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    this.speak(greeting);
  }

  /**
   * Encourage a child
   */
  encourage() {
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
    this.speak(message);
  }

  /**
   * Play error sound/voice
   */
  playError() {
    this.speak('Oops! Let me try again.', { pitch: 0.8, rate: 0.8 });
  }

  /**
   * Play success sound/voice
   */
  playSuccess() {
    this.speak('Yay! That is correct!', { pitch: 1.2, rate: 1.1 });
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