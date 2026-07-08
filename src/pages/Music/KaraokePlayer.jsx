import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaPlay, FaPause, FaRedo, FaStop,
  FaExpand, FaCompress, FaStar, FaMusic, FaMicrophone
} from 'react-icons/fa';
import { getSongById } from '../../data/musicData';
import { useMusicProgress } from '../../hooks/useMusicProgress';
import { useChildAccount } from '../../context/ChildAccountContext';
import { voiceGuide } from '../../services/VoiceGuideService';
import { GamificationService } from '../../services/GamificationService';

const KaraokePlayer = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const { childName, childId } = useChildAccount();
  const { recordPlay, markCompleted, saveRecording } = useMusicProgress();
  
  const [song, setSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [showRecording, setShowRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [completedSections, setCompletedSections] = useState([]);
  
  const recordingIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const found = getSongById(songId);
    if (found) {
      setSong(found);
      setDuration(found.duration || 30);
      
      if (childName) {
        voiceGuide.speak(`Hello ${childName}! Let's sing ${found.title} in karaoke mode!`);
      }
    } else {
      navigate('/music/library');
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      voiceGuide.cancel();
    };
  }, [songId, navigate, childName]);

  // Lyric highlighting logic
  useEffect(() => {
    let interval;
    if (isPlaying && song?.lyrics) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setCurrentTime(elapsed);
        
        const lyricIndex = song.lyrics.findIndex((line, i) => {
          const nextLine = song.lyrics[i + 1];
          return elapsed >= line.timing * 4 / playbackSpeed && 
                 (!nextLine || elapsed < nextLine.timing * 4 / playbackSpeed);
        });
        
        setActiveLyricIndex(lyricIndex);
      }, 100);
    }
    return () => interval && clearInterval(interval);
  }, [isPlaying, song, playbackSpeed]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      voiceGuide.cancel();
    } else {
      if (song?.lyrics) {
        song.lyrics.forEach((line, i) => {
          setTimeout(() => {
            if (isPlaying) return;
            voiceGuide.speak(line.words, { rate: playbackSpeed * 0.8 });
          }, line.timing * 4000 / playbackSpeed);
        });
      }
    }
    setIsPlaying(!isPlaying);
    startTimeRef.current = Date.now();
  }, [isPlaying, song, playbackSpeed]);

  const handleReplay = useCallback(() => {
    voiceGuide.cancel();
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveLyricIndex(-1);
    setCompletedSections([]);
    setTimeout(() => {
      handlePlayPause();
    }, 100);
  }, [handlePlayPause]);

  const markSectionComplete = (index) => {
    if (!completedSections.includes(index)) {
      const newCompleted = [...completedSections, index];
      setCompletedSections(newCompleted);
      
      if (newCompleted.length === song?.lyrics?.length) {
        handleSongComplete();
      }
    }
  };

  const handleSongComplete = () => {
    markCompleted(songId);
    GamificationService.completeLesson(childId, 100);
    voiceGuide.speak(`Amazing! You completed ${song?.title}!`);
  };

  const startRecording = () => {
    setShowRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    voiceGuide.speak('Recording! Sing your heart out!');
  };

  const stopRecording = () => {
    setShowRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    const recordingId = `recording_${songId}_${Date.now()}`;
    saveRecording(songId, recordingId);
    GamificationService.addXP(childId, 15, 'Karaoke recording');
    voiceGuide.speak('Perfect performance!');
  };

  const speedOptions = [0.7, 1, 1.3];

  if (!song) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-white text-2xl">Loading karaoke...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <Link
          to={`/music/${songId}`}
          className="text-white hover:text-yellow-300 transition-colors p-2 rounded-xl"
          aria-label="Back to song"
        >
          <FaArrowLeft className="text-2xl" />
        </Link>
        <h1 className="font-baloo text-2xl md:text-3xl font-bold text-white text-center flex-1">
          🎤 {song.title} - Karaoke Mode
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Karaoke Display */}
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        {/* Progress */}
        <div className="w-full max-w-2xl mb-6">
          <div className="flex justify-between text-white text-sm mb-2">
            <span>{Math.floor(currentTime)}s</span>
            <span>{duration}s</span>
          </div>
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-yellow-400"
              style={{ width: `${(currentTime / duration) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        {/* Current Lyrics (Large, Centered) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLyricIndex}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -20 }}
            className="text-center mb-8"
          >
            <div className="text-4xl md:text-6xl lg:text-8xl font-bold text-white drop-shadow-lg">
              {song.lyrics && song.lyrics[activeLyricIndex]?.words || '🎵'}
            </div>
            {song.lyrics && song.lyrics[activeLyricIndex]?.translation && (
              <div className="text-xl md:text-2xl text-yellow-200 mt-2">
                {song.lyrics[activeLyricIndex].translation}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Animated Musical Notes */}
        {isPlaying && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: '100%', x: `${Math.random() * 100}%`, opacity: 0 }}
                animate={{ 
                  y: '-100%', 
                  opacity: [0, 1, 0],
                  rotate: [0, 360, 0]
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                className="absolute text-4xl text-yellow-300/50"
              >
                🎵
              </motion.div>
            ))}
          </div>
        )}

        {/* Bouncing Ball */}
        <div className="relative w-full max-w-2xl h-20 mb-8">
          <motion.div
            animate={{ 
              x: isPlaying ? ['0%', '100%', '0%'] : '50%',
              y: isPlaying ? [0, -80, 0] : 0
            }}
            transition={{ 
              duration: 2, 
              repeat: isPlaying ? Infinity : 0,
              ease: 'easeInOut'
            }}
            className="absolute top-0 left-0 text-5xl"
          >
            🎤
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Main Controls */}
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlayPause}
              className="rounded-full bg-white text-purple-600 p-6 shadow-lg"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <FaPause className="text-4xl" />
              ) : (
                <FaPlay className="text-4xl ml-2" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleReplay}
              className="rounded-full bg-white/20 text-white p-3 shadow-lg"
              aria-label="Replay"
            >
              <FaRedo className="text-2xl" />
            </motion.button>
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Speed:</span>
            {speedOptions.map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  playbackSpeed === speed
                    ? 'bg-yellow-400 text-purple-800'
                    : 'bg-white/20 text-white'
                }`}
              >
                {speed === 0.7 ? 'Slow' : speed === 1 ? 'Normal' : 'Fast'}
              </button>
            ))}
          </div>

          {/* Recording */}
          <div className="flex items-center gap-4">
            {!showRecording ? (
              <button
                onClick={startRecording}
                className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"
              >
                <FaMicrophone /> Record Song
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-red-400">{recordingTime}s</span>
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg"
                >
                  Stop
                </button>
              </div>
            )}
          </div>

          {/* Complete Button */}
          {completedSections.length === song.lyrics?.length && (
            <button
              onClick={handleSongComplete}
              className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"
            >
              <FaStar /> I Finished Singing!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KaraokePlayer;