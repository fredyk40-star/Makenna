import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaPlay, FaPause, FaStop, FaMicrophone, FaSave, FaTrash } from 'react-icons/fa';
import { getSongById } from '../../data/musicData';
import { useMusicProgress } from '../../hooks/useMusicProgress';
import { useChildAccount } from '../../context/ChildAccountContext';
import { voiceGuide } from '../../services/VoiceGuideService';

const RecordVoice = () => {
  const { songId } = useParams();
  const { childName, childId } = useChildAccount();
  const { progress } = useMusicProgress();
  
  const [song, setSong] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  
  const recordingRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const found = getSongById(songId);
    if (found) {
      setSong(found);
    }
    
    // Check if recording exists
    if (progress.recordedSongs?.[songId]) {
      setHasRecording(true);
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [songId, progress.recordedSongs]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        recordingRef.current = audioUrl;
        setHasRecording(true);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      voiceGuide.speak('Recording started! Sing beautifully!');
    } catch (error) {
      console.error('Recording failed:', error);
      alert('Microphone access needed for recording. Please allow microphone permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const playRecording = () => {
    if (recordingRef.current) {
      const audio = new Audio(recordingRef.current);
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (recordingRef.current) {
      URL.revokeObjectURL(recordingRef.current);
      recordingRef.current = null;
    }
    setHasRecording(false);
    voiceGuide.speak('Recording deleted');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 shadow-soft">
        <Link
          to={`/music/${songId}`}
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl"
          aria-label="Back to song"
        >
          <FaArrowLeft className="text-xl" />
        </Link>
        <div>
          <h1 className="font-baloo text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            {song.icon} {song.title} - My Recording
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Compare your voice with the song!
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Original Song Lyrics Reference */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft">
          <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white mb-3">
            Original Lyrics
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {song.lyrics && song.lyrics.map((line, index) => (
              <div key={index} className="text-gray-600 dark:text-gray-300">
                {line.words}
                {line.translation && (
                  <span className="text-xs text-gray-400 ml-2">({line.translation})</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recording Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">
              <FaMicrophone className={isRecording ? 'text-red-500 animate-pulse' : 'text-purple-500'} />
            </div>
            
            <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-2">
              {isRecording ? 'Recording...' : hasRecording ? 'Your Recording' : 'No Recording Yet'}
            </h3>
            
            {isRecording && (
              <div className="text-3xl font-bold text-red-500 mb-4">
                {recordingTime}s
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!hasRecording || isRecording ? (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-8 py-4 rounded-xl font-bold text-white flex items-center gap-3 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isRecording ? <FaStop /> : <FaMicrophone />}
                {isRecording ? 'Stop Recording' : 'Record Song'}
              </button>
            ) : (
              <>
                <button
                  onClick={playRecording}
                  className="px-6 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                  <FaPlay /> Play
                </button>
                <button
                  onClick={deleteRecording}
                  className="px-6 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                >
                  <FaTrash /> Delete
                </button>
              </>
            )}
          </div>

          {/* Instructions */}
          {!hasRecording && !isRecording && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Tap the button and sing along with the lyrics above!
            </p>
          )}
        </div>

        {/* Tips for Better Recording */}
        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl p-4 shadow-soft">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
            🎤 Singing Tips
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Sing loudly and clearly</li>
            <li>• Try to match the rhythm</li>
            <li>• Practice makes perfect!</li>
            <li>• Have fun and be creative!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecordVoice;