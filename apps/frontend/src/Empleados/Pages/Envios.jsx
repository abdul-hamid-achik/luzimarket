import React, { useState } from "react";
import "../CSS/Ordenes.css";
import { DatosOrdenes } from "import../";

function Ordenes() {
  const [BuscaTermino, setBuscarTermino] = useState("");

  const handleCambioBusqueda = (event) => {
    setBuscarTermino(event.target.value);
  };

  const OrdenesFiltradas = DatosOrdenes.filter((orden) => {
    return (
      orden.Cliente.toLowerCase().includes(BuscaTermino.toLowerCase()) ||
      orden.OrderID.toString().includes(BuscaTermino) ||
      orden.EstadoPago.toLowerCase().includes(BuscaTermino.toLowerCase()) ||
      orden.EstadoOrden.toLowerCase().includes(BuscaTermino.toLowerCase()) ||
      orden.TipoEnvio.toLowerCase().includes(BuscaTermino.toLowerCase()) ||
      orden.Fecha.toLowerCase().includes(BuscaTermino.toLowerCase())
    );
  });

  return (
    <div className="container">
      <h1>Ordenes</h1>
      <div className="filter-bar">
        <ul className="filter-list">
          <li className="filter-item active">All (68817)</li>
          <li className="filter-item">Pendiente de pago (6)</li>
          <li className="filter-item">Completed (6,810)</li>
          <li className="filter-item">Refunded (8)</li>
          <li className="filter-item">Failed(2)</li>
        </ul>
        <div className="filter-options">
          <input
            type="text"
            placeholder="Search orders"
            className="search-input"
            value={BuscaTermino}
            onChange={handleCambioBusqueda}
          />

          <select name="" id="" className="dropdown">
            <option value="Estado-Pago">Estado del pago</option>
          </select>

          <select name="" id="" className="dropdown">
            <option value="fulfillment-status">Fulfillment status</option>
          </select>

          <button className="more-filters">More filters</button>
          <button className="export-button">Export</button>
          <button className="add-order-button">+ Add order</button>
        </div>
      </div>
      <table className="orders-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" />
            </th>
            <th>Orden</th>
            <th>Total</th>
            <th>Cliente</th>
            <th>Estado del Pago</th>
            <th>Estado de Orden</th>
            <th>Tipo de Entrega</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {OrdenesFiltradas.map((Orden) => (
            <tr key={Orden.OrderID}>
              <td>
                <input type="checkbox" />
              </td>
              <td>#{Orden.OrderID}</td>
              <td>${Orden.Total}</td>
              <td>{Orden.Cliente}</td>
              <td>
                <span
                  className={`status ${Orden.EstadoPago.toLowerCase().replace(
                    " ",
                    "-"
                  )}`}
                >
                  {Orden.EstadoPago.toUpperCase()}
                </span>
              </td>
              <td>
                <span
                  className={`status ${Orden.EstadoOrden.toLowerCase().replace(
                    " ",
                    "-"
                  )}`}
                >
                  {Orden.EstadoOrden.toUpperCase()}
                </span>
              </td>
              <td>{Orden.TipoEnvio}</td>
              <td>{Orden.Fecha}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Ordenes;
