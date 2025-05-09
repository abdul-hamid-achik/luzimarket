import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from './not_found';

describe('NotFound page', () => {
  it('renders not found message', () => {
    render(<NotFound />);
    expect(screen.getByText('NotFound')).toBeInTheDocument();
  });
});