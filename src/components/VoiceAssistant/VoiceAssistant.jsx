/**
 * VoiceAssistant Component - Interactive voice assistant for kids
 * Provides voice-guided navigation and voice command recognition
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaRobot, FaTimes } from 'react-icons/fa';
import { useVoiceGuide } from '../../context/VoiceGuideContext';
import { voiceGuide } from '../../services/VoiceGuideService';

const VoiceAssistant = () => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const recognitionRef = useRef(null);
  const { isMuted } = useVoiceGuide();

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results[0])
          .map(result => result.transcript)
          .join('');
        setTranscript(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript) {
          handleVoiceCommand(transcript);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isMuted) {
      setTranscript('');
      setResponse('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleVoiceCommand = (command) => {
    const cmd = command.toLowerCase().trim();
    let responseText = '';

    // Navigation commands
    if (cmd.includes('go to home') || cmd.includes('home page')) {
      responseText = 'Going to home page!';
      window.location.hash = '/';
    } else if (cmd.includes('go to alphabet') || cmd.includes('alphabet page')) {
      responseText = 'Opening alphabet learning!';
      window.location.hash = '/alphabet';
    } else if (cmd.includes('go to numbers') || cmd.includes('numbers page')) {
      responseText = 'Opening numbers learning!';
      window.location.hash = '/numbers';
    } else if (cmd.includes('go to games') || cmd.includes('games page')) {
      responseText = 'Opening games!';
      window.location.hash = '/games';
    } else if (cmd.includes('go to profile') || cmd.includes('profile page')) {
      responseText = 'Opening your profile!';
      window.location.hash = '/profile';
    } else if (cmd.includes('go to parent zone') || cmd.includes('parent zone')) {
      responseText = 'Opening parent zone!';
      window.location.hash = '/parent-zone';
    } else if (cmd.includes('go to teacher') || cmd.includes('teacher page')) {
      responseText = 'Opening teacher dashboard!';
      window.location.hash = '/teacher';
    // Learning commands
    } else if (cmd.includes('read to me') || cmd.includes('read story')) {
      responseText = 'Let me read something fun for you!';
    } else if (cmd.includes('help me') || cmd.includes('what can i do')) {
      responseText = 'You can say: go to alphabet, go to numbers, go to games, or read to me!';
    } else if (cmd.includes('stop') || cmd.includes('quiet') || cmd.includes('shut up')) {
      voiceGuide.cancel();
      responseText = 'Okay, I am quiet now.';
      setIsActive(false);
    } else if (cmd.includes('hello') || cmd.includes('hi')) {
      responseText = 'Hello there! I am Makenna, your learning assistant!';
    } else {
      responseText = "Sorry, I did not understand. Try saying 'go to alphabet' or 'go to games'!";
    }

    setResponse(responseText);
    voiceGuide.speak(responseText);
  };

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-2 min-w-64"
          >
            <div className="flex items-center gap-3 mb-2">
              <FaRobot className="text-blue-500 text-2xl" />
              <span className="font-bold text-gray-800 dark:text-white">Makenna Assistant</span>
            </div>
            
            {isListening && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Listening...</span>
              </div>
            )}
            
            {transcript && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                <strong>You said:</strong> {transcript}
              </p>
            )}
            
            {response && (
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {response}
              </p>
            )}
            
            <button
              onClick={() => setIsActive(false)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          if (isActive && isListening) {
            stopListening();
          } else if (isActive) {
            startListening();
          } else {
            setIsActive(true);
            startListening();
          }
        }}
        disabled={isMuted}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isMuted 
            ? 'bg-gray-300 cursor-not-allowed' 
            : isListening 
              ? 'bg-red-500 animate-pulse' 
              : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
      </button>
    </div>
  );
};

export default VoiceAssistant;