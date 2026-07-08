/**
 * Teacher Mode Service - Classroom management for teachers
 * Student rosters, attendance, class assignments
 */
import { StorageService } from './StorageService';

const TEACHER_KEY = 'makenna_teacher_data';
const CLASS_KEY = 'makenna_class_data';

export class TeacherModeService {
  /**
   * Create a class
   */
  static createClass(teacherId, classData) {
    const classes = this.getClasses(teacherId);
    const newClass = {
      id: `${teacherId}_class_${Date.now()}`,
      name: classData.name,
      grade: classData.grade,
      subject: classData.subject,
      students: [],
      createdAt: new Date().toISOString()
    };
    classes.push(newClass);
    StorageService.set(`${CLASS_KEY}_${teacherId}`, classes);
    return newClass;
  }

  /**
   * Get all classes for teacher
   */
  static getClasses(teacherId) {
    return StorageService.get(`${CLASS_KEY}_${teacherId}`, []);
  }

  /**
   * Add student to class
   */
  static addStudent(teacherId, classId, studentId) {
    const classes = this.getClasses(teacherId);
    const classIndex = classes.findIndex(c => c.id === classId);
    
    if (classIndex >= 0) {
      classes[classIndex].students.push({
        id: studentId,
        joinedAt: new Date().toISOString()
      });
      StorageService.set(`${CLASS_KEY}_${teacherId}`, classes);
    }
    
    return classes[classIndex];
  }

  /**
   * Remove student from class
   */
  static removeStudent(teacherId, classId, studentId) {
    const classes = this.getClasses(teacherId);
    const classIndex = classes.findIndex(c => c.id === classId);
    
    if (classIndex >= 0) {
      classes[classIndex].students = classes[classIndex].students.filter(
        s => s.id !== studentId
      );
      StorageService.set(`${CLASS_KEY}_${teacherId}`, classes);
    }
    
    return classes[classIndex];
  }

  /**
   * Record attendance
   */
  static recordAttendance(teacherId, classId, date, attendance) {
    const classData = this.getClass(teacherId, classId);
    if (!classData) return null;

    if (!classData.attendance) classData.attendance = {};
    classData.attendance[date] = attendance;
    
    this.updateClass(teacherId, classData);
    return classData.attendance[date];
  }

  /**
   * Get class details
   */
  static getClass(teacherId, classId) {
    const classes = this.getClasses(teacherId);
    return classes.find(c => c.id === classId);
  }

  /**
   * Update class
   */
  static updateClass(teacherId, classData) {
    const classes = this.getClasses(teacherId);
    const index = classes.findIndex(c => c.id === classData.id);
    if (index >= 0) {
      classes[index] = classData;
      StorageService.set(`${CLASS_KEY}_${teacherId}`, classes);
    }
    return classes[index];
  }

  /**
   * Assign homework to class
   */
  static assignHomework(teacherId, classId, homework) {
    const classData = this.getClass(teacherId, classId);
    if (!classData) return null;

    if (!classData.homework) classData.homework = [];
    classData.homework.push({
      id: `hw_${Date.now()}`,
      ...homework,
      assignedAt: new Date().toISOString(),
      dueDate: homework.dueDate
    });

    this.updateClass(teacherId, classData);
    return classData.homework[classData.homework.length - 1];
  }

  /**
   * Get homework for class
   */
  static getHomework(teacherId, classId) {
    const classData = this.getClass(teacherId, classId);
    return classData?.homework || [];
  }

  /**
   * Get class analytics
   */
  static getClassAnalytics(teacherId, classId) {
    const classData = this.getClass(teacherId, classId);
    if (!classData) return null;

    const attendance = classData.attendance || {};
    const totalDays = Object.keys(attendance).length;
    const studentCount = classData.students.length;

    let totalPresent = 0;
    Object.values(attendance).forEach(day => {
      totalPresent += day.present?.length || 0;
    });

    return {
      studentCount,
      totalDays,
      averageAttendance: totalDays > 0 ? Math.round((totalPresent / (totalDays * studentCount)) * 100) : 0,
      homeworkCount: classData.homework?.length || 0,
      className: classData.name
    };
  }

  /**
   * Get teacher info
   */
  static getTeacherInfo(teacherId) {
    return StorageService.get(`${TEACHER_KEY}_${teacherId}`, {
      id: teacherId,
      name: 'Teacher',
      school: '',
      classes: 0
    });
  }

  /**
   * Update teacher info
   */
  static updateTeacherInfo(teacherId, info) {
    StorageService.set(`${TEACHER_KEY}_${teacherId}`, info);
    return this.getTeacherInfo(teacherId);
  }
}