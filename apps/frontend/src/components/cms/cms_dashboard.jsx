import React from 'react';
import {
    useProducts,
    useAdminOrders,
    useVendors,
    useCategories,
    useSalesAnalytics,
    useOrderStatusAnalytics
} from '@/api/hooks';
import { Link } from 'react-router-dom';

const CMSDashboard = () => {
    // Fetch dashboard data
    const { data: products = { products: [], total: 0 } } = useProducts({ limit: 5 });
    const { data: orders = [] } = useAdminOrders();
    const { data: vendors = [] } = useVendors();
    const { data: categories = [] } = useCategories();
    const { data: salesData } = useSalesAnalytics({ period: 'week' });
    const { data: orderStatusData } = useOrderStatusAnalytics();

    // Calculate metrics
    const totalProducts = products.total || 0;
    const totalOrders = orders.length || 0;
    const totalVendors = vendors.length || 0;
    const totalCategories = categories.length || 0;

    const recentOrders = orders.slice(0, 5);
    const recentProducts = products.products.slice(0, 5);

    // Calculate revenue from recent orders
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    const dashboardStats = [
        {
            title: 'Total Products',
            value: totalProducts,
            icon: '📦',
            color: 'primary',
            link: '/admin/cms/products'
        },
        {
            title: 'Total Orders',
            value: totalOrders,
            icon: '🛒',
            color: 'success',
            link: '/admin/cms/orders'
        },
        {
            title: 'Total Revenue',
            value: `$${(totalRevenue / 100).toFixed(2)}`,
            icon: '💰',
            color: 'warning',
            link: '/admin/cms/orders'
        },
        {
            title: 'Active Vendors',
            value: totalVendors,
            icon: '🏪',
            color: 'info',
            link: '/admin/cms/vendors'
        }
    ];

    const quickActions = [
        {
            title: 'Add New Product',
            description: 'Create a new product listing',
            icon: '➕',
            link: '/admin/cms/products',
            color: 'primary'
        },
        {
            title: 'Manage Homepage',
            description: 'Update homepage slides and content',
            icon: '🎠',
            link: '/admin/cms/homepage',
            color: 'success'
        },
        {
            title: 'View Analytics',
            description: 'Check sales and performance metrics',
            icon: '📊',
            link: '/admin/cms/analytics',
            color: 'info'
        },
        {
            title: 'Manage Categories',
            description: 'Organize product categories',
            icon: '🏷️',
            link: '/admin/cms/categories',
            color: 'warning'
        }
    ];

    return (
        <div className="cms-dashboard">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h2 mb-1">Dashboard</h1>
                    <p className="text-muted">Welcome back! Here's what's happening with your store.</p>
                </div>
                <div>
                    <span className="badge bg-success">Live Site</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-5">
                {dashboardStats.map((stat, index) => (
                    <div key={index} className="col-xl-3 col-md-6">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className={`stats-icon bg-${stat.color} bg-opacity-10 text-${stat.color} rounded-circle p-3 me-3`}>
                                        <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h3 className="h4 mb-1">{stat.value}</h3>
                                        <p className="text-muted mb-0">{stat.title}</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <Link to={stat.link} className={`btn btn-outline-${stat.color} btn-sm`}>
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {/* Quick Actions */}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 pb-0">
                            <h5 className="card-title mb-0">Quick Actions</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {quickActions.map((action, index) => (
                                    <div key={index} className="col-12">
                                        <Link to={action.link} className="text-decoration-none">
                                            <div className={`p-3 border border-${action.color} border-opacity-25 rounded hover-lift`}>
                                                <div className="d-flex align-items-center">
                                                    <div className={`bg-${action.color} bg-opacity-10 text-${action.color} rounded p-2 me-3`}>
                                                        <span style={{ fontSize: '1.2rem' }}>{action.icon}</span>
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-1">{action.title}</h6>
                                                        <p className="text-muted mb-0 small">{action.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 pb-0">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">Recent Orders</h5>
                                <Link to="/admin/cms/orders" className="btn btn-sm btn-outline-primary">
                                    View All
                                </Link>
                            </div>
                        </div>
                        <div className="card-body">
                            {recentOrders.length > 0 ? (
                                <div className="list-group list-group-flush">
                                    {recentOrders.map((order, index) => (
                                        <div key={order.id || index} className="list-group-item px-0 py-3 border-0">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 className="mb-1">Order #{order.id || 'N/A'}</h6>
                                                    <p className="text-muted mb-1 small">
                                                        {order.customerName || 'Customer'} •
                                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}
                                                    </p>
                                                </div>
                                                <div className="text-end">
                                                    <span className="fw-bold">${((order.total || 0) / 100).toFixed(2)}</span>
                                                    <br />
                                                    <span className={`badge ${order.status === 'completed' ? 'bg-success' :
                                                            order.status === 'pending' ? 'bg-warning' :
                                                                order.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                                                        }`}>
                                                        {order.status || 'pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <span style={{ fontSize: '3rem', opacity: 0.3 }}>🛒</span>
                                    <h6 className="text-muted mt-2">No recent orders</h6>
                                    <p className="text-muted small">Orders will appear here when customers make purchases</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Products */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 pb-0">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">Recent Products</h5>
                                <Link to="/admin/cms/products" className="btn btn-sm btn-outline-primary">
                                    Manage All
                                </Link>
                            </div>
                        </div>
                        <div className="card-body">
                            {recentProducts.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Product</th>
                                                <th>Category</th>
                                                <th>Price</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentProducts.map((product, index) => (
                                                <tr key={product.id || index}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={product.imageUrl || 'https://via.placeholder.com/40'}
                                                                alt={product.name}
                                                                className="rounded me-2"
                                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                            />
                                                            <div>
                                                                <h6 className="mb-0">{product.name}</h6>
                                                                <small className="text-muted">{product.slug}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{product.categoryName || 'Uncategorized'}</td>
                                                    <td>${((product.price || 0) / 100).toFixed(2)}</td>
                                                    <td>
                                                        <span className={`badge ${product.status === 'active' ? 'bg-success' :
                                                                product.status === 'draft' ? 'bg-warning' :
                                                                    product.status === 'inactive' ? 'bg-secondary' : 'bg-danger'
                                                            }`}>
                                                            {product.status || 'draft'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <Link
                                                            to={`/admin/cms/products?edit=${product.id}`}
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            Edit
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <span style={{ fontSize: '3rem', opacity: 0.3 }}>📦</span>
                                    <h6 className="text-muted mt-2">No products yet</h6>
                                    <p className="text-muted small">Start by adding your first product</p>
                                    <Link to="/admin/cms/products" className="btn btn-primary">
                                        Add Product
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hover-lift {
                    transition: transform 0.2s ease;
                }
                .hover-lift:hover {
                    transform: translateY(-2px);
                }
                .stats-icon {
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </div>
    );
};

export default CMSDashboard; 