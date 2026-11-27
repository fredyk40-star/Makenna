import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SessionTimeoutService from './SessionTimeoutService';

describe('SessionTimeoutService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
    SessionTimeoutService.reset();
  });

  afterEach(() => {
    SessionTimeoutService.reset();
    vi.useRealTimers();
  });

  it('warns before locking and resets on activity', () => {
    SessionTimeoutService.configure({ enabled: true, minutes: 1, warningSeconds: 30 });
    SessionTimeoutService.start();

    vi.advanceTimersByTime(31_000);
    expect(SessionTimeoutService.getState().phase).toBe('warning');

    SessionTimeoutService.recordActivity();
    expect(SessionTimeoutService.getState().phase).toBe('active');

    vi.advanceTimersByTime(31_000);
    expect(SessionTimeoutService.getState().phase).toBe('warning');
  });

  it('locks after the configured idle period and unlocks with a call', () => {
    SessionTimeoutService.configure({ enabled: true, minutes: 1, warningSeconds: 10 });
    SessionTimeoutService.start();

    vi.advanceTimersByTime(61_000);
    expect(SessionTimeoutService.getState().phase).toBe('locked');

    SessionTimeoutService.unlock();
    expect(SessionTimeoutService.getState().phase).toBe('active');
  });

  it('does nothing while disabled', () => {
    SessionTimeoutService.configure({ enabled: false, minutes: 1, warningSeconds: 10 });
    SessionTimeoutService.start();

    vi.advanceTimersByTime(120_000);
    expect(SessionTimeoutService.getState().phase).toBe('active');
  });
});
