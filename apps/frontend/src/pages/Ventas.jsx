import {
  FaRegCheckCircle,
  FaRegPauseCircle,
  FaRegTimesCircle,
} from "react-icons/fa";
import "@/css/admin_ventas.css";
import DateRangePicker from "@/components/date_picker";
import OrderStatus from "@/components/order_status";
import ChartVentas from "@/components/re_charts/recharts_ventas";
import { useState } from "react";

function Ventas() {
  const [FechaInicio, setFechaInicio] = useState(null);
  const [FechaFin, setFechaFin] = useState(null);

  const handleDateChange = (Inicio, Fin) => {
    setFechaInicio(Inicio);
    setFechaFin(Fin);
  };

  return (
    <div className="container Ventas">
      <div className="ContainerOrderStatus">
        <OrderStatus
          icon={<FaRegCheckCircle />}
          orderCount={57}
          title="new orders"
          status="Awaiting processing"
        />
        <OrderStatus
          icon={<FaRegPauseCircle />}
          orderCount={5}
          title="orders"
          status="On Hold"
        />
        <OrderStatus
          icon={<FaRegTimesCircle />}
          orderCount={15}
          title="products"
          status="Out of stock"
        />
      </div>
      <hr />
      <div className="container Ventas">
        <div className="TitulosVentas">
          <div>
            <h1>Total de ventas</h1>
            <span>Total de ventas en todas las sucursales.</span>
          </div>
          <div>
            <DateRangePicker onDateChange={handleDateChange} />
          </div>
        </div>
      </div>
      <div className="ContainerChartsVentas">
        <ChartVentas FechaInicio={FechaInicio} FechaFin={FechaFin} />
      </div>
    </div>
  );
}

export default Ventas;
