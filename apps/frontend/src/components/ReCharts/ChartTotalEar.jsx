import React from "react";
import {
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
} from "recharts";

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

const TotalChar = () => {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <LineChart data={data}>
        <XAxis dataKey="name" hide={true} />
        <YAxis hide={true} />
        <Tooltip />
        <Line type="monotone" dataKey="pv" stroke="#0083cb" />
        <Line type="monotone" dataKey="uv" stroke="#54d335" />
        <Line type="monotone" dataKey="amt" stroke="#ff5349" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TotalChar;
