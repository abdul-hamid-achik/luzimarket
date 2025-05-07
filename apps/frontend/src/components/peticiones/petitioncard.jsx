import React from 'react';
import { Link } from 'react-router-dom';

const PetitionCard = ({ title, badgeCount, description, link }) => {
  return (
    <div className="card p-3 rounded-5 w-100">
      <div className="d-flex justify-content-between m-4">
        <h3 className="card-title">{title}</h3>
        {badgeCount != null && (
          <div className="ms-2">
            <span className="badge bg-danger rounded-pill text-white fs-6">
              {badgeCount}
            </span>
          </div>
        )}
      </div>

      <div className="card-text m-4">
        <p>{description}</p>
      </div>
      <Link to={link} className="btn btn-dark p-2 m-4">
        Entrar
      </Link>
    </div>
  );
};

export default PetitionCard;