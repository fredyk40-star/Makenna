import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import AlphabetReview from '../../components/graduation/AlphabetReview';
import MasteryDashboard from '../../components/graduation/MasteryDashboard';
import CertificateGenerator from '../../components/graduation/CertificateGenerator';
import AchievementGallery from '../../components/graduation/AchievementGallery';
import ModuleUnlock from '../../components/graduation/ModuleUnlock';
import CelebrationScreen from '../../components/graduation/CelebrationScreen';
import { useMastery } from '../../hooks/useMastery';

const GraduationPage = () => {
  const navigate = useNavigate();
  const { isAllLettersMastered, progressSummary } = useMastery();
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // Check if all letters are mastered
    if (isAllLettersMastered()) {
      setShowCelebration(true);
    }
  }, [isAllLettersMastered]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/learn')}
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Learn"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="font-baloo text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
              🏆 Alphabet Graduation
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Celebrate your Alphabet Adventure!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Progress: {progressSummary?.progress || 0}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressSummary?.progress || 0}%` }}
          transition={{ duration: 1 }}
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
        />
      </div>

      {/* Mastery Dashboard */}
      <MasteryDashboard />

      {/* Alphabet Review */}
      <AlphabetReview />

      {/* Achievement Gallery */}
      <AchievementGallery />

      {/* Certificate */}
      {progressSummary?.mastered >= 13 && (
        <div className="mt-8">
          <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white mb-4">
            🎓 Your Certificate
          </h2>
          <CertificateGenerator
            childName="Makenna"
            stars={progressSummary?.mastered || 0}
            readingLevel="Growing Reader"
          />
        </div>
      )}

      {/* Module Unlock */}
      <ModuleUnlock
        moduleName="Numbers Kingdom"
        moduleIcon="👑"
        isUnlocked={isAllLettersMastered()}
      />

      {/* Celebration Screen */}
      {showCelebration && (
        <CelebrationScreen
          onContinue={() => setShowCelebration(false)}
        />
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl">
        <h4 className="font-baloo text-lg font-bold text-gray-800 dark:text-white mb-2">
          💡 What's Next?
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• Review any letters you're still practicing</li>
          <li>• Try the Word Builder to practice reading</li>
          <li>• Read stories in the Story Library</li>
          <li>• When you're ready, start Numbers Kingdom!</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default GraduationPage;