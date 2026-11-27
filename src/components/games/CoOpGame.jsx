import { useEffect, useRef, useState } from 'react';
import { FaUsers } from 'react-icons/fa';
import { useAudio } from '../../hooks/useAudio';
import { announceToScreenReader } from '../../utils/accessibility';
import { resultFor } from '../../utils/gameScoring';

/**
 * Local two-player co-op quiz. Players alternate turns and share one team
 * score; both must answer rounds correctly to finish the quest.
 */
const CoOpGame = ({ data, onFinish }) => {
  const { speak } = useAudio();
  const timerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [player, setPlayer] = useState(0);
  const [selected, setSelected] = useState(null);
  const [scores, setScores] = useState([0, 0]);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const round = data.rounds[index];
  const totalCorrect = scores[0] + scores[1];

  useEffect(() => {
    if (round?.speak) speak(round.speak);
    return () => clearTimeout(timerRef.current);
  }, [round, speak]);

  const handleSelect = (option) => {
    if (selected !== null || !round) return;
    setSelected(option.id);

    if (option.id !== round.answerId) {
      setIncorrectCount((count) => count + 1);
      speak('Try again!');
      announceToScreenReader('Not quite. Try again.');
      timerRef.current = setTimeout(() => setSelected(null), 700);
      return;
    }

    const nextScores = [...scores];
    nextScores[player] += 1;
    setScores(nextScores);
    speak(`Player ${player + 1}, correct!`);
    announceToScreenReader(`Player ${player + 1} got it right.`);

    timerRef.current = setTimeout(() => {
      if (index + 1 >= data.rounds.length) {
        onFinish({
          ...resultFor(totalCorrect + 1, data.rounds.length, incorrectCount),
          playerScores: nextScores,
        });
      } else {
        setIndex(index + 1);
        setPlayer(player === 0 ? 1 : 0);
        setSelected(null);
      }
    }, 700);
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800 dark:text-white flex items-center justify-center gap-2">
          <FaUsers /> {data.instruction}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Round {index + 1} of {data.rounds.length} · Team points {totalCorrect}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {[0, 1].map((playerIndex) => (
          <div
            key={playerIndex}
            className={`rounded-2xl border-2 p-3 text-center transition-colors ${
              player === playerIndex
                ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500'
                : 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700'
            }`}
          >
            <p className="text-sm font-bold text-gray-800 dark:text-white">Player {playerIndex + 1}</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">{scores[playerIndex]}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {player === playerIndex ? 'Your turn' : 'Waiting'}
            </p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="font-baloo text-xl font-bold text-gray-800 dark:text-white">{round.prompt}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Player {player + 1}, choose an answer
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
        {round.options.map((option) => {
          const isCorrect = option.id === round.answerId;
          const highlight = selected === option.id
            ? isCorrect
              ? 'bg-green-100 dark:bg-green-900/40 border-green-500'
              : 'bg-red-100 dark:bg-red-900/40 border-red-500'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-500';

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option)}
              aria-label={option.label}
              className={`flex items-center gap-3 p-3 min-h-[72px] rounded-2xl border-2 shadow-soft transition-transform hover:scale-105 ${highlight}`}
            >
              <span className="text-3xl" aria-hidden="true">{option.visual || '⭐'}</span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{option.label}</span>
            </button>
          );
        })}
      </div>

      {round.hint && (
        <details className="max-w-2xl mx-auto rounded-xl bg-gray-50 dark:bg-gray-900/40 p-3 text-sm">
          <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-200">
            Need a hint?
          </summary>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{round.hint}</p>
        </details>
      )}
    </div>
  );
};

export default CoOpGame;
