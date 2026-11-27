import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useChildAccount } from '../../context/ChildAccountContext';
import { FaExclamationTriangle, FaSyncAlt } from 'react-icons/fa';

const OfflineDetector = () => {
  const isOffline = useOfflineStatus();
  const { cloudSyncStatus, syncNow } = useChildAccount();
  const pending = cloudSyncStatus?.pendingCount || 0;
  const syncing = cloudSyncStatus?.syncing || false;
  const showBanner = isOffline || pending > 0;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg"
        >
          <FaExclamationTriangle className="text-xl" />
          <span className="font-medium">
            {isOffline
              ? `You're offline. ${pending > 0 ? `${pending} change(s) will sync automatically.` : 'Some features may be limited.'}`
              : `${pending} change(s) waiting to sync.`}
          </span>
          {!isOffline && pending > 0 && (
            <button
              type="button"
              onClick={() => syncNow()}
              disabled={syncing}
              className="flex items-center gap-2 bg-white/25 hover:bg-white/35 rounded-full px-3 py-1 text-sm font-bold disabled:opacity-60"
            >
              <FaSyncAlt className={syncing ? 'animate-spin' : ''} />
              Sync now
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineDetector;
