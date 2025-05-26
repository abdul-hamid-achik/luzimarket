import {
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  CartesianGrid,
} from "recharts";
import "@/css/graficos_prueba.css";

const data = [
  { name: "Jan", uv: 40, pv: 34 },
  { name: "Feb", uv: 10, pv: 30 },
  { name: "Mar", uv: 25, pv: 35 },
  { name: "Apr", uv: 30, pv: 21 },
  { name: "May", uv: 50, pv: 10 },
  { name: "Jun", uv: 35, pv: 28 },
  { name: "Jul", uv: 45, pv: 42 },
  { name: "Aug", uv: 38, pv: 31 },
  { name: "Sep", uv: 42, pv: 38 },
  { name: "Oct", uv: 55, pv: 45 },
  { name: "Nov", uv: 48, pv: 40 },
  { name: "Dec", uv: 52, pv: 48 },
];

// Custom tooltip component matching site theme
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p style={{ margin: 0, fontWeight: 'bold' }}>{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '4px 0', color: entry.color }}>
            {`${entry.dataKey === 'pv' ? 'Revenue' : 'Visits'}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnnualChart = () => {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Annual Performance</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
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
            dataKey="pv"
            stroke="#000000"
            strokeWidth={3}
            dot={{ fill: '#000000', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, fill: '#000000' }}
          />
          <Line
            type="monotone"
            dataKey="uv"
            stroke="#FF4236"
            strokeWidth={3}
            dot={{ fill: '#FF4236', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, fill: '#FF4236' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnnualChart;
