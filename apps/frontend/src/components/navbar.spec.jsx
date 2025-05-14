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
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('shows user email when logged in', () => {
    jest.mock('@/context/auth_context', () => ({
      AuthContext: {
        Provider: ({ children }) => children,
        Consumer: ({ children }) => children({ user: { email: 'test@example.com' } })
      },
      useAuth: () => ({ user: { email: 'test@example.com' } })
    }));
    render(
      <MemoryRouter>
        <NavbarAdmin />
      </MemoryRouter>
    );
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows Invitado and login/register links when not logged in', () => {
    jest.mock('@/context/auth_context', () => ({
      AuthContext: {
        Provider: ({ children }) => children,
        Consumer: ({ children }) => children({ user: null })
      },
      useAuth: () => ({ user: null })
    }));
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
