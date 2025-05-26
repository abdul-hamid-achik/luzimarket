import React, { useState } from 'react';
import BreadCrumb from "@/components/breadcrumb";
import { BsCurrencyDollar, BsGraphUp, BsWallet, BsCreditCard } from "react-icons/bs";
import './dinero.css';

const Dinero = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('month');

    const items = [
        { name: "Dinero", link: "/dashboard/dinero" },
    ];

    // Mock financial data
    const financialData = {
        totalSales: 45250.00,
        commission: 2262.50,
        pendingPayments: 1850.00,
        completedTransactions: 127,
        monthlyGrowth: 12.5
    };

    const recentTransactions = [
        { id: 1, date: '2025-01-15', amount: 250.00, type: 'Venta', status: 'Completado' },
        { id: 2, date: '2025-01-14', amount: 180.50, type: 'Comisión', status: 'Pendiente' },
        { id: 3, date: '2025-01-13', amount: 320.00, type: 'Venta', status: 'Completado' },
        { id: 4, date: '2025-01-12', amount: 95.75, type: 'Comisión', status: 'Completado' },
        { id: 5, date: '2025-01-11', amount: 410.00, type: 'Venta', status: 'Completado' },
    ];

    return (
        <div className="dinero-dashboard">
            <div className="container-fluid p-4">
                <BreadCrumb items={items} activeItem={"Dinero"} />

                {/* Financial Overview Cards */}
                <div className="row mt-4 g-4">
                    <div className="col-lg-3 col-md-6">
                        <div className="financial-card sales-card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="icon-circle bg-success">
                                        <BsCurrencyDollar size={24} />
                                    </div>
                                    <div className="ms-3">
                                        <h6 className="card-subtitle">Ventas Totales</h6>
                                        <h3 className="card-value text-success">${financialData.totalSales.toLocaleString()}</h3>
                                        <small className="text-muted">Este mes</small>
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
                                        <h3 className="card-value text-primary">${financialData.commission.toLocaleString()}</h3>
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
                                        <h3 className="card-value text-warning">${financialData.pendingPayments.toLocaleString()}</h3>
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
                                        <h6 className="card-subtitle">Crecimiento</h6>
                                        <h3 className="card-value text-info">+{financialData.monthlyGrowth}%</h3>
                                        <small className="text-muted">vs mes anterior</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="row mt-4">
                    <div className="col-md-12">
                        <div className="summary-card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 section-title">Resumen Financiero</h5>
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
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="summary-metric">
                                            <h6 className="metric-label">Transacciones Completadas</h6>
                                            <h4 className="metric-value text-success">{financialData.completedTransactions}</h4>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="summary-metric">
                                            <h6 className="metric-label">Promedio por Transacción</h6>
                                            <h4 className="metric-value text-info">${(financialData.totalSales / financialData.completedTransactions).toFixed(2)}</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="row mt-4">
                    <div className="col-md-12">
                        <div className="transactions-card">
                            <div className="card-header">
                                <h5 className="mb-0 section-title">Transacciones Recientes</h5>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="modern-table">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
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
                                                        <span className={`modern-badge ${transaction.type === 'Venta' ? 'badge-success' : 'badge-primary'}`}>
                                                            {transaction.type}
                                                        </span>
                                                    </td>
                                                    <td className="amount-cell">${transaction.amount.toFixed(2)}</td>
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
                        <button className="btn btn-primary btn-modern">
                            Solicitar Pago
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dinero; 