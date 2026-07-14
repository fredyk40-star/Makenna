import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaRobot, FaTimes, FaComment, FaPaperPlane, FaMinus, FaPlus } from 'react-icons/fa';
import { AIAssistantService } from '../../services/AIAssistantService';
import { useChildAccount } from '../../context/ChildAccountContext';

const AIAssistant = () => {
  const { activeChild } = useChildAccount();
  const child = activeChild;
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(() => {
    // Load user preference from localStorage
    try {
      return localStorage.getItem('makenna_ai_minimized') === 'true';
    } catch {
      return false;
    }
  });
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const handleVoiceInputRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Keep the ref in sync with the latest handleVoiceInput
  useEffect(() => {
    handleVoiceInputRef.current = handleVoiceInput;
  });

  // Save minimize preference
  useEffect(() => {
    try {
      localStorage.setItem('makenna_ai_minimized', String(isMinimized));
    } catch (e) {
      // localStorage not available
    }
  }, [isMinimized]);

  // Scroll behavior: hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show when at the top of the page
      if (currentScrollY < 50) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      // Determine scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide the assistant
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show the assistant
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);

      // Clear any existing timeout and set a new one to show after scrolling stops
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [lastScrollY]);

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
          handleVoiceInputRef.current?.(transcript);
        }
      };
    }

    // Show initial greeting after a delay
    const timer = setTimeout(() => {
      if (child?.childId) {
        const greeting = AIAssistantService.getGreeting(child.childId, child.fullName);
        setMessages([{ id: Date.now(), text: greeting, sender: 'assistant' }]);
        setShowBubble(true);
        setIsActive(true);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [child, transcript]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speak = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      
      const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      // Try to find a kid-friendly voice
      const voices = window.speechSynthesis.getVoices();
      const kidVoice = voices.find(v => 
        v.name.includes('Female') || 
        v.name.includes('Samantha') ||
        v.name.includes('Google UK English Female') ||
        v.name.includes('Microsoft Zira') ||
        v.lang.includes('en-')
      );
      
      if (kidVoice) {
        utterance.voice = kidVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleClick = () => {
    if (isMinimized) {
      setIsMinimized(false);
      return;
    }
    setIsOpen(!isOpen);
    
    if (!isOpen && child?.childId) {
      if (messages.length === 0) {
        const suggestion = AIAssistantService.getNextLessonSuggestion(child.childId, child.fullName);
        setMessages([{ id: Date.now(), text: suggestion, sender: 'assistant' }]);
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleMinimize = (e) => {
    e.stopPropagation();
    setIsMinimized(true);
    setIsOpen(false);
  };

  const handleExpand = () => {
    setIsMinimized(false);
  };

  const startListening = () => {
    if (recognitionRef.current && child?.childId) {
      setTranscript('');
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

  const handleVoiceInput = (transcript) => {
    const userMessage = { id: Date.now(), text: transcript, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    // Process the query
    const response = AIAssistantService.processQuery(child?.childId, transcript);
    const assistantMessage = { id: Date.now() + 1, text: response, sender: 'assistant' };
    setMessages(prev => [...prev, assistantMessage]);
    
    // Speak the response
    speak(response);
    
    // Record interaction
    AIAssistantService.recordAIInteraction({
      childId: child?.childId,
      type: 'voice_query',
      query: transcript,
      response: response
    });
    
    setTranscript('');
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !child?.childId) return;
    
    const userMessage = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    const response = AIAssistantService.processQuery(child.childId, inputText);
    const assistantMessage = { id: Date.now() + 1, text: response, sender: 'assistant' };
    setMessages(prev => [...prev, assistantMessage]);
    
    speak(response);
    
    AIAssistantService.recordAIInteraction({
      childId: child.childId,
      type: 'text_query',
      query: inputText,
      response: response
    });
    
    setInputText('');
  };

  // Check if speech recognition is supported
  const isSpeechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  return (
    <div className="fixed bottom-24 left-4 z-40 pointer-events-none">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 left-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl pointer-events-auto overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <div className="flex items-center gap-2">
                <FaRobot className="text-xl" />
                <span className="font-bold">Makenna Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleMinimize}
                  className="p-1 hover:bg-white/20 rounded"
                  title="Minimize"
                >
                  <FaMinus className="text-xs" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-white/20 rounded"
                  title="Close"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-2 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isListening && (
                <div className="flex justify-start">
                  <div className="max-w-[75%] p-2 rounded-lg bg-blue-100 text-blue-600">
                    <p className="text-sm italic">Listening...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleTextSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                <FaPaperPlane className="text-xs" />
              </button>
              {isSpeechSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={!child?.childId}
                  className={`p-2 rounded-lg ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-purple-500 hover:bg-purple-600'
                  } disabled:opacity-50`}
                >
                  {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </button>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Bubble for notifications */}
      <AnimatePresence>
        {showBubble && !isOpen && isActive && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            className="absolute bottom-20 left-0 mb-2 pointer-events-auto"
          >
            <div className="relative bg-white rounded-2xl px-4 py-3 shadow-lg max-w-xs">
              <p className="text-sm text-gray-800 font-medium">
                {messages.length > 0 ? messages[messages.length - 1].text : 'Hi there!'}
              </p>
              <button
                onClick={handleClick}
                className="absolute -top-2 -left-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-purple-600"
              >
                <FaComment />
              </button>
              {/* Bubble tail */}
              <div className="absolute bottom-0 left-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-white shadow-md" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Character */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, x: -20 }}
            animate={{
              y: [0, -10, 0],
              opacity: isVisible ? 1 : 0,
              scale: 1,
              x: isVisible ? 0 : -20
            }}
            exit={{ opacity: 0, scale: 0.5, x: -20 }}
            transition={{
              y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 },
              x: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClick}
            className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full shadow-lg cursor-pointer pointer-events-auto flex items-center justify-center hover:scale-105 transition-transform relative overflow-hidden"
          >
            {/* Minimize button overlay */}
            <button
              onClick={handleMinimize}
              className="absolute top-0 right-0 z-10 w-5 h-5 bg-white/80 hover:bg-white text-purple-500 rounded-full flex items-center justify-center text-[10px] shadow-sm transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
              style={{ opacity: 0, transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
              title="Minimize"
            >
              <FaMinus />
            </button>

            {/* Animated character face */}
            <div className="relative">
              {/* Eyes */}
              <div className="flex justify-center gap-2 mb-1">
                <div className={`w-2 h-2 bg-white rounded-full ${isListening ? 'animate-ping' : 'animate-pulse'}`} />
                <div className={`w-2 h-2 bg-white rounded-full ${isListening ? 'animate-ping' : 'animate-pulse'}`} />
              </div>
              {/* Mouth */}
              <div className={`w-4 h-2 border-b-2 border-white rounded-full mx-auto ${isListening ? 'w-6 h-3 bg-white rounded-full animate-bounce' : ''}`} />
              {/* Cheeks */}
              <div className="absolute -left-1 top-2 w-1 h-1 bg-pink-200 rounded-full opacity-50" />
              <div className="absolute -right-1 top-2 w-1 h-1 bg-pink-200 rounded-full opacity-50" />
            </div>

            {/* Glow effect when active */}
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full bg-purple-300 opacity-30 blur-md"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.1, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              />
            )}

            {/* Notification dot for unread messages */}
            {!isOpen && messages.length > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Dot */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, x: -20 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: 1, x: isVisible ? 0 : -20 }}
            exit={{ opacity: 0, scale: 0.5, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleExpand}
            className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full shadow-lg cursor-pointer pointer-events-auto flex items-center justify-center relative"
            title="Expand Makenna Assistant"
          >
            <FaPlus className="text-white text-xs" />
            {messages.length > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAssistant;
