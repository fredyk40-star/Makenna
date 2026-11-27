import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const services = vi.hoisted(() => ({
  account: {
    initialize: vi.fn(),
    getActiveChild: vi.fn(() => null),
    registerChild: vi.fn(),
    loginChild: vi.fn(),
  },
  analytics: { initialize: vi.fn(), trackLogin: vi.fn() },
  cloudSync: {
    getSyncStatus: vi.fn(() => ({ enabled: true })),
    init: vi.fn(() => ({ status: { enabled: true } })),
    subscribe: vi.fn(() => vi.fn()),
    startAutoSync: vi.fn(),
    isEnabled: vi.fn(() => true),
    requestSync: vi.fn(),
  },
}));

vi.mock('../services/ChildAccountService', () => ({
  ChildAccountService: services.account,
}));
vi.mock('../services/StorageService', () => ({
  StorageService: { set: vi.fn() },
}));
vi.mock('../services/AnalyticsService', () => ({
  AnalyticsService: services.analytics,
}));
vi.mock('../services/GamificationService', () => ({
  GamificationService: { checkDailyReset: vi.fn() },
}));
vi.mock('../services/CloudSyncService', () => ({
  CloudSyncService: services.cloudSync,
}));
vi.mock('../services/NotificationBellService', () => ({
  NotificationBellService: { addNotification: vi.fn() },
}));

import { ChildAccountProvider, useChildAccount } from './ChildAccountContext';

describe('ChildAccountProvider startup sync', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('finishes app initialization without waiting for cloud sync', async () => {
    let finishSync;
    services.cloudSync.requestSync.mockReturnValue(new Promise(resolve => {
      finishSync = resolve;
    }));

    const { result } = renderHook(() => useChildAccount(), {
      wrapper: ChildAccountProvider,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(services.cloudSync.requestSync).toHaveBeenCalledWith('startup');
    expect(result.current.loading).toBe(false);

    await act(async () => finishSync({ success: true }));
  });

  it('finishes local registration without waiting for cloud sync', async () => {
    let finishRegistrationSync;
    const account = { childId: 'kid123', fullName: 'Makenna' };
    services.account.registerChild.mockResolvedValue(account);
    services.account.loginChild.mockResolvedValue(true);
    services.account.getActiveChild.mockReturnValue(account);
    services.cloudSync.requestSync.mockImplementation(reason => (
      reason === 'startup'
        ? Promise.resolve({ success: true })
        : new Promise(resolve => {
          finishRegistrationSync = resolve;
        })
    ));

    const { result } = renderHook(() => useChildAccount(), {
      wrapper: ChildAccountProvider,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let registration;
    await act(async () => {
      registration = await result.current.register('Makenna', '1234', 'parent@example.com');
    });

    expect(registration).toBe(account);
    expect(services.cloudSync.requestSync).toHaveBeenCalledWith('registration');
    await act(async () => finishRegistrationSync({ success: true }));
  });
});
