import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { usePhotos, useUploadPhoto, useDeletePhoto } from '@/api/hooks';

const MediaLibrary = () => {
    const [selectedPhotos, setSelectedPhotos] = useState(new Set());
    const [showBatchActions, setShowBatchActions] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Queries
    const { data: photos = [], isLoading, refetch } = usePhotos();

    // Mutations
    const uploadPhotoMutation = useUploadPhoto();
    const deletePhotoMutation = useDeletePhoto();

    // Form for upload modal
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    // Filter and sort photos
    const filteredPhotos = photos
        .filter(photo => {
            if (filters.search && !photo.fileName?.toLowerCase().includes(filters.search.toLowerCase()) &&
                !photo.altText?.toLowerCase().includes(filters.search.toLowerCase())) return false;
            if (filters.category && photo.category !== filters.category) return false;
            return true;
        })
        .sort((a, b) => {
            const aValue = a[filters.sortBy] || '';
            const bValue = b[filters.sortBy] || '';
            if (filters.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Handle file upload
    const handleFileUpload = async (files) => {
        const fileArray = Array.from(files);

        try {
            for (const file of fileArray) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('alt', file.name.split('.')[0]);

                await uploadPhotoMutation.mutateAsync(formData);
            }
            refetch();
            setShowUploadModal(false);
        } catch (error) {
            console.error('Error uploading photos:', error);
        }
    };

    // Handle form upload
    const onUploadSubmit = async (data) => {
        if (data.files && data.files.length > 0) {
            await handleFileUpload(data.files);
            reset();
        }
    };

    // Handle drag and drop
    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    // Handle photo selection
    const handleSelectPhoto = (photoId) => {
        const newSelection = new Set(selectedPhotos);
        if (newSelection.has(photoId)) {
            newSelection.delete(photoId);
        } else {
            newSelection.add(photoId);
        }
        setSelectedPhotos(newSelection);
        setShowBatchActions(newSelection.size > 0);
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedPhotos.size === filteredPhotos.length) {
            setSelectedPhotos(new Set());
            setShowBatchActions(false);
        } else {
            setSelectedPhotos(new Set(filteredPhotos.map(photo => photo.id)));
            setShowBatchActions(true);
        }
    };

    // Handle batch delete
    const handleBatchDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedPhotos.size} photos?`)) {
            try {
                await Promise.all(
                    Array.from(selectedPhotos).map(id =>
                        deletePhotoMutation.mutateAsync(id)
                    )
                );
                setSelectedPhotos(new Set());
                setShowBatchActions(false);
                refetch();
            } catch (error) {
                console.error('Error batch deleting photos:', error);
            }
        }
    };

    // Handle single photo delete
    const handleDeletePhoto = async (photoId) => {
        if (window.confirm('Are you sure you want to delete this photo?')) {
            try {
                await deletePhotoMutation.mutateAsync(photoId);
                refetch();
            } catch (error) {
                console.error('Error deleting photo:', error);
            }
        }
    };

    // Copy URL to clipboard
    const copyToClipboard = (url) => {
        navigator.clipboard.writeText(url).then(() => {
            console.log('URL copied to clipboard');
        });
    };

    // Get photo categories
    const categories = [...new Set(photos.map(photo => photo.category).filter(Boolean))];

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
        <div className="media-library">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Media Library</h2>
                    <p className="text-muted">Manage your photos and media files</p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowUploadModal(true)}
                    >
                        <i className="bi bi-cloud-upload me-2"></i>
                        Upload Photos
                    </button>
                </div>
            </div>

            {/* Filters and Controls */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                            <label className="form-label">Search</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search photos..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Category</label>
                            <select
                                className="form-select"
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Sort By</label>
                            <select
                                className="form-select"
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            >
                                <option value="createdAt">Date Added</option>
                                <option value="fileName">File Name</option>
                                <option value="fileSize">File Size</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Order</label>
                            <select
                                className="form-select"
                                value={filters.sortOrder}
                                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                            >
                                <option value="desc">Newest First</option>
                                <option value="asc">Oldest First</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <div className="btn-group w-100" role="group">
                                <button
                                    className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <i className="bi bi-grid-3x3-gap"></i> Grid
                                </button>
                                <button
                                    className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setViewMode('list')}
                                >
                                    <i className="bi bi-list"></i> List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Batch Actions Bar */}
            {showBatchActions && (
                <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
                    <span>{selectedPhotos.size} photos selected</span>
                    <div className="btn-group">
                        <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={handleBatchDelete}
                        >
                            Delete Selected
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                                setSelectedPhotos(new Set());
                                setShowBatchActions(false);
                            }}
                        >
                            Cancel Selection
                        </button>
                    </div>
                </div>
            )}

            {/* Media Display */}
            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    {/* Select All Checkbox */}
                    {filteredPhotos.length > 0 && (
                        <div className="mb-3">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={filteredPhotos.length > 0 && selectedPhotos.size === filteredPhotos.length}
                                    onChange={handleSelectAll}
                                />
                                <label className="form-check-label">
                                    Select All ({filteredPhotos.length} photos)
                                </label>
                            </div>
                        </div>
                    )}

                    {viewMode === 'grid' ? (
                        /* Grid View */
                        <div className="row g-4">
                            {filteredPhotos.length > 0 ? (
                                filteredPhotos.map((photo) => (
                                    <div key={photo.id} className="col-xl-2 col-lg-3 col-md-4 col-sm-6">
                                        <div className={`card h-100 ${selectedPhotos.has(photo.id) ? 'border-primary' : ''}`}>
                                            <div className="position-relative">
                                                <img
                                                    src={photo.url}
                                                    alt={photo.alt || 'Photo'}
                                                    className="card-img-top"
                                                    style={{ height: '200px', objectFit: 'cover' }}
                                                />
                                                <div className="position-absolute top-0 start-0 p-2">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={selectedPhotos.has(photo.id)}
                                                        onChange={() => handleSelectPhoto(photo.id)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="card-body p-2">
                                                <h6 className="card-title small mb-1">{photo.fileName || 'Unknown file'}</h6>
                                                <p className="card-text small text-muted mb-2">
                                                    {photo.fileSize ? `${(photo.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                                                </p>
                                                <div className="d-flex gap-1">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary flex-grow-1"
                                                        onClick={() => copyToClipboard(photo.url)}
                                                        title="Copy URL"
                                                    >
                                                        <i className="bi bi-clipboard"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDeletePhoto(photo.id)}
                                                        title="Delete"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12">
                                    <div className="text-center py-5">
                                        <span style={{ fontSize: '4rem', opacity: 0.3 }}>🖼️</span>
                                        <h5 className="mt-3">No photos found</h5>
                                        <p className="text-muted">Upload some photos to get started</p>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => setShowUploadModal(true)}
                                        >
                                            Upload Photos
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* List View */
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '50px' }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={filteredPhotos.length > 0 && selectedPhotos.size === filteredPhotos.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>Preview</th>
                                        <th>File Name</th>
                                        <th>Size</th>
                                        <th>Date Added</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPhotos.length > 0 ? (
                                        filteredPhotos.map((photo) => (
                                            <tr key={photo.id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={selectedPhotos.has(photo.id)}
                                                        onChange={() => handleSelectPhoto(photo.id)}
                                                    />
                                                </td>
                                                <td>
                                                    <img
                                                        src={photo.url}
                                                        alt={photo.alt || 'Photo'}
                                                        className="rounded"
                                                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                    />
                                                </td>
                                                <td>
                                                    <div>
                                                        <h6 className="mb-1">{photo.fileName || 'Unknown file'}</h6>
                                                        <small className="text-muted">{photo.alt}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    {photo.fileSize ? `${(photo.fileSize / 1024).toFixed(1)} KB` : 'Unknown'}
                                                </td>
                                                <td>
                                                    {photo.createdAt ? new Date(photo.createdAt).toLocaleDateString() : 'Unknown'}
                                                </td>
                                                <td>
                                                    <div className="btn-group" role="group">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => copyToClipboard(photo.url)}
                                                            title="Copy URL"
                                                        >
                                                            <i className="bi bi-clipboard"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDeletePhoto(photo.id)}
                                                            title="Delete"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-4">
                                                <div className="text-muted">
                                                    <span style={{ fontSize: '3rem', opacity: 0.3 }}>🖼️</span>
                                                    <h6 className="mt-2">No photos found</h6>
                                                    <p>Upload some photos to get started</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Upload Photos</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowUploadModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit(onUploadSubmit)}>
                                <div className="modal-body">
                                    <div
                                        className={`border-2 border-dashed rounded p-5 text-center ${dragOver ? 'border-primary bg-light' : 'border-secondary'
                                            }`}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                    >
                                        <i className="bi bi-cloud-upload" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                                        <h5 className="mt-3">Drag and drop photos here</h5>
                                        <p className="text-muted mb-3">or</p>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Choose Files
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="d-none"
                                            {...register('files')}
                                            onChange={(e) => handleFileUpload(e.target.files)}
                                        />
                                        <div className="mt-3">
                                            <small className="text-muted">
                                                Supported formats: JPG, PNG, GIF, WebP (Max 10MB each)
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowUploadModal(false)}
                                    >
                                        Cancel
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

export default MediaLibrary;
