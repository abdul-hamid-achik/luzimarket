import React from 'react';
import { renderWithProviders, screen } from '../../test-utils';
import CardDashboard from './card';

describe('CardDashboard', () => {
  it('renders titles and text', () => {
    const props = { title: 'Title1', title2: 'Title2', text: 'Some text' };
    render(<CardDashboard {...props} />);
    expect(screen.getByText('Title1')).toBeInTheDocument();
    expect(screen.getByText('Title2')).toBeInTheDocument();
    expect(screen.getByText('Some text')).toBeInTheDocument();
  });

  it('renders ChartComponent when provided', () => {
    const Chart = () => <div data-testid="chart" />;
    render(<CardDashboard title="T1" title2="T2" text="T3" ChartComponent={Chart} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });
});