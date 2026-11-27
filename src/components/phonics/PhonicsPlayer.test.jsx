import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  playLetterName: vi.fn(),
  playLetterSound: vi.fn(),
  playWord: vi.fn(),
  playSentence: vi.fn(),
  playWordWithSound: vi.fn(),
  stop: vi.fn(),
  isPlaying: false,
}));

vi.mock('../../hooks/usePhonics', () => ({
  usePhonics: () => mocks,
}));

import PhonicsPlayer from './PhonicsPlayer';

describe('PhonicsPlayer', () => {
  beforeEach(() => {
    mocks.playLetterName.mockResolvedValue(true);
    mocks.playLetterSound.mockResolvedValue(true);
    mocks.playWord.mockResolvedValue(true);
    mocks.playSentence.mockResolvedValue(true);
    mocks.playWordWithSound.mockResolvedValue(true);
    mocks.isPlaying = false;
  });

  it('plays the selected word and reports the practiced mode', async () => {
    const user = userEvent.setup();
    const onPracticed = vi.fn();
    render(
      <PhonicsPlayer
        letterId="a"
        wordIndex={2}
        showWaveform={false}
        onPracticed={onPracticed}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Word' }));
    await user.click(screen.getByRole('button', { name: 'Pronounce Word' }));

    expect(mocks.playWord).toHaveBeenCalledWith('a', 2);
    expect(onPracticed).toHaveBeenCalledWith('word', expect.objectContaining({ wordIndex: 2 }));
  });

  it('shows the selected word in word-with-sound mode', async () => {
    const user = userEvent.setup();
    render(<PhonicsPlayer letterId="a" wordIndex={2} showWaveform={false} />);

    await user.click(screen.getByRole('button', { name: 'Word + Sound' }));

    expect(screen.getByText('ah → Alligator')).toBeInTheDocument();
  });

  it('stops audio when switching modes', async () => {
    const user = userEvent.setup();
    render(<PhonicsPlayer letterId="a" showWaveform={false} />);

    await user.click(screen.getByRole('button', { name: 'Sound' }));

    expect(mocks.stop).toHaveBeenCalled();
  });

  it('keeps the stop control enabled while speech is playing', async () => {
    let finishPlayback;
    mocks.playLetterName.mockImplementation(() => {
      mocks.isPlaying = true;
      return new Promise(resolve => {
        finishPlayback = resolve;
      });
    });

    const user = userEvent.setup();
    render(<PhonicsPlayer letterId="a" showWaveform={false} />);
    await user.click(screen.getByRole('button', { name: 'Play Letter Name' }));

    const stopButton = screen.getByRole('button', { name: 'Stop audio' });
    expect(stopButton).toBeEnabled();
    await user.click(stopButton);
    expect(mocks.stop).toHaveBeenCalled();

    finishPlayback(false);
  });
});
