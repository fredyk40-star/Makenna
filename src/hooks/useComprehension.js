import { useState, useCallback } from 'react';

export const useComprehension = (questions = []) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const submitAnswer = useCallback((answer) => {
    const question = questions[currentQuestionIndex];
    if (!question) return null;

    const isCorrect = answer === question.correct;
    const newAnswers = [...answers, { questionIndex: currentQuestionIndex, answer, isCorrect }];
    setAnswers(newAnswers);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }

    return { isCorrect, total: questions.length, correct: score + (isCorrect ? 1 : 0) };
  }, [currentQuestionIndex, questions, answers, score]);

  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setScore(0);
    setIsComplete(false);
  }, []);

  const getCurrentQuestion = useCallback(() => {
    return questions[currentQuestionIndex] || null;
  }, [questions, currentQuestionIndex]);

  const getProgress = useCallback(() => {
    return (answers.length / questions.length) * 100;
  }, [answers.length, questions.length]);

  const getScore = useCallback(() => {
    return {
      correct: score,
      total: questions.length,
      percentage: questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
    };
  }, [score, questions.length]);

  const isQuizComplete = useCallback(() => {
    return isComplete;
  }, [isComplete]);

  return {
    currentQuestion: getCurrentQuestion(),
    currentQuestionIndex,
    answers,
    score,
    isComplete,
    totalQuestions: questions.length,
    progress: getProgress(),
    submitAnswer,
    resetQuiz,
    getScore,
    isQuizComplete
  };
};