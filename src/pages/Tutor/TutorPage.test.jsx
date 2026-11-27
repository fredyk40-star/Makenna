import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TutorPage from './TutorPage';

const vowelsUnit = {
  id: 'en1',
  title: 'Vowels',
  content: 'The vowel sounds are A, E, I, O, U.',
  level: 'KG1',
  subject: 'english',
  source: 'english:en1',
  path: '/alphabet',
};

const countingUnit = {
  id: 'm1',
  title: 'Counting 1-10',
  content: 'Learning to count from 1 to 10.',
  level: 'KG1',
  subject: 'mathematics',
  source: 'mathematics:m1',
  path: '/numbers',
};

const mockState = vi.hoisted(() => ({
  child: { childId: 'kid12345678', fullName: 'Ama Mensah' },
  localAnswer: {
    matched: true,
    text: 'A vowel is a letter sound.',
    unit: {
      id: 'en1',
      title: 'Vowels',
      content: 'The vowel sounds are A, E, I, O, U.',
      level: 'KG1',
      subject: 'english',
      source: 'english:en1',
      path: '/alphabet',
    },
  },
  curriculumAnswer: vi.fn(),
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
    getUnits: () => ([
      mockState.localAnswer.unit,
      {
        id: 'm1',
        title: 'Counting 1-10',
        content: 'Learning to count from 1 to 10.',
        level: 'KG1',
        subject: 'mathematics',
        source: 'mathematics:m1',
        path: '/numbers',
      },
    ]),
    getSuggestion: () => ({ unit: mockState.localAnswer.unit, text: 'Let us learn together.' }),
    answer: (...args) => mockState.curriculumAnswer(...args),
    recordQuestion: vi.fn(),
  },
}));

vi.mock('../../services/GeminiTutorService', () => ({
  GeminiTutorService: {
    answer: (...args) => mockState.geminiAnswer(...args),
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

const renderTutorPage = (paths = ['/tutor']) => render(
  <MemoryRouter initialEntries={[paths[0]]}>
    <Routes>
      <Route path="/tutor" element={<TutorPage />} />
      <Route path="/numbers" element={<div>Numbers lesson</div>} />
    </Routes>
  </MemoryRouter>,
);

describe('Makenna Tutor page', () => {
  afterEach(() => {
    delete window.SpeechRecognition;
    vi.clearAllMocks();
    mockState.curriculumAnswer.mockReset();
    mockState.geminiAnswer.mockReset();
    if (originalScrollIntoView) {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    } else {
      delete Element.prototype.scrollIntoView;
    }
  });

  it('keeps the active recognizer through transcript updates and submits the final text', async () => {
    window.SpeechRecognition = MockSpeechRecognition;
    Element.prototype.scrollIntoView = vi.fn();
    mockState.curriculumAnswer.mockReturnValue(mockState.localAnswer);
    mockState.geminiAnswer.mockImplementation(async (_childId, _text, local) => local);
    renderTutorPage();

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
        expect.objectContaining({
          unit: vowelsUnit,
          matched: true,
        }),
        'Ama Mensah',
        false,
        'answer',
        'english',
      );
    });
  });

  it('renders a compact single-row composer', () => {
    renderTutorPage();

    const input = screen.getByPlaceholderText('Ask about your lessons...');
    const form = input.closest('form');
    expect(form).toHaveClass('flex', 'items-center', 'gap-2');
    expect(screen.getByRole('button', { name: 'Send question' })).toHaveClass(
      'h-10',
      'w-10',
      'shrink-0',
    );
    expect(screen.getByRole('combobox', { name: 'Tutor lesson' })).toBeInTheDocument();
  });

  it('opens the curriculum lesson matched to the question', async () => {
    mockState.curriculumAnswer.mockReturnValue({
      matched: true,
      text: 'Let us count mangoes.',
      unit: countingUnit,
    });
    mockState.geminiAnswer.mockImplementation(async (_childId, _text, local) => local);
    renderTutorPage();

    fireEvent.change(screen.getByRole('textbox', { name: 'Ask about your lessons' }), {
      target: { value: 'Teach me counting' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));

    await screen.findByText('Let us count mangoes.');
    fireEvent.click(screen.getByRole('button', { name: /open lesson/i }));
    expect(screen.getByText('Numbers lesson')).toBeInTheDocument();
  });

  it('does not offer an unmatched lesson link', async () => {
    mockState.curriculumAnswer.mockReturnValue(null);
    mockState.geminiAnswer.mockImplementation(async (_childId, _text, local) => local);
    renderTutorPage();

    fireEvent.change(screen.getByRole('textbox', { name: 'Ask about your lessons' }), {
      target: { value: 'Tell me a joke' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));

    await screen.findByText('Choose a lesson first, then ask me about it.');
    expect(screen.queryByRole('button', { name: /open lesson/i })).not.toBeInTheDocument();
  });

  it('uses the selected lesson for quick activities', async () => {
    mockState.curriculumAnswer.mockReturnValue(null);
    mockState.geminiAnswer.mockImplementation(async (_childId, _text, local) => local);
    renderTutorPage();

    fireEvent.change(screen.getByRole('combobox', { name: 'Tutor lesson' }), {
      target: { value: 'mathematics:m1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Practice' }));

    await waitFor(() => {
      expect(mockState.geminiAnswer).toHaveBeenCalledWith(
        'kid12345678',
        'Create three short practice questions from this lesson.',
        expect.objectContaining({
          unit: countingUnit,
          matched: true,
        }),
        'Ama Mensah',
        false,
        'practice',
        'english',
      );
    });
  });
});
