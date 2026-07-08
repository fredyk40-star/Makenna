/**
 * Real-time Collaboration Service - Syncs learning activities between users
 * Supports shared whiteboards, live chat, collaborative assignments
 */
import { StorageService } from './StorageService';
import { NotificationBellService } from './NotificationBellService';

const COLLABORATION_KEY = 'makenna_collaboration';

export class CollaborationService {
  /**
   * Create a new collaboration session
   */
  static createSession(sessionId, creatorId, initialData = {}) {
    const sessions = StorageService.get(COLLABORATION_KEY, {});
    const newSession = {
      id: sessionId,
      creator: creatorId,
      participants: [creatorId],
      data: initialData,
      createdAt: new Date().toISOString()
    };
    sessions[sessionId] = newSession;
    StorageService.set(COLLABORATION_KEY, sessions);

    NotificationBellService.addNotification(creatorId, {
      type: 'collaboration',
      title: 'Collaboration Started!',
      message: `Your session '${sessionId}' is ready. Invite others to join!`,
      icon: '🤝'
    });
    return newSession;
  }

  /**
   * Join an existing collaboration session
   */
  static joinSession(sessionId, participantId) {
    const sessions = StorageService.get(COLLABORATION_KEY, {});
    const session = sessions[sessionId];

    if (session && !session.participants.includes(participantId)) {
      session.participants.push(participantId);
      StorageService.set(COLLABORATION_KEY, sessions);

      NotificationBellService.addNotification(participantId, {
        type: 'collaboration',
        title: 'Joined Collaboration!',
        message: `You joined session '${sessionId}'.`,
        icon: '🤝'
      });

      // Notify other participants
      session.participants.forEach(p => {
        if (p !== participantId) {
          NotificationBellService.addNotification(p, {
            type: 'collaboration',
            title: 'New Participant!',
            message: `${participantId} joined your session.`,
            icon: '👥'
          });
        }
      });
      return session;
    }
    return null;
  }

  /**
   * Leave a collaboration session
   */
  static leaveSession(sessionId, participantId) {
    const sessions = StorageService.get(COLLABORATION_KEY, {});
    const session = sessions[sessionId];

    if (session) {
      session.participants = session.participants.filter(id => id !== participantId);
      StorageService.set(COLLABORATION_KEY, sessions);
      // Notify others
      session.participants.forEach(p => {
        NotificationBellService.addNotification(p, {
          type: 'collaboration',
          title: 'Participant Left',
          message: `${participantId} left the session.`,
          icon: '👋'
        });
      });
      return true;
    }
    return false;
  }

  /**
   * Update shared data in a session
   */
  static updateSessionData(sessionId, newData, senderId) {
    const sessions = StorageService.get(COLLABORATION_KEY, {});
    const session = sessions[sessionId];

    if (session) {
      // Merge data (could be more sophisticated, e.g., conflict resolution)
      session.data = { ...session.data, ...newData };
      StorageService.set(COLLABORATION_KEY, sessions);
      // Broadcast changes to other participants (simulated)
      session.participants.forEach(p => {
        if (p !== senderId) {
          // In a real app, this would trigger UI updates via WebSocket or similar.
          // For now, we store the updated data flag.
          const userSessionUpdates = StorageService.get(`makenna_${p}_session_updates`, {});
          userSessionUpdates[sessionId] = { ...newData, receivedAt: new Date().toISOString() };
          StorageService.set(`makenna_${p}_session_updates`, userSessionUpdates);
        }
      });
      return session.data;
    }
    return null;
  }

  /**
   * Get session details
   */
  static getSession(sessionId) {
    const sessions = StorageService.get(COLLABORATION_KEY, {});
    return sessions[sessionId] || null;
  }

  /**
   * Get user's active sessions
   */
  static getUserSessions(userId) {
    const sessions = StorageService.get(COLLABORATION_KEY, {});
    return Object.values(sessions).filter(session => session.participants.includes(userId));
  }

