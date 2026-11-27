/**
 * Classroom Service - derives real class-level data for teachers.
 *
 * TeacherService owns the stored roster/assignments; this service turns that
 * data (plus analytics and the Ghana curriculum) into rosters, progress,
 * lesson plans, worksheets and certificates. Nothing here is random.
 */
import { TeacherService } from './TeacherService';
import { ChildAccountService } from './ChildAccountService';
import { LearningAnalytics } from './LearningAnalytics';
import { GhanaCurriculumService } from './GhanaCurriculumService';
import DailyMissionService from './DailyMissionService';

export const SUBJECT_LABELS = {
  twi: 'Twi',
  ewe: 'Ewe',
  ga: 'Ga',
  english: 'English',
  mathematics: 'Mathematics',
  science: 'Science',
  social_studies: 'Social Studies',
  creative_arts: 'Creative Arts',
  rme: 'Religious & Moral Education',
  life_skills: 'Life Skills',
};

export const LEVELS = ['KG1', 'KG2', 'Basic1', 'Basic2'];

const ACTIVITY_PATHS = {
  alphabet: '/alphabet',
  vowels: '/alphabet',
  consonants: '/alphabet',
  names: '/alphabet',
  vocabulary: '/ghana-languages',
  greetings: '/ghana-languages',
  days: '/ghana-languages',
  family: '/ghana-languages',
  numbers: '/numbers',
  counting: '/numbers',
  money: '/maths/counting',
  shopping: '/maths/counting',
  addition: '/maths/addition',
  subtraction: '/maths/subtraction',
  measurement: '/maths/compare',
  'sight-words': '/reading/sight-words',
  reading: '/reading/word-builder',
  writing: '/reading/word-builder',
  shapes: '/shapes',
  drawing: '/drawing',
  textiles: '/drawing',
  animals: '/animal-safari',
  food: '/science-lab',
  weather: '/science-lab',
  plants: '/science-lab/parts-of-a-plant',
  water: '/science-lab/water-cycle',
  environment: '/science-lab',
  hygiene: '/science-lab',
  health: '/science-lab',
  regions: '/ghana-explorer',
  markets: '/ghana-explorer',
  festivals: '/ghana-explorer',
  symbols: '/ghana-explorer',
  music: '/music',
  behavior: '/stories',
  sharing: '/stories',
  respect: '/stories',
  proverbs: '/stories',
};

const AVERAGE = (values) => {
  const numbers = values.filter(value => Number.isFinite(value));
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((total, value) => total + value, 0) / numbers.length);
};

const studentSummary = (account) => {
  const childId = account.childId;
  const stats = LearningAnalytics.getStats(childId);
  const mission = DailyMissionService.getMission(childId);
  return {
    id: childId,
    name: account.fullName || account.name || childId,
    stats,
    stars: stats.starsEarned,
    lessons: stats.lessonsCompleted,
    accuracy: stats.averageScore,
    streak: mission?.streak || 0,
    mastery: stats.mastery || {},
  };
};

export class ClassroomService {
  static getActivityPath(lessonType) {
    return ACTIVITY_PATHS[lessonType] || '/learn';
  }

  /** Students linked to a class, with their real progress attached. */
  static getRoster(classId) {
    const classData = TeacherService.getClass(classId);
    if (!classData) return [];

    const accounts = ChildAccountService.getAllAccounts();
    return (classData.studentIds || [])
      .map(id => accounts.find(account => account.childId?.toLowerCase() === String(id).toLowerCase()))
      .filter(Boolean)
      .map(studentSummary);
  }

  /** Summaries for every child account, used by the "All students" table. */
  static getAllStudentSummaries() {
    return ChildAccountService.getAllAccounts().map(studentSummary);
  }

  /** Submission/grading picture for one class. */
  static getAssignmentProgress(classId) {
    const students = this.getRoster(classId);
    const assignments = TeacherService.getAssignments(classId).map(assignment => {
      const submissions = assignment.submissions || {};
      const submittedIds = students
        .filter(student => submissions[student.id])
        .map(student => student.id);
      const grades = submittedIds
        .map(id => parseFloat(submissions[id].grade))
        .filter(value => Number.isFinite(value));

      return {
        ...assignment,
        submittedCount: submittedIds.length,
        pendingCount: students.length - submittedIds.length,
        averageGrade: AVERAGE(grades),
      };
    });

    return {
      assignments,
      students: students.map(student => {
        const submitted = assignments.filter(item => item.submissions?.[student.id]);
        const grades = submitted
          .map(item => parseFloat(item.submissions[student.id].grade))
          .filter(value => Number.isFinite(value));
        return {
          ...student,
          submitted: submitted.length,
          graded: grades.length,
          averageGrade: AVERAGE(grades),
        };
      }),
      total: assignments.length,
      submitted: assignments.reduce((sum, item) => sum + item.submittedCount, 0),
      pending: assignments.reduce((sum, item) => sum + item.pendingCount, 0),
    };
  }

