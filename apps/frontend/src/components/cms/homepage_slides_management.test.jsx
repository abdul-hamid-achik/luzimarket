import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomepageSlidesManagement from './homepage_slides_management';

// Mock the API hooks
vi.mock('@/api/hooks', () => ({
    useAllHomepageSlides: vi.fn(),
    useCreateHomepageSlide: vi.fn(),
    useUpdateHomepageSlide: vi.fn(),
    useDeleteHomepageSlide: vi.fn()
}));

import {
    useAllHomepageSlides,
    useCreateHomepageSlide,
    useUpdateHomepageSlide,
    useDeleteHomepageSlide
} from '@/api/hooks';

const mockSlides = [
    {
        id: '1',
        title: 'Test Slide 1',
        subtitle: 'Test Subtitle 1',
        description: 'Test Description 1',
        imageUrl: 'https://example.com/image1.jpg',
        buttonText: 'Shop Now',
        buttonLink: '/products',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        position: 'center',
        isActive: true,
        sortOrder: 1
    },
    {
        id: '2',
        title: 'Test Slide 2',
        subtitle: 'Test Subtitle 2',
        description: 'Test Description 2',
        imageUrl: 'https://example.com/image2.jpg',
        buttonText: 'Learn More',
        buttonLink: '/about',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        position: 'left',
        isActive: false,
        sortOrder: 2
    }
];

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

const renderWithQueryClient = (component) => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            {component}
        </QueryClientProvider>
    );
};

