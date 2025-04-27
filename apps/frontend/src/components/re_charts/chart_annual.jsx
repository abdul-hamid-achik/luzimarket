import {
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";

const data = [
  { name: "Page A", uv: 40, pv: 34 },
  { name: "Page B", uv: 10, pv: 30 },
  { name: "Page C", uv: 25, pv: 35 },
  { name: "Page D", uv: 30, pv: 21 },
  { name: "Page E", uv: 50, pv: 10 },
];

const AnnualChart = () => {
  return (
    <ResponsiveContainer width="100%" height={235}>
      <LineChart data={data}>
        <XAxis dataKey="name" hide={true} />
        <YAxis hide={true} />
        <Tooltip />
        <Line type="monotone" dataKey="pv" stroke="#0083cb" />
        <Line type="monotone" dataKey="uv" stroke="#54d335" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AnnualChart;
