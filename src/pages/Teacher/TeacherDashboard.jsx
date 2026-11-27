import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TeacherService } from '../../services/TeacherService';
import { ChildAccountService } from '../../services/ChildAccountService';
import ClassroomService, { LEVELS, SUBJECT_LABELS } from '../../services/ClassroomService';
import { GhanaCurriculumService } from '../../services/GhanaCurriculumService';
import {
  FaChalkboard, FaUsers, FaClipboardList, FaPlus, FaEdit, FaGraduationCap, FaCog,
  FaChartLine, FaPrint, FaCertificate, FaFileAlt, FaUserPlus, FaTrash,
} from 'react-icons/fa';
import TeacherMode from '../../components/TeacherMode/TeacherMode';
import ContentEditor from '../../components/ContentEditor/ContentEditor';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('classes');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [studentToAdd, setStudentToAdd] = useState('');
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', description: '' });
  const [newAssignment, setNewAssignment] = useState({
    title: '', description: '', dueDate: '', classId: '', templateId: '',
  });
  const [resourceConfig, setResourceConfig] = useState({ subject: 'mathematics', level: 'KG1' });
  const [lessonPlan, setLessonPlan] = useState(null);
  const [worksheet, setWorksheet] = useState(null);
  const [certificates, setCertificates] = useState(null);
  const [printKind, setPrintKind] = useState(null);
  const [printRequest, setPrintRequest] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);
  const [roster, setRoster] = useState([]);
  const [classProgress, setClassProgress] = useState(null);
  const [assignmentProgress, setAssignmentProgress] = useState(null);
  const [allStudents, setAllStudents] = useState([]);

  const loadData = useCallback(() => {
    const classList = TeacherService.getClasses();
    setClasses(classList);
    setAssignments(TeacherService.getAllAssignments());
    setStudentAccounts(ChildAccountService.getAllAccounts());
    setDataVersion(value => value + 1);
    setSelectedClassId(current => {
      if (current && classList.some(item => item.id === current)) return current;
      return classList[0]?.id || null;
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!printKind || printRequest === 0) return undefined;
    const timer = window.setTimeout(() => window.print(), 80);
    return () => window.clearTimeout(timer);
  }, [printKind, printRequest]);

  const selectedClass = classes.find(item => item.id === selectedClassId) || null;
  const classId = selectedClass?.id;

  useEffect(() => {
    if (!classId) {
      setRoster([]);
      setClassProgress(null);
      setAssignmentProgress(null);
      return;
    }
    setRoster(ClassroomService.getRoster(classId));
    setClassProgress(ClassroomService.getClassProgress(classId));
    setAssignmentProgress(ClassroomService.getAssignmentProgress(classId));
  }, [classId, dataVersion]);

  useEffect(() => {
    setAllStudents(ClassroomService.getAllStudentSummaries());
  }, [dataVersion]);

  const curriculumUnits = useMemo(
    () => GhanaCurriculumService.getSubjects().flatMap(subject => (
      GhanaCurriculumService.getSubjectContent(subject).map(item => ({ ...item, subject }))
    )),
    [],
  );
  const availableStudents = studentAccounts.filter(account => (
    !selectedClass?.studentIds?.includes(account.childId)
  ));

  const handleCreateClass = () => {
    if (!newClass.name.trim()) return;
    TeacherService.createClass({
      name: newClass.name.trim(),
      description: newClass.description.trim(),
    });
    setNewClass({ name: '', description: '' });
    setShowCreateClass(false);
    loadData();
  };

  const handleTemplateChange = (value) => {
    const template = curriculumUnits.find(item => item.id === value);
    setNewAssignment(previous => ({
      ...previous,
      templateId: value,
      title: previous.title || template?.title || '',
      description: previous.description || template?.content || '',
    }));
  };

  const handleCreateAssignment = () => {
    if (!newAssignment.title.trim() || !newAssignment.classId) return;
    const template = curriculumUnits.find(item => item.id === newAssignment.templateId);
    TeacherService.createAssignment({
      ...newAssignment,
      title: newAssignment.title.trim(),
      description: newAssignment.description.trim(),
      subject: template?.subject || '',
      curriculumId: template?.id || '',
      path: template ? ClassroomService.getActivityPath(template.lesson) : '',
    });
    setNewAssignment({ title: '', description: '', dueDate: '', classId: '', templateId: '' });
    setShowCreateAssignment(false);
    loadData();
  };

  const handleAddStudent = () => {
    if (!classId || !studentToAdd) return;
    TeacherService.addStudentToClass(classId, studentToAdd);
    setStudentToAdd('');
    loadData();
  };

  const handleRemoveStudent = (childId) => {
    if (!classId) return;
    TeacherService.removeStudentFromClass(classId, childId);
    loadData();
  };

  const handleGenerate = (kind) => {
    if (!classId) return;
    if (kind === 'plan') setLessonPlan(ClassroomService.getLessonPlan(classId, resourceConfig.subject, resourceConfig.level));
    if (kind === 'worksheet') setWorksheet(ClassroomService.getWorksheet(classId, resourceConfig.subject, resourceConfig.level));
    if (kind === 'certificates') setCertificates(ClassroomService.getCertificates(classId));
  };

  const handlePrint = (kind) => {
    setPrintKind(kind);
    setPrintRequest(value => value + 1);
  };

  const tabs = [
    { id: 'classes', label: 'Classes', icon: FaChalkboard },
    { id: 'assignments', label: 'Assignments', icon: FaClipboardList },
    { id: 'students', label: 'Students', icon: FaUsers },
    { id: 'progress', label: 'Class Progress', icon: FaChartLine },
    { id: 'resources', label: 'Plans & Prints', icon: FaFileAlt },
    { id: 'teacherMode', label: 'Teacher Mode', icon: FaCog },
    { id: 'content', label: 'Content Editor', icon: FaEdit },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <FaGraduationCap /> Teacher Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Classes, assignments and real learning evidence in one place
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'classes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Classes</h2>
              <button
                type="button"
                onClick={() => setShowCreateClass(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <FaPlus /> Create Class
              </button>
            </div>

            {classes.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">
                No classes yet. Create one, then link child accounts to its roster.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map(cls => (
                <motion.div
                  key={cls.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg cursor-pointer border-2 ${
                    cls.id === classId ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">{cls.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cls.description}</p>
                  <div className="flex items-center gap-2 mt-3 text-blue-600">
                    <FaUsers />
                    <span>{cls.studentIds?.length || 0} students</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {selectedClass && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      {selectedClass.name} roster
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Link existing child accounts; progress shown here is live.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      aria-label="Choose a child to add"
                      value={studentToAdd}
                      onChange={event => setStudentToAdd(event.target.value)}
                      className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="">Select child</option>
                      {availableStudents.map(account => (
                        <option key={account.childId} value={account.childId}>
                          {account.fullName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddStudent}
                      disabled={!studentToAdd}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      <FaUserPlus /> Add
                    </button>
                  </div>
                </div>

                {roster.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 mt-4">No children linked yet.</p>
                ) : (
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b dark:border-gray-700 text-left">
                          <th className="py-2">Name</th>
                          <th className="py-2">Lessons</th>
                          <th className="py-2">Accuracy</th>
                          <th className="py-2">Stars</th>
                          <th className="py-2">Streak</th>
                          <th className="py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roster.map(student => (
                          <tr key={student.id} className="border-b dark:border-gray-700">
                            <td className="py-2 font-semibold text-gray-800 dark:text-white">{student.name}</td>
                            <td className="py-2">{student.lessons}</td>
                            <td className="py-2">{student.accuracy}%</td>
                            <td className="py-2">{student.stars}</td>
                            <td className="py-2">{student.streak} days</td>
                            <td className="py-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveStudent(student.id)}
                                className="text-red-600 hover:underline"
                                aria-label={`Remove ${student.name}`}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Assignments</h2>
              <button
                type="button"
                onClick={() => {
                  setNewAssignment(previous => ({ ...previous, classId: classId || '' }));
                  setShowCreateAssignment(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <FaPlus /> Create Assignment
              </button>
            </div>

            {assignments.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">
                No assignments yet. Choose a curriculum unit to create one.
              </p>
            )}

            <div className="space-y-3">
              {assignments.map(assn => {
                const classData = TeacherService.getClass(assn.classId);
                const stats = assignmentProgress?.assignments.find(item => item.id === assn.id);
                return (
                  <div key={assn.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{assn.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{assn.description}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Class: {classData?.name} · Due: {assn.dueDate || 'No date'}
                          {assn.path && ` · Activity: ${assn.path}`}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        assn.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {assn.status}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
                      <span>{stats?.submittedCount || 0} submitted</span>
                      <span>{stats?.pendingCount || 0} pending</span>
                      <span>Average grade: {stats?.averageGrade || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">All Students</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-left">
                    <th className="py-2">Name</th>
                    <th className="py-2">ID</th>
                    <th className="py-2">Lessons</th>
                    <th className="py-2">Accuracy</th>
                    <th className="py-2">Stars</th>
                  </tr>
                </thead>
                <tbody>
                  {allStudents.map(student => (
                    <tr key={student.id} className="border-b dark:border-gray-700">
                      <td className="py-2 text-gray-800 dark:text-white">{student.name}</td>
                      <td className="py-2 font-mono text-gray-600 dark:text-gray-400">{student.id}</td>
                      <td className="py-2">{student.lessons}</td>
                      <td className="py-2">{student.accuracy}%</td>
                      <td className="py-2">{student.stars}</td>
                    </tr>
                  ))}
                  {allStudents.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-gray-500">No child accounts yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Class Progress {selectedClass && `· ${selectedClass.name}`}
            </h2>
            {!classProgress ? (
              <p className="text-gray-500 dark:text-gray-400">Create a class first.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    ['Students', classProgress.totalStudents],
                    ['Active', classProgress.activeStudents],
                    ['Avg lessons', classProgress.averageLessons],
                    ['Avg accuracy', `${classProgress.averageAccuracy}%`],
                    ['Avg stars', classProgress.averageStars],
                    ['Avg streak', `${classProgress.averageStreak}d`],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">
                    Last 7 days — lessons per day
                  </h3>
                  <div className="flex items-end gap-2 h-40">
                    {classProgress.daily.map(day => (
                      <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-xs text-gray-500 mb-1">{day.lessons}</span>
                        <div
                          className="w-full bg-blue-500 rounded-t"
                          style={{ height: `${Math.min(100, day.lessons * 20)}%` }}
                          title={`${day.lessons} lessons · ${day.accuracy}% accuracy`}
                        />
                        <span className="text-xs text-gray-500 mt-1">{day.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-3">
                    Skills to revisit
                  </h3>
                  {classProgress.weakSubjects.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No completed lessons yet — class data will appear here.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {classProgress.weakSubjects.map(item => (
                        <span key={item.subject} className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm">
                          {item.subject}: {item.score}% average
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Lesson Plans & Printables</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Units come from the Ghana curriculum; activities link to real Makenna pages.
            </p>

            <div className="flex flex-wrap gap-3">
              <select
                aria-label="Curriculum subject"
                value={resourceConfig.subject}
                onChange={event => setResourceConfig({ ...resourceConfig, subject: event.target.value })}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                {Object.entries(SUBJECT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select
                aria-label="Curriculum level"
                value={resourceConfig.level}
                onChange={event => setResourceConfig({ ...resourceConfig, level: event.target.value })}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                {LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                <FaFileAlt className="text-blue-500 text-2xl" />
                <h3 className="font-bold text-lg mt-2 text-gray-800 dark:text-white">Lesson plan</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Objectives, activities and an assessment prompt.
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => handleGenerate('plan')}
                    disabled={!classId}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrint('plan')}
                    disabled={!lessonPlan}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <FaPrint /> Print
                  </button>
                </div>
                {lessonPlan && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {lessonPlan.objectives.length} objectives ready.
                  </p>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                <FaEdit className="text-green-500 text-2xl" />
                <h3 className="font-bold text-lg mt-2 text-gray-800 dark:text-white">Worksheet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Printable questions with a teacher answer key.
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => handleGenerate('worksheet')}
                    disabled={!classId}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrint('worksheet')}
                    disabled={!worksheet}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <FaPrint /> Print
                  </button>
                </div>
                {worksheet && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {worksheet.questions.length} questions ready.
                  </p>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                <FaCertificate className="text-purple-500 text-2xl" />
                <h3 className="font-bold text-lg mt-2 text-gray-800 dark:text-white">Certificates</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  One certificate per linked child, based on real progress.
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => handleGenerate('certificates')}
                    disabled={!classId}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrint('certificates')}
                    disabled={!certificates}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <FaPrint /> Print
                  </button>
                </div>
                {certificates && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {certificates.length} certificates ready.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teacherMode' && <TeacherMode />}
        {activeTab === 'content' && <ContentEditor />}
      </motion.div>

      {showCreateClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Create New Class</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Class Name"
                value={newClass.name}
                onChange={event => setNewClass({ ...newClass, name: event.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <textarea
                placeholder="Description"
                value={newClass.description}
                onChange={event => setNewClass({ ...newClass, description: event.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 h-24"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleCreateClass}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateClass(false)}
                className="flex-1 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Create Assignment</h3>
            <div className="space-y-3">
              <select
                aria-label="Curriculum unit"
                value={newAssignment.templateId}
                onChange={event => handleTemplateChange(event.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Start from a curriculum unit (optional)</option>
                {curriculumUnits.map(unit => (
                  <option key={`${unit.subject}-${unit.id}`} value={unit.id}>
                    {SUBJECT_LABELS[unit.subject]}: {unit.title} ({unit.level})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Title"
                value={newAssignment.title}
                onChange={event => setNewAssignment({ ...newAssignment, title: event.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <textarea
                placeholder="Description"
                value={newAssignment.description}
                onChange={event => setNewAssignment({ ...newAssignment, description: event.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 h-24"
              />
              <input
                type="date"
                value={newAssignment.dueDate}
                onChange={event => setNewAssignment({ ...newAssignment, dueDate: event.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <select
                value={newAssignment.classId}
                onChange={event => setNewAssignment({ ...newAssignment, classId: event.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleCreateAssignment}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateAssignment(false)}
                className="flex-1 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {printKind && (
        <div className="classroom-print">
          <h1>Makenna Learning Lab — Teacher Printout</h1>
          <p>Class: {selectedClass?.name || 'Class'} · Generated {new Date().toLocaleDateString()}</p>

          {printKind === 'plan' && lessonPlan && (
            <section>
              <h2>{lessonPlan.title}</h2>
              <p><strong>Objectives</strong></p>
              <ul>{lessonPlan.objectives.map(item => <li key={item}>{item}</li>)}</ul>
              <p><strong>Activities</strong></p>
              <ol>
                {lessonPlan.activities.map(activity => (
                  <li key={activity.title}>
                    {activity.title} — {activity.curriculum} (in app: {activity.path})
                  </li>
                ))}
              </ol>
              <p><strong>Assessment:</strong> {lessonPlan.assessment}</p>
              <p><strong>Homework:</strong> {lessonPlan.homework}</p>
            </section>
          )}

          {printKind === 'worksheet' && worksheet && (
            <section>
              <h2>{worksheet.title}</h2>
              <p>Name: ______________________________ Date: ______________</p>
              <p><em>{worksheet.instructions}</em></p>
              <ol>
                {worksheet.questions.map((question, index) => (
                  <li key={`${question.prompt}-${index}`} className="print-question">
                    <p>{question.prompt}</p>
                    <p>{question.answerLine}</p>
                  </li>
                ))}
              </ol>
              <div className="print-answer-key">
                <strong>Teacher answer key</strong>
                <ol>
                  {worksheet.answerKey.map((answer, index) => <li key={`${answer}-${index}`}>{answer}</li>)}
                </ol>
              </div>
            </section>
          )}

          {printKind === 'certificates' && certificates && (
            <section>
              {certificates.map(certificate => (
                <article key={certificate.id} className="print-certificate">
                  <h2>{certificate.title}</h2>
                  <p>This is proudly presented to</p>
                  <h3>{certificate.name}</h3>
                  <p>{certificate.message}</p>
                  <div className="print-signature">
                    <span>{certificate.teacher}</span>
                    <span>{certificate.date}</span>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
