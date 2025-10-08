"use client";

import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Loader2 } from "lucide-react";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface AnalyticsData {
    currentStats: {
        totalRevenue: number;
        totalOrders: number;
        totalItems: number;
        uniqueCustomers: number;
    };
    revenueChange: number;
    ordersChange: number;
    averageOrderValue: number;
}

interface VendorAnalyticsChartsProps {
    vendorId: string;
}

export function VendorAnalyticsCharts({ vendorId }: VendorAnalyticsChartsProps) {
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChartData();
    }, [vendorId]);

    const fetchChartData = async () => {
        try {
            // Generate mock data for last 30 days
            // In a real implementation, you'd fetch this from an API
            const days = 30;
            const now = new Date();
            const labels: string[] = [];
            const revenueData: number[] = [];
            const ordersData: number[] = [];

            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }));

                // Generate realistic-looking data (in production, fetch from API)
                const baseRevenue = 1000 + Math.random() * 500;
                const baseOrders = 5 + Math.floor(Math.random() * 10);
                revenueData.push(baseRevenue);
                ordersData.push(baseOrders);
            }

            const data = {
                revenue: {
                    labels,
                    datasets: [
                        {
                            label: 'Revenue (MXN)',
                            data: revenueData,
                            borderColor: 'rgb(0, 0, 0)',
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            fill: true,
                            tension: 0.4,
                        },
                    ],
                },
                orders: {
                    labels,
                    datasets: [
                        {
                            label: 'Orders',
                            data: ordersData,
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.4,
                        },
                    ],
                },
            };

            setChartData(data);
        } catch (error) {
            console.error("Error fetching chart data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!chartData) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                <span>No data available</span>
            </div>
        );
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
    };

    return (
        <div className="space-y-6">
            {/* Revenue Chart */}
            <div className="h-64">
                <Line data={chartData.revenue} options={chartOptions} />
            </div>

            {/* Orders Chart */}
            <div className="h-64">
                <Line data={chartData.orders} options={chartOptions} />
            </div>
        </div>
    );
}
