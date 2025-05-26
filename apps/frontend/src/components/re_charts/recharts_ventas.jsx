import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSalesAnalytics } from "@/api/hooks";
import "@/css/graficos_prueba.css";

// Custom tooltip component matching site theme
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p style={{ margin: 0, fontWeight: 'bold' }}>{`Date: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '4px 0', color: entry.color }}>
            {`Sales: $${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ChartVentas = ({ FechaInicio, FechaFin, period = 'daily' }) => {
  const { data: analyticsData, isLoading, error } = useSalesAnalytics({
    startDate: FechaInicio?.toISOString?.() || FechaInicio,
    endDate: FechaFin?.toISOString?.() || FechaFin,
    period
  });

  if (isLoading) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">Sales Performance</h3>
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">Sales Performance</h3>
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Error loading data: {error.message}</p>
        </div>
      </div>
    );
  }

  const salesData = analyticsData?.data?.trends || [];

  return (
    <div className="chart-container">
      <h3 className="chart-title">Sales Performance</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={salesData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e0e0e0"
            strokeWidth={0.5}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            style={{
              fontFamily: 'UniLTStd-L',
              fontSize: '11px',
              fill: '#000'
            }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            style={{
              fontFamily: 'UniLTStd-L',
              fontSize: '11px',
              fill: '#000'
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="totalRevenue"
            stroke="#000000"
            strokeWidth={3}
            dot={{ fill: '#000000', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: '#FF4236', stroke: '#000', strokeWidth: 2 }}
            name="Revenue"
          />
          <Line
            type="monotone"
            dataKey="orderCount"
            stroke="#FF4236"
            strokeWidth={2}
            dot={{ fill: '#FF4236', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#FF4236' }}
            name="Orders"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartVentas;
