"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

interface OrderItem {
    name: string;
    quantity: number;
    price: string;
    image: string | null;
}

interface OrderData {
    orderNumber: string;
    total: string;
    subtotal: string;
    tax: string;
    shipping: string;
    currency: string;
    paymentStatus: string;
    items: OrderItem[];
}

export default function CheckoutRetryPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderNumber = searchParams.get("order");

    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retrying, setRetrying] = useState(false);

    const fetchOrder = async () => {
        try {
            const response = await fetch(`/api/checkout/retry?orderNumber=${orderNumber}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch order");
            }

            setOrder(data.order);
        } catch (err: any) {
            setError(err.message || "Failed to load order details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!orderNumber) {
            setError("No order number provided");
            setLoading(false);
            return;
        }

        fetchOrder();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderNumber]);

    const handleRetryPayment = async () => {
        if (!orderNumber) return;

        setRetrying(true);
        setError(null);

        try {
            const response = await fetch("/api/checkout/retry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderNumber }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create retry session");
            }

            // Redirect to Stripe checkout
            if (data.url) {
                window.location.href = data.url;
            } else if (data.sessionId && (window as any).Stripe) {
                const stripe = (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
                const { error: stripeError } = await stripe.redirectToCheckout({
                    sessionId: data.sessionId
                });

                if (stripeError) {
                    throw new Error(stripeError.message);
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to retry payment");
            setRetrying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-black mx-auto mb-4" />
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        <div className="mt-6 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => router.push("/orders")}
                                className="flex-1"
                            >
                                View Orders
                            </Button>
                            <Button
                                onClick={() => router.push("/")}
                                className="flex-1 bg-black text-white hover:bg-gray-800"
                            >
                                Go Home
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    // Check if order can be retried
    const canRetry = order.paymentStatus === "failed";

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <CreditCard className="h-6 w-6" />
                            <CardTitle>Retry Payment</CardTitle>
                        </div>
                        <p className="text-sm text-gray-600">
                            Order #{order.orderNumber}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Alert */}
                        {canRetry ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Your payment was unsuccessful. Please try again with a different payment method or card.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert>
                                <AlertDescription>
                                    This order has already been paid or is being processed.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Order Items */}
                        <div>
                            <h3 className="font-semibold mb-4">Order Summary</h3>
                            <div className="space-y-4">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        {item.image && (
                                            <div className="relative w-16 h-16 flex-shrink-0">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover rounded"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-gray-600">
                                                Quantity: {item.quantity}
                                            </p>
                                        </div>
                                        <p className="font-medium">
                                            ${parseFloat(item.price).toFixed(2)} {order.currency}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Total */}
                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span>${parseFloat(order.subtotal).toFixed(2)} {order.currency}</span>
                            </div>
                            {parseFloat(order.tax) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Tax:</span>
                                    <span>${parseFloat(order.tax).toFixed(2)} {order.currency}</span>
                                </div>
                            )}
                            {parseFloat(order.shipping) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Shipping:</span>
                                    <span>${parseFloat(order.shipping).toFixed(2)} {order.currency}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                <span>Total:</span>
                                <span>${parseFloat(order.total).toFixed(2)} {order.currency}</span>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => router.push("/orders")}
                                className="flex-1"
                                disabled={retrying}
                            >
                                View Orders
                            </Button>
                            {canRetry && (
                                <Button
                                    onClick={handleRetryPayment}
                                    className="flex-1 bg-black text-white hover:bg-gray-800"
                                    disabled={retrying}
                                >
                                    {retrying ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Retry Payment"
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
