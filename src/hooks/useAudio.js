import { useState, useEffect, useCallback, useRef } from 'react';
import audioService from '../services/AudioService';
import AccessibilityService from '../services/AccessibilityService';

export const useAudio = (options = {}) => {
  const {
    volume = 1,
    playbackRate = 1,
    onEnd = null,
    onStart = null,
    onError = null
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, ] = useState(0);
  const [duration, ] = useState(0);
  const [error, setError] = useState(null);
  const speechRunRef = useRef(0);

  useEffect(() => {
    // Update playing state from service
    const checkPlaying = () => {
      setIsPlaying(audioService.isPlaying);
      setIsPaused(audioService.isPaused);
    };

    // Listen for audio events
    audioService.eventListeners.set('play', checkPlaying);
    audioService.eventListeners.set('pause', checkPlaying);
    audioService.eventListeners.set('end', checkPlaying);

    return () => {
      audioService.eventListeners.delete('play');
      audioService.eventListeners.delete('pause');
      audioService.eventListeners.delete('end');
    };
  }, []);

  const speak = useCallback(async (text, options = {}) => {
    const runId = ++speechRunRef.current;
    setIsLoading(true);
    setError(null);
    AccessibilityService.announceCaption(text);
    const safeVolume = AccessibilityService.getSettings().soundSensitive
      ? Math.min(volume, 0.25)
      : volume;

    try {
      const speech = audioService.speak(text, {
        rate: options.rate || 0.9,
        pitch: options.pitch || 1.1,
        volume: safeVolume,
        onEnd: () => {
          if (speechRunRef.current === runId) {
            setIsPlaying(false);
            if (onEnd) onEnd();
          }
        },
        onStart: () => {
          if (speechRunRef.current === runId) {
            setIsPlaying(true);
            if (onStart) onStart();
          }
        },
        onError: (err) => {
          if (speechRunRef.current === runId) {
            setError(err);
            setIsPlaying(false);
            if (onError) onError(err);
          }
        }
      });

      setIsLoading(false);
      const result = await speech;
      if (speechRunRef.current === runId) setIsPlaying(false);
      return result;
    } catch (err) {
      if (speechRunRef.current === runId) {
        setError(err);
        setIsLoading(false);
        if (onError) onError(err);
      }
      return false;
    }
  }, [volume, onEnd, onStart, onError]);

  const play = useCallback(async (source, options = {}) => {
    if (options.useTTS) {
      return speak(options.text || source, options);
    }

    const runId = ++speechRunRef.current;
    setIsLoading(true);
    setError(null);
    const safeVolume = AccessibilityService.getSettings().soundSensitive
      ? Math.min(volume, 0.25)
      : volume;

    try {
      const audioBuffer = await audioService.loadAudio(source, options);
      const result = await audioService.play(audioBuffer, {
        volume: safeVolume,
        playbackRate,
        onEnd: () => {
          if (speechRunRef.current === runId) {
            setIsPlaying(false);
            if (onEnd) onEnd();
          }
        },
        onStart: () => {
          if (speechRunRef.current === runId) {
            setIsPlaying(true);
            setIsPaused(false);
            if (onStart) onStart();
          }
        },
        onError: (err) => {
          if (speechRunRef.current === runId) {
            setError(err);
            setIsPlaying(false);
            if (onError) onError(err);
          }
        }
      });

      setIsLoading(false);
      return result;
    } catch (err) {
      if (options.fallbackText) {
        return speak(options.fallbackText, options);
      }
      setError(err);
      setIsLoading(false);
      if (onError) onError(err);
      return false;
    }
  }, [volume, playbackRate, onEnd, onStart, onError, speak]);

  const pause = useCallback(() => {
    audioService.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioService.resume();
    setIsPaused(false);
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    speechRunRef.current += 1;
    audioService.stop();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (isPaused) {
      resume();
    }
  }, [isPlaying, isPaused, pause, resume]);

  const setVolume = useCallback((newVolume) => {
    const safeVolume = AccessibilityService.getSettings().soundSensitive
      ? Math.min(newVolume, 0.25)
      : newVolume;
    audioService.setVolume(safeVolume);
  }, []);

  const toggleMute = useCallback(() => {
    return audioService.toggleMute();
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    audioService.setPlaybackRate(rate);
  }, []);

  return {
    play,
    speak,
    pause,
    resume,
    stop,
    togglePlayPause,
    setVolume,
    toggleMute,
    setPlaybackRate,
    isPlaying,
    isPaused,
    isLoading,
    currentTime,
    duration,
    error,
    audioService
  };
};