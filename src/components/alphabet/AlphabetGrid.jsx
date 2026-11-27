import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaStar, FaCheck, FaPlay } from 'react-icons/fa';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { CORE_ALPHABET_SKILLS } from '../../services/AlphabetProgressService';
import { staggerContainer } from '../../utils/constants';

const AlphabetGrid = memo(({ letters }) => {
  const {
    progress,
    isLetterCompleted,
    isLetterFavorited,
    isLetterMastered,
    isSkillComplete,
    getLetterSkillPercent,
  } = useAlphabetProgress();
  const continueId = progress.lastSkill?.letterId || progress.recentLessons[0];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
    >
      {letters.map((letter, index) => {
        const isCompleted = isLetterCompleted(letter.id) || isLetterMastered(letter.id);
        const isFavorited = isLetterFavorited(letter.id);
        const isContinue = continueId === letter.id;
        const skillPercent = getLetterSkillPercent(letter.id);

        return (
          <motion.div
            key={letter.id}
            variants={{
              initial: { opacity: 0, scale: 0.9 },
              animate: {
                opacity: 1,
                scale: 1,
                transition: { delay: Math.min(index * 0.03, 0.3) },
              },
            }}
            whileHover={{ scale: 1.04, y: -4 }}
            whileTap={{ scale: 0.97 }}
            className="relative"
          >
            <Link
              to={`/alphabet/lesson/${letter.id}`}
              className="block h-full bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 shadow-soft hover:shadow-hover transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Learn letter ${letter.letter}${isCompleted ? ', completed' : ''}`}
            >
              <div className="text-center">
                <div className="text-4xl sm:text-5xl md:text-6xl font-baloo font-bold text-primary dark:text-blue-400">
                  {letter.letter}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {letter.lowercase} · {letter.phonetic}
                </div>
              </div>

              <div className="mt-2 text-2xl sm:text-3xl text-center" aria-hidden="true">
                {letter.words[0]?.image || '📚'}
              </div>

              <div className="mt-2 flex items-center justify-center gap-2 min-h-[1rem]">
                {isContinue && (
                  <span className="flex items-center gap-1 text-blue-500 text-[10px] font-semibold">
                    <FaPlay /> Continue
                  </span>
                )}
                {isCompleted && (
                  <span className="text-green-500 text-xs flex items-center gap-1">
                    <FaCheck className="text-[10px]" />
                    <span className="sr-only">Completed</span>
                  </span>
                )}
                {isFavorited && (
                  <span className="text-yellow-500 text-xs">
                    <FaStar className="text-[10px]" />
                    <span className="sr-only">Favorite</span>
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center justify-center gap-1" aria-hidden="true">
                {CORE_ALPHABET_SKILLS.map(skill => (
                  <span
                    key={skill}
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSkillComplete(letter.id, skill) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted ? 'bg-green-500' : 'bg-primary'
                  }`}
                  style={{ width: `${isCompleted ? 100 : skillPercent}%` }}
                />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
});

AlphabetGrid.displayName = 'AlphabetGrid';

export default AlphabetGrid;
