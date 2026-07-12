import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaUndo, FaRedo, FaEraser, FaPencilAlt,
  FaCheck, FaStar, FaVolumeUp, FaPalette, FaFlag,
  FaPlay, FaStop
} from 'react-icons/fa';
import { CanvasEngine } from '../../services/CanvasEngine';
import { useDrawing } from '../../hooks/useDrawing';
import { useAudio } from '../../hooks/useAudio';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import { getNumberById } from '../../data/numbersData';
import { getNumberTracingData } from '../../data/numberTracingData';
import { announceToScreenReader } from '../../utils/accessibility';
import { NUMBERS_DATA } from '../../data/numbersData';

const NumberTracing = () => {
  const { numberId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [number, setNumber] = useState(null);
  const [tracingData, setTracingData] = useState(null);
  const [mode, setMode] = useState('guided'); // 'guided' | 'free'
  const [showGuide, setShowGuide] = useState(true);
  const [currentStroke, setCurrentStroke] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [traceResult, setTraceResult] = useState(null);
  
  const { markCompleted, markMastered, isNumberCompleted } = useNumbersProgress();
  const { speak } = useAudio();

  const {
    color,
    colors,
    lineWidth,
    isEraser,
    startDrawing,
    continueDrawing,
    endDrawing,
    changeColor,
    changeLineWidth,
    toggleEraser,
    clearCanvas,
    undo,
    redo,
    hasDrawing,
    canvasEngine
  } = useDrawing(canvasRef);

  useEffect(() => {
    const found = getNumberById(numberId);
    if (found) {
      setNumber(found);
      const tracing = getNumberTracingData(numberId);
      setTracingData(tracing);
      
      // Speak number name
      setTimeout(() => {
        speak(`Trace the number ${found.number}`, { rate: 0.8, pitch: 1.1 });
      }, 500);
    } else {
      navigate('/numbers');
    }
  }, [numberId, navigate]);

  // Get coordinates from pointer events
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

  // Handle pointer events for tracing
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    startDrawing(coords.x, coords.y);
  }, [startDrawing, getCoordinates]);

  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    continueDrawing(coords.x, coords.y);
  }, [continueDrawing, getCoordinates]);

  const handlePointerUp = useCallback((e) => {
    e.preventDefault();
    endDrawing();
    
    // Validate trace in guided mode
    if (mode === 'guided' && tracingData) {
      validateTrace();
    }
  }, [endDrawing, mode, tracingData]);

  // Validate the trace against the guide
  const validateTrace = useCallback(() => {
    if (!canvasEngine || !tracingData) return;
    
    // Get the drawn strokes
    const strokes = canvasEngine.strokes;
    if (strokes.length === 0) return;
    
    // Simple validation - check if trace covers the guide path
    let matchedPoints = 0;
    let totalPoints = 0;
    
    for (const stroke of tracingData.strokes) {
      for (const point of stroke.points) {
        totalPoints++;
        let foundMatch = false;
        for (const drawnStroke of strokes) {
          for (const drawnPoint of drawnStroke.points) {
            const distance = Math.sqrt(
              Math.pow(drawnPoint.x - point.x, 2) + 
              Math.pow(drawnPoint.y - point.y, 2)
            );
            if (distance < 20) {
              foundMatch = true;
              break;
            }
          }
          if (foundMatch) break;
        }
        if (foundMatch) matchedPoints++;
      }
    }
    
    const accuracyScore = totalPoints > 0 ? Math.round((matchedPoints / totalPoints) * 100) : 0;
    setAccuracy(accuracyScore);
    
    const isAccurate = accuracyScore > 60;
    setTraceResult({ accuracy: accuracyScore, isAccurate });
    
    if (isAccurate) {
      announceToScreenReader(`Great job! ${accuracyScore}% accuracy`);
      speak('Great job!', { rate: 0.9, pitch: 1.2 });
      
      if (currentStroke < tracingData.strokes.length - 1) {
        setCurrentStroke(prev => prev + 1);
      } else {
        setIsComplete(true);
        setShowCelebration(true);
        markCompleted(numberId);
        markMastered(numberId);
        speak('You traced the number perfectly!', { rate: 0.9, pitch: 1.2 });
      }
    } else {
      announceToScreenReader(`Keep trying! ${accuracyScore}% accuracy`);
      speak('Keep trying! You can do it!', { rate: 0.9, pitch: 1.1 });
    }
  }, [canvasEngine, tracingData, currentStroke, markCompleted, markMastered, numberId, speak]);

  // Reset the tracing
  const handleReset = useCallback(() => {
    clearCanvas();
    setCurrentStroke(0);
    setIsComplete(false);
    setTraceResult(null);
    setAccuracy(0);
  }, [clearCanvas]);

  // Render guide overlay
  const renderGuide = useCallback(() => {
    if (!showGuide || !tracingData || mode !== 'guided') return null;
    
    const stroke = tracingData.strokes[currentStroke] || tracingData.strokes[0];
    const { points, startPoint, endPoint } = stroke;
    
    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Guide path */}
        <path
          d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`}
          fill="none"
          stroke="#2563EB"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Start point */}
        <circle
          cx={startPoint.x}
          cy={startPoint.y}
          r="4"
          fill="#22C55E"
          stroke="white"
          strokeWidth="1.5"
        />
        <text
          x={startPoint.x - 10}
          y={startPoint.y - 10}
          fontSize="6"
          fill="#22C55E"
          fontWeight="bold"
        >
          Start
        </text>
        
        {/* End point */}
        <circle
          cx={endPoint.x}
          cy={endPoint.y}
          r="4"
          fill="#EF4444"
          stroke="white"
          strokeWidth="1.5"
        />
        <text
          x={endPoint.x - 8}
          y={endPoint.y + 15}
          fontSize="6"
          fill="#EF4444"
          fontWeight="bold"
        >
          End
        </text>
        
        {/* Direction arrows */}
        {points.map((p, i) => {
          if (i % 3 !== 0 || i === points.length - 1) return null;
          const next = points[Math.min(i + 1, points.length - 1)];
          const angle = Math.atan2(next.y - p.y, next.x - p.x) * (180 / Math.PI);
          
          return (
            <polygon
              key={i}
              points={`${p.x - 3},${p.y - 5} ${p.x + 3},${p.y - 5} ${p.x},${p.y + 5}`}
              fill="#2563EB"
              opacity="0.6"
              transform={`rotate(${angle + 90}, ${p.x}, ${p.y})`}
            />
          );
        })}
        
        {/* Stroke number indicator */}
        {tracingData.strokes.length > 1 && (
          <rect
            x="85"
            y="5"
            width="12"
            height="12"
            rx="2"
            fill="rgba(37, 99, 235, 0.8)"
          >
            <title>Stroke {currentStroke + 1} of {tracingData.strokes.length}</title>
          </rect>
        )}
      </svg>
    );
  }, [tracingData, currentStroke, showGuide, mode]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 pb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/numbers/lesson/${numberId}`}
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Lesson"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
              Trace Number {number?.number || ''}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {mode === 'guided' ? 'Follow the guide to trace' : 'Practice freehand'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setMode('guided')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                mode === 'guided'
                  ? 'bg-white dark:bg-gray-600 text-primary dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
              aria-label="Guided mode"
            >
              Guided
            </button>
            <button
              onClick={() => setMode('free')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                mode === 'free'
                  ? 'bg-white dark:bg-gray-600 text-primary dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
              aria-label="Free mode"
            >
              Free
            </button>
          </div>
          
          {/* Guide toggle */}
          {mode === 'guided' && (
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                showGuide
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              aria-label={showGuide ? 'Hide guide' : 'Show guide'}
            >
              Guide
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-soft overflow-hidden" style={{ height: '450px' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: 'none' }}
        />
        
        {/* Guide overlay */}
        {renderGuide()}
        
        {/* Accuracy display */}
        {traceResult && (
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-soft">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Accuracy:
              </span>
              <span className={`text-sm font-bold ${accuracy > 60 ? 'text-green-500' : 'text-orange-500'}`}>
                {accuracy}%
              </span>
            </div>
          </div>
        )}
        
        {/* Stroke indicator */}
        {mode === 'guided' && tracingData && (
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-soft">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Stroke {Math.min(currentStroke + 1, tracingData.strokes.length)} of {tracingData.strokes.length}
            </span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
        {/* Colors */}
        <div className="flex items-center gap-1">
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
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        
        {/* Line width */}
        <select
          value={lineWidth}
          onChange={(e) => changeLineWidth(parseInt(e.target.value))}
          className="bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1 text-sm"
          aria-label="Line width"
        >
          <option value={3}>Thin</option>
          <option value={5}>Medium</option>
          <option value={8}>Thick</option>
          <option value={12}>Extra Thick</option>
        </select>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        
        {/* Eraser */}
        <button
          onClick={toggleEraser}
          className={`p-2 rounded-lg transition-colors ${
            isEraser
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-label={isEraser ? 'Switch to pen' : 'Switch to eraser'}
        >
          {isEraser ? <FaPencilAlt /> : <FaEraser />}
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        
        {/* Undo/Redo */}
        <button
          onClick={undo}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Undo"
        >
          <FaUndo />
        </button>
        <button
          onClick={redo}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Redo"
        >
          <FaRedo />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        
        {/* Clear */}
        <button
          onClick={handleReset}
          className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          aria-label="Clear"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {mode === 'guided' ? (
          <p>👆 Follow the blue dots and arrows to trace the number correctly</p>
        ) : (
          <p>✏️ Practice writing the number freely. Try different colors!</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => navigate(`/numbers/lesson/${numberId}`)}
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors"
        >
          Back to Lesson
        </button>
        <button
          onClick={() => {
            const currentIndex = NUMBERS_DATA.findIndex(n => n.id === numberId);
            if (currentIndex < NUMBERS_DATA.length - 1) {
              navigate(`/numbers/trace/${NUMBERS_DATA[currentIndex + 1].id}`);
            }
          }}
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors"
        >
          Next Number →
        </button>
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-md w-full mx-4 bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-soft"
            >
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                You traced Number {number?.number}!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {accuracy > 80 
                  ? 'Perfect tracing! You\'re a star! 🌟' 
                  : 'Great effort! Keep practicing! 💪'}
              </p>
              <div className="flex justify-center gap-2 mt-4">
                {[...Array(3)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-3xl"
                  >
                    ⭐
                  </motion.span>
                ))}
              </div>
              <div className="flex gap-3 mt-6 justify-center">
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    handleReset();
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Practice Again
                </button>
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    navigate(`/numbers/lesson/${numberId}`);
                  }}
                  className="px-4 py-2 btn-primary"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NumberTracing;