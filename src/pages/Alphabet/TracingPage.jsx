import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaBook, FaPen } from 'react-icons/fa';
import TracingCanvas from '../../components/tracing/TracingCanvas';
import { ALPHABET_DATA } from '../../data/alphabetData';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { useProfiles } from '../../context/ProfileContext';

const TracingPage = () => {
  const { letterId, mode = 'trace' } = useParams();
  const navigate = useNavigate();
  const [letter, setLetter] = useState(null);
  const [selectedCase, setSelectedCase] = useState('uppercase');
  const [selectedMode, setSelectedMode] = useState(mode);
  const { markOpened, addTimeSpent } = useAlphabetProgress();
  const { getProfileData, setProfileData } = useProfiles();

  useEffect(() => {
    const foundLetter = ALPHABET_DATA.find(l => l.id === letterId);
    if (foundLetter) {
      setLetter(foundLetter);
      markOpened(letterId);
    } else {
      navigate('/alphabet');
    }

    const startTime = Date.now();
    return () => {
      if (letter) {
        const endTime = Date.now();
        const secondsSpent = Math.round((endTime - startTime) / 1000);
        addTimeSpent(letterId, secondsSpent);
      }
    };
  }, [letterId, navigate, markOpened, addTimeSpent]);

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
    const currentProgress = getProfileData('tracing_progress', {});

    const letterProgress = currentProgress[letter.id] || { attempts: 0 };

    const newProgress = {
      ...currentProgress,
      [letter.id]: {
        ...letterProgress,
        completed: true,
        lastTraced: new Date().toISOString(),
        attempts: letterProgress.attempts + 1,
        accuracy: Math.max(result.accuracy || 0, letterProgress.accuracy || 0),
      },
    };

    setProfileData('tracing_progress', newProgress);

    // Navigate back
    setTimeout(() => {
      navigate(`/alphabet/lesson/${letter.id}`);
    }, 3000);
  };

  const handleProgress = (progress) => {
    // Update progress in state if needed
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 pb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/alphabet/lesson/${letter.id}`}
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to lesson"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
              Trace Letter {letter.letter}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedMode === 'trace' ? 'Follow the guide to trace' : 'Practice freehand'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Case toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setSelectedCase('uppercase')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedCase === 'uppercase'
                  ? 'bg-white dark:bg-gray-600 text-primary dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
              aria-label="Uppercase"
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
              aria-label="Lowercase"
            >
              a
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setSelectedMode('trace')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedMode === 'trace'
                  ? 'bg-white dark:bg-gray-600 text-primary dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
              aria-label="Trace mode"
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
              aria-label="Practice mode"
            >
              <FaPen className="text-xs" />
              Practice
            </button>
          </div>
        </div>
      </div>

      {/* Tracing Canvas */}
      <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-soft" style={{ height: '500px' }}>
        <TracingCanvas
          letter={selectedCase === 'uppercase' ? letter.letter : letter.lowercase}
          caseType={selectedCase}
          mode={selectedMode}
          onComplete={handleComplete}
          onProgress={handleProgress}
        />
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {selectedMode === 'trace' ? (
          <p>👆 Follow the guide arrows to trace the letter correctly</p>
        ) : (
          <p>✏️ Practice writing the letter freely. Try different colors!</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={() => navigate(`/alphabet/lesson/${letter.id}`)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors"
        >
          <FaArrowLeft className="text-sm" />
          Back to Lesson
        </button>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {letter.letter} • {selectedCase}
        </div>
        <button
          onClick={() => {
            const currentIndex = ALPHABET_DATA.findIndex(l => l.id === letterId);
            const nextIndex = (currentIndex + 1) % ALPHABET_DATA.length;
            navigate(`/alphabet/trace/${ALPHABET_DATA[nextIndex].id}/${selectedMode}`);
          }}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors"
        >
          Next Letter
          <FaArrowRight className="text-sm" />
        </button>
      </div>
    </motion.div>
  );
};

export default TracingPage;