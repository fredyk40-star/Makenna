import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaSun, FaCloud, FaCloudRain, FaWater } from 'react-icons/fa';

const waterCycleParts = {
  evaporation: {
    title: 'Evaporation',
    icon: <FaSun className="text-yellow-400" />,
    explanation: 'The sun heats up water in rivers, lakes, and oceans, and turns it into vapor or steam. The water vapor goes into the air.',
  },
  condensation: {
    title: 'Condensation',
    icon: <FaCloud className="text-gray-400" />,
    explanation: 'Water vapor in the air gets cold and changes back into liquid, forming clouds.',
  },
  precipitation: {
    title: 'Precipitation',
    icon: <FaCloudRain className="text-blue-400" />,
    explanation: 'When so much water has condensed that the air cannot hold it anymore, the clouds get heavy and water falls back to the earth in the form of rain, hail, or snow.',
  },
  collection: {
    title: 'Collection',
    icon: <FaWater className="text-blue-600" />,
    explanation: 'When water falls back to earth as precipitation, it may fall back in the oceans, lakes or rivers or it may end up on land. When it ends up on land, it will either soak into the earth and become part of the “ground water” that plants and animals use to drink or it may run over the soil and collect in the oceans, lakes or rivers where the cycle starts all over again.',
  },
};

const WaterCycle = () => {
  const [activePart, setActivePart] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-20"
    >
       <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Link to="/science-lab" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <FaArrowLeft className="text-xl" />
        </Link>
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          💧 The Water Cycle
        </h1>
      </motion.div>

      <motion.p variants={itemVariants} className="text-center text-gray-600 dark:text-gray-300">
        Tap on the labels to learn about each part of the cycle!
      </motion.p>
      
      <motion.div variants={itemVariants} className="relative w-full max-w-2xl mx-auto">
        <svg viewBox="0 0 400 300" className="w-full h-auto">
          {/* Background elements */}
          <path d="M0 250 H 400 V 300 H 0 Z" fill="#60A5FA" /> {/* Water */}
          <path d="M0 150 C 100 100, 200 200, 400 150 V 250 H 0 Z" fill="#4ADE80" /> {/* Land */}
          
          {/* Sun */}
          <motion.g whileHover={{ scale: 1.1 }}>
             <circle cx="50" cy="50" r="25" fill="#FBBF24" />
          </motion.g>

          {/* Evaporation */}
           <motion.g animate={{ y: [0, -10, 0]}} transition={{ repeat: Infinity, duration: 3 }}>
            <path d="M100 240 C 110 220, 130 220, 140 240" stroke="#FBBF24" strokeWidth="2" fill="none" strokeDasharray="4 4" />
            <path d="M120 220 C 130 200, 150 200, 160 220" stroke="#FBBF24" strokeWidth="2" fill="none" strokeDasharray="4 4" />
          </motion.g>
          
          {/* Cloud */}
          <motion.g animate={{ x: [0, 20, 0]}} transition={{ repeat: Infinity, duration: 5 }}>
            <path d="M180 100 a 20 20 0 0 1 0 40 h -40 a 20 20 0 0 1 0 -40Z" fill="#9CA3AF" />
             <path d="M220 110 a 20 20 0 0 1 0 40 h -40 a 20 20 0 0 1 0 -40Z" fill="#9CA3AF" />
          </motion.g>
          
           {/* Rain */}
          <motion.g animate={{ y: [0, 10, 0]}} transition={{ repeat: Infinity, duration: 1 }}>
            <line x1="200" y1="150" x2="190" y2="170" stroke="#3B82F6" strokeWidth="2" />
            <line x1="220" y1="150" x2="210" y2="170" stroke="#3B82F6" strokeWidth="2" />
            <line x1="240" y1="150" x2="230" y2="170" stroke="#3B82F6" strokeWidth="2" />
          </motion.g>
        
          {/* Clickable Labels */}
          <g>
            <foreignObject x="30" y="80" width="100" height="40">
                <button onClick={() => setActivePart('evaporation')} className="font-baloo text-sm font-bold p-1 rounded bg-white/50 dark:bg-black/50">Evaporation</button>
            </foreignObject>
             <foreignObject x="180" y="50" width="100" height="40">
                <button onClick={() => setActivePart('condensation')} className="font-baloo text-sm font-bold p-1 rounded bg-white/50 dark:bg-black/50">Condensation</button>
            </foreignObject>
             <foreignObject x="250" y="150" width="100" height="40">
                <button onClick={() => setActivePart('precipitation')} className="font-baloo text-sm font-bold p-1 rounded bg-white/50 dark:bg-black/50">Precipitation</button>
            </foreignObject>
             <foreignObject x="150" y="260" width="100" height="40">
                <button onClick={() => setActivePart('collection')} className="font-baloo text-sm font-bold p-1 rounded bg-white/50 dark:bg-black/50">Collection</button>
            </foreignObject>
          </g>
        </svg>
      </motion.div>

      <AnimatePresence>
        {activePart && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-soft"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">{waterCycleParts[activePart].icon}</div>
              <div>
                <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
                  {waterCycleParts[activePart].title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{waterCycleParts[activePart].explanation}</p>
              </div>
            </div>
             <button onClick={() => setActivePart(null)} className="absolute top-2 right-2 text-gray-500 dark:text-gray-400">&times;</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WaterCycle;