  /** Class-wide headline numbers and a seven-day activity series. */
  static getClassProgress(classId) {
    const students = this.getRoster(classId);
    const daily = Array.from({ length: 7 }, () => ({ lessons: 0, answers: 0, accuracyTotal: 0, accuracySamples: 0 }));

    students.forEach(student => {
      LearningAnalytics.getDailyGraph(student.id, 7).forEach((day, index) => {
        daily[index].lessons += day.lessons;
        daily[index].answers += day.answers;
        daily[index].accuracyTotal += day.accuracy * day.answers;
        daily[index].accuracySamples += day.answers;
      });
    });

    const labels = LearningAnalytics.getDailyGraph('', 7);
    const series = daily.map((day, index) => ({
      date: labels[index].date,
      day: labels[index].day,
      lessons: day.lessons,
      answers: day.answers,
      accuracy: day.accuracySamples > 0
        ? Math.round(day.accuracyTotal / day.accuracySamples)
        : 0,
    }));

    const subjectTotals = {};
    students.forEach(student => {
      Object.entries(student.mastery).forEach(([subject, score]) => {
        if (!subjectTotals[subject]) subjectTotals[subject] = [];
        subjectTotals[subject].push(score);
      });
    });
    const weakSubjects = Object.entries(subjectTotals)
      .map(([subject, scores]) => ({ subject, score: AVERAGE(scores) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    return {
      classId,
      totalStudents: students.length,
      averageLessons: AVERAGE(students.map(student => student.lessons)),
      averageAccuracy: AVERAGE(students.map(student => student.accuracy)),
      averageStars: AVERAGE(students.map(student => student.stars)),
      averageStreak: AVERAGE(students.map(student => student.streak)),
      activeStudents: students.filter(student => student.lessons > 0).length,
      weakSubjects,
      daily: series,
    };
  }

  /** A curriculum-aligned lesson plan with tappable Makenna activities. */
  static getLessonPlan(classId, subjectKey = 'english', level = 'KG1') {
    const classData = TeacherService.getClass(classId);
    const available = GhanaCurriculumService.getSubjectContent(subjectKey);
    const matching = available.filter(item => item.level === level);
    const units = (matching.length > 0 ? matching : available).slice(0, 5);
    const subject = SUBJECT_LABELS[subjectKey] || subjectKey;

    return {
      classId,
      className: classData?.name || 'Class',
      subject,
      level,
      title: `${subject} lesson plan — ${level}`,
      objectives: units.map(unit => unit.title),
      activities: units.map(unit => ({
        title: unit.title,
        curriculum: unit.content,
        level: unit.level,
        path: this.getActivityPath(unit.lesson),
      })),
      assessment: `Ask each child to explain one idea from ${units[0]?.title || 'the lesson'} in their own words.`,
      homework: `Practise the ${subject.toLowerCase()} activity in Makenna for 10 minutes.`,
    };
  }

  /** Printable worksheet with an answer key for the teacher. */
  static getWorksheet(classId, subjectKey = 'english', level = 'KG1') {
    const plan = this.getLessonPlan(classId, subjectKey, level);
    const questions = plan.activities.map((activity, index) => (
      this.buildQuestion(activity.title, subjectKey, index)
    ));

    return {
      title: `${plan.subject} worksheet — ${plan.level}`,
      className: plan.className,
      instructions: 'Write your name. Answer the questions. You may draw a picture to help you.',
      questions,
      answerKey: questions.map(question => question.answer),
    };
  }

  static buildQuestion(topic, subjectKey, index) {
    const lower = topic.toLowerCase();

    if (lower.includes('vowel') || lower.includes('alphabet') || lower.includes('consonant')) {
      const letters = subjectKey === 'english' && lower.includes('vowel')
        ? ['A', 'E', 'I', 'O', 'U']
        : ['A', 'B', 'C', 'D', 'E'];
      return {
        prompt: lower.includes('vowel')
          ? 'Write the five vowel letters.'
          : `Circle the letter that comes next: A, B, C, D, ___`,
        answerLine: 'Answer: ________________',
        answer: lower.includes('vowel') ? letters.join(', ') : 'E',
      };
    }

    if (['mathematics', 'life_skills'].includes(subjectKey) || lower.includes('count') || lower.includes('money')) {
      const first = 2 + index;
      const second = 1 + (index % 3);
      return {
        prompt: subjectKey === 'life_skills' || lower.includes('money')
          ? `You have ${first} cedis and find ${second} more. How many cedis do you have?`
          : `Count the stars: ${'⭐'.repeat(first + second)} How many stars are there?`,
        answerLine: 'Answer: ________________',
        answer: String(first + second),
      };
    }

    if (['english', 'twi', 'ewe', 'ga'].includes(subjectKey) || lower.includes('word') || lower.includes('read')) {
      const words = ['the', 'and', 'is', 'in', 'on'];
      const word = words[index % words.length];
      return {
        prompt: `Write a sentence using the word "${word}".`,
        answerLine: `My sentence: ________________________________________`,
        answer: `Any sensible sentence using "${word}".`,
      };
    }

    if (lower.includes('shape')) {
      return {
        prompt: 'Draw a shape with three sides and write its name.',
        answerLine: 'Shape: ________________',
        answer: 'triangle',
      };
    }

    return {
      prompt: `In your own words, what did you learn about ${topic.toLowerCase()}?`,
      answerLine: 'My answer: ________________________________________',
      answer: `Look for the main idea about ${topic.toLowerCase()}.`,
    };
  }

  /** One printable certificate per student, based on stored achievement. */
  static getCertificates(classId) {
    const teacher = TeacherService.getTeacher() || {};
    const date = new Date().toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });

    return this.getRoster(classId).map(student => {
      const eligible = student.lessons >= 3 || student.accuracy >= 80;
      return {
        id: student.id,
        name: student.name,
        title: eligible ? 'Certificate of Achievement' : 'Certificate of Participation',
        message: eligible
          ? `For completing ${student.lessons} ${student.lessons === 1 ? 'lesson' : 'lessons'} with ${student.accuracy}% average accuracy, ${student.stars} stars and a ${student.streak}-day mission streak.`
          : `For beginning the Makenna learning journey. Keep going — every day counts!`,
        stars: student.stars,
        date,
        teacher: teacher.name || 'Class Teacher',
      };
    });
  }
}

export default ClassroomService;
