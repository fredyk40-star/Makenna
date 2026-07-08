import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarService, AVATAR_DEFINITIONS } from '../../services/AvatarService';
import { FaUser, FaStar, FaLock } from 'react-icons/fa';

const AvatarSelector = ({ childId, onSelect, showSelector = true }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarGrid, setShowAvatarGrid] = useState(false);
  const [availableAvatars, setAvailableAvatars] = useState([]);
  const [unlockedAvatars, setUnlockedAvatars] = useState([]);

  useEffect(() => {
    loadAvatars();
  }, [childId]);

  const loadAvatars = () => {
    // Use getAvailableAvatars if childId is available, otherwise use AVATAR_DEFINITIONS
    const avatars = childId 
      ? AvatarService.getAvailableAvatars(childId)
      : AVATAR_DEFINITIONS.filter(a => a.unlocked || a.starsRequired === 0);
    setAvailableAvatars(avatars);
    
    if (childId) {
      const unlocked = AvatarService.getAvailableAvatars(childId)
        .filter(a => a.unlocked)
        .map(a => a.id);
      setUnlockedAvatars(unlocked);
      
      const current = AvatarService.getSelectedAvatar(childId);
      setSelectedAvatar(current);
    }
  };

  const handleSelect = (avatarId) => {
    if (childId) {
      AvatarService.setSelectedAvatar(childId, avatarId);
      setSelectedAvatar(avatarId);
    }
    if (onSelect) {
      onSelect(avatarId);
    }
  };

  const isUnlocked = (avatar) => {
    if (avatar.id === 'boy' || avatar.id === 'girl') return true; // Free defaults
    return unlockedAvatars.includes(avatar.id);
  };

  const SelectedAvatarDisplay = () => {
    if (!selectedAvatar) return null;
    
    const avatar = AvatarService.getAvatarById(selectedAvatar);
    const IconComponent = avatar?.icon || FaUser;
    
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: avatar?.color || '#6366f1' }}
        >
          <IconComponent className="text-white" />
        </div>
        <div>
          <p className="font-medium text-white">{avatar?.name || 'Selected Avatar'}</p>
          <button
            onClick={() => setShowAvatarGrid(true)}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            Change Avatar
          </button>
        </div>
      </div>
    );
  };

  const AvatarGrid = () => (
    <AnimatePresence>
      {showAvatarGrid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAvatarGrid(false)}
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-center">Choose Your Avatar</h3>
            
            <div className="grid grid-cols-3 gap-3">
              {availableAvatars.map(avatar => {
                const IconComponent = avatar.icon;
                const unlocked = isUnlocked(avatar);
                
                return (
                  <motion.button
                    key={avatar.id}
                    whileHover={unlocked ? { scale: 1.05 } : {}}
                    whileTap={unlocked ? { scale: 0.95 } : {}}
                    onClick={() => unlocked && handleSelect(avatar.id)}
                    disabled={!unlocked}
                    className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      unlocked 
                        ? 'cursor-pointer hover:bg-gray-700' 
                        : 'cursor-not-allowed opacity-50'
                    } ${selectedAvatar === avatar.id ? 'ring-2 ring-purple-500' : ''}`}
                    style={{ backgroundColor: unlocked ? avatar.color : '#374151' }}
                  >
                    <IconComponent className="text-2xl text-white" />
                    <span className="text-xs text-center">{avatar.name}</span>
                    {avatar.starsRequired > 0 && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <FaStar className="text-xs" />
                        <span className="text-xs">{avatar.starsRequired}</span>
                      </div>
                    )}
                    {!unlocked && (
                      <FaLock className="text-red-400 text-xs mt-1" />
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            <button
              onClick={() => setShowAvatarGrid(false)}
              className="w-full mt-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!showSelector) return null;

  return (
    <div className="avatar-selector">
      <SelectedAvatarDisplay />
      <AvatarGrid />
    </div>
  );
};

export default AvatarSelector;