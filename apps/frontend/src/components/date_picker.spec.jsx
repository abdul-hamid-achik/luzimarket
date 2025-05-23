import { vi } from 'vitest';
// Use the default mock from setupTests to simplify click handling

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateRangePicker from '@/components/date_picker';

describe('DateRangePicker', () => {
    it('renders the date input and calls onDateChange on click', async () => {
        const onDateChange = vi.fn();
        const { container } = render(<DateRangePicker onDateChange={onDateChange} />);

        // Find the date picker within this component's container
        const picker = within(container).getByTestId('date-picker');
        expect(picker).toBeInTheDocument();
        await userEvent.click(picker);
        expect(onDateChange).toHaveBeenCalledWith(null, null);
    });
}); 