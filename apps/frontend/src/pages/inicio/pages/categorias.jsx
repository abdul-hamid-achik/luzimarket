import React from 'react';
import { useCategories } from "@/api/hooks";
import { Link } from "react-router-dom";
import { FaTags, FaShoppingBag, FaGift, FaHeart, FaHome, FaBirthdayCake } from "react-icons/fa";
import "@/pages/inicio/css/categorias.css";

// Demo categories with proper image URLs
const demoCategories = [
    {
        id: 1,
        name: 'Arreglos Florales',
        slug: 'arreglos-florales',
        description: 'Hermosos arreglos florales frescos para toda ocasión, desde rosas clásicas hasta composiciones únicas que expresan tus sentimientos más profundos.',
        icon: <FaHeart />,
        imageUrl: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600&h=400&fit=crop&auto=format&q=80'
    },
    {
        id: 2,
        name: 'Canastas de Regalo',
        slug: 'canastas-de-regalo',
        description: 'Canastas cuidadosamente seleccionadas con los mejores productos gourmet, frutas frescas y detalles especiales para sorprender a tus seres queridos.',
        icon: <FaGift />,
        imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=400&fit=crop&auto=format&q=80'
    },
    {
        id: 3,
        name: 'Delicias Gourmet',
        slug: 'delicias-gourmet',
        description: 'Exquisitos chocolates artesanales, dulces tradicionales y manjares gourmet que deleitan el paladar más exigente.',
        icon: <FaBirthdayCake />,
        imageUrl: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=600&h=400&fit=crop&auto=format&q=80'
    },
    {
        id: 4,
        name: 'Decoración para el Hogar',
        slug: 'decoracion-para-el-hogar',
        description: 'Piezas únicas de decoración que transforman cualquier espacio en un hogar acogedor y lleno de estilo.',
        icon: <FaHome />,
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop&auto=format&q=80'
    },
    {
        id: 5,
        name: 'Regalos Personalizados',
        slug: 'regalos-personalizados',
        description: 'Crea momentos inolvidables con regalos únicos personalizados especialmente para esa persona especial.',
        icon: <FaShoppingBag />,
        imageUrl: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&h=400&fit=crop&auto=format&q=80'
    },
    {
        id: 6,
        name: 'Aromaterapia y Bienestar',
        slug: 'aromaterapia-y-bienestar',
        description: 'Productos de aromaterapia y bienestar para crear ambientes relajantes y promover el equilibrio interior.',
        icon: <FaTags />,
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&auto=format&q=80'
    },
];

const Categorias = () => {
    const { data, error, isLoading } = useCategories();
    const categories = (data && data.length) ? data : demoCategories;

    return (
        <div className="categories-page">
            <div className="container">
                {/* Header */}
                <div className="categories-header">
                    <h1 className="categories-title">Nuestras Categorías</h1>
                    <p className="categories-subtitle">
                        Explora nuestra amplia selección de productos organizados por categorías
                    </p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="categories-loading">
                        <div className="categories-spinner"></div>
                        <p className="categories-loading-text">Cargando categorías...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="categories-error">
                        <h5 className="categories-error-title">Error al cargar las categorías</h5>
                        <p className="categories-error-message">Por favor intenta nuevamente más tarde.</p>
                        <small className="categories-error-detail">Error: {error.message}</small>
                    </div>
                )}

                {/* Categories Grid */}
                {!isLoading && !error && (
                    <div className="categories-grid">
                        {categories.map(category => (
                            <div key={category.id} className="category-card">
                                {/* Category Image */}
                                <div className="category-image-container">
                                    <img
                                        src={category.imageUrl || category.image || `https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop&auto=format&q=80`}
                                        alt={category.name}
                                        className="category-image"
                                    />
                                    <div className="category-overlay">
                                        <div>
                                            <div className="category-icon">
                                                {category.icon || <FaTags />}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Category Content */}
                                <div className="category-content">
                                    <h3 className="category-name">{category.name}</h3>
                                    <p className="category-description">
                                        {category.description || `Descubre productos increíbles en la categoría ${category.name}`}
                                    </p>

                                    {/* Action Button */}
                                    <Link
                                        to={`/categorias/${category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                                        className="btn-category"
                                    >
                                        Ver Productos
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && categories.length === 0 && (
                    <div className="categories-empty">
                        <div className="categories-empty-icon">
                            <FaTags />
                        </div>
                        <h3 className="categories-empty-title">No hay categorías disponibles</h3>
                        <p className="categories-empty-message">Vuelve pronto para ver nuestras categorías.</p>
                    </div>
                )}

                {/* Call to Action */}
                {!isLoading && !error && categories.length > 0 && (
                    <div className="categories-cta">
                        <h4 className="categories-cta-title">¿No encuentras lo que buscas?</h4>
                        <p className="categories-cta-text">
                            Explora todos nuestros productos o contáctanos para ayudarte
                        </p>
                        <div className="categories-cta-buttons">
                            <Link to="/handpicked/productos" className="btn-cta-primary">
                                Ver Todos los Productos
                            </Link>
                            <Link to="/editorial" className="btn-cta-secondary">
                                Leer Nuestro Blog
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Categorias;