import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from './not_found';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NotFound page', () => {
  it('renders not found message', () => {
    renderWithRouter(<NotFound />);
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
  });
});