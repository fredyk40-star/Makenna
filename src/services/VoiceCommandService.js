/**
 * Voice Commands Service - Speech recognition and voice control
 * Enables voice navigation and commands for the app
 */

const VOICE_COMMANDS_KEY = 'makenna_voice_commands';

const COMMANDS = {
  navigation: [
    { phrase: 'go to home', action: '/', icon: '🏠' },
    { phrase: 'go to profile', action: '/profile', icon: '👤' },
    { phrase: 'go to games', action: '/games', icon: '🎮' },
    { phrase: 'go to stories', action: '/stories', icon: '📖' },
    { phrase: 'go to alphabet', action: '/alphabet', icon: '🔤' },
    { phrase: 'go to numbers', action: '/numbers', icon: '🔢' }
  ],
  actions: [
    { phrase: 'start learning', action: 'start', icon: '▶️' },
    { phrase: 'stop learning', action: 'stop', icon: '⏹️' },
    { phrase: 'repeat', action: 'repeat', icon: '🔁' },
    { phrase: 'next', action: 'next', icon: '➡️' },
    { phrase: 'previous', action: 'previous', icon: '⬅️' },
    { phrase: 'help', action: 'help', icon: '❓' }
  ]
};

export class VoiceCommandService {
  /**
   * Check if speech recognition is supported
   */
  static isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Start listening for voice commands
   */
  static startListening(onResult, onError) {
    if (!this.isSupported()) {
      onError?.('Speech recognition not supported');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      onResult?.(transcript);
    };

    recognition.onerror = (event) => {
      onError?.(event.error);
    };

    recognition.start();
    return recognition;
  }

  /**
   * Match voice command to action
   */
  static matchCommand(transcript) {
    const lowerTranscript = transcript.toLowerCase();

    // Check navigation commands
    for (const cmd of COMMANDS.navigation) {
      if (lowerTranscript.includes(cmd.phrase)) {
        return { ...cmd, type: 'navigation' };
      }
    }

    // Check action commands
    for (const cmd of COMMANDS.actions) {
      if (lowerTranscript.includes(cmd.phrase)) {
        return { ...cmd, type: 'action' };
      }
    }

    return null;
  }

  /**
   * Get all available commands
   */
  static getCommands() {
    return COMMANDS;
  }

  /**
   * Get commands by type
   */
  static getCommandsByType(type) {
    return COMMANDS[type] || [];
  }

  /**
   * Add custom command
   */
  static addCommand(type, command) {
    if (!COMMANDS[type]) {
      COMMANDS[type] = [];
    }
    COMMANDS[type].push(command);
  }

  /**
   * Speak text using speech synthesis
   */
  static speak(text, options = {}) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      utterance.voice = options.voice;

      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Stop speaking
   */
  static stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Get available voices
   */
  static getVoices() {
    if ('speechSynthesis' in window) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  }
}