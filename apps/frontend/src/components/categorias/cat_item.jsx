const CategoryItem = ({ icon, title }) => (
    <div className="item">
        <div className="info">
            <span className="icon">
                {icon}
            </span>
            <h5 className="mt-2">{title}</h5>
        </div>
    </div>
);

export default CategoryItem;