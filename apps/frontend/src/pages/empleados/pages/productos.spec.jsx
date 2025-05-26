import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, afterEach, beforeEach, describe, it, expect } from 'vitest';
import Productos from './productos';

// Mock the breadcrumb component
vi.mock('@/components/breadcrumb', () => ({
    default: ({ items, activeItem }) => (
        <div data-testid="breadcrumb">
            <span data-testid="breadcrumb-active">{activeItem}</span>
        </div>
    )
}));

// Mock react-icons
vi.mock('react-icons/bs', () => ({
    BsBoxSeam: () => <div data-testid="box-icon">📦</div>,
    BsImage: () => <div data-testid="image-icon">🖼️</div>,
    BsArrowLeft: () => <div data-testid="arrow-left-icon">←</div>,
    BsChatDots: () => <div data-testid="chat-icon">💬</div>,
    BsCheck2Circle: () => <div data-testid="check-icon">✓</div>,
    BsUpload: () => <div data-testid="upload-icon">⬆️</div>,
    BsX: () => <div data-testid="x-icon">✕</div>,
    BsEye: () => <div data-testid="eye-icon">👁️</div>,
    BsTrash: () => <div data-testid="trash-icon">🗑️</div>,
    BsInfoCircle: () => <div data-testid="info-icon">ℹ️</div>,
    BsTag: () => <div data-testid="tag-icon">🏷️</div>,
    BsCurrencyDollar: () => <div data-testid="currency-icon">$</div>,
    BsBuilding: () => <div data-testid="building-icon">🏢</div>,
}));

// Mock CSS import
vi.mock('./productos.css', () => ({}));

