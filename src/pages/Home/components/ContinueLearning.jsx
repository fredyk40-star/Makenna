import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaBookOpen, FaCalculator, FaStar } from 'react-icons/fa';
import { useChildAccount } from '../../../context/ChildAccountContext';
import { RecommendationService } from '../../../services/RecommendationService';
import { ChildAccountService } from '../../../services/ChildAccountService';

const ContinueLearning = () => {
  const navigate = useNavigate();
  const { child } = useChildAccount();
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    if (child?.childId) {
      const childData = ChildAccountService.getActiveChild();
      const rec = RecommendationService.getNextRecommendation(child.childId, childData);
      setRecommendation(rec);
    }
  }, [child]);

  const getSubjectIcon = (subject) => {
    switch (subject?.toLowerCase()) {
      case 'alphabet': return '🔤';
      case 'numbers': return '🔢';
      case 'reading': return '📖';
      case 'maths': return '➕';
      case 'science': return '🔬';
      default: return '📚';
    }
  };

  const getSubjectGradient = (subject) => {
    switch (subject?.toLowerCase()) {
      case 'alphabet': return 'from-blue-400 to-cyan-400';
      case 'numbers': return 'from-green-400 to-emerald-400';
      case 'reading': return 'from-purple-400 to-indigo-400';
      case 'maths': return 'from-orange-400 to-amber-400';
      case 'science': return 'from-red-400 to-rose-400';
      default: return 'from-gray-400 to-slate-400';
    }
  };

  const handleContinue = () => {
    if (recommendation) {
      // Navigate to the recommended lesson
      navigate(recommendation.path || '/learn');
    } else {
      navigate('/learn');
    }
  };

  // If no child is logged in, show the placeholder
  if (!child) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-baloo font-bold text-gray-800 dark:text-white">
            Continue Learning
          </h2>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        >
          <motion.div
            className="flex-shrink-0 w-64 md:w-72 bg-gradient-to-br from-gray-400 to-gray-300 rounded-2xl p-6 shadow-soft"
          >
            <div className="text-4xl mb-3">📚</div>
            <p className="text-white font-bold text-lg">Your next lesson will appear here!</p>
            <p className="text-white/70 text-sm mt-1">Login to see personalized recommendations.</p>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-baloo font-bold text-gray-800 dark:text-white">
          Continue Learning
        </h2>
        <motion.button
          onClick={() => navigate('/learn')}
          className="text-primary dark:text-blue-400 font-semibold flex items-center gap-1 text-sm"
          whileTap={{ scale: 0.95 }}
        >
          See All <FaArrowRight className="text-xs" />
        </motion.button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {recommendation ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`flex-shrink-0 w-64 md:w-72 bg-gradient-to-br ${getSubjectGradient(recommendation.subject)} rounded-2xl p-6 shadow-soft cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all`}
            onClick={handleContinue}
          >
            <div className="text-4xl mb-3">{getSubjectIcon(recommendation.subject)}</div>
            <h3 className="text-white font-bold text-lg mb-1">{recommendation.title}</h3>
            <p className="text-white/70 text-sm mb-3">{recommendation.description}</p>
            <div className="flex items-center gap-2 text-white/90 text-xs">
              <FaStar className="text-yellow-300" />
              <span>Continue where you left off</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-shrink-0 w-64 md:w-72 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl p-6 shadow-soft cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all"
            onClick={() => navigate('/learn')}
          >
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-white font-bold text-lg mb-1">Start Learning!</h3>
            <p className="text-white/70 text-sm mb-3">Begin your learning journey today</p>
            <div className="flex items-center gap-2 text-white/90 text-xs">
              <FaStar className="text-yellow-300" />
              <span>Tap to explore subjects</span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ContinueLearning;