import { Link } from "react-router-dom";
import { BsArrowRightShort } from "react-icons/bs";

const BreadCrumb = ({ items, activeItem }) => {
  return (
    <>
      <nav aria-label="breadcrumb" style={{ "--bs-breadcrumb-divider": "''" }}>
        <ol className="breadcrumb">
          {items.map((item, index) => (
            <li
              key={index}
              className={`breadcrumb-item ${
                item.name === activeItem ? "active" : ""
              }`}
            >
              <Link
                to={item.link}
                className={`text-decoration-none ${
                  item.name === activeItem ? "text-black" : "text-body-tertiary"
                }`}
              >
                <h2>
                  <i className="me-2">
                    <BsArrowRightShort />
                  </i>
                  {item.name}
                </h2>
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default BreadCrumb;
