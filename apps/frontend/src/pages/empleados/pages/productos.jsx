import React from 'react';
import BreadCrumb from "@/components/breadcrumb";
import ProductManagement from '@/components/shared/ProductManagement';
import './productos.css';

const Productos = () => {
  const items = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Productos", link: "/dashboard/productos" },
  ];

  const spanishTranslations = {
    title: 'Gestión de Productos',
    addProduct: 'Nuevo Producto',
    editProduct: 'Editar Producto',
    productName: 'Nombre del Producto',
    description: 'Descripción',
    price: 'Precio',
    category: 'Categoría',
    vendor: 'Proveedor',
    status: 'Estado',
    featured: 'Destacado',
    actions: 'Acciones',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    zones: 'Zonas',
    deliveryZones: 'Zonas de Entrega',
    noProducts: 'No se encontraron productos',
    searchPlaceholder: 'Buscar productos...',
    allStatuses: 'Todos los estados',
    allCategories: 'Todas las categorías',
    allVendors: 'Todos los proveedores',
    allProducts: 'Todos los productos',
    featuredOnly: 'Solo destacados',
    statusDraft: 'Borrador',
    statusActive: 'Activo',
    statusInactive: 'Inactivo',
    statusOutOfStock: 'Agotado',
    yes: 'Sí',
    no: 'No',
    photos: 'Fotos',
    uploadImage: 'Subir Imagen',
    maxSize: 'Tamaño máximo: 5MB',
    saving: 'Guardando...',
    loading: 'Cargando productos...',
    confirmDelete: '¿Está seguro de que desea eliminar este producto?',
    errors: {
      nameRequired: 'El nombre del producto es requerido',
      descriptionRequired: 'La descripción es requerida',
      priceRequired: 'El precio es requerido',
      categoryRequired: 'La categoría es requerida',
      uploadFailed: 'Error al subir la imagen',
      createFailed: 'Error al crear el producto',
      updateFailed: 'Error al actualizar el producto',
      deleteFailed: 'Error al eliminar el producto'
    },
    success: {
      created: '¡Producto creado exitosamente!',
      updated: '¡Producto actualizado exitosamente!',
      deleted: '¡Producto eliminado exitosamente!'
    }
  };

  return (
    <div className="productos-dashboard">
      <div className="container-fluid p-4">
        <BreadCrumb items={items} activeItem="Productos" />
        
        <ProductManagement 
          isEmployeeDashboard={true}
          showVendorField={false}
          showDeliveryZones={false}
          translations={spanishTranslations}
        />
      </div>
    </div>
  );
};

export default Productos;