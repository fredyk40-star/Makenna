import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaMapMarkedAlt } from 'react-icons/fa';
import { GHANA_REGIONS_DATA } from '../../data/ghanaData';

const GhanaExplorer = () => {
  const [activeRegion, setActiveRegion] = useState(null);

  const regions = Object.entries(GHANA_REGIONS_DATA);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center gap-4">
        <Link to="/" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <FaArrowLeft className="text-xl" />
        </Link>
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <FaMapMarkedAlt />
          Ghana Explorer
        </h1>
      </div>

      <p className="text-center text-gray-600 dark:text-gray-300">
        Tap on a region to learn a fun fact about it!
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {regions.map(([key, region], index) => (
          <motion.button
            key={key}
            onClick={() => setActiveRegion(region)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-soft text-center"
          >
            <div className="text-4xl mb-2">{region.icon}</div>
            <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white">{region.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{region.capital}</p>
          </motion.button>
        ))}
      </div>
      
      <AnimatePresence>
        {activeRegion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => setActiveRegion(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-6xl mx-auto mb-4">{activeRegion.icon}</div>
              <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                {activeRegion.name}
              </h2>
              <h3 className="font-semibold text-gray-500 dark:text-gray-400 mb-4">
                Capital: {activeRegion.capital}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {activeRegion.fact}
              </p>
               <button 
                onClick={() => setActiveRegion(null)} 
                className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-full font-bold font-baloo"
                >
                Close
                </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GhanaExplorer;
