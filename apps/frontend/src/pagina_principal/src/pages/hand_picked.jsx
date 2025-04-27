import React from 'react';
import { useParams } from 'react-router-dom';
import { useProduct, useAddToCart } from "import../";
import Navbars from "import../";
import Footer from "import../";
import CollapseDetails from "import../";
import LogoLikeLuzimarket from "import../";
import "../css/Handpicked.css";
import "../css/General.css";
import { Card, Button, ButtonGroup } from "react-bootstrap";

const Handpicked = () => {
  const { id } = useParams();
  const { data: product, isLoading, error } = useProduct(id);
  const addToCartMutation = useAddToCart();

  const handleAddToCart = () => {
    addToCartMutation.mutate({ productId: product.id, quantity: 1 });
  };

  if (isLoading) return <div>Loading product...</div>;
  if (error) return <div>Error loading product.</div>;

  return (
    <>
      <Navbars />
      <div className="textoContet">
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
                <Card.Text>${product.price.toFixed(2)}</Card.Text>
                <ButtonGroup aria-label="Basic example" id="butGroup">
                  <Button onClick={handleAddToCart} className="buttonFechas1" variant="dark">
                    Agregar a la bolsa
                  </Button>
                  <Button className="buttonFechas2" variant="default">
                    <img src={LogoLikeLuzimarket} className="LogoLikeLuzi" />
                  </Button>
                </ButtonGroup>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Handpicked;