import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '@/css/graficos_prueba.css';
import { useVendorAnalytics } from '@/api/hooks';

// Custom tooltip component matching site theme
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p style={{ margin: 0, fontWeight: 'bold' }}>{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '4px 0', color: entry.color }}>
            {`${entry.dataKey}: ${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const VendorPerformanceChart = ({ dateRange = {}, limit = 10 }) => {
  const { data: analyticsData, isLoading, error } = useVendorAnalytics({
    ...dateRange,
    limit
  });

  if (isLoading) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">Vendor Performance Overview</h3>
        <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Loading vendor data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">Vendor Performance Overview</h3>
        <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Error loading data: {error.message}</p>
        </div>
      </div>
    );
  }

  const vendorData = analyticsData?.data?.vendorPerformance || [];

  return (
    <div className="chart-container">
      <h3 className="chart-title">Vendor Performance Overview</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={vendorData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e0e0e0"
            strokeWidth={0.5}
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            style={{
              fontFamily: 'UniLTStd-L',
              fontSize: '11px',
              fill: '#000'
            }}
            angle={-45}
            textAnchor="end"
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
          <Legend
            wrapperStyle={{
              fontFamily: 'UniLTStd-L',
              fontSize: '12px',
              color: '#000'
            }}
          />
          <Bar
            dataKey="revenue"
            fill="#000000"
            radius={[2, 2, 0, 0]}
            name="Revenue"
          />
          <Bar
            dataKey="orders"
            fill="#FF4236"
            radius={[2, 2, 0, 0]}
            name="Orders"
          />
          <Bar
            dataKey="products"
            fill="#666666"
            radius={[2, 2, 0, 0]}
            name="Products"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VendorPerformanceChart;
