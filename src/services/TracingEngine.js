/**
 * Tracing Engine - stroke guides and validation for handwriting practice.
 *
 * All guide/validation coordinates are normalized to a 0-100 box so they work
 * at any canvas size and device pixel ratio.
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const strokeDirection = (start, end) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'down' : 'up';
};

/** Sample a polyline into evenly spaced points for smooth guides and checks. */
const sampleStroke = (controls, count = 18) => {
  const lengths = [];
  let total = 0;

  for (let i = 1; i < controls.length; i += 1) {
    const length = Math.hypot(controls[i][0] - controls[i - 1][0], controls[i][1] - controls[i - 1][1]);
    lengths.push(length);
    total += length;
  }

  if (total === 0) {
    return controls.map(([x, y], index) => ({
      x,
      y,
      t: controls.length === 1 ? 0 : index / (controls.length - 1),
    }));
  }

  return Array.from({ length: count }, (_, index) => {
    let remaining = (index / (count - 1)) * total;
    let segment = 0;

    while (segment < lengths.length - 1 && remaining > lengths[segment]) {
      remaining -= lengths[segment];
      segment += 1;
    }

    const ratio = lengths[segment] ? clamp(remaining / lengths[segment], 0, 1) : 0;
    const [startX, startY] = controls[segment];
    const [endX, endY] = controls[segment + 1];

    return {
      x: startX + (endX - startX) * ratio,
      y: startY + (endY - startY) * ratio,
      t: index / (count - 1),
    };
  });
};

// Each entry is a list of strokes; each stroke is a list of [x, y] control points.
const UPPERCASE_STROKES = {
  A: [[[50, 10], [15, 90]], [[50, 10], [85, 90]], [[28, 60], [72, 60]]],
  B: [[[25, 10], [25, 90]], [[25, 10], [58, 10], [76, 22], [76, 36], [58, 48], [25, 48]],
    [[25, 48], [62, 48], [80, 60], [80, 76], [62, 90], [25, 90]]],
  C: [[[80, 22], [64, 10], [40, 12], [20, 30], [20, 70], [40, 88], [64, 90], [80, 78]]],
  D: [[[20, 10], [20, 90]], [[20, 10], [55, 10], [80, 28], [80, 72], [55, 90], [20, 90]]],
  E: [[[76, 10], [20, 10], [20, 90], [76, 90]], [[20, 50], [66, 50]]],
  F: [[[22, 10], [22, 90]], [[22, 10], [76, 10]], [[22, 50], [66, 50]]],
  G: [[[80, 26], [64, 10], [38, 12], [20, 30], [20, 70], [38, 88], [64, 90], [80, 76],
    [80, 55], [55, 55]]],
  H: [[[22, 10], [22, 90]], [[78, 10], [78, 90]], [[22, 50], [78, 50]]],
  I: [[[50, 10], [50, 90]], [[30, 10], [70, 10]], [[30, 90], [70, 90]]],
  J: [[[68, 10], [68, 70], [52, 88], [32, 88], [18, 72]]],
  K: [[[22, 10], [22, 90]], [[80, 10], [22, 56]], [[38, 42], [82, 90]]],
  L: [[[25, 10], [25, 90], [78, 90]]],
  M: [[[15, 90], [15, 10], [50, 56], [85, 10], [85, 90]]],
  N: [[[20, 90], [20, 10], [80, 90], [80, 10]]],
  O: [[[50, 10], [28, 22], [18, 45], [18, 70], [35, 90], [65, 90], [82, 70], [82, 45],
    [72, 22], [50, 10]]],
  P: [[[22, 90], [22, 10], [62, 10], [78, 22], [78, 42], [62, 52], [22, 52]]],
  Q: [[[50, 10], [28, 22], [18, 45], [18, 70], [35, 90], [65, 90], [82, 70], [82, 45],
    [72, 22], [50, 10]], [[55, 68], [82, 92]]],
  R: [[[22, 90], [22, 10], [62, 10], [78, 22], [78, 42], [62, 52], [22, 52]],
    [[55, 52], [82, 90]]],
  S: [[[76, 20], [60, 10], [34, 14], [22, 30], [40, 45], [62, 50], [78, 66], [68, 84],
    [44, 92], [22, 80]]],
  T: [[[15, 10], [85, 10]], [[50, 10], [50, 90]]],
  U: [[[20, 10], [20, 65], [35, 88], [65, 88], [80, 65], [80, 10]]],
  V: [[[15, 10], [50, 90], [85, 10]]],
  W: [[[10, 10], [26, 90], [50, 40], [74, 90], [90, 10]]],
  X: [[[18, 10], [82, 90]], [[82, 10], [18, 90]]],
  Y: [[[15, 10], [50, 48], [85, 10]], [[50, 48], [50, 90]]],
  Z: [[[18, 10], [82, 10], [18, 90], [82, 90]]],
};

