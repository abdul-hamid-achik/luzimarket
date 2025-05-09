import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequireAuth from '@/components/require_auth';
import { AuthContext } from '@/context/auth_context';

describe('RequireAuth', () => {
    it('renders children when user is present', () => {
        const user = { name: 'Test' };
        render(
            <MemoryRouter>
                <AuthContext.Provider value={{ user }}>
                    <RequireAuth>
                        <div data-testid="protected">Protected Content</div>
                    </RequireAuth>
                </AuthContext.Provider>
            </MemoryRouter>
        );
        expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('redirects to login when user is not present', () => {
        render(
            <MemoryRouter initialEntries={['/protected']}>
                <AuthContext.Provider value={{ user: null }}>
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
}); 