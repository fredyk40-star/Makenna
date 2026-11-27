import { beforeEach, describe, expect, it } from 'vitest';
import ParentGateService from './ParentGateService';

describe('ParentGateService', () => {
  beforeEach(() => {
    ParentGateService.lock();
  });

  it('creates, verifies and expires a parent session', async () => {
    await ParentGateService.setPin('1234');
    expect(ParentGateService.hasPin()).toBe(true);
    expect(ParentGateService.isUnlocked()).toBe(true);

    ParentGateService.lock();
    expect(await ParentGateService.verifyPin('1234')).toBe(true);
    expect(ParentGateService.isUnlocked()).toBe(true);
  });

  it('locks after three incorrect attempts', async () => {
    await ParentGateService.setPin('1234');
    ParentGateService.lock();

    expect(await ParentGateService.verifyPin('0000')).toBe(false);
    expect(await ParentGateService.verifyPin('0000')).toBe(false);
    expect(await ParentGateService.verifyPin('0000')).toBe(false);

    expect(ParentGateService.getLockoutRemaining()).toBeGreaterThan(0);
    expect(await ParentGateService.verifyPin('1234')).toBe(false);
  });
});
