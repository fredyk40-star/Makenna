import { fireEvent, render, screen, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { speak, stop } = vi.hoisted(() => ({
  speak: vi.fn(),
  stop: vi.fn(),
}));

vi.mock('../../hooks/useAudio', () => ({
  useAudio: () => ({ speak, stop }),
}));

import BlendingPlayer from './BlendingPlayer';

describe('BlendingPlayer', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does not continue the sequence after Stop is pressed between utterances', async () => {
    vi.useFakeTimers();
    speak.mockResolvedValue(true);
    render(<BlendingPlayer word="cat" />);

    fireEvent.click(screen.getByRole('button', { name: 'Play blending' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(speak).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Stop blending' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(speak).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalled();
  });
});
