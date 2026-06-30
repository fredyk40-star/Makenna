import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const animals = [
  { name: 'Lion', emoji: '🦁', sound: 'Roar!' },
  { name: 'Elephant', emoji: '🐘', sound: 'Trumpet!' },
  { name: 'Monkey', emoji: '🐵', sound: 'Chatter!' },
  { name: 'Giraffe', emoji: '🦒', sound: '...' },
  { name: 'Zebra', emoji: '🦓', sound: 'Neigh!' },
  { name: 'Hippo', emoji: '🦛', sound: 'Grunt!' },
];

const AnimalSafari = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      <div className="flex items-center justify-between">
        <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
          <FaArrowLeft className="text-xl" />
        </Link>
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
          Animal Safari
        </h1>
        <div className="w-8"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {animals.map((animal) => (
          <motion.div
            key={animal.name}
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft text-center"
          >
            <div className="text-6xl mb-4">{animal.emoji}</div>
            <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
              {animal.name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{animal.sound}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AnimalSafari;
