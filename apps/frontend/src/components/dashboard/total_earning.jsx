import React from "react";
import Card from "import../";
import TotalChar from "import../";

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
