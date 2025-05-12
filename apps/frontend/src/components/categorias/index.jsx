import "./style.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useCategories } from '@/api/hooks';
import CategoryItem from './cat_item';
import { FaTags } from 'react-icons/fa'; // fallback icon

// Static fallback categories for initial render
const fallbackCategories = [
  { id: 1, name: 'Flowershop' },
  { id: 2, name: 'Sweet' },
  { id: 3, name: 'Events + Dinners' },
  { id: 4, name: 'Giftshop' },
];

const CatSlider = () => {
  // Fetch categories dynamically
  const { data: categories = [] } = useCategories();

  // Determine categories for display: use fetched data when available, otherwise fallback
  const displayCategories = (categories && categories.length > 0) ? categories : fallbackCategories;

  return (
    <div className="catSliderSection">
      <div className="container-fluid">
        {/* Render category items directly without Slider for instant display */}
        {displayCategories.map(cat => (
          <CategoryItem
            key={cat.id}
            icon={<FaTags />}
            title={cat.name}
          />
        ))}
      </div>
    </div>
  );
};

export default CatSlider;
