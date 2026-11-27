import { FaUniversalAccess, FaKeyboard } from 'react-icons/fa';
import { useAccessibility } from '../../context/AccessibilityContext';

const Toggle = ({ label, hint, checked, onChange }) => (
  <label className="flex items-center justify-between gap-4 py-2">
    <span>
      <span className="block font-semibold text-gray-800 dark:text-white">{label}</span>
      {hint && <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={event => onChange(event.target.checked)}
      className="w-5 h-5 accent-blue-600"
    />
  </label>
);

const AccessibilitySettings = () => {
  const {
    dyslexiaFont,
    largeText,
    highContrast,
    reducedMotion,
    captions,
    soundSensitive,
    switchControl,
    switchInterval,
    fontScale,
    updateSettings,
    resetAccessibility,
  } = useAccessibility();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-2">
        <FaUniversalAccess className="text-2xl text-blue-500" />
        <div>
          <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
            Accessibility
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Make reading, listening and playing comfortable for every learner.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-x-6 divide-y md:divide-y-0">
        <div>
          <Toggle
            label="Dyslexia-friendly font"
            hint="Uses a rounded, widely spaced reading font"
            checked={dyslexiaFont}
            onChange={value => updateSettings({ dyslexiaFont: value })}
          />
          <Toggle
            label="Large text"
            hint="Increases text sizes across the app"
            checked={largeText}
            onChange={value => updateSettings({ largeText: value })}
          />
          <Toggle
            label="High contrast"
            hint="Strengthens borders and card outlines"
            checked={highContrast}
            onChange={value => updateSettings({ highContrast: value })}
          />
          <Toggle
            label="Reduced motion"
            hint="Minimises animation and transitions"
            checked={reducedMotion}
            onChange={value => updateSettings({ reducedMotion: value })}
          />
        </div>
        <div>
          <Toggle
            label="Captions for speech"
            hint="Shows spoken prompts as on-screen text"
            checked={captions}
            onChange={value => updateSettings({ captions: value })}
          />
          <Toggle
            label="Sound-sensitive mode"
            hint="Keeps audio quiet and gentle"
            checked={soundSensitive}
            onChange={value => updateSettings({ soundSensitive: value })}
          />
          <Toggle
            label="Switch / scanning control"
            hint="Highlights controls automatically; press Space or Enter to select"
            checked={switchControl}
            onChange={value => updateSettings({ switchControl: value })}
          />
          {switchControl && (
            <label className="block pt-2 text-sm">
              <span className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white">
                <FaKeyboard /> Scan speed
              </span>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={switchInterval}
                onChange={event => updateSettings({ switchInterval: Number(event.target.value) })}
                className="w-full accent-blue-600"
              />
              <span className="text-xs text-gray-500">{(switchInterval / 1000).toFixed(1)}s per control</span>
            </label>
          )}
        </div>
      </div>

      <label className="block pt-2 text-sm">
        <span className="flex items-center justify-between font-semibold text-gray-800 dark:text-white">
          <span>Text size</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(fontScale * 100)}%
          </span>
        </span>
        <input
          type="range"
          min="0.9"
          max="1.4"
          step="0.05"
          value={fontScale}
          onChange={event => updateSettings({ fontScale: Number(event.target.value) })}
          className="w-full accent-blue-600"
          aria-label="Text size"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Fine-tune reading size. Large text mode adds another 20%.
        </span>
      </label>

      <button
        type="button"
        onClick={resetAccessibility}
        className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-300 hover:underline"
      >
        Reset accessibility options
      </button>
    </div>
  );
};

export default AccessibilitySettings;
