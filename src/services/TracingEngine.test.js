import { describe, expect, it } from 'vitest';
import tracingEngine from './TracingEngine';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

describe('TracingEngine', () => {
  it('provides real, in-bounds strokes for every uppercase and lowercase letter', () => {
    for (const letter of LETTERS) {
      for (const caseType of ['uppercase', 'lowercase']) {
        const path = tracingEngine.getLetterPath(letter, caseType);
        expect(path.strokes.length).toBeGreaterThan(0);

        for (const stroke of path.strokes) {
          expect(stroke.points.length).toBeGreaterThan(1);
          for (const point of stroke.points) {
            expect(point.x).toBeGreaterThanOrEqual(0);
            expect(point.x).toBeLessThanOrEqual(100);
            expect(point.y).toBeGreaterThanOrEqual(0);
            expect(point.y).toBeLessThanOrEqual(100);
          }
          expect(['up', 'down', 'left', 'right']).toContain(stroke.direction);
        }
      }
    }
  });

  it('accepts a faithful trace and rejects a random scribble', () => {
    const path = tracingEngine.getLetterPath('A', 'uppercase');
    const faithful = path.strokes.flatMap(stroke => stroke.points).filter((_, index) => index % 2 === 0);
    const result = tracingEngine.validateTrace(faithful, 'A', 'uppercase', { tolerance: 13 });

    expect(result.valid).toBe(true);
    expect(result.score).toBeGreaterThan(0.6);
    expect(result.completion).toBeGreaterThan(0.55);

    const scribble = [
      { x: 5, y: 5 }, { x: 95, y: 95 }, { x: 5, y: 95 }, { x: 95, y: 5 },
      { x: 10, y: 10 }, { x: 90, y: 90 }, { x: 20, y: 20 }, { x: 80, y: 80 },
    ];
    expect(tracingEngine.validateTrace(scribble, 'A', 'uppercase', { tolerance: 13 }).valid).toBe(false);
  });

  it('gives different letters different guides', () => {
    const shapeOf = letter => tracingEngine.getLetterPath(letter, 'uppercase').strokes
      .map(stroke => stroke.points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(';'))
      .join('|');

    expect(shapeOf('A')).not.toBe(shapeOf('B'));
    expect(shapeOf('O')).not.toBe(shapeOf('X'));
  });

  it('uses tighter tolerance for harder difficulty', () => {
    const easy = tracingEngine.getDifficultySettings('easy');
    const hard = tracingEngine.getDifficultySettings('hard');
    expect(hard.tolerance).toBeLessThan(easy.tolerance);
  });

  it('reports live progress while a trace is incomplete', () => {
    const path = tracingEngine.getLetterPath('I', 'uppercase');
    const partial = path.strokes[0].points.slice(0, 4);
    const progress = tracingEngine.getTraceProgress(partial, 'I', 'uppercase', 13);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(1);
  });
});
