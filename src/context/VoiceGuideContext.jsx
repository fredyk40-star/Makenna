import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { voiceGuide } from '../services/VoiceGuideService';

const VoiceGuideContext = createContext();

export const useVoiceGuide = () => {
  const context = useContext(VoiceGuideContext);
  if (!context) {
    throw new Error('useVoiceGuide must be used within VoiceGuideProvider');
  }
  return context;
};

export const VoiceGuideProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState(0.9);
  const speechRunRef = useRef(0);

  useEffect(() => {
    voiceGuide.init();
    return () => {
      speechRunRef.current += 1;
      voiceGuide.cancel();
    };
  }, []);

  const runSpeech = useCallback((start, options = {}) => {
    const runId = ++speechRunRef.current;
    const callbacks = {
      ...options,
      onStart: (...args) => {
        if (speechRunRef.current !== runId) return;
        setIsSpeaking(true);
        options.onStart?.(...args);
      },
      onEnd: (...args) => {
        if (speechRunRef.current !== runId) return;
        setIsSpeaking(false);
        options.onEnd?.(...args);
      },
      onError: (...args) => {
        if (speechRunRef.current !== runId) return;
        setIsSpeaking(false);
        options.onError?.(...args);
      },
    };

    try {
      const result = start(callbacks);
      if (result === false && speechRunRef.current === runId) setIsSpeaking(false);
      return result;
    } catch (error) {
      if (speechRunRef.current === runId) setIsSpeaking(false);
      throw error;
    }
  }, []);

  const speak = useCallback((text, options = {}) => (
    runSpeech(callbacks => voiceGuide.speak(text, callbacks), options)
  ), [runSpeech]);

  const speakRepeated = useCallback((text, times = 3, options = {}) => {
    return runSpeech(callbacks => voiceGuide.speakRepeated(text, times, callbacks), options);
  }, [runSpeech]);

  const greetChild = useCallback((name) => {
    return runSpeech(callbacks => voiceGuide.greetChild(name, callbacks));
  }, [runSpeech]);

  const encourage = useCallback(() => {
    return runSpeech(callbacks => voiceGuide.encourage(callbacks));
  }, [runSpeech]);

  const playError = useCallback(() => {
    return runSpeech(callbacks => voiceGuide.playError(callbacks));
  }, [runSpeech]);

  const playSuccess = useCallback(() => {
    return runSpeech(callbacks => voiceGuide.playSuccess(callbacks));
  }, [runSpeech]);

  const toggleMute = useCallback(() => {
    const muted = voiceGuide.toggleMute();
    setIsMuted(muted);
    if (muted) {
      speechRunRef.current += 1;
      setIsSpeaking(false);
    }
    return muted;
  }, []);

  const pause = useCallback(() => voiceGuide.pause(), []);
  const resume = useCallback(() => voiceGuide.resume(), []);
  const cancel = useCallback(() => {
    speechRunRef.current += 1;
    voiceGuide.cancel();
    setIsSpeaking(false);
  }, []);

  const changeRate = useCallback((newRate) => {
    voiceGuide.setRate(newRate);
    setRate(newRate);
  }, []);

  const value = {
    isMuted,
    isSpeaking,
    rate,
    speak,
    speakRepeated,
    greetChild,
    encourage,
    playError,
    playSuccess,
    toggleMute,
    pause,
    resume,
    cancel,
    setRate: changeRate,
  };

  return (
    <VoiceGuideContext.Provider value={value}>
      {children}
    </VoiceGuideContext.Provider>
  );
};

export default VoiceGuideContext;