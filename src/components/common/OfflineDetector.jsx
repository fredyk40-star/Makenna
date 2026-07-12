import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';

const OfflineDetector = () => {
  const isOffline = useOfflineStatus();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg"
        >
          <FaExclamationTriangle className="text-xl" />
          <span className="font-medium">
            You're offline. Some features may be limited.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineDetector;