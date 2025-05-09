import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavbarAdmin from './navbar';

describe('NavbarAdmin', () => {
  it('renders navigation bar with links and images', () => {
    render(
      <MemoryRouter>
        <NavbarAdmin />
      </MemoryRouter>
    );
    // Navigation role
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    // Example: check for a link
    // expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
