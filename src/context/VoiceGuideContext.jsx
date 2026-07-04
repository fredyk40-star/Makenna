import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    voiceGuide.init();
  }, []);

  const speak = useCallback((text, options = {}) => {
    voiceGuide.speak(text, {
      ...options,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  }, []);

  const speakRepeated = useCallback((text, times = 3, options = {}) => {
    voiceGuide.speakRepeated(text, times, {
      ...options,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  }, []);

  const greetChild = useCallback((name) => {
    voiceGuide.greetChild(name);
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 3000);
  }, []);

  const encourage = useCallback(() => {
    voiceGuide.encourage();
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 2000);
  }, []);

  const playError = useCallback(() => {
    voiceGuide.playError();
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 2000);
  }, []);

  const playSuccess = useCallback(() => {
    voiceGuide.playSuccess();
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 2000);
  }, []);

  const toggleMute = useCallback(() => {
    const muted = voiceGuide.toggleMute();
    setIsMuted(muted);
    return muted;
  }, []);

  const pause = useCallback(() => voiceGuide.pause(), []);
  const resume = useCallback(() => voiceGuide.resume(), []);
  const cancel = useCallback(() => {
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