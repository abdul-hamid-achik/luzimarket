"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Download,
  RefreshCw,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "@/i18n/navigation";

interface AdminFinancialsClientProps {
  platformStats: {
    totalRevenue: string;
    pendingFees: string;
    totalVendorBalances: {
      available: string;
      pending: string;
    };
  };
  vendorBalances: any[];
  platformFees: any[];
  payouts: any[];
}

export function AdminFinancialsClient({
  platformStats,
  vendorBalances,
  platformFees,
  payouts,
}: AdminFinancialsClientProps) {
  const t = useTranslations("Admin.financials");
  const tCommon = useTranslations("Common.dataTable");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(numAmount);
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: es });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  // Vendor balances columns
  const vendorBalanceColumns: ColumnDef<any>[] = [
    {
      id: "vendorName",
      accessorFn: (row) => row.vendor?.businessName || "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("vendors.Vendor")} />
      ),
      cell: ({ row }) => {
        const vendor = row.original.vendor as any;
        return vendor ? (
          <Link href={{ pathname: '/admin/vendors/[id]', params: { id: vendor.id } } as any} className="text-blue-600 hover:underline">
            {vendor?.businessName || "-"}
          </Link>
        ) : "-";
      },
    },
    {
      accessorKey: "balance.availableBalance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("vendors.available")} />
      ),
      cell: ({ row }) => {
        const balance = row.original.balance;
        return (
          <div className="font-bold text-green-600">
            {balance ? formatCurrency(balance.availableBalance) : formatCurrency(0)}
          </div>
        );
      },
    },
    {
      accessorKey: "balance.pendingBalance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("vendors.pending")} />
      ),
      cell: ({ row }) => {
        const balance = row.original.balance;
        return (
          <div className="text-yellow-600">
            {balance ? formatCurrency(balance.pendingBalance) : formatCurrency(0)}
          </div>
        );
      },
    },
    {
      accessorKey: "balance.lifetimeVolume",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("vendors.lifetime")} />
      ),
      cell: ({ row }) => {
        const balance = row.original.balance;
        return balance ? formatCurrency(balance.lifetimeVolume) : formatCurrency(0);
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const vendor = row.original.vendor;

        return vendor ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("actions.openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("actions.title")}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={{ pathname: '/admin/vendors/[id]', params: { id: vendor.id } } as any}>
                  {t("actions.viewVendor")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={{ pathname: '/admin/vendors/[id]/transactions', params: { id: vendor.id } } as any}>
                  {t("actions.viewTransactions")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                {t("actions.requestPayout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null;
      },
    },
  ];

  // Platform fees columns
  const platformFeeColumns: ColumnDef<any>[] = [
    {
      accessorKey: "fee.createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("fees.date")} />
      ),
      cell: ({ row }) => formatDate(row.original.fee.createdAt),
    },
    {
      accessorKey: "vendor.businessName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("fees.Vendor")} />
      ),
      cell: ({ row }) => {
        const vendor = row.original.vendor as any;
        return vendor ? (
          <Link href={{ pathname: '/admin/vendors/[id]', params: { id: vendor.id } } as any} className="text-blue-600 hover:underline">
            {vendor?.businessName || "-"}
          </Link>
        ) : "-";
      },
    },
    {
      accessorKey: "fee.orderId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("fees.order")} />
      ),
      cell: ({ row }) => {
        const orderId = row.original.fee.orderId as any;
        return (
          <Link href={{ pathname: '/admin/orders/[id]', params: { id: orderId } } as any} className="text-blue-600 hover:underline text-sm">
            {t("viewOrder")}
          </Link>
        );
      },
    },
    {
      accessorKey: "fee.orderAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("fees.orderAmount")} />
      ),
      cell: ({ row }) => formatCurrency(row.original.fee.orderAmount),
    },
    {
      accessorKey: "fee.feePercentage",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("fees.rate")} />
      ),
      cell: ({ row }) => `${row.original.fee.feePercentage}%`,
    },
    {
      accessorKey: "fee.feeAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("fees.platformFee")} />
      ),
      cell: ({ row }) => (
        <div className="font-bold text-purple-600">
          {formatCurrency(row.original.fee.feeAmount)}
        </div>
      ),
    },
    {
      accessorKey: "fee.status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("fees.status")} />
      ),
      cell: ({ row }) => {
        const status = row.original.fee.status;
        const statusConfig = {
          pending: { label: t("feeStatus.pending"), icon: Clock, color: "text-yellow-600" },
          collected: { label: t("feeStatus.collected"), icon: CheckCircle, color: "text-green-600" },
          transferred: { label: t("feeStatus.transferred"), icon: CheckCircle, color: "text-blue-600" },
          failed: { label: t("feeStatus.failed"), icon: AlertCircle, color: "text-red-600" },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || {
          label: status,
          icon: AlertCircle,
          color: "text-gray-600",
        };

        const Icon = config.icon;

        return (
          <div className={`flex items-center gap-1 ${config.color}`}>
            <Icon className="h-4 w-4" />
            <span className="text-sm">{config.label}</span>
          </div>
        );
      },
    },
  ];

  // Payouts columns
  const payoutColumns: ColumnDef<any>[] = [
    {
      accessorKey: "payout.createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("payouts.date")} />
      ),
      cell: ({ row }) => formatDate(row.original.payout.createdAt),
    },
    {
      accessorKey: "vendor.businessName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("payouts.Vendor")} />
      ),
      cell: ({ row }) => {
        const vendor = row.original.vendor as any;
        return vendor ? (
          <Link href={{ pathname: '/admin/vendors/[id]', params: { id: vendor.id } } as any} className="text-blue-600 hover:underline">
            {vendor?.businessName || "-"}
          </Link>
        ) : "-";
      },
    },
    {
      accessorKey: "payout.amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("payouts.amount")} />
      ),
      cell: ({ row }) => (
        <div className="font-bold">
          {formatCurrency(row.original.payout.amount)}
        </div>
      ),
    },
    {
      accessorKey: "payout.status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("payouts.status")} />
      ),
      cell: ({ row }) => {
        const status = row.original.payout.status;
        const statusMap = {
          pending: { label: t("payoutStatus.pending"), variant: "secondary" as const },
          processing: { label: t("payoutStatus.processing"), variant: "outline" as const },
          paid: { label: t("payoutStatus.paid"), variant: "default" as const },
          failed: { label: t("payoutStatus.failed"), variant: "destructive" as const },
        };

        const config = statusMap[status as keyof typeof statusMap] || {
          label: status,
          variant: "outline" as const,
        };

        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "payout.stripePayoutId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("payouts.reference")} />
      ),
      cell: ({ row }) => {
        const id = row.original.payout.stripePayoutId;
        return id ? (
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{id}</code>
        ) : "-";
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-univers">
              {t("stats.totalRevenue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-times-now text-purple-600">
              {formatCurrency(platformStats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground font-univers mt-1">
              {t("stats.totalRevenueDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-univers">
              {t("stats.pendingFees")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-times-now text-yellow-600">
              {formatCurrency(platformStats.pendingFees)}
            </div>
            <p className="text-xs text-muted-foreground font-univers mt-1">
              {t("stats.pendingFeesDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-univers">
              {t("stats.vendorBalances")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-times-now">
              {formatCurrency(platformStats.totalVendorBalances.available)}
            </div>
            <p className="text-xs text-muted-foreground font-univers mt-1">
              + {formatCurrency(platformStats.totalVendorBalances.pending)} {t("stats.pending")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-univers">
              {t("stats.activeVendors")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-times-now">
              {vendorBalances.filter(v => v.balance).length}
            </div>
            <p className="text-xs text-muted-foreground font-univers mt-1">
              {t("stats.activeVendorsDescription")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t("actions.exportReport")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t("actions.refresh")}
          </Button>
        </div>
      </div>

      {/* Data Tabs */}
      <Tabs defaultValue="balances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="balances">{t("tabs.vendorBalances")}</TabsTrigger>
          <TabsTrigger value="fees">{t("tabs.platformFees")}</TabsTrigger>
          <TabsTrigger value="payouts">{t("tabs.payouts")}</TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <Card>
            <CardHeader>
              <CardTitle>{t("vendors.title")}</CardTitle>
              <CardDescription>{t("vendors.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={vendorBalanceColumns}
                data={vendorBalances}
                searchKey="vendorName"
                searchPlaceholder={t("vendors.search")}
                translations={{
                  columns: tCommon("columns"),
                  noResults: tCommon("noResults"),
                  rowsSelected: tCommon("rowsSelected", { selected: "{selected}", total: "{total}" }),
                  previous: tCommon("previous"),
                  next: tCommon("next"),
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>{t("fees.title")}</CardTitle>
              <CardDescription>{t("fees.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={platformFeeColumns}
                data={platformFees}
                pageSize={20}
                translations={{
                  columns: tCommon("columns"),
                  noResults: tCommon("noResults"),
                  rowsSelected: tCommon("rowsSelected", { selected: "{selected}", total: "{total}" }),
                  previous: tCommon("previous"),
                  next: tCommon("next"),
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>{t("payouts.title")}</CardTitle>
              <CardDescription>{t("payouts.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={payoutColumns}
                data={payouts}
                pageSize={20}
                translations={{
                  columns: tCommon("columns"),
                  noResults: tCommon("noResults"),
                  rowsSelected: tCommon("rowsSelected", { selected: "{selected}", total: "{total}" }),
                  previous: tCommon("previous"),
                  next: tCommon("next"),
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}