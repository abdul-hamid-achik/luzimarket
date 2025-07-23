"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CreditCard, 
  AlertCircle,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  const t = useTranslations("vendor.financials");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Reload the page to fetch fresh data
    window.location.reload();
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: t("status.completed"), className: "bg-green-100 text-green-800" },
      pending: { label: t("status.pending"), className: "bg-yellow-100 text-yellow-800" },
      failed: { label: t("status.failed"), className: "bg-red-100 text-red-800" },
      processing: { label: t("status.processing"), className: "bg-blue-100 text-blue-800" },
      paid: { label: t("status.paid"), className: "bg-green-100 text-green-800" },
      in_transit: { label: t("status.inTransit"), className: "bg-blue-100 text-blue-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <TrendingUp className="h-4 w-4" />;
      case "refund":
        return <RefreshCw className="h-4 w-4" />;
      case "payout":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
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
    <div className="space-y-6">
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
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            {t("actions.export")}
          </Button>
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

      {/* Tabs for Transactions and Payouts */}
      <Tabs defaultValue="transactions">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">{t("tabs.transactions")}</TabsTrigger>
          <TabsTrigger value="payouts">{t("tabs.payouts")}</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-times-now">{t("transactions.title")}</CardTitle>
              <CardDescription className="font-univers">
                {t("transactions.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!transactions || transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground font-univers">
                    {t("transactions.empty")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'sale' ? 'bg-green-100' : 
                          transaction.type === 'refund' ? 'bg-red-100' : 
                          'bg-gray-100'
                        }`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium font-univers">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-muted-foreground font-univers">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold font-times-now ${
                          transaction.type === 'refund' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'refund' ? '-' : '+'}{formatCurrency(transaction.amount)}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-times-now">{t("payouts.title")}</CardTitle>
              <CardDescription className="font-univers">
                {t("payouts.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!payouts || payouts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground font-univers">
                    {t("payouts.empty")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout: any) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-purple-100">
                          <CreditCard className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium font-univers">
                            {t("payouts.payoutTo", { method: payout.method || t("payouts.bankAccount") })}
                          </p>
                          <p className="text-sm text-muted-foreground font-univers">
                            {formatDate(payout.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-times-now text-purple-600">
                          {formatCurrency(payout.amount)}
                        </p>
                        {getStatusBadge(payout.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
    </div>
  );
}