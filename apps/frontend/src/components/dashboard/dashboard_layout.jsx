import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './dashboard_layout.css';

const DashboardLayout = () => {
    const location = useLocation();

    // Sidebar menu for employee/admin dashboard
    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: '📊', exact: true },
        { path: '/dashboard/alertas', label: 'Alerts', icon: '🔔' },
        { path: '/dashboard/productos', label: 'Products', icon: '📦' },
        { path: '/dashboard/categorias', label: 'Categories', icon: '🏷️' },
        { path: '/dashboard/orders', label: 'Orders', icon: '🛒' },
        { path: '/dashboard/envios', label: 'Shipments', icon: '🚚' },
        { path: '/dashboard/dinero', label: 'Finance', icon: '💵' },
        { path: '/dashboard/horarios', label: 'Schedules', icon: '📅' }
    ];

    const isActive = (path, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="dashboard-layout">
            {/* Header */}
            <header className="dashboard-header">
                <div className="container-fluid">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <h1 className="dashboard-title">
                                <span className="logo">🛒</span>
                                Luzi Market Dashboard
                            </h1>
                        </div>
                        <div className="col-md-6 text-end">
                            <div className="dashboard-user-info">
                                <span className="user-welcome">Welcome, Employee/Admin</span>
                                <Link to="/" className="btn-dashboard-white">
                                    View Site
                                </Link>
                                <Link to="/logout" className="btn-dashboard-black">
                                    Logout
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="dashboard-body">
                {/* Sidebar */}
                <aside className="dashboard-sidebar">
                    <nav className="dashboard-nav">
                        <ul className="nav-list">
                            {menuItems.map((item, index) => (
                                <li key={index} className="nav-item">
                                    <Link
                                        to={item.path}
                                        className={`nav-link ${isActive(item.path, item.exact) ? 'active' : ''}`}
                                    >
                                        <span className="nav-icon">{item.icon}</span>
                                        <span className="nav-label">{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="dashboard-main">
                    <div className="dashboard-content">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
