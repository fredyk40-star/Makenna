import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NavigationCards from './NavigationCards';

describe('NavigationCards', () => {
  it('navigates the Music card to the music library', () => {
    render(
      <MemoryRouter>
        <NavigationCards />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Navigate to Music' })).toHaveAttribute('href', '/music');
  });
});
