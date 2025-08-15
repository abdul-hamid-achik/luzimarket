"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download,
  TrendingUp,
  DollarSign,
  BarChart3,
  FileText,
  Loader2,
  Calendar,
  Store,
  Package2
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
import { Line, Bar, Pie } from "react-chartjs-2";

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

export function AdminFinancialReports() {
  const t = useTranslations("Admin.financials.reports");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState("platform_overview");
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedVendor, setSelectedVendor] = useState<string>("all");

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
        reportType,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        ...(reportType !== "platform_overview" && selectedVendor !== "all" && { vendorId: selectedVendor }),
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
        reportType: activeTab,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        ...(activeTab !== "platform_overview" && selectedVendor !== "all" && { vendorId: selectedVendor }),
      };

      // Validate parameters with schema
      const params = reportParamsSchema.parse(rawParams);

      const result = await downloadReport(params);

      if (isApiSuccess(result)) {
        // Create and download file
        const blob = new Blob([result.data.content], { type: result.data.contentType });
        const url = window.URL.createObjectURL(blob);
        const linkEl = document.createElement(String("a"));
        linkEl.href = url;
        linkEl.download = result.data.filename;
        document.body.appendChild(linkEl);
        linkEl.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(linkEl);

        toast.success(t("downloadSuccess"));
      } else {
        toast.error(result.error || t("downloadError"));
      }
    } catch (error) {
      toast.error(t("downloadError"));
    }
  };

  const renderPlatformOverview = () => {
    if (!reportData) return null;

    const topVendorsChart = {
      labels: reportData.topVendors.map((v: any) => v.vendorName),
      datasets: [
        {
          label: t("revenue"),
          data: reportData.topVendors.map((v: any) => parseFloat(v.revenue)),
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("platformRevenue")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(reportData.platformRevenue)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("commissionEarned")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("totalSales")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(reportData.totalSales.amount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {reportData.totalSales.count} {t("orders")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("activeVendors")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {reportData.vendorStats.activeVendors}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("of")} {reportData.vendorStats.totalVendors} {t("total")}
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
                  reportData.totalSales.count > 0
                    ? parseFloat(reportData.totalSales.amount) / reportData.totalSales.count
                    : 0
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Vendors Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("topVendorsByRevenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar
              data={topVendorsChart}
              options={{
                responsive: true,
                indexAxis: 'y',
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Vendor Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("vendorPerformance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">{t("Vendor")}</th>
                    <th className="text-right p-2">{t("revenue")}</th>
                    <th className="text-right p-2">{t("orders")}</th>
                    <th className="text-right p-2">{t("avgOrder")}</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topVendors.map((vendor: any) => (
                    <tr key={vendor.vendorId} className="border-b">
                      <td className="p-2 font-medium">{vendor.vendorName}</td>
                      <td className="p-2 text-right">{formatCurrency(vendor.revenue)}</td>
                      <td className="p-2 text-right">{vendor.orderCount}</td>
                      <td className="p-2 text-right">
                        {formatCurrency(
                          parseFloat(vendor.revenue) / vendor.orderCount
                        )}
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
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          tension: 0.4,
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Summary */}
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

        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("salesOverTime")}</CardTitle>
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

  const renderPayoutsReport = () => {
    if (!reportData) return null;

    const statusData = {
      labels: ["Pending", "Processing", "Paid", "Failed"],
      datasets: [
        {
          data: [
            reportData.summary.pending || 0,
            reportData.summary.processing || 0,
            reportData.summary.paid || 0,
            reportData.summary.failed || 0,
          ],
          backgroundColor: [
            "rgba(251, 191, 36, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(34, 197, 94, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("totalPayouts")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(reportData.summary.total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("pendingPayouts")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {reportData.summary.pendingCount || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(reportData.summary.pending || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("completedPayouts")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {reportData.summary.paidCount || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(reportData.summary.paid || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("failedPayouts")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {reportData.summary.failedCount || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(reportData.summary.failed || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("payoutStatusBreakdown")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Pie data={statusData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("recentPayouts")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reportData.payouts.slice(0, 5).map((payout: any) => (
                  <div key={payout.id} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <p className="font-medium">{formatCurrency(payout.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payout.createdAt), "dd MMM yyyy")}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${payout.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : payout.status === "pending"
                          ? "bg-orange-100 text-orange-700"
                          : payout.status === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                    >
                      {payout.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("reports")}
          </CardTitle>
          <CardDescription>{t("reportsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            {activeTab !== "platform_overview" && (
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t("selectVendor")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allVendors")}</SelectItem>
                  {/* In production, this would be populated with actual vendors */}
                </SelectContent>
              </Select>
            )}
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
              <TabsTrigger value="platform_overview" disabled={isLoading}>
                <Store className="h-4 w-4 mr-2" />
                {t("platformOverview")}
              </TabsTrigger>
              <TabsTrigger value="sales" disabled={isLoading}>
                <TrendingUp className="h-4 w-4 mr-2" />
                {t("salesReport")}
              </TabsTrigger>
              <TabsTrigger value="payouts" disabled={isLoading}>
                <DollarSign className="h-4 w-4 mr-2" />
                {t("payoutsReport")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="platform_overview" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderPlatformOverview()
              )}
            </TabsContent>

            <TabsContent value="sales" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderSalesReport()
              )}
            </TabsContent>

            <TabsContent value="payouts" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderPayoutsReport()
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}