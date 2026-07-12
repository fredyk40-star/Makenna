import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UpdateService } from '../../services/UpdateService';
import { useChildAccount } from '../../context/ChildAccountContext';

const UpdatePreviewBanner = () => {
  const { childId } = useChildAccount();
  const [previewUpdateId, setPreviewUpdateId] = useState(null);
  const [previewUpdate, setPreviewUpdate] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (childId) {
      const updateId = UpdateService.hasPreviewAccess(childId);
      if (updateId) {
        setPreviewUpdateId(updateId);
        const updates = UpdateService.getUpdates();
        const update = updates.find(u => u.id === updateId);
        setPreviewUpdate(update);
      }
      // Clean up expired previews
      UpdateService.cleanupExpiredPreviews();
    }
  }, [childId]);

  const handleInstall = () => {
    if (childId && previewUpdateId) {
      UpdateService.installUpdate(childId, previewUpdateId);
      // Refresh to remove banner
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    const previewAccess = JSON.parse(localStorage.getItem('makenna_preview_updates') || '{}');
    delete previewAccess[childId];
    localStorage.setItem('makenna_preview_updates', JSON.stringify(previewAccess));
    setPreviewUpdateId(null);
    setPreviewUpdate(null);
  };

  if (!previewUpdate) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 shadow-lg"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧪</span>
          <div>
            <p className="font-bold">Test Version Available!</p>
            <p className="text-sm opacity-90">
              You're testing v{previewUpdate.version} ({previewUpdate.type} update)
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 text-sm"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
          <button
            onClick={handleInstall}
            className="px-3 py-1 bg-white text-purple-600 rounded font-bold text-sm hover:bg-gray-100"
          >
            Install Now
          </button>
          <button
            onClick={handleDismiss}
            className="px-2 py-1 text-white/70 hover:text-white"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>

      {showDetails && previewUpdate.changelog && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 max-w-4xl mx-auto bg-white/10 rounded-lg p-3"
        >
          <p className="text-sm font-semibold mb-1">What's in this test update:</p>
          <p className="text-sm">{previewUpdate.changelog}</p>
          <p className="text-xs mt-2 opacity-75">
            This is a preview version - your feedback helps improve the app!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default UpdatePreviewBanner;