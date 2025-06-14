import { useSalesAnalytics } from '@/api/hooks';
import Card from "@/components/cards/card";
import CharAnnual from "@/components/re_charts/chart_annual";
import { Spinner } from "react-bootstrap";

function ConnectedAnnualTarget() {
  const { data: salesData, isLoading, error } = useSalesAnalytics({ period: 'year' });
  
  if (isLoading) {
    return (
      <Card
        title="Annual Target"
        title2={<Spinner animation="border" size="sm" />}
        text="Loading..."
        ChartComponent={() => <div style={{ height: '100px' }} />}
      />
    );
  }

  if (error) {
    return (
      <Card
        title="Annual Target"
        title2="--"
        text="Error loading data"
        ChartComponent={() => <div style={{ height: '100px' }} />}
      />
    );
  }

  // Calculate values from sales data
  const annualTarget = salesData?.yearlyTarget || 500000; // $5,000.00 default target
  const currentSales = salesData?.totalSales || 0;
  const todaySales = salesData?.todaySales || 0;
  const percentComplete = (currentSales / annualTarget) * 100;

  // Format currency values
  const formatCurrency = (cents) => {
    return `$${(cents / 100).toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })}`;
  };

  // Prepare chart data
  const chartData = salesData?.monthlyData || [];

  return (
    <Card
      title="Annual Target"
      title2={formatCurrency(annualTarget)}
      text={`You have made ${formatCurrency(todaySales)} today (${percentComplete.toFixed(1)}% of target)`}
      ChartComponent={() => <CharAnnual data={chartData} />}
    />
  );
}

export default ConnectedAnnualTarget;