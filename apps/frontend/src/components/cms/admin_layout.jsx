import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './admin_layout.css';

const AdminLayout = () => {
    const location = useLocation();

    const menuItems = [
        { path: '/admin/cms/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/admin/cms/products', label: 'Products', icon: '📦' },
        { path: '/admin/cms/vendors', label: 'Vendors', icon: '🏪' },
        { path: '/admin/cms/categories', label: 'Categories', icon: '🏷️' },
        { path: '/admin/cms/orders', label: 'Orders', icon: '🛒' },
        { path: '/admin/cms/users', label: 'Users', icon: '👥' },
        { path: '/admin/cms/photos', label: 'Media Library', icon: '🖼️' },
        { path: '/admin/cms/settings', label: 'Settings', icon: '⚙️' }
    ];

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <div className="admin-layout">
            {/* Header */}
            <header className="admin-header">
                <div className="container-fluid">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <h1 className="admin-title">
                                <span className="logo">🎯</span>
                                Luzi Market CMS
                            </h1>
                        </div>
                        <div className="col-md-6 text-end">
                            <div className="admin-user-info">
                                <span className="user-welcome">Welcome, Admin</span>
                                <Link to="/" className="btn btn-outline-light btn-sm ms-2">
                                    View Site
                                </Link>
                                <Link to="/admin/logout" className="btn btn-outline-danger btn-sm ms-2">
                                    Logout
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="admin-body">
                {/* Sidebar */}
                <aside className="admin-sidebar">
                    <nav className="admin-nav">
                        <ul className="nav-list">
                            {menuItems.map((item, index) => (
                                <li key={index} className="nav-item">
                                    <Link
                                        to={item.path}
                                        className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
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
                <main className="admin-main">
                    <div className="admin-content">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout; 