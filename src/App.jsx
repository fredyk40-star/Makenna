import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { ProfileProvider, useProfiles } from './context/ProfileContext';

// Components
import Layout from './components/layout/Layout';
import OfflineDetector from './components/common/OfflineDetector';
import InstallPrompt from './components/common/InstallPrompt';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProfileSelection from './components/profiles/ProfileSelection';

// Lazy load pages with error handling
const lazyWithErrorHandler = (importFn) => {
  return lazy(() => {
    return importFn().catch(error => {
      console.error('Lazy loading failed:', error);
      // Try to recover by reloading
      if (error.message.includes('chunk')) {
        window.location.reload();
      }
      throw error;
    });
  });
};

// Lazy load pages
const Home = lazyWithErrorHandler(() => import('./pages/Home/Home'));
const Learn = lazyWithErrorHandler(() => import('./pages/Learn/Learn'));
const Games = lazyWithErrorHandler(() => import('./pages/Games/Games'));
const Welcome = lazyWithErrorHandler(() => import('./pages/Welcome/Welcome'));
const GraduationPage = lazyWithErrorHandler(() => import('./pages/Graduation/GraduationPage'));

// Bible Time Pages
const BibleTime = lazyWithErrorHandler(() => import('./pages/BibleTime/BibleTime'));
const BibleStoryReader = lazyWithErrorHandler(() => import('./pages/BibleTime/BibleStoryReader'));

// Science Lab Pages
const ScienceLab = lazyWithErrorHandler(() => import('./pages/ScienceLab/ScienceLab'));
const WaterCycle = lazyWithErrorHandler(() => import('./pages/ScienceLab/WaterCycle'));
const PartsOfAPlant = lazyWithErrorHandler(() => import('./pages/ScienceLab/PartsOfAPlant'));
const SolarSystem = lazyWithErrorHandler(() => import('./pages/ScienceLab/SolarSystem'));

// Ghana Explorer Page
const GhanaExplorer = lazyWithErrorHandler(() => import('./pages/GhanaExplorer/GhanaExplorer'));



const ShapeLesson = lazyWithErrorHandler(() => import('./pages/Shapes/ShapeLesson'));
const ColoursHome = lazyWithErrorHandler(() => import('./pages/Colours/ColoursHome'));
const ColourLesson = lazyWithErrorHandler(() => import('./pages/Colours/ColourLesson'));
const ComingSoon = lazyWithErrorHandler(() => import('./pages/ComingSoon/ComingSoon'));
const Profile = lazyWithErrorHandler(() => import('./pages/Profile/Profile'));
const Settings = lazyWithErrorHandler(() => import('./pages/Settings/Settings'));
const ParentZone = lazyWithErrorHandler(() => import('./pages/ParentZone/ParentZone'));

// Reading Pages
const WordBuilder = lazyWithErrorHandler(() => import('./pages/Reading/WordBuilder'));
const SightWords = lazyWithErrorHandler(() => import('./pages/Reading/SightWords'));

// Stories Pages
const StoriesHome = lazyWithErrorHandler(() => import('./pages/Stories/StoriesHome'));
const StoryReader = lazyWithErrorHandler(() => import('./pages/Stories/StoryReader'));

// Alphabet Pages
const AlphabetHome = lazyWithErrorHandler(() => import('./pages/Alphabet/AlphabetHome'));
const LessonPage = lazyWithErrorHandler(() => import('./pages/Alphabet/LessonPage'));
const TracingPage = lazyWithErrorHandler(() => import('./pages/Alphabet/TracingPage'));

// Game Pages
const AlphabetGames = lazyWithErrorHandler(() => import('./pages/Games/AlphabetGames'));
const ShapesGames = lazyWithErrorHandler(() => import('./pages/Shapes/ShapesGames'));

