import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameHub from '../../components/games/GameHub';

const AlphabetGames = () => {
  const games = [
    {
      id: 'letter-hunt',
      title: 'Letter Hunt',
      description: 'Find and tap all the letters you hear!',
      icon: '🔍',
      difficulty: 'easy',
      category: 'letters',
      estimatedTime: 5,
      path: '/games/alphabet/letter-hunt',
      locked: false
    },
    {
      id: 'letter-match',
      title: 'Letter Match',
      description: 'Match letters to pictures!',
      icon: '🔄',
      difficulty: 'easy',
      category: 'letters',
      estimatedTime: 5,
      path: '/games/alphabet/letter-match',
      locked: false
    },
    {
      id: 'memory-cards',
      title: 'Memory Cards',
      description: 'Flip cards and find matching pairs!',
      icon: '🃏',
      difficulty: 'medium',
      category: 'memory',
      estimatedTime: 8,
      path: '/games/alphabet/memory-cards',
      locked: false
    },
    {
      id: 'bubble-pop',
      title: 'Bubble Pop',
      description: 'Pop the bubbles with the right letter!',
      icon: '🫧',
      difficulty: 'easy',
      category: 'letters',
      estimatedTime: 4,
      path: '/games/alphabet/bubble-pop',
      locked: false
    },
    {
      id: 'alphabet-bingo',
      title: 'Alphabet Bingo',
      description: 'Listen and tap the letters on your card!',
      icon: '🎯',
      difficulty: 'medium',
      category: 'letters',
      estimatedTime: 10,
      path: '/games/alphabet/bingo',
      locked: false
    },
    {
      id: 'alphabet-order',
      title: 'Alphabet Order',
      description: 'Arrange the letters from A to Z!',
      icon: '📊',
      difficulty: 'medium',
      category: 'letters',
      estimatedTime: 7,
      path: '/games/alphabet/order',
      locked: false
    },
    {
      id: 'beginning-sounds',
      title: 'Beginning Sounds',
      description: 'Match the sound to the right letter!',
      icon: '🔊',
      difficulty: 'medium',
      category: 'sounds',
      estimatedTime: 6,
      path: '/games/alphabet/beginning-sounds',
      locked: false
    },
    {
      id: 'vowel-sorting',
      title: 'Vowel Sorting',
      description: 'Sort vowels and consonants!',
      icon: '📚',
      difficulty: 'hard',
      category: 'letters',
      estimatedTime: 8,
      path: '/games/alphabet/vowel-sorting',
      locked: true
    },
    {
      id: 'shadow-match',
      title: 'Shadow Match',
      description: 'Match letters to their shadows!',
      icon: '🌓',
      difficulty: 'easy',
      category: 'letters',
      estimatedTime: 5,
      path: '/games/alphabet/shadow-match',
      locked: false
    },
    {
      id: 'picture-builder',
      title: 'Picture Builder',
      description: 'Choose the beginning letter for each picture!',
      icon: '🧩',
      difficulty: 'medium',
      category: 'words',
      estimatedTime: 6,
      path: '/games/alphabet/picture-builder',
      locked: false
    },
    {
      id: 'letter-train',
      title: 'Letter Train',
      description: 'Connect the alphabet in the right order!',
      icon: '🚂',
      difficulty: 'medium',
      category: 'letters',
      estimatedTime: 7,
      path: '/games/alphabet/letter-train',
      locked: false
    },
    {
      id: 'treasure-hunt',
      title: 'Treasure Hunt',
      description: 'Collect letters to unlock the treasure!',
      icon: '🗺️',
      difficulty: 'hard',
      category: 'letters',
      estimatedTime: 10,
      path: '/games/alphabet/treasure-hunt',
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
        title="🎮 Alphabet Games"
        subtitle="Play and learn your ABCs!"
      />
    </motion.div>
  );
};

export default AlphabetGames;