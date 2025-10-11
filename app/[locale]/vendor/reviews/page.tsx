import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, TrendingUp, AlertCircle } from "lucide-react";
import { VendorReviewsList } from "@/components/vendor/vendor-reviews-list";
import { getVendorReviewAnalytics, getUnrespondedReviews } from "@/lib/services/review-service";

export default async function VendorReviewsPage() {
    const session = await auth();
    const t = await getTranslations("Vendor.reviews");

    if (!session || session.user.role !== "vendor") {
        redirect("/login");
    }

    const vendorId = session.user.vendor?.id || session.user.id;

    // Fetch analytics and unresponded reviews
    const [analyticsResult, unrespondedResult] = await Promise.all([
        getVendorReviewAnalytics(vendorId),
        getUnrespondedReviews(vendorId),
    ]);

    const analytics = analyticsResult.success ? analyticsResult.analytics : null;
    const unresponded = unrespondedResult.success ? unrespondedResult.reviews.length : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-univers text-gray-900">
                    {t("title", { default: "Reseñas de Productos" })}
                </h1>
                <p className="text-sm text-gray-600 font-univers mt-1">
                    {t("subtitle", { default: "Administra las reseñas de tus productos y responde a tus clientes" })}
                </p>
            </div>

            {/* Analytics Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Reseñas</CardTitle>
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.totalReviews}</div>
                            <p className="text-xs text-gray-500">
                                {analytics.recentReviews} en los últimos 30 días
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
                            <Star className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-1">
                                {analytics.averageRating.toFixed(1)}
                                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            </div>
                            <p className="text-xs text-gray-500">De 5 estrellas</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tasa de Respuesta</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.responseRate.toFixed(0)}%</div>
                            <p className="text-xs text-gray-500">
                                {analytics.totalReviews > 0 &&
                                    `${Math.round((analytics.totalReviews * analytics.responseRate) / 100)} respondidas`
                                }
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sin Responder</CardTitle>
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{unresponded}</div>
                            <p className="text-xs text-gray-500">
                                {unresponded > 0 ? "Requieren atención" : "Todas respondidas"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Rating Distribution */}
            {analytics && analytics.totalReviews > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución de Calificaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = analytics.ratingDistribution[rating] || 0;
                                const percentage = analytics.totalReviews > 0
                                    ? (count / analytics.totalReviews) * 100
                                    : 0;

                                return (
                                    <div key={rating} className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 w-20">
                                            <span className="text-sm font-medium">{rating}</span>
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        </div>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-yellow-400 h-full rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600 w-16 text-right">
                                            {count} ({percentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reviews List */}
            <Card>
                <CardHeader>
                    <CardTitle>Todas las Reseñas</CardTitle>
                </CardHeader>
                <CardContent>
                    <VendorReviewsList vendorId={vendorId} />
                </CardContent>
            </Card>
        </div>
    );
}

