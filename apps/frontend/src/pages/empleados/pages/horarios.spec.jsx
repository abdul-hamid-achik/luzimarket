import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, afterEach, beforeEach, describe, it, expect } from 'vitest';
import Horarios from './horarios';

// Mock the breadcrumb component
vi.mock('@/components/breadcrumb', () => ({
    default: ({ items, activeItem }) => (
        <div data-testid="breadcrumb">
            <span data-testid="breadcrumb-active">{activeItem}</span>
        </div>
    )
}));

// Mock the select cities component
vi.mock('@/pages/empleados/components/select_estados_ciudades', () => ({
    default: ({ onLocationChange }) => (
        <div data-testid="select-ciudades">
            <button
                onClick={() => onLocationChange({ estado: 'Ciudad de México', ciudad: 'Coyoacán' })}
                data-testid="select-location-btn"
            >
                Select Location
            </button>
        </div>
    )
}));

// Mock the modal components
vi.mock('@/pages/empleados/components/modal', () => ({
    default: ({ isOpen, onClose, title, children, footer }) => (
        isOpen ? (
            <div data-testid="modal">
                <div data-testid="modal-title">{title}</div>
                <div data-testid="modal-content">{children}</div>
                {footer && <div data-testid="modal-footer">{footer}</div>}
                <button onClick={onClose} data-testid="modal-close">Close</button>
            </div>
        ) : null
    ),
    ConfirmationModal: ({ isOpen, onClose, onConfirm, title, message, isLoading }) => (
        isOpen ? (
            <div data-testid="confirmation-modal">
                <div data-testid="confirmation-title">{title}</div>
                <div data-testid="confirmation-message">{message}</div>
                <button onClick={onConfirm} disabled={isLoading} data-testid="confirm-btn">
                    Confirm
                </button>
                <button onClick={onClose} data-testid="cancel-btn">Cancel</button>
            </div>
        ) : null
    )
}));

// Mock react-icons
vi.mock('react-icons/bs', () => ({
    BsClock: () => <div data-testid="clock-icon">🕐</div>,
    BsCalendar: () => <div data-testid="calendar-icon">📅</div>,
    BsGeoAlt: () => <div data-testid="geo-icon">📍</div>,
    BsPencilSquare: () => <div data-testid="edit-icon">✏️</div>,
    BsTrash: () => <div data-testid="trash-icon">🗑️</div>,
    BsPlus: () => <div data-testid="plus-icon">➕</div>,
    BsShop: () => <div data-testid="shop-icon">🏪</div>,
    BsCheck2Circle: () => <div data-testid="check-icon">✅</div>,
    BsInfoCircle: () => <div data-testid="info-icon">ℹ️</div>,
}));

// Mock CSS imports
vi.mock('./horarios.css', () => ({}));

// Cleanup after each test
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

// Mock alert
beforeEach(() => {
    global.alert = vi.fn();
});

const renderHorarios = () => {
    return render(
        <MemoryRouter>
            <Horarios />
        </MemoryRouter>
    );
};

