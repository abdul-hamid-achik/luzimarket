import React, { useState, useRef } from 'react';
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
  BsBuilding
} from "react-icons/bs";
import './productos.css';

const Productos = () => {
  const [formData, setFormData] = useState({
    nombre: "Tetera Sowden",
    precio: "1000",
    marca: "HAY DESIGN",
    descripcion: `Cras justo odio, dapibus ac facilisis in, egestas eget quam. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras mattis consectetur purus sit amet fermentum. Nullam id dolor id nibh ultricies vehicula ut id elit. Donec sed odio dui.`,
    detalles: `Hour, minute, and second hand in red · Artist signature at back face · German-made UTS quartz movement · AA battery required · Approx. H18 x W18 cm Each item is handcrafted and unique. Supplier color: Red hands Glass. Made in Denmark. 231741M793001.`,
    status: 'draft'
  });

  const [images, setImages] = useState([
    { id: 1, url: '/src/assets/images/imagen_test1.png', name: 'Imagen 1' },
    { id: 2, url: '/src/assets/images/imagen_test2.png', name: 'Imagen 2' },
    { id: 3, url: '/src/assets/images/imagen_test3.png', name: 'Imagen 3' }
  ]);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const items = [
    { name: "Productos", link: "/dashboard/productos" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del producto es requerido';
    }

    if (!formData.precio.trim()) {
      newErrors.precio = 'El precio es requerido';
    } else if (isNaN(formData.precio) || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser un número válido mayor a 0';
    }

    if (!formData.marca.trim()) {
      newErrors.marca = 'La marca es requerida';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }

    if (images.length === 0) {
      newErrors.images = 'Se requiere al menos una imagen del producto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage = {
          id: Date.now() + Math.random(),
          url: event.target.result,
          name: file.name,
          file: file
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async (action) => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log(`Product ${action} with data:`, formData);
      console.log('Images:', images);

      // Show success message or redirect
      alert(`Producto ${action === 'save' ? 'guardado' : action === 'approve' ? 'aprobado' : 'enviado'} exitosamente`);

    } catch (error) {
      console.error('Error submitting product:', error);
      alert('Error al procesar el producto. Intente nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      draft: { class: 'status-draft', text: 'Borrador' },
      published: { class: 'status-published', text: 'Publicado' },
      pending: { class: 'status-pending', text: 'Pendiente' }
    };

    const config = statusConfig[formData.status] || statusConfig.draft;
    return (
      <span className={`status-badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="productos-dashboard">
      <div className="container-fluid p-4">
        <BreadCrumb items={items} activeItem={"Productos"} />

        {/* Product Status Header */}
        <div className="product-form-card mt-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="card-section-title mb-2">
                  <BsBoxSeam className="section-icon" />
                  Detalles del Producto
                </h2>
                <p className="text-muted mb-0">Complete la información del producto para su revisión</p>
              </div>
              <div>
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="product-form-card">
          <div className="card-body">
            <h3 className="card-section-title">
              <BsTag className="section-icon" />
              Información Básica
            </h3>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="modern-form-label">Nombre del Producto</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`form-control modern-form-control ${errors.nombre ? 'form-control-error' : ''}`}
                  placeholder="Ingrese el nombre del producto"
                />
                {errors.nombre && <div className="error-message">{errors.nombre}</div>}
              </div>

              <div className="col-md-3 mb-3">
                <label className="modern-form-label">Precio (MXN)</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <BsCurrencyDollar />
                  </span>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                    className={`form-control modern-form-control ${errors.precio ? 'form-control-error' : ''}`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.precio && <div className="error-message">{errors.precio}</div>}
              </div>

              <div className="col-md-3 mb-3">
                <label className="modern-form-label">Marca</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <BsBuilding />
                  </span>
                  <input
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    className={`form-control modern-form-control ${errors.marca ? 'form-control-error' : ''}`}
                    placeholder="Marca del producto"
                  />
                </div>
                {errors.marca && <div className="error-message">{errors.marca}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Description and Details */}
        <div className="product-form-card">
          <div className="card-body">
            <h3 className="card-section-title">
              <BsChatDots className="section-icon" />
              Descripción y Detalles
            </h3>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="modern-form-label">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className={`form-control modern-form-control ${errors.descripcion ? 'form-control-error' : ''}`}
                  rows="8"
                  placeholder="Describa las características principales del producto..."
                />
                {errors.descripcion && <div className="error-message">{errors.descripcion}</div>}
                <small className="text-muted">
                  {formData.descripcion.length}/500 caracteres
                </small>
              </div>

              <div className="col-md-6 mb-3">
                <label className="modern-form-label">Detalles Técnicos</label>
                <textarea
                  name="detalles"
                  value={formData.detalles}
                  onChange={handleInputChange}
                  className="form-control modern-form-control"
                  rows="8"
                  placeholder="Especificaciones técnicas, dimensiones, materiales, etc..."
                />
                <small className="text-muted">
                  Información adicional para el cliente
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="photo-gallery-card">
          <div className="card-body p-0">
            <div className="p-4 border-bottom">
              <h3 className="card-section-title mb-2">
                <BsImage className="section-icon" />
                Galería de Fotos
              </h3>
              <p className="text-muted mb-0">Suba imágenes de alta calidad del producto</p>
              {errors.images && <div className="error-message mt-2">{errors.images}</div>}
            </div>

            <div className="photo-gallery-grid">
              {images.map((image) => (
                <div key={image.id} className="photo-container">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="photo-image"
                  />
                  <div className="photo-overlay">
                    <div className="photo-actions">
                      <button
                        className="photo-action-btn"
                        title="Ver imagen"
                      >
                        <BsEye />
                      </button>
                      <button
                        className="photo-action-btn"
                        onClick={() => removeImage(image.id)}
                        title="Eliminar imagen"
                      >
                        <BsTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Upload new image */}
              <div
                className="photo-container interactive-card"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                  <BsUpload size={32} className="mb-2" />
                  <span className="text-center">
                    Agregar<br />Imagen
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="d-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons-container">
          <button
            className="modern-btn btn-secondary-modern"
            onClick={() => window.history.back()}
            disabled={isSaving}
          >
            <BsArrowLeft />
            Regresar
          </button>

          <button
            className="modern-btn btn-dark-modern"
            onClick={() => handleSubmit('feedback')}
            disabled={isSaving}
          >
            {isSaving ? <div className="loading-spinner" /> : <BsChatDots />}
            Enviar Feedback
          </button>

          <button
            className="modern-btn btn-primary-modern"
            onClick={() => handleSubmit('approve')}
            disabled={isSaving}
          >
            {isSaving ? <div className="loading-spinner" /> : <BsCheck2Circle />}
            Aceptar
          </button>
        </div>

        {/* Help Section */}
        <div className="product-form-card">
          <div className="card-body">
            <div className="d-flex align-items-start">
              <BsInfoCircle className="text-info me-3 mt-1" size={20} />
              <div>
                <h6 className="mb-2">Información sobre el proceso de aprobación</h6>
                <p className="text-muted mb-0 small">
                  Una vez que acepte el producto, será enviado para revisión final.
                  Puede usar "Enviar Feedback" para solicitar cambios al proveedor
                  antes de la aprobación final.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Productos;
