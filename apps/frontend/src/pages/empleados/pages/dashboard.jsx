import ConnectedAnnualTarget from "@/components/dashboard/connected_annual_target";
import ConnectedTotalEarnings from "@/components/dashboard/connected_total_earnings";
import ConnectedOverview from "@/components/dashboard/connected_overview";
import { useNotifications } from "@/api/hooks";
import { Alert, Badge } from "react-bootstrap";
import './dashboard.css';

const Dashboard = () => {
  const { data: notifications } = useNotifications({ category: 'all' });
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="Dashboard container p-4">
      {/* Notifications Alert */}
      {unreadCount > 0 && (
        <Alert variant="info" className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <span>
              You have <Badge bg="primary">{unreadCount}</Badge> unread notifications
            </span>
            <a href="/dashboard/alertas" className="btn btn-sm btn-outline-primary">
              View All
            </a>
          </div>
        </Alert>
      )}

      {/* Dashboard Cards */}
      <div className="row">
        <div className="col-md-4 mb-3">
          <ConnectedAnnualTarget />
        </div>
        <div className="col-md-4 mb-3">
          <ConnectedTotalEarnings />
        </div>
        <div className="col-md-4 mb-3">
          <ConnectedOverview />
        </div>
      </div>

      {/* Additional Dashboard Content */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-flex gap-3 flex-wrap">
                <a href="/dashboard/productos" className="btn btn-primary">
                  Manage Products
                </a>
                <a href="/dashboard/envios" className="btn btn-outline-primary">
                  View Shipments
                </a>
                <a href="/dashboard/dinero" className="btn btn-outline-primary">
                  Financial Report
                </a>
                <a href="/dashboard/horarios" className="btn btn-outline-primary">
                  Schedules
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
