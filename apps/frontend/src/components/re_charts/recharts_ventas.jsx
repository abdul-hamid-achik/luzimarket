import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Ventas } from "../../data/data_ventas";

const ChartVentas = ({ FechaInicio, FechaFin }) => {
  // Filtrar los datos basados en las fechas seleccionadas
  const fechaFiltrada = Ventas.filter((Entrada) => {
    const FechaEntrada = new Date(Entrada.date);
    return (
      (!FechaInicio || FechaEntrada >= FechaInicio) &&
      (!FechaFin || FechaEntrada <= FechaFin)
    );
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={fechaFiltrada}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="May"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ChartVentas;
