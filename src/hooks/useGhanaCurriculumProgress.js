/**
 * useGhanaCurriculumProgress - Tracks Ghana curriculum subject mastery
 * Integrates with AdaptiveLearningService for personalized learning
 */
import { useState, useEffect, useCallback } from 'react';
import { GhanaCurriculumService } from '../services/GhanaCurriculumService';
import adaptiveLearningService from '../services/AdaptiveLearningService';
import { useChildAccount } from '../context/ChildAccountContext';
import { StorageService } from '../services/StorageService';

const GHANA_PROGRESS_KEY = 'ghana_curriculum_progress';

export const useGhanaCurriculumProgress = () => {
  const { childId } = useChildAccount();
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalSubjects: 0,
    masteredSubjects: 0,
    averageScore: 0,
  });

  // Load progress on mount
  useEffect(() => {
    if (childId) {
      loadProgress();
    }
  }, [childId]);

  const loadProgress = useCallback(() => {
    try {
      const saved = StorageService.get(`${GHANA_PROGRESS_KEY}_${childId}`);
      setProgress(saved || {});
      
      // Calculate overall stats
      const subjects = GhanaCurriculumService.getSubjects();
      const stats = {
        totalSubjects: subjects.length,
        masteredSubjects: 0,
        averageScore: 0,
      };
      
      let totalScore = 0;
      let subjectCount = 0;
      
      subjects.forEach(subject => {
        const subjectProgress = saved?.[subject] || { mastered: 0, total: 0, score: 0 };
        totalScore += subjectProgress.score || 0;
        subjectCount++;
        if (subjectProgress.mastered >= 80) {
          stats.masteredSubjects++;
        }
      });
      
      stats.averageScore = subjectCount > 0 ? Math.round(totalScore / subjectCount) : 0;
      setOverallStats(stats);
    } catch (error) {
      console.error('Failed to load Ghana curriculum progress:', error);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  /**
   * Record progress for a Ghana curriculum lesson
   */
  const recordLessonComplete = useCallback((subject, lessonId, score, timeSpent = 0) => {
    if (!childId) return;
    
    setProgress(prev => {
      const current = prev[subject] || {
        completedLessons: [],
        totalLessons: 0,
        mastered: 0,
        score: 0,
        timeSpent: 0,
        streak: 0,
      };
      
      const completedLessons = [...new Set([...current.completedLessons, lessonId])];
      const totalLessons = GhanaCurriculumService.getSubjectContent(subject).length;
      const mastered = Math.round((completedLessons.length / Math.max(1, totalLessons)) * 100);
      const newScore = Math.max(current.score || 0, score || 0);
      
      // Update adaptive learning service
      adaptiveLearningService.recordPerformance(
        `ghana_${subject}_${lessonId}`, 
        { correct: score || 0, incorrect: 100 - (score || 0), time: timeSpent }
      );
      
      const newProgress = {
        ...prev,
        [subject]: {
          ...current,
          completedLessons,
          totalLessons,
          mastered,
          score: newScore,
          timeSpent: (current.timeSpent || 0) + timeSpent,
          streak: (current.streak || 0) + 1,
          lastCompleted: Date.now(),
        },
      };
      
      StorageService.set(`${GHANA_PROGRESS_KEY}_${childId}`, newProgress);
      return newProgress;
    });
  }, [childId]);

  /**
   * Get progress for a specific subject
   */
  const getSubjectProgress = useCallback((subject) => {
    const data = progress[subject] || {
      completedLessons: [],
      totalLessons: GhanaCurriculumService.getSubjectContent(subject).length,
      mastered: 0,
      score: 0,
      timeSpent: 0,
    };
    return data;
  }, [progress]);

  /**
   * Get weekly progress data
   */
  const getWeeklyProgress = useCallback(() => {
    const days = [];
    const now = Date.now();
    
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now - i * 24 * 60 * 60 * 1000);
      days.push({
        day: day.toLocaleDateString('en-US', { weekday: 'short' }),
        date: day.toISOString().split('T')[0],
        lessonsCompleted: 0,
        timeSpent: 0,
      });
    }
    
    // Count completed lessons per day from progress
    Object.values(progress).forEach(subjectData => {
      if (subjectData.lastCompleted) {
        const completedDay = new Date(subjectData.lastCompleted);
        const dayIndex = days.findIndex(d => 
          d.date === completedDay.toISOString().split('T')[0]
        );
        if (dayIndex >= 0) {
          days[dayIndex].lessonsCompleted += 1;
          days[dayIndex].timeSpent += subjectData.timeSpent || 0;
        }
      }
    });
    
    return days;
  }, [progress]);

  /**
   * Get recommended lessons based on current progress
   */
  const getRecommendedLessons = useCallback((limit = 5) => {
    const recommendations = [];
    const subjects = GhanaCurriculumService.getSubjects();
    
    subjects.forEach(subject => {
      const subjectProgress = getSubjectProgress(subject);
      const adaptiveRec = adaptiveLearningService.getRecommendedPractice(limit);
      
      // Find lessons in this subject that need practice
      const needsReview = adaptiveRec
        .filter(rec => rec.itemId.startsWith(`ghana_${subject}_`))
        .map(rec => rec.itemId.replace(`ghana_${subject}_`, ''));
      
      // If subject not started, add it to recommendations
      if (subjectProgress.completedLessons.length === 0) {
        recommendations.push({
          subject,
          type: 'start',
          priority: 'high',
          message: `Start learning ${subject.toUpperCase()}!`,
          lessons: GhanaCurriculumService.getSubjectContent(subject).slice(0, 3),
        });
      } else if (needsReview.length > 0) {
        recommendations.push({
          subject,
          type: 'review',
          priority: 'medium',
          message: `Continue ${subject.toUpperCase()} practice`,
          lessons: needsReview.slice(0, 3),
        });
      }
    });
    
    return recommendations.slice(0, limit);
  }, [progress, getSubjectProgress]);

  /**
   * Reset progress for a subject
   */
  const resetSubjectProgress = useCallback((subject) => {
    if (!childId) return;
    
    setProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[subject];
      StorageService.set(`${GHANA_PROGRESS_KEY}_${childId}`, newProgress);
      return newProgress;
    });
  }, [childId]);

  /**
   * Get all subject progress for parent dashboard
   */
  const getAllSubjectProgress = useCallback(() => {
    const subjects = GhanaCurriculumService.getSubjects();
    return subjects.map(subject => ({
      subject,
      ...getSubjectProgress(subject),
    }));
  }, [getSubjectProgress]);

  return {
    progress,
    loading,
    overallStats,
    recordLessonComplete,
    getSubjectProgress,
    getWeeklyProgress,
    getRecommendedLessons,
    resetSubjectProgress,
    getAllSubjectProgress,
    refresh: loadProgress,
  };
};

export default useGhanaCurriculumProgress;