describe('HomepageSlidesManagement', () => {
    const mockCreateMutation = {
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false
    };

    const mockUpdateMutation = {
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false
    };

    const mockDeleteMutation = {
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false
    };

    beforeEach(() => {
        vi.clearAllMocks();

        useAllHomepageSlides.mockReturnValue({
            data: mockSlides,
            isLoading: false,
            error: null,
            refetch: vi.fn()
        });

        useCreateHomepageSlide.mockReturnValue(mockCreateMutation);
        useUpdateHomepageSlide.mockReturnValue(mockUpdateMutation);
        useDeleteHomepageSlide.mockReturnValue(mockDeleteMutation);

        // Mock window.confirm
        global.confirm = vi.fn();
    });

    it('renders loading state correctly', () => {
        useAllHomepageSlides.mockReturnValue({
            data: [],
            isLoading: true,
            error: null,
            refetch: vi.fn()
        });

        renderWithQueryClient(<HomepageSlidesManagement />);

        expect(screen.getByText('Loading slides...')).toBeInTheDocument();
    });

    it('renders slides table correctly', () => {
        renderWithQueryClient(<HomepageSlidesManagement />);

        expect(screen.getByText('Homepage Slides Management')).toBeInTheDocument();
        expect(screen.getByText('Test Slide 1')).toBeInTheDocument();
        expect(screen.getByText('Test Slide 2')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('renders empty state when no slides exist', () => {
        useAllHomepageSlides.mockReturnValue({
            data: [],
            isLoading: false,
            error: null,
            refetch: vi.fn()
        });

        renderWithQueryClient(<HomepageSlidesManagement />);

        expect(screen.getByText('No slides found')).toBeInTheDocument();
        expect(screen.getByText('Add the first slide')).toBeInTheDocument();
    });

    it('opens add modal when clicking Add New Slide', () => {
        renderWithQueryClient(<HomepageSlidesManagement />);

        fireEvent.click(screen.getByText('Add New Slide'));

        expect(screen.getByText('Add New Slide')).toBeInTheDocument();
        expect(screen.getByLabelText('Title *')).toBeInTheDocument();
        expect(screen.getByLabelText('Image URL *')).toBeInTheDocument();
    });

    it('opens edit modal when clicking edit button', () => {
        renderWithQueryClient(<HomepageSlidesManagement />);

        const editButtons = screen.getAllByTitle('Edit');
        fireEvent.click(editButtons[0]);

        expect(screen.getByText('Edit Slide')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Slide 1')).toBeInTheDocument();
    });

    it('validates required fields when submitting form', async () => {
        renderWithQueryClient(<HomepageSlidesManagement />);

        fireEvent.click(screen.getByText('Add New Slide'));

        // Try to submit without filling required fields
        fireEvent.click(screen.getByText('Create Slide'));

        await waitFor(() => {
            expect(screen.getByText('Title is required')).toBeInTheDocument();
            expect(screen.getByText('Image URL is required')).toBeInTheDocument();
        });
    });

    it('creates new slide successfully', async () => {
        mockCreateMutation.mutateAsync.mockResolvedValueOnce({});

        renderWithQueryClient(<HomepageSlidesManagement />);

        fireEvent.click(screen.getByText('Add New Slide'));

        // Fill in required fields
        fireEvent.change(screen.getByLabelText('Title *'), {
            target: { value: 'New Test Slide' }
        });
        fireEvent.change(screen.getByLabelText('Image URL *'), {
            target: { value: 'https://example.com/newimage.jpg' }
        });

        fireEvent.click(screen.getByText('Create Slide'));

        await waitFor(() => {
            expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith({
                title: 'New Test Slide',
                subtitle: '',
                description: '',
                imageUrl: 'https://example.com/newimage.jpg',
                buttonText: '',
                buttonLink: '',
                backgroundColor: '#ffffff',
                textColor: '#000000',
                position: 'center',
                isActive: true,
                sortOrder: 0
            });
        });
    });

    it('updates existing slide successfully', async () => {
        mockUpdateMutation.mutateAsync.mockResolvedValueOnce({});

        renderWithQueryClient(<HomepageSlidesManagement />);

        const editButtons = screen.getAllByTitle('Edit');
        fireEvent.click(editButtons[0]);

        // Modify the title
        const titleInput = screen.getByDisplayValue('Test Slide 1');
        fireEvent.change(titleInput, {
            target: { value: 'Updated Test Slide' }
        });

        fireEvent.click(screen.getByText('Update Slide'));

        await waitFor(() => {
            expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledWith({
                slideId: '1',
                slideData: expect.objectContaining({
                    title: 'Updated Test Slide'
                })
            });
        });
    });

    it('deletes slide with confirmation', async () => {
        global.confirm.mockReturnValue(true);
        mockDeleteMutation.mutateAsync.mockResolvedValueOnce({});

        renderWithQueryClient(<HomepageSlidesManagement />);

        const deleteButtons = screen.getAllByTitle('Delete');
        fireEvent.click(deleteButtons[0]);

        expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this slide?');

        await waitFor(() => {
            expect(mockDeleteMutation.mutateAsync).toHaveBeenCalledWith('1');
        });
    });

    it('does not delete slide if user cancels confirmation', () => {
        global.confirm.mockReturnValue(false);

        renderWithQueryClient(<HomepageSlidesManagement />);

        const deleteButtons = screen.getAllByTitle('Delete');
        fireEvent.click(deleteButtons[0]);

        expect(global.confirm).toHaveBeenCalled();
        expect(mockDeleteMutation.mutateAsync).not.toHaveBeenCalled();
    });

    it('closes modal when clicking cancel', () => {
        renderWithQueryClient(<HomepageSlidesManagement />);

        fireEvent.click(screen.getByText('Add New Slide'));
        expect(screen.getByText('Add New Slide')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('Add New Slide')).not.toBeInTheDocument();
    });

    it('shows preview when image URL is provided', async () => {
        renderWithQueryClient(<HomepageSlidesManagement />);

        fireEvent.click(screen.getByText('Add New Slide'));

        // Add image URL
        fireEvent.change(screen.getByLabelText('Image URL *'), {
            target: { value: 'https://example.com/preview.jpg' }
        });

        fireEvent.change(screen.getByLabelText('Title *'), {
            target: { value: 'Preview Test' }
        });

        await waitFor(() => {
            expect(screen.getByText('Preview')).toBeInTheDocument();
        });
    });

    it('handles form validation for color inputs', () => {
        renderWithQueryClient(<HomepageSlidesManagement />);

        fireEvent.click(screen.getByText('Add New Slide'));

        const backgroundColorInput = screen.getByLabelText('Background Color');
        const textColorInput = screen.getByLabelText('Text Color');

        expect(backgroundColorInput).toHaveValue('#ffffff');
        expect(textColorInput).toHaveValue('#000000');

        // Change colors
        fireEvent.change(backgroundColorInput, { target: { value: '#ff0000' } });
        fireEvent.change(textColorInput, { target: { value: '#ffffff' } });

        expect(backgroundColorInput).toHaveValue('#ff0000');
        expect(textColorInput).toHaveValue('#ffffff');
    });

    it('handles text position selection', () => {
        renderWithQueryClient(<HomepageSlidesManagement />);

        fireEvent.click(screen.getByText('Add New Slide'));

        const positionSelect = screen.getByLabelText('Text Position');
        expect(positionSelect).toHaveValue('center');

        fireEvent.change(positionSelect, { target: { value: 'left' } });
        expect(positionSelect).toHaveValue('left');
    });

    it('handles sort order input', () => {
        renderWithQueryClient(<HomepageSlidesManagement />);

        fireEvent.click(screen.getByText('Add New Slide'));

        const sortOrderInput = screen.getByLabelText('Sort Order');
        expect(sortOrderInput).toHaveValue(0);

        fireEvent.change(sortOrderInput, { target: { value: '5' } });
        expect(sortOrderInput).toHaveValue(5);
    });

    it('handles active/inactive toggle', () => {
        renderWithQueryClient(<HomepageSlidesManagement />);

        fireEvent.click(screen.getByText('Add New Slide'));

        const activeCheckbox = screen.getByLabelText('Active');
        expect(activeCheckbox).toBeChecked();

        fireEvent.click(activeCheckbox);
        expect(activeCheckbox).not.toBeChecked();
    });

    it('displays error messages correctly', () => {
        useCreateHomepageSlide.mockReturnValue({
            ...mockCreateMutation,
            error: {
                response: {
                    data: { error: 'Failed to create slide' }
                }
            }
        });

        renderWithQueryClient(<HomepageSlidesManagement />);

        expect(screen.getByText('Failed to create slide')).toBeInTheDocument();
    });

    it('displays success messages correctly', () => {
        useCreateHomepageSlide.mockReturnValue({
            ...mockCreateMutation,
            isSuccess: true
        });

        renderWithQueryClient(<HomepageSlidesManagement />);

        expect(screen.getByText('Slide created successfully!')).toBeInTheDocument();
    });

    it('shows correct status badges', () => {
        renderWithQueryClient(<HomepageSlidesManagement />);

        const activeBadge = screen.getByText('Active');
        const inactiveBadge = screen.getByText('Inactive');

        expect(activeBadge).toHaveClass('badge', 'bg-success');
        expect(inactiveBadge).toHaveClass('badge', 'bg-secondary');
    });

    it('shows position badges correctly', () => {
        renderWithQueryClient(<HomepageSlidesManagement />);

        const centerBadge = screen.getByText('center');
        const leftBadge = screen.getByText('left');

        expect(centerBadge).toHaveClass('badge', 'bg-info');
        expect(leftBadge).toHaveClass('badge', 'bg-info');
    });
}); 