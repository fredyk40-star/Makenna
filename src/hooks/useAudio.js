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

  useRef(null);
  const timerRef = useRef(null);

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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const play = useCallback(async (source, options = {}) => {
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
          setIsPlaying(false);
          if (onEnd) onEnd();
        },
        onStart: () => {
          setIsPlaying(true);
          setIsPaused(false);
          if (onStart) onStart();
        },
        onError: (err) => {
          setError(err);
          setIsPlaying(false);
          if (onError) onError(err);
        }
      });

      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err);
      setIsLoading(false);
      if (onError) onError(err);
      return false;
    }
  }, [volume, playbackRate, onEnd, onStart, onError]);

  const speak = useCallback(async (text, options = {}) => {
    setIsLoading(true);
    setError(null);
    AccessibilityService.announceCaption(text);
    const safeVolume = AccessibilityService.getSettings().soundSensitive
      ? Math.min(volume, 0.25)
      : volume;

    try {
      const result = await audioService.speak(text, {
        rate: options.rate || 0.9,
        pitch: options.pitch || 1.1,
        volume: safeVolume,
        onEnd: () => {
          setIsPlaying(false);
          if (onEnd) onEnd();
        },
        onStart: () => {
          setIsPlaying(true);
          if (onStart) onStart();
        },
        onError: (err) => {
          setError(err);
          setIsPlaying(false);
          if (onError) onError(err);
        }
      });

      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err);
      setIsLoading(false);
      if (onError) onError(err);
      return false;
    }
  }, [volume, onEnd, onStart, onError]);

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