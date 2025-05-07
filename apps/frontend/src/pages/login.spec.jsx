import React from 'react';
import { renderWithProviders, screen } from '../test-utils';
import Login from './login';

describe('Login page', () => {
  it('renders logo, inputs, and login button', () => {
    const { container } = renderWithProviders(<Login />);
    // Logo element
    expect(container.querySelector('.logo-admin')).toBeInTheDocument();
    // Input fields
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    // Login button
    expect(screen.getByText('Entrar')).toBeInTheDocument();
  });
});