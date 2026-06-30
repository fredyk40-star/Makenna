/**
 * Tracing Engine - Core tracing and validation logic
 * Supports uppercase, lowercase, numbers, shapes, words, and sentences
 */

export class TracingEngine {
  constructor() {
    this.strokeData = new Map();
    this.pathData = new Map();
    this.guidePoints = new Map();
    this.strokeOrder = new Map();
    this.letterPaths = this.initializeLetterPaths();
  }

  /**
   * Initialize letter path data for all uppercase and lowercase letters
   * Each letter is defined as a series of strokes with start/end points
   */
  initializeLetterPaths() {
    // This is a simplified version - in production, this would be more detailed
    // with actual bezier curves and precise stroke data
    const paths = {};
    
    // Uppercase letters - simplified stroke data
    const uppercasePaths = this.generateUppercasePaths();
    const lowercasePaths = this.generateLowercasePaths();
    
    return { ...uppercasePaths, ...lowercasePaths };
  }

  /**
   * Generate uppercase letter paths
   */
  generateUppercasePaths() {
    const paths = {};
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (const letter of letters) {
      paths[letter] = this.generateLetterPath(letter, 'uppercase');
    }
    
    return paths;
  }

  /**
   * Generate lowercase letter paths
   */
  generateLowercasePaths() {
    const paths = {};
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    
    for (const letter of letters) {
      paths[letter] = this.generateLetterPath(letter, 'lowercase');
    }
    
    return paths;
  }

  /**
   * Generate path data for a specific letter
   * This is a simplified generator - production would use actual coordinate data
   */
  generateLetterPath(letter, caseType) {
    // Generate a simple path based on letter shape
    const strokes = [];
    const numStrokes = this.getStrokeCount(letter, caseType);
    
    for (let i = 0; i < numStrokes; i++) {
      strokes.push({
        id: `stroke-${i}`,
        order: i,
        points: this.generateStrokePoints(letter, i, caseType),
        startPoint: { x: 10 + (i * 20), y: 10 },
        endPoint: { x: 10 + (i * 20), y: 50 },
        direction: i % 2 === 0 ? 'down' : 'up',
        completed: false
      });
    }
    
    return {
      letter,
      caseType,
      strokes,
      totalStrokes: numStrokes,
      bounds: {
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100
      }
    };
  }

  /**
   * Get number of strokes for a letter
   */
  getStrokeCount(letter, caseType) {
    // Simplified stroke count
    const counts = {
      'A': 3, 'B': 3, 'C': 1, 'D': 2, 'E': 4, 'F': 3, 'G': 2,
      'H': 3, 'I': 3, 'J': 2, 'K': 3, 'L': 2, 'M': 4, 'N': 3,
      'O': 1, 'P': 2, 'Q': 2, 'R': 3, 'S': 1, 'T': 2, 'U': 2,
      'V': 2, 'W': 4, 'X': 2, 'Y': 3, 'Z': 3,
      'a': 2, 'b': 2, 'c': 1, 'd': 2, 'e': 1, 'f': 2, 'g': 2,
      'h': 2, 'i': 2, 'j': 2, 'k': 2, 'l': 1, 'm': 3, 'n': 2,
      'o': 1, 'p': 2, 'q': 2, 'r': 2, 's': 1, 't': 2, 'u': 2,
      'v': 2, 'w': 4, 'x': 2, 'y': 2, 'z': 2
    };
    
    return counts[letter] || 2;
  }

  /**
   * Generate stroke points for a letter
   */
  generateStrokePoints(letter, strokeIndex, caseType) {
    // Generate sample points along a path
    const points = [];
    const numPoints = 20 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      const x = 10 + (t * 80) + (Math.random() - 0.5) * 5;
      const y = 10 + (t * 80) + (Math.random() - 0.5) * 5;
      points.push({ x, y, t });
    }
    
