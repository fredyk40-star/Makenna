import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTracing } from '../../hooks/useTracing';
import { useDrawing } from '../../hooks/useDrawing';
import StrokeGuide from './StrokeGuide';
import StrokeAnimator from './StrokeAnimator';
import TraceValidator from './TraceValidator';
import CelebrationOverlay from './CelebrationOverlay';
import { FaArrowLeft, FaArrowRight, FaUndo, FaRedo, FaEraser, FaPencilAlt } from 'react-icons/fa';

const TracingCanvas = ({
  letter,
  caseType = 'uppercase',
  mode = 'trace', // 'trace' or 'practice'
  onComplete = null,
  onProgress = null,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  
  const {
    startTrace,
    continueTrace,
    endTrace,
    isTracing,
    traceResult,
    clearTrace,
    undoLast,
    redoLast,
    getTraceProgress,
    getTraceAccuracy,
    isTraceValid,
    getEncouragementMessage,
    changeDifficulty,
    difficulty,
    settings,
    animationData,
    guideData
  } = useTracing(letter, caseType, canvasRef);

  const {
    isDrawing,
    isEraser,
    color,
    colors,
    lineWidth,
    startDrawing,
    continueDrawing,
    endDrawing,
    changeColor,
    changeLineWidth,
    toggleEraser,
    clearCanvas,
    undo,
    redo,
    hasDrawing
  } = useDrawing(canvasRef);

  // Handle mouse/touch events
  const getCoordinates = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    const clientX = e.clientX || e.touches?.[0]?.clientX || e.changedTouches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || e.changedTouches?.[0]?.clientY || 0;
    
    return {
      x: (clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (clientY - rect.top) * (canvasRef.current.height / rect.height)
    };
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    
    if (mode === 'trace') {
      startTrace(coords.x, coords.y);
    } else {
      startDrawing(coords.x, coords.y);
    }
  }, [mode, startTrace, startDrawing, getCoordinates]);

  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    
    if (mode === 'trace') {
      continueTrace(coords.x, coords.y);
      // Update progress
      const progress = getTraceProgress();
      if (onProgress) onProgress(progress);
    } else {
      continueDrawing(coords.x, coords.y);
    }
  }, [mode, continueTrace, continueDrawing, getCoordinates, onProgress, getTraceProgress]);

  useEffect(() => {
    if (traceResult?.valid) {
      setShowCelebration(true);
      if (onComplete) {
        onComplete(traceResult);
      }
    }
  }, [traceResult, onComplete]);

  const handlePointerUp = useCallback((e) => {
    e.preventDefault();
    
    if (mode === 'trace') {
      endTrace();
    } else {
      endDrawing();
    }
  }, [mode, endTrace, endDrawing]);

  const handleClear = useCallback(() => {
    if (mode === 'trace') {
      clearTrace();
    } else {
      clearCanvas();
    }
  }, [mode, clearTrace, clearCanvas]);

  const handleUndo = useCallback(() => {
    if (mode === 'trace') {
      undoLast();
    } else {
      undo();
    }
  }, [mode, undoLast, undo]);

  const handleRedo = useCallback(() => {
    if (mode === 'trace') {
      redoLast();
    } else {
      redo();
    }
  }, [mode, redoLast, redo]);

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Toolbar */}
      <div className="absolute top-2 left-2 right-2 flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Difficulty Selector */}
          <select
            value={difficulty}
            onChange={(e) => changeDifficulty(e.target.value)}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Tracing difficulty"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* Show Guide Toggle */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`p-2 rounded-xl transition-colors bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 ${
              showGuide ? 'text-primary' : 'text-gray-400'
            }`}
            aria-label={showGuide ? 'Hide guide' : 'Show guide'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.5 13.5l-4-4 4-4 4 4-4 4z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Color picker (practice mode only) */}
          {mode === 'practice' && (
            <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-1 border border-gray-200 dark:border-gray-700">
              {colors.slice(0, 6).map((c) => (
                <button
                  key={c}
                  onClick={() => changeColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                    color === c ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          )}

          {/* Eraser Toggle */}
          {mode === 'practice' && (
            <button
              onClick={toggleEraser}
              className={`p-2 rounded-xl transition-colors bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 ${
                isEraser ? 'text-primary bg-blue-50 dark:bg-blue-900/30' : 'text-gray-600 dark:text-gray-300'
              }`}
              aria-label={isEraser ? 'Switch to pen' : 'Switch to eraser'}
            >
              {isEraser ? <FaPencil className="w-4 h-4" /> : <FaEraser className="w-4 h-4" />}
            </button>
          )}

          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            className="p-2 rounded-xl transition-colors bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Undo"
          >
            <FaUndo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            className="p-2 rounded-xl transition-colors bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Redo"
          >
            <FaRedo className="w-4 h-4" />
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="p-2 rounded-xl transition-colors bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
            aria-label="Clear canvas"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-2xl bg-white dark:bg-gray-900 touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none' }}
      />

      {/* Stroke Guide */}
      {showGuide && guideData && mode === 'trace' && (
        <StrokeGuide
          guideData={guideData}
          letter={letter}
          caseType={caseType}
          visible={showGuide}
          className="absolute inset-0 pointer-events-none"
        />
      )}

      {/* Stroke Animation */}
      {animationData && mode === 'trace' && (
        <StrokeAnimator
          animationData={animationData}
          letter={letter}
          caseType={caseType}
          onComplete={() => setIsAnimating(false)}
          className="absolute inset-0 pointer-events-none"
        />
      )}

      {/* Trace Validator */}
      {traceResult && mode === 'trace' && (
        <TraceValidator
          result={traceResult}
          message={getEncouragementMessage()}
          className="absolute bottom-4 left-4 right-4"
        />
      )}

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <CelebrationOverlay
            letter={letter}
            onComplete={handleCelebrationComplete}
          />
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      {mode === 'trace' && (
        <div className="absolute bottom-20 left-4 right-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getTraceProgress() * 100}%` }}
            className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300"
          />
        </div>
      )}
    </div>
  );
};

export default TracingCanvas;