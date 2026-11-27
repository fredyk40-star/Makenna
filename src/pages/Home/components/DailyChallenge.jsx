import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaStar, FaRocket, FaArrowRight } from 'react-icons/fa';
import { useChildAccount } from '../../../context/ChildAccountContext';
import DailyMissionService from '../../../services/DailyMissionService';

const DailyChallenge = () => {
  const { activeChild } = useChildAccount();
  const summary = useMemo(() => (
    activeChild?.childId ? DailyMissionService.getSummary(activeChild.childId) : null
  ), [activeChild?.childId]);

  const completed = summary?.completed || 0;
  const total = summary?.total || 3;
  const percent = summary?.percent || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-2xl p-6 md:p-8 text-white shadow-soft"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FaRocket className="text-2xl" />
            <h3 className="text-xl md:text-2xl font-baloo font-bold">
              Today's Adventure
            </h3>
          </div>
          <p className="text-lg md:text-xl font-semibold mt-2">
            {summary?.rewardClaimed
              ? 'Mission complete! Come back tomorrow.'
              : `Complete ${total} activities`}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <FaStar className="text-yellow-300" />
            <span className="font-bold">Earn {summary?.rewardClaimed ? 'more ' : ''}stars</span>
            <span className="text-sm opacity-90">· {completed}/{total} done</span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: summary?.rewardClaimed ? 0 : 360 }}
          transition={{ duration: 8, repeat: summary?.rewardClaimed ? 0 : Infinity, ease: 'linear' }}
          className="text-4xl md:text-5xl"
          aria-hidden="true"
        >
          {summary?.rewardClaimed ? '🏆' : '🌟'}
        </motion.div>
      </div>

      <div
        className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>

      <Link
        to="/mission"
        className="mt-4 inline-flex items-center gap-2 bg-white/25 hover:bg-white/35 rounded-full px-4 py-2 font-bold text-sm"
      >
        {summary?.rewardClaimed ? 'View mission' : 'Start mission'} <FaArrowRight />
      </Link>
    </motion.div>
  );
};

export default DailyChallenge;
