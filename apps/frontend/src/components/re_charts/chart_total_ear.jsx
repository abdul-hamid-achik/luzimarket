import {
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  CartesianGrid,
} from "recharts";
import "@/css/graficos_prueba.css";

const data = [
  { name: "Page A", uv: 40, pv: 34, amt: 24 },
  { name: "Page B", uv: 10, pv: 30, amt: 50 },
  { name: "Page C", uv: 25, pv: 35, amt: 10 },
  { name: "Page D", uv: 30, pv: 21, amt: 20 },
  { name: "Page E", uv: 50, pv: 10, amt: 70 },
  { name: "Page F", uv: 40, pv: 34, amt: 24 },
  { name: "Page G", uv: 10, pv: 30, amt: 50 },
  { name: "Page H", uv: 25, pv: 35, amt: 10 },
  { name: "Page I", uv: 30, pv: 21, amt: 20 },
  { name: "Page J", uv: 50, pv: 10, amt: 70 },
];

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

const TotalChar = () => {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Total Earnings Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
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
            strokeWidth={2}
            dot={{ fill: '#000000', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#000000' }}
          />
          <Line
            type="monotone"
            dataKey="uv"
            stroke="#FF4236"
            strokeWidth={2}
            dot={{ fill: '#FF4236', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#FF4236' }}
          />
          <Line
            type="monotone"
            dataKey="amt"
            stroke="#666666"
            strokeWidth={2}
            dot={{ fill: '#666666', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#666666' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TotalChar;
