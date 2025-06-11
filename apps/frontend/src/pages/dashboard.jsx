import React from 'react';
import ConnectedAnnualTarget from '@/components/dashboard/connected_annual_target';
import ConnectedTotalEarnings from '@/components/dashboard/connected_total_earnings';
import ConnectedOverview from '@/components/dashboard/connected_overview';
import { useAdminOrders, useNotifications } from '@/api/hooks';
import { Table, Badge, Alert } from 'react-bootstrap';

const Dashboard = () => {
  const { data: ordersData } = useAdminOrders({ limit: 5 });
  const { data: notifications } = useNotifications({ category: 'all' });
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="container py-4">
      <h1 className="mb-4">Dashboard</h1>
      
      {/* Notifications Alert */}
      {unreadCount > 0 && (
        <Alert variant="warning" className="mb-4">
          <strong>Attention!</strong> You have {unreadCount} unread notifications. 
          <a href="/alertas" className="ms-2">View all →</a>
        </Alert>
      )}

      {/* Analytics Cards */}
      <div className="row mb-4">
        <div className="col-lg-4 mb-3">
          <ConnectedAnnualTarget />
        </div>
        <div className="col-lg-4 mb-3">
          <ConnectedTotalEarnings />
        </div>
        <div className="col-lg-4 mb-3">
          <ConnectedOverview />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Orders</h5>
          <a href="/ventas" className="btn btn-sm btn-primary">View All</a>
        </div>
        <div className="card-body">
          {ordersData?.orders && ordersData.orders.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {ordersData.orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id.slice(0, 8)}...</td>
                    <td>{order.user?.name || 'Guest'}</td>
                    <td>${(order.total / 100).toFixed(2)}</td>
                    <td>
                      <Badge bg={
                        order.status === 'completed' ? 'success' :
                        order.status === 'pending' ? 'warning' :
                        order.status === 'cancelled' ? 'danger' : 'secondary'
                      }>
                        {order.status}
                      </Badge>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted text-center py-3">No recent orders</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
