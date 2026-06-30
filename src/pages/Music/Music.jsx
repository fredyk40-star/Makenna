import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaMusic, FaDrum, FaGuitar, FaKeyboard, FaVolumeUp } from 'react-icons/fa';
import audioService from '../../services/AudioService';

const instruments = [
  { name: 'Drum', icon: <FaDrum />, sound: '/audio/instruments/drum.mp3' },
  { name: 'Guitar', icon: <FaGuitar />, sound: '/audio/instruments/guitar.mp3' },
  { name: 'Keyboard', icon: <FaKeyboard />, sound: '/audio/instruments/keyboard.mp3' },
  { name: 'Voice', icon: '🎤', sound: '/audio/instruments/voice.mp3' },
];

const Music = () => {
  const [playing, setPlaying] = useState(null);

  const playSound = async (instrument) => {
    try {
      // Ensure audio context is started
      audioService.initAudioContext();
      await audioService.resumeContext();

      setPlaying(instrument.name);
      
      const audioBuffer = await audioService.loadAudio(instrument.sound, {
        fallbackText: `Playing a ${instrument.name} sound.`
      });
      
      audioService.play(audioBuffer, {
        onEnd: () => setPlaying(null)
      });

    } catch (error) {
      console.error(`Could not play sound for ${instrument.name}:`, error);
      // Fallback for when audio file is missing
      audioService.speak(`This is a ${instrument.name}. Add a sound file to hear it!`);
      setPlaying(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      <div className="flex items-center justify-between">
        <Link to="/games" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
          <FaArrowLeft className="text-xl" />
        </Link>
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FaMusic />
          Music Time
        </h1>
        <div className="w-8"></div>
      </div>

      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-300">
          Tap the instruments to play a sound!
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {instruments.map((instrument) => (
          <motion.button
            key={instrument.name}
            onClick={() => playSound(instrument)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ scale: playing === instrument.name ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 10 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft text-center cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-400 dark:focus:ring-purple-600"
          >
            <div className={`text-6xl mb-4 text-purple-500 transition-transform duration-200 ${playing === instrument.name ? 'animate-pulse' : ''}`}>
              {instrument.icon}
            </div>
            <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
              {instrument.name}
            </h3>
          </motion.button>
        ))}
      </div>

       <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl">
         <FaVolumeUp className="text-4xl text-purple-500 mx-auto" />
        <p className="text-gray-600 dark:text-gray-300 mt-2 font-semibold">
          Make sure your sound is on!
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          If you can't hear anything, please add the instrument sound files to the `public/audio/instruments` folder.
        </p>
      </div>
    </motion.div>
  );
};

export default Music;
