import React, { useState } from 'react';
import BreadCrumb from "@/components/breadcrumb";
import { BsCurrencyDollar, BsGraphUp, BsWallet, BsCreditCard } from "react-icons/bs";

const Dinero = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('month');

    const items = [
        { name: "Dinero", link: "/InicioEmpleados/Dinero" },
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
        { id: 1, date: '2024-01-15', amount: 250.00, type: 'Venta', status: 'Completado' },
        { id: 2, date: '2024-01-14', amount: 180.50, type: 'Comisión', status: 'Pendiente' },
        { id: 3, date: '2024-01-13', amount: 320.00, type: 'Venta', status: 'Completado' },
        { id: 4, date: '2024-01-12', amount: 95.75, type: 'Comisión', status: 'Completado' },
        { id: 5, date: '2024-01-11', amount: 410.00, type: 'Venta', status: 'Completado' },
    ];

    return (
        <div className="container mt-5 p-5">
            <BreadCrumb items={items} activeItem={"Dinero"} />

            {/* Financial Overview Cards */}
            <div className="row mt-4">
                <div className="col-md-3 mb-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                            <BsCurrencyDollar className="text-success mb-2" size={32} />
                            <h5 className="card-title">Ventas Totales</h5>
                            <h3 className="text-success">${financialData.totalSales.toLocaleString()}</h3>
                            <small className="text-muted">Este mes</small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                            <BsWallet className="text-primary mb-2" size={32} />
                            <h5 className="card-title">Comisiones</h5>
                            <h3 className="text-primary">${financialData.commission.toLocaleString()}</h3>
                            <small className="text-muted">5% de ventas</small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                            <BsCreditCard className="text-warning mb-2" size={32} />
                            <h5 className="card-title">Pagos Pendientes</h5>
                            <h3 className="text-warning">${financialData.pendingPayments.toLocaleString()}</h3>
                            <small className="text-muted">Por procesar</small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                            <BsGraphUp className="text-info mb-2" size={32} />
                            <h5 className="card-title">Crecimiento</h5>
                            <h3 className="text-info">+{financialData.monthlyGrowth}%</h3>
                            <small className="text-muted">vs mes anterior</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Period Selector */}
            <div className="row mt-4">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Resumen Financiero</h5>
                            <div className="btn-group" role="group">
                                <button
                                    type="button"
                                    className={`btn btn-sm ${selectedPeriod === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setSelectedPeriod('week')}
                                >
                                    Semana
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${selectedPeriod === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setSelectedPeriod('month')}
                                >
                                    Mes
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${selectedPeriod === 'year' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setSelectedPeriod('year')}
                                >
                                    Año
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <h6>Transacciones Completadas</h6>
                                    <h4 className="text-success">{financialData.completedTransactions}</h4>
                                </div>
                                <div className="col-md-6">
                                    <h6>Promedio por Transacción</h6>
                                    <h4 className="text-info">${(financialData.totalSales / financialData.completedTransactions).toFixed(2)}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="row mt-4">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Transacciones Recientes</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
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
                                                <td>{transaction.date}</td>
                                                <td>
                                                    <span className={`badge ${transaction.type === 'Venta' ? 'bg-success' : 'bg-primary'}`}>
                                                        {transaction.type}
                                                    </span>
                                                </td>
                                                <td>${transaction.amount.toFixed(2)}</td>
                                                <td>
                                                    <span className={`badge ${transaction.status === 'Completado' ? 'bg-success' : 'bg-warning'}`}>
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
                    <button className="btn btn-outline-primary">
                        Exportar Reporte
                    </button>
                    <button className="btn btn-primary">
                        Solicitar Pago
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dinero; 