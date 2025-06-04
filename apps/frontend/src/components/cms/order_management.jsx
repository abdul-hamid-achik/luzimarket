import React, { useState } from 'react';
import { useAdminOrders, useUpdateOrder } from '@/api/hooks';
import { Link } from 'react-router-dom';

const OrderManagement = () => {
    const [selectedOrders, setSelectedOrders] = useState(new Set());
    const [showBatchActions, setShowBatchActions] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        dateFrom: '',
        dateTo: '',
        search: ''
    });
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Queries
    const { data: orders = [], isLoading, refetch } = useAdminOrders(filters);

    // Mutations
    const updateOrderMutation = useUpdateOrder();

    // Filter orders based on current filters
    const filteredOrders = orders.filter(order => {
        if (filters.status && order.status !== filters.status) return false;
        if (filters.search && !order.id.toString().includes(filters.search) &&
            !order.customerName?.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.dateFrom && new Date(order.createdAt) < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && new Date(order.createdAt) > new Date(filters.dateTo)) return false;
        return true;
    });

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Handle status update
    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await updateOrderMutation.mutateAsync({
                orderId,
                status: newStatus
            });
            refetch();
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    // Handle batch selection
    const handleSelectOrder = (orderId) => {
        const newSelection = new Set(selectedOrders);
        if (newSelection.has(orderId)) {
            newSelection.delete(orderId);
        } else {
            newSelection.add(orderId);
        }
        setSelectedOrders(newSelection);
        setShowBatchActions(newSelection.size > 0);
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedOrders.size === filteredOrders.length) {
            setSelectedOrders(new Set());
            setShowBatchActions(false);
        } else {
            setSelectedOrders(new Set(filteredOrders.map(order => order.id)));
            setShowBatchActions(true);
        }
    };

    // Handle batch status update
    const handleBatchStatusUpdate = async (status) => {
        try {
            await Promise.all(
                Array.from(selectedOrders).map(orderId =>
                    updateOrderMutation.mutateAsync({ orderId, status })
                )
            );
            setSelectedOrders(new Set());
            setShowBatchActions(false);
            refetch();
        } catch (error) {
            console.error('Error batch updating orders:', error);
        }
    };

    // View order details
    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending': return 'bg-warning text-dark';
            case 'processing': return 'bg-info';
            case 'shipped': return 'bg-primary';
            case 'delivered': return 'bg-success';
            case 'cancelled': return 'bg-danger';
            case 'refunded': return 'bg-secondary';
            default: return 'bg-secondary';
        }
    };

    // Calculate summary stats
    const orderStats = {
        total: filteredOrders.length,
        pending: filteredOrders.filter(o => o.status === 'pending').length,
        processing: filteredOrders.filter(o => o.status === 'processing').length,
        shipped: filteredOrders.filter(o => o.status === 'shipped').length,
        delivered: filteredOrders.filter(o => o.status === 'delivered').length,
        revenue: filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="order-management">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Order Management</h2>
                    <p className="text-muted">Track and manage customer orders</p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Order Statistics */}
            <div className="row g-4 mb-4">
                <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body">
                            <h3 className="h4 text-primary">{orderStats.total}</h3>
                            <p className="mb-0 text-muted">Total Orders</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body">
                            <h3 className="h4 text-warning">{orderStats.pending}</h3>
                            <p className="mb-0 text-muted">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body">
                            <h3 className="h4 text-info">{orderStats.processing}</h3>
                            <p className="mb-0 text-muted">Processing</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body">
                            <h3 className="h4 text-primary">{orderStats.shipped}</h3>
                            <p className="mb-0 text-muted">Shipped</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body">
                            <h3 className="h4 text-success">{orderStats.delivered}</h3>
                            <p className="mb-0 text-muted">Delivered</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body">
                            <h3 className="h4 text-success">${(orderStats.revenue / 100).toFixed(2)}</h3>
                            <p className="mb-0 text-muted">Revenue</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label">Search</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Order ID or Customer name"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">From Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.dateFrom}
                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">To Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.dateTo}
                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            />
                        </div>
                        <div className="col-md-3 d-flex align-items-end">
                            <button
                                className="btn btn-outline-secondary me-2"
                                onClick={() => setFilters({ status: '', dateFrom: '', dateTo: '', search: '' })}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Batch Actions Bar */}
            {showBatchActions && (
                <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
                    <span>{selectedOrders.size} orders selected</span>
                    <div className="btn-group">
                        <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => handleBatchStatusUpdate('processing')}
                        >
                            Mark Processing
                        </button>
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleBatchStatusUpdate('shipped')}
                        >
                            Mark Shipped
                        </button>
                        <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleBatchStatusUpdate('delivered')}
                        >
                            Mark Delivered
                        </button>
                        <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleBatchStatusUpdate('cancelled')}
                        >
                            Cancel Orders
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                                setSelectedOrders(new Set());
                                setShowBatchActions(false);
                            }}
                        >
                            Cancel Selection
                        </button>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '50px' }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedOrders.has(order.id)}
                                                    onChange={() => handleSelectOrder(order.id)}
                                                />
                                            </td>
                                            <td>
                                                <strong>#{order.id}</strong>
                                            </td>
                                            <td>
                                                <div>
                                                    <h6 className="mb-1">{order.customerName || 'Guest'}</h6>
                                                    <small className="text-muted">{order.customerEmail}</small>
                                                </div>
                                            </td>
                                            <td>
                                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td>
                                                {order.items?.length || 0} items
                                            </td>
                                            <td>
                                                <strong>${((order.total || 0) / 100).toFixed(2)}</strong>
                                            </td>
                                            <td>
                                                <select
                                                    className={`form-select form-select-sm badge ${getStatusBadgeClass(order.status)}`}
                                                    value={order.status || 'pending'}
                                                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                    style={{ border: 'none' }}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                    <option value="refunded">Refunded</option>
                                                </select>
                                            </td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleViewOrder(order)}
                                                    >
                                                        View
                                                    </button>
                                                    {order.trackingNumber && (
                                                        <Link
                                                            to={`/track/${order.trackingNumber}`}
                                                            className="btn btn-sm btn-outline-info"
                                                            target="_blank"
                                                        >
                                                            Track
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4">
                                            <div className="text-muted">
                                                <span style={{ fontSize: '3rem', opacity: 0.3 }}>🛒</span>
                                                <h6 className="mt-2">No orders found</h6>
                                                <p>Orders will appear here when customers make purchases</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Order Details Modal */}
            {showOrderModal && selectedOrder && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Order #{selectedOrder.id}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowOrderModal(false);
                                        setSelectedOrder(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-4">
                                    {/* Order Info */}
                                    <div className="col-md-6">
                                        <h6 className="fw-bold">Order Information</h6>
                                        <table className="table table-sm">
                                            <tbody>
                                                <tr>
                                                    <td>Order ID:</td>
                                                    <td><strong>#{selectedOrder.id}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td>Date:</td>
                                                    <td>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td>Status:</td>
                                                    <td>
                                                        <span className={`badge ${getStatusBadgeClass(selectedOrder.status)}`}>
                                                            {selectedOrder.status || 'pending'}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Total:</td>
                                                    <td><strong>${((selectedOrder.total || 0) / 100).toFixed(2)}</strong></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="col-md-6">
                                        <h6 className="fw-bold">Customer Information</h6>
                                        <table className="table table-sm">
                                            <tbody>
                                                <tr>
                                                    <td>Name:</td>
                                                    <td>{selectedOrder.customerName || 'Guest'}</td>
                                                </tr>
                                                <tr>
                                                    <td>Email:</td>
                                                    <td>{selectedOrder.customerEmail || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td>Phone:</td>
                                                    <td>{selectedOrder.customerPhone || 'N/A'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Shipping Address */}
                                    {selectedOrder.shippingAddress && (
                                        <div className="col-12">
                                            <h6 className="fw-bold">Shipping Address</h6>
                                            <address className="text-muted">
                                                {selectedOrder.shippingAddress.street}<br />
                                                {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}<br />
                                                {selectedOrder.shippingAddress.country}
                                            </address>
                                        </div>
                                    )}

                                    {/* Order Items */}
                                    <div className="col-12">
                                        <h6 className="fw-bold">Order Items</h6>
                                        <div className="table-responsive">
                                            <table className="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th>Quantity</th>
                                                        <th>Price</th>
                                                        <th>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedOrder.items?.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    {item.imageUrl && (
                                                                        <img
                                                                            src={item.imageUrl}
                                                                            alt={item.name}
                                                                            className="rounded me-2"
                                                                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                                        />
                                                                    )}
                                                                    <span>{item.name}</span>
                                                                </div>
                                                            </td>
                                                            <td>{item.quantity}</td>
                                                            <td>${((item.price || 0) / 100).toFixed(2)}</td>
                                                            <td>${(((item.price || 0) * item.quantity) / 100).toFixed(2)}</td>
                                                        </tr>
                                                    )) || (
                                                            <tr>
                                                                <td colSpan="4" className="text-center text-muted">No items found</td>
                                                            </tr>
                                                        )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowOrderModal(false);
                                        setSelectedOrder(null);
                                    }}
                                >
                                    Close
                                </button>
                                {selectedOrder.trackingNumber && (
                                    <Link
                                        to={`/track/${selectedOrder.trackingNumber}`}
                                        className="btn btn-primary"
                                        target="_blank"
                                    >
                                        Track Order
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement; 