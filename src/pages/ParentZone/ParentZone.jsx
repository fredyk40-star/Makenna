import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaBookOpen, FaPercentage, FaHourglassHalf, FaStar, FaUserGraduate, FaDownload, FaCalendar, FaClock, FaChartLine, FaRegCalendarAlt, FaFileExport, FaLock } from 'react-icons/fa';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import { useMastery } from '../../hooks/useMastery';
import { useChildAccount } from '../../context/ChildAccountContext';
import { ALPHABET_DATA } from '../../data/alphabetData';
import { ChildAccountService } from '../../services/ChildAccountService';
import { LearningAnalytics } from '../../services/LearningAnalytics';
import { GamificationService } from '../../services/GamificationService';
import { SafeModeService } from '../../services/SafeModeService';
import ParentReportService from '../../services/ParentReportService';




const ParentZone = () => {
  const { activeChild: currentChild } = useChildAccount();
  const { progress: alphabetProgress, getCompletionPercentage: getAlphabetCompletion } = useAlphabetProgress();
  const { progress: numbersProgress, getCompletionPercentage: getNumbersCompletion } = useNumbersProgress();
  const { progressSummary } = useMastery();

  const [activeTab, setActiveTab] = useState('overview');
  const [timeLimit, setTimeLimit] = useState(30); // minutes
  const [lockedDays, setLockedDays] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [safeSettings, setSafeSettings] = useState(SafeModeService.getSettings(currentChild?.childId || ''));
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinModal, setShowPinModal] = useState(true);

  useEffect(() => {
    if (!currentChild?.childId) return;

    const childId = currentChild.childId;
    const savedTimeLimit = localStorage.getItem('parent_time_limit');
    const savedLockedDays = JSON.parse(localStorage.getItem('parent_locked_days') || '[]');

    if (savedTimeLimit) setTimeLimit(parseInt(savedTimeLimit, 10));
    setLockedDays(savedLockedDays);
    setSafeSettings(SafeModeService.getSettings(childId));

    // Real activity, not fabricated numbers.
    const daily = LearningAnalytics.getDailyGraph(childId, 7);
    setWeeklyData(daily.map(day => ({
      day: day.day,
      alphabet: day.lessons,
      numbers: day.answers,
      accuracy: day.accuracy,
      time: Math.round(day.xp / 10),
    })));
    const child = ChildAccountService.getChild(childId) || { childId };
    setWeeklySummary(ParentReportService.getReport(child).summary);
  }, [currentChild?.childId]);

  const handleSafeSettingChange = (key, value) => {
    if (!currentChild?.childId) return;
    const next = SafeModeService.updateSettings(currentChild.childId, { ...safeSettings, [key]: value });
    setSafeSettings(next);
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
    const value = parseInt(e.target.value, 10);
    setTimeLimit(value);
    localStorage.setItem('parent_time_limit', value.toString());
    handleSafeSettingChange('dailyLimit', value);
  };

  const toggleLockDay = (day) => {
    const newLockedDays = lockedDays.includes(day)
      ? lockedDays.filter(d => d !== day)
      : [...lockedDays, day];
    setLockedDays(newLockedDays);
    localStorage.setItem('parent_locked_days', JSON.stringify(newLockedDays));
  };

  const report = currentChild ? ParentReportService.getReport(currentChild) : null;

  const handleExportReport = () => {
    if (!report) return;

    const blob = new Blob([ParentReportService.toJson(report)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `progress-report-${currentChild.childId}-${report.generatedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleToggleGamification = (key) => {
    if (!currentChild?.childId) return;
    const state = GamificationService.getState(currentChild.childId);
    state[key] = !state[key];
    GamificationService.saveState(currentChild.childId, state);
    setWeeklySummary(ParentReportService.getReport(currentChild).summary);
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
              value={`${Math.round(((alphabetProgress.totalTime || 0) + (numbersProgress.totalTime || 0)) / 60)} min`}
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
                      style={{ height: `${Math.min(100, day.alphabet * 20)}%` }}
                      title={`${day.alphabet} lessons · ${day.accuracy}% accuracy`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* What Makenna learned this week */}
          <motion.div variants={itemVariants} className="p-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-soft text-white">
            <h3 className="font-baloo text-xl font-bold mb-2 flex items-center gap-2">
              <FaBookOpen /> What {currentChild?.fullName?.split(' ')[0] || 'Makenna'} learned this week
            </h3>
            <p className="text-white/90">{weeklySummary?.learnedText || 'No completed lessons yet.'}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[
                ['Lessons', weeklySummary?.weeklyLessons || 0],
                ['Minutes', weeklySummary?.weeklyMinutes || 0],
                ['Average score', `${weeklySummary?.averageScore || 0}%`],
                ['Mission streak', `${weeklySummary?.missionStreak || 0} days`],
              ].map(([label, value]) => (
                <div key={label} className="bg-white/20 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs opacity-90">{label}</p>
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

          <motion.div variants={itemVariants} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft space-y-4">
            <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FaShieldAlt /> Safety &amp; Content
            </h3>
            {[
              { key: 'enabled', label: 'Safe mode' },
              { key: 'safeSearch', label: 'Safe search' },
              { key: 'parentalLock', label: 'Parental lock' },
            ].map(option => (
              <div key={option.key} className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                <button
                  type="button"
                  onClick={() => handleSafeSettingChange(option.key, !safeSettings[option.key])}
                  className={`px-4 py-1 rounded-full text-sm font-semibold ${
                    safeSettings[option.key] ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {safeSettings[option.key] ? 'On' : 'Off'}
                </button>
              </div>
            ))}
            {[
              { key: 'soundEffectsEnabled', label: 'Sound effects' },
              { key: 'confettiEnabled', label: 'Celebration animations' },
            ].map(option => (
              <div key={option.key} className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                <button
                  type="button"
                  onClick={() => handleToggleGamification(option.key)}
                  className={`px-4 py-1 rounded-full text-sm font-semibold ${
                    GamificationService.getState(currentChild?.childId || '')[option.key] !== false
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {GamificationService.getState(currentChild?.childId || '')[option.key] !== false ? 'On' : 'Off'}
                </button>
              </div>
            ))}
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
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportReport}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            >
              <FaDownload /> Export JSON
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
            >
              <FaFileExport /> Print / Save PDF
            </button>
          </div>

          <div className="print-report mt-6 border-t pt-6 text-gray-900">
            <h2 className="text-2xl font-bold mb-2">Makenna Learning Lab — Progress Report</h2>
            <p className="mb-4">Generated {report?.generatedAt}</p>
            <p className="font-semibold mb-4">{report?.summary.learnedText}</p>
            <table className="w-full text-left border-collapse text-sm">
              <tbody>
                {[
                  ['Child', report?.child.name],
                  ['Level', report?.child.level],
                  ['Stars earned', report?.child.stars],
                  ['Lessons completed', report?.summary.totalLessons],
                  ['Average score', `${report?.summary.averageScore}%`],
                  ['Active days', report?.summary.daysActive],
                  ['Mission streak', `${report?.summary.missionStreak} days`],
                  ['Letters mastered', report?.mastery.alphabet],
                  ['Numbers mastered', report?.mastery.numbers],
                ].map(([label, value]) => (
                  <tr key={label} className="border-b border-gray-300">
                    <th className="py-1 pr-4 font-semibold">{label}</th>
                    <td className="py-1">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="text-lg font-bold mt-6 mb-2">Last 7 days</h3>
            <ul className="text-sm">
              {report?.charts.daily.map(day => (
                <li key={day.date}>
                  {day.day} {day.date}: {day.lessons} lessons, {day.answers} answers, {day.accuracy}% accuracy
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ParentZone;