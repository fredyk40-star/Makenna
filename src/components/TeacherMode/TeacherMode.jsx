import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaCalendarCheck, FaClipboard, FaPlus, FaTrash, FaBook } from 'react-icons/fa';
import { TeacherModeService } from '../../services/TeacherModeService';
import { ChildAccountService } from '../../services/ChildAccountService';

const TeacherModeComponent = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeTab, setActiveTab] = useState('classes');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', grade: '', subject: '' });

  const teacherId = ChildAccountService.getActiveChildId();

  useEffect(() => {
    if (teacherId) {
      loadClasses();
    }
  }, [teacherId]);

  const loadClasses = () => {
    setClasses(TeacherModeService.getClasses(teacherId));
  };

  const handleCreateClass = () => {
    if (newClass.name && newClass.grade) {
      TeacherModeService.createClass(teacherId, newClass);
      loadClasses();
      setShowCreateModal(false);
      setNewClass({ name: '', grade: '', subject: '' });
    }
  };

  const handleSelectClass = (classId) => {
    const cls = TeacherModeService.getClass(teacherId, classId);
    setSelectedClass(cls);
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2">
        {[
          { id: 'classes', label: 'My Classes', icon: FaUsers },
          { id: 'homework', label: 'Homework', icon: FaClipboard },
          { id: 'attendance', label: 'Attendance', icon: FaCalendarCheck }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === tab.id ? 'bg-purple-600' : 'bg-gray-700'
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <FaPlus /> Create Class
          </button>

          <div className="grid gap-3">
            {classes.map(cls => (
              <motion.div
                key={cls.id}
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-gray-700 rounded-lg cursor-pointer"
                onClick={() => handleSelectClass(cls.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{cls.name}</h3>
                    <p className="text-sm text-gray-400">
                      Grade: {cls.grade} • Subject: {cls.subject}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cls.students?.length || 0} students
                    </p>
                  </div>
                  <button className="p-2 text-red-400 hover:text-red-300">
                    <FaTrash />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Create New Class</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Class Name"
                value={newClass.name}
                onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 rounded"
              />
              <input
                type="text"
                placeholder="Grade"
                value={newClass.grade}
                onChange={(e) => setNewClass({...newClass, grade: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 rounded"
              />
              <input
                type="text"
                placeholder="Subject"
                value={newClass.subject}
                onChange={(e) => setNewClass({...newClass, subject: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 rounded"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateClass}
                className="flex-1 py-2 bg-purple-600 rounded hover:bg-purple-700"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 bg-gray-600 rounded hover:bg-gray-700"
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

export default TeacherModeComponent;