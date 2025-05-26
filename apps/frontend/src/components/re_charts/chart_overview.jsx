import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "@/css/graficos_prueba.css";
import { useOrderStatusAnalytics } from "@/api/hooks";
import React from "react";

// Custom tooltip component matching site theme
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p style={{ margin: 0, fontWeight: 'bold' }}>{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '4px 0', color: entry.color }}>
            {`${entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const OverviewChart = ({ dateRange = {}, period = 'weekly' }) => {
  const { data: analyticsData, isLoading, error } = useOrderStatusAnalytics({
    ...dateRange,
    period
  });

  if (isLoading) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">Weekly Progress Overview</h3>
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">Weekly Progress Overview</h3>
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Error loading data: {error.message}</p>
        </div>
      </div>
    );
  }

  const chartData = analyticsData?.data?.progressData || [];

  return (
    <div className="chart-container">
      <h3 className="chart-title">Order Status Progress Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          layout="vertical"
          data={chartData}
          barCategoryGap="35%"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis
            type="number"
            hide={true}
            axisLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={80}
            axisLine={false}
            tickLine={false}
            style={{
              fontFamily: 'UniLTStd-L',
              fontSize: '12px',
              fill: '#000'
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              lineHeight: "40px",
              fontFamily: 'UniLTStd-L',
              fontSize: '12px',
              color: '#000'
            }}
          />
          <Bar dataKey="pending" fill="#999999" barSize={4} name="Pending" />
          <Bar dataKey="processing" fill="#000000" barSize={4} name="Processing" />
          <Bar dataKey="shipped" fill="#FF4236" barSize={4} name="Shipped" />
          <Bar dataKey="delivered" fill="#666666" barSize={4} name="Delivered" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OverviewChart;
