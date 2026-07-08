import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TeacherService } from '../../services/TeacherService';
import { ChildAccountService } from '../../services/ChildAccountService';
import { FaChalkboard, FaUsers, FaClipboardList, FaPlus, FaEdit, FaTrash, FaGraduationCap, FaChartBar, FaCalendar, FaClock } from 'react-icons/fa';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('classes');
  const [selectedClass, setSelectedClass] = useState(null);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', description: '' });
  const [newAssignment, setNewAssignment] = useState({ 
    title: '', 
    description: '', 
    dueDate: '', 
    classId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setClasses(TeacherService.getClasses());
    setAssignments(TeacherService.getAllAssignments());
  };

  const handleCreateClass = () => {
    if (newClass.name) {
      TeacherService.createClass(newClass);
      loadData();
      setShowCreateClass(false);
      setNewClass({ name: '', description: '' });
    }
  };

  const handleCreateAssignment = () => {
    if (newAssignment.title && newAssignment.classId) {
      TeacherService.createAssignment(newAssignment);
      loadData();
      setShowCreateAssignment(false);
      setNewAssignment({ title: '', description: '', dueDate: '', classId: '' });
    }
  };

  const getClassStudents = (classId) => {
    const classData = TeacherService.getClass(classId);
    if (!classData) return [];
    return classData.studentIds.map(id => ChildAccountService.getChild(id)).filter(Boolean);
  };

  const tabs = [
    { id: 'classes', label: 'Classes', icon: FaChalkboard },
    { id: 'assignments', label: 'Assignments', icon: FaClipboardList },
    { id: 'students', label: 'Students', icon: FaUsers },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <FaGraduationCap /> Teacher Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your classes and students</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
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

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Classes</h2>
              <button
                onClick={() => setShowCreateClass(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <FaPlus /> Create Class
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map(cls => (
                <motion.div
                  key={cls.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg cursor-pointer"
                  onClick={() => setSelectedClass(cls)}
                >
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">{cls.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cls.description}</p>
                  <div className="flex items-center gap-2 mt-3 text-blue-600">
                    <FaUsers />
                    <span>{cls.studentIds.length} students</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Assignments</h2>
              <button
                onClick={() => setShowCreateAssignment(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <FaPlus /> Create Assignment
              </button>
            </div>

            <div className="space-y-3">
              {assignments.map(assn => {
                const classData = TeacherService.getClass(assn.classId);
                return (
                  <div key={assn.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{assn.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{assn.description}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Class: {classData?.name} • Due: {assn.dueDate}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        assn.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {assn.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">All Students</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">ID</th>
                    <th className="text-left py-2">Progress</th>
                    <th className="text-left py-2">Stars</th>
                  </tr>
                </thead>
                <tbody>
                  {ChildAccountService.getAllAccounts().map(child => (
                    <tr key={child.childId} className="border-b dark:border-gray-700">
                      <td className="py-2 text-gray-800 dark:text-white">{child.fullName}</td>
                      <td className="py-2 font-mono text-gray-600 dark:text-gray-400">{child.childId}</td>
                      <td className="py-2">{child.progress?.alphabet?.length || 0}%</td>
                      <td className="py-2">{child.stars || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Create Class Modal */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Create New Class</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Class Name"
                value={newClass.name}
                onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <textarea
                placeholder="Description"
                value={newClass.description}
                onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 h-24"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateClass}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateClass(false)}
                className="flex-1 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Create Assignment</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <textarea
                placeholder="Description"
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 h-24"
              />
              <input
                type="date"
                value={newAssignment.dueDate}
                onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <select
                value={newAssignment.classId}
                onChange={(e) => setNewAssignment({...newAssignment, classId: e.target.value})}
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
                onClick={handleCreateAssignment}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateAssignment(false)}
                className="flex-1 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;