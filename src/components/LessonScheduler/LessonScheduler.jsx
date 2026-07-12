import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPlus, FaCheckCircle, FaTrash } from 'react-icons/fa';
import { LessonScheduler } from '../../services/LessonScheduler';
import { ChildAccountService } from '../../services/ChildAccountService';

const LessonSchedulerComponent = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekSchedule, setWeekSchedule] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLesson, setNewLesson] = useState({ date: '', subject: '', type: 'lesson', duration: 30 });
  const childId = ChildAccountService.getActiveChildId();

  useEffect(() => {
    if (childId) {
      loadWeekSchedule(currentDate);
    }
  }, [childId, currentDate]);

  const loadWeekSchedule = (date) => {
    const startOfWeek = getStartOfWeek(date);
    const schedule = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      schedule.push({
        date: day,
        dateStr,
        lessons: LessonScheduler.getScheduleForDate(childId, dateStr)
      });
    }
    setWeekSchedule(schedule);
  };

  const getStartOfWeek = (date) => {
    const day = new Date(date);
    const dayOfWeek = day.getDay(); // Sunday - Saturday : 0 - 6
    const diff = day.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    return new Date(day.setDate(diff));
  };

  const handlePrevWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  };

  const handleAddLesson = () => {
    if (newLesson.date && newLesson.subject && newLesson.duration) {
      LessonScheduler.addLesson(childId, newLesson.date, { ...newLesson, id: Date.now() });
      loadWeekSchedule(currentDate);
      setShowAddModal(false);
      setNewLesson({ date: '', subject: '', type: 'lesson', duration: 30 });
    }
  };

  const handleCompleteLesson = (dateStr, lessonId) => {
    LessonScheduler.completeLesson(childId, dateStr, lessonId);
    loadWeekSchedule(currentDate);
  };

  const handleRemoveLesson = (dateStr, lessonId) => {
    if (window.confirm('Are you sure you want to remove this lesson?')) {
      LessonScheduler.removeLesson(childId, dateStr, lessonId);
      loadWeekSchedule(currentDate);
    }
  };

  const getDayName = (date) => {
    if (!date) return '--';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getFormattedDate = (date) => {
    if (!date) return '--';
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

  const getSubjects = () => LessonScheduler.getAvailableSubjects();
  const getLessonTypes = () => LessonScheduler.getLessonTypes();

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft text-gray-800 dark:text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-baloo text-2xl font-bold">
          Learning Schedule <FaCalendarAlt className="inline-block ml-2 text-purple-500" />
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2 text-white text-sm"
        >
          <FaPlus /> Add Lesson
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handlePrevWeek}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <FaChevronLeft />
        </motion.button>
        <h3 className="font-bold text-lg">
          {getFormattedDate(weekSchedule[0]?.date)} - {getFormattedDate(weekSchedule[6]?.date)}
        </h3>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleNextWeek}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <FaChevronRight />
        </motion.button>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-2 overflow-x-auto">
        {weekSchedule.map(day => (
          <motion.div
            key={day.dateStr}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-3 rounded-lg flex-shrink-0 w-36 md:w-auto ${
              day.dateStr === new Date().toISOString().split('T')[0] ? 'bg-purple-100 dark:bg-purple-900/40 border border-purple-400' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <p className="font-bold text-center text-sm mb-2">
              {getDayName(day.date)} {getFormattedDate(day.date)}
            </p>
            <div className="space-y-2">
              {day.lessons.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">No lessons</p>
              ) : (
                day.lessons.map(lesson => (
                  <div key={lesson.id} className={`p-2 rounded-md ${lesson.completed ? 'bg-green-200 dark:bg-green-800' : 'bg-white dark:bg-gray-600'} shadow-sm`}>
                    <p className="text-sm font-medium line-clamp-1">{lesson.subject} - {lesson.type}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">{lesson.duration} min</p>
                    <div className="flex justify-between items-center mt-1">
                      {!lesson.completed ? (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCompleteLesson(day.dateStr, lesson.id)}
                          className="text-green-600 hover:text-green-500 text-sm flex items-center gap-1"
                        >
                          <FaCheckCircle /> Done
                        </motion.button>
                      ) : (
                        <span className="text-green-600 text-sm flex items-center gap-1">
                          <FaCheckCircle /> Completed
                        </span>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveLesson(day.dateStr, lesson.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        <FaTrash />
                      </motion.button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Lesson Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg"
            >
              <h3 className="text-xl font-bold mb-4">Add New Lesson</h3>
              <div className="space-y-3">
                <input
                  type="date"
                  value={newLesson.date}
                  onChange={(e) => setNewLesson({ ...newLesson, date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                />
                <select
                  value={newLesson.subject}
                  onChange={(e) => setNewLesson({ ...newLesson, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  <option value="">Select Subject</option>
                  {getSubjects().map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
                <select
                  value={newLesson.type}
                  onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  {getLessonTypes().map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={newLesson.duration}
                  onChange={(e) => setNewLesson({ ...newLesson, duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="flex gap-3 mt-5">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddLesson}
                  className="flex-1 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 text-white font-medium"
                >
                  Add Lesson
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LessonSchedulerComponent;