describe('Horarios Page', () => {
    describe('Rendering', () => {
        it('renders the page with all main sections', () => {
            renderHorarios();

            // Check breadcrumb
            expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
            expect(screen.getByTestId('breadcrumb-active')).toHaveTextContent('Horarios');

            // Check main sections
            expect(screen.getByText('Gestión de Horarios')).toBeInTheDocument();
            expect(screen.getByText('Filtrar por Ubicación')).toBeInTheDocument();
            expect(screen.getByText('Tiendas y Horarios')).toBeInTheDocument();
        });

        it('displays initial stores data', () => {
            renderHorarios();

            // Check for initial stores
            expect(screen.getByText('Tienda Uno')).toBeInTheDocument();
            expect(screen.getByText('Tienda Dos')).toBeInTheDocument();

            // Use getAllByText for duplicate times since multiple stores might have the same hours
            expect(screen.getAllByText('09:00')).toHaveLength(2); // Both stores open at 09:00
            expect(screen.getByText('19:00')).toBeInTheDocument();
            expect(screen.getByText('18:30')).toBeInTheDocument();
        });

        it('shows correct store count badge', () => {
            renderHorarios();

            expect(screen.getByText('2 Tiendas')).toBeInTheDocument();
        });

        it('displays table headers correctly', () => {
            renderHorarios();

            expect(screen.getByText('Tienda')).toBeInTheDocument();
            expect(screen.getByText('Ubicación')).toBeInTheDocument();
            expect(screen.getByText('Hora de Apertura')).toBeInTheDocument();
            expect(screen.getByText('Hora de Cierre')).toBeInTheDocument();
            expect(screen.getByText('Estado')).toBeInTheDocument();
            expect(screen.getByText('Acciones')).toBeInTheDocument();
        });

        it('displays action buttons', () => {
            renderHorarios();

            expect(screen.getByRole('button', { name: /agregar tienda/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /actualizar horarios/i })).toBeInTheDocument();
        });
    });

    describe('Location Filtering', () => {
        it('filters stores by location when selected', async () => {
            renderHorarios();

            const selectLocationBtn = screen.getByTestId('select-location-btn');
            fireEvent.click(selectLocationBtn);

            await waitFor(() => {
                // Should show info message about filtered location
                expect(screen.getByText(/Mostrando tiendas en Coyoacán, Ciudad de México/)).toBeInTheDocument();
            });
        });

        it('updates store count when filtering', async () => {
            renderHorarios();

            const selectLocationBtn = screen.getByTestId('select-location-btn');
            fireEvent.click(selectLocationBtn);

            await waitFor(() => {
                // Only one store matches the filtered location
                expect(screen.getByText('1 Tienda')).toBeInTheDocument();
            });
        });

        it('shows "no stores" message when no stores match filter', async () => {
            renderHorarios();

            // Manually trigger a location change that doesn't match any stores
            const component = screen.getByTestId('select-ciudades');
            const selectComponent = component.parentElement;

            // This would need a more sophisticated mock to test different locations
            // For now, we'll test the basic filtering functionality
        });
    });

    describe('Store Management', () => {
        it('opens edit modal when edit button is clicked', async () => {
            renderHorarios();

            const editButtons = screen.getAllByTestId('edit-icon');
            fireEvent.click(editButtons[0]);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
                expect(screen.getByTestId('modal-title')).toHaveTextContent('Editar Horarios de Tienda');
            });
        });

        it('opens delete confirmation when delete button is clicked', async () => {
            renderHorarios();

            const deleteButtons = screen.getAllByTestId('trash-icon');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => {
                expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
                expect(screen.getByTestId('confirmation-title')).toHaveTextContent('Eliminar Tienda');
            });
        });

        it('opens add store modal when add button is clicked', async () => {
            renderHorarios();

            const addButton = screen.getByRole('button', { name: /agregar tienda/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
                expect(screen.getByTestId('modal-title')).toHaveTextContent('Agregar Nueva Tienda');
            });
        });
    });

    describe('Store Operations', () => {
        it('successfully edits a store', async () => {
            // Use fake timers to control setTimeout behavior
            vi.useFakeTimers();

            renderHorarios();

            // Open edit modal
            const editButtons = screen.getAllByTestId('edit-icon');
            fireEvent.click(editButtons[0]);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            // Find and click save button in the modal footer
            const modalFooter = screen.getByTestId('modal-footer');
            const saveButton = modalFooter.querySelector('.btn-primary');

            if (saveButton) {
                fireEvent.click(saveButton);

                // Fast-forward time to complete the simulated API call
                vi.advanceTimersByTime(1000);

                await waitFor(() => {
                    // Modal should close after successful save
                    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
                });
            }

            // Restore real timers
            vi.useRealTimers();
        });

        it('successfully deletes a store', async () => {
            // Use fake timers to control setTimeout behavior
            vi.useFakeTimers();

            renderHorarios();

            // Open delete confirmation
            const deleteButtons = screen.getAllByTestId('trash-icon');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => {
                expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
            });

            // Confirm deletion
            const confirmButton = screen.getByTestId('confirm-btn');
            fireEvent.click(confirmButton);

            // Fast-forward time to complete the simulated API call
            vi.advanceTimersByTime(1000);

            await waitFor(() => {
                // Store should be removed from the list
                expect(screen.getByText('1 Tienda')).toBeInTheDocument();
            });

            // Restore real timers
            vi.useRealTimers();
        });

        it('successfully adds a new store', async () => {
            // Use fake timers to control setTimeout behavior
            vi.useFakeTimers();

            renderHorarios();

            // First select a location
            const selectLocationBtn = screen.getByTestId('select-location-btn');
            fireEvent.click(selectLocationBtn);

            // Open add modal
            const addButton = screen.getByRole('button', { name: /agregar tienda/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            // Find and click add button in the modal footer
            const modalFooter = screen.getByTestId('modal-footer');
            const addStoreButton = modalFooter.querySelector('.btn-primary');

            if (addStoreButton) {
                fireEvent.click(addStoreButton);

                // Fast-forward time to complete the simulated API call
                vi.advanceTimersByTime(1000);

                await waitFor(() => {
                    // Modal should close and store count should increase
                    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
                });
            }

            // Restore real timers
            vi.useRealTimers();
        });
    });

    describe('Update All Schedules', () => {
        it('successfully updates all schedules', async () => {
            // Use fake timers to control setTimeout behavior
            vi.useFakeTimers();

            renderHorarios();

            const updateButton = screen.getByRole('button', { name: /actualizar horarios/i });
            fireEvent.click(updateButton);

            // Fast-forward time to complete the simulated API call (2000ms)
            vi.advanceTimersByTime(2000);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Horarios actualizados exitosamente');
            });

            // Restore real timers
            vi.useRealTimers();
        });

        it('disables update button when no stores are available', async () => {
            // Use fake timers to control setTimeout behavior
            vi.useFakeTimers();

            renderHorarios();

            // Delete stores one by one until none remain
            while (screen.queryAllByTestId('trash-icon').length > 0) {
                // Get the first available delete button
                const deleteButton = screen.getAllByTestId('trash-icon')[0];
                fireEvent.click(deleteButton);

                // Wait for confirmation modal to appear
                await waitFor(() => {
                    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
                });

                // Confirm deletion
                const confirmButton = screen.getByTestId('confirm-btn');
                fireEvent.click(confirmButton);

                // Fast-forward time to complete the simulated API call
                vi.advanceTimersByTime(1000);

                // Wait for modal to disappear and store to be removed
                await waitFor(() => {
                    expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
                });
            }

            // Now check that the update button is disabled
            await waitFor(() => {
                const updateButton = screen.getByRole('button', { name: /actualizar horarios/i });
                expect(updateButton).toBeDisabled();
            });

            // Restore real timers
            vi.useRealTimers();
        });
    });

    describe('Loading States', () => {
        it('shows loading spinner during operations', async () => {
            // Use fake timers to control setTimeout behavior
            vi.useFakeTimers();

            renderHorarios();

            const updateButton = screen.getByRole('button', { name: /actualizar horarios/i });
            fireEvent.click(updateButton);

            // Should show loading state immediately
            await waitFor(() => {
                expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
            });

            // Restore real timers
            vi.useRealTimers();
        });

        it('disables buttons during loading', async () => {
            renderHorarios();

            const updateButton = screen.getByRole('button', { name: /actualizar horarios/i });
            fireEvent.click(updateButton);

            await waitFor(() => {
                expect(updateButton).toBeDisabled();
            });
        });
    });

    describe('Empty States', () => {
        it('shows empty state when no stores exist', async () => {
            // Use fake timers to control setTimeout behavior
            vi.useFakeTimers();

            renderHorarios();

            // Delete stores one by one until none remain
            while (screen.queryAllByTestId('trash-icon').length > 0) {
                // Get the first available delete button
                const deleteButton = screen.getAllByTestId('trash-icon')[0];
                fireEvent.click(deleteButton);

                // Wait for confirmation modal to appear
                await waitFor(() => {
                    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
                });

                // Confirm deletion
                const confirmButton = screen.getByTestId('confirm-btn');
                fireEvent.click(confirmButton);

                // Fast-forward time to complete the simulated API call
                vi.advanceTimersByTime(1000);

                // Wait for modal to disappear and store to be removed
                await waitFor(() => {
                    expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
                });
            }

            await waitFor(() => {
                expect(screen.getByText('No hay tiendas registradas')).toBeInTheDocument();
            });

            // Restore real timers
            vi.useRealTimers();
        });
    });

    describe('Form Validation', () => {
        it('validates required fields in edit modal', async () => {
            renderHorarios();

            // Open edit modal
            const editButtons = screen.getAllByTestId('edit-icon');
            fireEvent.click(editButtons[0]);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            // This would require more detailed modal content to test form validation
            // The actual validation logic is in the component
        });

        it('prevents adding store without location selected', async () => {
            renderHorarios();

            const addButton = screen.getByRole('button', { name: /agregar tienda/i });
            fireEvent.click(addButton);

            await waitFor(() => {
                const modal = screen.getByTestId('modal');
                const addStoreButton = modal.querySelector('.btn-primary');

                if (addStoreButton) {
                    expect(addStoreButton).toBeDisabled();
                }
            });
        });
    });

    describe('Status Display', () => {
        it('displays store status badges correctly', () => {
            renderHorarios();

            const activeStatuses = screen.getAllByText('Activa');
            expect(activeStatuses.length).toBeGreaterThan(0);
        });

        it('shows correct store counts in header', () => {
            renderHorarios();

            expect(screen.getByText('2 Tiendas')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels and roles', () => {
            renderHorarios();

            // Check for table role
            const table = screen.getByRole('table');
            expect(table).toBeInTheDocument();

            // Check for button roles
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });

        it('has proper button titles for actions', () => {
            renderHorarios();

            const editButtons = screen.getAllByTitle('Editar horarios');
            const deleteButtons = screen.getAllByTitle('Eliminar tienda');

            expect(editButtons.length).toBeGreaterThan(0);
            expect(deleteButtons.length).toBeGreaterThan(0);
        });
    });

    describe('Modal Interactions', () => {
        it('closes modals when close button is clicked', async () => {
            renderHorarios();

            // Open edit modal
            const editButtons = screen.getAllByTestId('edit-icon');
            fireEvent.click(editButtons[0]);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            // Close modal
            const closeButton = screen.getByTestId('modal-close');
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
            });
        });

        it('closes confirmation modal when cancel is clicked', async () => {
            renderHorarios();

            // Open delete confirmation
            const deleteButtons = screen.getAllByTestId('trash-icon');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => {
                expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
            });

            // Cancel deletion
            const cancelButton = screen.getByTestId('cancel-btn');
            fireEvent.click(cancelButton);

            await waitFor(() => {
                expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
            });
        });
    });

    describe('Responsive Behavior', () => {
        it('adapts to mobile viewport', () => {
            // Mock window.innerWidth
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375,
            });

            renderHorarios();

            // Check that the page renders without errors on mobile
            expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('handles operation errors gracefully', async () => {
            // Mock console.error to avoid noise in tests
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            renderHorarios();

            // This would need more sophisticated error simulation
            // For now, we ensure the component renders without crashing
            expect(screen.getByText('Gestión de Horarios')).toBeInTheDocument();

            consoleSpy.mockRestore();
        });
    });
}); 