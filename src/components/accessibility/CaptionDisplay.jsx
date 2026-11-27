import { useEffect, useState } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import AccessibilityService from '../../services/AccessibilityService';

const CaptionDisplay = () => {
  const { captions } = useAccessibility();
  const [caption, setCaption] = useState(() => AccessibilityService.getLastCaption());

  useEffect(() => AccessibilityService.subscribeCaptions(setCaption), []);

  if (!captions || !caption) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] max-w-xl mx-4 px-5 py-3 rounded-2xl bg-gray-900/90 text-white text-center font-semibold shadow-xl"
    >
      {caption}
    </div>
  );
};

export default CaptionDisplay;
