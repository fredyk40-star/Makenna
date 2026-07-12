import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FaUndo, FaRedo, FaEraser, FaPencilAlt, FaTrash, FaDownload
} from 'react-icons/fa';
import { useDrawing } from '../../hooks/useDrawing';

const DrawingPad = () => {
  const canvasRef = useRef(null);
  const {
    color,
    colors,
    lineWidth,
    isEraser,
    hasDrawing,
    startDrawing,
    continueDrawing,
    endDrawing,
    changeColor,
    changeLineWidth,
    toggleEraser,
    clearCanvas,
    undo,
    redo,
    exportDrawing
  } = useDrawing(canvasRef);

  const getCoordinates = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    startDrawing(x, y);
  }, [startDrawing, getCoordinates]);

  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    continueDrawing(x, y);
  }, [continueDrawing, getCoordinates]);

  const handlePointerUp = useCallback((e) => {
    e.preventDefault();
    endDrawing();
  }, [endDrawing]);
  
  const handleDownload = () => {
    const dataURL = exportDrawing();
    if (dataURL) {
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'drawing.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full h-[70vh] flex flex-col items-center gap-4">
      {/* Toolbar */}
      <div className="w-full flex flex-wrap items-center justify-center gap-2 md:gap-4 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-soft">
        {/* Colors */}
        <div className="flex items-center gap-2">
          {colors.map((c) => (
            <motion.button
              key={c}
              onClick={() => changeColor(c)}
              whileHover={{ scale: 1.1 }}
              className={`w-8 h-8 rounded-full transition-transform border-2 ${
                color === c && !isEraser ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-gray-800' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
        
        {/* Line Width */}
        <div className="flex items-center gap-2">
           <input
            type="range"
            min="2"
            max="30"
            value={lineWidth}
            onChange={(e) => changeLineWidth(Number(e.target.value))}
            className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer"
            />
            <span className="font-mono text-sm">{lineWidth}px</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
            <ActionButton onClick={undo} label="Undo"><FaUndo /></ActionButton>
            <ActionButton onClick={redo} label="Redo"><FaRedo /></ActionButton>
            <ActionButton onClick={toggleEraser} label="Eraser" active={isEraser}>
                {isEraser ? <FaPencilAlt /> : <FaEraser />}
            </ActionButton>
            <ActionButton onClick={clearCanvas} label="Clear"><FaTrash /></ActionButton>
            {hasDrawing && <ActionButton onClick={handleDownload} label="Download"><FaDownload /></ActionButton>}
        </div>
      </div>

      {/* Canvas */}
      <motion.canvas
        ref={canvasRef}
        width="1000"
        height="600"
        className="w-full h-full rounded-2xl bg-gray-50 dark:bg-gray-900 shadow-inner touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

const ActionButton = ({ onClick, label, active = false, children }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`p-3 rounded-full text-gray-700 dark:text-gray-200 transition-colors ${
            active ? 'bg-blue-500/20 text-blue-500' : 'bg-gray-100 dark:bg-gray-700'
        }`}
        aria-label={label}
    >
        {children}
    </motion.button>
);


export default DrawingPad;
