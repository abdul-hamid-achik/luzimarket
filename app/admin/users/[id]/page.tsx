"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    User,
    Mail,
    Calendar,
    ShoppingCart,
    ArrowLeft,
    MapPin,
    Phone,
    Clock,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type UserDetailData = {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date | null;
    orderCount: number;
    totalSpent: number;
    userType: string;
    lastLoginAt?: Date | null;
    phone?: string | null;
    address?: string | null;
};

type ActivityItem = {
    id: string;
    action: string;
    description: string;
    timestamp: Date;
    ipAddress?: string;
};

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [user, setUser] = useState<UserDetailData | null>(null);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [activeTab, setActiveTab] = useState<string>("info");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetchUserData();
            fetchUserActivities();
        }
    }, [userId]);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`);
            if (!response.ok) {
                throw new Error('User not found');
            }
            const data = await response.json();
            setUser(data);
        } catch (error) {
            console.error('Error fetching user:', error);
            setError('Error loading user data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserActivities = async () => {
        try {
            const response = await fetch(`/api/admin/users/${userId}/activities`);
            if (response.ok) {
                const data = await response.json();
                setActivities(data);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver a usuarios
                        </Button>
                    </Link>
                </div>
                <div className="text-center py-8">
                    <p className="text-red-600 font-univers">{error || 'Usuario no encontrado'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver a usuarios
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-univers text-gray-900">
                            {user.name || 'Usuario sin nombre'}
                        </h1>
                        <p className="text-sm text-gray-600 font-univers mt-1">
                            {user.email}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-univers ${user.userType === 'admin' ? 'bg-red-100 text-red-800' :
                            user.userType === 'vendor' ? 'bg-purple-100 text-purple-800' :
                                'bg-blue-100 text-blue-800'
                        }`}>
                        {user.userType === 'admin' ? 'Admin' :
                            user.userType === 'vendor' ? 'Vendedor' :
                                'Cliente'}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <button
                            role="tab"
                            onClick={() => setActiveTab("info")}
                            className={`py-4 px-1 text-sm font-univers border-b-2 transition-colors ${activeTab === "info"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Información
                        </button>
                        <button
                            role="tab"
                            onClick={() => setActiveTab("activity")}
                            className={`py-4 px-1 text-sm font-univers border-b-2 transition-colors ${activeTab === "activity"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Actividad
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === "info" && (
                        <div className="space-y-6">
                            {/* User stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <ShoppingCart className="h-5 w-5 text-blue-500" />
                                        <div>
                                            <p className="text-sm font-univers text-gray-600">Órdenes totales</p>
                                            <p className="text-2xl font-univers font-semibold text-gray-900">{user.orderCount}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-green-500" />
                                        <div>
                                            <p className="text-sm font-univers text-gray-600">Total gastado</p>
                                            <p className="text-2xl font-univers font-semibold text-gray-900">
                                                ${Number(user.totalSpent).toLocaleString('es-MX')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-purple-500" />
                                        <div>
                                            <p className="text-sm font-univers text-gray-600">Último acceso</p>
                                            <p className="text-sm font-univers font-semibold text-gray-900">
                                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('es-MX') : 'Nunca'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-univers text-gray-900 mb-4">Detalles del usuario</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <User className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-univers text-gray-600">Nombre</p>
                                                <p className="text-sm font-univers text-gray-900">{user.name || 'Sin nombre'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-univers text-gray-600">Email</p>
                                                <p className="text-sm font-univers text-gray-900">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-univers text-gray-600">Teléfono</p>
                                                <p className="text-sm font-univers text-gray-900">{user.phone || 'No disponible'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-univers text-gray-600">Dirección</p>
                                                <p className="text-sm font-univers text-gray-900">{user.address || 'No disponible'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-univers text-gray-900 mb-4">Información de cuenta</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-univers text-gray-600">Fecha de registro</p>
                                                <p className="text-sm font-univers text-gray-900">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-MX') : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "activity" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-univers text-gray-900">Actividad reciente</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-univers">
                                    <Activity className="h-4 w-4" />
                                    <span>Historial de actividad</span>
                                </div>
                            </div>

                            {activities.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 font-univers">No hay actividad registrada</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activities.map((activity) => (
                                        <div key={activity.id} className="activity-item flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-univers font-medium text-gray-900">
                                                        {activity.action}
                                                    </p>
                                                    <time className="text-xs text-gray-500 font-univers timestamp">
                                                        {new Date(activity.timestamp).toLocaleString('es-MX')}
                                                    </time>
                                                </div>
                                                <p className="text-sm text-gray-600 font-univers mt-1">
                                                    {activity.description}
                                                </p>
                                                {activity.ipAddress && (
                                                    <p className="text-xs text-gray-500 font-univers mt-1">
                                                        IP: {activity.ipAddress}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 