    return points;
  }

  /**
   * Get letter path data
   */
  getLetterPath(letter, caseType = 'uppercase') {
    const key = caseType === 'uppercase' ? letter.toUpperCase() : letter.toLowerCase();
    return this.letterPaths[key] || this.generateLetterPath(letter, caseType);
  }

  /**
   * Validate a trace against the correct path
   */
  validateTrace(tracePoints, letter, caseType = 'uppercase') {
    const path = this.getLetterPath(letter, caseType);
    if (!path) return { valid: false, score: 0, errors: ['Path not found'] };

    // Calculate accuracy
    const accuracy = this.calculateAccuracy(tracePoints, path);
    
    // Calculate completion
    const completion = this.calculateCompletion(tracePoints, path);
    
    // Check direction
    const directionCorrect = this.checkDirection(tracePoints, path);
    
    // Check order
    const orderCorrect = this.checkOrder(tracePoints, path);

    // Calculate overall score
    const score = (accuracy * 0.4 + completion * 0.3 + (directionCorrect ? 0.15 : 0) + (orderCorrect ? 0.15 : 0));

    return {
      valid: score >= 0.6,
      score: Math.min(1, score),
      accuracy,
      completion,
      directionCorrect,
      orderCorrect,
      errors: this.generateErrors(accuracy, completion, directionCorrect, orderCorrect)
    };
  }

  /**
   * Calculate trace accuracy
   */
  calculateAccuracy(tracePoints, path) {
    if (tracePoints.length === 0 || path.strokes.length === 0) return 0;
    
    // For each trace point, find nearest path point and calculate distance
    let totalDeviation = 0;
    let matchedPoints = 0;
    
    for (const tracePoint of tracePoints) {
      let minDistance = Infinity;
      for (const stroke of path.strokes) {
        for (const pathPoint of stroke.points) {
          const distance = this.distance(tracePoint, pathPoint);
          if (distance < minDistance) {
            minDistance = distance;
          }
        }
      }
      if (minDistance < 20) { // Threshold for acceptable deviation
        totalDeviation += minDistance;
        matchedPoints++;
      }
    }
    
    const accuracy = matchedPoints / tracePoints.length;
    const avgDeviation = matchedPoints > 0 ? totalDeviation / matchedPoints : Infinity;
    
    // Convert deviation to a score (0-1)
    const deviationScore = Math.max(0, 1 - (avgDeviation / 30));
    
    return (accuracy * 0.6 + deviationScore * 0.4);
  }

  /**
   * Calculate completion percentage
   */
  calculateCompletion(tracePoints, path) {
    if (tracePoints.length === 0 || path.strokes.length === 0) return 0;
    
    // Count how much of the path has been covered
    let coveredLength = 0;
    let totalLength = 0;
    
    for (const stroke of path.strokes) {
      totalLength += stroke.points.length;
      for (const pathPoint of stroke.points) {
        for (const tracePoint of tracePoints) {
          if (this.distance(tracePoint, pathPoint) < 15) {
            coveredLength++;
            break;
          }
        }
      }
    }
    
    return Math.min(1, coveredLength / totalLength);
  }

  /**
   * Check if tracing direction is correct
   */
  checkDirection(tracePoints, path) {
    if (tracePoints.length < 2) return false;
    
    // Simplified direction checking
    const traceDirection = this.getDirection(tracePoints);
    const pathDirection = this.getDirection(path.strokes[0]?.points || []);
    
    const angleDiff = Math.abs(traceDirection - pathDirection);
    return angleDiff < Math.PI / 4 || angleDiff > 7 * Math.PI / 4;
  }

  /**
   * Check if stroke order is correct
   */
  checkOrder(tracePoints, path) {
    if (tracePoints.length === 0 || path.strokes.length === 0) return true;
    
    // Simplified: check if trace follows stroke order
    let strokeIndex = 0;
    let pointsInStroke = 0;
    
    for (const tracePoint of tracePoints) {
      if (strokeIndex < path.strokes.length) {
        const stroke = path.strokes[strokeIndex];
        for (const pathPoint of stroke.points) {
          if (this.distance(tracePoint, pathPoint) < 15) {
            pointsInStroke++;
            break;
          }
        }
        if (pointsInStroke > stroke.points.length * 0.5) {
          strokeIndex++;
          pointsInStroke = 0;
        }
      }
    }
    
    return strokeIndex >= path.strokes.length - 1;
  }

  /**
   * Get direction of a set of points
   */
  getDirection(points) {
    if (points.length < 2) return 0;
    const first = points[0];
    const last = points[points.length - 1];
    return Math.atan2(last.y - first.y, last.x - first.x);
  }

  /**
   * Calculate distance between two points
   */
  distance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Generate error messages based on trace quality
   */
  generateErrors(accuracy, completion, directionCorrect, orderCorrect) {
    const errors = [];
    
    if (accuracy < 0.5) {
      errors.push('Try to stay on the line');
    }
    if (completion < 0.5) {
      errors.push('Complete the whole letter');
    }
    if (!directionCorrect) {
      errors.push('Try tracing the letter in the right direction');
    }
    if (!orderCorrect) {
      errors.push('Follow the stroke order shown');
    }
    
    return errors;
  }

  /**
   * Get stroke guide points for a letter
   */
  getGuidePoints(letter, caseType = 'uppercase') {
    const path = this.getLetterPath(letter, caseType);
    if (!path) return [];
    
    const guidePoints = [];
    for (const stroke of path.strokes) {
      guidePoints.push({
        start: stroke.startPoint,
        end: stroke.endPoint,
        direction: stroke.direction,
        order: stroke.order
      });
    }
    
    return guidePoints;
  }

  /**
   * Get stroke animation data
   */
  getStrokeAnimation(letter, caseType = 'uppercase') {
    const path = this.getLetterPath(letter, caseType);
    if (!path) return null;
    
    return {
      strokes: path.strokes.map(stroke => ({
        id: stroke.id,
        points: stroke.points,
        duration: 1000 + (stroke.points.length * 20),
        delay: stroke.order * 300
      })),
      totalDuration: path.strokes.length * 300 + 1000 + (path.strokes[0]?.points.length || 10) * 20
    };
  }

  /**
   * Get difficulty settings
   */
  getDifficultySettings(difficulty = 'medium') {
    const settings = {
      easy: {
        lineWidth: 8,
        snapDistance: 20,
        guideOpacity: 0.8,
        showArrows: true,
        showDots: true,
        assistance: 'high'
      },
      medium: {
        lineWidth: 5,
        snapDistance: 12,
        guideOpacity: 0.6,
        showArrows: true,
        showDots: true,
        assistance: 'medium'
      },
      hard: {
        lineWidth: 3,
        snapDistance: 5,
        guideOpacity: 0.3,
        showArrows: false,
        showDots: false,
        assistance: 'low'
      }
    };
    
    return settings[difficulty] || settings.medium;
  }
}

// Singleton instance
const tracingEngine = new TracingEngine();
export default tracingEngine;