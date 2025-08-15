"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CreditCard, 
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  BarChart3,
  FileText,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FinancialsDataTable } from "./financials-data-table";
import { PayoutRequestDialog } from "@/components/vendor/payout-request-dialog";
import { FinancialReports } from "@/components/vendor/financial-reports";
import { exportToCSV, formatDate as formatDateExport } from "@/lib/utils/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FinancialsClientProps {
  vendor: any;
  balance: any;
  transactions: any;
  payouts: any;
  stripeAccount: any;
}

export function FinancialsClient({
  vendor,
  balance,
  transactions,
  payouts,
  stripeAccount,
}: FinancialsClientProps) {
  const t = useTranslations("Vendor.financials");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Reload the page to fetch fresh data
    window.location.reload();
  };

  const handleExportTransactions = () => {
    if (!transactions?.transactions?.length) return;
    
    const columns = [
      { key: 'createdAt', header: 'Fecha', formatter: formatDateExport },
      { key: 'description', header: 'Descripción' },
      { key: 'type', header: 'Tipo' },
      { key: 'amount', header: 'Monto', formatter: (value: string) => formatCurrency(value) },
      { key: 'status', header: 'Estado' },
      { key: 'orderId', header: 'ID de Orden' },
    ];
    
    const filename = `transacciones_${vendor.businessName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(transactions.transactions, columns, filename);
  };

  const handleExportPayouts = () => {
    if (!payouts?.payouts?.length) return;
    
    const columns = [
      { key: 'createdAt', header: 'Fecha', formatter: formatDateExport },
      { key: 'amount', header: 'Monto', formatter: (value: string) => formatCurrency(value) },
      { key: 'status', header: 'Estado' },
      { key: 'method', header: 'Método' },
      { key: 'arrivalDate', header: 'Fecha de llegada', formatter: formatDateExport },
      { key: 'reference', header: 'Referencia' },
    ];
    
    const filename = `pagos_${vendor.businessName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(payouts.payouts, columns, filename);
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(numAmount);
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
  };

  if (!stripeAccount) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <span className="font-medium">{t("noStripeAccount.title")}</span>
          <p className="mt-1">{t("noStripeAccount.description")}</p>
          <Button className="mt-3" onClick={() => window.location.href = "/vendor/stripe-onboarding"}>
            {t("noStripeAccount.action")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!stripeAccount.chargesEnabled || !stripeAccount.payoutsEnabled) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <span className="font-medium">{t("incompleteAccount.title")}</span>
          <p className="mt-1">{t("incompleteAccount.description")}</p>
          <Button className="mt-3" onClick={() => window.location.href = "/vendor/stripe-onboarding"}>
            {t("incompleteAccount.action")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">
          <DollarSign className="h-4 w-4 mr-2" />
          {t("tabs.overview")}
        </TabsTrigger>
        <TabsTrigger value="reports">
          <BarChart3 className="h-4 w-4 mr-2" />
          {t("tabs.reports")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-univers">
                {t("balance.available")}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-times-now">
                {balance ? formatCurrency(balance.availableBalance) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground font-univers mt-1">
                {t("balance.availableDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-univers">
                {t("balance.pending")}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-times-now">
                {balance ? formatCurrency(balance.pendingBalance) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground font-univers mt-1">
                {t("balance.pendingDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-univers">
                {t("balance.lifetime")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-times-now">
                {balance ? formatCurrency(balance.lifetimeVolume) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground font-univers mt-1">
                {t("balance.lifetimeDescription")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {balance && parseFloat(balance.availableBalance) >= 10 && (
              <PayoutRequestDialog
                vendorId={vendor.id}
                availableBalance={parseFloat(balance.availableBalance)}
                onSuccess={handleRefresh}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  {t("actions.export")}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportTransactions}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t("export.transactions")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPayouts}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t("export.payouts")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t("actions.refresh")}
            </Button>
          </div>
          {balance && balance.lastUpdated && (
            <p className="text-sm text-muted-foreground font-univers">
              {t("lastUpdated", { time: formatDate(balance.lastUpdated) })}
            </p>
          )}
        </div>

        {/* Transactions and Payouts DataTable */}
        <Card>
          <CardHeader>
            <CardTitle className="font-times-now">{t("transactions.title")}</CardTitle>
            <CardDescription className="font-univers">
              {t("transactions.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(!transactions || transactions.length === 0) && (!payouts || payouts.length === 0) ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground font-univers">
                  {t("transactions.empty")}
                </p>
              </div>
            ) : (
              <FinancialsDataTable 
                transactions={transactions || []} 
                payouts={payouts || []} 
              />
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-times-now">{t("accountInfo.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-univers text-muted-foreground">
                  {t("accountInfo.accountId")}
                </p>
                <p className="font-medium font-univers">{stripeAccount.stripeAccountId}</p>
              </div>
              <div>
                <p className="text-sm font-univers text-muted-foreground">
                  {t("accountInfo.commissionRate")}
                </p>
                <p className="font-medium font-univers">
                  {stripeAccount.commissionRate || "15"}%
                </p>
              </div>
              <div>
                <p className="text-sm font-univers text-muted-foreground">
                  {t("accountInfo.payoutsEnabled")}
                </p>
                <div className="flex items-center gap-2">
                  {stripeAccount.payoutsEnabled ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium font-univers text-green-600">
                        {t("accountInfo.enabled")}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium font-univers text-red-600">
                        {t("accountInfo.disabled")}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-univers text-muted-foreground">
                  {t("accountInfo.chargesEnabled")}
                </p>
                <div className="flex items-center gap-2">
                  {stripeAccount.chargesEnabled ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium font-univers text-green-600">
                        {t("accountInfo.enabled")}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium font-univers text-red-600">
                        {t("accountInfo.disabled")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => window.location.href = "/vendor/stripe-onboarding"}>
                {t("accountInfo.manageAccount")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reports">
        <FinancialReports vendorId={vendor.id} />
      </TabsContent>
    </Tabs>
  );
}