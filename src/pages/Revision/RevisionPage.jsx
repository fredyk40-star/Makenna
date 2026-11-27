import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaBookOpen, FaClock, FaCog, FaSyncAlt, FaTrophy } from 'react-icons/fa';
import { useChildAccount } from '../../context/ChildAccountContext';
import { RevisionPlannerService } from '../../services/RevisionPlannerService';
import { buildRevisionCards } from '../../data/revisionCards';

const GRADES = [
  { grade: 1, label: 'Again', className: 'bg-red-500 hover:bg-red-600', note: 'Tomorrow' },
  { grade: 3, label: 'Hard', className: 'bg-amber-500 hover:bg-amber-600', note: 'Short break' },
  { grade: 4, label: 'Good', className: 'bg-blue-500 hover:bg-blue-600', note: 'A few days' },
  { grade: 5, label: 'Easy', className: 'bg-green-500 hover:bg-green-600', note: 'Longer break' },
];

const RevisionPage = () => {
  const { childId } = useChildAccount();
  const [cards, setCards] = useState([]);
  const [plan, setPlan] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [minutes, setMinutes] = useState(10);
  const [result, setResult] = useState('');

  useEffect(() => {
    if (childId) RevisionPlannerService.seed(childId, buildRevisionCards());
  }, [childId]);

  useEffect(() => {
    const refresh = () => {
      const nextPlan = RevisionPlannerService.buildPlan(childId, { minutes });
      setCards(RevisionPlannerService.list(childId));
      setPlan(nextPlan);
      setActiveId((current) => (
        nextPlan.some((card) => card.id === current) ? current : nextPlan[0]?.id || null
      ));
    };
    refresh();
    return RevisionPlannerService.subscribe(refresh);
  }, [childId, minutes]);

  const activeCard = plan.find((card) => card.id === activeId) || plan[0] || null;
  const summary = RevisionPlannerService.getSummary(childId);

  const handleReview = useCallback((grade) => {
    if (!childId || !activeCard) return;
    const updated = RevisionPlannerService.review(childId, activeCard.id, grade);
    if (!updated) return;
    setResult(`Nice work! We will see this again in ${updated.intervalDays} day${updated.intervalDays === 1 ? '' : 's'}.`);
    const remaining = RevisionPlannerService.buildPlan(childId, { minutes });
    setActiveId(remaining[0]?.id || null);
  }, [childId, activeCard, minutes]);

  const handleSnooze = () => {
    if (!activeCard) return;
    RevisionPlannerService.snooze(childId, activeCard.id, 1);
    setResult(`Saved "${activeCard.topic}" for tomorrow.`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Back to profile">
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="font-baloo text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FaSyncAlt /> Revision Planner
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Short practice sessions that come back at just the right time.
            </p>
          </div>
        </div>
        <Link to="/settings" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold shadow-soft">
          <FaCog /> Parent settings
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={<FaBookOpen />} label="Cards" value={summary.total} color="bg-blue-100 dark:bg-blue-900/40 text-blue-600" />
        <Stat icon={<FaClock />} label="Due today" value={summary.due} color="bg-amber-100 dark:bg-amber-900/40 text-amber-600" />
        <Stat icon={<FaSyncAlt />} label="Coming up" value={summary.upcoming} color="bg-purple-100 dark:bg-purple-900/40 text-purple-600" />
        <Stat icon={<FaTrophy />} label="Mastered" value={summary.mastered} color="bg-green-100 dark:bg-green-900/40 text-green-600" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft flex flex-wrap items-center gap-3">
        <label htmlFor="revision-minutes" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Minutes today
        </label>
        <input
          id="revision-minutes"
          type="range"
          min="5"
          max="20"
          step="5"
          value={minutes}
          onChange={(event) => setMinutes(Number(event.target.value))}
          className="flex-1 min-w-32"
        />
        <span className="font-bold text-gray-800 dark:text-white">{minutes} min</span>
      </div>

      {activeCard ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                Card {plan.indexOf(activeCard) + 1} of {plan.length}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {activeCard.subject.replace(/_/g, ' ')} • {activeCard.level || 'all levels'}
              </span>
            </div>
            <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white mt-4">
              {activeCard.topic}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{activeCard.prompt}</p>

            <details className="mt-5 rounded-xl bg-gray-50 dark:bg-gray-900/50 p-4">
              <summary className="cursor-pointer font-semibold text-gray-800 dark:text-white">
                Show answer
              </summary>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{activeCard.answer || 'Practise this activity to remember it.'}</p>
              {activeCard.path && (
                <Link to={activeCard.path} className="inline-block mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Open the lesson →
                </Link>
              )}
            </details>

            {result && (
              <p className="mt-4 rounded-xl bg-green-50 dark:bg-green-900/30 p-3 text-sm text-green-700 dark:text-green-200" role="status">
                {result}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
              {GRADES.map(({ grade, label, className, note }) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => handleReview(grade, note)}
                  className={`rounded-xl py-3 text-white font-semibold ${className}`}
                >
                  {label}
                  <span className="block text-xs font-normal opacity-90">{note}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSnooze}
              className="mt-3 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Not now — remind me tomorrow
            </button>
          </section>

          <aside className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft">
            <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white mb-3">
              Today&apos;s queue
            </h3>
            {plan.length > 0 ? (
              <ol className="space-y-2 max-h-96 overflow-y-auto">
                {plan.map((card) => (
                  <li key={card.id}>
                    <button
                      type="button"
                      onClick={() => { setActiveId(card.id); setResult(''); }}
                      className={`w-full text-left rounded-xl px-3 py-2 text-sm ${
                        card.id === activeCard.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      <span className="font-semibold">{card.order}. {card.topic}</span>
                      <span className="block text-xs opacity-80">{card.subject.replace(/_/g, ' ')}</span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All caught up! New cards will appear as you learn more lessons.
              </p>
            )}
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              {cards.length} curriculum cards are saved for this child.
            </p>
          </aside>
        </div>
      ) : (
        <div className="text-center py-14 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">Nothing due right now</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Your next revision cards will appear here when they are ready.
          </p>
        </div>
      )}
    </motion.div>
  );
};

const Stat = ({ icon, label, value, color }) => (
  <div className={`rounded-2xl p-4 ${color}`}>
    <div className="text-xl">{icon}</div>
    <p className="text-2xl font-bold mt-1">{value}</p>
    <p className="text-xs font-semibold opacity-80">{label}</p>
  </div>
);

export default RevisionPage;
