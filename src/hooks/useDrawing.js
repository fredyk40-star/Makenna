import { useState, useEffect, useCallback, useRef } from 'react';
import { CanvasEngine } from '../services/CanvasEngine';

export const useDrawing = (canvasRef, options = {}) => {
  const {
    initialColor = '#2563EB',
    initialLineWidth = 5,
    initialMode = 'free'
  } = options;

  const [canvasEngine, setCanvasEngine] = useState(null);
  const [color, setColor] = useState(initialColor);
  const [lineWidth, setLineWidth] = useState(initialLineWidth);
  const [mode, setMode] = useState(initialMode);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [colors] = useState([
    '#2563EB', '#FF6B6B', '#4ECDC4', '#FFE66D', 
    '#A78BFA', '#F472B6', '#34D399', '#FB923C'
  ]);

  useEffect(() => {
    if (canvasRef?.current) {
      const engine = new CanvasEngine(canvasRef.current);
      engine.setColor(color);
      engine.setLineWidth(lineWidth);
      engine.changeMode(mode);
      setCanvasEngine(engine);
      
      // Check if there are strokes
      setHasDrawing(engine.strokes.length > 0);
      
      return () => {
        engine.dispose();
      };
    }
  }, [canvasRef]);

  const startDrawing = useCallback((x, y) => {
    if (!canvasEngine) return;
    setIsDrawing(true);
    canvasEngine.startDraw(x, y);
  }, [canvasEngine]);

  const continueDrawing = useCallback((x, y) => {
    if (!canvasEngine || !isDrawing) return;
    canvasEngine.draw(x, y);
  }, [canvasEngine, isDrawing]);

  const endDrawing = useCallback(() => {
    if (!canvasEngine || !isDrawing) return;
    canvasEngine.endDraw();
    setIsDrawing(false);
    setHasDrawing(canvasEngine.strokes.length > 0);
  }, [canvasEngine, isDrawing]);

  const changeColor = useCallback((newColor) => {
    setColor(newColor);
    if (canvasEngine) {
      canvasEngine.setColor(newColor);
      setIsEraser(false);
    }
  }, [canvasEngine]);

  const changeLineWidth = useCallback((newWidth) => {
    setLineWidth(newWidth);
    if (canvasEngine) {
      canvasEngine.setLineWidth(newWidth);
    }
  }, [canvasEngine]);

  const toggleEraser = useCallback(() => {
    const newState = !isEraser;
    setIsEraser(newState);
    if (canvasEngine) {
      canvasEngine.toggleEraser();
    }
  }, [canvasEngine, isEraser]);

  const clearCanvas = useCallback(() => {
    if (canvasEngine) {
      canvasEngine.clear();
      setHasDrawing(false);
    }
  }, [canvasEngine]);

  const undo = useCallback(() => {
    if (canvasEngine) {
      const result = canvasEngine.undo();
      setHasDrawing(canvasEngine.strokes.length > 0);
      return result;
    }
    return false;
  }, [canvasEngine]);

  const redo = useCallback(() => {
    if (canvasEngine) {
      const result = canvasEngine.redo();
      setHasDrawing(canvasEngine.strokes.length > 0);
      return result;
    }
    return false;
  }, [canvasEngine]);

  const exportDrawing = useCallback(() => {
    if (canvasEngine) {
      return canvasEngine.getDataURL();
    }
    return null;
  }, [canvasEngine]);

  const importDrawing = useCallback((dataURL) => {
    if (canvasEngine) {
      canvasEngine.loadDataURL(dataURL);
      setHasDrawing(true);
    }
  }, [canvasEngine]);

  const changeMode = useCallback((newMode) => {
  setMode(newMode);

  if (canvasEngine) {
    canvasEngine.changeMode(newMode);
  }
}, [canvasEngine]);

  return {
    canvasEngine,
    color,
    lineWidth,
    mode,
    isDrawing,
    isEraser,
    hasDrawing,
    colors,
    startDrawing,
    continueDrawing,
    endDrawing,
    changeColor,
    changeLineWidth,
    toggleEraser,
    clearCanvas,
    undo,
    redo,
    exportDrawing,
    importDrawing,
    changeMode
  };
};