import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavbarAdmin from './navbar';
import { vi } from 'vitest';

// Mock auth context at the module level
vi.mock('@/context/auth_context', () => ({
  useAuth: vi.fn()
}));

// Import after mocking
import { useAuth } from '@/context/auth_context';

describe('NavbarAdmin', () => {
  it('renders navigation bar with links and images', () => {
    // Default mock implementation
    useAuth.mockReturnValue({ user: null });

    render(
      <MemoryRouter>
        <NavbarAdmin />
      </MemoryRouter>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('shows user email when logged in', () => {
    // Mock for this specific test
    useAuth.mockReturnValue({ user: { email: 'test@example.com' } });

    render(
      <MemoryRouter>
        <NavbarAdmin />
      </MemoryRouter>
    );
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows Invitado and login/register links when not logged in', () => {
    // Mock for this specific test
    useAuth.mockReturnValue({ user: null });

    render(
      <MemoryRouter>
        <NavbarAdmin />
      </MemoryRouter>
    );
    expect(screen.getByText('Invitado')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });
});
