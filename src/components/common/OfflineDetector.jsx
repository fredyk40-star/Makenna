import { useEffect } from 'react';
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

  // Reserve a fixed-height slot above the sticky header so the banner never
  // covers the logo, theme toggle, notifications or profile controls.
  useEffect(() => {
    document.body.dataset.topBanner = showBanner ? 'true' : 'false';
    return () => {
      delete document.body.dataset.topBanner;
    };
  }, [showBanner]);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed inset-x-0 top-0 z-[100] flex h-14 items-center justify-center gap-3 overflow-hidden bg-orange-500 px-4 text-white shadow-lg"
        >
          {syncing && !isOffline
            ? <FaSyncAlt className="shrink-0 text-xl animate-spin" />
            : <FaExclamationTriangle className="shrink-0 text-xl" />}
          <span className="truncate font-medium">
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
