/**
 * Assessment Service - Adaptive assessment for Alphabet Mastery
 */

export class AssessmentService {
  constructor() {
    this.questions = [];
    this.answers = [];
    this.currentIndex = 0;
    this.score = 0;
    this.difficulty = 'easy';
    this.isComplete = false;
    this.letterPerformance = {};
    this.loadFromStorage();
  }

  /**
   * Load data from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem('assessment_data');
      if (data) {
        const parsed = JSON.parse(data);
        this.letterPerformance = parsed.letterPerformance || {};
        this.answers = parsed.answers || [];
      }
    } catch (error) {
      console.warn('Failed to load assessment data:', error);
    }
  }

  /**
   * Save data to localStorage
   */
  saveToStorage() {
    try {
      const data = {
        letterPerformance: this.letterPerformance,
        answers: this.answers
      };
      localStorage.setItem('assessment_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save assessment data:', error);
    }
  }

  /**
   * Generate adaptive assessment questions
   */
  generateAssessment(letterData, progressData) {
    const questions = [];
    
    // Letter Recognition Questions
    questions.push(...this.generateRecognitionQuestions(letterData, progressData));
    
    // Letter Sound Questions
    questions.push(...this.generateSoundQuestions(letterData, progressData));
    
    // Beginning Sound Questions
    questions.push(...this.generateBeginningSoundQuestions(letterData, progressData));
    
    // Vocabulary Questions
    questions.push(...this.generateVocabularyQuestions(letterData, progressData));
    
    // Simple Reading Questions
    questions.push(...this.generateReadingQuestions(letterData, progressData));
    
    // Word Building Questions
    questions.push(...this.generateWordBuildingQuestions(letterData, progressData));
    
    // Shuffle and limit questions
    const shuffled = this.shuffleArray(questions);
    this.questions = shuffled.slice(0, 20); // Max 20 questions
    this.currentIndex = 0;
    this.score = 0;
    this.isComplete = false;
    this.answers = [];
    
    return this.questions;
  }

  /**
   * Generate letter recognition questions
   */
  generateRecognitionQuestions(letterData, progressData) {
    const questions = [];
    const letters = Object.keys(letterData);
    
    for (const letter of letters) {
      if (Math.random() < 0.4) { // 40% chance per letter
        const options = this.getRandomLetters(letter, letters, 3);
        questions.push({
          id: `recog-${letter}`,
          type: 'recognition',
          letter: letter,
          question: `Which letter is this?`,
          display: letter,
          options: options,
          correct: options.indexOf(letter),
          difficulty: 'easy'
        });
      }
    }
    
    return questions;
  }

  /**
   * Generate letter sound questions
   */
  generateSoundQuestions(letterData, progressData) {
    const questions = [];
    const letters = Object.keys(letterData);
    
    for (const letter of letters) {
      if (Math.random() < 0.3) {
        const options = this.getRandomLetters(letter, letters, 3);
        questions.push({
          id: `sound-${letter}`,
          type: 'sound',
          letter: letter,
          question: `Which letter makes this sound?`,
          sound: letterData[letter]?.sound || letter,
          options: options,
          correct: options.indexOf(letter),
          difficulty: 'medium'
        });
      }
    }
    
    return questions;
  }

  /**
   * Generate beginning sound questions
   */
  generateBeginningSoundQuestions(letterData, progressData) {
    const questions = [];
    const letters = Object.keys(letterData);
    
    for (const letter of letters) {
      const vocab = letterData[letter]?.vocabulary || [];
      if (vocab.length > 0 && Math.random() < 0.3) {
        const word = vocab[Math.floor(Math.random() * vocab.length)];
        const options = this.getRandomLetters(letter, letters, 3);
        questions.push({
          id: `begin-${letter}`,
          type: 'beginning-sound',
          letter: letter,
          question: `What sound does "${word}" start with?`,
          word: word,
          options: options,
          correct: options.indexOf(letter),
          difficulty: 'medium'
        });
      }
    }
    
    return questions;
  }

  /**
   * Generate vocabulary questions
   */
  generateVocabularyQuestions(letterData, progressData) {
    const questions = [];
    const letters = Object.keys(letterData);
    
    for (const letter of letters) {
      const vocab = letterData[letter]?.vocabulary || [];
      if (vocab.length > 0 && Math.random() < 0.2) {
        const word = vocab[Math.floor(Math.random() * vocab.length)];
        const options = this.getRandomWords(word, vocab, 3);
        questions.push({
          id: `vocab-${letter}`,
          type: 'vocabulary',
          letter: letter,
          question: `What is this?`,
          display: word,
          options: options,
          correct: options.indexOf(word),
          difficulty: 'medium'
        });
      }
    }
    
    return questions;
  }

