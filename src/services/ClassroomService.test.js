import { describe, expect, it } from 'vitest';
import ClassroomService from './ClassroomService';
import { TeacherService } from './TeacherService';
import { StorageService } from './StorageService';
import { GamificationService } from './GamificationService';

const childId = 'classroom-child';

const createClassWithStudent = () => {
  StorageService.set('makenna_child_accounts_v2', [{
    childId,
    fullName: 'Ama Mensah',
    progress: {
      alphabet_progress: { completed: ['a', 'b'] },
    },
  }]);

  const state = GamificationService.getState(childId);
  state.stars = 45;
  GamificationService.saveState(childId, state);

  const timestamp = new Date().toISOString();
  StorageService.set('makenna_analytics_events', [
    { type: 'lesson_complete', childId, timestamp, data: { subject: 'Alphabet', score: 90 } },
    { type: 'answer', childId, timestamp, data: { correct: true } },
  ]);

  const classId = TeacherService.createClass({ name: 'KG1 A', description: 'Morning class' });
  TeacherService.addStudentToClass(classId, childId);
  return classId;
};

describe('ClassroomService', () => {
  it('builds a roster from linked child accounts with real progress', () => {
    const classId = createClassWithStudent();
    const roster = ClassroomService.getRoster(classId);

    expect(roster).toHaveLength(1);
    expect(roster[0].name).toBe('Ama Mensah');
    expect(roster[0].stars).toBe(45);
    expect(roster[0].lessons).toBe(1);
    expect(roster[0].accuracy).toBe(100);
  });

  it('derives class progress and seven-day activity', () => {
    const classId = createClassWithStudent();
    const progress = ClassroomService.getClassProgress(classId);

    expect(progress.totalStudents).toBe(1);
    expect(progress.activeStudents).toBe(1);
    expect(progress.averageLessons).toBe(1);
    expect(progress.daily).toHaveLength(7);
    expect(progress.weakSubjects[0].subject).toBe('Alphabet');
  });

  it('creates curriculum lesson plans and worksheets with tappable activities', () => {
    const classId = createClassWithStudent();
    const plan = ClassroomService.getLessonPlan(classId, 'mathematics', 'KG1');
    const worksheet = ClassroomService.getWorksheet(classId, 'mathematics', 'KG1');

    expect(plan.title).toContain('Mathematics');
    expect(plan.activities.length).toBeGreaterThan(0);
    expect(plan.activities.every(activity => activity.path.startsWith('/'))).toBe(true);
    expect(worksheet.questions.length).toBe(plan.activities.length);
    expect(worksheet.answerKey.length).toBe(worksheet.questions.length);
  });

  it('tracks assignment submissions and grades per student', () => {
    const classId = createClassWithStudent();
    const assignmentId = TeacherService.createAssignment({
      classId,
      title: 'Count to ten',
      dueDate: '2026-12-01',
    });
    TeacherService.submitAssignment(assignmentId, childId, { answer: '1 to 10' });
    TeacherService.gradeAssignment(assignmentId, childId, 90, 'Well done');

    const progress = ClassroomService.getAssignmentProgress(classId);

    expect(progress.total).toBe(1);
    expect(progress.submitted).toBe(1);
    expect(progress.pending).toBe(0);
    expect(progress.students[0].averageGrade).toBe(90);
  });

  it('generates a printable certificate for every linked student', () => {
    const classId = createClassWithStudent();
    const certificates = ClassroomService.getCertificates(classId);

    expect(certificates).toHaveLength(1);
    expect(certificates[0].name).toBe('Ama Mensah');
    expect(certificates[0].title).toContain('Certificate');
    expect(certificates[0].message).toContain('45');
  });
});
