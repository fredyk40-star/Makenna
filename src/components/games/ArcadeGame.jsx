import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaRedo, FaStar, FaVolumeUp } from 'react-icons/fa';
import { useAudio } from '../../hooks/useAudio';
import { useAdaptiveInput } from '../../hooks/useAdaptiveInput';
import { announceToScreenReader } from '../../utils/accessibility';
import gameProgressService from '../../services/GameProgressService';
import { resultFor } from '../../utils/gameScoring';
import CoOpGame from './CoOpGame';

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const AnswerButton = ({ option, onClick, selected, isCorrect, variant = '' }) => {
  let stateClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary';
  if (selected && isCorrect) stateClass = 'bg-green-100 dark:bg-green-900/40 border-green-500';
  if (selected && !isCorrect) stateClass = 'bg-red-100 dark:bg-red-900/40 border-red-500';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={option.label}
      className={`flex flex-col items-center justify-center gap-2 p-4 min-h-[96px] border-2 rounded-2xl shadow-soft transition-all duration-200 hover:scale-105 ${stateClass} ${variant}`}
    >
      <span className="text-4xl leading-none">{option.visual || option.label}</span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{option.label}</span>
    </button>
  );
};

const ChoiceGame = ({ data, onFinish }) => {
  const { speak } = useAudio();
  const timerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const round = data.rounds[index];

  useEffect(() => {
    if (round?.speak) speak(round.speak);
    return () => clearTimeout(timerRef.current);
  }, [round, speak]);

  const handleSelect = (option) => {
    if (selected !== null) return;
    const isCorrect = option.id === round.answerId;
    setSelected(option.id);

    if (isCorrect) {
      const nextCorrect = correctCount + 1;
      setCorrectCount(nextCorrect);
      speak('Correct! Great job!');
      announceToScreenReader('Correct!');
      timerRef.current = setTimeout(() => {
        if (index + 1 >= data.rounds.length) {
          onFinish(resultFor(nextCorrect, data.rounds.length, incorrectCount));
        } else {
          setIndex(index + 1);
          setSelected(null);
        }
      }, 700);
    } else {
      setIncorrectCount(incorrectCount + 1);
      speak('Try again!');
      announceToScreenReader('Try again!');
      timerRef.current = setTimeout(() => setSelected(null), 700);
    }
  };

  const variantClass = data.variant === 'bubble'
    ? 'rounded-full aspect-square min-h-[100px] bg-gradient-to-br from-sky-300 to-blue-500 text-white border-white/40'
    : data.variant === 'shadow'
      ? 'shadow-inner'
      : '';

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800 dark:text-white">{round.prompt}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Round {index + 1} of {data.rounds.length}
        </p>
      </div>
      <div className="flex justify-center gap-1 text-primary" aria-hidden="true">
        <FaVolumeUp />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {round.options.map((option) => (
          <AnswerButton
            key={option.id}
            option={option}
            onClick={() => handleSelect(option)}
            selected={selected}
            isCorrect={option.id === round.answerId}
            variant={variantClass}
          />
        ))}
      </div>
    </div>
  );
};

