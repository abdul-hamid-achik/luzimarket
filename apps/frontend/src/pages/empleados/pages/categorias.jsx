import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import BreadCrumb from "@/components/breadcrumb";
import {
    BsTag,
    BsPlus,
    BsPencil,
    BsTrash,
    BsSearch,
    BsGrid,
    BsList,
    BsThreeDotsVertical,
    BsCheck2Circle,
    BsX,
    BsArrowLeft,
    BsCheckSquare,
    BsSquare,
    BsDownload,
    BsUpload,
    BsEye,
    BsLink,
    BsInfoCircle,
    BsSave,
    BsXCircle
} from "react-icons/bs";
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categories';
import './categorias.css';

const Categorias = () => {
    // State management
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingCategory, setEditingCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'grid' or 'table'
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [batchEditMode, setBatchEditMode] = useState(false);
    const [showBatchActions, setShowBatchActions] = useState(false);

    // React Hook Form
    const {
        register,
        handleSubmit: onSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            name: '',
            slug: '',
            description: ''
        }
    });

    // Watch form values for auto-slug generation
    const watchedName = watch('name');
    const watchedSlug = watch('slug');
    const watchedDescription = watch('description');

    const items = [
        { name: "Dashboard", link: "/dashboard" },
        { name: "Categorías", link: "/dashboard/categorias" },
    ];

    // Load initial data
    useEffect(() => {
        loadData();
    }, []);

    // Update batch actions visibility when selection changes
    useEffect(() => {
        setShowBatchActions(selectedCategories.size > 0);
    }, [selectedCategories]);

    // Auto-generate slug from name
    useEffect(() => {
        if (watchedName && !editingCategory) {
            const slug = watchedName.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            setValue('slug', slug);
        }
    }, [watchedName, setValue, editingCategory]);

    const loadData = async () => {
        try {
            setLoading(true);
            const categoriesData = await getCategories();
            setCategories(categoriesData || []);
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };

    // Form submission handler
    const handleFormSubmit = async (data) => {
        setSaving(true);
        try {
            // Check for duplicate slug
            const existingCategory = categories.find(cat =>
                cat.slug === data.slug && cat.id !== editingCategory?.id
            );
            if (existingCategory) {
                alert('Este slug ya existe, debe ser único');
                setSaving(false);
                return;
            }

            if (editingCategory) {
                await updateCategory({ categoryId: editingCategory.id, ...data });
            } else {
                await createCategory(data);
            }

            // Reload categories list
            await loadData();

            // Reset form and go back to list
            reset();
            setEditingCategory(null);
            setView('list');

            alert(`Categoría ${editingCategory ? 'actualizada' : 'creada'} exitosamente`);
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error al guardar la categoría. Intente nuevamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        reset({
            name: category.name || '',
            slug: category.slug || '',
            description: category.description || ''
        });
        setView('form');
    };

    const handleDelete = async (categoryId) => {
        if (!confirm('¿Está seguro de que desea eliminar esta categoría?')) {
            return;
        }

        try {
            await deleteCategory(categoryId);
            await loadData();
            alert('Categoría eliminada exitosamente');
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Error al eliminar la categoría');
        }
    };

    const resetForm = () => {
        reset({
            name: '',
            slug: '',
            description: ''
        });
        setEditingCategory(null);
    };

    const handleNewCategory = () => {
        resetForm();
        setView('form');
    };

    // Selection handlers
    const handleSelectCategory = (categoryId) => {
        const newSelected = new Set(selectedCategories);
        if (newSelected.has(categoryId)) {
            newSelected.delete(categoryId);
        } else {
            newSelected.add(categoryId);
        }
        setSelectedCategories(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedCategories.size === filteredCategories.length) {
            setSelectedCategories(new Set());
        } else {
            setSelectedCategories(new Set(filteredCategories.map(cat => cat.id)));
        }
    };

    const handleBatchDelete = async () => {
        if (selectedCategories.size === 0) return;

        if (!confirm(`¿Está seguro de que desea eliminar ${selectedCategories.size} categorías?`)) {
            return;
        }

        try {
            const deletePromises = Array.from(selectedCategories).map(id => deleteCategory(id));
            await Promise.all(deletePromises);
            await loadData();
            setSelectedCategories(new Set());
            setBatchEditMode(false);
            alert(`${selectedCategories.size} categorías eliminadas exitosamente`);
        } catch (error) {
            console.error('Error deleting categories:', error);
            alert('Error al eliminar las categorías');
        }
    };

    // Filter categories
    const filteredCategories = categories.filter(category =>
        category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="categorias-dashboard">
            <div className="container-fluid p-4">
                <BreadCrumb items={items} activeItem={view === 'form' ? (editingCategory ? 'Editar Categoría' : 'Nueva Categoría') : 'Categorías'} />

                {view === 'list' ? (
                    // Categories List View
                    <>
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h2 className="mb-1">
                                    <BsTag className="me-2" />
                                    Gestión de Categorías
                                </h2>
                                <p className="text-muted mb-0">Administra las categorías de productos de la tienda</p>
                            </div>
                            <div className="d-flex gap-2">
                                {showBatchActions && (
                                    <div className="btn-group">
                                        <button
                                            className="btn btn-outline-danger"
                                            onClick={handleBatchDelete}
                                        >
                                            <BsTrash className="me-2" />
                                            Eliminar ({selectedCategories.size})
                                        </button>
                                    </div>
                                )}
                                <button
                                    className={`btn ${batchEditMode ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                    onClick={() => {
                                        setBatchEditMode(!batchEditMode);
                                        setSelectedCategories(new Set());
                                    }}
                                >
                                    {batchEditMode ? (
                                        <>
                                            <BsX className="me-2" />
                                            Cancelar Selección
                                        </>
                                    ) : (
                                        <>
                                            <BsCheckSquare className="me-2" />
                                            Selección Múltiple
                                        </>
                                    )}
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleNewCategory}
                                >
                                    <BsPlus className="me-2" />
                                    Nueva Categoría
                                </button>
                            </div>
                        </div>

                        {/* Search and View Controls */}
                        <div className="card mb-4">
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <BsSearch />
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Buscar categorías..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="d-flex align-items-center text-muted">
                                            <BsInfoCircle className="me-2" />
                                            {filteredCategories.length} categorías encontradas
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="btn-group w-100" role="group">
                                            <button
                                                type="button"
                                                className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setViewMode('grid')}
                                            >
                                                <BsGrid />
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setViewMode('table')}
                                            >
                                                <BsList />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Categories Display */}
                        {filteredCategories.length === 0 ? (
                            <div className="text-center py-5">
                                <BsTag size={64} className="text-muted mb-3" />
                                <h4 className="text-muted">No se encontraron categorías</h4>
                                <p className="text-muted">
                                    {searchTerm
                                        ? 'Intenta ajustar los términos de búsqueda'
                                        : 'Comienza agregando tu primera categoría'
                                    }
                                </p>
                                {!searchTerm && (
                                    <button className="btn btn-primary" onClick={handleNewCategory}>
                                        <BsPlus className="me-2" />
                                        Agregar Primera Categoría
                                    </button>
                                )}
                            </div>
                        ) : viewMode === 'grid' ? (
                            // Grid View
                            <div className="row">
                                {filteredCategories.map(category => (
                                    <div key={category.id} className="col-lg-4 col-md-6 mb-4">
                                        <div className="card h-100 category-card">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <div className="d-flex align-items-center">
                                                        {batchEditMode && (
                                                            <div className="form-check me-3">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={selectedCategories.has(category.id)}
                                                                    onChange={() => handleSelectCategory(category.id)}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="category-icon">
                                                            <BsTag size={24} className="text-primary" />
                                                        </div>
                                                    </div>
                                                    <div className="dropdown">
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary"
                                                            data-bs-toggle="dropdown"
                                                        >
                                                            <BsThreeDotsVertical />
                                                        </button>
                                                        <ul className="dropdown-menu">
                                                            <li>
                                                                <button
                                                                    className="dropdown-item"
                                                                    onClick={() => handleEdit(category)}
                                                                >
                                                                    <BsPencil className="me-2" />
                                                                    Editar
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button
                                                                    className="dropdown-item"
                                                                    onClick={() => window.open(`/categorias/${category.slug}`, '_blank')}
                                                                >
                                                                    <BsEye className="me-2" />
                                                                    Ver en tienda
                                                                </button>
                                                            </li>
                                                            <li><hr className="dropdown-divider" /></li>
                                                            <li>
                                                                <button
                                                                    className="dropdown-item text-danger"
                                                                    onClick={() => handleDelete(category.id)}
                                                                >
                                                                    <BsTrash className="me-2" />
                                                                    Eliminar
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>

                                                <h5 className="card-title">{category.name}</h5>
                                                <p className="card-text text-muted small">
                                                    {category.description?.substring(0, 100)}
                                                    {category.description?.length > 100 && '...'}
                                                </p>

                                                <div className="mt-auto">
                                                    <div className="d-flex align-items-center text-muted small">
                                                        <BsLink className="me-1" />
                                                        <code>/{category.slug}</code>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Table View
                            <div className="card">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                {batchEditMode && (
                                                    <th style={{ width: '50px' }}>
                                                        <div className="form-check">
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={selectedCategories.size === filteredCategories.length && filteredCategories.length > 0}
                                                                onChange={handleSelectAll}
                                                            />
                                                        </div>
                                                    </th>
                                                )}
                                                <th>Categoría</th>
                                                <th>Slug</th>
                                                <th>Descripción</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCategories.map(category => (
                                                <tr key={category.id}>
                                                    {batchEditMode && (
                                                        <td>
                                                            <div className="form-check">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={selectedCategories.has(category.id)}
                                                                    onChange={() => handleSelectCategory(category.id)}
                                                                />
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="category-icon me-3">
                                                                <BsTag className="text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="fw-medium">{category.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <code className="text-muted">/{category.slug}</code>
                                                    </td>
                                                    <td>
                                                        <span className="text-muted">
                                                            {category.description?.substring(0, 80)}
                                                            {category.description?.length > 80 && '...'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group btn-group-sm">
                                                            <button
                                                                className="btn btn-outline-primary"
                                                                onClick={() => handleEdit(category)}
                                                                title="Editar"
                                                            >
                                                                <BsPencil />
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                onClick={() => window.open(`/categorias/${category.slug}`, '_blank')}
                                                                title="Ver en tienda"
                                                            >
                                                                <BsEye />
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-danger"
                                                                onClick={() => handleDelete(category.id)}
                                                                title="Eliminar"
                                                            >
                                                                <BsTrash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    // Category Form View
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            {/* Form Header */}
                            <div className="d-flex align-items-center mb-4">
                                <button
                                    className="btn btn-outline-secondary me-3"
                                    onClick={() => setView('list')}
                                >
                                    <BsArrowLeft />
                                </button>
                                <div>
                                    <h2 className="mb-1">
                                        {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                                    </h2>
                                    <p className="text-muted mb-0">
                                        {editingCategory ? 'Modifica la información de la categoría' : 'Completa la información de la nueva categoría'}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={onSubmit(handleFormSubmit)}>
                                {/* Basic Information */}
                                <div className="card mb-4">
                                    <div className="card-header">
                                        <h5 className="mb-0">
                                            <BsTag className="me-2" />
                                            Información de la Categoría
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Nombre de la Categoría *</label>
                                                <input
                                                    type="text"
                                                    {...register('name', {
                                                        required: 'El nombre de la categoría es requerido',
                                                        minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' }
                                                    })}
                                                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                    placeholder="Ej: Electrónicos"
                                                />
                                                {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Slug (URL) *</label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <BsLink />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        {...register('slug', {
                                                            required: 'El slug es requerido',
                                                            pattern: {
                                                                value: /^[a-z0-9-]+$/,
                                                                message: 'El slug solo puede contener letras minúsculas, números y guiones'
                                                            }
                                                        })}
                                                        className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                                                        placeholder="electronicos"
                                                    />
                                                    {errors.slug && <div className="invalid-feedback">{errors.slug.message}</div>}
                                                </div>
                                                <div className="form-text">Se genera automáticamente desde el nombre</div>
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label">Descripción *</label>
                                                <textarea
                                                    {...register('description', {
                                                        required: 'La descripción es requerida',
                                                        minLength: { value: 10, message: 'La descripción debe tener al menos 10 caracteres' }
                                                    })}
                                                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                                    rows="4"
                                                    placeholder="Describe la categoría y qué tipo de productos incluye..."
                                                />
                                                {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                {watchedName && (
                                    <div className="card mb-4">
                                        <div className="card-header">
                                            <h5 className="mb-0">
                                                <BsEye className="me-2" />
                                                Vista Previa
                                            </h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="d-flex align-items-center">
                                                <BsTag className="text-primary me-3" size={24} />
                                                <div>
                                                    <h6 className="mb-1">{watchedName}</h6>
                                                    <small className="text-muted">/{watchedSlug}</small>
                                                    <p className="mb-0 mt-2">{watchedDescription}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Form Actions */}
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between">
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => setView('list')}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={isSubmitting || saving}
                                            >
                                                {(isSubmitting || saving) ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Guardando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <BsCheck2Circle className="me-2" />
                                                        {editingCategory ? 'Actualizar Categoría' : 'Crear Categoría'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Categorias; 