import { useState, useEffect, useCallback, useRef } from 'react';
import tracingEngine from '../services/TracingEngine';
import { CanvasEngine } from '../services/CanvasEngine';

export const useTracing = (letter, caseType = 'uppercase', canvasRef) => {
  const [canvasEngine, setCanvasEngine] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [traceResult, setTraceResult] = useState(null);
  const [isTracing, setIsTracing] = useState(false);
  const [animationData, setAnimationData] = useState(null);
  const [guideData, setGuideData] = useState(null);
  const [liveProgress, setLiveProgress] = useState(0);
  const [settings, setSettings] = useState(tracingEngine.getDifficultySettings('medium'));

  const normalizedPointsRef = useRef([]);
  const rawPointsRef = useRef([]);
  const lastProgressUpdateRef = useRef(0);

  useEffect(() => {
    normalizedPointsRef.current = [];
    rawPointsRef.current = [];
    setTraceResult(null);
    setLiveProgress(0);

    if (canvasRef?.current) {
      const engine = new CanvasEngine(canvasRef.current);
      setCanvasEngine(engine);
      setGuideData(tracingEngine.getGuidePoints(letter, caseType));
      setAnimationData(tracingEngine.getStrokeAnimation(letter, caseType));

      return () => engine.dispose();
    }

    return undefined;
  }, [canvasRef, letter, caseType]);

  const startTrace = useCallback((x, y, nx, ny) => {
    if (!canvasEngine) return;
    normalizedPointsRef.current = [{ x: nx, y: ny }];
    rawPointsRef.current = [{ x, y }];
    lastProgressUpdateRef.current = 0;
    setTraceResult(null);
    setLiveProgress(0);
    setIsTracing(true);
    canvasEngine.startDraw(x, y);
  }, [canvasEngine]);

  const continueTrace = useCallback((x, y, nx, ny) => {
    if (!canvasEngine || !isTracing) return;
    canvasEngine.draw(x, y);
    rawPointsRef.current.push({ x, y });
    normalizedPointsRef.current.push({ x: nx, y: ny });

    // Throttle progress updates so pointer moves don't re-render the page.
    const now = Date.now();
    if (now - lastProgressUpdateRef.current >= 90) {
      lastProgressUpdateRef.current = now;
      setLiveProgress(tracingEngine.getTraceProgress(
        normalizedPointsRef.current, letter, caseType, settings.tolerance
      ));
    }
  }, [canvasEngine, isTracing, letter, caseType, settings.tolerance]);

  const validateCurrentTrace = useCallback(() => {
    const points = normalizedPointsRef.current;
    if (points.length < 6) return null;

    const result = tracingEngine.validateTrace(points, letter, caseType, {
      tolerance: settings.tolerance,
    });
    setTraceResult(result);
    setLiveProgress(result.completion);
    return result;
  }, [letter, caseType, settings.tolerance]);

  const endTrace = useCallback(() => {
    if (!canvasEngine || !isTracing) return;
    canvasEngine.endDraw();
    setIsTracing(false);
    validateCurrentTrace();
  }, [canvasEngine, isTracing, validateCurrentTrace]);

  const changeDifficulty = useCallback((newDifficulty) => {
    const newSettings = tracingEngine.getDifficultySettings(newDifficulty);
    setDifficulty(newDifficulty);
    setSettings(newSettings);
    if (canvasEngine) canvasEngine.lineWidth = newSettings.lineWidth;
  }, [canvasEngine]);

  const syncPointsFromCanvas = useCallback(() => {
    const engine = canvasEngine;
    const canvas = engine?.canvas;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.width;
    const height = rect.height || canvas.height;
    const points = engine.strokes.flatMap(stroke => stroke.points.map(point => ({
      x: (point.x / width) * 100,
      y: (point.y / height) * 100,
    })));

    normalizedPointsRef.current = points;
    rawPointsRef.current = engine.strokes.flatMap(stroke => stroke.points);
    setTraceResult(null);
    setLiveProgress(tracingEngine.getTraceProgress(points, letter, caseType, settings.tolerance));
  }, [canvasEngine, letter, caseType, settings.tolerance]);

  const clearTrace = useCallback(() => {
    if (canvasEngine) canvasEngine.clear();
    normalizedPointsRef.current = [];
    rawPointsRef.current = [];
    setTraceResult(null);
    setLiveProgress(0);
  }, [canvasEngine]);

  const undoLast = useCallback(() => {
    if (canvasEngine?.undo()) syncPointsFromCanvas();
  }, [canvasEngine, syncPointsFromCanvas]);

  const redoLast = useCallback(() => {
    if (canvasEngine?.redo()) syncPointsFromCanvas();
  }, [canvasEngine, syncPointsFromCanvas]);

  const getTraceProgress = useCallback(() => liveProgress, [liveProgress]);

  const getTraceAccuracy = useCallback(() => traceResult?.accuracy || 0, [traceResult]);

  const isTraceValid = useCallback(() => Boolean(traceResult?.valid), [traceResult]);

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
    tracePoints: rawPointsRef.current,
    animationData,
    guideData,
    liveProgress,
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
    getEncouragementMessage,
  };
};
