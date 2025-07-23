"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  CreditCard,
  Download,
  MoreHorizontal
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

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: string;
  status: string;
  createdAt: Date;
  orderId?: string;
  reference?: string;
}

interface Payout {
  id: string;
  amount: string;
  status: string;
  method: string;
  createdAt: Date;
  arrivalDate?: Date;
  reference?: string;
}

interface FinancialsDataTableProps {
  transactions: Transaction[];
  payouts: Payout[];
}

export function FinancialsDataTable({ transactions, payouts }: FinancialsDataTableProps) {
  const t = useTranslations("vendor.financials");
  const [activeTab, setActiveTab] = useState<"transactions" | "payouts">("transactions");

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(numAmount);
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "d MMM yyyy, HH:mm", { locale: es });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: t("status.completed"), variant: "default" as const },
      pending: { label: t("status.pending"), variant: "secondary" as const },
      failed: { label: t("status.failed"), variant: "destructive" as const },
      processing: { label: t("status.processing"), variant: "outline" as const },
      paid: { label: t("status.paid"), variant: "default" as const },
      in_transit: { label: t("status.inTransit"), variant: "secondary" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "outline" as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "refund":
        return <RefreshCw className="h-4 w-4 text-red-600" />;
      case "payout":
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const transactionColumns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("transactions.type")} />
      ),
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <div className="flex items-center gap-2">
            {getTransactionIcon(type)}
            <span className="capitalize">{type}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("transactions.description")} />
      ),
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        const orderId = row.original.orderId;
        return (
          <div>
            <p className="font-medium">{description}</p>
            {orderId && (
              <p className="text-sm text-muted-foreground">Orden: {orderId}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("transactions.amount")} />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const type = row.original.type;
        const isNegative = type === "refund";
        return (
          <div className={`font-bold ${isNegative ? "text-red-600" : "text-green-600"}`}>
            {isNegative ? "-" : "+"}{formatCurrency(amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("transactions.status")} />
      ),
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("transactions.date")} />
      ),
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(transaction.id)}
              >
                Copiar ID de transacción
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {transaction.orderId && (
                <DropdownMenuItem>Ver orden</DropdownMenuItem>
              )}
              <DropdownMenuItem>Ver detalles</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const payoutColumns: ColumnDef<Payout>[] = [
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("payouts.date")} />
      ),
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("payouts.amount")} />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        return (
          <div className="font-bold text-purple-600">
            {formatCurrency(amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "method",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("payouts.method")} />
      ),
      cell: ({ row }) => {
        const method = row.getValue("method") as string;
        return (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>{method || t("payouts.bankAccount")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("payouts.status")} />
      ),
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "arrivalDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("payouts.arrivalDate")} />
      ),
      cell: ({ row }) => {
        const date = row.getValue("arrivalDate") as Date | undefined;
        return date ? formatDate(date) : "-";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const payout = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(payout.id)}
              >
                Copiar ID de pago
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Ver detalles</DropdownMenuItem>
              <DropdownMenuItem>Descargar recibo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Tab buttons */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "transactions" ? "default" : "outline"}
          onClick={() => setActiveTab("transactions")}
        >
          {t("tabs.transactions")}
        </Button>
        <Button
          variant={activeTab === "payouts" ? "default" : "outline"}
          onClick={() => setActiveTab("payouts")}
        >
          {t("tabs.payouts")}
        </Button>
      </div>

      {/* Data tables */}
      {activeTab === "transactions" ? (
        <DataTable
          columns={transactionColumns}
          data={transactions}
          searchKey="description"
          searchPlaceholder={t("transactions.searchPlaceholder")}
          pageSize={10}
        />
      ) : (
        <DataTable
          columns={payoutColumns}
          data={payouts}
          searchKey="reference"
          searchPlaceholder={t("payouts.searchPlaceholder")}
          pageSize={10}
        />
      )}

      {/* Export button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {t("actions.export")} {activeTab === "transactions" ? t("tabs.transactions") : t("tabs.payouts")}
        </Button>
      </div>
    </div>
  );
}