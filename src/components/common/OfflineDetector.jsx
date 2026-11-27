import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useChildAccount } from '../../context/ChildAccountContext';
import { FaExclamationTriangle, FaSyncAlt } from 'react-icons/fa';

const OfflineDetector = () => {
  const isOffline = useOfflineStatus();
  const { cloudSyncStatus } = useChildAccount();
  const pending = cloudSyncStatus?.pendingCount || 0;
  const syncing = cloudSyncStatus?.syncing || false;
  const showBanner = isOffline || pending > 0 || syncing;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg"
        >
          {syncing && !isOffline
            ? <FaSyncAlt className="text-xl animate-spin" />
            : <FaExclamationTriangle className="text-xl" />}
          <span className="font-medium">
            {isOffline
              ? `You're offline. ${pending > 0 ? `${pending} change(s) will sync automatically.` : 'Some features may be limited.'}`
              : syncing
                ? 'Syncing your progress automatically…'
                : `${pending} change(s) waiting to sync automatically.`}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineDetector;
