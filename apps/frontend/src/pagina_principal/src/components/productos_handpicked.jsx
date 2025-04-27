import React from 'react';
import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';
import { useProducts } from "../../../api/hooks";
import '../css/producto.css';

const ProductosHandpicked = () => {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error loading products.</div>;

  return (
    <div className="cajaTodosLosProductos">
      {products.map((product) => (
        <Card key={product.id} style={{ width: '18rem' }}>
          <Link to={`/handpicked/productos/${product.id}`}>
            <Card.Img variant="top" src={product.imageUrl} />
          </Link>
          <Card.Body>
            <Card.Title>{product.name}</Card.Title>
            <Card.Text>{product.description}</Card.Text>
            <Card.Text>${product.price.toFixed(2)}</Card.Text>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default ProductosHandpicked;