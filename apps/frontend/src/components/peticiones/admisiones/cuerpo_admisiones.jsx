import "@/components/peticiones/peticiones.css";
import React from 'react';
import { useAdmissionPetitions } from '@/api/hooks';
import { GoArrowRight } from "react-icons/go";
import { Link } from "react-router-dom";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@nextui-org/react";

// Fix: Component name should start with uppercase, and useAdmissionPetitions should only be called in a component
function TablaAdmisiones() {
  const { data: admissions = [], isLoading } = useAdmissionPetitions();

  return (
    <div className="container mt-5 p-5 overflow-y-auto">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <h2>
              <i className="text-secondary fs-4 me-3 icon-link">
                <GoArrowRight />
              </i>
              <Link
                to="/inicio/peticiones"
                className="text-decoration-none text-body-tertiary"
              >
                Peticiones
              </Link>
            </h2>
          </li>
          <li className="breadcrumb-item" aria-current="page">
            <h2>
              <i className="text-secondary fs-4 me-3 icon-link">
                <GoArrowRight />
              </i>
              <span className="text-decoration-none text-dark">
                Afiliado
              </span>
            </h2>
          </li>
        </ol>
      </nav>

      <div className="container p-5 ">
        <table className="table table-borderless">
          <thead className="thead-light">
            <tr>
              <th className="text-body-tertiary">Nombre</th>
              <th className="text-body-tertiary">Marca</th>
              <th className="text-body-tertiary">Fecha de creación</th>
              <th className="text-body-tertiary">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(isLoading || admissions.length === 0) ? (
              <tr>
                <td colSpan={4} className="text-center text-secondary">
                  {isLoading ? 'Loading admission petitions...' : 'No hay peticiones de admisión.'}
                </td>
              </tr>
            ) : (
              admissions.map((admission, idx) => (
                <tr key={admission.id || idx}>
                  <td>
                    <input
                      type="text"
                      className="form-control bg-body-tertiary border-0 p-3"
                      value={admission.nombre || ""}
                      readOnly
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control bg-body-tertiary border-0 p-3"
                      value={admission.marca || ""}
                      readOnly
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control bg-body-tertiary border-0 p-3"
                      value={admission.fecha_creacion || ""}
                      readOnly
                    />
                  </td>
                  <td>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant="bordered">Acciones</Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Static Actions">
                        <DropdownItem key="Aceptar" to="#">
                          Aceptar
                        </DropdownItem>
                        <DropdownItem key="Editar">
                          <Link to={`/inicio/peticiones/productos/${admission.id || ""}`}>Editar</Link>
                        </DropdownItem>
                        <DropdownItem key="Borrar">Borrar</DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TablaAdmisiones;
