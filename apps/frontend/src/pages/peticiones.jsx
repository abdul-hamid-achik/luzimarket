import React from 'react';
import { usePetitions } from '@/api/hooks';
import PetitionCard from '@/components/peticiones/petitioncard';
import "bootstrap/dist/css/bootstrap.min.css";
import BreadCrumb from '@/components/breadcrumb';

const Peticiones = () => {
  const items = [{ name: "Peticiones", link: "/inicio/peticiones" }];
  const { data: petitions = [], isLoading, error } = usePetitions();

  return (
    <div className="mt-5 ms-5 w-100 p-5">
      <BreadCrumb items={items} activeItem={"Peticiones"} />
      <div className="container p-5">
        {isLoading && <div>Loading petitions...</div>}
        {error && <div>Error loading petitions.</div>}
        {!isLoading && !error && (
          <div className="row">
            {petitions.map((pet) => (
              <div className="col-md-4 mb-4" key={pet.id}>
                <PetitionCard
                  title={pet.title}
                  badgeCount={pet.badgeCount}
                  description={pet.description}
                  link={pet.link}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Peticiones;
