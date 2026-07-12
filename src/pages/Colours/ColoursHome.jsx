import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { COLOURS_DATA } from '../../data/coloursData';
import { ROUTES } from '../../routes';

const ColoursHome = () => {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl md:text-4xl font-bold font-baloo text-center text-gray-800 dark:text-white mb-6">
        Colours Adventure
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {COLOURS_DATA.map((colour, index) => (
          <Link to={`/colours/lesson/${colour.id}`} key={colour.id}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="aspect-square rounded-2xl p-4 flex flex-col justify-end text-white font-bold"
              style={{ backgroundColor: colour.hex }}
            >
              <span className="text-lg">{colour.name}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ColoursHome;
