import React from 'react';
import { render, screen } from '@testing-library/react';
import CardDashboard from './card';

describe('CardDashboard', () => {
  it('renders titles and text', () => {
    const props = { title: 'Title1', title2: 'Title2', text: 'Some text' };
    render(<CardDashboard {...props} />);
    expect(screen.getByText('Title1')).toBeInTheDocument();
    expect(screen.getByText('Title2')).toBeInTheDocument();
    expect(screen.getByText('Some text')).toBeInTheDocument();
  });
});