const MemoryGame = ({ data, onFinish }) => {
  const { speak } = useAudio();
  const timerRef = useRef(null);
  const cards = useMemo(() => shuffle(data.pairs.flatMap((pair) => [
    { key: `${pair.id}-a`, matchKey: pair.id, label: pair.label, visual: pair.visual },
    { key: `${pair.id}-b`, matchKey: pair.id, label: pair.label, visual: pair.visual },
  ])), [data.pairs]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleFlip = (card) => {
    if (flipped.length === 2 || flipped.includes(card.key) || matched.includes(card.matchKey)) return;
    const next = [...flipped, card.key];
    setFlipped(next);

    if (next.length === 2) {
      const [first, second] = next.map((key) => cards.find((item) => item.key === key));
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (first.matchKey === second.matchKey) {
        const nextMatched = [...matched, first.matchKey];
        setMatched(nextMatched);
        setFlipped([]);
        speak('Matching pair!');
        if (nextMatched.length === data.pairs.length) {
          const score = Math.max(20, Math.round((data.pairs.length / nextAttempts) * 100));
          onFinish(resultFor(Math.round(score / 100 * data.pairs.length), data.pairs.length, nextAttempts - data.pairs.length));
        }
      } else {
        speak('Not a match, try again!');
        timerRef.current = setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-gray-600 dark:text-gray-300">{data.instruction}</p>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Pairs: {matched.length}/{data.pairs.length} · Attempts: {attempts}
      </p>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.key) || matched.includes(card.matchKey);
          return (
            <button
              type="button"
              key={card.key}
              onClick={() => handleFlip(card)}
              aria-label={isFlipped ? card.label : 'Hidden card'}
              className={`flex items-center justify-center min-h-[80px] rounded-2xl border-2 text-3xl shadow-soft transition-all duration-200 ${
                isFlipped
                  ? 'bg-white dark:bg-gray-700 border-primary'
                  : 'bg-gradient-to-br from-purple-400 to-pink-400 border-white/40 text-white hover:scale-105'
              }`}
            >
              {isFlipped ? card.visual : '❓'}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SequenceGame = ({ data, onFinish }) => {
  const { speak } = useAudio();
  const [position, setPosition] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  const handleTap = (item) => {
    if (item.id === data.items[position].id) {
      const nextPosition = position + 1;
      speak('Good!');
      if (nextPosition >= data.items.length) {
        onFinish(resultFor(data.items.length, data.items.length, incorrectCount));
      } else {
        setPosition(nextPosition);
      }
    } else {
      setIncorrectCount(incorrectCount + 1);
      setPosition(0);
      speak('Oops, start again!');
      announceToScreenReader('Wrong order. Start again.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800 dark:text-white">{data.instruction}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {position}/{data.items.length} in order
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {data.items.map((item, itemIndex) => (
          <button
            type="button"
            key={item.id}
            onClick={() => handleTap(item)}
            aria-label={`Step ${itemIndex + 1}: ${item.label}`}
            className={`min-w-[64px] min-h-[64px] rounded-2xl border-2 text-2xl font-bold shadow-soft transition-all hover:scale-105 ${
              itemIndex < position
                ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-700 dark:text-green-300'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const SortGame = ({ data, onFinish }) => {
  const { speak } = useAudio();
  const [activeItem, setActiveItem] = useState(null);
  const [placed, setPlaced] = useState({});
  const [incorrectCount, setIncorrectCount] = useState(0);
  const placedCount = Object.keys(placed).length;

  const handleBin = (bin) => {
    if (!activeItem) return;
    const item = data.items.find((entry) => entry.id === activeItem);
    if (item.binId === bin.id) {
      const nextPlaced = { ...placed, [item.id]: bin.id };
      setPlaced(nextPlaced);
      setActiveItem(null);
      speak('Correct!');
      if (Object.keys(nextPlaced).length === data.items.length) {
        onFinish(resultFor(data.items.length, data.items.length, incorrectCount));
      }
    } else {
      setIncorrectCount(incorrectCount + 1);
      setActiveItem(null);
      speak('Try another bin!');
      announceToScreenReader('Not quite. Try another bin.');
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-center text-gray-600 dark:text-gray-300">{data.instruction}</p>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Sorted: {placedCount}/{data.items.length}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {data.items.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setActiveItem(item.id)}
            aria-pressed={activeItem === item.id}
            className={`min-w-[64px] min-h-[64px] rounded-2xl border-2 text-xl font-bold transition-all hover:scale-105 ${
              placed[item.id]
                ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-700 dark:text-green-300 opacity-70'
                : activeItem === item.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {data.bins.map((bin) => (
          <button
            type="button"
            key={bin.id}
            onClick={() => handleBin(bin)}
            disabled={!activeItem}
            className="px-6 py-3 rounded-2xl bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 text-blue-800 dark:text-blue-200 font-semibold disabled:opacity-50"
          >
            {bin.visual} {bin.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const BingoGame = ({ data, onFinish }) => {
  const { speak } = useAudio();
  const [callIndex, setCallIndex] = useState(0);
  const [marked, setMarked] = useState([]);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const call = data.calls[callIndex];

  useEffect(() => {
    if (call) speak(`Find letter ${call}`);
  }, [call, speak]);

  const handleSquare = (letter) => {
    if (letter !== call) {
      setIncorrectCount(incorrectCount + 1);
      speak('Try again!');
      return;
    }
    const nextMarked = [...marked, letter];
    setMarked(nextMarked);
    speak('Bingo!');
    if (nextMarked.length >= data.calls.length) {
      onFinish(resultFor(data.calls.length, data.calls.length, incorrectCount));
    } else {
      setCallIndex(callIndex + 1);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800 dark:text-white">
          Find the letter <span className="text-primary">{call}</span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {data.instruction} · {marked.length}/{data.calls.length}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        {data.card.map((letter) => (
          <button
            type="button"
            key={letter}
            onClick={() => handleSquare(letter)}
            aria-label={`Letter ${letter}`}
            className={`min-h-[72px] rounded-2xl border-2 text-3xl font-bold shadow-soft transition-all hover:scale-105 ${
              marked.includes(letter)
                ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-700 dark:text-green-300'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
};

const HuntGame = ({ data, onFinish }) => {
  const { speak } = useAudio();
  const [found, setFound] = useState([]);
  const [incorrectCount, setIncorrectCount] = useState(0);

  useEffect(() => {
    if (data.speak) speak(data.speak);
  }, [data.speak, speak]);

  const handlePick = (item) => {
    if (found.includes(item.id)) return;
    if (data.targets.includes(item.id)) {
      const nextFound = [...found, item.id];
      setFound(nextFound);
      speak('Found one!');
      if (nextFound.length === data.targets.length) {
        onFinish(resultFor(data.targets.length, data.targets.length, incorrectCount));
      }
    } else {
      setIncorrectCount(incorrectCount + 1);
      speak('Not this one!');
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800 dark:text-white">{data.instruction}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Found: {found.length}/{data.targets.length}
        </p>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {data.grid.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => handlePick(item)}
            aria-label={item.id}
            className={`min-h-[64px] rounded-2xl border-2 text-2xl font-bold shadow-soft transition-all hover:scale-105 ${
              found.includes(item.id)
                ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-700 dark:text-green-300'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {found.length === data.targets.length && (
        <p className="text-center text-5xl animate-bounce" aria-hidden="true">🎉</p>
      )}
    </div>
  );
};

const MECHANICS = {
  choice: ChoiceGame,
  memory: MemoryGame,
  sequence: SequenceGame,
  sort: SortGame,
  bingo: BingoGame,
  hunt: HuntGame,
  coop: CoOpGame,
};

const ArcadeGame = ({ game }) => {
  const [session, setSession] = useState(0);
  const [result, setResult] = useState(null);
  const gameAreaRef = useRef(null);
  const Mechanic = MECHANICS[game.mechanic] || ChoiceGame;

  useAdaptiveInput(gameAreaRef);

  const handleFinish = useCallback((outcome) => {
    setResult(outcome);
    gameProgressService.recordProgress(game.id, {
      score: outcome.score,
      stars: outcome.stars,
      time: 0,
      completed: true,
      gameId: game.id,
    });
    announceToScreenReader(`Game complete! You scored ${outcome.score} percent`);
  }, [game.id]);

  const restart = useCallback(() => {
    setResult(null);
    setSession((value) => value + 1);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 pb-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={game.backPath}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={`Back to ${game.backPath}`}
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="font-baloo text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              {game.icon} {game.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{game.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={restart}
          className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Restart game"
        >
          <FaRedo className="text-xl" />
        </button>
      </div>

      <div
        ref={gameAreaRef}
        role="group"
        aria-label={`${game.title} answers. Use arrow keys to move and Enter to choose.`}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-4 md:p-6 min-h-[360px]"
      >
        <Mechanic key={session} data={game.data} onFinish={handleFinish} />
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md w-full mx-4 bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-soft"
            >
              <div className="text-7xl mb-4 animate-bounce" aria-hidden="true">🎉</div>
              <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">Great Job!</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {game.mechanic === 'coop' ? 'Together you scored' : 'You scored'} {result.score}% on {game.title}!
              </p>
              <div className="flex justify-center gap-1 mt-3" aria-label={`${result.stars} stars`}>
                {[...Array(5)].map((_, index) => (
                  <FaStar
                    key={index}
                    className={`text-2xl ${index < result.stars ? 'text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <div className="flex gap-3 mt-6 justify-center">
                <Link
                  to={game.backPath}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium"
                >
                  Back to Games
                </Link>
                <button
                  type="button"
                  onClick={restart}
                  className="px-4 py-2 btn-primary"
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ArcadeGame;
