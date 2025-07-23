"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { 
  Download, 
  TrendingUp, 
  Package, 
  DollarSign,
  BarChart3,
  FileText,
  Loader2,
  Calendar
} from "lucide-react";
import { generateReport, downloadReport } from "@/lib/actions/reports";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { reportParamsSchema, type ReportParams, isApiSuccess } from "@/lib/types/api";
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
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

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
  ArcElement
);

interface FinancialReportsProps {
  vendorId: string;
}

export function FinancialReports({ vendorId }: FinancialReportsProps) {
  const t = useTranslations("vendor.reports");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState("sales");
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(numAmount);
  };

  const handleGenerateReport = async (reportType: string) => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error(t("selectDateRange"));
      return;
    }

    setIsLoading(true);
    setActiveTab(reportType);

    try {
      const rawParams = {
        vendorId,
        reportType,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      };

      // Validate parameters with schema
      const params = reportParamsSchema.parse(rawParams);

      const result = await generateReport(params);

      if (isApiSuccess(result)) {
        setReportData(result.data);
      } else {
        toast.error(result.error || t("reportError"));
      }
    } catch (error) {
      toast.error(t("reportError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error(t("selectDateRange"));
      return;
    }

    try {
      const rawParams = {
        vendorId,
        reportType: activeTab,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      };

      // Validate parameters with schema
      const params = reportParamsSchema.parse(rawParams);

      const result = await downloadReport(params);

      if (isApiSuccess(result)) {
        // Create and download file
        const blob = new Blob([result.data.content], { type: result.data.contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(t("downloadSuccess"));
      } else {
        toast.error(result.error || t("downloadError"));
      }
    } catch (error) {
      toast.error(t("downloadError"));
    }
  };

  const renderSalesReport = () => {
    if (!reportData) return null;

    const chartData = {
      labels: reportData.dailyData.map((d: any) => 
        format(new Date(d.date), "dd MMM", { locale: es })
      ),
      datasets: [
        {
          label: t("revenue"),
          data: reportData.dailyData.map((d: any) => parseFloat(d.totalRevenue || 0)),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("totalOrders")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{reportData.summary.totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("totalRevenue")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(reportData.summary.totalRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("avgOrderValue")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  reportData.summary.totalRevenue / reportData.summary.totalOrders || 0
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("revenueOverTime")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Line data={chartData} options={{ responsive: true }} />
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>{t("topProducts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topProducts.map((product: any, index: number) => (
                <div key={product.productId} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{index + 1}. {product.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("soldUnits", { count: Number(product.quantitySold) })}
                    </p>
                  </div>
                  <p className="font-bold">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRevenueReport = () => {
    if (!reportData) return null;

    const transactionData = {
      labels: reportData.transactions.map((t: any) => t.type),
      datasets: [
        {
          data: reportData.transactions.map((t: any) => parseFloat(t.totalAmount)),
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(251, 191, 36, 0.8)",
          ],
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("availableBalance")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(reportData.currentBalance.availableBalance)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("pendingBalance")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(reportData.currentBalance.pendingBalance)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("reservedBalance")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(reportData.currentBalance.reservedBalance)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("transactionBreakdown")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Doughnut data={transactionData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("payoutSummary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.payouts.map((payout: any) => (
                  <div key={payout.status} className="flex justify-between">
                    <div>
                      <p className="font-medium capitalize">{payout.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {payout.count} {t("payouts")}
                      </p>
                    </div>
                    <p className="font-bold">{formatCurrency(payout.totalAmount)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderProductsReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("totalProducts")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{reportData.totalProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("inventoryValue")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(reportData.inventoryValue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("lowStock")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {reportData.lowStockCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Product Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("productPerformance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">{t("product")}</th>
                    <th className="text-left p-2">{t("sku")}</th>
                    <th className="text-right p-2">{t("stock")}</th>
                    <th className="text-right p-2">{t("sold")}</th>
                    <th className="text-right p-2">{t("revenue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.productPerformance.map((product: any) => (
                    <tr key={product.productId} className="border-b">
                      <td className="p-2 font-medium">{product.productName}</td>
                      <td className="p-2 text-sm text-muted-foreground">{product.sku}</td>
                      <td className="p-2 text-right">
                        <span className={product.currentStock < 10 ? "text-orange-600 font-bold" : ""}>
                          {product.currentStock}
                        </span>
                      </td>
                      <td className="p-2 text-right">{product.quantitySold || 0}</td>
                      <td className="p-2 text-right font-bold">
                        {formatCurrency(product.revenue || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Date Range Picker */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReport}
              disabled={!reportData || isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              {t("download")}
            </Button>
          </div>

          {/* Report Type Tabs */}
          <Tabs value={activeTab} onValueChange={handleGenerateReport}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sales" disabled={isLoading}>
                <TrendingUp className="h-4 w-4 mr-2" />
                {t("salesReport")}
              </TabsTrigger>
              <TabsTrigger value="revenue" disabled={isLoading}>
                <DollarSign className="h-4 w-4 mr-2" />
                {t("revenueReport")}
              </TabsTrigger>
              <TabsTrigger value="products" disabled={isLoading}>
                <Package className="h-4 w-4 mr-2" />
                {t("productsReport")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderSalesReport()
              )}
            </TabsContent>

            <TabsContent value="revenue" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderRevenueReport()
              )}
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderProductsReport()
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}