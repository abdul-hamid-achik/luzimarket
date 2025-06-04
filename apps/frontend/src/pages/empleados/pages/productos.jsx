import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import BreadCrumb from "@/components/breadcrumb";
import {
  BsBoxSeam,
  BsImage,
  BsArrowLeft,
  BsChatDots,
  BsCheck2Circle,
  BsUpload,
  BsX,
  BsEye,
  BsTrash,
  BsInfoCircle,
  BsTag,
  BsCurrencyDollar,
  BsBuilding,
  BsPlus,
  BsPencil,
  BsSearch,
  BsFilter,
  BsGrid,
  BsList,
  BsThreeDotsVertical,
  BsCheckCircle,
  BsXCircle,
  BsClock,
  BsArchive
} from "react-icons/bs";
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/api/products';
import { getCategories } from '@/api/categories';
import { uploadPhoto } from '@/api/photos';
import './productos.css';

const Productos = () => {
  // State management
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

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
      description: '',
      price: '',
      categoryId: '',
      status: 'draft',
      featured: false,
      slug: ''
    }
  });

  // Watch form values for auto-slug generation
  const watchedName = watch('name');
  const watchedPrice = watch('price');
  const watchedDescription = watch('description');
  const watchedStatus = watch('status');
  const watchedFeatured = watch('featured');

  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  const items = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Productos", link: "/dashboard/productos" },
  ];

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (watchedName && !editingProduct) {
      const slug = watchedName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  }, [watchedName, setValue, editingProduct]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories()
      ]);
      setProducts(productsData.products || productsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Form submission handler
  const handleFormSubmit = async (data) => {
    setSaving(true);
    try {
      const productData = {
        ...data,
        price: parseFloat(data.price)
      };

      let result;
      if (editingProduct) {
        result = await updateProduct({ productId: editingProduct.id, ...productData });
      } else {
        result = await createProduct(productData);
      }

      // Reload products list
      await loadData();

      // Reset form and go back to list
      reset();
      setImages([]);
      setEditingProduct(null);
      setView('list');

      alert(`Producto ${editingProduct ? 'actualizado' : 'creado'} exitosamente`);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('alt', file.name);

        const uploadedPhoto = await uploadPhoto(formData);

        const newImage = {
          id: uploadedPhoto.id || Date.now() + Math.random(),
          url: uploadedPhoto.url,
          alt: uploadedPhoto.alt || file.name,
          file: file
        };

        setImages(prev => [...prev, newImage]);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Error al subir la imagen ${file.name}`);
      }
    }
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    reset({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      categoryId: product.categoryId || '',
      status: product.status || 'draft',
      featured: product.featured || false,
      slug: product.slug || ''
    });
    setImages([]); // Reset images for now
    setView('form');
  };

  const handleDelete = async (productId) => {
    if (!confirm('¿Está seguro de que desea eliminar este producto?')) {
      return;
    }

    try {
      await deleteProduct(productId);
      await loadData();
      alert('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    }
  };

  const resetForm = () => {
    reset({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      status: 'draft',
      featured: false,
      slug: ''
    });
    setImages([]);
    setEditingProduct(null);
  };

  const handleNewProduct = () => {
    resetForm();
    setView('form');
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { class: 'badge bg-secondary', text: 'Borrador', icon: BsClock },
      active: { class: 'badge bg-success', text: 'Activo', icon: BsCheckCircle },
      inactive: { class: 'badge bg-warning', text: 'Inactivo', icon: BsXCircle },
      out_of_stock: { class: 'badge bg-danger', text: 'Agotado', icon: BsArchive }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const IconComponent = config.icon;

    return (
      <span className={config.class}>
        <IconComponent className="me-1" size={12} />
        {config.text}
      </span>
    );
  };

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
    <div className="productos-dashboard">
      <div className="container-fluid p-4">
        <BreadCrumb items={items} activeItem={view === 'form' ? (editingProduct ? 'Editar Producto' : 'Nuevo Producto') : 'Productos'} />

        {view === 'list' ? (
          // Products List View
          <>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1">
                  <BsBoxSeam className="me-2" />
                  Gestión de Productos
                </h2>
                <p className="text-muted mb-0">Administra el catálogo de productos de la tienda</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleNewProduct}
              >
                <BsPlus className="me-2" />
                Nuevo Producto
              </button>
            </div>

            {/* Filters and Search */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="input-group">
                      <span className="input-group-text">
                        <BsSearch />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">Todos los estados</option>
                      <option value="draft">Borrador</option>
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="out_of_stock">Agotado</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">Todas las categorías</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <div className="btn-group" role="group">
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

            {/* Products Display */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-5">
                <BsBoxSeam size={64} className="text-muted mb-3" />
                <h4 className="text-muted">No se encontraron productos</h4>
                <p className="text-muted">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Comienza agregando tu primer producto'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
                  <button className="btn btn-primary" onClick={handleNewProduct}>
                    <BsPlus className="me-2" />
                    Agregar Primer Producto
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              // Grid View
              <div className="row">
                {filteredProducts.map(product => (
                  <div key={product.id} className="col-lg-4 col-md-6 mb-4">
                    <div className="card h-100 product-card">
                      <div className="card-img-top-container">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            className="card-img-top"
                            alt={product.name}
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="card-img-placeholder d-flex align-items-center justify-content-center">
                            <BsImage size={48} className="text-muted" />
                          </div>
                        )}
                        <div className="card-img-overlay-actions">
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-light"
                              data-bs-toggle="dropdown"
                            >
                              <BsThreeDotsVertical />
                            </button>
                            <ul className="dropdown-menu">
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleEdit(product)}
                                >
                                  <BsPencil className="me-2" />
                                  Editar
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item text-danger"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  <BsTrash className="me-2" />
                                  Eliminar
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="card-title mb-0">{product.name}</h5>
                          {getStatusBadge(product.status)}
                        </div>
                        <p className="card-text text-muted small">
                          {product.description?.substring(0, 100)}
                          {product.description?.length > 100 && '...'}
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h5 mb-0 text-primary">
                            ${parseFloat(product.price || 0).toLocaleString('es-MX')}
                          </span>
                          <small className="text-muted">
                            {categories.find(c => c.id === product.categoryId)?.name || 'Sin categoría'}
                          </small>
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
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Categoría</th>
                        <th>Estado</th>
                        <th>Destacado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(product => (
                        <tr key={product.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="rounded me-3"
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  className="bg-light rounded me-3 d-flex align-items-center justify-content-center"
                                  style={{ width: '50px', height: '50px' }}
                                >
                                  <BsImage className="text-muted" />
                                </div>
                              )}
                              <div>
                                <div className="fw-medium">{product.name}</div>
                                <small className="text-muted">
                                  {product.description?.substring(0, 50)}
                                  {product.description?.length > 50 && '...'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="fw-medium">
                            ${parseFloat(product.price || 0).toLocaleString('es-MX')}
                          </td>
                          <td>
                            {categories.find(c => c.id === product.categoryId)?.name || 'Sin categoría'}
                          </td>
                          <td>
                            {getStatusBadge(product.status)}
                          </td>
                          <td>
                            {product.featured ? (
                              <BsCheckCircle className="text-success" />
                            ) : (
                              <BsXCircle className="text-muted" />
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => handleEdit(product)}
                              >
                                <BsPencil />
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(product.id)}
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
          // Product Form View
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
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </h2>
                  <p className="text-muted mb-0">
                    {editingProduct ? 'Modifica la información del producto' : 'Completa la información del nuevo producto'}
                  </p>
                </div>
              </div>

              <form onSubmit={onSubmit(handleFormSubmit)}>
                {/* Basic Information */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <BsTag className="me-2" />
                      Información Básica
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-8 mb-3">
                        <label className="form-label">Nombre del Producto *</label>
                        <input
                          type="text"
                          {...register('name', {
                            required: 'El nombre del producto es requerido',
                            minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' }
                          })}
                          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                          placeholder="Ingrese el nombre del producto"
                        />
                        {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                      </div>

                      <div className="col-md-4 mb-3">
                        <label className="form-label">Precio (MXN) *</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <BsCurrencyDollar />
                          </span>
                          <input
                            type="number"
                            {...register('price', {
                              required: 'El precio es requerido',
                              min: { value: 0.01, message: 'El precio debe ser mayor a 0' }
                            })}
                            className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                          {errors.price && <div className="invalid-feedback">{errors.price.message}</div>}
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Categoría *</label>
                        <select
                          {...register('categoryId', {
                            required: 'La categoría es requerida'
                          })}
                          className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
                        >
                          <option value="">Seleccionar categoría</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        {errors.categoryId && <div className="invalid-feedback">{errors.categoryId.message}</div>}
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Estado</label>
                        <select
                          {...register('status')}
                          className="form-select"
                        >
                          <option value="draft">Borrador</option>
                          <option value="active">Activo</option>
                          <option value="inactive">Inactivo</option>
                          <option value="out_of_stock">Agotado</option>
                        </select>
                      </div>

                      <div className="col-12 mb-3">
                        <label className="form-label">Slug (URL)</label>
                        <input
                          type="text"
                          {...register('slug')}
                          className="form-control"
                          placeholder="url-amigable-del-producto"
                        />
                        <div className="form-text">Se genera automáticamente desde el nombre</div>
                      </div>

                      <div className="col-12 mb-3">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            {...register('featured')}
                            className="form-check-input"
                            id="featured"
                          />
                          <label className="form-check-label" htmlFor="featured">
                            Producto destacado
                          </label>
                        </div>
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
                          placeholder="Describe el producto detalladamente..."
                        />
                        {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <BsImage className="me-2" />
                      Imágenes del Producto
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        multiple
                        className="d-none"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <BsUpload className="me-2" />
                        Subir Imágenes
                      </button>
                    </div>

                    {images.length > 0 && (
                      <div className="row">
                        {images.map(image => (
                          <div key={image.id} className="col-md-3 mb-3">
                            <div className="position-relative">
                              <img
                                src={image.url}
                                alt={image.alt}
                                className="img-fluid rounded"
                                style={{ height: '150px', width: '100%', objectFit: 'cover' }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                                onClick={() => removeImage(image.id)}
                              >
                                <BsX />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

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
                            {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
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

export default Productos;
