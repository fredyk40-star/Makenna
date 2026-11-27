import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBookOpen,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperPlane,
  FaRobot,
  FaVolumeUp,
} from 'react-icons/fa';
import { AIAssistantService } from '../../services/AIAssistantService';
import { CurriculumTutorService } from '../../services/CurriculumTutorService';
import { GeminiTutorService } from '../../services/GeminiTutorService';
import { useChildAccount } from '../../context/ChildAccountContext';

const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'twi', label: 'Twi' },
  { value: 'ewe', label: 'Ewe' },
  { value: 'ga', label: 'Ga' },
  { value: 'fante', label: 'Fante' },
];

const firstName = (fullName) => (fullName ? String(fullName).trim().split(/\s+/)[0] : 'Friend');

const localTaskAnswer = (task, unit, fullName) => {
  const name = firstName(fullName);
  const title = unit?.title || 'this lesson';
  const content = unit?.content || '';
  const summaries = {
    practice: `${name}, let's practise ${title}. ${content} Try three little questions from the lesson.`,
    story: `${name}, here is a short ${title} story: ${content} Keep the story kind and simple.`,
    pronunciation: `${name}, let's say the words in ${title} slowly. ${content} Clap each sound as you say it.`,
    math: `${name}, let's count with ${title}. ${content} Try a small market problem with cedis.`,
    why: `${name}, ${title} matters because it helps you learn step by step. ${content}`,
    translate: `${name}, ${title} means: ${content} Say it in your own words.`,
  };
  return summaries[task] || `${name}, let's learn about ${title}. ${content}`;
};

const QUICK_ACTIONS = [
  {
    task: 'practice',
    label: 'Practice',
    question: 'Create three short practice questions from this lesson.',
  },
  {
    task: 'story',
    label: 'Story',
    question: 'Tell a short story using words from this lesson.',
  },
  {
    task: 'pronunciation',
    label: 'Sounds',
    question: 'Break the main words into syllables and sounds-like hints.',
  },
  {
    task: 'math',
    label: 'Math',
    question: 'Create a Ghanaian-context counting or money word problem.',
  },
  {
    task: 'why',
    label: 'Why?',
    question: 'Why is this lesson important for a child?',
  },
  {
    task: 'translate',
    label: 'Translate',
    question: 'Explain this lesson simply.',
  },
];

