import React from 'react';
import { render, screen, within } from '@testing-library/react';
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
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn()
    });

    const { container } = render(
      <MemoryRouter>
        <NavbarAdmin />
      </MemoryRouter>
    );
    expect(within(container).getByRole('navigation')).toBeInTheDocument();
  });

  it('shows user email when logged in', () => {
    // Mock for this specific test
    useAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      isAuthenticated: true,
      logout: vi.fn()
    });

    const { container } = render(
      <MemoryRouter>
        <NavbarAdmin />
      </MemoryRouter>
    );
    expect(within(container).getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows Invitado and login/register links when not logged in', () => {
    // Mock for this specific test
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn()
    });

    const { container } = render(
      <MemoryRouter>
        <NavbarAdmin />
      </MemoryRouter>
    );
    expect(within(container).getByText('Invitado')).toBeInTheDocument();
    expect(within(container).getByText('Login')).toBeInTheDocument();
    expect(within(container).getByText('Register')).toBeInTheDocument();
  });
});
