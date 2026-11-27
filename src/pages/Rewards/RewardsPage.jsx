import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaGift } from 'react-icons/fa';
import RewardsStoreComponent from '../../components/RewardsStore/RewardsStore';

const RewardsPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6 pb-20"
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link to="/profile" className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Back to profile">
          <FaArrowLeft className="text-xl" />
        </Link>
        <div>
          <h1 className="font-baloo text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaGift /> Rewards Store
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Spend stars on avatars, themes and sticker packs.</p>
        </div>
      </div>
      <Link to="/stickers" className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold">
        Open sticker book
      </Link>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft">
      <RewardsStoreComponent />
    </div>
  </motion.div>
);

export default RewardsPage;
