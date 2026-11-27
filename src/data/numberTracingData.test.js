import { describe, expect, it } from 'vitest';
import {
  getNumberTracingData,
  getNumberStrokeCount
} from './numberTracingData';

describe('Number Tracing Data', () => {
  it('provides tracing data for every number 0-100', () => {
    for (let n = 0; n <= 100; n += 1) {
      const data = getNumberTracingData(n);
      expect(data).not.toBeNull();
      expect(data.strokes.length).toBeGreaterThan(0);
    }
  });

  it('returns null for numbers outside the range', () => {
    expect(getNumberTracingData(-1)).toBeNull();
    expect(getNumberTracingData(101)).toBeNull();
    expect(getNumberTracingData(999)).toBeNull();
  });

  it('every stroke has valid points within the 0-100 box', () => {
    for (let n = 0; n <= 100; n += 1) {
      const data = getNumberTracingData(n);
      for (const stroke of data.strokes) {
        expect(stroke.points.length).toBeGreaterThan(1);
        expect(stroke.startPoint).toBeDefined();
        expect(stroke.endPoint).toBeDefined();
        for (const point of stroke.points) {
          expect(point.x).toBeGreaterThanOrEqual(0);
          expect(point.x).toBeLessThanOrEqual(100);
          expect(point.y).toBeGreaterThanOrEqual(0);
          expect(point.y).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('stroke count equals the sum of its digits stroke counts', () => {
    // Digit stroke counts: 0=1, 1=1, 2=1, 3=1, 4=2, 5=1, 6=1, 7=2, 8=1, 9=1
    expect(getNumberStrokeCount(5)).toBe(1);
    expect(getNumberStrokeCount(42)).toBe(3); // 4 (2 strokes) + 2 (1 stroke)
    expect(getNumberStrokeCount(100)).toBe(3); // 1 + 0 + 0
    expect(getNumberStrokeCount(11)).toBe(2); // 1 + 1
    expect(getNumberStrokeCount(7)).toBe(2); // hand-designed 7 has 2 strokes
  });

  it('getNumberStrokeCount matches strokes.length', () => {
    for (let n = 0; n <= 100; n += 1) {
      const data = getNumberTracingData(n);
      expect(getNumberStrokeCount(n)).toBe(data.strokes.length);
    }
  });

  it('keeps original 0-10 hand-designed strokes intact', () => {
    expect(getNumberTracingData(0).strokes[0].points[0]).toEqual({ x: 50, y: 15 });
    expect(getNumberTracingData(1).strokes[0].points).toEqual([
      { x: 50, y: 15 },
      { x: 50, y: 85 }
    ]);
  });
});
