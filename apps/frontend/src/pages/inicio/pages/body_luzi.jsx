import React from 'react';
import { useProducts } from '@/api/hooks';
import ModalIndex from "@/pages/inicio/components/modal_index";
import LuxuryHeroCarousel from "@/components/carousel/luxury_hero_carousel";
import LuxuryBestSellersCarousel from "@/components/carousel/luxury_best_sellers_carousel";

import "@/css/typography.css";
import "@/pages/inicio/css/card_index.css";
import "@/pages/inicio/css/general.css";

import Card from "react-bootstrap/Card";
import { Link } from "react-router-dom";

// Keep these for the category cards
import ImagenMuestra1 from "@/pages/inicio/images/imagen_muestra1.jpg";
import ImagenMuestra2 from "@/pages/inicio/images/imagen_muestra2.jpg";
import ImagenMuestra3 from "@/pages/inicio/images/imagen_muestra3.jpg";
import ImagenMuestra4 from "@/pages/inicio/images/imagen_muestra4.jpg";

const BodyLuzi = () => {
  const { data, isLoading, error } = useProducts();
  const products = data?.products || [];

  return (
    <div className="cajaBody">
      {/* Dynamic Hero Carousel */}
      <LuxuryHeroCarousel />

      {/* Best Sellers Carousel */}
      <LuxuryBestSellersCarousel />

      {/* Imagenes banner opciones - Categories */}
      <div className="category-grid">
        <Link to="/categorias/floral-arrangements" className="category-card text-decoration-none">
          <div className="category-image-wrapper">
            <img src={ImagenMuestra1} className="category-image" alt="Flowershop" />
            <div className="category-overlay">
              <div className="category-button">Flowershop</div>
            </div>
          </div>
        </Link>
        <Link to="/categorias/gourmet-treats" className="category-card text-decoration-none">
          <div className="category-image-wrapper">
            <img src={ImagenMuestra2} className="category-image" alt="Sweet" />
            <div className="category-overlay">
              <div className="category-button">Sweet</div>
            </div>
          </div>
        </Link>
        <Link to="/categorias/seasonal-specials" className="category-card text-decoration-none">
          <div className="category-image-wrapper">
            <img src={ImagenMuestra3} className="category-image" alt="Events + Dinners" />
            <div className="category-overlay">
              <div className="category-button">Events + Dinners</div>
            </div>
          </div>
        </Link>
        <Link to="/categorias/gift-baskets" className="category-card text-decoration-none">
          <div className="category-image-wrapper">
            <img src={ImagenMuestra4} className="category-image" alt="Giftshop" />
            <div className="category-overlay">
              <div className="category-button">Giftshop</div>
            </div>
          </div>
        </Link>
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
    </div>
  );
};
export default BodyLuzi;
