import { useState, useEffect, useCallback } from 'react';
import assessmentService from '../services/AssessmentService';
import { useAudio } from './useAudio';

export const useAssessment = (letterData = {}, progressData = {}) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const { speak } = useAudio();

  useEffect(() => {
    if (Object.keys(letterData).length > 0) {
      startAssessment(letterData, progressData);
    }
  }, [letterData, progressData]);

  const startAssessment = useCallback((data, progress) => {
    const generated = assessmentService.generateAssessment(data, progress);
    setQuestions(generated);
    setCurrentQuestion(generated[0] || null);
    setCurrentIndex(0);
    setScore(0);
    setIsComplete(false);
    setResults(null);
    setProgress(0);
  }, []);

  const submitAnswer = useCallback((answer) => {
    const result = assessmentService.submitAnswer(answer);
    
    if (result) {
      setScore(result.currentScore);
      setProgress(assessmentService.getProgress());
      
      if (result.isComplete) {
        setIsComplete(true);
        const resultsData = assessmentService.getResults();
        setResults(resultsData);
        
        // Announce completion
        speak('Assessment complete! Great job!', {
          rate: 0.9,
          pitch: 1.2
        });
      } else {
        const next = assessmentService.getCurrentQuestion();
        setCurrentQuestion(next);
        setCurrentIndex(assessmentService.currentIndex);
        
        // Speak question
        if (next) {
          speak(next.question, {
            rate: 0.8,
            pitch: 1.1
          });
        }
      }
    }
    
    return result;
  }, [speak]);

  const getQuestion = useCallback(() => {
    return assessmentService.getCurrentQuestion();
  }, []);

  const getResults = useCallback(() => {
    return assessmentService.getResults();
  }, []);

  const resetAssessment = useCallback(() => {
    assessmentService.reset();
    setQuestions([]);
    setCurrentQuestion(null);
    setCurrentIndex(0);
    setScore(0);
    setIsComplete(false);
    setResults(null);
    setProgress(0);
  }, []);

  const getProgress = useCallback(() => {
    return assessmentService.getProgress();
  }, []);

  return {
    questions,
    currentQuestion,
    currentIndex,
    score,
    isComplete,
    results,
    progress,
    totalQuestions: questions.length,
    submitAnswer,
    getQuestion,
    getResults,
    resetAssessment,
    getProgress,
    startAssessment
  };
};