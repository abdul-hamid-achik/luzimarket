import React from "react";
import Card from "../Cards/Card";
import CharAnnual from "../ReCharts/ChartAnnual";

function AnnualTarget() {
  return (
    <Card
      title="Annual Target"
      title2="$2,190"
      text="You have made $230 today"
      ChartComponent={CharAnnual}
    />
  );
}
export default AnnualTarget;
