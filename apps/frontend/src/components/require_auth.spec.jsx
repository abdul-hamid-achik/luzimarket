import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { afterEach } from 'vitest';
import RequireAuth from '@/components/require_auth';
import { AuthContext } from '@/context/auth_context';

afterEach(() => {
    cleanup();
});

describe('RequireAuth', () => {
    it('renders children when user is present', () => {
        const mockAuthValue = {
            user: { name: 'Test' },
            isAuthenticated: true,
            isLoading: false
        };

        render(
            <MemoryRouter>
                <AuthContext.Provider value={mockAuthValue}>
                    <RequireAuth>
                        <div data-testid="protected">Protected Content</div>
                    </RequireAuth>
                </AuthContext.Provider>
            </MemoryRouter>
        );
        expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('redirects to login when user is not present', () => {
        const mockAuthValue = {
            user: null,
            isAuthenticated: false,
            isLoading: false
        };

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <AuthContext.Provider value={mockAuthValue}>
                    <Routes>
                        <Route path="/login" element={<div data-testid="login-page" />} />
                        <Route
                            path="/protected"
                            element={
                                <RequireAuth>
                                    <div data-testid="protected">Protected Content</div>
                                </RequireAuth>
                            }
                        />
                    </Routes>
                </AuthContext.Provider>
            </MemoryRouter>
        );
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    });

    it('shows loading spinner when authentication is loading', () => {
        const mockAuthValue = {
            user: null,
            isAuthenticated: false,
            isLoading: true
        };

        render(
            <MemoryRouter>
                <AuthContext.Provider value={mockAuthValue}>
                    <RequireAuth>
                        <div data-testid="protected">Protected Content</div>
                    </RequireAuth>
                </AuthContext.Provider>
            </MemoryRouter>
        );
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    });
}); 