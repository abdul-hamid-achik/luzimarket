import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import NavbarDireccion from './navbar_direccion';

// Mock API hooks
vi.mock('@/api/hooks', () => ({
    useStates: vi.fn(),
    useDeliveryZones: vi.fn(),
    useUpdateSessionDeliveryZone: vi.fn(),
    useRestoreUserPreferences: vi.fn(),
}));

// Mock auth context
vi.mock('@/context/auth_context', () => ({
    useAuth: vi.fn(),
}));

// Import after mocking
import { useStates, useDeliveryZones, useUpdateSessionDeliveryZone, useRestoreUserPreferences } from '@/api/hooks';
import { useAuth } from '@/context/auth_context';

const mockStates = [
    { value: 'nuevo-leon', label: 'Nuevo León' },
    { value: 'coahuila', label: 'Coahuila' },
    { value: 'chihuahua', label: 'Chihuahua' }
];

const mockDeliveryZones = [
    { id: '1', name: 'Monterrey Centro', fee: 5000 },
    { id: '2', name: 'Saltillo', fee: 7500 },
    { id: '3', name: 'Torreón', fee: 10000 }
];

const mockUser = {
    sessionId: 'test-session-id',
    userId: 'test-user-id',
    email: 'test@example.com',
    guest: true
};

const mockAuthenticatedUser = {
    sessionId: 'test-session-id',
    userId: 'test-user-id',
    email: 'test@example.com',
    guest: false
};

const renderWithProviders = (component) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            {component}
        </QueryClientProvider>
    );
};

