import "./style.css";
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
  const { data: categories = [], isLoading, error } = useCategories();

  // Determine categories for display: use fetched data when available, otherwise fallback
  const displayCategories = (categories && categories.length > 0) ? categories : fallbackCategories;

  if (isLoading) {
    return <div className="text-center my-4">Loading categories...</div>;
  }

  if (error) {
    return <div className="text-center my-4 text-danger">Error loading categories: {error.message}</div>;
  }

  return (
    <div className="catSliderSection">
      <div className="container">
        <h3 className="mb-4">Nuestras Categorías</h3>
        <div className="cat_slider_Main">
          <div className="row">
            {displayCategories.map(cat => (
              <div key={cat.id} className="col-md-3 col-sm-6 mb-4">
                <CategoryItem
                  icon={<FaTags />}
                  title={cat.name}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatSlider;
