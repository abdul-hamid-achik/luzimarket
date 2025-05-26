import React from 'react';
import { Container, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useFavoritesContext } from '@/context/favorites_context';
import { useAuth } from '@/context/auth_context';
import FavoriteButton from '@/components/ui/favorite_button';
import '@/pages/inicio/css/favoritos.css';

const Favoritos = () => {
  const { isAuthenticated } = useAuth();
  const {
    favoritesData,
    favoritesCount,
    isLoading,
    error,
    removeFromFavorites
  } = useFavoritesContext();

  // Not authenticated state (either from auth context or 401 API error)
  if (!isAuthenticated || (error && error?.response?.status === 401)) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h1 className="display-4 mb-4">
            <span className="me-3">❤️</span>
            Mis Favoritos
          </h1>
          <Alert variant="info" className="mx-auto" style={{ maxWidth: '500px' }}>
            <Alert.Heading>Inicia sesión para ver tus favoritos</Alert.Heading>
            <p>
              Guarda tus productos favoritos para encontrarlos fácilmente más tarde.
            </p>
            <hr />
            <div className="d-flex gap-2 justify-content-center">
              <Link to="/login" className="btn btn-primary">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn btn-outline-primary">
                Registrarse
              </Link>
            </div>
          </Alert>
        </div>
      </Container>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h1 className="display-4 mb-4">
            <span className="me-3">❤️</span>
            Mis Favoritos
          </h1>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando favoritos...</span>
          </Spinner>
          <p className="mt-3 text-muted">Cargando tus productos favoritos...</p>
        </div>
      </Container>
    );
  }

  // Error state (excluding 401 which is handled as not authenticated)
  if (error && error?.response?.status !== 401) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h1 className="display-4 mb-4">
            <span className="me-3">❤️</span>
            Mis Favoritos
          </h1>
          <Alert variant="danger">
            <Alert.Heading>Error cargando favoritos</Alert.Heading>
            <p>Hubo un problema al cargar tus productos favoritos.</p>
            <Button onClick={() => window.location.reload()} variant="outline-danger">
              Reintentar
            </Button>
          </Alert>
        </div>
      </Container>
    );
  }

  // Empty favorites state
  if (favoritesCount === 0) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h1 className="display-4 mb-4">
            <span className="me-3">❤️</span>
            Mis Favoritos
          </h1>
          <Alert variant="info" className="mx-auto" style={{ maxWidth: '500px' }}>
            <div className="mb-3">
              <span style={{ fontSize: '3rem' }}>💕</span>
            </div>
            <Alert.Heading>No tienes favoritos aún</Alert.Heading>
            <p>
              Explora nuestros productos y marca como favoritos los que más te gusten.
              Aparecerán aquí para que puedas encontrarlos fácilmente.
            </p>
            <hr />
            <div className="d-flex gap-2 justify-content-center">
              <Link to="/handpicked/productos" className="btn btn-primary">
                Explorar Productos
              </Link>
              <Link to="/categorias" className="btn btn-outline-primary">
                Ver Categorías
              </Link>
            </div>
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 mb-3">
          <span className="me-3">❤️</span>
          Mis Favoritos
        </h1>
        <p className="lead text-muted">
          Tienes <Badge bg="danger" className="mx-1">{favoritesCount}</Badge>
          producto{favoritesCount !== 1 ? 's' : ''} favorito{favoritesCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="row g-4">
        {favoritesData.map((favorite) => (
          <div key={favorite.id} className="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3">
            <Card className="favorite-card h-100 border-0 shadow-sm">
              <div className="position-relative">
                <Link to={`/handpicked/productos/${favorite.productId}`}>
                  <Card.Img
                    variant="top"
                    src={favorite.imageUrl || `https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&auto=format&q=80`}
                    alt={favorite.productName}
                    style={{
                      height: '200px',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    className="favorite-image"
                  />
                </Link>
                <div className="position-absolute top-0 end-0 p-2">
                  <FavoriteButton
                    productId={favorite.productId}
                    variantId={favorite.variantId}
                    size="medium"
                  />
                </div>
              </div>
              <Card.Body className="d-flex flex-column">
                <Card.Title className="h5 mb-2">
                  <Link
                    to={`/handpicked/productos/${favorite.productId}`}
                    className="text-decoration-none text-dark"
                  >
                    {favorite.productName}
                  </Link>
                </Card.Title>
                <Card.Text className="text-muted flex-grow-1">
                  {favorite.productDescription || 'Producto único seleccionado especialmente para ti.'}
                </Card.Text>
                <div className="mt-auto">
                  {favorite.productPrice && (
                    <Card.Text className="h5 mb-3 text-primary fw-bold">
                      ${(favorite.productPrice / 100).toFixed(2)}
                    </Card.Text>
                  )}
                  <div className="d-grid gap-2">
                    <Link
                      to={`/handpicked/productos/${favorite.productId}`}
                      className="btn btn-primary"
                    >
                      Ver Producto
                    </Link>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeFromFavorites(favorite.variantId)}
                    >
                      Quitar de Favoritos
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      <div className="text-center mt-5 pt-4 border-top">
        <p className="text-muted mb-3">
          ¿Buscas más productos increíbles?
        </p>
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <Link to="/handpicked/productos" className="btn btn-primary">
            Ver Todos los Productos
          </Link>
          <Link to="/categorias" className="btn btn-outline-primary">
            Explorar Categorías
          </Link>
        </div>
      </div>
    </Container>
  );
};

export default Favoritos;
