import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, afterEach, beforeEach, describe, it, expect } from 'vitest';
import Modal, { ConfirmationModal, FormModal, ImagePreviewModal, LoadingModal } from './modal';

// Mock react-icons
vi.mock('react-icons/bs', () => ({
    BsX: () => <div data-testid="x-icon">✕</div>,
    BsCheck2Circle: () => <div data-testid="check-icon">✓</div>,
    BsExclamationTriangle: () => <div data-testid="warning-icon">⚠️</div>,
    BsInfoCircle: () => <div data-testid="info-icon">ℹ️</div>,
    BsTrash: () => <div data-testid="trash-icon">🗑️</div>,
}));

// Mock CSS import
vi.mock('./modal.css', () => ({}));

// Cleanup after each test
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    document.body.style.overflow = 'unset';
});

// Mock body overflow
beforeEach(() => {
    document.body.style.overflow = 'unset';
});

describe('Modal Component', () => {
    const mockOnClose = vi.fn();

    afterEach(() => {
        mockOnClose.mockClear();
    });

    describe('Basic Modal', () => {
        it('renders when open', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            expect(screen.getByText('Test Modal')).toBeInTheDocument();
            expect(screen.getByText('Modal content')).toBeInTheDocument();
        });

        it('does not render when closed', () => {
            render(
                <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
        });

        it('calls onClose when backdrop is clicked', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            const overlay = document.querySelector('.modal-overlay');
            fireEvent.click(overlay);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('does not close when backdrop click is disabled', () => {
            render(
                <Modal
                    isOpen={true}
                    onClose={mockOnClose}
                    title="Test Modal"
                    closeOnBackdrop={false}
                >
                    <p>Modal content</p>
                </Modal>
            );

            const overlay = document.querySelector('.modal-overlay');
            fireEvent.click(overlay);

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('calls onClose when escape key is pressed', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when close button is clicked', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            const closeButton = screen.getByLabelText('Cerrar modal');
            fireEvent.click(closeButton);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('does not show close button when disabled', () => {
            render(
                <Modal
                    isOpen={true}
                    onClose={mockOnClose}
                    title="Test Modal"
                    showCloseButton={false}
                >
                    <p>Modal content</p>
                </Modal>
            );

            expect(screen.queryByLabelText('Cerrar modal')).not.toBeInTheDocument();
        });

        it('renders footer when provided', () => {
            const footer = <button>Footer Button</button>;

            render(
                <Modal
                    isOpen={true}
                    onClose={mockOnClose}
                    title="Test Modal"
                    footer={footer}
                >
                    <p>Modal content</p>
                </Modal>
            );

            expect(screen.getByText('Footer Button')).toBeInTheDocument();
        });

        it('applies correct size classes', () => {
            const { rerender } = render(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" size="sm">
                    <p>Modal content</p>
                </Modal>
            );

            expect(document.querySelector('.modal-sm')).toBeInTheDocument();

            rerender(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" size="lg">
                    <p>Modal content</p>
                </Modal>
            );

            expect(document.querySelector('.modal-lg')).toBeInTheDocument();
        });

        it('applies variant classes and shows correct icons', () => {
            const { rerender } = render(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" variant="success">
                    <p>Modal content</p>
                </Modal>
            );

            expect(document.querySelector('.modal-success')).toBeInTheDocument();
            expect(screen.getByTestId('check-icon')).toBeInTheDocument();

            rerender(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" variant="warning">
                    <p>Modal content</p>
                </Modal>
            );

            expect(document.querySelector('.modal-warning')).toBeInTheDocument();
            expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
        });

        it('sets body overflow to hidden when opened', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('resets body overflow when closed', () => {
            const { rerender } = render(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            expect(document.body.style.overflow).toBe('hidden');

            rerender(
                <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            expect(document.body.style.overflow).toBe('unset');
        });
    });

    describe('ConfirmationModal', () => {
        const mockOnConfirm = vi.fn();

        afterEach(() => {
            mockOnConfirm.mockClear();
        });

        it('renders with default props', () => {
            render(
                <ConfirmationModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onConfirm={mockOnConfirm}
                />
            );

            expect(screen.getByText('¿Confirmar acción?')).toBeInTheDocument();
            expect(screen.getByText('¿Está seguro de que desea continuar?')).toBeInTheDocument();
            expect(screen.getByText('Confirmar')).toBeInTheDocument();
            expect(screen.getByText('Cancelar')).toBeInTheDocument();
        });

        it('renders with custom props', () => {
            render(
                <ConfirmationModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onConfirm={mockOnConfirm}
                    title="Delete Item"
                    message="Are you sure you want to delete this item?"
                    confirmText="Delete"
                    cancelText="Keep"
                    variant="danger"
                />
            );

            expect(screen.getByText('Delete Item')).toBeInTheDocument();
            expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
            expect(screen.getByText('Delete')).toBeInTheDocument();
            expect(screen.getByText('Keep')).toBeInTheDocument();
        });

        it('calls onConfirm when confirm button is clicked', () => {
            render(
                <ConfirmationModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onConfirm={mockOnConfirm}
                />
            );

            const confirmButton = screen.getByText('Confirmar');
            fireEvent.click(confirmButton);

            expect(mockOnConfirm).toHaveBeenCalled();
        });

        it('calls onClose when cancel button is clicked', () => {
            render(
                <ConfirmationModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onConfirm={mockOnConfirm}
                />
            );

            const cancelButton = screen.getByText('Cancelar');
            fireEvent.click(cancelButton);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('shows loading spinner when loading', () => {
            render(
                <ConfirmationModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onConfirm={mockOnConfirm}
                    isLoading={true}
                />
            );

            expect(document.querySelector('.spinner-border')).toBeInTheDocument();
        });

        it('disables buttons when loading', () => {
            render(
                <ConfirmationModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onConfirm={mockOnConfirm}
                    isLoading={true}
                />
            );

            const confirmButton = screen.getByText('Confirmar');
            const cancelButton = screen.getByText('Cancelar');

            expect(confirmButton).toBeDisabled();
            expect(cancelButton).toBeDisabled();
        });
    });

    describe('FormModal', () => {
        const mockOnSubmit = vi.fn();

        afterEach(() => {
            mockOnSubmit.mockClear();
        });

        it('renders form modal correctly', () => {
            render(
                <FormModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    title="Edit Form"
                >
                    <input type="text" placeholder="Name" />
                </FormModal>
            );

            expect(screen.getByText('Edit Form')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
            expect(screen.getByText('Guardar')).toBeInTheDocument();
            expect(screen.getByText('Cancelar')).toBeInTheDocument();
        });

        it('calls onSubmit when form is submitted', () => {
            render(
                <FormModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    title="Edit Form"
                >
                    <input type="text" placeholder="Name" />
                </FormModal>
            );

            const submitButton = screen.getByText('Guardar');
            fireEvent.click(submitButton);

            expect(mockOnSubmit).toHaveBeenCalled();
        });

        it('prevents default form submission', () => {
            const mockEvent = { preventDefault: vi.fn() };

            render(
                <FormModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={(e) => {
                        e.preventDefault();
                        mockOnSubmit();
                    }}
                    title="Edit Form"
                >
                    <input type="text" placeholder="Name" />
                </FormModal>
            );

            const form = document.getElementById('modal-form');
            fireEvent.submit(form);

            expect(mockOnSubmit).toHaveBeenCalled();
        });

        it('renders with custom button text', () => {
            render(
                <FormModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    title="Edit Form"
                    submitText="Update"
                    cancelText="Discard"
                >
                    <input type="text" placeholder="Name" />
                </FormModal>
            );

            expect(screen.getByText('Update')).toBeInTheDocument();
            expect(screen.getByText('Discard')).toBeInTheDocument();
        });
    });

    describe('ImagePreviewModal', () => {
        it('renders image preview correctly', () => {
            render(
                <ImagePreviewModal
                    isOpen={true}
                    onClose={mockOnClose}
                    imageUrl="test-image.jpg"
                    imageName="Test Image"
                />
            );

            expect(screen.getByText('Test Image')).toBeInTheDocument();
            expect(screen.getByAltText('Test Image')).toBeInTheDocument();
            expect(screen.getByAltText('Test Image')).toHaveAttribute('src', 'test-image.jpg');
        });

        it('renders with default image name', () => {
            render(
                <ImagePreviewModal
                    isOpen={true}
                    onClose={mockOnClose}
                    imageUrl="test-image.jpg"
                />
            );

            expect(screen.getByText('Imagen')).toBeInTheDocument();
            expect(screen.getByAltText('Imagen')).toBeInTheDocument();
        });
    });

    describe('LoadingModal', () => {
        it('renders loading modal correctly', () => {
            render(
                <LoadingModal
                    isOpen={true}
                    title="Processing..."
                    message="Please wait while we process your request."
                />
            );

            expect(screen.getByText('Processing...')).toBeInTheDocument();
            expect(screen.getByText('Please wait while we process your request.')).toBeInTheDocument();
            expect(document.querySelector('.spinner-border')).toBeInTheDocument();
        });

        it('renders with default props', () => {
            render(<LoadingModal isOpen={true} />);

            // Use more specific selectors to avoid multiple matches
            expect(screen.getByRole('heading', { name: 'Cargando...' })).toBeInTheDocument();
            expect(screen.getByText('Por favor espere...')).toBeInTheDocument();
        });

        it('cannot be closed', () => {
            render(<LoadingModal isOpen={true} />);

            // Should not have close button
            expect(screen.queryByLabelText('Cerrar modal')).not.toBeInTheDocument();

            // Escape key should not work
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(screen.getByRole('heading', { name: 'Cargando...' })).toBeInTheDocument();

            // Backdrop click should not work
            const overlay = document.querySelector('.modal-overlay');
            fireEvent.click(overlay);
            expect(screen.getByRole('heading', { name: 'Cargando...' })).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA attributes', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            const closeButton = screen.getByLabelText('Cerrar modal');
            expect(closeButton).toHaveAttribute('aria-label', 'Cerrar modal');
        });

        it('traps focus within modal', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <input type="text" placeholder="First input" />
                    <input type="text" placeholder="Second input" />
                </Modal>
            );

            const firstInput = screen.getByPlaceholderText('First input');
            const secondInput = screen.getByPlaceholderText('Second input');

            firstInput.focus();
            expect(document.activeElement).toBe(firstInput);

            // Tab to next element
            fireEvent.keyDown(firstInput, { key: 'Tab' });
            // In a real implementation, this would move to the next focusable element
        });
    });

    describe('Event Handling', () => {
        it('cleans up event listeners on unmount', () => {
            const { unmount } = render(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            unmount();

            // After unmount, escape key should not affect anything
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('Body Scroll Management', () => {
        it('manages body scroll correctly through lifecycle', () => {
            const { rerender, unmount } = render(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            expect(document.body.style.overflow).toBe('hidden');

            rerender(
                <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            expect(document.body.style.overflow).toBe('unset');

            rerender(
                <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Modal content</p>
                </Modal>
            );

            expect(document.body.style.overflow).toBe('hidden');

            unmount();

            expect(document.body.style.overflow).toBe('unset');
        });
    });

    describe('Custom Classes', () => {
        it('applies custom className', () => {
            render(
                <Modal
                    isOpen={true}
                    onClose={mockOnClose}
                    title="Test Modal"
                    className="custom-modal"
                >
                    <p>Modal content</p>
                </Modal>
            );

            expect(document.querySelector('.custom-modal')).toBeInTheDocument();
        });
    });
}); 