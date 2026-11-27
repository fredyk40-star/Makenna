import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/ChildAccountContext', () => ({
  useChildAccount: () => ({
    login: vi.fn(),
    error: null,
    clearError: vi.fn(),
  }),
}));

vi.mock('../../context/VoiceGuideContext', () => ({
  useVoiceGuide: () => ({
    playError: vi.fn(),
    playSuccess: vi.fn(),
  }),
}));

vi.mock('../../components/LoginGuidance/LoginGuidance', () => ({
  default: () => null,
}));

// The decorative backdrop expects the real ThemeProvider; it is irrelevant here.
vi.mock('../../components/auth/StudyLampBackdrop', () => ({
  default: () => null,
}));

import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('does not show biometric setup or guidance on the child login screen', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Biometric Login')).not.toBeInTheDocument();
    expect(screen.queryByText('How does it work?')).not.toBeInTheDocument();
    expect(screen.queryByText('Enable Biometric Login')).not.toBeInTheDocument();
  });
});
