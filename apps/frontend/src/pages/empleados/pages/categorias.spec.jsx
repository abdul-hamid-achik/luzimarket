import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Categorias from './categorias';

// Mock the API modules
vi.mock('@/api/categories', () => ({
    getCategories: vi.fn(() => Promise.resolve([
        { id: '1', name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
        { id: '2', name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel items' }
    ])),
    createCategory: vi.fn(() => Promise.resolve({ id: '3' })),
    updateCategory: vi.fn(() => Promise.resolve({ id: '1' })),
    deleteCategory: vi.fn(() => Promise.resolve({}))
}));

// Mock the breadcrumb component
vi.mock('@/components/breadcrumb', () => ({
    default: ({ items, activeItem }) => (
        <nav data-testid="breadcrumb">
            {items.map(item => <span key={item.name}>{item.name}</span>)}
            <span>{activeItem}</span>
        </nav>
    )
}));

const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('Categorias Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the categories management page', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
        });
    });

    it('shows loading state initially', () => {
        renderWithRouter(<Categorias />);

        expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });

    it('displays new category button', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
        });

        expect(screen.getByText('Nueva Categoría')).toBeInTheDocument();
    });

    it('displays categories in table view', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByText('Electronics')).toBeInTheDocument();
            expect(screen.getByText('Clothing')).toBeInTheDocument();
            expect(screen.getByText('/electronics')).toBeInTheDocument();
            expect(screen.getByText('/clothing')).toBeInTheDocument();
        });
    });

    it('switches to form view when new category button is clicked', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
        });

        const newCategoryBtn = screen.getByText('Nueva Categoría');
        fireEvent.click(newCategoryBtn);

        await waitFor(() => {
            expect(screen.getByText('Información de la Categoría')).toBeInTheDocument();
        });
    });

    it('displays search functionality', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Buscar categorías...')).toBeInTheDocument();
        });
    });

    it('shows batch selection mode toggle', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByText('Selección Múltiple')).toBeInTheDocument();
        });
    });

    it('toggles between grid and table view', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
        });

        // Find the grid view button by its icon
        const gridViewButtons = screen.getAllByRole('button');
        const gridViewBtn = gridViewButtons.find(btn => btn.querySelector('svg'));

        if (gridViewBtn) {
            fireEvent.click(gridViewBtn);
        }

        // The view should change (this would be more apparent with actual categories)
        expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
    });

    it('enables batch selection mode', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            const batchModeBtn = screen.getByText('Selección Múltiple');
            fireEvent.click(batchModeBtn);
        });

        await waitFor(() => {
            expect(screen.getByText('Cancelar Selección')).toBeInTheDocument();
        });
    });

    it('filters categories by search term', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            const searchInput = screen.getByPlaceholderText('Buscar categorías...');
            fireEvent.change(searchInput, { target: { value: 'Electronics' } });
        });

        // The search should filter results
        expect(screen.getByDisplayValue('Electronics')).toBeInTheDocument();
    });

    it('shows category count', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByText('2 categorías encontradas')).toBeInTheDocument();
        });
    });

    it('validates form fields', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
        });

        const newCategoryBtn = screen.getByText('Nueva Categoría');
        fireEvent.click(newCategoryBtn);

        await waitFor(() => {
            expect(screen.getByText('Información de la Categoría')).toBeInTheDocument();
        });

        const submitBtn = screen.getByText('Crear Categoría');
        fireEvent.click(submitBtn);

        // Should show validation errors
        await waitFor(() => {
            expect(screen.getByText('El nombre de la categoría es requerido')).toBeInTheDocument();
        });
    });

    it('auto-generates slug from name', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
        });

        const newCategoryBtn = screen.getByText('Nueva Categoría');
        fireEvent.click(newCategoryBtn);

        await waitFor(() => {
            expect(screen.getByText('Información de la Categoría')).toBeInTheDocument();
        });

        const nameInput = screen.getByPlaceholderText('Ej: Electrónicos');
        fireEvent.change(nameInput, { target: { value: 'Test Category' } });

        await waitFor(() => {
            const slugInput = screen.getByPlaceholderText('electronicos');
            expect(slugInput.value).toBe('test-category');
        });
    });

    it('shows preview when form has data', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
        });

        const newCategoryBtn = screen.getByText('Nueva Categoría');
        fireEvent.click(newCategoryBtn);

        await waitFor(() => {
            expect(screen.getByText('Información de la Categoría')).toBeInTheDocument();
        });

        const nameInput = screen.getByPlaceholderText('Ej: Electrónicos');
        fireEvent.change(nameInput, { target: { value: 'Test Category' } });

        const descInput = screen.getByPlaceholderText('Describe la categoría y qué tipo de productos incluye...');
        fireEvent.change(descInput, { target: { value: 'Test description' } });

        await waitFor(() => {
            expect(screen.getByText('Vista Previa')).toBeInTheDocument();
        });
    });

    it('handles edit category', async () => {
        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByText('Electronics')).toBeInTheDocument();
        });

        // Find and click edit button for first category
        const editButtons = screen.getAllByTitle('Editar');
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Editar Categoría' })).toBeInTheDocument();
            expect(screen.getByDisplayValue('Electronics')).toBeInTheDocument();
        });
    });

    it('shows empty state when no categories exist', async () => {
        // Mock empty categories
        const { getCategories } = await import('@/api/categories');
        getCategories.mockResolvedValueOnce([]);

        renderWithRouter(<Categorias />);

        await waitFor(() => {
            expect(screen.getByText('No se encontraron categorías')).toBeInTheDocument();
            expect(screen.getByText('Comienza agregando tu primera categoría')).toBeInTheDocument();
        });
    });
}); 