import { useSalesAnalytics } from '@/api/hooks';
import Card from "@/components/cards/card";
import TotalChar from "@/components/re_charts/chart_total_ear";
import { Spinner } from "react-bootstrap";

function ConnectedTotalEarnings() {
  const { data: salesData, isLoading, error } = useSalesAnalytics({ period: 'all' });
  
  if (isLoading) {
    return (
      <Card
        title="Total Earnings"
        title2={<Spinner animation="border" size="sm" />}
        text="Loading..."
        ChartComponent={() => <div style={{ height: '100px' }} />}
      />
    );
  }

  if (error) {
    return (
      <Card
        title="Total Earnings"
        title2="--"
        text="Error loading data"
        ChartComponent={() => <div style={{ height: '100px' }} />}
      />
    );
  }

  // Extract values from sales data
  const totalEarnings = salesData?.totalSales || 0;
  const lastMonthEarnings = salesData?.lastMonthSales || 0;
  const monthlyGrowth = salesData?.monthlyGrowth || 0;

  // Format currency values
  const formatCurrency = (cents) => {
    return `$${(cents / 100).toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })}`;
  };

  // Prepare chart data (last 12 months)
  const chartData = salesData?.monthlyData || [];

  // Growth indicator
  const growthText = monthlyGrowth >= 0 
    ? `Last month you made ${formatCurrency(lastMonthEarnings)} (+${monthlyGrowth}%)`
    : `Last month you made ${formatCurrency(lastMonthEarnings)} (${monthlyGrowth}%)`;

  return (
    <Card
      title="Total Earnings"
      title2={formatCurrency(totalEarnings)}
      text={growthText}
      ChartComponent={() => <TotalChar data={chartData} />}
    />
  );
}

export default ConnectedTotalEarnings;