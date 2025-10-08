"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter, Download, Shield, AlertCircle, Info, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AuditLog {
    id: string;
    action: string;
    category: string;
    severity: string;
    userId: string | null;
    userEmail: string | null;
    userType: string | null;
    ip: string;
    method: string | null;
    path: string | null;
    statusCode: string | null;
    resourceType: string | null;
    resourceId: string | null;
    details: any;
    errorMessage: string | null;
    createdAt: Date;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch("/api/admin/audit-logs");
            const data = await response.json();

            if (response.ok) {
                setLogs(data.logs || []);
            }
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = !searchQuery ||
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.ip.includes(searchQuery);

        const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
        const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;

        return matchesSearch && matchesCategory && matchesSeverity;
    });

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "info":
                return <Info className="h-4 w-4 text-blue-500" />;
            case "warning":
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case "error":
                return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case "critical":
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "info":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "warning":
                return "bg-yellow-50 text-yellow-700 border-yellow-200";
            case "error":
                return "bg-orange-50 text-orange-700 border-orange-200";
            case "critical":
                return "bg-red-50 text-red-700 border-red-200";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-6 w-6" />
                    <h1 className="text-2xl font-univers text-gray-900">Audit Logs</h1>
                </div>
                <p className="text-sm text-gray-600">
                    System-wide activity and security event tracking
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by action, email, or IP..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="auth">Authentication</SelectItem>
                                <SelectItem value="payment">Payment</SelectItem>
                                <SelectItem value="order">Order</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="security">Security</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={severityFilter} onValueChange={setSeverityFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severities</SelectItem>
                                <SelectItem value="info">Info</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Logs List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Activity Log</CardTitle>
                            <CardDescription>
                                Showing {filteredLogs.length} of {logs.length} events
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredLogs.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No audit logs found</p>
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            {/* Header */}
                                            <div className="flex items-center gap-3">
                                                {getSeverityIcon(log.severity)}
                                                <span className="font-medium">{log.action}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {log.category}
                                                </Badge>
                                                {log.userType && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {log.userType}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="text-sm text-gray-600 space-y-1">
                                                {log.userEmail && (
                                                    <div>
                                                        <span className="font-medium">User:</span> {log.userEmail}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-4">
                                                    <span>
                                                        <span className="font-medium">IP:</span> {log.ip}
                                                    </span>
                                                    {log.method && log.path && (
                                                        <span>
                                                            <span className="font-medium">Request:</span> {log.method} {log.path}
                                                        </span>
                                                    )}
                                                    {log.statusCode && (
                                                        <span>
                                                            <span className="font-medium">Status:</span> {log.statusCode}
                                                        </span>
                                                    )}
                                                </div>
                                                {log.resourceType && log.resourceId && (
                                                    <div>
                                                        <span className="font-medium">Resource:</span> {log.resourceType} ({log.resourceId.substring(0, 8)}...)
                                                    </div>
                                                )}
                                                {log.errorMessage && (
                                                    <div className="text-red-600">
                                                        <span className="font-medium">Error:</span> {log.errorMessage}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timestamp and Severity */}
                                        <div className="text-right space-y-2">
                                            <div className={`inline-flex items-center px-2 py-1 rounded-md border text-xs ${getSeverityColor(log.severity)}`}>
                                                {log.severity}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {format(new Date(log.createdAt), "PPp", { locale: es })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
