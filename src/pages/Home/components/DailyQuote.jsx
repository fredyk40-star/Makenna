import { motion } from 'framer-motion';
import { useQuote } from '../../../hooks/useQuote';
import { FaQuoteLeft } from 'react-icons/fa';

const DailyQuote = () => {
  const quote = useQuote();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glassmorphism rounded-2xl p-4 md:p-6 text-center"
    >
      <FaQuoteLeft className="text-primary dark:text-blue-400 text-2xl mx-auto mb-2 opacity-50" />
      <p className="text-lg md:text-xl font-baloo text-gray-700 dark:text-gray-200">
        {quote}
      </p>
    </motion.div>
  );
};

export default DailyQuote;