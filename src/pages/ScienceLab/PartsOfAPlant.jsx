import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaSeedling } from 'react-icons/fa';

const PartsOfAPlant = () => {
  const plantParts = [
    { name: 'Roots', function: 'Absorb water and nutrients from the soil.', emoji: '🌱' },
    { name: 'Stem', function: 'Supports the plant and carries water and nutrients.', emoji: '🌿' },
    { name: 'Leaves', function: 'Make food for the plant through photosynthesis.', emoji: '🍃' },
    { name: 'Flower', function: 'Helps the plant to reproduce.', emoji: '🌸' },
    { name: 'Fruit', function: 'Protects the seeds and helps them to spread.', emoji: '🍎' },
    { name: 'Seeds', function: 'Grow into new plants.', emoji: '🌰' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center gap-4">
        <Link to="/science-lab" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <FaArrowLeft className="text-xl" />
        </Link>
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <FaSeedling />
          Parts of a Plant
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plantParts.map((part, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft"
          >
            <div className="text-4xl mb-3">{part.emoji}</div>
            <h3 className="font-baloo text-2xl font-bold text-green-600 dark:text-green-400">{part.name}</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{part.function}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default PartsOfAPlant;
