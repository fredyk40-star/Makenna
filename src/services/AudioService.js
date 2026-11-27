/**
 * Audio Service - Core audio engine for Makenna Learning Lab
 * Supports: Play, Pause, Replay, Queue, Preload, Offline Caching
 */
import { isBenignSpeechError } from '../utils/speech';

class AudioService {
  constructor() {
    this.audioContext = null;
    this.currentAudio = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.volume = 1;
    this.muted = false;
    this.playbackRate = 1;
    this.currentSource = null;
    this.analyser = null;
    this.dataArray = null;
    this.audioCache = new Map();
    this.eventListeners = new Map();

    // Initialize audio context on user interaction
    this.initAudioContext();
  }

  /**
   * Initialize Audio Context (must be called on user gesture)
   */
  initAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
    return this.audioContext;
  }

  /**
   * Resume audio context (needed after user interaction)
   */
  async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Load an audio file into an AudioBuffer.
   */
  async loadAudio(source, options = {}) {
    if (options.useTTS) {
      throw new Error('Text-to-speech cannot be loaded as an audio buffer. Use the speak method instead.');
    }

    // Check cache first
    if (this.audioCache.has(source)) {
      return this.audioCache.get(source);
    }

    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Audio request failed (${response.status}).`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Cache for offline use
      this.audioCache.set(source, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw error;
    }
  }

  /**
   * Play audio with options
   */
  async play(audioBuffer, options = {}) {
    await this.resumeContext();

    const {
      volume = this.volume,
      playbackRate = this.playbackRate,
      loop = false,
      onEnd = null,
      onStart = null,
      onError = null
    } = options;

    // Stop current audio if playing
    this.stop();

    if (!this.audioContext) {
      this.initAudioContext();
    }

    try {
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.playbackRate.value = playbackRate;
      this.currentSource.loop = loop;

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.muted ? 0 : volume;

      // Connect nodes
      this.currentSource.connect(gainNode);
      gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.currentAudio = {
        source: this.currentSource,
        gainNode,
        audioBuffer,
        options
      };

      this.isPlaying = true;
      this.isPaused = false;

      // Event handlers
      this.currentSource.onended = () => {
        this.isPlaying = false;
        if (onEnd) onEnd();
        this.processQueue();
      };

      if (onStart) onStart();

      this.currentSource.start(0);
      return true;
    } catch (error) {
      console.error('Play error:', error);
      if (onError) onError(error);
      return false;
    }
  }

  /**
   * Play text using TTS
   */
  async speak(text, options = {}) {
    const {
      rate = 0.9,
      pitch = 1.1,
      volume = this.volume,
      onEnd = null,
      onStart = null,
      onError = null
    } = options;

    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      if (onError) onError(new Error('Speech synthesis not supported'));
      return false;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const Utterance = window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance;
    if (!Utterance) {
      const error = new Error('Speech synthesis is not supported');
      if (onError) onError(error);
      return false;
    }

    const utterance = new Utterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = this.muted ? 0 : volume;

    // Try to find a kid-friendly voice
    const voices = window.speechSynthesis.getVoices();
    const kidFriendlyVoice = voices.find(v =>
      v.name.includes('Female') ||
      v.name.includes('Samantha') ||
      v.name.includes('Google UK English Female') ||
      v.name.includes('Microsoft Zira')
    );
    if (kidFriendlyVoice) {
      utterance.voice = kidFriendlyVoice;
    }

    utterance.onstart = () => {
      this.isPlaying = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isPlaying = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (error) => {
      this.isPlaying = false;
      if (isBenignSpeechError(error)) return;
      if (onError) onError(error);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  /**
   * Pause current audio
   */
  pause() {
    if (this.isPlaying && this.currentSource) {
      this.currentSource.stop();
      this.isPaused = true;
      this.isPlaying = false;
    }
  }

  /**
   * Resume paused audio
   */
  resume() {
    if (this.isPaused && this.currentAudio) {
      // Recreate source from buffer
      const { audioBuffer, options } = this.currentAudio;
      this.play(audioBuffer, {
        ...options,
        onEnd: options.onEnd
      });
      this.isPaused = false;
    }
  }

  /**
   * Stop current audio
   */
  stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (error) {
        // Ignore errors on stop
      }
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentAudio = null;
    this.currentSource = null;
  }

  /**
   * Queue audio for sequential playback
   */
  queue(audioBuffer, options = {}) {
    this.audioQueue.push({ audioBuffer, options });
    if (!this.isPlaying) {
      this.processQueue();
    }
  }

  /**
   * Process audio queue
   */
  processQueue() {
    if (this.audioQueue.length === 0) return;

    const item = this.audioQueue.shift();
    this.play(item.audioBuffer, {
      ...item.options,
      onEnd: () => {
        this.processQueue();
        if (item.options.onEnd) item.options.onEnd();
      }
    });
  }

  /**
   * Clear audio queue
   */
  clearQueue() {
    this.audioQueue = [];
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio?.gainNode) {
      this.currentAudio.gainNode.gain.value = this.muted ? 0 : this.volume;
    }
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.muted = !this.muted;
    if (this.currentAudio?.gainNode) {
      this.currentAudio.gainNode.gain.value = this.muted ? 0 : this.volume;
    }
    return this.muted;
  }

  /**
   * Set playback rate (0.5 - 2.0)
   */
  setPlaybackRate(rate) {
    this.playbackRate = Math.max(0.5, Math.min(2, rate));
    if (this.currentSource) {
      this.currentSource.playbackRate.value = this.playbackRate;
    }
  }

  /**
   * Get waveform data for visualization
   */
  getWaveformData() {
    if (!this.analyser) return null;
    this.analyser.getByteTimeDomainData(this.dataArray);
    return this.dataArray;
  }

  /**
   * Get frequency data for visualization
   */
  getFrequencyData() {
    if (!this.analyser) return null;
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  /**
   * Preload audio for offline use
   */
  async preloadAudio(sources) {
    const promises = sources.map(async (source) => {
      try {
        const response = await fetch(source);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.audioCache.set(source, audioBuffer);
        return { source, success: true };
      } catch (error) {
        console.warn(`Failed to preload ${source}:`, error);
        return { source, success: false };
      }
    });
    return Promise.all(promises);
  }

  /**
   * Get cache status
   */
  getCacheStatus() {
    return {
      size: this.audioCache.size,
      keys: Array.from(this.audioCache.keys())
    };
  }

  /**
   * Clear audio cache
   */
  clearCache() {
    this.audioCache.clear();
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    this.clearQueue();
    this.audioCache.clear();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.eventListeners.clear();
  }
}

// Singleton instance
const audioService = new AudioService();
export default audioService;