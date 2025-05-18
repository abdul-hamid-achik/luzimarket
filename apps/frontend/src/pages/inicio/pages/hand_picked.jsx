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
  const { data: product, isLoading, error } = useProduct(id);
  const addToCartMutation = useAddToCart();
  const [addedToCart, setAddedToCart] = useState(false);

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

  if (error) return (
    <div className="alert alert-danger m-5">
      Error loading product. Please try again later.
    </div>
  );

  if (!product) return (
    <div className="alert alert-warning m-5">
      Product not found.
    </div>
  );

  return (
    <div className="textoContet product-detail">
      {addedToCart && (
        <Alert variant="success" className="text-center">
          Producto añadido a la bolsa correctamente
        </Alert>
      )}

      {addToCartMutation.isError && (
        <Alert variant="danger" className="text-center">
          Error al añadir el producto a la bolsa
        </Alert>
      )}

      <div className="row">
        <div className="col-md-3 d-flex justify-content-center" id="cardDetails">
          <CollapseDetails product={product} />
        </div>
        <div className="col-md-5 d-flex justify-content-center" id="crdImg">
          <Card style={{ width: '90%', height: '30rem', border: '0px' }}>
            <Card.Img variant="top" src={product.imageUrl} />
          </Card>
        </div>
        <div className="col-md-4 d-flex justify-content-center" id="cardDetails">
          <Card style={{ width: '90%', height: '25rem', border: '1px solid #000' }}>
            <Card.Header className="TituloCard">{product.name}</Card.Header>
            <Card.Body>
              <Card.Text>{product.description}</Card.Text>
              <Card.Text>${product.price?.toFixed(2) || '0.00'}</Card.Text>
              <ButtonGroup aria-label="Basic example" id="butGroup">
                <Button
                  onClick={handleAddToCart}
                  className="buttonFechas1 btn-primary add-to-cart btn-agregar"
                  variant="dark"
                  disabled={addToCartMutation.isLoading}
                  data-testid="add-to-cart-button"
                >
                  {addToCartMutation.isLoading ? 'Agregando...' : 'Agregar a la bolsa'}
                </Button>
                <Button className="buttonFechas2" variant="default">
                  <img src={LogoLikeLuzimarket} className="LogoLikeLuzi" alt="Like" />
                </Button>
              </ButtonGroup>
            </Card.Body>
          </Card>
        </div>
      </div>

      <div className="accordion-section mt-4">
        <div className="accordion accordion-flush" id="productAccordion">
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne">
                Descripción
              </button>
            </h2>
            <div id="flush-collapseOne" className="accordion-collapse collapse show">
              <div className="accordion-body">
                {product.description}
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseTwo">
                Especificaciones
              </button>
            </h2>
            <div id="flush-collapseTwo" className="accordion-collapse collapse">
              <div className="accordion-body">
                Detalles del producto...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Handpicked;