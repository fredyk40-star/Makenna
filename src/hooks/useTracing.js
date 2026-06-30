import { useState, useEffect, useCallback, useRef } from 'react';
import tracingEngine from '../services/TracingEngine';
import { CanvasEngine } from '../services/CanvasEngine';

export const useTracing = (letter, caseType = 'uppercase', canvasRef) => {
  const [canvasEngine, setCanvasEngine] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [traceResult, setTraceResult] = useState(null);
  const [isTracing, setIsTracing] = useState(false);
  const [tracePoints, setTracePoints] = useState([]);
  const [animationData, setAnimationData] = useState(null);
  const [guideData, setGuideData] = useState(null);
  const [settings, setSettings] = useState(tracingEngine.getDifficultySettings('medium'));
  
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (canvasRef?.current) {
      const engine = new CanvasEngine(canvasRef.current);
      setCanvasEngine(engine);
      
      // Set up guide data
      const guide = tracingEngine.getGuidePoints(letter, caseType);
      setGuideData(guide);
      
      // Get animation data
      const animation = tracingEngine.getStrokeAnimation(letter, caseType);
      setAnimationData(animation);
      
      return () => {
        engine.dispose();
      };
    }
  }, [canvasRef, letter, caseType]);

  const startTrace = useCallback((x, y) => {
    if (!canvasEngine) return;
    setIsTracing(true);
    setTracePoints([]);
    canvasEngine.startDraw(x, y);
  }, [canvasEngine]);

  const continueTrace = useCallback((x, y) => {
    if (!canvasEngine || !isTracing) return;
    canvasEngine.draw(x, y);
    setTracePoints(prev => [...prev, { x, y }]);
  }, [canvasEngine, isTracing]);

  const endTrace = useCallback(() => {
    if (!canvasEngine || !isTracing) return;
    canvasEngine.endDraw();
    setIsTracing(false);
    
    // Validate trace
    if (tracePoints.length > 10) {
      const result = tracingEngine.validateTrace(tracePoints, letter, caseType);
      setTraceResult(result);
    }
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [canvasEngine, isTracing, tracePoints, letter, caseType]);

  const validateCurrentTrace = useCallback(() => {
    if (tracePoints.length > 10) {
      const result = tracingEngine.validateTrace(tracePoints, letter, caseType);
      setTraceResult(result);
      return result;
    }
    return null;
  }, [tracePoints, letter, caseType]);

  const changeDifficulty = useCallback((newDifficulty) => {
    setDifficulty(newDifficulty);
    const newSettings = tracingEngine.getDifficultySettings(newDifficulty);
    setSettings(newSettings);
    if (canvasEngine) {
      canvasEngine.lineWidth = newSettings.lineWidth;
    }
  }, [canvasEngine]);

  const clearTrace = useCallback(() => {
    if (canvasEngine) {
      canvasEngine.clear();
      setTracePoints([]);
      setTraceResult(null);
    }
  }, [canvasEngine]);

  const undoLast = useCallback(() => {
    if (canvasEngine) {
      canvasEngine.undo();
    }
  }, [canvasEngine]);

  const redoLast = useCallback(() => {
    if (canvasEngine) {
      canvasEngine.redo();
    }
  }, [canvasEngine]);

  const getTraceProgress = useCallback(() => {
    if (!traceResult) return 0;
    return traceResult.completion || 0;
  }, [traceResult]);

  const getTraceAccuracy = useCallback(() => {
    if (!traceResult) return 0;
    return traceResult.accuracy || 0;
  }, [traceResult]);

  const isTraceValid = useCallback(() => {
    if (!traceResult) return false;
    return traceResult.valid || false;
  }, [traceResult]);

  const getEncouragementMessage = useCallback(() => {
    if (!traceResult) return "Let's trace the letter!";
    
    const score = traceResult.score || 0;
    if (score >= 0.9) return "🌟 Amazing! You're a tracing superstar!";
    if (score >= 0.7) return "✨ Great job! Keep practicing!";
    if (score >= 0.5) return "💪 Almost there! Try again!";
    return "🤔 Let's try together! You can do it!";
  }, [traceResult]);

  return {
    canvasEngine,
    difficulty,
    settings,
    traceResult,
    isTracing,
    tracePoints,
    animationData,
    guideData,
    startTrace,
    continueTrace,
    endTrace,
    validateCurrentTrace,
    changeDifficulty,
    clearTrace,
    undoLast,
    redoLast,
    getTraceProgress,
    getTraceAccuracy,
    isTraceValid,
    getEncouragementMessage
  };
};