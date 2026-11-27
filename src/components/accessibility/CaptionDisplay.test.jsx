import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CaptionDisplay from './CaptionDisplay';
import AccessibilityService from '../../services/AccessibilityService';

vi.mock('../../context/AccessibilityContext', () => ({
  useAccessibility: () => ({ captions: true }),
}));

const renderCaption = (route) => {
  let emit;
  vi.spyOn(AccessibilityService, 'subscribeCaptions').mockImplementation((listener) => {
    emit = listener;
    return () => {};
  });

  const view = render(
    <MemoryRouter initialEntries={[route]}>
      <CaptionDisplay />
    </MemoryRouter>,
  );

  return { ...view, emit: (text) => act(() => emit(text)) };
};

describe('CaptionDisplay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('never restores a stale caption, such as a single letter from a game', () => {
    const getLastCaption = vi.spyOn(AccessibilityService, 'getLastCaption').mockReturnValue('c');

    renderCaption('/');

    expect(getLastCaption).not.toHaveBeenCalled();
    expect(screen.queryByText('c')).toBeNull();
  });

  it('does not render captions on login even if a caption is announced', () => {
    const { emit } = renderCaption('/login');

    emit('c');

    expect(screen.queryByText('c')).toBeNull();
  });

  it('shows live captions on learning screens', () => {
    const { emit } = renderCaption('/');

    emit('Find the letter C');

    expect(screen.getByText('Find the letter C')).toBeInTheDocument();
  });
});