const LOWERCASE_STROKES = {
  a: [[[64, 30], [46, 18], [28, 32], [28, 66], [42, 82], [60, 74], [66, 56], [46, 42],
    [30, 54], [30, 70], [46, 82], [66, 72]]],
  b: [[[22, 10], [22, 90]], [[22, 54], [44, 74], [64, 64], [72, 44], [60, 24], [40, 22],
    [22, 40]]],
  c: [[[76, 28], [55, 18], [32, 28], [24, 50], [28, 72], [48, 84], [70, 74]]],
  d: [[[68, 30], [48, 18], [28, 32], [28, 64], [45, 80], [65, 72], [70, 52], [50, 38],
    [30, 50]], [[72, 10], [72, 90]]],
  e: [[[24, 56], [72, 56], [70, 72], [50, 84], [30, 76], [22, 60], [32, 44], [52, 38],
    [70, 46]]],
  f: [[[66, 12], [42, 18], [30, 40], [30, 78], [42, 88]], [[18, 48], [62, 48]]],
  g: [[[68, 28], [48, 18], [28, 32], [28, 64], [45, 80], [65, 72], [68, 50], [48, 38],
    [30, 50]], [[68, 30], [68, 82], [55, 95], [34, 92]]],
  h: [[[22, 10], [22, 90]], [[22, 48], [40, 68], [60, 60], [68, 40], [68, 90]]],
  i: [[[46, 26], [46, 90]], [[42, 10], [52, 10], [52, 17], [42, 17], [42, 10]]],
  j: [[[56, 26], [56, 78], [42, 92], [24, 88]], [[52, 10], [62, 10]]],
  k: [[[22, 10], [22, 90]], [[66, 44], [22, 62]], [[36, 50], [70, 90]]],
  l: [[[35, 10], [35, 90]]],
  m: [[[18, 88], [18, 40], [35, 62], [50, 40], [50, 88]],
    [[50, 54], [68, 62], [82, 40], [82, 88]]],
  n: [[[22, 88], [22, 40]], [[22, 52], [42, 66], [62, 58], [68, 38], [68, 88]]],
  o: [[[50, 22], [30, 32], [24, 52], [30, 72], [50, 82], [70, 72], [76, 52], [70, 32],
    [50, 22]]],
  p: [[[22, 94], [22, 30]], [[22, 32], [45, 20], [65, 30], [70, 48], [60, 62], [40, 62],
    [22, 50]]],
  q: [[[65, 32], [45, 20], [28, 32], [28, 58], [45, 70], [65, 58], [65, 38], [45, 28]],
    [[68, 30], [68, 94]]],
  r: [[[22, 88], [22, 38]], [[22, 54], [38, 68], [58, 60], [66, 44]]],
  s: [[[68, 26], [50, 18], [30, 28], [28, 45], [48, 52], [65, 60], [65, 76], [45, 86],
    [25, 76]]],
  t: [[[45, 12], [45, 78], [58, 88]], [[25, 42], [65, 42]]],
  u: [[[22, 30], [22, 64], [38, 82], [58, 70], [68, 42], [68, 88]]],
  v: [[[20, 30], [45, 88], [70, 30]]],
  w: [[[12, 30], [28, 88], [45, 48], [62, 88], [78, 30]]],
  x: [[[22, 30], [70, 88]], [[70, 30], [22, 88]]],
  y: [[[20, 30], [45, 68], [70, 30]], [[45, 68], [35, 92], [18, 88]]],
  z: [[[22, 30], [70, 30], [22, 88], [72, 88]]],
};

