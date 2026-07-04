import React from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaShieldAlt, FaStar, FaBook, FaSortNumericDown, FaSignOutAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import { ALPHABET_DATA } from '../../data/alphabetData';
import { NUMBERS_DATA } from '../../data/numbersData';
import { ChildAccountService } from '../../services/ChildAccountService';
import { useChildAccount } from '../../context/ChildAccountContext';

const Profile = () => {
  const { getCompletionPercentage: getAlphabetCompletion, getFavoriteLetters } = useAlphabetProgress();
  const { getCompletionPercentage: getNumbersCompletion, progress: numbersProgress } = useNumbersProgress();
  const { logout } = useChildAccount();

  const alphabetCompletion = getAlphabetCompletion();
  const numbersCompletion = getNumbersCompletion();
  const favoriteLetters = getFavoriteLetters();
  const favoriteNumbers = numbersProgress.favorites;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      ChildAccountService.logoutChild();
      logout();
    }
  };

  const getLetterById = (id) => ALPHABET_DATA.find(letter => letter.id === id);
  const getNumberById = (id) => NUMBERS_DATA.find(number => number.id === id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-20"
    >
      {/* User Header */}
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
        <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-3 rounded-full text-white">
          <FaUser className="text-4xl" />
        </div>
        <div>
          <h1 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
            Little Learner
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome to your dashboard!</p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
        <h2 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4">My Progress</h2>
        <div className="space-y-4">
          {/* Alphabet Progress */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300"><FaBook className="inline mr-2" />Alphabet</span>
              <span className="text-sm font-bold text-blue-500">{alphabetCompletion}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${alphabetCompletion}%` }}></div>
            </div>
          </div>
          {/* Numbers Progress */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300"><FaSortNumericDown className="inline mr-2" />Numbers</span>
              <span className="text-sm font-bold text-purple-500">{numbersCompletion}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${numbersCompletion}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Favorites Section */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
        <h2 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4"><FaStar className="inline mr-2 text-yellow-400" />My Favorites</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Favorite Letters</h3>
            {favoriteLetters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {favoriteLetters.map(letterId => {
                  const letter = getLetterById(letterId);
                  return (
                    <span key={letterId} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full font-mono text-lg font-bold">
                      {letter?.letter}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No favorite letters yet.</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Favorite Numbers</h3>
            {favoriteNumbers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {favoriteNumbers.map(numberId => {
                   const number = getNumberById(numberId);
                  return (
                    <span key={numberId} className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-3 py-1 rounded-full font-mono text-lg font-bold">
                      {number?.number}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No favorite numbers yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Parent Zone Link */}
      <Link to="/parent-zone" className="block w-full">
        <div className="w-full p-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl shadow-soft hover:shadow-hover transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-center gap-3">
            <FaShieldAlt className="text-2xl" />
            <span className="font-baloo text-lg font-bold">Parent Zone</span>
          </div>
          <p className="text-center text-sm opacity-90 mt-1">View progress details and settings</p>
        </div>
      </Link>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full p-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl shadow-soft hover:shadow-hover transform hover:-translate-y-1 transition-all duration-300"
      >
        <div className="flex items-center justify-center gap-3">
          <FaSignOutAlt className="text-2xl" />
          <span className="font-baloo text-lg font-bold">Logout</span>
        </div>
        <p className="text-center text-sm opacity-90 mt-1">Sign out of your account</p>
      </button>
    </motion.div>
  );
};

export default Profile;
