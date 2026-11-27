import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'alphabet', label: 'Alphabet' },
  { id: 'reading', label: 'Reading' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'maths', label: 'Maths' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'stories', label: 'Stories' },
];

const modules = [
  {
    id: 'alphabet',
    category: 'alphabet',
    title: 'Alphabet Adventure',
    description: 'Learn your ABCs with fun words and pictures!',
    icon: '📚',
    path: '/alphabet',
    color: 'from-blue-500 to-blue-400',
    status: 'available'
  },
  {
    id: 'stories',
    category: 'stories',
    title: 'Story Library',
    description: 'Read fun stories and improve your reading!',
    icon: '📖',
    path: '/stories',
    color: 'from-purple-500 to-purple-400',
    status: 'available'
  },
  {
    id: 'word-builder',
    category: 'reading',
    title: 'Word Builder',
    description: 'Build words by putting letters in order!',
    icon: '🔤',
    path: '/reading/word-builder',
    color: 'from-pink-500 to-pink-400',
    status: 'available'
  },
  {
    id: 'sight-words',
    category: 'reading',
    title: 'Sight Words',
    description: 'Learn common words by sight!',
    icon: '👀',
    path: '/reading/sight-words',
    color: 'from-green-500 to-green-400',
    status: 'available'
  },
  {
    id: 'graduation',
    category: 'alphabet',
    title: 'Alphabet Graduation',
    description: 'Celebrate your Alphabet Adventure!',
    icon: '🏆',
    path: '/graduation',
    color: 'from-yellow-500 to-orange-400',
    status: 'available'
  },
  {
    id: 'numbers',
    category: 'numbers',
    title: 'Numbers Kingdom',
    description: 'Learn numbers 0 to 20 with fun activities!',
    icon: '👑',
    path: '/numbers',
    color: 'from-green-500 to-teal-400',
    status: 'available'
  },
  {
    id: 'shapes',
    category: 'shapes',
    title: 'Shapes & Colours Adventure',
    description: 'Explore shapes and colours in the world around you!',
    icon: '🔷',
    path: '/shapes',
    color: 'from-purple-500 to-pink-500',
    status: 'available'
  },
  {
    id: 'maths',
    category: 'maths',
    title: 'Early Maths Adventure',
    description: 'Learn addition, subtraction, counting, and comparing numbers!',
    icon: '🧮',
    path: '/maths',
    color: 'from-orange-400 to-yellow-400',
    status: 'available'
  }
];

const LAST_MODULE_KEY = 'makenna_last_learn_module';

const Learn = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [lastModule, setLastModule] = useState(() => {
    try {
      return localStorage.getItem(LAST_MODULE_KEY) || '';
    } catch {
      return '';
    }
  });

  const filteredModules = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return modules.filter(module => {
      const matchesCategory = category === 'all' || module.category === category;
      const matchesQuery = !lowerQuery
        || module.title.toLowerCase().includes(lowerQuery)
        || module.description.toLowerCase().includes(lowerQuery);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const rememberModule = (id) => {
    try {
      localStorage.setItem(LAST_MODULE_KEY, id);
      setLastModule(id);
    } catch {
      // Ignore storage failures; navigation still works.
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      <div className="text-center">
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
          Learn & Explore
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Choose a learning adventure!
        </p>
      </div>

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="relative w-full max-w-md mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons, games, stories..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Search learning adventures"
          />
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              aria-pressed={category === item.id}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                category === item.id
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => {
          const isContinue = module.id === lastModule;
          return (
            <motion.div
              key={module.id}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-gradient-to-br ${module.color} rounded-2xl p-6 shadow-soft relative overflow-hidden`}
            >
              {isContinue && (
                <span className="absolute top-3 right-3 bg-white/90 text-primary text-xs font-bold px-3 py-1 rounded-full shadow">
                  Continue
                </span>
              )}
              <div className="text-5xl mb-4">{module.icon}</div>

              <h3 className="font-baloo text-2xl font-bold text-white">
                {module.title}
              </h3>

              <p className="text-white/90 text-sm mt-2">
                {module.description}
              </p>

              {module.status === 'available' ? (
                <>
                  <Link
                    to={module.path}
                    onClick={() => rememberModule(module.id)}
                    className="mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-300"
                  >
                    Start Learning
                  </Link>

                  {module.id === 'numbers' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        to="/numbers/games"
                        onClick={() => rememberModule(module.id)}
                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm"
                      >
                        🎮 Games
                      </Link>

                      <Link
                        to="/numbers/stories"
                        onClick={() => rememberModule(module.id)}
                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm"
                      >
                        📖 Stories
                      </Link>

                      <Link
                        to="/numbers/mastery"
                        onClick={() => rememberModule(module.id)}
                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm"
                      >
                        🏆 Mastery
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-4">
                  <span className="inline-block bg-gray-800/50 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No learning adventures match your search.
        </p>
      )}
    </motion.div>
  );
};

export default Learn;