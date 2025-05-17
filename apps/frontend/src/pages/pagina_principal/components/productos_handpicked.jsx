import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';
import { useProducts } from "@/api/hooks";
import '@/pages/pagina_principal/css/producto.css';

const ProductosHandpicked = ({ filters = {} }) => {
  const { data: products = [], isLoading, error } = useProducts(filters);

  if (isLoading) return (
    <div className="text-center p-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading products...</span>
      </div>
      <p className="mt-3">Cargando productos...</p>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger">
      Error al cargar los productos. Por favor, intente nuevamente.
    </div>
  );

  if (products.length === 0) return (
    <div className="alert alert-info">
      No se encontraron productos disponibles.
    </div>
  );

  return (
    <div className="products-container">
      <h3 className="mb-4">Productos</h3>
      <div className="row g-4">
        {products.map((product) => (
          <div key={product.id} className="col-12 col-sm-6 col-md-6 col-lg-4">
            <Card className="product-card h-100">
              <Link to={`/handpicked/productos/${product.id}`}>
                <Card.Img
                  variant="top"
                  src={product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}
                  alt={product.name}
                  className="product-image"
                />
              </Link>
              <Card.Body>
                <Card.Title>{product.name}</Card.Title>
                <Card.Text className="product-description">{product.description}</Card.Text>
                <Card.Text className="product-price">${product.price?.toFixed(2) || '0.00'}</Card.Text>
                <Link to={`/handpicked/productos/${product.id}`} className="btn btn-outline-dark mt-2">
                  Ver Detalles
                </Link>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductosHandpicked;