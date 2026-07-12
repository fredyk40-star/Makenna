import { motion } from 'framer-motion';
import { FaStar, FaRocket } from 'react-icons/fa';

const DailyChallenge = () => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-2xl p-6 md:p-8 text-white shadow-soft"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FaRocket className="text-2xl" />
            <h3 className="text-xl md:text-2xl font-baloo font-bold">
              Today's Adventure
            </h3>
          </div>
          <p className="text-lg md:text-xl font-semibold mt-2 opacity-90">
            Complete 3 activities
          </p>
          <div className="flex items-center gap-2 mt-2">
            <FaStar className="text-yellow-300" />
            <span className="font-bold">Earn 30 stars</span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-4xl md:text-5xl"
        >
          🌟
        </motion.div>
      </div>
      
      {/* Progress bar placeholder */}
      <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '33%' }}
          transition={{ duration: 1, delay: 0.5 }}
          className="h-full bg-white rounded-full"
        />
      </div>
    </motion.div>
  );
};

export default DailyChallenge;