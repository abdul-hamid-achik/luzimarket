import React from "react";
import Slider from "react-slick";
import "./style.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

/* ICONOS */
import {
  FaGlasses,
  FaTshirt,
  FaLaptop,
  FaCamera,
  FaBook,
} from "react-icons/fa";

const CatSlider = () => {
  var settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    fade: false,
    arrows: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
    autoplaySpeed: 2000,
    cssEase: "linear",
  };

  return (
    <>
      <div className="catSliderSection">
        <div className="container-fluid">
          <Slider
            {...settings}
            className="cat_slider_Main"
            id="cat_slider_Main"
          >
            {/* CATEGORIAS */}
            <div className="item">
              <div className="info">
                <span className="icon">
                  <FaGlasses />
                </span>
                <h5>Lentes</h5>
              </div>
            </div>
            <div className="item">
              <div className="info">
                <span className="icon">
                  <FaTshirt />
                </span>
                <h5>Ropa</h5>
              </div>
            </div>
            <div className="item">
              <div className="info">
                <span className="icon">
                  <FaLaptop />
                </span>
                <h5>Electrónica</h5>
              </div>
            </div>
            <div className="item">
              <div className="info">
                <span className="icon">
                  <FaCamera />
                </span>
                <h5>Fotografía</h5>
              </div>
            </div>
            <div className="item">
              <div className="info">
                <span className="icon">
                  <FaBook />
                </span>
                <h5>Libros</h5>
              </div>
            </div>

            <div className="item">
              <div className="info">
                <span className="icon">
                  <FaGlasses />
                </span>
                <h5>Lentes</h5>
              </div>
            </div>
            <div className="item">
              <div className="info">
                <span className="icon">
                  <FaTshirt />
                </span>
                <h5>Ropa</h5>
              </div>
            </div>
            <div className="item">
              <div className="info">
                <span className="icon">
                  <FaLaptop />
                </span>
                <h5>Electrónica</h5>
              </div>
            </div>
            <div className="item">
              <div className="info">
                <span className="icon">
                  <FaCamera />
                </span>
                <h5>Fotografía</h5>
              </div>
            </div>
            <div className="item">
              <div className="info">
                <span className="icon">
                  <FaBook />
                </span>
                <h5>Libros</h5>
              </div>
            </div>
          </Slider>
        </div>
      </div>
    </>
  );
};

export default CatSlider;
