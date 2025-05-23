import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '@/api/hooks';

const VendorManagement = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);

    // Queries
    const { data: vendors = [], isLoading, error: fetchError } = useVendors();

    // Mutations
    const createVendorMutation = useCreateVendor();
    const updateVendorMutation = useUpdateVendor();
    const deleteVendorMutation = useDeleteVendor();

    // Form handling
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue
    } = useForm({
        defaultValues: {
            businessName: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
            taxId: '',
            commissionRate: 10,
            password: '',
            status: 'pending'
        }
    });

    const onSubmit = async (data) => {
        try {
            if (selectedVendor) {
                await updateVendorMutation.mutateAsync({
                    vendorId: selectedVendor.id,
                    ...data
                });
            } else {
                await createVendorMutation.mutateAsync(data);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    const handleEdit = (vendor) => {
        setSelectedVendor(vendor);
        // Populate form with vendor data
        Object.keys(vendor).forEach(key => {
            if (key !== 'password') { // Don't prefill password
                setValue(key, vendor[key] || '');
            }
        });
        setValue('password', ''); // Always clear password
        setShowModal(true);
    };

    const handleDelete = async (vendorId) => {
        if (window.confirm('Are you sure you want to delete this vendor?')) {
            try {
                await deleteVendorMutation.mutateAsync(vendorId);
            } catch (error) {
                console.error('Delete error:', error);
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedVendor(null);
        reset();
    };

    const handleOpenModal = () => {
        setSelectedVendor(null);
        reset();
        setShowModal(true);
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge bg-warning',
            approved: 'badge bg-success',
            suspended: 'badge bg-danger',
            rejected: 'badge bg-secondary'
        };
        return badges[status] || 'badge bg-secondary';
    };

    const isSubmitting = createVendorMutation.isLoading || updateVendorMutation.isLoading;

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="loading-spinner"></div>
                <span className="ms-2">Loading vendors...</span>
            </div>
        );
    }

    return (
        <div className="vendor-management">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Vendor Management</h2>
                <button className="btn btn-primary" onClick={handleOpenModal}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Add New Vendor
                </button>
            </div>

            {/* Error Messages */}
            {fetchError && (
                <div className="alert-error-cms">
                    <strong>Error:</strong> {fetchError.message}
                </div>
            )}

            {createVendorMutation.error && (
                <div className="alert-error-cms">
                    <strong>Create Error:</strong> {createVendorMutation.error.response?.data?.error || createVendorMutation.error.message}
                </div>
            )}

            {updateVendorMutation.error && (
                <div className="alert-error-cms">
                    <strong>Update Error:</strong> {updateVendorMutation.error.response?.data?.error || updateVendorMutation.error.message}
                </div>
            )}

            {deleteVendorMutation.error && (
                <div className="alert-error-cms">
                    <strong>Delete Error:</strong> {deleteVendorMutation.error.response?.data?.error || deleteVendorMutation.error.message}
                </div>
            )}

            {/* Success Messages */}
            {createVendorMutation.isSuccess && (
                <div className="alert-success-cms">
                    <strong>Success:</strong> Vendor created successfully!
                </div>
            )}

            {updateVendorMutation.isSuccess && (
                <div className="alert-success-cms">
                    <strong>Success:</strong> Vendor updated successfully!
                </div>
            )}

            {deleteVendorMutation.isSuccess && (
                <div className="alert-success-cms">
                    <strong>Success:</strong> Vendor deleted successfully!
                </div>
            )}

            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Business Name</th>
                                    <th>Contact Person</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Commission Rate</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendors.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            No vendors found.
                                            <button className="btn btn-link p-0" onClick={handleOpenModal}>
                                                Add the first vendor
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    vendors.map((vendor) => (
                                        <tr key={vendor.id}>
                                            <td>{vendor.businessName}</td>
                                            <td>{vendor.contactPerson}</td>
                                            <td>{vendor.email}</td>
                                            <td>{vendor.phone}</td>
                                            <td>
                                                <span className={getStatusBadge(vendor.status)}>
                                                    {vendor.status}
                                                </span>
                                            </td>
                                            <td>{vendor.commissionRate}%</td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleEdit(vendor)}
                                                        disabled={isSubmitting}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(vendor.id)}
                                                        disabled={deleteVendorMutation.isLoading}
                                                    >
                                                        {deleteVendorMutation.isLoading ? (
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
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
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
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Business Name *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.businessName ? 'is-invalid' : ''}`}
                                                {...register('businessName', {
                                                    required: 'Business name is required'
                                                })}
                                            />
                                            {errors.businessName && (
                                                <div className="invalid-feedback">
                                                    {errors.businessName.message}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Contact Person *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.contactPerson ? 'is-invalid' : ''}`}
                                                {...register('contactPerson', {
                                                    required: 'Contact person is required'
                                                })}
                                            />
                                            {errors.contactPerson && (
                                                <div className="invalid-feedback">
                                                    {errors.contactPerson.message}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Email *</label>
                                            <input
                                                type="email"
                                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                                {...register('email', {
                                                    required: 'Email is required',
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: 'Invalid email address'
                                                    }
                                                })}
                                            />
                                            {errors.email && (
                                                <div className="invalid-feedback">
                                                    {errors.email.message}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Phone *</label>
                                            <input
                                                type="tel"
                                                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                                {...register('phone', {
                                                    required: 'Phone is required'
                                                })}
                                            />
                                            {errors.phone && (
                                                <div className="invalid-feedback">
                                                    {errors.phone.message}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-12 mb-3">
                                            <label className="form-label">Address *</label>
                                            <textarea
                                                className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                                rows="2"
                                                {...register('address', {
                                                    required: 'Address is required'
                                                })}
                                            ></textarea>
                                            {errors.address && (
                                                <div className="invalid-feedback">
                                                    {errors.address.message}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Tax ID</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                {...register('taxId')}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Commission Rate (%)</label>
                                            <input
                                                type="number"
                                                className={`form-control ${errors.commissionRate ? 'is-invalid' : ''}`}
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                {...register('commissionRate', {
                                                    valueAsNumber: true,
                                                    min: { value: 0, message: 'Commission rate must be at least 0' },
                                                    max: { value: 100, message: 'Commission rate cannot exceed 100' }
                                                })}
                                            />
                                            {errors.commissionRate && (
                                                <div className="invalid-feedback">
                                                    {errors.commissionRate.message}
                                                </div>
                                            )}
                                        </div>
                                        {!selectedVendor && (
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Password *</label>
                                                <input
                                                    type="password"
                                                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                                    placeholder="Password for vendor login"
                                                    {...register('password', {
                                                        required: !selectedVendor ? 'Password is required' : false,
                                                        minLength: {
                                                            value: 6,
                                                            message: 'Password must be at least 6 characters'
                                                        }
                                                    })}
                                                />
                                                {errors.password && (
                                                    <div className="invalid-feedback">
                                                        {errors.password.message}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Status</label>
                                            <select
                                                className="form-select"
                                                {...register('status')}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="approved">Approved</option>
                                                <option value="suspended">Suspended</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
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
                                        {selectedVendor ? 'Update Vendor' : 'Create Vendor'}
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

export default VendorManagement; 