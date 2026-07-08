import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaBookOpen, FaPercentage, FaHourglassHalf, FaStar, FaUserGraduate, FaDownload, FaBell, FaCalendar, FaClock, FaChartBar, FaRegCalendarAlt, FaFileExport, FaLock, FaUnlock } from 'react-icons/fa';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import { useMastery } from '../../hooks/useMastery';
import { useChildAccount } from '../../context/ChildAccountContext';
import { ALPHABET_DATA } from '../../data/alphabetData';
import { ChildAccountService } from '../../services/ChildAccountService';

const ParentZone = () => {
  const { child: currentChild } = useChildAccount();
  const { progress: alphabetProgress, getCompletionPercentage: getAlphabetCompletion } = useAlphabetProgress();
  const { progress: numbersProgress, getCompletionPercentage: getNumbersCompletion } = useNumbersProgress();
  const { progressSummary, getLetterMasteryLevel } = useMastery();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [timeLimit, setTimeLimit] = useState(30); // minutes
  const [lockedDays, setLockedDays] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinModal, setShowPinModal] = useState(true);

  useEffect(() => {
    // Load settings from localStorage
    const savedTimeLimit = localStorage.getItem('parent_time_limit');
    const savedLockedDays = JSON.parse(localStorage.getItem('parent_locked_days') || '[]');
    
    if (savedTimeLimit) setTimeLimit(parseInt(savedTimeLimit));
    setLockedDays(savedLockedDays);
    
    // Generate weekly activity data
    generateWeeklyData();
  }, []);

  const generateWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(day => ({
      day,
      alphabet: Math.floor(Math.random() * 5),
      numbers: Math.floor(Math.random() * 5),
      time: Math.floor(Math.random() * 60)
    }));
    setWeeklyData(data);
  };

  const handlePinVerification = async () => {
    if (!currentChild) {
      setPinError('No child account found. Please login first.');
      return;
    }
    
    try {
      const verified = await ChildAccountService.verifyPin(currentChild.childId, pinInput);
      if (verified) {
        setPinVerified(true);
        setShowPinModal(false);
        setPinInput('');
        setPinError('');
      } else {
        setPinError('Incorrect PIN. Please try again.');
      }
    } catch (error) {
      setPinError('Verification failed. Please try again.');
    }
  };

  const handleTimeLimitChange = (e) => {
    const value = parseInt(e.target.value);
    setTimeLimit(value);
    localStorage.setItem('parent_time_limit', value.toString());
  };

  const toggleLockDay = (day) => {
    const newLockedDays = lockedDays.includes(day)
      ? lockedDays.filter(d => d !== day)
      : [...lockedDays, day];
    setLockedDays(newLockedDays);
    localStorage.setItem('parent_locked_days', JSON.stringify(newLockedDays));
  };

  const handleExportReport = () => {
    const report = {
      child: currentChild,
      progress: {
        alphabet: {
          completion: getAlphabetCompletion(),
          time: alphabetProgress.totalTime,
        },
        numbers: {
          completion: getNumbersCompletion(),
          time: numbersProgress.totalTime,
        }
      },
      generated: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-report-${currentChild?.childId || 'child'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    setPinVerified(false);
    setShowPinModal(true);
    setPinInput('');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
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

  const AchievementCard = ({ title, description, unlocked, icon: Icon }) => (
    <motion.div
      variants={itemVariants}
      className={`p-4 rounded-xl ${unlocked ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${unlocked ? 'text-yellow-500' : 'text-gray-400'}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className={`font-semibold ${unlocked ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>
            {title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </motion.div>
  );

  const achievements = [
    { id: 1, title: 'Alphabet Master', desc: 'Complete all letters', unlocked: (progressSummary?.mastered || 0) === 26, icon: FaBookOpen },
    { id: 2, title: 'Star Collector', desc: 'Earn 100 stars', unlocked: (currentChild?.stars || 0) >= 100, icon: FaStar },
    { id: 3, title: 'Time Champion', desc: 'Play for 10 hours', unlocked: (currentChild?.totalTime || 0) >= 600, icon: FaClock },
  ];

  // PIN Modal
  if (showPinModal && !pinVerified) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full shadow-soft"
        >
          <div className="text-center mb-6">
            <FaLock className="text-4xl text-purple-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Parent Zone Access</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Enter your child's PIN to access parent dashboard
            </p>
          </div>
          
          {pinError && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-center">
              {pinError}
            </div>
          )}
          
          <input
            type="password"
            placeholder="Enter 4-digit PIN"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full px-4 py-3 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={4}
          />
          
          <div className="flex gap-2">
            <button
              onClick={handlePinVerification}
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
            >
              Verify PIN
            </button>
            <button
              onClick={() => window.history.back()}
              className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
          <button
            onClick={handleLogout}
            className="ml-auto text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-lg"
          >
            Lock
          </button>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your child's learning dashboard</p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'overview', label: 'Overview', icon: FaChartLine },
          { id: 'achievements', label: 'Achievements', icon: FaStar },
          { id: 'schedule', label: 'Schedule', icon: FaCalendar },
          { id: 'reports', label: 'Reports', icon: FaFileExport },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
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
              value={`${((alphabetProgress.totalTime || 0) + (numbersProgress.totalTime || 0) / 60).toFixed(1)} min`}
              color="bg-yellow-500"
            />
          </div>

          {/* Weekly Activity Chart */}
          <motion.div variants={itemVariants} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
            <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FaRegCalendarAlt /> Weekly Activity
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {weeklyData.map((day, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-xs text-gray-500 mb-1">{day.day}</p>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded h-16 flex items-end justify-center p-1">
                    <div 
                      className="bg-blue-500 rounded w-full" 
                      style={{ height: `${day.alphabet * 20}%` }}
                      title={`${day.alphabet} activities`}
                    />
                  </div>
                </div>
              ))}
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
        </>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map(a => (
            <AchievementCard key={a.id} {...a} />
          ))}
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <motion.div variants={itemVariants} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
            <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FaClock /> Daily Time Limit
            </h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="120"
                value={timeLimit}
                onChange={handleTimeLimitChange}
                className="flex-1"
              />
              <span className="font-bold text-xl text-gray-800 dark:text-white">{timeLimit} min</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
            <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FaCalendar /> Locked Days
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <button
                  key={day}
                  onClick={() => toggleLockDay(day)}
                  className={`p-3 rounded-lg transition-all ${
                    lockedDays.includes(day) 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <motion.div variants={itemVariants} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
          <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FaFileExport /> Export Progress Report
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Download a detailed report of your child's learning progress.
          </p>
          <button
            onClick={handleExportReport}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <FaDownload /> Export Report
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ParentZone;