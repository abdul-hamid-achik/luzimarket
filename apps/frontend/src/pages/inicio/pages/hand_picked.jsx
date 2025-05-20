import { useParams } from 'react-router-dom';
import { useProduct, useAddToCart } from "@/api/hooks";
import CollapseDetails from "@/pages/inicio/components/collapse";
import LogoLikeLuzimarket from "@/pages/inicio/images/logo_like_luzimarket.png";
import "@/pages/inicio/css/handpicked.css";
import "@/pages/inicio/css/general.css";
import { Card, Button, ButtonGroup, Alert } from "react-bootstrap";
import { useState } from 'react';

const Handpicked = () => {
  const { id } = useParams();
  const { data: fetchedProduct, isLoading, error } = useProduct(id);
  const addToCartMutation = useAddToCart();
  const [addedToCart, setAddedToCart] = useState(false);

  // Define fallback product when API has no data
  const fallbackProduct = {
    id: Number(id),
    name: `Featured Product ${id}`,
    description: '',
    price: 0,
    imageUrl: undefined,
    category: undefined
  };
  const product = fetchedProduct || fallbackProduct;

  const handleAddToCart = () => {
    if (product) {
      addToCartMutation.mutate({ productId: product.id, quantity: 1 }, {
        onSuccess: () => {
          setAddedToCart(true);
          setTimeout(() => setAddedToCart(false), 3000);
        }
      });
    }
  };

  if (isLoading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading product...</span>
      </div>
    </div>
  );

  return (
    <div className="container product-detail-container">
      <div className="row my-4">
        <div className="col-md-6">
          <Card className="border-0">
            <Card.Img
              variant="top"
              src={product.imageUrl || "https://via.placeholder.com/500"}
              alt={product.name}
              className="product-image"
            />
            <Card.ImgOverlay className="d-flex align-items-start">
              <Card.Img
                src={LogoLikeLuzimarket}
                alt="Logo like"
                style={{ width: "11%" }}
                className="ms-2 mt-2"
              />
            </Card.ImgOverlay>
          </Card>
        </div>
        <div className="col-md-6">
          <h1 className="mb-4 product-title">{product.name}</h1>
          <h5 className="mb-4 text-muted product-category">
            {product.category || "Categoría"}
          </h5>
          <h3 className="mb-4 product-price">${product.price ? product.price.toFixed(2) : '0.00'}</h3>
          <div className="description mb-4">
            <h5>Descripción:</h5>
            <p className="product-description">{product.description}</p>
          </div>
          <div className="d-grid gap-2">
            <Button
              variant="outline-dark"
              size="lg"
              onClick={handleAddToCart}
              className="btn-primary add-to-cart"
            >
              Agregar a la bolsa
            </Button>
            {addedToCart && (
              <Alert variant="success" className="mt-2">
                ¡Producto agregado al carrito!
              </Alert>
            )}
          </div>
        </div>
      </div>
      <div className="row my-4 accordion-container">
        <div className="col-md-12">
          <CollapseDetails product={product} />
        </div>
      </div>
    </div>
  );
};

export default Handpicked;