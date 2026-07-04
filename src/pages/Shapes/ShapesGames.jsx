import React from 'react';
import { motion } from 'framer-motion';
import GameHub from '../../components/games/GameHub';

const ShapesGames = () => {
  const games = [
    {
      id: 'shape-match',
      title: 'Shape Match',
      description: 'Match the shapes!',
      icon: '🔄',
      difficulty: 'easy',
      category: 'shapes',
      estimatedTime: 5,
      path: '/games/shapes/shape-match',
      locked: false
    },
    {
      id: 'find-the-shape',
      title: 'Find the Shape',
      description: 'Find all the hidden shapes!',
      icon: '🔍',
      difficulty: 'medium',
      category: 'shapes',
      estimatedTime: 8,
      path: '/games/shapes/find-the-shape',
      locked: false
    },
    {
      id: 'colour-picker',
      title: 'Colour Picker',
      description: 'Pick the right colour!',
      icon: '🎨',
      difficulty: 'easy',
      category: 'colours',
      estimatedTime: 5,
      path: '/games/shapes/colour-picker',
      locked: false
    },
    {
      id: 'shape-sorting',
      title: 'Shape Sorting',
      description: 'Sort objects by shape! Coming soon.',
      icon: '📥',
      difficulty: 'easy',
      category: 'shapes',
      estimatedTime: 5,
      path: '/games/shapes/shape-sorting',
      locked: true
    },
    {
      id: 'shape-memory',
      title: 'Shape Memory',
      description: 'Flip cards and find matching shapes! Coming soon.',
      icon: '🃏',
      difficulty: 'medium',
      category: 'memory',
      estimatedTime: 8,
      path: '/games/shapes/shape-memory',
      locked: true
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      <GameHub
        games={games}
        title="🎨 Shapes Games"
        subtitle="Play and learn your shapes!"
      />
    </motion.div>
  );
};

export default ShapesGames;