// Numbers Pages
const NumbersHome = lazyWithErrorHandler(() => import('./pages/Numbers/NumbersHome'));
const NumberLesson = lazyWithErrorHandler(() => import('./pages/Numbers/NumberLesson'));
const NumberTracing = lazyWithErrorHandler(() => import('./pages/Numbers/NumberTracing'));
const NumbersGames = lazyWithErrorHandler(() => import('./pages/Numbers/NumbersGames'));
const GameTemplate = lazyWithErrorHandler(() => import('./pages/Numbers/GameTemplate'));
const AnimalSafari = lazyWithErrorHandler(() => import('./pages/AnimalSafari/AnimalSafari'));
const Music = lazyWithErrorHandler(() => import('./pages/Music/Music'));
const Drawing = lazyWithErrorHandler(() => import('./pages/Drawing/Drawing'));
const NumberStories = lazyWithErrorHandler(() => import('./pages/Numbers/NumberStories'));
const NumberStoryReader = lazyWithErrorHandler(() => import('./pages/Numbers/NumberStoryReader'));
const NumbersMastery = lazyWithErrorHandler(() => import('./pages/Numbers/NumbersMastery'));
const MathsHome = lazyWithErrorHandler(() => import('./pages/Maths/MathsHome'));
const Addition = lazyWithErrorHandler(() => import('./pages/Maths/Addition'));
const Subtraction = lazyWithErrorHandler(() => import('./pages/Maths/Subtraction'));
const Counting = lazyWithErrorHandler(() => import('./pages/Maths/Counting'));
const CompareNumbers = lazyWithErrorHandler(() => import('./pages/Maths/CompareNumbers'));

const AppContent = () => {
  const { activeProfile, loading } = useProfiles();

  useEffect(() => {
    // Check for dark mode preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Register service worker with error handling
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registered successfully:', registration);
          })
          .catch(err => {
            console.warn('Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!activeProfile) {
    return <ProfileSelection />;
  }

  return (
      <BrowserRouter>
        <OfflineDetector />
        <InstallPrompt />

        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="welcome" element={<Welcome />} />
                <Route path="learn" element={<Learn />} />
                <Route path="games" element={<Games />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="parent-zone" element={<ParentZone />} />
                
                {/* Alphabet Routes */}
                <Route path="alphabet" element={<AlphabetHome />} />
                <Route path="alphabet/lesson/:letterId" element={<LessonPage />} />
                <Route path="alphabet/trace/:letterId" element={<TracingPage />} />
                
                {/* Game Routes */}
                <Route path="games/alphabet" element={<AlphabetGames />} />
                <Route path="games/shapes" element={<ShapesGames />} />
                <Route path="animal-safari" element={<AnimalSafari />} />
                <Route path="music" element={<Music />} />

                {/* Reading Routes */}
                <Route path="reading/word-builder" element={<WordBuilder />} />
                <Route path="reading/sight-words" element={<SightWords />} />
                
                {/* Story Routes */}
                <Route path="stories" element={<StoriesHome />} />
                <Route path="story/:storyId" element={<StoryReader />} />
                
                {/* Graduation Routes */}
                <Route path="graduation" element={<GraduationPage />} />

                {/* Bible Time Routes */}
                <Route path="bible-time" element={<BibleTime />} />
                <Route path="bible-time/:storyId" element={<BibleStoryReader />} />

                {/* Science Lab Routes */}
                <Route path="science-lab" element={<ScienceLab />} />
                <Route path="science-lab/water-cycle" element={<WaterCycle />} />
                <Route path="science-lab/parts-of-a-plant" element={<PartsOfAPlant />} />
                <Route path="science-lab/solar-system" element={<SolarSystem />} />

                {/* Ghana Explorer Route */}
                <Route path="ghana-explorer" element={<GhanaExplorer />} />
                
                
                
                
                {/* Numbers Routes */}
                <Route path="numbers" element={<NumbersHome />} />
                <Route path="numbers/lesson/:numberId" element={<NumberLesson />} />
                <Route path="numbers/trace/:numberId" element={<NumberTracing />} />
                <Route path="numbers/games" element={<NumbersGames />} />
                <Route path="numbers/game/:gameId" element={<GameTemplate />} />
                <Route path="numbers/stories" element={<NumberStories />} />
                <Route path="numbers/story/:storyId" element={<NumberStoryReader />} />
                <Route path="numbers/mastery" element={<NumbersMastery />} />

                {/* Shapes and Colours Routes */}
                <Route path="shapes" element={<Navigate to="/games/shapes" replace />} />
                <Route path="shapes/lesson/:shapeId" element={<ShapeLesson />} />
                <Route path="colours" element={<ColoursHome />} />
                <Route path="colours/lesson/:colorId" element={<ColourLesson />} />

                {/* Maths Routes */}
                <Route path="maths" element={<MathsHome />} />
                <Route path="maths/addition" element={<Addition />} />
                <Route path="maths/subtraction" element={<Subtraction />} />
                <Route path="maths/counting" element={<Counting />} />
                <Route path="maths/compare" element={<CompareNumbers />} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </AnimatePresence>
      </BrowserRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <ProfileProvider>
            <AppContent />
          </ProfileProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
export default App;