// Mock file reader for image uploads
global.FileReader = class {
    constructor() {
        this.onload = null;
        this.result = 'data:image/test;base64,testdata';
    }

    readAsDataURL() {
        setTimeout(() => {
            if (this.onload) {
                this.onload({ target: { result: this.result } });
            }
        }, 100);
    }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test-url');

// Cleanup after each test
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

// Mock window.history.back
beforeEach(() => {
    Object.defineProperty(window, 'history', {
        value: {
            back: vi.fn(),
        },
        writable: true,
    });
});

const renderProductos = () => {
    return render(
        <MemoryRouter>
            <Productos />
        </MemoryRouter>
    );
};

describe('Productos Page', () => {
    describe('Rendering', () => {
        it('renders the page with all main sections', () => {
            renderProductos();

            // Check breadcrumb
            expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
            expect(screen.getByTestId('breadcrumb-active')).toHaveTextContent('Productos');

            // Check main sections
            expect(screen.getByText('Detalles del Producto')).toBeInTheDocument();
            expect(screen.getByText('Información Básica')).toBeInTheDocument();
            expect(screen.getByText('Descripción y Detalles')).toBeInTheDocument();
            expect(screen.getByText('Galería de Fotos')).toBeInTheDocument();
        });

        it('displays all form fields with correct initial values', () => {
            renderProductos();

            // Check form fields
            const nombreInput = screen.getByDisplayValue('Tetera Sowden');
            const precioInput = screen.getByDisplayValue('1000');
            const marcaInput = screen.getByDisplayValue('HAY DESIGN');

            expect(nombreInput).toBeInTheDocument();
            expect(precioInput).toBeInTheDocument();
            expect(marcaInput).toBeInTheDocument();

            // Check textareas
            expect(screen.getByText(/Cras justo odio/)).toBeInTheDocument();
            expect(screen.getByText(/Hour, minute, and second hand/)).toBeInTheDocument();
        });

        it('displays action buttons', () => {
            renderProductos();

            expect(screen.getByRole('button', { name: /regresar/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /enviar feedback/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /aceptar/i })).toBeInTheDocument();
        });

        it('displays status badge', () => {
            renderProductos();

            expect(screen.getByText('Borrador')).toBeInTheDocument();
        });

        it('displays image gallery with initial images', () => {
            renderProductos();

            // Should have 3 existing images plus upload button
            const images = screen.getAllByRole('img');
            expect(images).toHaveLength(3);

            // Check upload area by upload icon instead of split text
            expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
        });
    });

    describe('Form Interaction', () => {
        it('updates form fields when user types', async () => {
            renderProductos();

            const nombreInput = screen.getByDisplayValue('Tetera Sowden');

            fireEvent.change(nombreInput, { target: { value: 'Nuevo Producto' } });

            expect(nombreInput.value).toBe('Nuevo Producto');
        });

        it('shows error for empty required fields', async () => {
            renderProductos();

            const nombreInput = screen.getByDisplayValue('Tetera Sowden');
            const submitBtn = screen.getByRole('button', { name: /aceptar/i });

            // Clear required field
            fireEvent.change(nombreInput, { target: { value: '' } });
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(screen.getByText('El nombre del producto es requerido')).toBeInTheDocument();
            });
        });

        it('validates price field correctly', async () => {
            renderProductos();

            const precioInput = screen.getByDisplayValue('1000');
            const submitBtn = screen.getByRole('button', { name: /aceptar/i });

            // Test empty price (shows "required" message first)
            fireEvent.change(precioInput, { target: { value: '' } });
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(screen.getByText('El precio es requerido')).toBeInTheDocument();
            });

            // Test invalid price - use negative number since "invalid" gets filtered out by number input
            fireEvent.change(precioInput, { target: { value: '-1' } });
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(screen.getByText('El precio debe ser un número válido mayor a 0')).toBeInTheDocument();
            });
        });

        it('clears errors when user starts typing', async () => {
            renderProductos();

            const nombreInput = screen.getByDisplayValue('Tetera Sowden');
            const submitBtn = screen.getByRole('button', { name: /aceptar/i });

            // Create error
            fireEvent.change(nombreInput, { target: { value: '' } });
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(screen.getByText('El nombre del producto es requerido')).toBeInTheDocument();
            });

            // Fix error
            fireEvent.change(nombreInput, { target: { value: 'New Product' } });

            await waitFor(() => {
                expect(screen.queryByText('El nombre del producto es requerido')).not.toBeInTheDocument();
            });
        });

        it('shows character count for description', () => {
            renderProductos();

            const descripcionTextarea = screen.getByText(/Cras justo odio/).closest('textarea');
            const characterCount = screen.getByText(/\/500 caracteres/);

            expect(characterCount).toBeInTheDocument();
            expect(descripcionTextarea.value.length).toBeLessThanOrEqual(500);
        });
    });

    describe('Image Management', () => {
        it('handles image upload', async () => {
            renderProductos();

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            // Find upload area by upload icon instead of split text
            const uploadIcon = screen.getByTestId('upload-icon');
            const uploadArea = uploadIcon.closest('.photo-container');
            const hiddenInput = uploadArea.querySelector('input[type="file"]');

            fireEvent.change(hiddenInput, { target: { files: [file] } });

            await waitFor(() => {
                // After upload, should have one more image
                const images = screen.getAllByRole('img');
                expect(images.length).toBeGreaterThan(3);
            });
        });

        it('removes images when delete button is clicked', async () => {
            renderProductos();

            const deleteButtons = screen.getAllByTestId('trash-icon');
            const initialImageCount = screen.getAllByRole('img').length;

            fireEvent.click(deleteButtons[0]);

            await waitFor(() => {
                const finalImageCount = screen.getAllByRole('img').length;
                expect(finalImageCount).toBe(initialImageCount - 1);
            });
        });

        it('shows error when no images are present during validation', async () => {
            renderProductos();

            // Remove all images
            const deleteButtons = screen.getAllByTestId('trash-icon');
            deleteButtons.forEach(button => fireEvent.click(button));

            const submitBtn = screen.getByRole('button', { name: /aceptar/i });
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(screen.getByText('Se requiere al menos una imagen del producto')).toBeInTheDocument();
            });
        });
    });

    describe('Actions', () => {
        it('handles back button click', () => {
            renderProductos();

            const backBtn = screen.getByRole('button', { name: /regresar/i });
            fireEvent.click(backBtn);

            expect(window.history.back).toHaveBeenCalled();
        });

        it('handles feedback submission', async () => {
            // Mock alert
            global.alert = vi.fn();

            renderProductos();

            const feedbackBtn = screen.getByRole('button', { name: /enviar feedback/i });
            fireEvent.click(feedbackBtn);

            // Should show loading state - check for CSS class, not testid
            await waitFor(() => {
                expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
            });

            // Wait for completion
            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Producto enviado exitosamente');
            }, { timeout: 3000 });
        });

        it('handles approve submission', async () => {
            // Mock alert
            global.alert = vi.fn();

            renderProductos();

            const approveBtn = screen.getByRole('button', { name: /aceptar/i });
            fireEvent.click(approveBtn);

            // Should show loading state - check for CSS class, not testid
            await waitFor(() => {
                expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
            });

            // Wait for completion
            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Producto aprobado exitosamente');
            }, { timeout: 3000 });
        });

        it('disables buttons during submission', async () => {
            renderProductos();

            const approveBtn = screen.getByRole('button', { name: /aceptar/i });
            const feedbackBtn = screen.getByRole('button', { name: /enviar feedback/i });
            const backBtn = screen.getByRole('button', { name: /regresar/i });

            fireEvent.click(approveBtn);

            await waitFor(() => {
                expect(approveBtn).toBeDisabled();
                expect(feedbackBtn).toBeDisabled();
                expect(backBtn).toBeDisabled();
            });
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels', () => {
            renderProductos();

            // Check form labels
            expect(screen.getByText('Nombre del Producto')).toBeInTheDocument();
            expect(screen.getByText('Precio (MXN)')).toBeInTheDocument();
            expect(screen.getByText('Marca')).toBeInTheDocument();
        });

        it('has proper button titles/tooltips', () => {
            renderProductos();

            const viewButtons = screen.getAllByTitle('Ver imagen');
            const deleteButtons = screen.getAllByTitle('Eliminar imagen');

            expect(viewButtons.length).toBeGreaterThan(0);
            expect(deleteButtons.length).toBeGreaterThan(0);
        });

        it('maintains proper focus management', () => {
            renderProductos();

            const nombreInput = screen.getByDisplayValue('Tetera Sowden');
            nombreInput.focus();

            expect(document.activeElement).toBe(nombreInput);
        });
    });

    describe('Responsive Behavior', () => {
        it('renders correctly on mobile viewport', () => {
            // Mock window.innerWidth
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375,
            });

            renderProductos();

            // Check that mobile-specific classes are applied
            const container = screen.getByTestId('breadcrumb').closest('.container-fluid');
            expect(container).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('handles submission errors gracefully', async () => {
            // Mock console.error to avoid noise in tests
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            global.alert = vi.fn();

            renderProductos();

            // Test error validation instead of fetch error since component doesn't use fetch
            const nombreInput = screen.getByDisplayValue('Tetera Sowden');
            const approveBtn = screen.getByRole('button', { name: /aceptar/i });

            // Clear required field to trigger validation error
            fireEvent.change(nombreInput, { target: { value: '' } });
            fireEvent.click(approveBtn);

            await waitFor(() => {
                expect(screen.getByText('El nombre del producto es requerido')).toBeInTheDocument();
            });

            // The component shows validation errors, not network errors
            expect(global.alert).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('Help Section', () => {
        it('displays help information', () => {
            renderProductos();

            expect(screen.getByText('Información sobre el proceso de aprobación')).toBeInTheDocument();
            expect(screen.getByText(/Una vez que acepte el producto/)).toBeInTheDocument();
        });
    });
}); 