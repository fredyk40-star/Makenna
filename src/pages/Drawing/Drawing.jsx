import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaPaintBrush, FaSave, FaStar, FaFolder, FaPalette } from 'react-icons/fa';
import DrawingPad from './DrawingPad';

const Drawing = () => {
  const [savedDrawings, setSavedDrawings] = useState([]);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('drawing_gallery') || '[]');
    setSavedDrawings(stored);
  }, []);

  const saveDrawing = () => {
    const newDrawing = {
      id: Date.now(),
      name: `My Drawing ${(savedDrawings.length + 1)}`,
      date: new Date().toISOString(),
      bg: `hsl(${Math.random() * 360}, 70%, 85%)`
    };
    const updated = [newDrawing, ...savedDrawings].slice(0, 12);
    setSavedDrawings(updated);
    localStorage.setItem('drawing_gallery', JSON.stringify(updated));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 pb-4 w-full"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/games" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
            <FaArrowLeft className="text-xl" />
          </Link>
          <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaPaintBrush />
            Drawing Pad
          </h1>
        </div>
        
        {/* Stats Bar */}
        <div className="flex gap-3 flex-wrap">
          <div className="bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
            <FaFolder className="text-purple-600" />
            <span className="font-semibold">{savedDrawings.length} saved</span>
          </div>
          <div className="bg-pink-100 dark:bg-pink-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
            <FaStar className="text-pink-600" />
            <span className="font-semibold">Creative!</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drawing Canvas */}
        <div className="lg:col-span-2">
          <DrawingPad onSave={saveDrawing} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Drawing Prompts */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft">
            <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <FaPalette />
              Today's Prompts
            </h3>
            <div className="space-y-2">
              {['Draw a rainbow', 'Sketch your pet', 'Color the sun', 'Draw yourself!'].map((prompt, idx) => (
                <div key={idx} className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-sm cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-colors">
                  ✏️ {prompt}
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft">
            <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <FaFolder />
              Your Gallery
            </h3>
            {savedDrawings.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {savedDrawings.slice(0, 6).map((drawing) => (
                  <div 
                    key={drawing.id} 
                    className="aspect-square rounded-lg flex items-center justify-center text-2xl"
                    style={{ background: drawing.bg }}
                  >
                    🎨
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Your drawings will appear here!</p>
            )}
          </div>
        </div>
      </div>

      {/* Full Gallery Modal */}
      {showGallery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGallery(false)}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-baloo text-2xl font-bold">My Drawing Gallery</h3>
              <button onClick={() => setShowGallery(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {savedDrawings.map((drawing) => (
                <motion.div 
                  key={drawing.id} 
                  whileHover={{ scale: 1.05 }}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-soft"
                  style={{ background: drawing.bg }}
                >
                  <span className="text-3xl mb-1">🎨</span>
                  <span className="text-xs font-medium">{drawing.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Drawing;