const TutorPage = () => {
  const navigate = useNavigate();
  const { activeChild } = useChildAccount();
  const childId = activeChild?.childId;
  const childName = activeChild?.fullName;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [tutorEnabled, setTutorEnabled] = useState(() => CurriculumTutorService.isEnabled(childId));
  const [allowVoice, setAllowVoice] = useState(
    () => CurriculumTutorService.getSettings(childId).allowVoice,
  );
  const [allowOnlineAI, setAllowOnlineAI] = useState(
    () => CurriculumTutorService.getSettings(childId).allowOnlineAI,
  );
  const [tutorLanguage, setTutorLanguage] = useState('english');
  const [mood, setMood] = useState('happy');
  const [isListening, setIsListening] = useState(false);
  const [onlineNotice, setOnlineNotice] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [units, setUnits] = useState(() => CurriculumTutorService.getUnits(childId));
  const [selectedUnitKey, setSelectedUnitKey] = useState(
    () => CurriculumTutorService.getUnits(childId)[0]?.source || null,
  );

  const activeUnit = units.find(unit => unit.source === selectedUnitKey) || units[0] || null;

  const recognitionRef = useRef(null);
  const recognitionActiveRef = useRef(false);
  const transcriptRef = useRef('');
  const messagesEndRef = useRef(null);
  const handleVoiceInputRef = useRef(null);

  // Keep fixed app chrome from covering the full-screen chat.
  useEffect(() => {
    document.body.dataset.tutorOpen = 'true';
    return () => {
      delete document.body.dataset.tutorOpen;
    };
  }, []);

  // The tutor is controlled by a parent in Settings.
  useEffect(() => {
    const refresh = () => {
      const settings = CurriculumTutorService.getSettings(childId);
      setTutorEnabled(settings.enabled);
      setAllowVoice(settings.allowVoice);
      setAllowOnlineAI(settings.allowOnlineAI);

      const nextUnits = CurriculumTutorService.getUnits(childId);
      setUnits(nextUnits);
      setSelectedUnitKey((current) => {
        if (nextUnits.some(unit => unit.source === current)) return current;
        return nextUnits[0]?.source || null;
      });
    };
    refresh();
    return CurriculumTutorService.subscribe(refresh);
  }, [childId]);

  const speak = useCallback((text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance
      || window.webkitSpeechSynthesisUtterance;
    if (!SpeechSynthesisUtterance) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

    const voices = window.speechSynthesis.getVoices();
    const kidVoice = voices.find(voice => (
      voice.name.includes('Female')
      || voice.name.includes('Samantha')
      || voice.name.includes('Google UK English Female')
      || voice.name.includes('Microsoft Zira')
      || voice.lang.includes('en-')
    ));
    if (kidVoice) utterance.voice = kidVoice;

    window.speechSynthesis.speak(utterance);
  }, []);

  const askTutor = useCallback(async (question, task = 'answer', language = tutorLanguage) => {
    const cleanQuestion = question?.trim();
    if (!cleanQuestion || !childId || !tutorEnabled) return;

    setMessages(previous => [
      ...previous,
      { id: Date.now(), text: cleanQuestion, sender: 'user' },
    ]);
    setOnlineNotice('');

    // Match the child's words to a real curriculum unit. Quick actions use the
    // lesson selected in the toolbar because their text is task-only.
    const localAnswer = CurriculumTutorService.answer(childId, cleanQuestion, childName);
    const matchedUnit = localAnswer?.matched ? localAnswer.unit : null;
    // Quick actions describe their text as task-only, so they use the lesson
    // picked in the toolbar. A typed question must match a real lesson before
    // it is allowed to produce an "Open lesson" link.
    const unit = matchedUnit || (task !== 'answer' ? activeUnit : null);
    const localResult = unit
      ? {
        unit,
        matched: Boolean(matchedUnit) || task !== 'answer',
        text: matchedUnit && localAnswer?.text
          ? localAnswer.text
          : localTaskAnswer(task, unit, childName),
      }
      : {
        unit: null,
        matched: false,
        text: localAnswer?.text || 'Choose a lesson first, then ask me about it.',
      };

    if (matchedUnit) setSelectedUnitKey(matchedUnit.source);

    setMood('thinking');
    const result = await GeminiTutorService.answer(
      childId,
      cleanQuestion,
      localResult,
      childName,
      allowOnlineAI,
      task,
      language,
    );

    const response = result?.text || localResult.text;
    if (result?.onlineError) setOnlineNotice(result.onlineError);
    setMessages(previous => [
      ...previous,
      {
        id: Date.now() + 1,
        text: response,
        sender: 'assistant',
        unit: result?.unit || null,
        matched: result?.matched === true,
        onlineError: result?.onlineError || '',
      },
    ]);
    speak(response);
    setMood('happy');
    CurriculumTutorService.recordQuestion(childId, result?.unit || null);

    AIAssistantService.recordAIInteraction({
      childId,
      type: `${task}_query`,
      query: cleanQuestion,
      response,
    });
  }, [
    activeUnit,
    allowOnlineAI,
    childId,
    childName,
    speak,
    tutorEnabled,
    tutorLanguage,
  ]);

  const handleVoiceInput = useCallback(async (transcript) => {
    if (!tutorEnabled || !allowVoice) return;
    await askTutor(transcript, 'answer');
    transcriptRef.current = '';
  }, [allowVoice, askTutor, tutorEnabled]);

  useEffect(() => {
    handleVoiceInputRef.current = handleVoiceInput;
  }, [handleVoiceInput]);

  useEffect(() => {
    if (
      tutorEnabled
      && allowVoice
      && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
    ) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const recognizedText = Array.from(event.results)
          .map(result => result[0]?.transcript || '')
          .join('');
        transcriptRef.current = recognizedText.trim();
      };

      recognitionRef.current.onend = () => {
        const shouldSubmit = recognitionActiveRef.current;
        const recognizedText = transcriptRef.current.trim();
        recognitionActiveRef.current = false;
        transcriptRef.current = '';
        if (!shouldSubmit) return;
        setIsListening(false);
        if (recognizedText) {
          handleVoiceInputRef.current?.(recognizedText);
        }
      };

      recognitionRef.current.onerror = (error) => {
        const wasActive = recognitionActiveRef.current;
        recognitionActiveRef.current = false;
        if (!wasActive) return;
        transcriptRef.current = '';
        setIsListening(false);
        if (error.error !== 'aborted' && error.error !== 'no-speech') {
          console.warn('Voice recognition failed:', error.error);
          setVoiceError(error.error === 'network'
            ? 'Voice input needs an internet connection. Please type your question instead.'
            : 'Voice input is unavailable here. Please type your question instead.');
        }
      };
    }

    return () => {
      if (recognitionRef.current && recognitionActiveRef.current) {
        recognitionActiveRef.current = false;
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.warn('Voice recognition could not be aborted:', error);
        }
      }
      recognitionRef.current = null;
    };
  }, [allowVoice, tutorEnabled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!childId || !tutorEnabled) return;
      const suggestion = CurriculumTutorService.getSuggestion(childId, childName);
      const greeting = suggestion?.text || AIAssistantService.getGreeting(childId, childName);
      setMessages([{
        id: Date.now(),
        text: greeting,
        sender: 'assistant',
        unit: null,
        matched: false,
      }]);
    }, 2000);

    return () => clearTimeout(timer);
  }, [childId, childName, tutorEnabled]);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const startListening = () => {
    if (!tutorEnabled || !allowVoice || !recognitionRef.current || !childId) return;
    transcriptRef.current = '';
    setVoiceError('');
    try {
      recognitionActiveRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      recognitionActiveRef.current = false;
      setIsListening(false);
      console.warn('Voice recognition could not start:', error);
      setVoiceError('Voice input could not start here. Please type your question instead.');
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current || !recognitionActiveRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (error) {
      recognitionActiveRef.current = false;
      setIsListening(false);
      console.warn('Voice recognition could not stop:', error);
    }
  };

  const handleTextSubmit = (event) => {
    event.preventDefault();
    if (!inputText.trim() || !childId || !tutorEnabled) return;
    const question = inputText.trim();
    setInputText('');
    askTutor(question, 'answer');
  };

  const isSpeechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  return (
    <div className="min-h-dvh h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-white">
      <header
        className="tutor-header shrink-0 border-b border-purple-100 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
        style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-3 pb-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Back to previous page"
            title="Back"
          >
            <FaArrowLeft />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <FaRobot className="shrink-0 text-xl" />
            <div className="min-w-0">
              <h1 className="truncate font-baloo text-lg font-bold">Makenna Tutor</h1>
              <p className="truncate text-xs text-white/85">
                {tutorEnabled
                  ? (mood === 'thinking' ? 'Thinking…' : 'Ready to help with your lessons')
                  : 'Locked by a grown-up'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
        aria-label="Tutor conversation"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 pb-2">
          {onlineNotice && (
            <p
              role="status"
              className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
            >
              {onlineNotice}
            </p>
          )}
          {voiceError && (
            <p
              role="alert"
              className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
            >
              {voiceError}
            </p>
          )}
          {!tutorEnabled ? (
            <div className="rounded-xl bg-purple-50 p-4 text-sm text-purple-900 dark:bg-purple-900/40 dark:text-purple-100">
              <p className="font-semibold">Tutor is locked</p>
              <p className="mt-1">
                Ask a grown-up to open Settings → AI tutor and switch it on. Answers come only
                from your school work stored on this device.
              </p>
            </div>
          ) : messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[75%] ${
                  message.sender === 'user'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-800 dark:bg-gray-700 dark:text-white'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                {message.sender === 'assistant' && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => speak(message.text)}
                      className="rounded-md bg-purple-100 px-2 py-1 text-xs text-purple-700 dark:bg-purple-900/40 dark:text-purple-200"
                    >
                      <FaVolumeUp className="mr-1 inline" /> Read
                    </button>
                    {message.matched && message.unit?.path && (
                      <button
                        type="button"
                        onClick={() => navigate(message.unit.path)}
                        className="rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                      >
                        <FaBookOpen className="mr-1 inline" /> Open lesson
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isListening && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-blue-100 px-3 py-2 text-sm italic text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
                Listening…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {tutorEnabled && (
        <div className="shrink-0 border-t border-gray-200 bg-white/80 dark:border-gray-700 dark:bg-gray-900/80">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2 overflow-x-auto px-3 pt-2 pb-1">
            <select
              value={activeUnit?.source || ''}
              onChange={event => {
                setSelectedUnitKey(event.target.value);
                setOnlineNotice('');
              }}
              disabled={units.length === 0}
              className="h-9 max-w-[11rem] shrink-0 rounded-lg bg-purple-100 px-2 text-xs text-purple-800 dark:bg-purple-900/40 dark:text-purple-200"
              aria-label="Tutor lesson"
              title="Lesson used for practice and story activities"
            >
              {units.length === 0 && <option value="">No lesson</option>}
              {units.map(unit => (
                <option key={unit.source} value={unit.source}>
                  {unit.subject}: {unit.title}
                </option>
              ))}
            </select>
            <select
              value={tutorLanguage}
              onChange={event => setTutorLanguage(event.target.value)}
              className="h-9 shrink-0 rounded-lg bg-gray-100 px-2 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
              aria-label="Tutor language"
            >
              {LANGUAGES.map(language => (
                <option key={language.value} value={language.value}>{language.label}</option>
              ))}
            </select>
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.task}
                type="button"
                onClick={() => askTutor(action.question, action.task, tutorLanguage)}
                className="h-9 shrink-0 whitespace-nowrap rounded-lg bg-gray-100 px-2 text-xs text-gray-700 hover:bg-purple-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-purple-900/40"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleTextSubmit}
        className="flex w-full shrink-0 items-center gap-2 border-t border-gray-200 bg-white/90 px-3 py-2 backdrop-blur dark:border-gray-700 dark:bg-gray-900/90"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={event => setInputText(event.target.value)}
            disabled={!tutorEnabled}
            placeholder={tutorEnabled ? 'Ask about your lessons...' : 'Ask a parent to unlock the tutor'}
            className="h-10 min-w-0 flex-1 rounded-lg bg-gray-100 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 dark:bg-gray-700"
            aria-label="Ask about your lessons"
          />
          <button
            type="submit"
            disabled={!tutorEnabled || !inputText.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50"
            aria-label="Send question"
            title="Send"
          >
            <FaPaperPlane />
          </button>
          {isSpeechSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={!childId || !tutorEnabled || !allowVoice}
              title={allowVoice ? 'Ask with your voice' : 'Voice questions are off in parent settings'}
              aria-label={allowVoice ? 'Ask with your voice' : 'Voice questions are off in parent settings'}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-50 ${
                isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TutorPage;
