import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    useCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    useUploadPhoto
} from '@/api/hooks';

const CategoryManagement = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [showBatchActions, setShowBatchActions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Queries
    const { data: categories = [], isLoading, refetch } = useCategories();

    // Mutations
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();
    const uploadPhotoMutation = useUploadPhoto();

    // Form handling
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue
    } = useForm();

    // Handle form submission
    const onSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            const categoryData = {
                ...formData,
                slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                status: formData.status || 'active'
            };

            if (selectedCategory) {
                // Update existing category
                await updateCategoryMutation.mutateAsync({
                    categoryId: selectedCategory.id,
                    ...categoryData
                });
            } else {
                // Create new category
                await createCategoryMutation.mutateAsync(categoryData);
            }

            setShowModal(false);
            setSelectedCategory(null);
            reset();
            refetch();
        } catch (error) {
            console.error('Error saving category:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle edit
    const handleEdit = (category) => {
        setSelectedCategory(category);
        setValue('name', category.name);
        setValue('description', category.description || '');
        setValue('slug', category.slug);
        setValue('status', category.status || 'active');
        setValue('parentId', category.parentId || '');
        setValue('sortOrder', category.sortOrder || 0);
        setValue('imageUrl', category.imageUrl || '');
        setValue('featured', category.featured || false);
        setShowModal(true);
    };

    // Handle delete
    const handleDelete = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteCategoryMutation.mutateAsync(categoryId);
                refetch();
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    };

    // Handle batch selection
    const handleSelectCategory = (categoryId) => {
        const newSelection = new Set(selectedCategories);
        if (newSelection.has(categoryId)) {
            newSelection.delete(categoryId);
        } else {
            newSelection.add(categoryId);
        }
        setSelectedCategories(newSelection);
        setShowBatchActions(newSelection.size > 0);
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedCategories.size === categories.length) {
            setSelectedCategories(new Set());
            setShowBatchActions(false);
        } else {
            setSelectedCategories(new Set(categories.map(cat => cat.id)));
            setShowBatchActions(true);
        }
    };

    // Handle batch delete
    const handleBatchDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedCategories.size} categories?`)) {
            try {
                await Promise.all(
                    Array.from(selectedCategories).map(id =>
                        deleteCategoryMutation.mutateAsync(id)
                    )
                );
                setSelectedCategories(new Set());
                setShowBatchActions(false);
                refetch();
            } catch (error) {
                console.error('Error batch deleting categories:', error);
            }
        }
    };

    // Handle batch status update
    const handleBatchStatusUpdate = async (status) => {
        try {
            await Promise.all(
                Array.from(selectedCategories).map(id => {
                    const category = categories.find(cat => cat.id === id);
                    return updateCategoryMutation.mutateAsync({
                        categoryId: id,
                        ...category,
                        status
                    });
                })
            );
            setSelectedCategories(new Set());
            setShowBatchActions(false);
            refetch();
        } catch (error) {
            console.error('Error batch updating categories:', error);
        }
    };

    // Create hierarchy display
    const createHierarchyDisplay = (cats, level = 0) => {
        return cats.map(category => ({
            ...category,
            displayName: '  '.repeat(level) + (level > 0 ? '└ ' : '') + category.name,
            level
        }));
    };

    const hierarchicalCategories = createHierarchyDisplay(categories);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="category-management">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Category Management</h2>
                    <p className="text-muted">Organize your product categories and subcategories</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setSelectedCategory(null);
                        reset();
                        setShowModal(true);
                    }}
                >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add Category
                </button>
            </div>

            {/* Batch Actions Bar */}
            {showBatchActions && (
                <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
                    <span>{selectedCategories.size} categories selected</span>
                    <div className="btn-group">
                        <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleBatchStatusUpdate('active')}
                        >
                            Mark Active
                        </button>
                        <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleBatchStatusUpdate('inactive')}
                        >
                            Mark Inactive
                        </button>
                        <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={handleBatchDelete}
                        >
                            Delete Selected
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                                setSelectedCategories(new Set());
                                setShowBatchActions(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Categories Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '50px' }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={categories.length > 0 && selectedCategories.size === categories.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th>Category</th>
                                    <th>Slug</th>
                                    <th>Status</th>
                                    <th>Products</th>
                                    <th>Sort Order</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hierarchicalCategories.length > 0 ? (
                                    hierarchicalCategories.map((category) => (
                                        <tr key={category.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedCategories.has(category.id)}
                                                    onChange={() => handleSelectCategory(category.id)}
                                                />
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {category.imageUrl && (
                                                        <img
                                                            src={category.imageUrl}
                                                            alt={category.name}
                                                            className="rounded me-2"
                                                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                        />
                                                    )}
                                                    <div>
                                                        <h6 className="mb-0" style={{ marginLeft: `${category.level * 20}px` }}>
                                                            {category.level > 0 && '└ '}
                                                            {category.name}
                                                            {category.featured && (
                                                                <span className="badge bg-warning ms-2">Featured</span>
                                                            )}
                                                        </h6>
                                                        {category.description && (
                                                            <small className="text-muted">{category.description}</small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <code>{category.slug}</code>
                                            </td>
                                            <td>
                                                <span className={`badge ${category.status === 'active' ? 'bg-success' :
                                                        category.status === 'inactive' ? 'bg-secondary' : 'bg-warning'
                                                    }`}>
                                                    {category.status || 'draft'}
                                                </span>
                                            </td>
                                            <td>{category.productCount || 0}</td>
                                            <td>{category.sortOrder || 0}</td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleEdit(category)}
                                                        disabled={isSubmitting}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(category.id)}
                                                        disabled={deleteCategoryMutation.isLoading}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            <div className="text-muted">
                                                <span style={{ fontSize: '3rem', opacity: 0.3 }}>🏷️</span>
                                                <h6 className="mt-2">No categories found</h6>
                                                <p>Start by creating your first product category</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal for Add/Edit */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {selectedCategory ? 'Edit Category' : 'Add New Category'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedCategory(null);
                                        reset();
                                    }}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-8 mb-3">
                                            <label className="form-label">Name *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                {...register('name', {
                                                    required: 'Category name is required',
                                                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                                                })}
                                            />
                                            {errors.name && (
                                                <div className="invalid-feedback">{errors.name.message}</div>
                                            )}
                                        </div>

                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Status</label>
                                            <select className="form-select" {...register('status')}>
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="draft">Draft</option>
                                            </select>
                                        </div>

                                        <div className="col-md-8 mb-3">
                                            <label className="form-label">Slug</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                {...register('slug')}
                                                placeholder="Leave empty to auto-generate"
                                            />
                                            <div className="form-text">URL-friendly version of the name</div>
                                        </div>

                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Sort Order</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                {...register('sortOrder', { valueAsNumber: true })}
                                                defaultValue={0}
                                            />
                                        </div>

                                        <div className="col-12 mb-3">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                rows="3"
                                                {...register('description')}
                                                placeholder="Optional description for this category"
                                            ></textarea>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Parent Category</label>
                                            <select className="form-select" {...register('parentId')}>
                                                <option value="">None (Top Level)</option>
                                                {categories
                                                    .filter(cat => !selectedCategory || cat.id !== selectedCategory.id)
                                                    .map(category => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Image URL</label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                {...register('imageUrl')}
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>

                                        <div className="col-12">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    {...register('featured')}
                                                />
                                                <label className="form-check-label">
                                                    Featured Category
                                                </label>
                                                <div className="form-text">
                                                    Featured categories appear prominently on the homepage
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowModal(false);
                                            setSelectedCategory(null);
                                            reset();
                                        }}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            selectedCategory ? 'Update Category' : 'Create Category'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManagement; 