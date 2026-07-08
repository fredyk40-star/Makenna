/**
 * TeacherService - Classroom management for teachers
 * Manages students, classes, assignments, and class progress tracking
 */
import { StorageService } from './StorageService';

const CLASSES_KEY = 'makenna_classes_v1';
const ASSIGNMENTS_KEY = 'makenna_assignments_v1';
const TEACHER_KEY = 'makenna_teacher_v1';

export class TeacherService {
  /**
   * Get teacher profile
   */
  static getTeacher() {
    return StorageService.get(TEACHER_KEY, null);
  }

  /**
   * Set teacher profile
   */
  static setTeacher(teacherData) {
    StorageService.set(TEACHER_KEY, teacherData);
  }

  /**
   * Get all classes
   */
  static getClasses() {
    return StorageService.get(CLASSES_KEY, []);
  }

  /**
   * Get class by ID
   */
  static getClass(classId) {
    const classes = this.getClasses();
    return classes.find(c => c.id === classId);
  }

  /**
   * Create a new class
   */
  static createClass(classData) {
    const classes = this.getClasses();
    const newClass = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      studentIds: [],
      ...classData
    };
    classes.push(newClass);
    StorageService.set(CLASSES_KEY, classes);
    return newClass.id;
  }

  /**
   * Add student to class
   */
  static addStudentToClass(classId, childId) {
    const classes = this.getClasses();
    const classIndex = classes.findIndex(c => c.id === classId);
    if (classIndex !== -1 && !classes[classIndex].studentIds.includes(childId)) {
      classes[classIndex].studentIds.push(childId);
      StorageService.set(CLASSES_KEY, classes);
      return true;
    }
    return false;
  }

  /**
   * Remove student from class
   */
  static removeStudentFromClass(classId, childId) {
    const classes = this.getClasses();
    const classIndex = classes.findIndex(c => c.id === classId);
    if (classIndex !== -1) {
      classes[classIndex].studentIds = classes[classIndex].studentIds.filter(id => id !== childId);
      StorageService.set(CLASSES_KEY, classes);
      return true;
    }
    return false;
  }

  /**
   * Get assignments for a class
   */
  static getAssignments(classId) {
    const assignments = StorageService.get(ASSIGNMENTS_KEY, []);
    return assignments.filter(a => a.classId === classId);
  }

  /**
   * Create an assignment
   */
  static createAssignment(assignmentData) {
    const assignments = StorageService.get(ASSIGNMENTS_KEY, []);
    const assignment = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'active',
      submissions: {},
      ...assignmentData
    };
    assignments.push(assignment);
    StorageService.set(ASSIGNMENTS_KEY, assignments);
    return assignment.id;
  }

  /**
   * Submit assignment
   */
  static submitAssignment(assignmentId, childId, data) {
    const assignments = StorageService.get(ASSIGNMENTS_KEY, []);
    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment) {
      assignment.submissions[childId] = {
        ...data,
        submittedAt: new Date().toISOString()
      };
      StorageService.set(ASSIGNMENTS_KEY, assignments);
      return true;
    }
    return false;
  }

  /**
   * Grade assignment
   */
  static gradeAssignment(assignmentId, childId, grade, feedback) {
    const assignments = StorageService.get(ASSIGNMENTS_KEY, []);
    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment && assignment.submissions[childId]) {
      assignment.submissions[childId].grade = grade;
      assignment.submissions[childId].feedback = feedback;
      StorageService.set(ASSIGNMENTS_KEY, assignments);
      return true;
    }
    return false;
  }

  /**
   * Get class statistics
   */
  static getClassStats(classId, getChildData) {
    const classData = this.getClass(classId);
    if (!classData) return null;

    const stats = {
      totalStudents: classData.studentIds.length,
      averageProgress: 0,
      completedAssignments: 0,
      pendingAssignments: 0
    };

    // Calculate average progress
    if (getChildData && classData.studentIds.length > 0) {
      let totalProgress = 0;
      classData.studentIds.forEach(childId => {
        const child = getChildData(childId);
        if (child) {
          totalProgress += (child.progress?.completion || 0);
        }
      });
      stats.averageProgress = totalProgress / classData.studentIds.length;
    }

    return stats;
  }

  /**
   * Get all assignments
   */
  static getAllAssignments() {
    return StorageService.get(ASSIGNMENTS_KEY, []);
  }

  /**
   * Delete assignment
   */
  static deleteAssignment(assignmentId) {
    const assignments = StorageService.get(ASSIGNMENTS_KEY, []);
    const filtered = assignments.filter(a => a.id !== assignmentId);
    StorageService.set(ASSIGNMENTS_KEY, filtered);
  }
}