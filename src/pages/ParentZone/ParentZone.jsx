import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaBookOpen, FaPercentage, FaHourglassHalf, FaStar, FaUserGraduate } from 'react-icons/fa';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import { useMastery } from '../../hooks/useMastery';
import { ALPHABET_DATA } from '../../data/alphabetData';

const ParentZone = () => {
  const { progress: alphabetProgress, getCompletionPercentage: getAlphabetCompletion } = useAlphabetProgress();
  const { progress: numbersProgress, getCompletionPercentage: getNumbersCompletion } = useNumbersProgress();
  const { progressSummary, getLetterMasteryLevel } = useMastery();

  const totalTimeAlphabet = (alphabetProgress.totalTime / 60).toFixed(1);
  const totalTimeNumbers = (numbersProgress.totalTime / 60).toFixed(1);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const StatCard = ({ icon, label, value, color }) => (
    <motion.div
      variants={itemVariants}
      className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-soft flex items-center gap-4`}
    >
      <div className={`p-3 rounded-full text-white ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-baloo text-xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-20"
    >
      <motion.div variants={itemVariants}>
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <FaShieldAlt />
          Parent Zone
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your child's learning dashboard</p>
      </motion.div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FaUserGraduate />}
          label="Letters Mastered"
          value={`${progressSummary?.mastered || 0} / ${progressSummary?.total || 26}`}
          color="bg-green-500"
        />
        <StatCard
          icon={<FaPercentage />}
          label="Alphabet"
          value={`${getAlphabetCompletion()}%`}
          color="bg-blue-500"
        />
        <StatCard
          icon={<FaPercentage />}
          label="Numbers"
          value={`${getNumbersCompletion()}%`}
          color="bg-purple-500"
        />
        <StatCard
          icon={<FaHourglassHalf />}
          label="Total Play Time"
          value={`${(parseFloat(totalTimeAlphabet) + parseFloat(totalTimeNumbers)).toFixed(1)} min`}
          color="bg-yellow-500"
        />
      </div>

      {/* Alphabet Mastery Details */}
      <motion.div variants={itemVariants} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FaBookOpen /> Alphabet Mastery
        </h3>
        <div className="flex flex-wrap gap-2">
          {ALPHABET_DATA.map(letter => {
            const masteryLevel = getLetterMasteryLevel(letter.id);
            let bgColor = 'bg-gray-100 dark:bg-gray-700';
            if (masteryLevel === 'Master') bgColor = 'bg-green-200 dark:bg-green-800';
            else if (masteryLevel === 'Diamond' || masteryLevel === 'Gold') bgColor = 'bg-yellow-200 dark:bg-yellow-800';
            else if (masteryLevel === 'Silver') bgColor = 'bg-blue-200 dark:bg-blue-800';

            return (
              <div key={letter.id} className={`p-2 rounded-lg text-center ${bgColor}`}>
                <span className="font-mono font-bold text-lg text-gray-800 dark:text-white">{letter.letter}</span>
                <span className="text-xs block text-gray-600 dark:text-gray-400">{masteryLevel}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

       {/* Recent Activity */}
      <motion.div variants={itemVariants} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FaStar className="text-yellow-400" /> Recent Activity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Recent Letters</h4>
                {alphabetProgress.recentLessons.length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                        {alphabetProgress.recentLessons.map(id => (
                            <span key={id} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full font-semibold text-sm">
                                Letter {ALPHABET_DATA.find(l => l.id === id)?.letter}
                            </span>
                        ))}
                    </div>
                ) : <p className="text-sm text-gray-500 dark:text-gray-400">No recent alphabet lessons.</p>}
            </div>
             <div>
                <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Recent Numbers</h4>
                {numbersProgress.recentLessons.length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                        {numbersProgress.recentLessons.map(id => (
                            <span key={id} className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-3 py-1 rounded-full font-semibold text-sm">
                                Number {id}
                            </span>
                        ))}
                    </div>
                ) : <p className="text-sm text-gray-500 dark:text-gray-400">No recent number lessons.</p>}
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ParentZone;
