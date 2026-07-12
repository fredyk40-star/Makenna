
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { ProfileService } from '../services/ProfileService';

export const ProfileContext = createContext();

export const useProfiles = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfiles must be used within ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allProfiles = ProfileService.getProfiles();
    const activeProfileId = ProfileService.getActiveProfileId();
    setProfiles(allProfiles);
    if (activeProfileId) {
      const currentProfile = allProfiles.find(p => p.id === activeProfileId);
      setActiveProfile(currentProfile || null);
    }
    setLoading(false);
  }, []);

  const setActive = useCallback((profile) => {
    setActiveProfile(profile);
    ProfileService.setActiveProfileId(profile ? profile.id : null);
  }, []);

  const create = useCallback((name, avatar) => {
    const newProfile = ProfileService.createProfile(name, avatar);
    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  }, []);

  const update = useCallback((id, updates) => {
    ProfileService.updateProfile(id, updates);
    const updatedProfiles = ProfileService.getProfiles();
    setProfiles(updatedProfiles);
    if (activeProfile && activeProfile.id === id) {
      setActiveProfile(updatedProfiles.find(p => p.id === id));
    }
  }, [activeProfile]);

  const remove = useCallback((id) => {
    ProfileService.deleteProfile(id);
    const remainingProfiles = ProfileService.getProfiles();
    setProfiles(remainingProfiles);
    if (activeProfile && activeProfile.id === id) {
      setActiveProfile(null);
      ProfileService.setActiveProfileId(null);
    }
  }, [activeProfile]);

  const getProfileData = useCallback((key, defaultValue = null) => {
    if (!activeProfile) return defaultValue;
    return ProfileService.getProfileData(activeProfile.id, key, defaultValue);
  }, [activeProfile]);

  const setProfileData = useCallback((key, value) => {
    if (activeProfile) {
      ProfileService.setProfileData(activeProfile.id, key, value);
      // We might need to update the activeProfile state here if the data is part of the profile object
    }
  }, [activeProfile]);

  const value = {
    profiles,
    activeProfile,
    setActiveProfile: setActive,
    createProfile: create,
    updateProfile: update,
    deleteProfile: remove,
    getProfileData,
    setProfileData,
    loading,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
