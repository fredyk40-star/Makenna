import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaVolumeUp, FaVolumeMute, FaMusic, FaMicrophone,
  FaPlay, FaTachometerAlt, FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import audioService from '../../services/AudioService';
import { useProfiles } from '../../context/ProfileContext';

const AudioSettings = ({ className = '' }) => {
  const { getProfileData, setProfileData } = useProfiles();
  const [settings, setSettings] = useState({
    masterVolume: 1,
    musicVolume: 0.7,
    effectsVolume: 0.8,
    voiceVolume: 1,
    playbackSpeed: 1,
    mute: false,
    voiceEnabled: true,
  });

  const STORAGE_KEY = 'audio_settings';

  useEffect(() => {
    // Load saved settings
    const saved = getProfileData(STORAGE_KEY);
    if (saved) {
      setSettings(prev => ({ ...prev, ...saved }));
      applySettings(saved);
    }
  }, [getProfileData]);

  const applySettings = (newSettings) => {
    audioService.setVolume(newSettings.masterVolume * newSettings.voiceVolume);
    if (newSettings.mute) {
      audioService.toggleMute();
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setProfileData(STORAGE_KEY, newSettings);
    applySettings(newSettings);
  };

  const SettingSlider = ({ 
    label, 
    icon: Icon, 
    settingKey,
    min = 0, 
    max = 1, 
    step = 0.01,
    value,
    onChange
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="text-gray-600 dark:text-gray-300" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer"
        aria-label={label}
      />
    </div>
  );

  const ToggleButton = ({ label, settingKey, value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
        value 
          ? 'bg-primary/10 text-primary' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
      }`}
      aria-label={`Toggle ${label}`}
    >
      <span className="font-medium">{label}</span>
      {value ? (
        <FaToggleOn className="text-2xl text-primary" />
      ) : (
        <FaToggleOff className="text-2xl text-gray-400" />
      )}
    </button>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
        Audio Settings
      </h3>

      {/* Master Volume */}
      <SettingSlider
        label="Master Volume"
        icon={FaVolumeUp}
        settingKey="masterVolume"
        value={settings.masterVolume}
        onChange={(value) => updateSetting('masterVolume', value)}
      />

      {/* Music Volume */}
      <SettingSlider
        label="Music Volume"
        icon={FaMusic}
        settingKey="musicVolume"
        value={settings.musicVolume}
        onChange={(value) => updateSetting('musicVolume', value)}
      />

      {/* Effects Volume */}
      <SettingSlider
        label="Effects Volume"
        icon={FaPlay}
        settingKey="effectsVolume"
        value={settings.effectsVolume}
        onChange={(value) => updateSetting('effectsVolume', value)}
      />

      {/* Voice Volume */}
      <SettingSlider
        label="Voice Volume"
        icon={FaMicrophone}
        settingKey="voiceVolume"
        value={settings.voiceVolume}
        onChange={(value) => updateSetting('voiceVolume', value)}
      />

      {/* Playback Speed */}
      <SettingSlider
        label="Playback Speed"
        icon={FaTachometerAlt}
        settingKey="playbackSpeed"
        min={0.5}
        max={2}
        step={0.1}
        value={settings.playbackSpeed}
        onChange={(value) => {
          updateSetting('playbackSpeed', value);
          audioService.setPlaybackRate(value);
        }}
      />

      {/* Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ToggleButton
          label="Mute All"
          settingKey="mute"
          value={settings.mute}
          onChange={(value) => {
            updateSetting('mute', value);
            audioService.toggleMute();
          }}
        />
        <ToggleButton
          label="Voice Enabled"
          settingKey="voiceEnabled"
          value={settings.voiceEnabled}
          onChange={(value) => updateSetting('voiceEnabled', value)}
        />
      </div>

      {/* Reset Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          const defaults = {
            masterVolume: 1,
            musicVolume: 0.7,
            effectsVolume: 0.8,
            voiceVolume: 1,
            playbackSpeed: 1,
            mute: false,
            voiceEnabled: true,
          };
          setSettings(defaults);
          setProfileData(STORAGE_KEY, defaults);
          applySettings(defaults);
        }}
        className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        Reset to Defaults
      </motion.button>
    </div>
  );
};

export default AudioSettings;