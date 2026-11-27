import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaFolder, FaPaintBrush, FaStar, FaTrash } from 'react-icons/fa';
import DrawingPad from './DrawingPad';
import { useChildAccount } from '../../context/ChildAccountContext';
import { PortfolioService } from '../../services/PortfolioService';
import { createThumbnail } from '../../utils/imageStorage';

const PROMPTS = ['Draw a rainbow', 'Sketch your pet', 'Color the sun', 'Draw yourself!'];

const Drawing = () => {
  const { childId } = useChildAccount();
  const [savedDrawings, setSavedDrawings] = useState([]);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    const refresh = () => setSavedDrawings(PortfolioService.listByKind(childId, 'drawing'));
    refresh();
    return PortfolioService.subscribe(refresh);
  }, [childId]);

  const saveDrawing = useCallback(async ({ image }) => {
    if (!childId || !image) return;
    const thumbnail = await createThumbnail(image);
    PortfolioService.save(childId, {
      kind: 'drawing',
      title: `My Drawing ${savedDrawings.length + 1}`,
      image: thumbnail,
    });
  }, [childId, savedDrawings.length]);

  const handleDelete = useCallback((entryId) => {
    if (window.confirm('Delete this drawing?')) {
      PortfolioService.remove(childId, entryId);
    }
  }, [childId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 pb-4 w-full"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/games" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Back to games">
            <FaArrowLeft className="text-xl" />
          </Link>
          <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaPaintBrush />
            Drawing Pad
          </h1>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
            <FaFolder className="text-purple-600" />
            <span className="font-semibold">{savedDrawings.length} saved</span>
          </div>
          <div className="bg-pink-100 dark:bg-pink-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
            <FaStar className="text-pink-600" />
            <span className="font-semibold">Creative!</span>
          </div>
          <Link
            to="/portfolio"
            className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold shadow-soft"
          >
            My portfolio
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DrawingPad onSave={saveDrawing} />
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft">
            <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white mb-3">
              Today&apos;s Prompts
            </h3>
            <div className="space-y-2">
              {PROMPTS.map((prompt) => (
                <div key={prompt} className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-sm">
                  ✏️ {prompt}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FaFolder />
                Your Gallery
              </h3>
              {savedDrawings.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowGallery(true)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400"
                >
                  View all
                </button>
              )}
            </div>
            {savedDrawings.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {savedDrawings.slice(0, 6).map((drawing) => (
                  <img
                    key={drawing.id}
                    src={drawing.image}
                    alt={drawing.title}
                    className="aspect-square rounded-lg object-cover bg-purple-100 dark:bg-purple-900/30"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Save your drawing with the 💾 button and it will appear here!
              </p>
            )}
          </div>
        </div>
      </div>

      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close drawing gallery"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowGallery(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            role="dialog"
            aria-modal="true"
            aria-label="My drawing gallery"
            className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">My Drawing Gallery</h3>
              <button
                type="button"
                onClick={() => setShowGallery(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Close gallery"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {savedDrawings.map((drawing) => (
                <div key={drawing.id} className="rounded-xl bg-gray-50 dark:bg-gray-900 p-2 shadow-soft">
                  <img src={drawing.image} alt={drawing.title} className="w-full aspect-square object-cover rounded-lg" />
                  <div className="flex items-center justify-between mt-2 gap-1">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{drawing.title}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(drawing.id)}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                      aria-label={`Delete ${drawing.title}`}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link to="/portfolio" className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                Open full portfolio →
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Drawing;
