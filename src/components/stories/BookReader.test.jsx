import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BookReader from './BookReader';
import { STORIES } from '../../data/stories';

const utterances = [];
const speechSynthesis = {
  cancel: vi.fn(),
  getVoices: vi.fn(() => []),
  speak: vi.fn((utterance) => utterances.push(utterance)),
  pause: vi.fn(),
  resume: vi.fn(),
  paused: false,
};

class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
  }
}

describe('BookReader speech autoplay', () => {
  const originalSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis');
  const originalUtterance = Object.getOwnPropertyDescriptor(window, 'SpeechSynthesisUtterance');
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  afterEach(() => {
    cleanup();
    utterances.length = 0;
    vi.restoreAllMocks();
    if (originalSynthesis) Object.defineProperty(window, 'speechSynthesis', originalSynthesis);
    else delete window.speechSynthesis;
    if (originalUtterance) Object.defineProperty(window, 'SpeechSynthesisUtterance', originalUtterance);
    else delete window.SpeechSynthesisUtterance;
    if (originalScrollIntoView) Element.prototype.scrollIntoView = originalScrollIntoView;
    else delete Element.prototype.scrollIntoView;
  });

  it('reads the next page, not the previous page, when autoplay is enabled mid-page', async () => {
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: speechSynthesis,
    });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: MockSpeechSynthesisUtterance,
    });
    Element.prototype.scrollIntoView = vi.fn();
    const story = STORIES.find((item) => item.id === 'a-story');
    render(
      <MemoryRouter>
        <BookReader storyId="a-story" />
      </MemoryRouter>,
    );

    await waitFor(() => expect(utterances).toHaveLength(1));
    expect(utterances[0].text).toBe(story.pages[0].text);

    fireEvent.click(screen.getByRole('button', { name: 'Enable auto-play' }));
    act(() => utterances[0].onend());

    await waitFor(() => expect(utterances).toHaveLength(2));
    expect(utterances[1].text).toBe(story.pages[1].text);
  });
});
