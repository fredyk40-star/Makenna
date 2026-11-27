import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AIAssistant from './AIAssistant';

const mockState = vi.hoisted(() => ({
  child: { childId: 'kid12345678', fullName: 'Ama Mensah' },
  localAnswer: {
    matched: true,
    text: 'A vowel is a letter sound.',
    unit: { title: 'Vowels', content: 'A, E, I, O, U.', level: 'KG1', subject: 'english' },
  },
  geminiAnswer: vi.fn(),
  recordInteraction: vi.fn(),
}));

vi.mock('../../context/ChildAccountContext', () => ({
  useChildAccount: () => ({ activeChild: mockState.child }),
}));

vi.mock('../../services/CurriculumTutorService', () => ({
  CurriculumTutorService: {
    isEnabled: () => true,
    getSettings: () => ({ enabled: true, allowVoice: true, allowOnlineAI: false }),
    subscribe: () => () => {},
    getSuggestion: () => ({ unit: mockState.localAnswer.unit }),
    recordQuestion: vi.fn(),
    answer: () => mockState.localAnswer,
  },
}));

vi.mock('../../services/GeminiTutorService', () => ({
  GeminiTutorService: {
    answer: mockState.geminiAnswer,
  },
}));

vi.mock('../../services/AIAssistantService', () => ({
  AIAssistantService: {
    getGreeting: () => 'Hello!',
    recordAIInteraction: mockState.recordInteraction,
  },
}));

let recognitionInstance;

class MockSpeechRecognition {
  constructor() {
    recognitionInstance = this;
  }

  start = vi.fn();

  stop = vi.fn();

  abort = vi.fn();
}

const originalScrollIntoView = Element.prototype.scrollIntoView;

describe('AIAssistant speech recognition', () => {
  afterEach(() => {
    delete window.SpeechRecognition;
    if (originalScrollIntoView) {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    } else {
      delete Element.prototype.scrollIntoView;
    }
  });

  it('keeps the active recognizer through transcript updates and submits the final text', async () => {
    window.SpeechRecognition = MockSpeechRecognition;
    Element.prototype.scrollIntoView = vi.fn();
    mockState.geminiAnswer.mockImplementation(async (_childId, _text, local) => local);
    const { container } = render(
      <MemoryRouter>
        <AIAssistant />
      </MemoryRouter>,
    );

    fireEvent.click(container.querySelector('.w-16.h-16'));
    fireEvent.click(screen.getByTitle('Ask with your voice'));

    const recognition = recognitionInstance;
    expect(recognition).toBeDefined();
    expect(recognition.start).toHaveBeenCalledOnce();

    act(() => {
      recognition.onresult({
        results: [
          [{ transcript: 'What are vowels?' }],
        ],
      });
    });
    expect(recognition.abort).not.toHaveBeenCalled();

    act(() => {
      recognition.onend();
    });

    await waitFor(() => {
      expect(screen.getByText('What are vowels?')).toBeInTheDocument();
      expect(mockState.geminiAnswer).toHaveBeenCalledWith(
        'kid12345678',
        'What are vowels?',
        { unit: mockState.localAnswer.unit, matched: true },
        'Ama Mensah',
        false,
        'answer',
        'english',
      );
    });
  });
});
