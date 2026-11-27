import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  isOffline: false,
  cloudSyncStatus: { pendingCount: 0, syncing: false },
}));

vi.mock('../../hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => state.isOffline,
}));

vi.mock('../../context/ChildAccountContext', () => ({
  useChildAccount: () => ({ cloudSyncStatus: state.cloudSyncStatus }),
}));

import OfflineDetector from './OfflineDetector';

describe('OfflineDetector', () => {
  afterEach(() => {
    document.body.removeAttribute('data-top-banner');
  });

  it('keeps online sync activity in the background without showing a banner', async () => {
    state.isOffline = false;
    state.cloudSyncStatus = { pendingCount: 3, syncing: true };
    render(<OfflineDetector />);

    expect(screen.queryByText(/Syncing your progress/)).not.toBeInTheDocument();
    expect(screen.queryByText(/waiting to sync/)).not.toBeInTheDocument();
    await waitFor(() => expect(document.body.dataset.topBanner).toBe('false'));
  });

  it('still informs the user when the device is offline', () => {
    state.isOffline = true;
    state.cloudSyncStatus = { pendingCount: 2, syncing: false };
    render(<OfflineDetector />);

    expect(screen.getByText("You're offline. 2 change(s) will sync automatically.")).toBeInTheDocument();
  });
});