export class TracingEngine {
  constructor() {
    this.strokeData = new Map();
    this.pathData = new Map();
    this.guidePoints = new Map();
    this.strokeOrder = new Map();
    this.letterPaths = this.initializeLetterPaths();
  }

  initializeLetterPaths() {
    const paths = {};

    for (const [letter, strokes] of Object.entries(UPPERCASE_STROKES)) {
      paths[letter] = this.buildPath(letter, 'uppercase', strokes);
    }
    for (const [letter, strokes] of Object.entries(LOWERCASE_STROKES)) {
      paths[letter] = this.buildPath(letter, 'lowercase', strokes);
    }

    return paths;
  }

  buildPath(letter, caseType, strokes) {
    return {
      letter,
      caseType,
      strokes: strokes.map((controls, order) => {
        const points = sampleStroke(controls);
        const start = points[0];
        const end = points[points.length - 1];

        return {
          id: `stroke-${order}`,
          order,
          points,
          startPoint: { x: start.x, y: start.y },
          endPoint: { x: end.x, y: end.y },
          direction: strokeDirection(start, end),
          completed: false,
        };
      }),
      totalStrokes: strokes.length,
      bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    };
  }

  getStrokeCount(letter, caseType = 'uppercase') {
    return this.getLetterPath(letter, caseType).strokes.length;
  }

  getLetterPath(letter, caseType = 'uppercase') {
    const key = caseType === 'uppercase' ? String(letter || '').toUpperCase() : String(letter || '').toLowerCase();
    return this.letterPaths[key]
      || this.letterPaths[key?.toUpperCase()]
      || this.buildPath(key || 'A', caseType, UPPERCASE_STROKES.A);
  }

  /** Validate a trace. Points must be normalized to the 0-100 guide box. */
  validateTrace(tracePoints, letter, caseType = 'uppercase', options = {}) {
    const path = this.getLetterPath(letter, caseType);
    const tolerance = options.tolerance ?? this.getDifficultySettings(options.difficulty).tolerance;
    const points = Array.isArray(tracePoints) ? tracePoints : [];

    if (points.length < 6) {
      return {
        valid: false, score: 0, accuracy: 0, completion: 0,
        directionCorrect: false, orderCorrect: false,
        errors: ['Trace more of the letter'],
      };
    }

    const accuracy = this.calculateAccuracy(points, path, tolerance);
    const completion = this.calculateCompletion(points, path, tolerance);
    const coverage = this.getStrokeCoverage(points, path, tolerance);
    const minCoverage = coverage.length ? Math.min(...coverage) : 0;
    const directionCorrect = this.checkDirection(points, path);
    const orderCorrect = this.checkOrder(points, path);
    const score = clamp(completion * 0.55 + accuracy * 0.45, 0, 1);

    return {
      valid: score >= 0.62 && completion >= 0.55 && minCoverage >= 0.3,
      score,
      accuracy,
      completion,
      directionCorrect,
      orderCorrect,
      errors: this.generateErrors(accuracy, completion),
    };
  }

  /** Live progress helper - how much of the guide has been covered so far. */
  getTraceProgress(tracePoints, letter, caseType = 'uppercase', tolerance = 13) {
    const points = Array.isArray(tracePoints) ? tracePoints : [];
    if (points.length === 0) return 0;
    return this.calculateCompletion(points, this.getLetterPath(letter, caseType), tolerance);
  }

  getStrokeCoverage(tracePoints, path, tolerance) {
    return path.strokes.map(stroke => (
      stroke.points.filter(point => tracePoints.some(tracePoint => (
        this.distance(tracePoint, point) <= tolerance
      ))).length / stroke.points.length
    ));
  }

