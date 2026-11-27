import { useEffect, useState } from 'react';
import { FaRobot, FaSave } from 'react-icons/fa';
import { useChildAccount } from '../../context/ChildAccountContext';
import { CurriculumTutorService } from '../../services/CurriculumTutorService';
import { GhanaCurriculumService } from '../../services/GhanaCurriculumService';

const LEVELS = ['KG1', 'KG2', 'Basic1', 'Basic2'];

const CurriculumTutorSettings = () => {
  const { childId } = useChildAccount();
  const [draft, setDraft] = useState(() => CurriculumTutorService.getSettings(childId));
  const [saved, setSaved] = useState(false);
  const [questionLog, setQuestionLog] = useState(() => CurriculumTutorService.getQuestionLog(childId));
  const subjects = GhanaCurriculumService.getSubjects();

  useEffect(() => {
    const refresh = () => {
      setDraft(CurriculumTutorService.getSettings(childId));
      setQuestionLog(CurriculumTutorService.getQuestionLog(childId));
    };
    refresh();
    return CurriculumTutorService.subscribe(refresh);
  }, [childId]);

  const update = (patch) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  };

  const toggleSubject = (subject) => {
    const next = draft.subjects.includes(subject)
      ? draft.subjects.filter((item) => item !== subject)
      : [...draft.subjects, subject];
    update({ subjects: next });
  };

  const handleSave = () => {
    if (!childId) return;
    if (CurriculumTutorService.saveSettings(childId, draft)) setSaved(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-xl bg-purple-50 dark:bg-purple-900/30 p-4">
        <div>
          <p className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <FaRobot /> Curriculum tutor
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            The tutor is off until a parent enables it here. Gemini is a separate optional online
            feature and is off by default.
          </p>
        </div>
        <button
          type="button"
          onClick={() => update({ enabled: !draft.enabled })}
          aria-pressed={draft.enabled}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold ${
            draft.enabled ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
          }`}
        >
          {draft.enabled ? 'Enabled' : 'Off'}
        </button>
      </div>

      <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Allow online Gemini answers
          </span>
          <button
            type="button"
            onClick={() => update({ allowOnlineAI: !draft.allowOnlineAI })}
            disabled={!draft.enabled}
            aria-pressed={draft.allowOnlineAI}
            className="shrink-0 px-4 py-2 rounded-full text-sm font-bold disabled:opacity-40 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            {draft.allowOnlineAI ? 'Yes' : 'No'}
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
          When enabled and online, the child’s question and matching lesson are sent to Google.
          The child’s name and account details are not sent. Local answers remain available when
          Gemini is off or unavailable.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-200">Allow voice questions</span>
        <button
          type="button"
          onClick={() => update({ allowVoice: !draft.allowVoice })}
          disabled={!draft.enabled}
          aria-pressed={draft.allowVoice}
          className="px-4 py-2 rounded-full text-sm font-bold disabled:opacity-40 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
        >
          {draft.allowVoice ? 'Yes' : 'No'}
        </button>
      </div>

      <div>
        <label htmlFor="tutor-level" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Curriculum level
        </label>
        <select
          id="tutor-level"
          value={draft.level}
          onChange={(event) => update({ level: event.target.value })}
          className="w-full p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
        >
          {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
        </select>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Subjects the tutor may use (none selected = all)
        </p>
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <button
              key={subject}
              type="button"
              onClick={() => toggleSubject(subject)}
              aria-pressed={draft.subjects.includes(subject)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                draft.subjects.includes(subject)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              {subject.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
      Topics your child asked about
    </p>
    <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
      Only topic counts are stored, not the full question text.
    </p>
    {questionLog.length === 0 ? (
      <p className="text-xs text-gray-500 dark:text-gray-400">No tutor questions yet.</p>
    ) : (
      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
        {questionLog.slice(0, 8).map((item) => (
          <li key={item.topic} className="flex justify-between gap-3">
            <span className="truncate">{item.topic.replace(/_/g, ' ')}</span>
            <span className="text-gray-500 dark:text-gray-400">{item.count}</span>
          </li>
        ))}
      </ul>
    )}
    {questionLog.length > 0 && (
      <button
        type="button"
        onClick={() => {
          CurriculumTutorService.clearQuestionLog(childId);
          setQuestionLog([]);
        }}
        className="mt-3 text-xs text-red-600 dark:text-red-400 hover:underline"
      >
        Clear question log
      </button>
    )}
  </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-purple-700"
      >
        <FaSave /> Save tutor settings
      </button>
      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400 text-center" role="status">
          Saved. Your child can now use the assistant.
        </p>
      )}
    </div>
  );
};

export default CurriculumTutorSettings;
