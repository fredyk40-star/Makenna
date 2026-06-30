
import React, { useState } from 'react';
import { useProfiles } from '../../context/ProfileContext';

const ProfileSelection = () => {
  const { profiles, setActiveProfile, createProfile } = useProfiles();
  const [newProfileName, setNewProfileName] = useState('');

  const handleCreateProfile = () => {
    if (newProfileName.trim()) {
      const newProfile = createProfile(newProfileName, 'default-avatar.png');
      setActiveProfile(newProfile);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">Select a Profile</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className="p-4 bg-white rounded-lg shadow-md cursor-pointer text-center"
            onClick={() => setActiveProfile(profile)}
          >
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-24 h-24 rounded-full mx-auto mb-2"
            />
            <p className="font-semibold">{profile.name}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center">
        <input
          type="text"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          placeholder="New profile name"
          className="p-2 border rounded-md"
        />
        <button
          onClick={handleCreateProfile}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Create Profile
        </button>
      </div>
    </div>
  );
};

export default ProfileSelection;
