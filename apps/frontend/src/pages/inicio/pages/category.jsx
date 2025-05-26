import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Spinner, Alert, Card, Button, Breadcrumb } from 'react-bootstrap';
import { useCategoryBySlug, useProducts, useAddToCart } from '@/api/hooks';
import { FaHome, FaTags, FaArrowLeft } from 'react-icons/fa';
import '@/pages/inicio/css/handpicked.css';
import '@/pages/inicio/css/category.css';

const CategoryPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [addedProducts, setAddedProducts] = useState({});
    const [imageErrors, setImageErrors] = useState({});

    // Fetch category by slug
    const {
        data: category,
        isLoading: categoryLoading,
        error: categoryError
    } = useCategoryBySlug(slug);

    // Fetch products for this category
    const {
        data: productsData,
        isLoading: productsLoading,
        error: productsError
    } = useProducts(category ? { categoryId: category.id } : {});

    const addToCart = useAddToCart();
    const products = productsData?.products || [];

    // Enhanced image error handling with multiple fallbacks
    const handleImageError = (e, product) => {
        const img = e.target;
        const currentSrc = img.src;

        // Track error for this product
        setImageErrors(prev => ({ ...prev, [product.id]: true }));

        // Fallback image chain in order of preference
        const fallbackImages = [
            product.imageUrl,
            `https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop&auto=format&q=80`,
            `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&auto=format&q=80`,
            `https://picsum.photos/seed/${product.slug || product.id}/400/400`,
            `https://via.placeholder.com/400x400/f8f9fa/6c757d?text=${encodeURIComponent(product.name.substring(0, 20))}`
        ].filter(Boolean);

        const currentIndex = fallbackImages.findIndex(url => {
            if (!url) return false;
            const baseUrl = url.split('?')[0];
            return currentSrc.includes(baseUrl) || currentSrc === url;
        });

        const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 1;

        if (nextIndex < fallbackImages.length) {
            img.src = fallbackImages[nextIndex];
        }
    };

    // Get optimized image URL for a product
    const getImageUrl = (product) => {
        if (product.imageUrl && !imageErrors[product.id]) {
            return product.imageUrl;
        }
        return `https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop&auto=format&q=80`;
    };

    const handleAddToCart = (product) => {
        addToCart.mutate({ productId: product.id, quantity: 1 }, {
            onSuccess: () => {
                setAddedProducts(prev => ({ ...prev, [product.id]: true }));
                setTimeout(() => {
                    setAddedProducts(prev => ({ ...prev, [product.id]: false }));
                }, 3000);
            }
        });
    };

    // Loading state
    if (categoryLoading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando categoría...</span>
                </Spinner>
                <p className="mt-3 text-muted">Cargando categoría...</p>
            </Container>
        );
    }

    // Category not found
    if (categoryError?.response?.status === 404) {
        return (
            <Container className="my-5 text-center">
                <Alert variant="warning">
                    <div className="mb-3">
                        <FaTags size={64} className="text-muted" />
                    </div>
                    <Alert.Heading>Categoría no encontrada</Alert.Heading>
                    <p>La categoría que buscas no existe o ha sido eliminada.</p>
                    <div className="d-flex gap-2 justify-content-center mt-4">
                        <Button variant="primary" onClick={() => navigate('/')}>
                            <FaHome className="me-2" />
                            Ir al Inicio
                        </Button>
                        <Link to="/categorias" className="btn btn-outline-primary">
                            <FaTags className="me-2" />
                            Ver Categorías
                        </Link>
                    </div>
                </Alert>
            </Container>
        );
    }

    // Category error
    if (categoryError) {
        return (
            <Container className="my-5">
                <Alert variant="danger">
                    <Alert.Heading>Error cargando categoría</Alert.Heading>
                    <p>Hubo un problema al cargar la categoría. Por favor intenta de nuevo.</p>
                    <div className="d-flex justify-content-end">
                        <Button onClick={() => window.location.reload()} variant="outline-danger">
                            Reintentar
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    return (
        <div className="category-page">
            <Container className="py-4">
                {/* Breadcrumb Navigation */}
                <Breadcrumb className="mb-4">
                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
                        <FaHome className="me-1" />
                        Inicio
                    </Breadcrumb.Item>
                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/categorias" }}>
                        Categorías
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active>
                        {category?.name}
                    </Breadcrumb.Item>
                </Breadcrumb>

                {/* Category Header */}
                {category && (
                    <div className="category-header text-center mb-5">
                        <h1 className="display-4 fw-bold mb-3">
                            <FaTags className="me-3 text-primary" />
                            {category.name}
                        </h1>
                        {category.description && (
                            <p className="lead text-muted">
                                {category.description}
                            </p>
                        )}
                        <div className="mt-3">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => navigate(-1)}
                            >
                                <FaArrowLeft className="me-2" />
                                Volver
                            </Button>
                        </div>
                    </div>
                )}

                {/* Products Loading */}
                {productsLoading && (
                    <div className="text-center my-5">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Cargando productos...</span>
                        </Spinner>
                        <p className="mt-3 text-muted">Cargando productos...</p>
                    </div>
                )}

                {/* Products Error */}
                {productsError && (
                    <Alert variant="danger">
                        <Alert.Heading>Error cargando productos</Alert.Heading>
                        <p>Hubo un problema al cargar los productos de esta categoría.</p>
                    </Alert>
                )}

                {/* No Products */}
                {!productsLoading && !productsError && products.length === 0 && (
                    <div className="text-center my-5">
                        <Alert variant="info" className="border-0 bg-light">
                            <div className="mb-3">
                                <span style={{ fontSize: '3rem' }}>🎁</span>
                            </div>
                            <Alert.Heading>¡Productos muy pronto!</Alert.Heading>
                            <p className="mb-4">
                                Estamos preparando productos increíbles para la categoría {category?.name}.
                                Vuelve pronto para descubrir regalos extraordinarios.
                            </p>
                            <div className="d-flex gap-2 justify-content-center">
                                <Link to="/" className="btn btn-primary">
                                    Ir al Inicio
                                </Link>
                                <Link to="/categorias" className="btn btn-outline-primary">
                                    Ver Otras Categorías
                                </Link>
                            </div>
                        </Alert>
                    </div>
                )}

                {/* Products Grid */}
                {products.length > 0 && (
                    <>
                        <div className="products-count mb-4">
                            <p className="text-muted">
                                Mostrando {products.length} producto{products.length !== 1 ? 's' : ''}
                                en {category?.name}
                            </p>
                        </div>

                        <div className="row g-4">
                            {products.map((product) => (
                                <div key={product.id} className="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3">
                                    <Card className="product-card h-100 border-0 shadow-sm">
                                        <Link
                                            to={`/handpicked/productos/${product.id}`}
                                            className="product-link"
                                            data-testid={`product-${product.id}`}
                                        >
                                            <div className="position-relative overflow-hidden">
                                                <Card.Img
                                                    variant="top"
                                                    src={getImageUrl(product)}
                                                    alt={product.name}
                                                    className="product-image"
                                                    style={{
                                                        height: '250px',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.3s ease'
                                                    }}
                                                    onError={(e) => handleImageError(e, product)}
                                                    loading="lazy"
                                                />
                                                <div className="position-absolute top-0 end-0 p-2">
                                                    {product.featured && (
                                                        <span className="badge bg-warning text-dark">
                                                            ⭐ Destacado
                                                        </span>
                                                    )}
                                                </div>

                                                <div
                                                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                                                    style={{
                                                        background: 'rgba(0,0,0,0.7)',
                                                        opacity: 0,
                                                        transition: 'opacity 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.opacity = 1}
                                                    onMouseLeave={(e) => e.target.style.opacity = 0}
                                                >
                                                    <span className="text-white fw-bold">Ver Detalles</span>
                                                </div>
                                            </div>
                                        </Link>
                                        <Card.Body className="d-flex flex-column">
                                            <Card.Title className="product-title h5 mb-3">
                                                <Link
                                                    to={`/handpicked/productos/${product.id}`}
                                                    className="text-decoration-none text-dark"
                                                >
                                                    {product.name}
                                                </Link>
                                            </Card.Title>
                                            <Card.Text className="product-description text-muted flex-grow-1">
                                                {product.description || 'Producto único seleccionado especialmente para ti.'}
                                            </Card.Text>
                                            <div className="mt-auto">
                                                <Card.Text className="product-price h4 mb-3 text-primary fw-bold">
                                                    ${(product.price && typeof product.price === 'number') ? (product.price / 100).toFixed(2) : '0.00'}
                                                </Card.Text>
                                                <div className="d-flex gap-2">
                                                    <Link
                                                        to={`/handpicked/productos/${product.id}`}
                                                        className="btn btn-outline-dark flex-grow-1 view-details-btn"
                                                    >
                                                        Ver Detalles
                                                    </Link>
                                                    <Button
                                                        variant="primary"
                                                        className="add-to-cart"
                                                        onClick={() => handleAddToCart(product)}
                                                        disabled={addToCart.isLoading || addedProducts[product.id]}
                                                    >
                                                        {addedProducts[product.id] ? '✓' : '🛒'}
                                                    </Button>
                                                </div>
                                                {addedProducts[product.id] && (
                                                    <div className="text-success mt-2 text-center small">
                                                        ¡Agregado al carrito!
                                                    </div>
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </div>
                            ))}
                        </div>

                        {/* Footer Actions */}
                        <div className="text-center mt-5 pt-4 border-top">
                            <p className="text-muted mb-3">
                                ¿No encuentras lo que buscas en {category?.name}?
                            </p>
                            <div className="d-flex gap-3 justify-content-center flex-wrap">
                                <Link to="/categorias" className="btn btn-outline-primary">
                                    Ver Otras Categorías
                                </Link>
                                <Link to="/handpicked/productos" className="btn btn-outline-secondary">
                                    Ver Todos los Productos
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </Container>
        </div>
    );
};

export default CategoryPage; 