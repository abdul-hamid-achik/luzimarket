import React from 'react';
import { renderWithProviders, screen, within } from '@/test-utils';
import DangerAlert from '@/components/alertas/danger';

describe('Danger Alert Component', () => {
    it('renders a danger alert with correct text and close button', () => {
        const { container } = renderWithProviders(<DangerAlert />);

        // Find the alert specifically within this component's container
        const alert = within(container).getByRole('alert');
        expect(alert).toHaveClass('alert-danger');
        expect(within(alert).getByText('A simple danger alert')).toBeInTheDocument();

        // Find the button within the alert container
        const button = within(alert).getByRole('button');
        expect(button).toBeInTheDocument();
    });
}); 