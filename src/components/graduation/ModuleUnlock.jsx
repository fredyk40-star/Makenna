import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaLock, FaUnlock } from 'react-icons/fa';

const ModuleUnlock = ({ 
  moduleName = 'Numbers Kingdom',
  moduleIcon = '👑',
  isUnlocked = true,
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-6 text-center ${className}`}
    >
      <div className="text-6xl mb-4">
        {isUnlocked ? moduleIcon : '🔒'}
      </div>
      
      <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
        {isUnlocked ? `Ready for ${moduleName}?` : `${moduleName} Locked`}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300 mt-2">
        {isUnlocked 
          ? 'Complete the Alphabet Adventure to unlock the next module!'
          : 'Keep practicing to unlock this exciting adventure!'
        }
      </p>

      {isUnlocked ? (
        <Link to="/numbers">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 btn-primary flex items-center gap-2 mx-auto"
          >
            Start {moduleName}
            <FaArrowRight className="text-sm" />
          </motion.button>
        </Link>
      ) : (
        <div className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-xl">
          <FaLock className="text-sm" />
          Complete all 26 letters to unlock
        </div>
      )}
    </motion.div>
  );
};

export default ModuleUnlock;