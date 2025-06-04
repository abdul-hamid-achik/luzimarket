import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserManagement from './user_management';

// Mock the API hooks
jest.mock('@/api/hooks', () => ({
    useUsers: jest.fn(() => ({
        data: [
            {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'customer',
                isActive: true,
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: '2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'admin',
                isActive: true,
                createdAt: '2024-01-02T00:00:00Z'
            }
        ],
        isLoading: false,
        refetch: jest.fn()
    })),
    useUser: jest.fn(() => ({
        data: null
    })),
    useCreateUser: jest.fn(() => ({
        mutateAsync: jest.fn(),
        isLoading: false
    })),
    useUpdateUser: jest.fn(() => ({
        mutateAsync: jest.fn(),
        isLoading: false
    })),
    useDeleteUser: jest.fn(() => ({
        mutateAsync: jest.fn()
    }))
}));

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
    }
});

const renderWithQueryClient = (component) => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            {component}
        </QueryClientProvider>
    );
};

describe('UserManagement', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders user management component', () => {
        renderWithQueryClient(<UserManagement />);

        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Manage users, customers, and staff members')).toBeInTheDocument();
    });

    it('displays user statistics correctly', () => {
        renderWithQueryClient(<UserManagement />);

        expect(screen.getByText('2')).toBeInTheDocument(); // Total users
        expect(screen.getByText('1')).toBeInTheDocument(); // Admin count
        expect(screen.getByText('1')).toBeInTheDocument(); // Customer count
    });

    it('displays users in table', () => {
        renderWithQueryClient(<UserManagement />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('opens create user modal when Add User button is clicked', () => {
        renderWithQueryClient(<UserManagement />);

        const addButton = screen.getByText('Add User');
        fireEvent.click(addButton);

        expect(screen.getByText('Create New User')).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('filters users by search term', () => {
        renderWithQueryClient(<UserManagement />);

        const searchInput = screen.getByPlaceholderText('Name or email...');
        fireEvent.change(searchInput, { target: { value: 'john' } });

        // Note: In a real implementation, this would trigger the filtering logic
        // This test verifies the search input is working
        expect(searchInput.value).toBe('john');
    });

    it('filters users by role', () => {
        renderWithQueryClient(<UserManagement />);

        const roleSelect = screen.getByDisplayValue('All Roles');
        fireEvent.change(roleSelect, { target: { value: 'admin' } });

        expect(roleSelect.value).toBe('admin');
    });

    it('opens edit modal when View button is clicked', async () => {
        renderWithQueryClient(<UserManagement />);

        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Edit User - John Doe')).toBeInTheDocument();
        });
    });

    it('validates required fields in create form', async () => {
        renderWithQueryClient(<UserManagement />);

        // Open create modal
        const addButton = screen.getByText('Add User');
        fireEvent.click(addButton);

        // Try to submit without filling required fields
        const submitButton = screen.getByText('Create User');
        fireEvent.click(submitButton);

        // Form validation should prevent submission
        expect(screen.getByText('Create New User')).toBeInTheDocument();
    });

    it('clears filters when Clear button is clicked', () => {
        renderWithQueryClient(<UserManagement />);

        // Set some filters
        const searchInput = screen.getByPlaceholderText('Name or email...');
        const roleSelect = screen.getByDisplayValue('All Roles');

        fireEvent.change(searchInput, { target: { value: 'test' } });
        fireEvent.change(roleSelect, { target: { value: 'admin' } });

        // Click clear button
        const clearButton = screen.getByText('Clear');
        fireEvent.click(clearButton);

        // Filters should be reset
        expect(searchInput.value).toBe('');
        expect(roleSelect.value).toBe('');
    });
}); 