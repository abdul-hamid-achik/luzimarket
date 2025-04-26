import React from "react";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  {
    name: "Week 1",
    Progress: 20,
    Due: 24,
    QA: 24,
  },
  {
    name: "Week 2",
    Progress: 30,
    Due: 13,
    QA: 22,
  },
  {
    name: "Week 3",
    Progress: 20,
    Due: 18,
    QA: 22,
  },
];

const OverviewChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart layout="vertical" data={data} barCategoryGap="35%">
        <XAxis type="number" hide={true} />
        <YAxis dataKey="name" type="category" width={80} />
        <Tooltip />
        <Legend wrapperStyle={{ lineHeight: "40px" }} />
        <Bar dataKey="Progress" fill="#ff4338" barSize={4} />
        <Bar dataKey="Due" fill="#54d335" barSize={4} />
        <Bar dataKey="QA" fill="#0083cb" barSize={4} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default OverviewChart;
