import React from 'react';
import { renderWithProviders, screen } from '@/test-utils';
import Alertas from '@/components/alertas/alertas';

describe('Alertas', () => {
    it('renders four alerts with correct classes', () => {
        renderWithProviders(<Alertas />);
        const alerts = screen.getAllByRole('alert');
        expect(alerts).toHaveLength(4);
        expect(alerts[0]).toHaveClass('alert-danger');
        expect(alerts[1]).toHaveClass('alert-success');
        expect(alerts[2]).toHaveClass('alert-danger');
        expect(alerts[3]).toHaveClass('alert-success');
    });
}); 