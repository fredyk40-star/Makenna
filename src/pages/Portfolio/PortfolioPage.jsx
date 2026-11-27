import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaFolderOpen, FaPaintBrush } from 'react-icons/fa';
import { useChildAccount } from '../../context/ChildAccountContext';
import { PortfolioService } from '../../services/PortfolioService';
import PortfolioCard from '../../components/portfolio/PortfolioCard';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'drawing', label: 'Drawings' },
  { id: 'trace', label: 'Tracing' },
];

const PortfolioPage = () => {
  const { childId } = useChildAccount();
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const refresh = () => setEntries(PortfolioService.list(childId));
    refresh();
    return PortfolioService.subscribe(refresh);
  }, [childId]);

  const handleDelete = useCallback((entryId) => {
    if (window.confirm('Delete this piece from your portfolio?')) {
      PortfolioService.remove(childId, entryId);
    }
  }, [childId]);

  const visibleEntries = filter === 'all' ? entries : entries.filter((entry) => entry.kind === filter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Back to profile">
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="font-baloo text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FaFolderOpen /> My Portfolio
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Everything you drew and traced, saved offline.</p>
          </div>
        </div>
        <Link
          to="/drawing"
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600"
        >
          <FaPaintBrush /> Draw something
        </Link>
      </div>

      <div className="flex gap-2" role="group" aria-label="Filter portfolio">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            aria-pressed={filter === option.id}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === option.id
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visibleEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleEntries.map((entry) => (
            <PortfolioCard key={entry.id} entry={entry} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
          <div className="text-5xl mb-4">🖼️</div>
          <h2 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">Your portfolio is empty</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Save a drawing or finish a tracing activity and it will appear here.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default PortfolioPage;
