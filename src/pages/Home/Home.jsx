import Hero from './components/Hero';
import NavigationCards from './components/NavigationCards';
import DailyQuote from './components/DailyQuote';
import DailyChallenge from './components/DailyChallenge';
import ProgressSection from './components/ProgressSection';
import ContinueLearning from './components/ContinueLearning';
import ParentSection from './components/ParentSection';
import MemoizedCard from '../../components/common/MemoizedCard';

const Home = () => {
  return (
    <div className="space-y-6 md:space-y-8 pb-4">
      <Hero />
      <MemoizedCard>
        <DailyQuote />
      </MemoizedCard>
      <MemoizedCard>
        <DailyChallenge />
      </MemoizedCard>
      <MemoizedCard>
        <ProgressSection />
      </MemoizedCard>
      <NavigationCards />
      <MemoizedCard>
        <ContinueLearning />
      </MemoizedCard>
      <MemoizedCard>
        <ParentSection />
      </MemoizedCard>
    </div>
  );
};

export default Home;
