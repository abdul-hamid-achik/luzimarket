import React from 'react';
import { Card, ListGroup, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useFavoritesAnalytics } from '@/api/hooks';

const FavoritesAnalytics = ({ limit = 5 }) => {
    const { data, isLoading, error } = useFavoritesAnalytics(limit);

    if (isLoading) {
        return (
            <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">❤️ Productos Más Favoritos</h6>
                </Card.Header>
                <Card.Body className="d-flex align-items-center justify-content-center">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Cargando favoritos...</span>
                </Card.Body>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">❤️ Productos Más Favoritos</h6>
                </Card.Header>
                <Card.Body>
                    <Alert variant="danger" className="mb-0">
                        <Alert.Heading as="h6">Error</Alert.Heading>
                        No se pudieron cargar los datos de favoritos.
                    </Alert>
                </Card.Body>
            </Card>
        );
    }

    const { totalFavorites, topFavorites } = data || { totalFavorites: 0, topFavorites: [] };

    return (
        <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">❤️ Productos Más Favoritos</h6>
                <Badge bg="secondary">{totalFavorites} total</Badge>
            </Card.Header>
            <Card.Body className="p-0">
                {topFavorites.length === 0 ? (
                    <div className="text-center py-4">
                        <div className="mb-2">💕</div>
                        <small className="text-muted">No hay favoritos aún</small>
                    </div>
                ) : (
                    <ListGroup variant="flush">
                        {topFavorites.map((favorite, index) => (
                            <ListGroup.Item
                                key={favorite.productId}
                                className="d-flex justify-content-between align-items-center py-3"
                            >
                                <div className="d-flex align-items-center">
                                    <div className="me-3">
                                        <Badge
                                            bg={index === 0 ? "warning" : index === 1 ? "secondary" : "light"}
                                            text={index === 2 ? "dark" : "white"}
                                            className="rounded-pill"
                                        >
                                            #{index + 1}
                                        </Badge>
                                    </div>
                                    <div className="me-3">
                                        <img
                                            src={favorite.imageUrl || `https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=60&h=60&fit=crop&auto=format&q=80`}
                                            alt={favorite.productName}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                objectFit: 'cover',
                                                borderRadius: '8px'
                                            }}
                                        />
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                                            {favorite.productName}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                            {favorite.categoryName || 'Sin categoría'}
                                        </div>
                                        {favorite.productPrice && (
                                            <div className="text-primary fw-bold" style={{ fontSize: '0.8rem' }}>
                                                ${(favorite.productPrice / 100).toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-end">
                                    <Badge bg="danger" className="mb-1">
                                        ❤️ {favorite.favoriteCount}
                                    </Badge>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
                {topFavorites.length > 0 && (
                    <div className="px-3 py-2 border-top">
                        <Link
                            to="/handpicked/productos"
                            className="btn btn-sm btn-outline-primary w-100"
                        >
                            Ver Todos los Productos
                        </Link>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default FavoritesAnalytics; 