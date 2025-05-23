import ImagenMuestra1 from "@/pages/inicio/images/imagen_muestra1.jpg";
import ImagenMuestra2 from "@/pages/inicio/images/imagen_muestra2.jpg";
import ImagenMuestra3 from "@/pages/inicio/images/imagen_muestra3.jpg";
import ImagenMuestra4 from "@/pages/inicio/images/imagen_muestra4.jpg";
import React from 'react';
import { useProducts } from '@/api/hooks';
import ImagenBanner1 from "@/pages/inicio/images/new_images_luzi/new_banner_luzi.png";
import ImagenBanner2 from "@/pages/inicio/images/new_images_luzi/new_banner_luzi2.png";
import ModalIndex from "@/pages/inicio/components/modal_index";
import BestSellersSection from "@/components/cards/best_sellers_section";

import "@/pages/inicio/css/card_index.css";
import "@/pages/inicio/css/general.css";

import Card from "react-bootstrap/Card";
import { Link } from "react-router-dom";

const BodyLuzi = () => {
  const { data, isLoading, error } = useProducts();
  const products = data?.products || [];

  return (
    <div className="cajaBody">
      {/* Banner LUZI MARKET */}
      <div className="cajaTitulo">
        <img className="ImagenBanner" src={ImagenBanner1} />
      </div>

      {/* Segundo banner */}
      <div className="cajaTitulo">
        <img className="ImagenBanner" src={ImagenBanner2} />
      </div>

      {/* Imagenes banner opciones */}
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

      {/* Best Sellers Section */}
      <BestSellersSection />

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
          <div className="text-center text-muted">
            <p>Products will be available soon</p>
            <Link to="/handpicked/productos" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-muted">
            <p>No products available</p>
            <Link to="/handpicked/productos" className="btn btn-primary">
              Check Back Soon
            </Link>
          </div>
        ) : (
          products.slice(0, 4).map((product) => (
            <Card style={{ width: '18rem' }} key={product.id}>
              <Link to={`handpicked/productos/${product.id}`}>
                <Card.Img variant="top" src={product.imageUrl || ImagenMuestra1} />
              </Link>
              <Card.Body>
                <Card.Title>{product.name}</Card.Title>
                <Card.Text>{product.description}</Card.Text>
                <Card.Text>${((product.price || 0) / 100).toFixed(2)}</Card.Text>
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
  );
};
export default BodyLuzi;
