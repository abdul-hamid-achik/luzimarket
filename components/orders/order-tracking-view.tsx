"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Info,
  Home,
  Store,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { orders, vendors, orderItems, products } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";

// Dynamically import map component to avoid SSR issues
const TrackingMap = dynamic(() => import("./tracking-map"), {
  ssr: false,
  loading: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const t = useTranslations("Orders.mapLabels");
    return (
      <div className="w-full h-[400px] bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">{t("loadingMap")}</p>
      </div>
    );
  },
});

interface OrderTrackingViewProps {
  order: InferSelectModel<typeof orders>;
  vendor: InferSelectModel<typeof vendors> | null;
  items: Array<{
    orderItem: InferSelectModel<typeof orderItems>;
    product: InferSelectModel<typeof products> | null;
  }>;
  locale: string;
  isGuest?: boolean;
}

const statusIcons = {
  pending: Clock,
  paid: CheckCircle2,
  shipped: Truck,
  delivered: Home,
  cancelled: Info,
};

const statusColors = {
  pending: "bg-yellow-500",
  paid: "bg-blue-500",
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

export default function OrderTrackingView({
  order,
  vendor,
  items,
  locale,
  isGuest = false,
}: OrderTrackingViewProps) {
  const t = useTranslations("Orders");
  const dateLocale = locale === "es" ? es : enUS;
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  // Generate sample tracking data if none exists
  const trackingHistory = order.trackingHistory || generateSampleTrackingHistory(order);

  useEffect(() => {
    // Set current location based on latest tracking history
    const latestTracking = trackingHistory[trackingHistory.length - 1];
    if (latestTracking?.coordinates) {
      setCurrentLocation([latestTracking.coordinates.lat, latestTracking.coordinates.lng]);
    }
  }, [trackingHistory]);

  const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Info;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("trackingTitle", { orderNumber: order.orderNumber })}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("orderDate", {
              date: format(new Date(order.createdAt!), "PPP", {
                locale: dateLocale,
              }),
            })}
          </p>
        </div>
        <Badge
          className={cn(
            "text-white",
            statusColors[order.status as keyof typeof statusColors]
          )}
        >
          <StatusIcon className="w-4 h-4 mr-1" />
          {t(`status.${order.status}`)}
        </Badge>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Map and Delivery Info */}
        <div className="space-y-6">
          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t("trackingMap")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TrackingMap
                trackingHistory={trackingHistory}
                vendorLocation={
                  vendor
                    ? {
                        lat: 19.4326, // In real app, geocode vendor address
                        lng: -99.1332,
                        name: vendor.businessName,
                      }
                    : undefined
                }
                deliveryLocation={
                  order.shippingAddress
                    ? {
                        lat: 19.4326, // In real app, geocode the address
                        lng: -99.1332,
                        address: `${order.shippingAddress.street}, ${order.shippingAddress.city}`,
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                {t("deliveryInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.trackingNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("trackingNumber")}</p>
                  <p className="font-mono font-semibold">{order.trackingNumber}</p>
                </div>
              )}
              
              {order.carrier && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("carrier")}</p>
                  <p className="font-semibold capitalize">{order.carrier}</p>
                </div>
              )}

              {order.estimatedDeliveryDate && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("estimatedDelivery")}
                  </p>
                  <p className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(order.estimatedDeliveryDate), "PPP", {
                      locale: dateLocale,
                    })}
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {t("deliveryAddress")}
                </p>
                {order.shippingAddress && (
                  <div className="space-y-1 text-sm">
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                      {order.shippingAddress.postalCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline and Order Details */}
        <div className="space-y-6">
          {/* Tracking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t("trackingTimeline")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {trackingHistory.map((event, index) => {
                  const Icon = getTrackingIcon(event.status);
                  const isLast = index === trackingHistory.length - 1;
                  
                  return (
                    <div key={index} className="flex gap-4 pb-8 last:pb-0">
                      {/* Timeline Line */}
                      <div className="relative flex flex-col items-center">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            isLast
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {!isLast && (
                          <div className="absolute top-10 w-0.5 h-full bg-border" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{event.status}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {event.location}
                            </p>
                          </div>
                          <time className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(event.timestamp), "PPp", {
                              locale: dateLocale,
                            })}
                          </time>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t("orderItems")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {item.product?.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("quantity")}: {item.orderItem.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ${item.orderItem.total}
                    </p>
                  </div>
                ))}
                <Separator className="my-3" />
                <div className="flex justify-between font-semibold">
                  <span>{t("total")}</span>
                  <span>${order.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Information */}
          {vendor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  {t("vendorInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold">{vendor.businessName}</p>
                  {vendor.phone && (
                    <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                  )}
                  {vendor.email && (
                    <p className="text-sm text-muted-foreground">{vendor.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function getTrackingIcon(status: string) {
  const iconMap: Record<string, any> = {
    "Order Placed": Package,
    "Payment Confirmed": CheckCircle2,
    "Package Picked Up": Truck,
    "In Transit": Truck,
    "Out for Delivery": Truck,
    "Delivered": Home,
  };
  return iconMap[status] || Info;
}

function generateSampleTrackingHistory(order: InferSelectModel<typeof orders>) {
  const baseDate = new Date(order.createdAt!);
  const history = [];

  // Order placed
  history.push({
    status: "Order Placed",
    location: "Online",
    timestamp: baseDate,
    description: "Your order has been received",
    coordinates: { lat: 19.4326, lng: -99.1332 },
  });

  if (order.status !== "pending") {
    // Payment confirmed
    history.push({
      status: "Payment Confirmed",
      location: "Payment Gateway",
      timestamp: new Date(baseDate.getTime() + 30 * 60 * 1000), // 30 mins later
      description: "Payment has been processed successfully",
      coordinates: { lat: 19.4326, lng: -99.1332 },
    });
  }

  if (order.status === "shipped" || order.status === "delivered") {
    // Package picked up
    history.push({
      status: "Package Picked Up",
      location: "Mexico City Distribution Center",
      timestamp: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000), // 1 day later
      description: "Package has been picked up by carrier",
      coordinates: { lat: 19.3910, lng: -99.1709 },
    });

    // In transit
    history.push({
      status: "In Transit",
      location: "Polanco Hub",
      timestamp: new Date(baseDate.getTime() + 36 * 60 * 60 * 1000), // 1.5 days later
      description: "Package is on the way",
      coordinates: { lat: 19.4336, lng: -99.1934 },
    });
  }

  if (order.status === "delivered") {
    // Out for delivery
    history.push({
      status: "Out for Delivery",
      location: "Local Delivery Station",
      timestamp: new Date(baseDate.getTime() + 48 * 60 * 60 * 1000), // 2 days later
      description: "Package is out for delivery",
      coordinates: { lat: 19.4270, lng: -99.1676 },
    });

    // Delivered
    history.push({
      status: "Delivered",
      location: order.shippingAddress?.city || "Customer Address",
      timestamp: order.actualDeliveryDate || new Date(baseDate.getTime() + 52 * 60 * 60 * 1000),
      description: "Package has been delivered",
      coordinates: { lat: 19.4126, lng: -99.1616 },
    });
  }

  return history;
}