  /**
   * End a session
   */
  static endSession(sessionId) {
    const sessions = StorageService.get(COLLABORATION_KEY, {});
    const session = sessions[sessionId];

    if (session) {
      session.participants.forEach(p => {
        NotificationBellService.addNotification(p, {
          type: 'collaboration',
          title: 'Session Ended',
          message: `The collaboration session '${sessionId}' has ended.`,
          icon: '🔚'
        });
      });
      delete sessions[sessionId];
      StorageService.set(COLLABORATION_KEY, sessions);
      return true;
    }
    return false;
  }
}

/**
 * Skill-based Assessment Service - Creates and grades skill-focused challenges
 * Targets specific competencies with adaptive difficulty
 */
const ASSESSMENT_KEY = 'makenna_assessments';

export class SkillAssessmentService {
  /**
   * Get all available assessment templates
   */
  static getAssessmentTemplates() {
    return [
      { id: 'alphabet-speed', name: 'Alphabet Speed Challenge', skill: 'alphabet', type: 'speed' },
      { id: 'number-count', name: 'Quick Counting', skill: 'numbers', type: 'recall' },
      { id: 'reading-fluency', name: 'Reading Fluency Test', skill: 'reading', type: 'comprehension' },
      { id: 'shapes-recognition', name: 'Shape Sleuth', skill: 'shapes', type: 'recognition' }
    ];
  }

  /**
   * Generate a skill assessment for a child
   */
  static generateAssessment(childId, templateId, difficulty = 'medium') {
    const template = this.getAssessmentTemplates().find(t => t.id === templateId);
    if (!template) throw new Error('Invalid assessment template.');

    // Simulate generating questions based on template and difficulty
    const questions = this.generateQuestions(template, difficulty);

    const assessment = {
      id: `assess-${Date.now()}`,
      childId,
      templateId,
      templateName: template.name,
      skill: template.skill,
      questions,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const allAssessments = StorageService.get(ASSESSMENT_KEY, {});
    allAssessments[assessment.id] = assessment;
    StorageService.set(ASSESSMENT_KEY, allAssessments);

    return assessment;
  }

  /**
   * Helper to generate questions based on template
   */
  static generateQuestions(template, difficulty) {
    const questionPool = {
      alphabet: [
        { id: 'q1', question: 'What letter comes after A?', options: ['B', 'C', 'D'], answer: 'B' },
        { id: 'q2', question: 'Which letter makes the /b/ sound?', options: ['B', 'P', 'D'], answer: 'B' }
      ],
      numbers: [
        { id: 'q1', question: 'What number is this?', options: ['1', '2', '3'], answer: '2' },
        { id: 'q2', question: 'Count the dots: ⭐⭐⭐', options: ['1', '2', '3'], answer: '3' }
      ],
      reading: [
        { id: 'q1', question: 'What is the first word in this sentence?', passage: 'The cat sat.', options: ['The', 'cat', 'sat'], answer: 'The' }
      ],
      shapes: [
        { id: 'q1', question: 'Identify this shape: ⬛', options: ['Circle', 'Square', 'Triangle'], answer: 'Square' }
      ]
    };

    return questionPool[template.skill] || [];
  }

  /**
   * Submit assessment answers
   */
  static submitAssessment(assessmentId, answers) {
    const allAssessments = StorageService.get(ASSESSMENT_KEY, {});
    const assessment = allAssessments[assessmentId];
    if (!assessment) throw new Error('Assessment not found.');

    let score = 0;
    assessment.questions.forEach((q, index) => {
      if (answers[index] === q.answer) score++;
    });

    assessment.answers = answers;
    assessment.score = score;
    assessment.status = 'completed';
    assessment.completedAt = new Date().toISOString();

    allAssessments[assessmentId] = assessment;
    StorageService.set(ASSESSMENT_KEY, allAssessments);
    return assessment;
  }

  /**
   * Get assessment history for a child
   */
  static getChildAssessments(childId) {
    const allAssessments = StorageService.get(ASSESSMENT_KEY, {});
    return Object.values(allAssessments).filter(a => a.childId === childId);
  }
}