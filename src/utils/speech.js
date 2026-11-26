const BENIGN_SPEECH_ERRORS = new Set(['interrupted', 'canceled', 'cancelled']);

/**
 * SpeechSynthesis fires `interrupted` whenever a new utterance cancels the
 * previous one. That is part of normal narration flow, not a failure.
 */
export const isBenignSpeechError = (error) =>
  BENIGN_SPEECH_ERRORS.has(error?.error);

export const reportSpeechError = (error) => {
  if (isBenignSpeechError(error)) return;

  if (error?.error === 'not-allowed' || error?.error === 'blocked') {
    console.warn('Speech synthesis blocked by browser - requires user interaction');
    return;
  }

  console.warn('Speech error:', error);
};
