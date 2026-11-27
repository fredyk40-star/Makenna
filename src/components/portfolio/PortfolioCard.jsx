import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaTrash } from 'react-icons/fa';

const strokePath = (points) => (points || [])
  .filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y))
  .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
  .join(' ');

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unknown date'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const PortfolioCard = ({ entry, onDelete }) => {
  const [view, setView] = useState('after');
  const hasGuide = entry.kind === 'trace' && entry.guide?.length > 0;
  const guidePaths = hasGuide
    ? entry.guide
      .map((stroke) => ({ d: strokePath(stroke.points), color: stroke.color || '#94a3b8' }))
      .filter((stroke) => stroke.d)
    : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-soft"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
        {view === 'after' || !hasGuide ? (
          entry.image
            ? <img src={entry.image} alt={entry.title} className="w-full h-full object-contain" />
            : <div className="w-full h-full flex items-center justify-center text-3xl">🖼️</div>
        ) : (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" aria-label={`Guide for ${entry.title}`}>
            {guidePaths.map((stroke, index) => (
              <path
                key={index}
                d={stroke.d}
                fill="none"
                stroke={stroke.color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-white/90 dark:bg-gray-900/90 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-200">
          {entry.kind === 'trace' ? `✏️ ${entry.letter || 'Trace'}` : '🎨 Drawing'}
        </span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-baloo font-bold text-gray-800 dark:text-white truncate">{entry.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(entry.createdAt)}
            {entry.kind === 'trace' && entry.accuracy ? ` • ${Math.round(entry.accuracy)}% accurate` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {hasGuide && (
            <button
              type="button"
              onClick={() => setView(view === 'after' ? 'before' : 'after')}
              className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200"
              aria-label={`Show ${view === 'after' ? 'before' : 'after'} view`}
            >
              {view === 'after' ? 'Before' : 'After'}
            </button>
          )}
          {entry.image && (
            <a
              href={entry.image}
              download={`${entry.title.replace(/[^a-z0-9-]/gi, '-')}.png`}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={`Download ${entry.title}`}
            >
              <FaDownload />
            </a>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
              aria-label={`Delete ${entry.title}`}
            >
              <FaTrash />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PortfolioCard;
