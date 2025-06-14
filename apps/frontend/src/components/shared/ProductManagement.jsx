import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    useCMSProducts,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useUploadPhoto,
    useVendors,
    useCategories,
    useDeliveryZones,
    useProductDeliveryZones,
    useUpdateProductDeliveryZones
} from '@/api/hooks';

const ProductManagement = ({ 
    isEmployeeDashboard = false,
    showVendorField = true,
    showDeliveryZones = true,
    translations = {}
}) => {
    // Merge default translations with provided ones
    const t = {
        title: 'Product Management',
        addProduct: 'Add New Product',
        editProduct: 'Edit Product',
        productName: 'Product Name',
        description: 'Description',
        price: 'Price',
        category: 'Category',
        vendor: 'Vendor',
        status: 'Status',
        featured: 'Featured',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        zones: 'Zones',
        deliveryZones: 'Delivery Zones',
        noProducts: 'No products found',
        searchPlaceholder: 'Search products...',
        allStatuses: 'All Statuses',
        allCategories: 'All Categories',
        allVendors: 'All Vendors',
        allProducts: 'All Products',
        featuredOnly: 'Featured Only',
        statusDraft: 'Draft',
        statusActive: 'Active',
        statusInactive: 'Inactive',
        statusOutOfStock: 'Out of Stock',
        yes: 'Yes',
        no: 'No',
        photos: 'Photos',
        uploadImage: 'Upload Image',
        maxSize: 'Max size: 5MB',
        saving: 'Saving...',
        loading: 'Loading products...',
        confirmDelete: 'Are you sure you want to delete this product?',
        errors: {
            nameRequired: 'Product name is required',
            descriptionRequired: 'Description is required',
            priceRequired: 'Price is required',
            categoryRequired: 'Category is required',
            uploadFailed: 'Failed to upload image',
            createFailed: 'Failed to create product',
            updateFailed: 'Failed to update product',
            deleteFailed: 'Failed to delete product'
        },
        success: {
            created: 'Product created successfully!',
            updated: 'Product updated successfully!',
            deleted: 'Product deleted successfully!'
        },
        ...translations
    };

    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [filters, setFilters] = useState({ limit: 100 });
    const [photoPreview, setPhotoPreview] = useState(null);
    const [showDeliveryZonesModal, setShowDeliveryZonesModal] = useState(false);
    const [selectedDeliveryZones, setSelectedDeliveryZones] = useState(new Set());

    // Queries
    const { data: products = { products: [], total: 0 }, isLoading } = useCMSProducts(filters);
    const { data: vendors = [] } = useVendors();
    const { data: categories = [] } = useCategories();
    const { data: deliveryZonesList = [] } = useDeliveryZones({ active: true });
    const { data: productDeliveryZones = [] } = useProductDeliveryZones(selectedProduct?.id);

    // Mutations
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const deleteProductMutation = useDeleteProduct();
    const uploadPhotoMutation = useUploadPhoto();
    const updateProductDeliveryZonesMutation = useUpdateProductDeliveryZones();

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

    // Load delivery zones for selected product
    useEffect(() => {
        if (selectedProduct && productDeliveryZones.length > 0 && showDeliveryZones) {
            const currentZones = new Set(
                productDeliveryZones
                    .filter(zone => zone.isAvailable)
                    .map(zone => zone.id)
            );
            setSelectedDeliveryZones(currentZones);
        }
    }, [selectedProduct, productDeliveryZones, showDeliveryZones]);

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

            // Convert price to cents if in employee dashboard (assuming they enter in dollars/pesos)
            if (isEmployeeDashboard && typeof productData.price === 'string') {
                productData.price = Math.round(parseFloat(productData.price) * 100);
            } else if (isEmployeeDashboard && typeof productData.price === 'number') {
                productData.price = Math.round(productData.price * 100);
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
            alert(selectedProduct ? t.errors.updateFailed : t.errors.createFailed);
        }
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        // Populate form with product data
        Object.keys(product).forEach(key => {
            if (key === 'price' && isEmployeeDashboard) {
                // Convert cents to dollars/pesos for employee dashboard
                setValue(key, (product[key] / 100).toFixed(2));
            } else {
                setValue(key, product[key] || '');
            }
        });
        setShowModal(true);
    };

    const handleDelete = async (productId) => {
        if (window.confirm(t.confirmDelete)) {
            try {
                await deleteProductMutation.mutateAsync(productId);
            } catch (error) {
                console.error('Delete error:', error);
                alert(t.errors.deleteFailed);
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
        setPhotoPreview(null);
        setShowDeliveryZonesModal(false);
        setSelectedDeliveryZones(new Set());
        reset();
    };

    const handleOpenModal = () => {
        setSelectedProduct(null);
        setPhotoPreview(null);
        setShowDeliveryZonesModal(false);
        setSelectedDeliveryZones(new Set());
        reset();
        setShowModal(true);
    };

    const handleDeliveryZoneToggle = (zoneId) => {
        const newSelection = new Set(selectedDeliveryZones);
        if (newSelection.has(zoneId)) {
            newSelection.delete(zoneId);
        } else {
            newSelection.add(zoneId);
        }
        setSelectedDeliveryZones(newSelection);
    };

    const handleSaveDeliveryZones = async () => {
        if (!selectedProduct) return;

        const deliveryZoneUpdates = deliveryZonesList.map(zone => ({
            delivery_zone_id: zone.id,
            is_available: selectedDeliveryZones.has(zone.id)
        }));

        try {
            await updateProductDeliveryZonesMutation.mutateAsync({
                productId: selectedProduct.id,
                delivery_zones: deliveryZoneUpdates
            });
            setShowDeliveryZonesModal(false);
        } catch (error) {
            console.error('Error saving delivery zones:', error);
        }
    };

    const handlePhotoSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert(t.errors.uploadFailed + ' - ' + t.maxSize);
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
            draft: `badge ${isEmployeeDashboard ? 'bg-secondary' : 'bg-secondary'}`,
            active: `badge ${isEmployeeDashboard ? 'bg-success' : 'bg-success'}`,
            inactive: `badge ${isEmployeeDashboard ? 'bg-warning' : 'bg-warning'}`,
            out_of_stock: `badge ${isEmployeeDashboard ? 'bg-danger' : 'bg-danger'}`
        };
        
        const labels = {
            draft: t.statusDraft,
            active: t.statusActive,
            inactive: t.statusInactive,
            out_of_stock: t.statusOutOfStock
        };
        
        return (
            <span className={badges[status] || badges.draft}>
                {labels[status] || status}
            </span>
        );
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined
        }));
    };

    const formatPrice = (price) => {
        if (isEmployeeDashboard) {
            return `$${(price / 100).toFixed(2)}`;
        }
        return `$${(price / 100).toFixed(2)}`;
    };

    const isSubmitting = createProductMutation.isLoading || updateProductMutation.isLoading || uploadPhotoMutation.isLoading;

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t.loading}</span>
                </div>
                <span className="ms-2">{t.loading}</span>
            </div>
        );
    }

    return (
        <div className="product-management">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{t.title}</h2>
                <button className="btn btn-primary" onClick={handleOpenModal}>
                    <i className="bi bi-plus-circle me-2"></i>
                    {t.addProduct}
                </button>
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label">{t.status}</label>
                            <select
                                className="form-select"
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">{t.allStatuses}</option>
                                <option value="draft">{t.statusDraft}</option>
                                <option value="active">{t.statusActive}</option>
                                <option value="inactive">{t.statusInactive}</option>
                                <option value="out_of_stock">{t.statusOutOfStock}</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">{t.category}</label>
                            <select
                                className="form-select"
                                value={filters.categoryId || ''}
                                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                            >
                                <option value="">{t.allCategories}</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {showVendorField && (
                            <div className="col-md-3">
                                <label className="form-label">{t.vendor}</label>
                                <select
                                    className="form-select"
                                    value={filters.vendorId || ''}
                                    onChange={(e) => handleFilterChange('vendorId', e.target.value)}
                                >
                                    <option value="">{t.allVendors}</option>
                                    {vendors.map(vendor => (
                                        <option key={vendor.id} value={vendor.id}>
                                            {vendor.businessName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="col-md-3">
                            <label className="form-label">{t.featured}</label>
                            <select
                                className="form-select"
                                value={filters.featured || ''}
                                onChange={(e) => handleFilterChange('featured', e.target.value)}
                            >
                                <option value="">{t.allProducts}</option>
                                <option value="true">{t.featuredOnly}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {createProductMutation.isSuccess && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {t.success.created}
                    <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                </div>
            )}

            {updateProductMutation.isSuccess && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {t.success.updated}
                    <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                </div>
            )}

            {deleteProductMutation.isSuccess && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {t.success.deleted}
                    <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
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
                                    <th>{t.productName}</th>
                                    <th>{t.price}</th>
                                    <th>{t.category}</th>
                                    {showVendorField && <th>{t.vendor}</th>}
                                    <th>{t.status}</th>
                                    <th>{t.featured}</th>
                                    <th>{t.photos}</th>
                                    <th>{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.products.length === 0 ? (
                                    <tr>
                                        <td colSpan={showVendorField ? "9" : "8"} className="text-center py-4">
                                            {t.noProducts}
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
                                            <td>{formatPrice(product.price)}</td>
                                            <td>{product.categoryName || 'N/A'}</td>
                                            {showVendorField && <td>{product.vendorName || 'N/A'}</td>}
                                            <td>{getStatusBadge(product.status)}</td>
                                            <td>
                                                {product.featured ? (
                                                    <span className="badge bg-warning">{t.yes}</span>
                                                ) : (
                                                    <span className="badge bg-secondary">{t.no}</span>
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
                                                        {t.edit}
                                                    </button>
                                                    {showDeliveryZones && (
                                                        <button
                                                            className="btn btn-sm btn-outline-info"
                                                            onClick={() => {
                                                                setSelectedProduct(product);
                                                                setShowDeliveryZonesModal(true);
                                                            }}
                                                            disabled={isSubmitting}
                                                        >
                                                            {t.zones}
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(product.id)}
                                                        disabled={deleteProductMutation.isLoading}
                                                    >
                                                        {deleteProductMutation.isLoading ? (
                                                            <span className="spinner-border spinner-border-sm"></span>
                                                        ) : (
                                                            t.delete
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

            {/* Product Form Modal */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {selectedProduct ? t.editProduct : t.addProduct}
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
                                                    <label className="form-label">{t.productName} *</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                        {...register('name', {
                                                            required: t.errors.nameRequired
                                                        })}
                                                    />
                                                    {errors.name && (
                                                        <div className="invalid-feedback">
                                                            {errors.name.message}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-12 mb-3">
                                                    <label className="form-label">{t.description} *</label>
                                                    <textarea
                                                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                                        rows="4"
                                                        {...register('description', {
                                                            required: t.errors.descriptionRequired
                                                        })}
                                                    ></textarea>
                                                    {errors.description && (
                                                        <div className="invalid-feedback">
                                                            {errors.description.message}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">{t.price} *</label>
                                                    <input
                                                        type="number"
                                                        className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                                                        step={isEmployeeDashboard ? "0.01" : "1"}
                                                        min="0"
                                                        {...register('price', {
                                                            valueAsNumber: !isEmployeeDashboard,
                                                            required: t.errors.priceRequired,
                                                            min: { value: 0, message: 'Price must be at least 0' }
                                                        })}
                                                    />
                                                    {errors.price && (
                                                        <div className="invalid-feedback">
                                                            {errors.price.message}
                                                        </div>
                                                    )}
                                                    <div className="form-text">
                                                        {isEmployeeDashboard ? 'Enter price in pesos (e.g., 19.99)' : 'Enter price in cents (e.g., 1999 for $19.99)'}
                                                    </div>
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
                                                    <label className="form-label">{t.category} *</label>
                                                    <select
                                                        className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
                                                        {...register('categoryId', {
                                                            required: t.errors.categoryRequired
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
                                                {showVendorField && (
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">{t.vendor}</label>
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
                                                )}
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">{t.status}</label>
                                                    <select
                                                        className="form-select"
                                                        {...register('status')}
                                                    >
                                                        <option value="draft">{t.statusDraft}</option>
                                                        <option value="active">{t.statusActive}</option>
                                                        <option value="inactive">{t.statusInactive}</option>
                                                        <option value="out_of_stock">{t.statusOutOfStock}</option>
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
                                                            {t.featured} Product
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
                                                        <div className="form-text">{t.maxSize}</div>
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
                                        {t.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting && <span className="spinner-border spinner-border-sm me-2"></span>}
                                        {selectedProduct ? t.save : t.save}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}

            {/* Delivery Zones Modal */}
            {showDeliveryZonesModal && showDeliveryZones && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {t.deliveryZones} - {selectedProduct?.name}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowDeliveryZonesModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-3">
                                    Select which delivery zones this product is available in:
                                </p>
                                <div className="delivery-zones-list">
                                    {deliveryZonesList.map(zone => (
                                        <div key={zone.id} className="form-check mb-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`zone-${zone.id}`}
                                                checked={selectedDeliveryZones.has(zone.id)}
                                                onChange={() => handleDeliveryZoneToggle(zone.id)}
                                            />
                                            <label className="form-check-label" htmlFor={`zone-${zone.id}`}>
                                                <strong>{zone.name}</strong>
                                                <span className="text-muted ms-2">
                                                    (Delivery fee: ${(zone.fee / 100).toFixed(2)})
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {deliveryZonesList.length === 0 && (
                                    <div className="text-center text-muted py-4">
                                        No delivery zones available. Please create delivery zones first.
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowDeliveryZonesModal(false)}
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleSaveDeliveryZones}
                                    disabled={updateProductDeliveryZonesMutation.isLoading}
                                >
                                    {updateProductDeliveryZonesMutation.isLoading && (
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                    )}
                                    {t.save}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showDeliveryZonesModal && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default ProductManagement;