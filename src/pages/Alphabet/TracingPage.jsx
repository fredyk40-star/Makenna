import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaBook, FaPen, FaCheck } from 'react-icons/fa';
import TracingCanvas from '../../components/tracing/TracingCanvas';
import VoiceButton from '../../components/alphabet/VoiceButton';
import { ALPHABET_DATA } from '../../data/alphabetData';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { useProfiles } from '../../context/ProfileContext';
import { useChildAccount } from '../../context/ChildAccountContext';
import { PortfolioService } from '../../services/PortfolioService';
import { createThumbnail } from '../../utils/imageStorage';

const TracingPage = () => {
  const { letterId, mode = 'trace' } = useParams();
  const navigate = useNavigate();
  const [letter, setLetter] = useState(null);
  const [selectedCase, setSelectedCase] = useState('uppercase');
  const [selectedMode, setSelectedMode] = useState(mode);
  const [traceProgress, setTraceProgress] = useState(0);
  const {
    markOpened,
    markSkill,
    addTimeSpent,
    isSkillComplete,
  } = useAlphabetProgress();
  const { getProfileData, setProfileData } = useProfiles();
  const { childId } = useChildAccount();
  const markOpenedRef = useRef(markOpened);
  const addTimeSpentRef = useRef(addTimeSpent);

  useEffect(() => {
    markOpenedRef.current = markOpened;
    addTimeSpentRef.current = addTimeSpent;
  }, [markOpened, addTimeSpent]);

  useEffect(() => {
    const foundLetter = ALPHABET_DATA.find(item => item.id === letterId);
    if (foundLetter) {
      setLetter(foundLetter);
      setSelectedMode(mode);
      setTraceProgress(0);
      markOpenedRef.current(letterId);
    } else {
      navigate('/alphabet', { replace: true });
    }
  }, [letterId, mode, navigate]);

  useEffect(() => {
    const startedAt = Date.now();
    return () => {
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      if (seconds > 0) addTimeSpentRef.current(letterId, seconds);
    };
  }, [letterId]);

  const handleSave = useCallback(async ({ image, guide, letter: tracedLetter, caseType, accuracy }) => {
    if (!childId || !image) return;
    const thumbnail = await createThumbnail(image);
    PortfolioService.save(childId, {
      kind: 'trace',
      title: `Letter ${tracedLetter || letter?.letter || ''} (${caseType || selectedCase})`.trim(),
      image: thumbnail,
      guide,
      letter: tracedLetter || letter?.letter || null,
      caseType: caseType || selectedCase,
      accuracy,
    });
  }, [childId, letter, selectedCase]);

  if (!letter) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const handleComplete = (result) => {
    const accuracy = Math.max(0, Math.min(100, Math.round(Number(result?.accuracy) || 0)));
    const currentProgress = getProfileData('tracing_progress', {});
    const letterProgress = currentProgress[letter.id] || { attempts: 0 };

    setProfileData('tracing_progress', {
      ...currentProgress,
      [letter.id]: {
        ...letterProgress,
        completed: true,
        lastTraced: new Date().toISOString(),
        attempts: (letterProgress.attempts || 0) + 1,
        accuracy: Math.max(accuracy, letterProgress.accuracy || 0),
      },
    });

    // The same completion event updates the cloud-synced alphabet progress.
    markSkill(letter.id, 'trace', { accuracy });

    setTimeout(() => {
      navigate(`/alphabet/lesson/${letter.id}`);
    }, 3000);
  };

  const handleProgress = (progress) => {
    setTraceProgress(Math.min(100, Math.max(0, Math.round((progress || 0) * 100))));
  };

  const traceComplete = isSkillComplete(letter.id, 'trace');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 pb-28 pt-2 sm:pb-24"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/alphabet/lesson/${letter.id}`}
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to lesson"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-baloo text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
              Trace Letter {letter.letter}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {selectedMode === 'trace' ? 'Follow the guide to trace' : 'Practice freehand'}
            </p>
          </div>
          <VoiceButton
            text={`${letter.letter} says ${letter.phonetic || letter.sound}`}
            label={`Hear letter ${letter.letter}`}
          />
          {traceComplete && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
              <FaCheck /> Practiced
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Case toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1" role="group" aria-label="Letter case">
            <button
              onClick={() => setSelectedCase('uppercase')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedCase === 'uppercase'
                  ? 'bg-white dark:bg-gray-600 text-primary dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
              aria-pressed={selectedCase === 'uppercase'}
              type="button"
            >
              A
            </button>
            <button
              onClick={() => setSelectedCase('lowercase')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedCase === 'lowercase'
                  ? 'bg-white dark:bg-gray-600 text-primary dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
              aria-pressed={selectedCase === 'lowercase'}
              type="button"
            >
              a
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1" role="group" aria-label="Tracing mode">
            <button
              onClick={() => setSelectedMode('trace')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedMode === 'trace'
                  ? 'bg-white dark:bg-gray-600 text-primary dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
              aria-pressed={selectedMode === 'trace'}
              type="button"
            >
              <FaBook className="text-xs" />
              Trace
            </button>
            <button
              onClick={() => setSelectedMode('practice')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedMode === 'practice'
                  ? 'bg-white dark:bg-gray-600 text-primary dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
              aria-pressed={selectedMode === 'practice'}
              type="button"
            >
              <FaPen className="text-xs" />
              Practice
            </button>
          </div>
        </div>
      </div>

      {/* Tracing Canvas */}
      <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-soft h-[420px] sm:h-[500px] lg:h-[560px]">
        <TracingCanvas
          letter={selectedCase === 'uppercase' ? letter.letter : letter.lowercase}
          caseType={selectedCase}
          mode={selectedMode}
          onComplete={handleComplete}
          onProgress={handleProgress}
          onSave={handleSave}
        />
      </div>

      {/* Instructions */}
      <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        {selectedMode === 'trace' ? (
          <p>👆 Follow the guide arrows to trace the letter correctly</p>
        ) : (
          <p>✏️ Practice writing the letter freely. Try different colors!</p>
        )}
        {selectedMode === 'trace' && (
          <p className="mt-1" aria-live="polite">Trace progress: {traceProgress}%</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center gap-2 pt-4">
        <button
          onClick={() => navigate(`/alphabet/lesson/${letter.id}`)}
          className="flex items-center gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors"
          type="button"
        >
          <FaArrowLeft className="text-sm" />
          <span className="hidden sm:inline">Back to Lesson</span>
        </button>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {letter.letter} • {selectedCase}
        </div>
        <button
          onClick={() => {
            const currentIndex = ALPHABET_DATA.findIndex(item => item.id === letterId);
            const nextIndex = (currentIndex + 1) % ALPHABET_DATA.length;
            navigate(`/alphabet/trace/${ALPHABET_DATA[nextIndex].id}/${selectedMode}`);
          }}
          className="flex items-center gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors"
          type="button"
        >
          <span className="hidden sm:inline">Next Letter</span>
          <FaArrowRight className="text-sm" />
        </button>
      </div>
    </motion.div>
  );
};

export default TracingPage;
