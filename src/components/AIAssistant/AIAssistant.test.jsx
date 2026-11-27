import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AIAssistant from './AIAssistant';

vi.mock('../../context/ChildAccountContext', () => ({
  useChildAccount: () => ({
    activeChild: { childId: 'kid12345678', fullName: 'Ama Mensah' },
  }),
}));

describe('AIAssistant launcher', () => {
  it('opens the dedicated tutor page instead of an overlay', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<div>Settings content</div>} />
          <Route path="/tutor" element={<div>Tutor page</div>} />
        </Routes>
        <AIAssistant />
      </MemoryRouter>,
    );

    expect(screen.getByText('Settings content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /open makenna tutor/i }));

    expect(screen.getByText('Tutor page')).toBeInTheDocument();
    expect(screen.queryByText('Settings content')).not.toBeInTheDocument();
  });
});