  calculateAccuracy(tracePoints, path, tolerance = 13) {
    if (tracePoints.length === 0 || path.strokes.length === 0) return 0;

    let matched = 0;
    let totalDeviation = 0;
    const limit = tolerance * 1.6;

    for (const tracePoint of tracePoints) {
      let minDistance = Infinity;
      for (const stroke of path.strokes) {
        for (const pathPoint of stroke.points) {
          const distance = this.distance(tracePoint, pathPoint);
          if (distance < minDistance) minDistance = distance;
        }
      }

      if (minDistance <= limit) {
        matched += 1;
        totalDeviation += minDistance;
      }
    }

    const closeness = matched > 0 ? clamp(1 - (totalDeviation / matched) / limit, 0, 1) : 0;
    return (matched / tracePoints.length) * 0.6 + closeness * 0.4;
  }

  calculateCompletion(tracePoints, path, tolerance = 13) {
    if (tracePoints.length === 0 || path.strokes.length === 0) return 0;
    const coverage = this.getStrokeCoverage(tracePoints, path, tolerance);
    return coverage.reduce((sum, value) => sum + value, 0) / coverage.length;
  }

  checkDirection(tracePoints, path) {
    if (tracePoints.length < 2) return false;

    const coveredStroke = path.strokes.reduce((best, stroke, index) => {
      const covered = stroke.points.filter(point => (
        tracePoints.some(tracePoint => this.distance(tracePoint, point) <= 14)
      )).length;
      return covered > best.covered ? { covered, index } : best;
    }, { covered: -1, index: 0 });

    const strokeDirectionAngle = this.getDirection(path.strokes[coveredStroke.index]?.points || []);
    const angleDiff = Math.abs(this.getDirection(tracePoints) - strokeDirectionAngle);
    return Math.min(angleDiff, Math.PI * 2 - angleDiff) < Math.PI / 2;
  }

  checkOrder(tracePoints, path) {
    if (tracePoints.length < 2) return true;

    let previous = -1;
    let inOrder = 0;

    for (const tracePoint of tracePoints) {
      let nearest = 0;
      let minDistance = Infinity;

      path.strokes.forEach((stroke, index) => {
        for (const point of stroke.points) {
          const distance = this.distance(tracePoint, point);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = index;
          }
        }
      });

      if (nearest >= previous) inOrder += 1;
      previous = nearest;
    }

    return inOrder / tracePoints.length >= 0.6;
  }

  getDirection(points) {
    if (points.length < 2) return 0;
    const first = points[0];
    const last = points[points.length - 1];
    return Math.atan2(last.y - first.y, last.x - first.x);
  }

  distance(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  generateErrors(accuracy, completion) {
    const errors = [];
    if (accuracy < 0.5) errors.push('Try to stay on the line');
    if (completion < 0.55) errors.push('Trace the whole letter');
    return errors;
  }

  getGuidePoints(letter, caseType = 'uppercase') {
    const path = this.getLetterPath(letter, caseType);

    return path.strokes.map(stroke => ({
      start: stroke.startPoint,
      end: stroke.endPoint,
      direction: stroke.direction,
      order: stroke.order,
      points: stroke.points,
    }));
  }

  getStrokeAnimation(letter, caseType = 'uppercase') {
    const path = this.getLetterPath(letter, caseType);

    return {
      strokes: path.strokes.map(stroke => ({
        id: stroke.id,
        points: stroke.points,
        duration: 900 + stroke.points.length * 18,
        delay: stroke.order * 320,
      })),
      totalDuration: path.strokes.reduce((total, stroke) => total + 320 + stroke.points.length * 18, 900),
    };
  }

  getDifficultySettings(difficulty = 'medium') {
    const settings = {
      easy: {
        lineWidth: 8, snapDistance: 20, guideOpacity: 0.8,
        showArrows: true, showDots: true, assistance: 'high', tolerance: 17,
      },
      medium: {
        lineWidth: 5, snapDistance: 12, guideOpacity: 0.6,
        showArrows: true, showDots: true, assistance: 'medium', tolerance: 13,
      },
      hard: {
        lineWidth: 3, snapDistance: 5, guideOpacity: 0.3,
        showArrows: false, showDots: false, assistance: 'low', tolerance: 9,
      },
    };

    return settings[difficulty] || settings.medium;
  }
}

const tracingEngine = new TracingEngine();
export default tracingEngine;
