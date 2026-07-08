import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaPlay, FaPause, FaRedo, FaStop, 
  FaVolumeUp, FaVolumeMute, FaStar, FaRegStar,
  FaMicrophone, FaSave, FaShare, FaExpand, FaCompress,
  FaTachometerAlt, FaHeart, FaMusic
} from 'react-icons/fa';
import { getSongById } from '../../data/musicData';
import { useMusicProgress } from '../../hooks/useMusicProgress';
import { useChildAccount } from '../../context/ChildAccountContext';
import { voiceGuide } from '../../services/VoiceGuideService';
import { GamificationService } from '../../services/GamificationService';
import { announceToScreenReader } from '../../utils/accessibility';

const SongPlayer = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const { childName, childId } = useChildAccount();
  const { recordPlay, markCompleted, toggleFavorite, isFavorited, progress, saveRecording } = useMusicProgress();
  
  const [song, setSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolumeState] = useState(0.7); // Child-safe default volume
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [showRecording, setShowRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);
  
  const audioRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const found = getSongById(songId);
    if (found) {
      setSong(found);
      setDuration(found.duration || 30);
      
      // Voice guidance
      if (childName) {
        voiceGuide.speak(`Hello ${childName}! Let's sing ${found.title} together!`);
      }
    } else {
      navigate('/music/library');
    }

    // Check if this song has a recording
    if (progress.recordedSongs[songId]) {
      setHasRecorded(true);
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [songId, navigate, childName, progress.recordedSongs]);

  // Lyric highlighting during playback
  useEffect(() => {
    if (isPlaying && song?.lyrics) {
      const interval = setInterval(() => {
        const time = Date.now() - (startTimeRef.current || Date.now());
        const seconds = time / 1000;
        setCurrentTime(seconds);
        
        // Find current lyric based on timing
        const lyricIndex = song.lyrics.findIndex((line, i) => {
          const nextLine = song.lyrics[i + 1];
          return seconds >= (line.timing * 4) && (!nextLine || seconds < (nextLine.timing * 4));
        });
        
        if (lyricIndex !== activeLyricIndex) {
          setActiveLyricIndex(lyricIndex);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isPlaying, song, activeLyricIndex]);

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) {
      // Create audio context or use TTS
      if (song) {
        voiceGuide.speak(song.title.split('.')[0] || 'Song starting');
        voiceGuide.queue(`Category: ${song.category.replace('-', ' ')}`, {});
        
        // Speak lyrics line by line for basic karaoke effect
        if (song.lyrics) {
          song.lyrics.forEach((line, i) => {
            setTimeout(() => {
              if (isPlaying) {
                voiceGuide.speak(line.words, { rate: playbackSpeed * 0.9 });
              }
            }, line.timing * 4000 / playbackSpeed);
          });
        }
      }
    }
    
    setIsPlaying(!isPlaying);
    startTimeRef.current = Date.now();
  }, [song, isPlaying, playbackSpeed]);

  const handleReplay = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveLyricIndex(-1);
    setTimeout(() => {
      handlePlayPause();
    }, 100);
  }, [handlePlayPause]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveLyricIndex(-1);
  }, []);

  const handleVolumeChange = (e) => {
    const newVolume = Math.max(0, Math.min(0.7, parseFloat(e.target.value))); // Max 0.7 for child safety
    setVolumeState(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setVolumeState(newMuted ? 0 : 0.7);
  };

  const handleComplete = () => {
    markCompleted(songId);
    GamificationService.completeLesson(childId, 100);
    announceToScreenReader(`Song completed! Great job singing ${song?.title}!`);
  };

  const startRecording = () => {
    setShowRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    voiceGuide.speak('Recording your beautiful voice!');
  };

  const stopRecording = () => {
    setShowRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    // Save mock recording ID
    const recordingId = `recording_${songId}_${Date.now()}`;
    saveRecording(songId, recordingId);
    setHasRecorded(true);
    
    GamificationService.addXP(childId, 15, 'Recorded singing');
    voiceGuide.speak('Great recording! You can listen to it again anytime.');
  };

  const speedOptions = [
    { value: 0.7, label: 'Slow' },
    { value: 1, label: 'Normal' },
    { value: 1.3, label: 'Fast' }
  ];

  if (!song) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎵</div>
          <p className="text-gray-600 dark:text-gray-300">Loading song...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isFullScreen ? 'bg-gradient-to-br from-purple-100 to-blue-100' : 'bg-gray-50 dark:bg-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-soft">
        <div className="flex items-center gap-3">
          <Link
            to="/music/library"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Music Library"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="font-baloo text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              {song.icon} {song.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {song.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavorite(songId)}
            className={`p-2 rounded-full transition-colors ${
              isFavorited(songId)
                ? 'text-pink-500 bg-pink-100 dark:bg-pink-900/30'
                : 'text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label={isFavorited(songId) ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorited(songId) ? <FaHeart className="text-xl" /> : <FaRegStar className="text-xl" />}
          </button>
          
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullScreen ? <FaCompress className="text-xl" /> : <FaExpand className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`p-4 ${isFullScreen ? 'pb-20' : ''}`}>
        {/* Karaoke Lyrics Display */}
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 mb-4 ${isFullScreen ? 'min-h-[60vh]' : ''}`}>
          <div className="text-center mb-4">
            <h2 className="font-baloo text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Lyrics
            </h2>
            <div className="h-12 flex items-center justify-center">
              <AnimatePresence>
                {activeLyricIndex >= 0 && song.lyrics && song.lyrics[activeLyricIndex] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-2xl md:text-3xl font-bold text-primary"
                  >
                    {song.lyrics[activeLyricIndex].words}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bouncing Ball Animation */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ 
                y: isPlaying ? [0, -50, 0] : 0,
                scale: isPlaying ? [1, 1.2, 1] : 1
              }}
              transition={{ 
                duration: 2, 
                repeat: isPlaying ? Infinity : 0,
                ease: 'easeInOut'
              }}
              className="text-4xl"
            >
              🎵
            </motion.div>
          </div>

          {/* Full Lyrics List */}
          <div className="max-h-64 overflow-y-auto">
            {song.lyrics && song.lyrics.map((line, index) => (
              <div
                key={index}
                className={`py-2 px-4 rounded-lg mb-1 transition-all duration-300 ${
                  index === activeLyricIndex
                    ? 'bg-primary/20 text-primary font-bold scale-105'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {line.words}
                {line.translation && (
                  <span className="text-xs text-gray-400 ml-2">
                    ({line.translation})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        {!isFullScreen && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-4 mb-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              {/* Play/Pause Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePlayPause}
                className="rounded-full bg-primary text-white p-4 hover:bg-primary-dark transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <FaPause className="text-2xl" /> : <FaPlay className="text-2xl ml-1" />}
              </motion.button>

              {/* Replay Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleReplay}
                className="rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-3 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Replay"
              >
                <FaRedo className="text-xl" />
              </motion.button>

              {/* Stop Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleStop}
                className="rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-3 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Stop"
              >
                <FaStop className="text-xl" />
              </motion.button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-500">{Math.floor(currentTime)}s</span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <span className="text-xs text-gray-500">{duration}s</span>
            </div>

            {/* Speed Control */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <FaTachometerAlt className="text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Speed:</span>
              {speedOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSpeedChange(option.value)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    playbackSpeed === option.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Volume Control (Child-safe max: 70%) */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
              <input
                type="range"
                min="0"
                max="0.7"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-32"
                aria-label="Volume (max 70% for child safety)"
              />
              <span className="text-xs text-gray-500">Max 70%</span>
            </div>
          </div>
        )}

        {/* Recording Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-baloo text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FaMicrophone /> Record Your Voice
            </h3>
            {hasRecorded && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                Recording saved!
              </span>
            )}
          </div>
          
          {!showRecording ? (
            <button
              onClick={startRecording}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaMicrophone /> Start Recording
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-3xl font-bold text-red-500">{recordingTime}s</span>
                <p className="text-sm text-gray-500">Recording...</p>
              </div>
              <button
                onClick={stopRecording}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaStop /> Stop Recording
              </button>
            </div>
          )}
          
          {hasRecorded && (
            <Link
              to={`/music/record/${songId}`}
              className="mt-3 w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <FaPlay /> Play my recording
            </Link>
          )}
        </div>

        {/* Vocabulary from Song */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-baloo text-lg font-semibold text-gray-800 dark:text-white">
              📚 Learn Words
            </h3>
            <button
              onClick={() => setShowVocabulary(!showVocabulary)}
              className="text-primary text-sm font-medium"
            >
              {showVocabulary ? 'Hide' : 'Show'}
            </button>
          </div>
          
          <AnimatePresence>
            {showVocabulary && song.vocabWords && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2"
              >
                {song.vocabWords.map((word, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Complete Button */}
        {!progress.completed.includes(songId) && (
          <button
            onClick={handleComplete}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <FaStar /> Mark Song Learned
          </button>
        )}

        {/* Karaoke Mode Button */}
        <Link
          to={`/music/karaoke/${songId}`}
          className="mt-3 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <FaMusic /> Full Karaoke Mode
        </Link>
      </div>
    </div>
  );
};

export default SongPlayer;