import React from "react";
import Card from "../../components/cards/card";
import CharAnnual from "../../components/re_charts/chart_annual";

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
