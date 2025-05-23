import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    useCMSProducts,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useUploadPhoto,
    usePhotos,
    useVendors,
    useCategories
} from '@/api/hooks';

const ProductManagement = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [filters, setFilters] = useState({});
    const [photoPreview, setPhotoPreview] = useState(null);

    // Queries
    const { data: products = { products: [], total: 0 }, isLoading } = useCMSProducts(filters);
    const { data: vendors = [] } = useVendors();
    const { data: categories = [] } = useCategories();
    const { data: photos = [] } = usePhotos();

    // Mutations
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const deleteProductMutation = useDeleteProduct();
    const uploadPhotoMutation = useUploadPhoto();

    // Form handling
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm({
        defaultValues: {
            name: '',
            description: '',
            price: 0,
            slug: '',
            categoryId: '',
            vendorId: '',
            status: 'draft',
            featured: false
        }
    });

    const watchName = watch('name');

    const onSubmit = async (data) => {
        try {
            let productData = { ...data };

            // Auto-generate slug if not provided
            if (!productData.slug && productData.name) {
                productData.slug = productData.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
            }

            let savedProduct;
            if (selectedProduct) {
                await updateProductMutation.mutateAsync({
                    productId: selectedProduct.id,
                    ...productData
                });
                savedProduct = { id: selectedProduct.id, ...productData };
            } else {
                savedProduct = await createProductMutation.mutateAsync(productData);
            }

            // Upload photo if selected
            if (photoPreview && photoPreview.file) {
                const formData = new FormData();
                formData.append('file', photoPreview.file);
                formData.append('productId', savedProduct.id);
                formData.append('alt', `${savedProduct.name} product image`);
                formData.append('sortOrder', '0');

                await uploadPhotoMutation.mutateAsync(formData);
            }

            handleCloseModal();
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        // Populate form with product data
        Object.keys(product).forEach(key => {
            setValue(key, product[key] || '');
        });
        setShowModal(true);
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProductMutation.mutateAsync(productId);
            } catch (error) {
                console.error('Delete error:', error);
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
        setPhotoPreview(null);
        reset();
    };

    const handleOpenModal = () => {
        setSelectedProduct(null);
        setPhotoPreview(null);
        reset();
        setShowModal(true);
    };

    const handlePhotoSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File size must be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview({
                    file,
                    preview: e.target.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: 'badge bg-secondary',
            active: 'badge bg-success',
            inactive: 'badge bg-warning',
            out_of_stock: 'badge bg-danger'
        };
        return badges[status] || 'badge bg-secondary';
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined
        }));
    };

    const isSubmitting = createProductMutation.isLoading || updateProductMutation.isLoading || uploadPhotoMutation.isLoading;

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="loading-spinner"></div>
                <span className="ms-2">Loading products...</span>
            </div>
        );
    }

    return (
        <div className="product-management">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Product Management</h2>
                <button className="btn btn-primary" onClick={handleOpenModal}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Add New Product
                </button>
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="out_of_stock">Out of Stock</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Category</label>
                            <select
                                className="form-select"
                                value={filters.categoryId || ''}
                                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Vendor</label>
                            <select
                                className="form-select"
                                value={filters.vendorId || ''}
                                onChange={(e) => handleFilterChange('vendorId', e.target.value)}
                            >
                                <option value="">All Vendors</option>
                                {vendors.map(vendor => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.businessName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Featured</label>
                            <select
                                className="form-select"
                                value={filters.featured || ''}
                                onChange={(e) => handleFilterChange('featured', e.target.value)}
                            >
                                <option value="">All Products</option>
                                <option value="true">Featured Only</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error/Success Messages */}
            {createProductMutation.error && (
                <div className="alert-error-cms">
                    <strong>Create Error:</strong> {createProductMutation.error.response?.data?.error || createProductMutation.error.message}
                </div>
            )}

            {updateProductMutation.error && (
                <div className="alert-error-cms">
                    <strong>Update Error:</strong> {updateProductMutation.error.response?.data?.error || updateProductMutation.error.message}
                </div>
            )}

            {deleteProductMutation.error && (
                <div className="alert-error-cms">
                    <strong>Delete Error:</strong> {deleteProductMutation.error.response?.data?.error || deleteProductMutation.error.message}
                </div>
            )}

            {createProductMutation.isSuccess && (
                <div className="alert-success-cms">
                    <strong>Success:</strong> Product created successfully!
                </div>
            )}

            {updateProductMutation.isSuccess && (
                <div className="alert-success-cms">
                    <strong>Success:</strong> Product updated successfully!
                </div>
            )}

            {deleteProductMutation.isSuccess && (
                <div className="alert-success-cms">
                    <strong>Success:</strong> Product deleted successfully!
                </div>
            )}

            {/* Products Table */}
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Price</th>
                                    <th>Category</th>
                                    <th>Vendor</th>
                                    <th>Status</th>
                                    <th>Featured</th>
                                    <th>Photos</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.products.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4">
                                            No products found.
                                            <button className="btn btn-link p-0" onClick={handleOpenModal}>
                                                Add the first product
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    products.products.map((product) => (
                                        <tr key={product.id}>
                                            <td>
                                                <div style={{ width: '50px', height: '50px', backgroundColor: '#f8f9fa', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    📦
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <strong>{product.name}</strong>
                                                    {product.featured && <span className="badge bg-warning ms-2">★</span>}
                                                </div>
                                            </td>
                                            <td>${(product.price / 100).toFixed(2)}</td>
                                            <td>{product.categoryName || 'N/A'}</td>
                                            <td>{product.vendorName || 'N/A'}</td>
                                            <td>
                                                <span className={getStatusBadge(product.status)}>
                                                    {product.status}
                                                </span>
                                            </td>
                                            <td>
                                                {product.featured ? (
                                                    <span className="badge bg-warning">Yes</span>
                                                ) : (
                                                    <span className="badge bg-secondary">No</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge bg-info">
                                                    {product.photoCount || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleEdit(product)}
                                                        disabled={isSubmitting}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(product.id)}
                                                        disabled={deleteProductMutation.isLoading}
                                                    >
                                                        {deleteProductMutation.isLoading ? (
                                                            <div className="loading-spinner"></div>
                                                        ) : (
                                                            'Delete'
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {selectedProduct ? 'Edit Product' : 'Add New Product'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-8">
                                            <div className="row">
                                                <div className="col-12 mb-3">
                                                    <label className="form-label">Product Name *</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                        {...register('name', {
                                                            required: 'Product name is required'
                                                        })}
                                                    />
                                                    {errors.name && (
                                                        <div className="invalid-feedback">
                                                            {errors.name.message}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-12 mb-3">
                                                    <label className="form-label">Description *</label>
                                                    <textarea
                                                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                                        rows="4"
                                                        {...register('description', {
                                                            required: 'Description is required'
                                                        })}
                                                    ></textarea>
                                                    {errors.description && (
                                                        <div className="invalid-feedback">
                                                            {errors.description.message}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Price (cents) *</label>
                                                    <input
                                                        type="number"
                                                        className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                                                        step="1"
                                                        min="0"
                                                        {...register('price', {
                                                            valueAsNumber: true,
                                                            required: 'Price is required',
                                                            min: { value: 0, message: 'Price must be at least 0' }
                                                        })}
                                                    />
                                                    {errors.price && (
                                                        <div className="invalid-feedback">
                                                            {errors.price.message}
                                                        </div>
                                                    )}
                                                    <div className="form-text">Enter price in cents (e.g., 1999 for $19.99)</div>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Slug</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        {...register('slug')}
                                                        placeholder={watchName ? watchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : ''}
                                                    />
                                                    <div className="form-text">Leave empty to auto-generate from name</div>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Category *</label>
                                                    <select
                                                        className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
                                                        {...register('categoryId', {
                                                            required: 'Category is required'
                                                        })}
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories.map(category => (
                                                            <option key={category.id} value={category.id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.categoryId && (
                                                        <div className="invalid-feedback">
                                                            {errors.categoryId.message}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Vendor</label>
                                                    <select
                                                        className="form-select"
                                                        {...register('vendorId')}
                                                    >
                                                        <option value="">No Vendor</option>
                                                        {vendors.map(vendor => (
                                                            <option key={vendor.id} value={vendor.id}>
                                                                {vendor.businessName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Status</label>
                                                    <select
                                                        className="form-select"
                                                        {...register('status')}
                                                    >
                                                        <option value="draft">Draft</option>
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                        <option value="out_of_stock">Out of Stock</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <div className="form-check mt-4">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            {...register('featured')}
                                                        />
                                                        <label className="form-check-label">
                                                            Featured Product
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card">
                                                <div className="card-header">
                                                    <h6 className="card-title mb-0">Product Image</h6>
                                                </div>
                                                <div className="card-body">
                                                    <div className="mb-3">
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            accept="image/*"
                                                            onChange={handlePhotoSelect}
                                                        />
                                                        <div className="form-text">Max size: 5MB</div>
                                                    </div>
                                                    {photoPreview && (
                                                        <div className="text-center">
                                                            <img
                                                                src={photoPreview.preview}
                                                                alt="Preview"
                                                                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCloseModal}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting && <div className="loading-spinner me-2"></div>}
                                        {selectedProduct ? 'Update Product' : 'Create Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default ProductManagement; 