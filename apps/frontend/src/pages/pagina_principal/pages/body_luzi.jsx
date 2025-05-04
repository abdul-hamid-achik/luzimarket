import ImagenMuestra1 from "@/pages/pagina_principal/images/imagen_muestra1.jpg";
import ImagenMuestra2 from "@/pages/pagina_principal/images/imagen_muestra2.jpg";
import ImagenMuestra3 from "@/pages/pagina_principal/images/imagen_muestra3.jpg";
import ImagenMuestra4 from "@/pages/pagina_principal/images/imagen_muestra4.jpg";
import React from 'react';
import { useProducts } from '@/api/hooks';
import ImagenBanner1 from "@/pages/pagina_principal/images/new_images_luzi/new_banner_luzi.png";
import ImagenBanner2 from "@/pages/pagina_principal/images/new_images_luzi/new_banner_luzi2.png";
import ModalIndex from "@/pages/pagina_principal/components/modal_index";

import "@/pages/pagina_principal/css/card_index.css";
import "@/pages/pagina_principal/css/general.css";
// import { Button } from "@nextui-org/react"

import Card from "react-bootstrap/Card";
import { Link } from "react-router-dom";

// Fallback product data in case API fails
const fallbackProducts = [
  {
    id: 1,
    name: "Producto 1",
    description: "HAY DESIGN",
    price: 2500,
    imageUrl: ImagenMuestra1
  },
  {
    id: 2,
    name: "Producto 2",
    description: "HAY DESIGN",
    price: 2500,
    imageUrl: ImagenMuestra2
  },
  {
    id: 3,
    name: "Producto 3",
    description: "HAY DESIGN",
    price: 2500,
    imageUrl: ImagenMuestra3
  },
  {
    id: 4,
    name: "Producto 4",
    description: "HAY DESIGN",
    price: 2500,
    imageUrl: ImagenMuestra4
  }
];

const BodyLuzi = () => {
  console.log('BodyLuzi component is rendering...');
  // Move hook call to top-level of component
  const { data: apiProducts = [], isLoading, error } = useProducts();

  // Use API products if available, otherwise use fallback products
  const products = apiProducts.length > 0 ? apiProducts : fallbackProducts;

  return (
    <>
      <div className="cajaBody">
        {/* Banners */}
        <div className="Banners">
          <div className="BannerPrincipal">
            <img src={ImagenBanner1} />
          </div>
          <div className="BannerSecundario">
            <img src={ImagenBanner2} className="ImagenTextoBanner" />
            <p>
              Experiencias y productos seleccionados a mano para momentos
              especiales
            </p>
            <button
              type="button"
              className="btn no-rounded"
              style={{
                backgroundColor: "black",
                padding: "10px",
                paddingLeft: "20px",
                paddingRight: "20px",
                color: "white",
                border: "0px",
                borderRadius: "0px",
              }}
            >
              Ver Handpicked
            </button>
          </div>
        </div>
        <div className="bannerOferta">
          <div className="botonBannerOferta">
            <h4>10% off en tu primer compra al suscribirte gratis</h4>
            <button className="botonBanner4">Suscribirse</button>
          </div>
        </div>

        {/* Cards */}

        <div className="cajaImagenesBanner">
          <div className="cardImage">
            <img src={ImagenMuestra1} className="image" />
            <button className="bottomBanner">Flowershop</button>
          </div>
          <div className="cardImage">
            <img src={ImagenMuestra2} className="image" />
            <button className="bottomBanner">Sweet</button>
          </div>
          <div className="cardImage">
            <img src={ImagenMuestra3} className="image" />
            <button className="bottomBanner">Events + Dinners</button>
          </div>
          <div className="cardImage">
            <img src={ImagenMuestra4} className="image" />
            <button className="bottomBanner">Giftshop</button>
          </div>
        </div>

        {/* Descripcion de la pagina */}

        <div className="cajaDescripcionPagina">
          <p>
            <span className="TituloLuzi">LUZI</span>
            <span className="Simbolo">®</span>
            <span className="TituloLuzi">MARKET </span>
            es una plataforma online que ofrece curaduría,
          </p>
          <p>
            venta y envio a domicilo de regalos excepcionales para momentos
            especiales,
          </p>
          <p>
            con un catálogo de marcas y tiendas seleccionadas en todo México.
          </p>
        </div>

        {/* Productos (Handpicked) */}
        <div className="titulosHandpicked">
          <div className="tituloLogo">
            <h5>Handpicked</h5>
          </div>
          <Link to="handpicked/productos" className="LinkButtonVerMasH">
            <button
              type="button"
              className="btn btn-dark"
            >
              Ver Todos
            </button>
          </Link>
        </div>
        <div className="cajaProductosMuestra">
          {isLoading ? (
            <div>Loading products...</div>
          ) : error ? (
            // Show fallback products if there's an error
            fallbackProducts.map((product) => (
              <Card style={{ width: '18rem' }} key={product.id}>
                <Link to={`handpicked/productos/${product.id}`}>
                  <Card.Img variant="top" src={product.imageUrl} />
                </Link>
                <Card.Body>
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Text>{product.description}</Card.Text>
                  <Card.Text>${product.price.toFixed(2)}</Card.Text>
                </Card.Body>
              </Card>
            ))
          ) : (
            products.slice(0, 4).map((product) => (
              <Card style={{ width: '18rem' }} key={product.id}>
                <Link to={`handpicked/productos/${product.id}`}>
                  <Card.Img variant="top" src={product.imageUrl || ImagenMuestra1} />
                </Link>
                <Card.Body>
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Text>{product.description}</Card.Text>
                  <Card.Text>${product.price.toFixed(2)}</Card.Text>
                </Card.Body>
              </Card>
            ))
          )}
        </div>
        <ModalIndex />
        <br />
        <br />
        <br />
        <br />
      </div>
    </>
  );
};
export default BodyLuzi;
