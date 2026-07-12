import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChartBar, FaChartLine, FaCalendar, FaStar } from 'react-icons/fa';
import { LearningAnalytics } from '../../services/LearningAnalytics';
import { ChildAccountService } from '../../services/ChildAccountService';

const ProgressAnalyticsComponent = () => {
  const [analytics, setAnalytics] = useState(null);
  const [activeChart, setActiveChart] = useState('progress');

  const childId = ChildAccountService.getActiveChildId();

  useEffect(() => {
    if (childId) {
      loadAnalytics();
    }
  }, [childId]);

  const loadAnalytics = () => {
    const data = LearningAnalytics.getProgressTrends(childId);
    setAnalytics(data);
  };

  if (!analytics) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  const stats = LearningAnalytics.getStats(childId);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
          Progress Analytics
        </h2>
        <button
          onClick={loadAnalytics}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-700 rounded-lg">
          <FaStar className="text-yellow-400 text-2xl mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.starsEarned}</p>
          <p className="text-xs text-gray-400">Stars Earned</p>
        </div>
        <div className="text-center p-3 bg-gray-700 rounded-lg">
          <FaChartBar className="text-blue-400 text-2xl mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.lessonsCompleted}</p>
          <p className="text-xs text-gray-400">Lessons</p>
        </div>
        <div className="text-center p-3 bg-gray-700 rounded-lg">
          <FaCalendar className="text-green-400 text-2xl mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.daysActive}</p>
          <p className="text-xs text-gray-400">Days Active</p>
        </div>
        <div className="text-center p-3 bg-gray-700 rounded-lg">
          <FaChartLine className="text-purple-400 text-2xl mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.averageScore}%</p>
          <p className="text-xs text-gray-400">Avg Score</p>
        </div>
      </div>

      {/* Chart Navigation */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'progress', label: 'Progress', icon: FaChartBar },
          { id: 'time', label: 'Time', icon: FaCalendar }
        ].map(chart => (
          <button
            key={chart.id}
            onClick={() => setActiveChart(chart.id)}
            className={`flex items-center gap-2 px-3 py-1 rounded ${
              activeChart === chart.id ? 'bg-purple-600' : 'bg-gray-700'
            }`}
          >
            <chart.icon />
            {chart.label}
          </button>
        ))}
      </div>

      {/* Chart Display */}
      <div className="h-48 bg-gray-700 rounded-lg p-4">
        <div className="flex items-end justify-between h-full gap-2">
          {analytics.progressTrend?.slice(-10).map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-purple-500 rounded-t"
                style={{ height: `${Math.max(10, item.progress)}%` }}
              />
              <span className="text-xs text-gray-400 mt-1">
                {new Date(item.date).toLocaleDateString('en', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressAnalyticsComponent;