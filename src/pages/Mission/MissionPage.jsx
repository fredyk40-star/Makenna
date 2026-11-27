import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaCheck, FaArrowRight, FaStar, FaFire, FaGift } from 'react-icons/fa';
import { useChildAccount } from '../../context/ChildAccountContext';
import DailyMissionService from '../../services/DailyMissionService';

const STEPS_LABEL = ['Review', 'Lesson', 'Game'];

const MissionPage = () => {
  const { activeChild } = useChildAccount();
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState('');

  const { summary, completedIds } = useMemo(() => {
    if (!activeChild?.childId) return { summary: null, completedIds: [] };
    return {
      summary: DailyMissionService.getSummary(activeChild.childId),
      completedIds: DailyMissionService.getMission(activeChild.childId).completed,
    };
  }, [activeChild?.childId, version]);

  const refresh = useCallback(() => setVersion(value => value + 1), []);

  const handleComplete = useCallback((stepId) => {
    if (!activeChild?.childId) return;
    const result = DailyMissionService.completeStep(activeChild.childId, stepId);
    setMessage(result.success ? 'Great job! Step complete.' : 'Could not complete that step.');
    refresh();
  }, [activeChild?.childId, refresh]);

  const handleClaim = useCallback(() => {
    if (!activeChild?.childId) return;
    const result = DailyMissionService.claimReward(activeChild.childId);
    setMessage(result.success
      ? `You earned ${result.stars} stars! ${result.streak} day streak!`
      : 'Finish all three activities first!');
    refresh();
  }, [activeChild?.childId, refresh]);

  if (!activeChild) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Log in to start your daily mission.
        </p>
        <Link to="/login" className="mt-4 inline-block text-primary font-bold">
          Go to login
        </Link>
      </div>
    );
  }

  const streak = DailyMissionService.getStreak(activeChild.childId);

  return (
    <div className="space-y-6 pb-6">
      <header className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 md:p-8 text-white shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
              {new Date(summary.date).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl md:text-4xl font-baloo font-bold mt-1">
              Today's Mission
            </h1>
            <p className="text-white/90 mt-2">
              A little every day makes a big difference!
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 shrink-0">
            <FaFire className="text-yellow-300 text-xl" />
            <span className="font-bold">{streak} day streak</span>
          </div>
        </div>

        <div className="mt-5 bg-white/20 rounded-full h-4 overflow-hidden" role="progressbar"
          aria-valuenow={summary.percent} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${summary.percent}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <p className="text-sm mt-2 font-semibold">
          {summary.completed} of {summary.total} activities done
        </p>
      </header>

      <p className="min-h-6 text-center font-semibold text-primary dark:text-blue-300" aria-live="polite">
        {message}
      </p>

      <ol className="grid gap-4 md:grid-cols-2">
        {summary.steps.map((step, index) => {
          const done = completedIds.includes(step.id) || summary.rewardClaimed;
          const isReward = step.id === 'reward';

          return (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`rounded-2xl p-5 bg-white dark:bg-gray-800 shadow-soft border-2 ${
                done ? 'border-green-400' : 'border-transparent'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl" aria-hidden="true">{step.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                      {isReward ? 'Step 4' : `Step ${index + 1} · ${step.minutes} min`}
                    </span>
                    {done && <FaCheck className="text-green-500" aria-label="Completed" />}
                  </div>
                  <h2 className="text-xl font-baloo font-bold text-gray-800 dark:text-white">
                    {step.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{step.subtitle}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{step.reason}</p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {step.path && (
                      <Link
                        to={step.path}
                        className="inline-flex items-center gap-2 bg-primary text-white rounded-full px-4 py-2 text-sm font-bold hover:opacity-90"
                      >
                        Start <FaArrowRight />
                      </Link>
                    )}
                    {!isReward && !done && (
                      <button
                        type="button"
                        onClick={() => handleComplete(step.id)}
                        className="rounded-full px-4 py-2 text-sm font-bold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:opacity-90"
                      >
                        I did it!
                      </button>
                    )}
                    {isReward && (
                      <button
                        type="button"
                        onClick={handleClaim}
                        disabled={!summary.canClaim || summary.rewardClaimed}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold bg-yellow-400 text-yellow-900 disabled:opacity-50"
                      >
                        {summary.rewardClaimed ? <FaCheck /> : <FaGift />}
                        {summary.rewardClaimed ? 'Claimed' : `Claim ${30} stars`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <FaStar className="text-yellow-400" />
        <span>{STEPS_LABEL.join(' → ')} → Reward</span>
      </div>
    </div>
  );
};

export default MissionPage;
