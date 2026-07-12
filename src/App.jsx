import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { VoiceGuideProvider } from './context/VoiceGuideContext';
import { ChildAccountProvider, useChildAccount } from './context/ChildAccountContext';
import { ProfileProvider } from './context/ProfileContext';
import { I18nProvider } from './context/I18nContext';

// Components
import Layout from './components/layout/Layout';
import OfflineDetector from './components/common/OfflineDetector';
import InstallPrompt from './components/common/InstallPrompt';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import VoiceAssistant from './components/VoiceAssistant/VoiceAssistant';
import AIAssistant from './components/AIAssistant/AIAssistant';
import UpdatePreviewBanner from './components/UpdatePreview/UpdatePreviewBanner';

// Lazy load pages with error handling
const lazyWithErrorHandler = (importFn) => {
  return lazy(() => {
    return importFn().catch(error => {
      console.error('Lazy loading failed:', error);
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

const BibleTime = lazyWithErrorHandler(() => import('./pages/BibleTime/BibleTime'));
const BibleStoryReader = lazyWithErrorHandler(() => import('./pages/BibleTime/BibleStoryReader'));

const ScienceLab = lazyWithErrorHandler(() => import('./pages/ScienceLab/ScienceLab'));
const WaterCycle = lazyWithErrorHandler(() => import('./pages/ScienceLab/WaterCycle'));
const PartsOfAPlant = lazyWithErrorHandler(() => import('./pages/ScienceLab/PartsOfAPlant'));
const SolarSystem = lazyWithErrorHandler(() => import('./pages/ScienceLab/SolarSystem'));

const GhanaExplorer = lazyWithErrorHandler(() => import('./pages/GhanaExplorer/GhanaExplorer'));
const GhanaLanguages = lazyWithErrorHandler(() => import('./pages/GhanaLanguages/GhanaLanguages'));

const ShapesHome = lazyWithErrorHandler(() => import('./pages/Shapes/ShapesHome'));
const ShapeLesson = lazyWithErrorHandler(() => import('./pages/Shapes/ShapeLesson'));
const ColoursHome = lazyWithErrorHandler(() => import('./pages/Colours/ColoursHome'));
const ColourLesson = lazyWithErrorHandler(() => import('./pages/Colours/ColourLesson'));
const ComingSoon = lazyWithErrorHandler(() => import('./pages/ComingSoon/ComingSoon'));
const Profile = lazyWithErrorHandler(() => import('./pages/Profile/Profile'));
const Settings = lazyWithErrorHandler(() => import('./pages/Settings/Settings'));
const ParentZone = lazyWithErrorHandler(() => import('./pages/ParentZone/ParentZone'));
const TeacherDashboard = lazyWithErrorHandler(() => import('./pages/Teacher/TeacherDashboard'));

const WordBuilder = lazyWithErrorHandler(() => import('./pages/Reading/WordBuilderPage'));
const SightWords = lazyWithErrorHandler(() => import('./pages/Reading/SightWordsPage'));

const StoriesHome = lazyWithErrorHandler(() => import('./pages/Stories/StoriesHome'));
const StoryReader = lazyWithErrorHandler(() => import('./pages/Stories/StoryReaderPage'));

const AlphabetHome = lazyWithErrorHandler(() => import('./pages/Alphabet/AlphabetHome'));
const LessonPage = lazyWithErrorHandler(() => import('./pages/Alphabet/LessonPage'));
const TracingPage = lazyWithErrorHandler(() => import('./pages/Alphabet/TracingPage'));

const AlphabetGames = lazyWithErrorHandler(() => import('./pages/Games/AlphabetGames'));
const ShapesGames = lazyWithErrorHandler(() => import('./pages/Shapes/ShapesGames'));

const ShapeMatch = lazyWithErrorHandler(() => import('./pages/Shapes/games/ShapeMatch'));
const FindObject = lazyWithErrorHandler(() => import('./pages/Shapes/games/FindObject'));
const ColourPicker = lazyWithErrorHandler(() => import('./pages/Shapes/games/ColourPicker'));

const NumbersHome = lazyWithErrorHandler(() => import('./pages/Numbers/NumbersHome'));
const NumberLesson = lazyWithErrorHandler(() => import('./pages/Numbers/NumberLesson'));
const NumberTracing = lazyWithErrorHandler(() => import('./pages/Numbers/NumberTracing'));
const NumbersGames = lazyWithErrorHandler(() => import('./pages/Numbers/NumbersGames'));
const GameTemplate = lazyWithErrorHandler(() => import('./pages/Numbers/GameTemplate'));
const AnimalSafari = lazyWithErrorHandler(() => import('./pages/AnimalSafari/AnimalSafari'));
const MusicLibrary = lazyWithErrorHandler(() => import('./pages/Music/MusicLibrary'));
const SongPlayer = lazyWithErrorHandler(() => import('./pages/Music/SongPlayer'));
const KaraokePlayer = lazyWithErrorHandler(() => import('./pages/Music/KaraokePlayer'));
const MusicGames = lazyWithErrorHandler(() => import('./pages/Music/MusicGames'));
const RecordVoice = lazyWithErrorHandler(() => import('./pages/Music/RecordVoice'));
const Drawing = lazyWithErrorHandler(() => import('./pages/Drawing/Drawing'));
const NumberStories = lazyWithErrorHandler(() => import('./pages/Numbers/NumberStories'));
const NumberStoryReader = lazyWithErrorHandler(() => import('./pages/Numbers/NumberStoryReader'));
const NumbersMastery = lazyWithErrorHandler(() => import('./pages/Numbers/NumbersMastery'));
const MathsHome = lazyWithErrorHandler(() => import('./pages/Maths/MathsHome'));
const Addition = lazyWithErrorHandler(() => import('./pages/Maths/Addition'));
const Subtraction = lazyWithErrorHandler(() => import('./pages/Maths/Subtraction'));
const Counting = lazyWithErrorHandler(() => import('./pages/Maths/Counting'));
const CompareNumbers = lazyWithErrorHandler(() => import('./pages/Maths/CompareNumbers'));

// Auth Pages
const LoginPage = lazyWithErrorHandler(() => import('./pages/Auth/LoginPage'));
const RegisterPage = lazyWithErrorHandler(() => import('./pages/Auth/RegisterPage'));
const DeveloperLogin = lazyWithErrorHandler(() => import('./pages/Auth/DeveloperLogin'));
const DeveloperDashboard = lazyWithErrorHandler(() => import('./pages/Developer/DeveloperDashboard'));
const DataDebug = lazyWithErrorHandler(() => import('./components/DataDebug/DataDebug'));
const TestSupabase = lazyWithErrorHandler(() => import('./pages/Developer/TestSupabase'));

// Developer protected route helper
import { DeveloperService } from './services/DeveloperService';
const DeveloperProtectedRoute = ({ children }) => {
  const isDeveloperAuthenticated = DeveloperService.validateSession();
  return isDeveloperAuthenticated ? children : <Navigate to="/developer-login" replace />;
};

const AppContent = () => {
  const { isAuthenticated, loading } = useChildAccount();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <OfflineDetector />
      <InstallPrompt />
      <VoiceGuideProvider>
        <VoiceAssistant />
        <AIAssistant />
        <UpdatePreviewBanner />
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Hidden Developer Routes (not in navigation) */}
              <Route path="/developer-login" element={<DeveloperLogin />} />
              <Route 
                path="/developer" 
                element={
                  <DeveloperProtectedRoute>
                    <DeveloperDashboard />
                  </DeveloperProtectedRoute>
                } 
              />
              
              {isAuthenticated ? (
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="welcome" element={<Welcome />} />
                  <Route path="learn" element={<Learn />} />
                  <Route path="games" element={<Games />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="parent-zone" element={<ParentZone />} />
                  <Route path="teacher" element={<TeacherDashboard />} />
                  <Route path="alphabet" element={<AlphabetHome />} />
                  <Route path="alphabet/lesson/:letterId" element={<LessonPage />} />
                  <Route path="alphabet/trace/:letterId" element={<TracingPage />} />
                  <Route path="games/alphabet" element={<AlphabetGames />} />
                  <Route path="shapes" element={<ShapesHome />} />
                  <Route path="games/shapes" element={<ShapesGames />} />
                  <Route path="games/shapes/shape-match" element={<ShapeMatch />} />
                  <Route path="games/shapes/find-the-shape" element={<FindObject />} />
                  <Route path="games/shapes/colour-picker" element={<ColourPicker />} />
                  <Route path="games/shapes/shape-sorting" element={<ComingSoon />} />
                  <Route path="games/shapes/shape-memory" element={<ComingSoon />} />
                  <Route path="shapes/lesson/:shapeId" element={<ShapeLesson />} />
                  <Route path="animal-safari" element={<AnimalSafari />} />
                  <Route path="music" element={<MusicLibrary />} />
                  <Route path="music/:songId" element={<SongPlayer />} />
                  <Route path="music/karaoke/:songId" element={<KaraokePlayer />} />
                  <Route path="music/record/:songId" element={<RecordVoice />} />
                  <Route path="music/games" element={<MusicGames />} />
                  <Route path="drawing" element={<Drawing />} />
                  <Route path="reading/word-builder" element={<WordBuilder />} />
                  <Route path="reading/sight-words" element={<SightWords />} />
                  <Route path="stories" element={<StoriesHome />} />
                  <Route path="story/:storyId" element={<StoryReader />} />
                  <Route path="graduation" element={<GraduationPage />} />
                  <Route path="bible-time" element={<BibleTime />} />
                  <Route path="bible-time/:storyId" element={<BibleStoryReader />} />
                  <Route path="science-lab" element={<ScienceLab />} />
                  <Route path="science-lab/water-cycle" element={<WaterCycle />} />
                  <Route path="science-lab/parts-of-a-plant" element={<PartsOfAPlant />} />
                  <Route path="science-lab/solar-system" element={<SolarSystem />} />
                  <Route path="ghana-explorer" element={<GhanaExplorer />} />
                  <Route path="ghana-languages" element={<GhanaLanguages />} />
                  <Route path="numbers" element={<NumbersHome />} />
                  <Route path="numbers/lesson/:numberId" element={<NumberLesson />} />
                  <Route path="numbers/trace/:numberId" element={<NumberTracing />} />
                  <Route path="numbers/games" element={<NumbersGames />} />
                  <Route path="numbers/game/:gameId" element={<GameTemplate />} />
                  <Route path="numbers/stories" element={<NumberStories />} />
                  <Route path="numbers/story/:storyId" element={<NumberStoryReader />} />
                  <Route path="numbers/mastery" element={<NumbersMastery />} />
                  <Route path="colours" element={<ColoursHome />} />
                  <Route path="colours/lesson/:colorId" element={<ColourLesson />} />
                  <Route path="maths" element={<MathsHome />} />
                  <Route path="maths/addition" element={<Addition />} />
                  <Route path="maths/subtraction" element={<Subtraction />} />
                  <Route path="maths/counting" element={<Counting />} />
                  <Route path="maths/compare" element={<CompareNumbers />} />
<Route path="debug" element={<DataDebug />} />
                  <Route path="developer/test-supabase" element={<TestSupabase />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              ) : (
                <Route path="*" element={<LoginPage />} />
              )}
            </Routes>
          </Suspense>
        </AnimatePresence>
      </VoiceGuideProvider>
    </BrowserRouter>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <I18nProvider>
            <ChildAccountProvider>
              <ProfileProvider>
                <AppContent />
              </ProfileProvider>
            </ChildAccountProvider>
          </I18nProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;