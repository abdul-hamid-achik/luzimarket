import { Link } from "react-router-dom";
import { BsArrowRightShort } from "react-icons/bs";

const BreadCrumb = () => {
  return (
    <>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link To="Horarios" className="text-decoration-none text-black">
              <h2>
                <i className="me-2">
                  <BsArrowRightShort />
                </i>
                Horarios
              </h2>
            </Link>
          </li>
        </ol>
      </nav>
    </>
  );
};
export default BreadCrumb;
