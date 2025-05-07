import Slider from "react-slick";
import "./style.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useCategories } from '@/api/hooks';
import CategoryItem from './cat_item';
import { FaTags } from 'react-icons/fa'; // fallback icon

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

  // Fetch categories dynamically
  const { data: categories = [], isLoading, error } = useCategories();

  if (isLoading) {
    return <p>Loading categories...</p>;
  }
  if (error) {
    return <p className="text-danger">Error loading categories: {error.message}</p>;
  }

  return (
    <>
      <div className="catSliderSection">
        <div className="container-fluid">
          <Slider {...settings} className="cat_slider_Main" id="cat_slider_Main">
            {categories.map(cat => (
              <CategoryItem
                key={cat.id}
                icon={<FaTags />}
                title={cat.name}
              />
            ))}
          </Slider>
        </div>
      </div>
    </>
  );
};

export default CatSlider;
