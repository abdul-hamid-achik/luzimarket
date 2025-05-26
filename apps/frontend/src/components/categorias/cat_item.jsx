import { Link } from 'react-router-dom';

const CategoryItem = ({ icon, title, slug, onClick }) => {
    const categorySlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (onClick) {
        return (
            <div className="item" onClick={onClick} style={{ cursor: 'pointer' }}>
                <div className="info">
                    <span className="icon">
                        {icon}
                    </span>
                    <h5 className="mt-2">{title}</h5>
                </div>
            </div>
        );
    }

    return (
        <Link to={`/categorias/${categorySlug}`} className="text-decoration-none text-dark">
            <div className="item">
                <div className="info">
                    <span className="icon">
                        {icon}
                    </span>
                    <h5 className="mt-2">{title}</h5>
                </div>
            </div>
        </Link>
    );
};

export default CategoryItem;