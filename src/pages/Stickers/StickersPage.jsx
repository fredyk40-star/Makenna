import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaPuzzlePiece } from 'react-icons/fa';
import StickerBook from '../../components/stickers/StickerBook';

const StickersPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6 pb-20"
  >
    <div className="flex items-center gap-3">
      <Link to="/profile" className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Back to profile">
        <FaArrowLeft className="text-xl" />
      </Link>
      <div>
        <h1 className="font-baloo text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FaPuzzlePiece /> My Sticker Book
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Decorate pages with stickers you earned.</p>
      </div>
    </div>

    <StickerBook />
  </motion.div>
);

export default StickersPage;