  /**
   * Generate simple reading questions
   */
  generateReadingQuestions(letterData, progressData) {
    const questions = [];
    const simpleWords = ['cat', 'dog', 'sun', 'hat', 'pig', 'box', 'bus', 'cup'];
    
    for (const word of simpleWords) {
      if (Math.random() < 0.2) {
        const letter = word[0].toUpperCase();
        const options = this.getRandomWords(word, simpleWords, 3);
        questions.push({
          id: `read-${word}`,
          type: 'reading',
          letter: letter,
          question: `Read this word:`,
          display: word,
          options: options,
          correct: options.indexOf(word),
          difficulty: 'hard'
        });
      }
    }
    
    return questions;
  }

  /**
   * Generate word building questions
   */
  generateWordBuildingQuestions(letterData, progressData) {
    const questions = [];
    const families = ['at', 'an', 'ig', 'op', 'ug', 'et', 'ot', 'en', 'in', 'un'];
    
    for (const family of families) {
      if (Math.random() < 0.2) {
        const words = this.getWordsByFamily(family);
        if (words.length > 0) {
          const word = words[Math.floor(Math.random() * words.length)];
          const letter = word[0].toUpperCase();
          const letters = word.split('');
          const shuffled = this.shuffleArray([...letters]);
          
          questions.push({
            id: `build-${word}`,
            type: 'word-building',
            letter: letter,
            question: `Build this word:`,
            word: word,
            letters: shuffled,
            correct: word,
            difficulty: 'hard'
          });
        }
      }
    }
    
    return questions;
  }

  /**
   * Submit answer for current question
   */
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
    
    // Update letter performance
    if (question.letter) {
      if (!this.letterPerformance[question.letter]) {
        this.letterPerformance[question.letter] = { correct: 0, total: 0 };
      }
      this.letterPerformance[question.letter].total++;
      if (isCorrect) {
        this.letterPerformance[question.letter].correct++;
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

  /**
   * Get current question
   */
  getCurrentQuestion() {
    if (this.currentIndex < this.questions.length) {
      return this.questions[this.currentIndex];
    }
    return null;
  }

  /**
   * Get assessment results
   */
  getResults() {
    const total = this.questions.length;
    const correct = this.score;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    let level = 'Bronze';
    if (percentage >= 90) level = 'Diamond';
    else if (percentage >= 80) level = 'Gold';
    else if (percentage >= 70) level = 'Silver';
    else if (percentage >= 50) level = 'Bronze';
    
    // Calculate mastery by letter
    const letterMastery = {};
    for (const [letter, data] of Object.entries(this.letterPerformance)) {
      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      letterMastery[letter] = {
        percentage: pct,
        level: this.getMasteryLevel(pct),
        correct: data.correct,
        total: data.total
      };
    }
    
    return {
      total,
      correct,
      percentage,
      level,
      letterMastery,
      answers: this.answers,
      isComplete: this.isComplete
    };
  }

  /**
   * Get mastery level based on percentage
   */
  getMasteryLevel(percentage) {
    if (percentage >= 90) return 'Master';
    if (percentage >= 80) return 'Diamond';
    if (percentage >= 70) return 'Gold';
    if (percentage >= 50) return 'Silver';
    return 'Bronze';
  }

  /**
   * Get random letters for options
   */
  getRandomLetters(target, allLetters, count) {
    const others = allLetters.filter(l => l !== target);
    const shuffled = this.shuffleArray(others);
    const selected = [target, ...shuffled.slice(0, count - 1)];
    return this.shuffleArray(selected);
  }

  /**
   * Get random words for options
   */
  getRandomWords(target, allWords, count) {
    const others = allWords.filter(w => w !== target);
    const shuffled = this.shuffleArray(others);
    const selected = [target, ...shuffled.slice(0, count - 1)];
    return this.shuffleArray(selected);
  }

  /**
   * Get words by family
   */
  getWordsByFamily(family) {
    const familyMap = {
      'at': ['cat', 'bat', 'hat', 'mat', 'sat', 'rat'],
      'an': ['man', 'fan', 'can', 'pan', 'van'],
      'ig': ['pig', 'dig', 'wig', 'big', 'fig'],
      'op': ['top', 'hop', 'pop', 'mop', 'cop'],
      'ug': ['bug', 'hug', 'mug', 'jug', 'rug'],
      'et': ['pet', 'vet', 'net', 'jet', 'get'],
      'ot': ['hot', 'pot', 'dot', 'not', 'got'],
      'en': ['pen', 'hen', 'ten', 'den', 'men'],
      'in': ['pin', 'win', 'tin', 'bin', 'gin'],
      'un': ['run', 'sun', 'fun', 'bun', 'gun']
    };
    return familyMap[family] || [];
  }

  /**
   * Utility: Shuffle array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Reset assessment
   */
  reset() {
    this.questions = [];
    this.answers = [];
    this.currentIndex = 0;
    this.score = 0;
    this.isComplete = false;
    this.saveToStorage();
  }

  /**
   * Get progress for assessment
   */
  getProgress() {
    if (this.questions.length === 0) return 0;
    return (this.currentIndex / this.questions.length) * 100;
  }
}

// Singleton instance
const assessmentService = new AssessmentService();
export default assessmentService;