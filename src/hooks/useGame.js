import { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngine } from '../services/GameEngine';
import gameProgressService from '../services/GameProgressService';
import adaptiveLearningService from '../services/AdaptiveLearningService';

export const useGame = (config = {}) => {
  const [gameEngine] = useState(() => new GameEngine(config));
  const [state, setState] = useState(gameEngine.getState());
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const [mascotMessage, setMascotMessage] = useState(null);
  
  const mountedRef = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    
    // Set up event listeners
    gameEngine.on('init', () => {
      if (mountedRef.current) {
        setCurrentQuestion(gameEngine.getCurrentQuestion());
        setIsPlaying(true);
      }
    });
    
    gameEngine.on('answer', (data) => {
      if (mountedRef.current) {
        setState(gameEngine.getState());
        setMascotMessage(data.message);
        setCurrentQuestion(gameEngine.getCurrentQuestion());
      }
    });
    
    gameEngine.on('progress', (progress) => {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, progress }));
      }
    });
    
    gameEngine.on('complete', (data) => {
      if (mountedRef.current) {
        setState(data.state);
        setIsPlaying(false);
        setShowCelebration(true);
        setCelebrationData({ message: data.message, score: data.state.score, stars: data.state.stars });
        
        // Record progress
        gameProgressService.recordProgress(config.gameId || 'unknown', {
          score: data.state.score,
          stars: data.state.stars,
          time: data.state.time,
          completed: true
        });
        
        // Record adaptive learning data
        if (config.recordAdaptive) {
          adaptiveLearningService.recordPerformance(config.gameId || 'unknown', {
            correct: data.state.correct,
            incorrect: data.state.incorrect,
            time: data.state.time,
            difficulty: gameEngine.getSettings().difficulty
          });
        }
      }
    });
    
    gameEngine.on('tick', (time) => {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, time }));
      }
    });
    
    gameEngine.on('pause', (state) => {
      if (mountedRef.current) {
        setState(state);
      }
    });
    
    gameEngine.on('resume', (state) => {
      if (mountedRef.current) {
        setState(state);
      }
    });
    
    gameEngine.on('restart', (state) => {
      if (mountedRef.current) {
        setState(state);
        setCurrentQuestion(gameEngine.getCurrentQuestion());
        setIsPlaying(true);
        setShowCelebration(false);
        setCelebrationData(null);
        setMascotMessage(null);
      }
    });
    
    gameEngine.on('celebrate', (data) => {
      if (mountedRef.current) {
        setShowCelebration(true);
        setCelebrationData(data);
      }
    });
    
    return () => {
      mountedRef.current = false;
      gameEngine.dispose();
    };
  }, [gameEngine, config]);

  const start = useCallback((questions) => {
    gameEngine.init(questions);
  }, [gameEngine]);

  const answer = useCallback((answer) => {
    const result = gameEngine.submitAnswer(answer);
    if (result) {
      setState(gameEngine.getState());
    }
    return result;
  }, [gameEngine]);

  const useHint = useCallback(() => {
    return gameEngine.useHint();
  }, [gameEngine]);

  const pause = useCallback(() => {
    gameEngine.pause();
  }, [gameEngine]);

  const resume = useCallback(() => {
    gameEngine.resume();
  }, [gameEngine]);

  const restart = useCallback(() => {
    gameEngine.restart();
  }, [gameEngine]);

  const getScore = useCallback(() => {
    return state.score;
  }, [state.score]);

  const getStars = useCallback(() => {
    return state.stars;
  }, [state.stars]);

  const getProgress = useCallback(() => {
    return state.progress;
  }, [state.progress]);

  const getTime = useCallback(() => {
    return state.time;
  }, [state.time]);

  const isComplete = useCallback(() => {
    return state.isComplete;
  }, [state.isComplete]);

  const getMascotMessage = useCallback(() => {
    return mascotMessage;
  }, [mascotMessage]);

  const getCelebrationData = useCallback(() => {
    return celebrationData;
  }, [celebrationData]);

  const getState = useCallback(() => {
    return state;
  }, [state]);

  const isPaused = useCallback(() => {
    return state.isPaused;
  }, [state.isPaused]);

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
    setCelebrationData(null);
  }, []);

  return {
    start,
    answer,
    useHint,
    pause,
    resume,
    restart,
    getScore,
    getStars,
    getProgress,
    getTime,
    isComplete,
    getMascotMessage,
    getCelebrationData,
    getState,
    isPaused,
    dismissCelebration,
    currentQuestion,
    isPlaying,
    showCelebration,
    state,
    gameEngine
  };
};