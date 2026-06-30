
import { StorageService } from './StorageService';

const PROFILES_KEY = 'user_profiles';
const ACTIVE_PROFILE_KEY = 'active_profile_id';

export class ProfileService {
  static getProfiles() {
    return StorageService.get(PROFILES_KEY, []);
  }

  static saveProfiles(profiles) {
    StorageService.set(PROFILES_KEY, profiles);
  }

  static getActiveProfileId() {
    return StorageService.get(ACTIVE_PROFILE_KEY);
  }

  static setActiveProfileId(id) {
    StorageService.set(ACTIVE_PROFILE_KEY, id);
  }

  static getActiveProfile() {
    const activeId = this.getActiveProfileId();
    if (!activeId) return null;
    const profiles = this.getProfiles();
    return profiles.find(p => p.id === activeId) || null;
  }

  static createProfile(name, avatar) {
    const profiles = this.getProfiles();
    const newProfile = {
      id: `profile_${Date.now()}`,
      name,
      avatar,
      createdAt: new Date().toISOString(),
      progress: {},
      settings: {},
    };
    profiles.push(newProfile);
    this.saveProfiles(profiles);
    return newProfile;
  }

  static updateProfile(id, updates) {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === id);
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates };
      this.saveProfiles(profiles);
    }
  }

  static deleteProfile(id) {
    let profiles = this.getProfiles();
    profiles = profiles.filter(p => p.id !== id);
    this.saveProfiles(profiles);

    const activeId = this.getActiveProfileId();
    if (activeId === id) {
      this.setActiveProfileId(null);
    }
  }

  static getProfileData(profileId, key, defaultValue = null) {
    const profiles = this.getProfiles();
    const profile = profiles.find(p => p.id === profileId);
    return profile?.progress?.[key] ?? defaultValue;
  }

  static setProfileData(profileId, key, value) {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === profileId);
    if (index !== -1) {
      if (!profiles[index].progress) {
        profiles[index].progress = {};
      }
      profiles[index].progress[key] = value;
      this.saveProfiles(profiles);
    }
  }
}
