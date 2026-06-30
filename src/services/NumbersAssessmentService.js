/**
 * Numbers Assessment Service - Adaptive assessment for Numbers Kingdom
 */

export class NumbersAssessmentService {
  constructor() {
    this.questions = [];
    this.answers = [];
    this.currentIndex = 0;
    this.score = 0;
    this.difficulty = 'easy';
    this.isComplete = false;
    this.numberPerformance = {};
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem('numbers_assessment_data');
      if (data) {
        const parsed = JSON.parse(data);
        this.numberPerformance = parsed.numberPerformance || {};
        this.answers = parsed.answers || [];
      }
    } catch (error) {
      console.warn('Failed to load numbers assessment data:', error);
    }
  }

  saveToStorage() {
    try {
      const data = {
        numberPerformance: this.numberPerformance,
        answers: this.answers
      };
      localStorage.setItem('numbers_assessment_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save numbers assessment data:', error);
    }
  }

  generateAssessment(numberData, progressData) {
    const questions = [];
    
    // Number Recognition
    questions.push(...this.generateRecognitionQuestions(numberData, progressData));
    
    // Counting Questions
    questions.push(...this.generateCountingQuestions(numberData, progressData));
    
    // Missing Number Questions
    questions.push(...this.generateMissingNumberQuestions(numberData, progressData));
    
    // Comparison Questions
    questions.push(...this.generateComparisonQuestions(numberData, progressData));
    
    // Word-Number Matching
    questions.push(...this.generateWordMatchQuestions(numberData, progressData));
    
    // Listening Questions
    questions.push(...this.generateListeningQuestions(numberData, progressData));
    
    // Simple Addition
    questions.push(...this.generateAdditionQuestions(numberData, progressData));
    
    // Simple Subtraction
    questions.push(...this.generateSubtractionQuestions(numberData, progressData));

    const shuffled = this.shuffleArray(questions);
    this.questions = shuffled.slice(0, 15);
    this.currentIndex = 0;
    this.score = 0;
    this.isComplete = false;
    this.answers = [];
    
    return this.questions;
  }

  generateRecognitionQuestions(numberData, progressData) {
    const questions = [];
    const numbers = Object.keys(numberData);
    
    for (const num of numbers) {
      if (Math.random() < 0.3) {
        const options = this.getRandomNumbers(num, numbers, 3);
        questions.push({
          id: `recog-${num}`,
          type: 'recognition',
          number: num,
          question: `Which number is this?`,
          display: num,
          options: options,
          correct: options.indexOf(num),
          difficulty: 'easy'
        });
      }
    }
    return questions;
  }

  generateCountingQuestions(numberData, progressData) {
    const questions = [];
    const max = 10;
    
    for (let i = 1; i <= max; i++) {
      if (Math.random() < 0.2) {
        const emojis = ['⭐', '🍎', '🐱', '🚗'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const options = this.getRandomNumbers(String(i), [], 3);
        questions.push({
          id: `count-${i}`,
          type: 'counting',
          number: i,
          question: `How many ${emoji} are there?`,
          display: emoji.repeat(i),
          options: options.map(Number),
          correct: options.indexOf(String(i)),
          difficulty: i > 5 ? 'medium' : 'easy'
        });
      }
    }
    return questions;
  }

  generateMissingNumberQuestions(numberData, progressData) {
    const questions = [];
    const max = 10;
    
    for (let start = 1; start <= max - 3; start++) {
      if (Math.random() < 0.2) {
        const missing = start + Math.floor(Math.random() * 3);
        const seq = [];
        for (let i = 0; i < 4; i++) {
          if (i === missing - start) continue;
          seq.push(start + i);
        }
        const options = this.getRandomNumbers(String(missing), [], 3);
        questions.push({
          id: `missing-${missing}`,
          type: 'missing-number',
          number: missing,
          question: `What number is missing? ${seq.join(' ')}`,
          options: options.map(Number),
          correct: options.indexOf(String(missing)),
          difficulty: 'medium'
        });
      }
    }
    return questions;
  }

  generateComparisonQuestions(numberData, progressData) {
    const questions = [];
    const max = 10;
    
    for (let i = 1; i <= max - 1; i++) {
      if (Math.random() < 0.15) {
        const a = i;
        const b = i + Math.floor(Math.random() * 3) + 1;
        const isBigger = Math.random() > 0.5;
        const question = isBigger ? `Which number is bigger?` : `Which number is smaller?`;
        const correct = isBigger ? Math.max(a, b) : Math.min(a, b);
        const options = this.getRandomNumbers(String(correct), [], 2);
        questions.push({
          id: `compare-${a}-${b}`,
          type: 'comparison',
          number: correct,
          question: question,
          display: `${a} or ${b}`,
          options: options.map(Number),
          correct: options.indexOf(String(correct)),
          difficulty: 'medium'
        });
      }
    }
    return questions;
  }

  generateWordMatchQuestions(numberData, progressData) {
    const questions = [];
    const numberWords = {
      '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
      '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten'
    };
    
    for (const [num, word] of Object.entries(numberWords)) {
      if (Math.random() < 0.2) {
        const options = this.getRandomWords(word, Object.values(numberWords), 3);
        questions.push({
          id: `word-${num}`,
          type: 'word-match',
          number: num,
          question: `Which number is "${word}"?`,
          options: options,
          correct: options.indexOf(num),
          difficulty: 'easy'
        });
      }
    }
    return questions;
  }

  generateListeningQuestions(numberData, progressData) {
    const questions = [];
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    
    for (const num of numbers) {
      if (Math.random() < 0.15) {
        const options = this.getRandomNumbers(num, numbers, 3);
        questions.push({
          id: `listen-${num}`,
          type: 'listening',
          number: num,
          question: `Listen and find the number`,
          audio: num,
          options: options.map(Number),
          correct: options.indexOf(num),
          difficulty: 'medium'
        });
      }
    }
    return questions;
  }

  generateAdditionQuestions(numberData, progressData) {
    const questions = [];
    const max = 5;
    
    for (let i = 1; i <= max; i++) {
      for (let j = 1; j <= max; j++) {
        if (i + j <= 10 && Math.random() < 0.1) {
          const answer = i + j;
          const options = this.getRandomNumbers(String(answer), [], 3);
          questions.push({
            id: `add-${i}-${j}`,
            type: 'addition',
            number: answer,
            question: `${i} + ${j} = ?`,
            options: options.map(Number),
            correct: options.indexOf(String(answer)),
            difficulty: answer > 5 ? 'hard' : 'medium'
          });
        }
      }
    }
    return questions;
  }

  generateSubtractionQuestions(numberData, progressData) {
    const questions = [];
    const max = 5;
    
    for (let i = max; i >= 1; i--) {
      for (let j = 1; j < i; j++) {
        if (i - j >= 0 && Math.random() < 0.1) {
          const answer = i - j;
          const options = this.getRandomNumbers(String(answer), [], 3);
          questions.push({
            id: `sub-${i}-${j}`,
            type: 'subtraction',
            number: answer,
            question: `${i} - ${j} = ?`,
            options: options.map(Number),
            correct: options.indexOf(String(answer)),
            difficulty: answer > 3 ? 'hard' : 'medium'
          });
        }
      }
    }
    return questions;
  }

  getRandomNumbers(target, allNumbers, count) {
    const available = allNumbers.length > 0 ? allNumbers : ['1','2','3','4','5','6','7','8','9','10'];
    const others = available.filter(n => n !== target);
    const shuffled = this.shuffleArray(others);
    const selected = [target, ...shuffled.slice(0, count - 1)];
    return this.shuffleArray(selected);
  }

  getRandomWords(target, allWords, count) {
    const others = allWords.filter(w => w !== target);
    const shuffled = this.shuffleArray(others);
    const selected = [target, ...shuffled.slice(0, count - 1)];
    return this.shuffleArray(selected);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  submitAnswer(answer) {
    if (this.isComplete || this.currentIndex >= this.questions.length) return null;
    
    const question = this.questions[this.currentIndex];
    const isCorrect = answer === question.correct;
    
    this.answers.push({
      questionId: question.id,
      type: question.type,
      isCorrect,
      answer,
      correctAnswer: question.options[question.correct]
    });
    
    if (isCorrect) {
      this.score++;
    }
    
    // Update number performance
    if (question.number) {
      if (!this.numberPerformance[question.number]) {
        this.numberPerformance[question.number] = { correct: 0, total: 0 };
      }
      this.numberPerformance[question.number].total++;
      if (isCorrect) {
        this.numberPerformance[question.number].correct++;
      }
    }
    
    this.currentIndex++;
    
    if (this.currentIndex >= this.questions.length) {
      this.isComplete = true;
    }
    
    this.saveToStorage();
    
    return {
      isCorrect,
      currentScore: this.score,
      totalQuestions: this.questions.length,
      isComplete: this.isComplete
    };
  }

  getCurrentQuestion() {
    if (this.currentIndex < this.questions.length) {
      return this.questions[this.currentIndex];
    }
    return null;
  }

  getResults() {
    const total = this.questions.length;
    const correct = this.score;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    let level = 'Bronze';
    if (percentage >= 90) level = 'Master';
    else if (percentage >= 80) level = 'Diamond';
    else if (percentage >= 70) level = 'Gold';
    else if (percentage >= 50) level = 'Silver';
    
    // Calculate number mastery
    const numberMastery = {};
    for (const [num, data] of Object.entries(this.numberPerformance)) {
      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      numberMastery[num] = {
        percentage: pct,
        level: pct >= 80 ? 'Mastered' : pct >= 50 ? 'In Progress' : 'Needs Practice',
        correct: data.correct,
        total: data.total
      };
    }
    
    return {
      total,
      correct,
      percentage,
      level,
      numberMastery,
      answers: this.answers,
      isComplete: this.isComplete
    };
  }

  reset() {
    this.questions = [];
    this.answers = [];
    this.currentIndex = 0;
    this.score = 0;
    this.isComplete = false;
    this.saveToStorage();
  }
}

export default new NumbersAssessmentService();