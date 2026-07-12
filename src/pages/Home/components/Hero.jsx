import { motion } from 'framer-motion';
import { useGreeting } from '../../../hooks/useGreeting';
import { useApp } from '../../../context/AppContext';
import FloatingElements from './FloatingElements';

const Hero = () => {
  const greeting = useGreeting();
  const { userName } = useApp();

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 p-6 md:p-8 lg:p-10 min-h-[200px] md:min-h-[240px]">
      <FloatingElements />
      
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-2xl md:text-3xl lg:text-4xl font-baloo text-gray-700 dark:text-gray-200">
            {greeting.greeting} {greeting.emoji}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-baloo font-bold text-primary dark:text-blue-400 mt-1">
            Hello {userName}!
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mt-2 font-semibold">
            Ready for today's adventure?
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;