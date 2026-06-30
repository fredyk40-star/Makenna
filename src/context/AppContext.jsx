import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'Makenna';
  });

  const [dailyStars, setDailyStars] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_STARS);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [badges, setBadges] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BADGES);
    return saved ? JSON.parse(saved) : [];
  });

  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return saved ? JSON.parse(saved) : {
      lessons: 0,
      minutes: 0,
      streak: 0,
      lastActive: null,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY_STARS, dailyStars.toString());
  }, [dailyStars]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
  }, [badges]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  }, [progress]);

  const addStars = (amount) => {
    setDailyStars(prev => prev + amount);
  };

  const addBadge = (badge) => {
    if (!badges.find(b => b.id === badge.id)) {
      setBadges(prev => [...prev, badge]);
    }
  };

  const updateProgress = (data) => {
    setProgress(prev => ({ ...prev, ...data }));
  };

  const value = {
    userName,
    setUserName,
    dailyStars,
    setDailyStars,
    addStars,
    badges,
    addBadge,
    progress,
    updateProgress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};