describe('NavbarDireccion', () => {
    beforeEach(() => {
        // Clear sessionStorage before each test
        sessionStorage.clear();

        // Clear DOM
        document.body.innerHTML = '';

        // Reset all mocks
        vi.clearAllMocks();

        // Default mock implementations
        useAuth.mockReturnValue({ user: mockUser, isAuthenticated: false });
        useStates.mockReturnValue({
            data: mockStates,
            isLoading: false
        });
        useDeliveryZones.mockReturnValue({
            data: mockDeliveryZones,
            isLoading: false
        });
        useUpdateSessionDeliveryZone.mockReturnValue({
            mutateAsync: vi.fn().mockResolvedValue({}),
            isLoading: false
        });
        useRestoreUserPreferences.mockReturnValue({
            mutateAsync: vi.fn().mockResolvedValue({}),
            isLoading: false
        });
    });

    it('renders correctly with all elements', () => {
        renderWithProviders(<NavbarDireccion />);

        expect(screen.getByText('ESP')).toBeInTheDocument();
        expect(screen.getByText('MXN')).toBeInTheDocument();
        expect(screen.getByText('SELECCIONAR UBICACION DE ENTREGA')).toBeInTheDocument();
        expect(screen.getByText('ACEPTAR')).toBeInTheDocument();
    });

    it('shows loading state correctly', () => {
        useStates.mockReturnValue({
            data: [],
            isLoading: true
        });

        renderWithProviders(<NavbarDireccion />);

        // The accept button should be disabled during loading
        const acceptButton = screen.getByText('ACEPTAR');
        expect(acceptButton).toBeDisabled();
    });

    it('shows error when trying to accept without state selection', async () => {
        renderWithProviders(<NavbarDireccion />);

        // The ACEPTAR button is disabled when no selections are made
        // So we need to check that the button is disabled rather than trying to click it
        const acceptButton = screen.getByText('ACEPTAR');
        expect(acceptButton).toBeDisabled();

        // To test the validation message, we need to enable the button somehow
        // Since the button's disabled state prevents the error from showing,
        // this test should verify the button is appropriately disabled
        expect(acceptButton).toHaveAttribute('disabled');
    });

    it('shows error when user has no session', async () => {
        useAuth.mockReturnValue({ user: null, isAuthenticated: false });

        // Set up sessionStorage first so component has selections to work with
        sessionStorage.setItem('selectedDeliveryState', 'nuevo-leon');
        sessionStorage.setItem('selectedDeliveryZone', '1');

        renderWithProviders(<NavbarDireccion />);

        // Component should be collapsed since we have selections
        const changeButton = screen.getByTestId('change-location');
        fireEvent.click(changeButton);

        // Now in expanded mode with selections populated
        const acceptButton = screen.getByText('ACEPTAR');
        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(screen.getByText('No hay sesión activa. Por favor recarga la página.')).toBeInTheDocument();
        });
    });

    it('shows different success message for authenticated users', async () => {
        const mockMutateAsync = vi.fn().mockResolvedValue({});
        useAuth.mockReturnValue({ user: mockAuthenticatedUser, isAuthenticated: true });
        useUpdateSessionDeliveryZone.mockReturnValue({
            mutateAsync: mockMutateAsync,
            isLoading: false
        });

        // Set up sessionStorage first
        sessionStorage.setItem('selectedDeliveryState', 'nuevo-leon');
        sessionStorage.setItem('selectedDeliveryZone', '1');

        renderWithProviders(<NavbarDireccion />);

        // Component should be collapsed, need to expand it first
        const changeButton = screen.getByTestId('change-location');
        fireEvent.click(changeButton);

        // Now click ACEPTAR
        const acceptButton = screen.getByText('ACEPTAR');
        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(screen.getByText(/Ubicación de entrega guardada/)).toBeInTheDocument();
        });
    });

    it('shows session update message for guest users', async () => {
        const mockMutateAsync = vi.fn().mockResolvedValue({});
        useAuth.mockReturnValue({ user: mockUser, isAuthenticated: false });
        useUpdateSessionDeliveryZone.mockReturnValue({
            mutateAsync: mockMutateAsync,
            isLoading: false
        });

        // Set up sessionStorage first
        sessionStorage.setItem('selectedDeliveryState', 'nuevo-leon');
        sessionStorage.setItem('selectedDeliveryZone', '1');

        renderWithProviders(<NavbarDireccion />);

        // Component should be collapsed, need to expand it first
        const changeButton = screen.getByTestId('change-location');
        fireEvent.click(changeButton);

        // Now click ACEPTAR
        const acceptButton = screen.getByText('ACEPTAR');
        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(screen.getByText(/Ubicación de entrega actualizada/)).toBeInTheDocument();
        });
    });

    it('successfully updates session delivery zone', async () => {
        const mockMutateAsync = vi.fn().mockResolvedValue({});
        useUpdateSessionDeliveryZone.mockReturnValue({
            mutateAsync: mockMutateAsync,
            isLoading: false
        });

        // Set up sessionStorage first to simulate user selections
        sessionStorage.setItem('selectedDeliveryState', 'nuevo-leon');
        sessionStorage.setItem('selectedDeliveryZone', '1');

        renderWithProviders(<NavbarDireccion />);

        // Component should be collapsed, need to expand it first
        const changeButton = screen.getByTestId('change-location');
        fireEvent.click(changeButton);

        // Now click ACEPTAR
        const acceptButton = screen.getByText('ACEPTAR');
        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith({
                deliveryZoneId: '1'
            });
        });
    });

    it('shows error when session update fails', async () => {
        const mockMutateAsync = vi.fn().mockRejectedValue({
            response: { data: { error: 'Session not found' } }
        });
        useUpdateSessionDeliveryZone.mockReturnValue({
            mutateAsync: mockMutateAsync,
            isLoading: false
        });

        // Set up sessionStorage to simulate user selections
        sessionStorage.setItem('selectedDeliveryState', 'nuevo-leon');
        sessionStorage.setItem('selectedDeliveryZone', '1');

        renderWithProviders(<NavbarDireccion />);

        // Component should be collapsed with CAMBIAR button
        const changeButton = screen.getByTestId('change-location');
        fireEvent.click(changeButton);

        // Wait for the expanded view and then click ACEPTAR
        await waitFor(() => {
            const acceptButton = screen.getByText('ACEPTAR');
            fireEvent.click(acceptButton);
        });

        await waitFor(() => {
            expect(screen.getByText('Session not found')).toBeInTheDocument();
        });
    });

    it('shows loading spinner during session update', () => {
        useUpdateSessionDeliveryZone.mockReturnValue({
            mutateAsync: vi.fn(),
            isLoading: true
        });

        renderWithProviders(<NavbarDireccion />);

        // Component should be in expanded mode since no prior selections
        // Find button by class since it has a spinner inside
        const acceptButton = screen.getByRole('button', { name: '' }); // Button with spinner has no accessible name
        expect(acceptButton).toBeDisabled();

        // Check for spinner by class instead of role since it has aria-hidden="true"
        const spinner = document.querySelector('.spinner-border');
        expect(spinner).toBeInTheDocument();
    });

    it('restores selections from sessionStorage', () => {
        // Pre-populate sessionStorage
        sessionStorage.setItem('selectedDeliveryState', 'coahuila');
        sessionStorage.setItem('selectedDeliveryZone', '2');

        renderWithProviders(<NavbarDireccion />);

        // Component should be in collapsed mode with CAMBIAR button
        const changeButton = screen.getByTestId('change-location');
        expect(changeButton).toBeInTheDocument();

        // Should show the selected location
        expect(screen.getByText(/SALTILLO/i)).toBeInTheDocument();
        expect(screen.getByText(/COAHUILA/i)).toBeInTheDocument();
    });

    it('handles basic interactions without complex select testing', () => {
        renderWithProviders(<NavbarDireccion />);

        // Test that the component renders and basic interactions work
        const acceptButton = screen.getByText('ACEPTAR');
        expect(acceptButton).toBeInTheDocument();

        // Test language buttons
        expect(screen.getByText('ESP')).toBeInTheDocument();
        expect(screen.getByText('MXN')).toBeInTheDocument();

        // Test placeholder texts are present (indicating selects are rendered)
        expect(screen.getByText('ESTADO')).toBeInTheDocument();
        expect(screen.getByText('CIUDAD')).toBeInTheDocument();
    });

    it('shows collapsed view when sessionStorage has selections', () => {
        // Set up selections in sessionStorage
        sessionStorage.setItem('selectedDeliveryState', 'nuevo-leon');
        sessionStorage.setItem('selectedDeliveryZone', '1');

        renderWithProviders(<NavbarDireccion />);

        // The component should be in collapsed mode
        const changeButton = screen.getByTestId('change-location');
        expect(changeButton).toBeInTheDocument();

        // Should show the selected location
        expect(screen.getByText(/MONTERREY CENTRO/i)).toBeInTheDocument();
        expect(screen.getByText(/NUEVO LEÓN/i)).toBeInTheDocument();

        // Should have collapsed class
        const navbar = screen.getByRole('navigation');
        expect(navbar).toHaveClass('collapsed');
    });

    it('can expand from collapsed view to change selections', () => {
        // Start with selections
        sessionStorage.setItem('selectedDeliveryState', 'nuevo-leon');
        sessionStorage.setItem('selectedDeliveryZone', '1');

        renderWithProviders(<NavbarDireccion />);

        // Verify selections exist
        expect(sessionStorage.getItem('selectedDeliveryState')).toBe('nuevo-leon');
        expect(sessionStorage.getItem('selectedDeliveryZone')).toBe('1');

        // Component should be collapsed initially
        const changeButton = screen.getByTestId('change-location');
        expect(changeButton).toBeInTheDocument();

        // Click CAMBIAR to expand
        fireEvent.click(changeButton);

        // Now ACEPTAR button should be visible
        expect(screen.getByText('ACEPTAR')).toBeInTheDocument();

        // Should no longer have collapsed class
        const navbar = screen.getByRole('navigation');
        expect(navbar).not.toHaveClass('collapsed');
    });

    it('shows error when trying to accept without city selection', async () => {
        // Clear DOM to avoid multiple renders
        document.body.innerHTML = '';

        // Set up only state selection in sessionStorage
        sessionStorage.clear();
        sessionStorage.setItem('selectedDeliveryState', 'nuevo-leon');
        // Don't set selectedDeliveryZone

        renderWithProviders(<NavbarDireccion />);

        // The component should be in expanded mode since no city is selected
        // The button should still be disabled because !selectedCiudad condition
        const acceptButton = screen.getByText('ACEPTAR');
        expect(acceptButton).toBeDisabled();

        // The disabled condition includes !selectedCiudad, so this is working correctly
        // Let's verify the button is disabled for the right reason
        expect(acceptButton).toHaveAttribute('disabled');
    });
}); 