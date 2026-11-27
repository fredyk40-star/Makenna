import { useState } from 'react';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import ParentGate from './ParentGate';
import ParentalControls from '../ParentalControls/ParentalControls';
import LessonScheduler from '../LessonScheduler/LessonScheduler';
import SyncCenter from '../Sync/SyncCenter';
import PrivacyPanel from '../privacy/PrivacyPanel';
import SessionTimeoutSettings from '../session/SessionTimeoutSettings';
import CurriculumTutorSettings from './CurriculumTutorSettings';

const Section = ({ title, children }) => (
  <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
    <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4">{title}</h3>
    {children}
  </div>
);

const ParentSettingsPanel = () => {
  const { resetProgress: resetAlphabetProgress } = useAlphabetProgress();
  const { resetProgress: resetNumbersProgress } = useNumbersProgress();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    resetAlphabetProgress();
    resetNumbersProgress();
    setConfirmReset(false);
  };

  return (
    <ParentGate title="Unlock parent settings">
      <div className="space-y-6">
        <Section title="Parental controls">
          <ParentalControls />
        </Section>

        <Section title="Lesson scheduler">
          <LessonScheduler />
        </Section>

        <Section title="AI tutor (curriculum only)">
          <CurriculumTutorSettings />
        </Section>

        <Section title="Sync & offline data">
          <SyncCenter />
        </Section>

        <Section title="Privacy & data deletion">
          <PrivacyPanel />
        </Section>

        <Section title="Session timeout">
          <SessionTimeoutSettings />
        </Section>

        <Section title="Reset learning progress">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Clears completed alphabet and number lessons. Child accounts and cloud data are not removed.
          </p>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-500 rounded-xl font-semibold hover:bg-red-500/20 transition-colors"
          >
            <FaTrash /> Reset all progress
          </button>
        </Section>

        {confirmReset && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm reset"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 text-center shadow-xl">
              <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
              <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">Are you sure?</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6">
                All alphabet and number progress will be permanently deleted.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2 rounded-xl bg-red-500 text-white font-semibold"
                >
                  Yes, reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ParentGate>
  );
};

export default ParentSettingsPanel;
