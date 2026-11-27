import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import audioService from '../../services/AudioService';
import SentenceReader from './SentenceReader';

describe('SentenceReader playback controls', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lets a child start and stop reading after starting a practice sentence', async () => {
    vi.spyOn(audioService, 'speak').mockResolvedValue(true);
    const stop = vi.spyOn(audioService, 'stop');
    render(<SentenceReader />);

    fireEvent.click(await screen.findByRole('button', { name: 'Start Reading' }));

    const readButton = screen.getByRole('button', { name: 'Read sentence' });
    expect(readButton).toBeEnabled();

    fireEvent.click(readButton);
    expect(screen.getByRole('button', { name: 'Stop reading' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Stop reading' }));

    expect(stop).toHaveBeenCalled();
  });
});
