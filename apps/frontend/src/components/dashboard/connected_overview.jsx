import { useOrderStatusAnalytics, useProductsAnalytics } from '@/api/hooks';
import Card from "@/components/cards/card";
import ChartOverview from "@/components/re_charts/chart_overview";
import { Spinner } from "react-bootstrap";

function ConnectedOverview() {
  const { data: orderData, isLoading: ordersLoading } = useOrderStatusAnalytics();
  const { data: productData, isLoading: productsLoading } = useProductsAnalytics();
  
  const isLoading = ordersLoading || productsLoading;

  if (isLoading) {
    return (
      <Card
        title="Overview"
        title2={<Spinner animation="border" size="sm" />}
        text="Loading..."
        ChartComponent={() => <div style={{ height: '100px' }} />}
      />
    );
  }

  // Combine order and product data for overview
  const totalOrders = orderData?.totalOrders || 0;
  const pendingOrders = orderData?.pendingOrders || 0;
  const completedOrders = orderData?.completedOrders || 0;
  const totalProducts = productData?.totalProducts || 0;
  const activeProducts = productData?.activeProducts || 0;

  // Calculate overview metrics
  const completionRate = totalOrders > 0 
    ? ((completedOrders / totalOrders) * 100).toFixed(1)
    : 0;

  // Prepare chart data
  const chartData = [
    { name: 'Orders', total: totalOrders, completed: completedOrders, pending: pendingOrders },
    { name: 'Products', total: totalProducts, active: activeProducts, inactive: totalProducts - activeProducts }
  ];

  return (
    <Card
      title="Overview"
      title2={`${totalOrders} Orders`}
      text={`${completionRate}% completion rate • ${activeProducts} active products`}
      ChartComponent={() => <ChartOverview data={chartData} />}
    />
  );
}

export default ConnectedOverview;