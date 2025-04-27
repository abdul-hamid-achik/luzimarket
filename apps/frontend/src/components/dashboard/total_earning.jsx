import React from "react";
import Card from "../../components/cards/card";
import TotalChar from "../../components/re_charts/chart_total_ear";

function TotalEarnings() {
  return (
    <Card
      title="Total Earnings"
      title2="$23,580"
      text="Last month you have made $2,980"
      ChartComponent={TotalChar}
    />
  );
}

export default TotalEarnings;
