import "../Peticiones.css";
import { GoArrowRight } from "react-icons/go";
import { Link } from "react-router-dom";
import React from "react";


function tablaAdmisiones() {
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
              <Link href="#" className="text-decoration-none text-dark">
                Afiliado
              </Link>
            </h2>
          </li>
        </ol>
      </nav>

      <div className="container p-5 ">
        <table className="table table-borderless ">
          <thead className="thead-light">
            <tr>
              <th className="text-body-tertiary">Nombre</th>
              <th className="text-body-tertiary">Marca</th>
              <th className="text-body-tertiary">Fecha de creación</th>
              <th className="text-body-tertiary">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="Juan Luis Guerra"
                  readOnly
                />
              </td>

              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="Pastelería La Estrella"
                  readOnly
                />
              </td>

              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="16 / 03 / 2023"
                  readOnly
                />
              </td>

              <td>
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="bordered">Open Menu</Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Static Actions">
                    <DropdownItem key="Aceptar" to="#">
                      Aceptar
                    </DropdownItem>
                    <DropdownItem key="Editar">
                      <Link to="/inicio/peticiones/Productos">Editar</Link>
                    </DropdownItem>
                    <DropdownItem key="Borrar">Borrar</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </td>
            </tr>

            <tr>
              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="Evelyn Rose"
                  readOnly
                />
              </td>

              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="ROWSE"
                  readOnly
                />
              </td>

              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="01 / 12 / 2022"
                  readOnly
                />
              </td>

              <td></td>
            </tr>

            <tr>
              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="Mariana García"
                  readOnly
                />
              </td>

              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="Phamilia"
                  readOnly
                />
              </td>

              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="25 / 02 / 2023"
                  readOnly
                />
              </td>

              <td></td>
            </tr>

            <tr>
              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="Alejandro Magno III"
                  readOnly
                />
              </td>

              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="Lyto®"
                  readOnly
                />
              </td>

              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="12 / 12 / 2022"
                  readOnly
                />
              </td>

              <td></td>
            </tr>

            <tr>
              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="Alejandro Magno III"
                  readOnly
                />
              </td>

              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="Lyto®"
                  readOnly
                />
              </td>

              <td>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 p-3"
                  value="12 / 12 / 2022"
                  readOnly
                />
              </td>

              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    /*<>
      <div>
        <img src={Flecha} className="flecha" />
        <h1 className="direccion__pagina">Peticiones</h1>
      </div>
      <div className='caja__direccion'>
         <img src={Flecha} className="flecha1" />
        <h1 className="direccion__pagina1">Admisiones</h1>
      </div>
      <table id="tablaPeticiones">
        <tr>
          <th>Nombre</th>
          <th>Marca</th>
          <th>Fecha de Creación</th>
          <th>Acciones</th>
        </tr>
        <tr>
          <td>Alfreds Futterkiste</td>
          <td>Maria Anders</td>
          <td>17 / 08 / 2000</td>
          <td>
            <Dropdown>
              <Dropdown.Button color="default">Entrar</Dropdown.Button>
              <Dropdown.Menu
                color="default"
                variant="solid"
                aria-label="Actions"
              >
                <Dropdown.Item key="new">Aceptar</Dropdown.Item>
                <Dropdown.Item key="copy">
                  <Link to="/inicio/peticiones/admisiones/editar" className="button_admision">
                    Editar
                  </Link>
                </Dropdown.Item>
                <Dropdown.Item key="edit">Borrar</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </td>
        </tr>
        <tr>
          <td>Berglunds snabbköp</td>
          <td>Christina Berglund</td>
          <td>01 / 10 / 2015</td>
          <td>
            <Dropdown>
              <Dropdown.Button color="default">Entrar</Dropdown.Button>
              <Dropdown.Menu
                color="default"
                variant="solid"
                aria-label="Actions"
              >
                <Dropdown.Item key="new">Aceptar</Dropdown.Item>
                <Dropdown.Item key="copy">
                  <Link to="/inicio/peticiones/admisiones/editar" className="button_admision">
                    Editar
                  </Link>
                </Dropdown.Item>
                <Dropdown.Item key="edit">Borrar</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </td>
        </tr>
        <tr>
          <td>Centro comercial Moctezuma</td>
          <td>Francisco Chang</td>
          <td>25 / 08 / 2020</td>
          <td>
            <Dropdown>
              <Dropdown.Button color="default">Entrar</Dropdown.Button>
              <Dropdown.Menu
                color="default"
                variant="solid"
                aria-label="Actions"
              >
                <Dropdown.Item auto key="new">Aceptar</Dropdown.Item>
                <Dropdown.Item auto key="copy">
                <Link to="/inicio/peticiones/admisiones/editar" className="button_admision">Editar</Link>
                </Dropdown.Item>
                <Dropdown.Item auto key="edit">Borrar</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </td>
        </tr>
      </table>

      <Button css={{
          background: "black",
          color: "White",
          border: "1px"
       }} className="botonPeticiones">
          <Link to="/inicio/peticiones" className="boton_link">Regresar</Link> 
        </Button>
    </>*/
  );
}

export default tablaAdmisiones;
