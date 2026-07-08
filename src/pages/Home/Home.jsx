import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Hero from './components/Hero';
import NavigationCards from './components/NavigationCards';
import DailyQuote from './components/DailyQuote';
import DailyChallenge from './components/DailyChallenge';
import ProgressSection from './components/ProgressSection';
import ContinueLearning from './components/ContinueLearning';
import ParentSection from './components/ParentSection';
import AIAssistant from '../../components/AIAssistant/AIAssistant';

const Home = () => {
  return (
    <div className="space-y-6 md:space-y-8 pb-4">
      <Hero />
      <DailyQuote />
      <DailyChallenge />
      <ProgressSection />
      <NavigationCards />
      <ContinueLearning />
      <ParentSection />
      <AIAssistant />
    </div>
  );
};

export default Home;
