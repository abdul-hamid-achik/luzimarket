import React, { useState, useMemo } from 'react';
import BreadCrumb from "@/components/breadcrumb";
import { BsCurrencyDollar, BsGraphUp, BsWallet, BsCreditCard, BsArrowUp, BsArrowDown } from "react-icons/bs";
import { useFinancialData } from '@/api/hooks';
import './dinero.css';

const Dinero = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    
    const items = [
        { name: "Dashboard", link: "/dashboard" },
        { name: "Dinero", link: "/dashboard/dinero" },
    ];

    // Use React Query hook for fetching financial data
    const { data, isLoading, error } = useFinancialData(selectedPeriod);

    // Calculate financial metrics using useMemo for performance
    const financialData = useMemo(() => {
        if (!data) {
            // Fallback data while loading or on error
            return {
                totalSales: 45250.00,
                commission: 2262.50,
                pendingPayments: 1850.00,
                completedTransactions: 127,
                monthlyGrowth: 12.5,
                previousPeriodSales: 40350.00
            };
        }
        return calculateFinancialMetrics(data.orders, data.sales);
    }, [data]);

    // Generate transactions using useMemo
    const recentTransactions = useMemo(() => {
        if (!data?.orders) {
            // Fallback transactions
            return [
                { id: 1, date: '2025-01-15', amount: 250.00, type: 'Venta', status: 'Completado', orderId: 'ORD-001' },
                { id: 2, date: '2025-01-14', amount: 180.50, type: 'Comisión', status: 'Pendiente', orderId: 'ORD-002' },
                { id: 3, date: '2025-01-13', amount: 320.00, type: 'Venta', status: 'Completado', orderId: 'ORD-003' },
                { id: 4, date: '2025-01-12', amount: 95.75, type: 'Comisión', status: 'Completado', orderId: 'ORD-004' },
                { id: 5, date: '2025-01-11', amount: 410.00, type: 'Venta', status: 'Completado', orderId: 'ORD-005' },
            ];
        }
        return generateTransactionsFromOrders(data.orders);
    }, [data]);

    const calculateFinancialMetrics = (orders, salesData) => {
        if (!orders || orders.length === 0) {
            return {
                totalSales: 0,
                commission: 0,
                pendingPayments: 0,
                completedTransactions: 0,
                monthlyGrowth: 0,
                previousPeriodSales: 0
            };
        }

        // Filter orders by period
        const now = new Date();
        const periodStart = getPeriodStart(now, selectedPeriod);
        const previousPeriodStart = getPeriodStart(periodStart, selectedPeriod);

        const currentPeriodOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt || order.Fecha);
            return orderDate >= periodStart && orderDate <= now;
        });

        const previousPeriodOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt || order.Fecha);
            return orderDate >= previousPeriodStart && orderDate < periodStart;
        });

        // Calculate metrics
        const totalSales = currentPeriodOrders.reduce((sum, order) => {
            const amount = parseFloat(order.total || order.Total || 0);
            return sum + amount;
        }, 0);

        const previousPeriodSales = previousPeriodOrders.reduce((sum, order) => {
            const amount = parseFloat(order.total || order.Total || 0);
            return sum + amount;
        }, 0);

        const completedTransactions = currentPeriodOrders.filter(order =>
            (order.status === 'completed' || order.EstadoOrden === 'completado' || order.EstadoOrden === 'entregado')
        ).length;

        const pendingPayments = currentPeriodOrders.reduce((sum, order) => {
            if (order.payment_status === 'pending' || order.EstadoPago === 'pendiente') {
                return sum + parseFloat(order.total || order.Total || 0);
            }
            return sum;
        }, 0);

        const commission = totalSales * 0.05; // 5% commission rate

        const monthlyGrowth = previousPeriodSales > 0
            ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100
            : 0;

        return {
            totalSales,
            commission,
            pendingPayments,
            completedTransactions,
            monthlyGrowth,
            previousPeriodSales
        };
    };

    const generateTransactionsFromOrders = (orders) => {
        if (!orders || orders.length === 0) return [];

        return orders
            .slice(0, 10) // Get latest 10 orders
            .map((order, index) => ({
                id: order.id || order.OrderID || index,
                date: formatDate(order.createdAt || order.Fecha),
                amount: parseFloat(order.total || order.Total || 0),
                type: 'Venta',
                status: mapOrderStatus(order.status || order.EstadoOrden),
                orderId: order.id || order.OrderID,
                customer: order.Cliente || 'Cliente'
            }));
    };

    const getPeriodStart = (date, period) => {
        const start = new Date(date);
        switch (period) {
            case 'week':
                start.setDate(start.getDate() - 7);
                break;
            case 'month':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'year':
                start.setFullYear(start.getFullYear() - 1);
                break;
            default:
                start.setMonth(start.getMonth() - 1);
        }
        return start;
    };

    const formatDate = (dateString) => {
        if (!dateString) return new Date().toISOString().split('T')[0];
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const mapOrderStatus = (status) => {
        const statusMap = {
            'completed': 'Completado',
            'completado': 'Completado',
            'entregado': 'Completado',
            'pending': 'Pendiente',
            'pendiente': 'Pendiente',
            'processing': 'Procesando',
            'procesando': 'Procesando',
            'failed': 'Fallido',
            'fallido': 'Fallido',
            'cancelled': 'Cancelado',
            'cancelado': 'Cancelado'
        };
        return statusMap[status?.toLowerCase()] || 'Pendiente';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatPercentage = (value) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando datos financieros...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dinero-dashboard">
                <div className="container-fluid p-4">
                    <BreadCrumb items={items} activeItem="Dinero" />
                    <div className="alert alert-warning mt-4">
                        <h5>⚠️ Error al cargar datos financieros</h5>
                        <p>Mostrando datos de ejemplo. Verifique la conexión con el backend.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dinero-dashboard">
            <div className="container-fluid p-4">
                <BreadCrumb items={items} activeItem="Dinero" />

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="mb-1">
                            <BsCurrencyDollar className="me-2" />
                            Panel Financiero
                        </h2>
                        <p className="text-muted mb-0">
                            Resumen de ventas, comisiones y transacciones
                        </p>
                    </div>
                    <div className="period-selector">
                        <button
                            type="button"
                            className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
                            onClick={() => setSelectedPeriod('week')}
                        >
                            Semana
                        </button>
                        <button
                            type="button"
                            className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                            onClick={() => setSelectedPeriod('month')}
                        >
                            Mes
                        </button>
                        <button
                            type="button"
                            className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
                            onClick={() => setSelectedPeriod('year')}
                        >
                            Año
                        </button>
                    </div>
                </div>

                {/* Financial Overview Cards */}
                <div className="row g-4 mb-4">
                    <div className="col-lg-3 col-md-6">
                        <div className="financial-card sales-card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="icon-circle bg-success">
                                        <BsCurrencyDollar size={24} />
                                    </div>
                                    <div className="ms-3 flex-grow-1">
                                        <h6 className="card-subtitle">Ventas Totales</h6>
                                        <h3 className="card-value text-success">
                                            {formatCurrency(financialData.totalSales)}
                                        </h3>
                                        <div className="d-flex align-items-center">
                                            {financialData.monthlyGrowth >= 0 ? (
                                                <BsArrowUp className="text-success me-1" size={14} />
                                            ) : (
                                                <BsArrowDown className="text-danger me-1" size={14} />
                                            )}
                                            <small className={financialData.monthlyGrowth >= 0 ? 'text-success' : 'text-danger'}>
                                                {formatPercentage(financialData.monthlyGrowth)} vs período anterior
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6">
                        <div className="financial-card commission-card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="icon-circle bg-primary">
                                        <BsWallet size={24} />
                                    </div>
                                    <div className="ms-3">
                                        <h6 className="card-subtitle">Comisiones</h6>
                                        <h3 className="card-value text-primary">
                                            {formatCurrency(financialData.commission)}
                                        </h3>
                                        <small className="text-muted">5% de ventas</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6">
                        <div className="financial-card pending-card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="icon-circle bg-warning">
                                        <BsCreditCard size={24} />
                                    </div>
                                    <div className="ms-3">
                                        <h6 className="card-subtitle">Pagos Pendientes</h6>
                                        <h3 className="card-value text-warning">
                                            {formatCurrency(financialData.pendingPayments)}
                                        </h3>
                                        <small className="text-muted">Por procesar</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6">
                        <div className="financial-card growth-card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="icon-circle bg-info">
                                        <BsGraphUp size={24} />
                                    </div>
                                    <div className="ms-3">
                                        <h6 className="card-subtitle">Transacciones</h6>
                                        <h3 className="card-value text-info">{financialData.completedTransactions}</h3>
                                        <small className="text-muted">Completadas</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="row mb-4">
                    <div className="col-md-12">
                        <div className="summary-card">
                            <div className="card-header">
                                <h5 className="mb-0 section-title">Resumen del Período</h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="summary-metric">
                                            <h6 className="metric-label">Promedio por Transacción</h6>
                                            <h4 className="metric-value text-success">
                                                {financialData.completedTransactions > 0
                                                    ? formatCurrency(financialData.totalSales / financialData.completedTransactions)
                                                    : formatCurrency(0)
                                                }
                                            </h4>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="summary-metric">
                                            <h6 className="metric-label">Período Anterior</h6>
                                            <h4 className="metric-value text-muted">
                                                {formatCurrency(financialData.previousPeriodSales)}
                                            </h4>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="summary-metric">
                                            <h6 className="metric-label">Diferencia</h6>
                                            <h4 className={`metric-value ${financialData.monthlyGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {formatCurrency(financialData.totalSales - financialData.previousPeriodSales)}
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="row">
                    <div className="col-md-12">
                        <div className="transactions-card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 section-title">Transacciones Recientes</h5>
                                <small className="text-muted">Últimas {recentTransactions.length} transacciones</small>
                            </div>
                            <div className="card-body">
                                {recentTransactions.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-muted">No hay transacciones en este período</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="modern-table">
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Orden</th>
                                                    <th>Cliente</th>
                                                    <th>Tipo</th>
                                                    <th>Monto</th>
                                                    <th>Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentTransactions.map(transaction => (
                                                    <tr key={transaction.id}>
                                                        <td className="date-cell">{transaction.date}</td>
                                                        <td>
                                                            <code className="text-primary">
                                                                {transaction.orderId}
                                                            </code>
                                                        </td>
                                                        <td>{transaction.customer}</td>
                                                        <td>
                                                            <span className={`modern-badge ${transaction.type === 'Venta' ? 'badge-success' : 'badge-primary'}`}>
                                                                {transaction.type}
                                                            </span>
                                                        </td>
                                                        <td className="amount-cell">
                                                            {formatCurrency(transaction.amount)}
                                                        </td>
                                                        <td>
                                                            <span className={`modern-badge ${transaction.status === 'Completado' ? 'badge-success' : 'badge-warning'}`}>
                                                                {transaction.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="row mt-4">
                    <div className="col-md-12 d-flex justify-content-end gap-2">
                        <button className="btn btn-outline-primary btn-modern">
                            Exportar Reporte
                        </button>
                        <button className="btn btn-success btn-modern">
                            Ver Análisis Detallado
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dinero; 