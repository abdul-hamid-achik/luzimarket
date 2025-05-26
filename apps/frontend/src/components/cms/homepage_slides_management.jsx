import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    useAllHomepageSlides,
    useCreateHomepageSlide,
    useUpdateHomepageSlide,
    useDeleteHomepageSlide
} from '@/api/hooks';

const HomepageSlidesManagement = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedSlide, setSelectedSlide] = useState(null);

    // React Hook Form
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            subtitle: '',
            description: '',
            imageUrl: '',
            buttonText: '',
            buttonLink: '',
            backgroundColor: '#ffffff',
            textColor: '#000000',
            position: 'center',
            isActive: true,
            sortOrder: 0
        }
    });

    // API Hooks
    const { data: slides = [], isLoading, error: fetchError } = useAllHomepageSlides();
    const createSlideMutation = useCreateHomepageSlide({
        onSuccess: () => {
            handleCloseModal();
        }
    });
    const updateSlideMutation = useUpdateHomepageSlide({
        onSuccess: () => {
            handleCloseModal();
        }
    });
    const deleteSlideMutation = useDeleteHomepageSlide();

    // Form submission
    const onSubmit = async (data) => {
        if (selectedSlide) {
            updateSlideMutation.mutate({
                slideId: selectedSlide.id,
                slideData: data
            });
        } else {
            createSlideMutation.mutate(data);
        }
    };

    // Event handlers
    const handleEdit = (slide) => {
        setSelectedSlide(slide);
        Object.keys(slide).forEach(key => {
            setValue(key, slide[key]);
        });
        setShowModal(true);
    };

    const handleDelete = (slideId) => {
        if (window.confirm('Are you sure you want to delete this slide?')) {
            deleteSlideMutation.mutate(slideId);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedSlide(null);
        reset();
        // Reset mutation states to clear success/error messages
        createSlideMutation.reset();
        updateSlideMutation.reset();
    };

    const handleOpenModal = () => {
        setSelectedSlide(null);
        reset();
        setShowModal(true);
    };

    const getStatusBadge = (isActive) => {
        return isActive ? 'badge bg-success' : 'badge bg-secondary';
    };

    const isSubmitting = createSlideMutation.isLoading || updateSlideMutation.isLoading;

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="loading-spinner"></div>
                <span className="ms-2">Loading slides...</span>
            </div>
        );
    }

    return (
        <div className="homepage-slides-management">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Homepage Slides Management</h2>
                    <p className="text-muted">Manage the dynamic hero carousel slides on your homepage</p>
                </div>
                <button className="btn btn-primary" onClick={handleOpenModal}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Add New Slide
                </button>
            </div>

            {/* Error Messages */}
            {fetchError && (
                <div className="alert-error-cms">
                    <strong>Error:</strong> {fetchError.message}
                </div>
            )}

            {createSlideMutation.error && (
                <div className="alert-error-cms">
                    <strong>Create Error:</strong> {createSlideMutation.error.response?.data?.error || createSlideMutation.error.message}
                </div>
            )}

            {updateSlideMutation.error && (
                <div className="alert-error-cms">
                    <strong>Update Error:</strong> {updateSlideMutation.error.response?.data?.error || updateSlideMutation.error.message}
                </div>
            )}

            {deleteSlideMutation.error && (
                <div className="alert-error-cms">
                    <strong>Delete Error:</strong> {deleteSlideMutation.error.response?.data?.error || deleteSlideMutation.error.message}
                </div>
            )}

            {/* Success Messages */}
            {createSlideMutation.isSuccess && (
                <div className="alert-success-cms">
                    <strong>Success:</strong> Slide created successfully!
                </div>
            )}

            {updateSlideMutation.isSuccess && (
                <div className="alert-success-cms">
                    <strong>Success:</strong> Slide updated successfully!
                </div>
            )}

            {deleteSlideMutation.isSuccess && (
                <div className="alert-success-cms">
                    <strong>Success:</strong> Slide deleted successfully!
                </div>
            )}

            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Preview</th>
                                    <th>Title</th>
                                    <th>Position</th>
                                    <th>Sort Order</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slides.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">
                                            <div className="text-muted">
                                                <i className="bi bi-image fs-1 d-block mb-2"></i>
                                                <p>No slides found</p>
                                                <button className="btn btn-outline-primary" onClick={handleOpenModal}>
                                                    Add the first slide
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    slides.map((slide) => (
                                        <tr key={slide.id}>
                                            <td>
                                                <div className="slide-preview" style={{ width: '120px', height: '60px', position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <img
                                                        src={slide.imageUrl}
                                                        alt={slide.title}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            backgroundColor: slide.backgroundColor
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: slide.position === 'left' ? 'flex-start' : slide.position === 'right' ? 'flex-end' : 'center',
                                                            padding: '4px',
                                                            fontSize: '8px',
                                                            color: slide.textColor,
                                                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                                        }}
                                                    >
                                                        {slide.title}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <strong>{slide.title}</strong>
                                                    {slide.subtitle && (
                                                        <div className="text-muted small">{slide.subtitle}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-info">
                                                    {slide.position}
                                                </span>
                                            </td>
                                            <td>{slide.sortOrder}</td>
                                            <td>
                                                <span className={getStatusBadge(slide.isActive)}>
                                                    {slide.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() => handleEdit(slide)}
                                                        title="Edit"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => handleDelete(slide.id)}
                                                        title="Delete"
                                                    >
                                                        <i className="bi bi-trash"></i>
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

            {/* Modal for Add/Edit */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {selectedSlide ? 'Edit Slide' : 'Add New Slide'}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-8">
                                            <div className="row">
                                                <div className="col-md-12 mb-3">
                                                    <label className="form-label">Title *</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                                        {...register('title', { required: 'Title is required' })}
                                                    />
                                                    {errors.title && (
                                                        <div className="invalid-feedback">
                                                            {errors.title.message}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-md-12 mb-3">
                                                    <label className="form-label">Subtitle</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        {...register('subtitle')}
                                                    />
                                                </div>
                                                <div className="col-md-12 mb-3">
                                                    <label className="form-label">Description</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows="3"
                                                        {...register('description')}
                                                    />
                                                </div>
                                                <div className="col-md-12 mb-3">
                                                    <label className="form-label">Image URL *</label>
                                                    <input
                                                        type="url"
                                                        className={`form-control ${errors.imageUrl ? 'is-invalid' : ''}`}
                                                        {...register('imageUrl', { required: 'Image URL is required' })}
                                                    />
                                                    {errors.imageUrl && (
                                                        <div className="invalid-feedback">
                                                            {errors.imageUrl.message}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Button Text</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        {...register('buttonText')}
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Button Link</label>
                                                    <input
                                                        type="url"
                                                        className="form-control"
                                                        {...register('buttonLink')}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card">
                                                <div className="card-header">
                                                    <h6 className="card-title mb-0">Slide Settings</h6>
                                                </div>
                                                <div className="card-body">
                                                    <div className="mb-3">
                                                        <label className="form-label">Text Position</label>
                                                        <select
                                                            className="form-select"
                                                            {...register('position')}
                                                        >
                                                            <option value="center">Center</option>
                                                            <option value="left">Left</option>
                                                            <option value="right">Right</option>
                                                        </select>
                                                    </div>
                                                    <div className="mb-3">
                                                        <label className="form-label">Background Color</label>
                                                        <input
                                                            type="color"
                                                            className="form-control form-control-color"
                                                            {...register('backgroundColor')}
                                                        />
                                                    </div>
                                                    <div className="mb-3">
                                                        <label className="form-label">Text Color</label>
                                                        <input
                                                            type="color"
                                                            className="form-control form-control-color"
                                                            {...register('textColor')}
                                                        />
                                                    </div>
                                                    <div className="mb-3">
                                                        <label className="form-label">Sort Order</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            min="0"
                                                            {...register('sortOrder', { valueAsNumber: true })}
                                                        />
                                                        <div className="form-text">Higher numbers appear first</div>
                                                    </div>
                                                    <div className="mb-3">
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                {...register('isActive')}
                                                            />
                                                            <label className="form-check-label">
                                                                Active
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Preview */}
                                            {watch('imageUrl') && (
                                                <div className="card mt-3">
                                                    <div className="card-header">
                                                        <h6 className="card-title mb-0">Preview</h6>
                                                    </div>
                                                    <div className="card-body p-0">
                                                        <div
                                                            style={{
                                                                position: 'relative',
                                                                height: '150px',
                                                                backgroundImage: `url(${watch('imageUrl')})`,
                                                                backgroundSize: 'cover',
                                                                backgroundPosition: 'center',
                                                                backgroundColor: watch('backgroundColor')
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                    right: 0,
                                                                    bottom: 0,
                                                                    background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.6) 100%)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: watch('position') === 'left' ? 'flex-start' : watch('position') === 'right' ? 'flex-end' : 'center',
                                                                    padding: '20px',
                                                                    color: watch('textColor')
                                                                }}
                                                            >
                                                                <div style={{ textAlign: watch('position') === 'center' ? 'center' : watch('position') }}>
                                                                    {watch('title') && (
                                                                        <h6 style={{ color: watch('textColor'), marginBottom: '4px', fontSize: '0.9rem' }}>
                                                                            {watch('title')}
                                                                        </h6>
                                                                    )}
                                                                    {watch('subtitle') && (
                                                                        <p style={{ color: watch('textColor'), marginBottom: '8px', fontSize: '0.7rem', opacity: 0.9 }}>
                                                                            {watch('subtitle')}
                                                                        </p>
                                                                    )}
                                                                    {watch('buttonText') && (
                                                                        <div
                                                                            style={{
                                                                                display: 'inline-block',
                                                                                padding: '4px 8px',
                                                                                border: `1px solid ${watch('textColor')}`,
                                                                                color: watch('textColor'),
                                                                                fontSize: '0.6rem',
                                                                                textTransform: 'uppercase'
                                                                            }}
                                                                        >
                                                                            {watch('buttonText')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? 'Saving...' : selectedSlide ? 'Update Slide' : 'Create Slide'}
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

export default HomepageSlidesManagement; 