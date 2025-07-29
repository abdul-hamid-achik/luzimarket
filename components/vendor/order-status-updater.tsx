"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface OrderStatusUpdaterProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: string;
    currency: string;
    createdAt: string;
    user?: {
      name: string;
      email: string;
    };
    items: Array<{
      id: string;
      quantity: number;
      product: {
        name: string;
        images: string[];
      };
    }>;
  };
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

export function OrderStatusUpdater({ order, onStatusUpdate }: OrderStatusUpdaterProps) {
  const t = useTranslations("vendor.orderStatusUpdater");
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [notes, setNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const statusOptions = [
    { value: "processing", label: t("status.processing"), icon: Package, color: "bg-blue-500" },
    { value: "shipped", label: t("status.shipped"), icon: Truck, color: "bg-orange-500" },
    { value: "delivered", label: t("status.delivered"), icon: CheckCircle, color: "bg-green-500" },
    { value: "cancelled", label: t("status.cancelled"), icon: XCircle, color: "bg-red-500" },
  ];

  const handleStatusUpdate = async () => {
    if (selectedStatus === order.status && !notes && !trackingNumber) {
      toast.error(t("errors.noChanges"));
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/vendor/orders/${order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedStatus,
          notes: notes.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("errors.updateFailed"));
      }

      const result = await response.json();
      
      toast.success(t("success.statusUpdated"), {
        description: t("success.statusUpdatedDescription", { orderNumber: order.orderNumber }),
      });

      // Reset form
      setNotes("");
      setTrackingNumber("");

      // Notify parent component
      onStatusUpdate?.(order.id, selectedStatus);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(t("errors.generic"), {
        description: error instanceof Error ? error.message : t("errors.updateFailed"),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    if (!statusOption) return null;

    const Icon = statusOption.icon;
    return (
      <Badge className={`${statusOption.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusOption.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("orderNumber", { number: order.orderNumber })}</span>
          {getStatusBadge(order.status)}
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p>{t("total")}: ${order.total} {order.currency}</p>
          <p>{t("date")}: {new Date(order.createdAt).toLocaleDateString('es-MX')}</p>
          {order.user && <p>{t("customer")}: {order.user?.name} ({order.user?.email})</p>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Items */}
        <div>
          <h4 className="font-medium mb-2">{t("products")}</h4>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <div className="relative w-12 h-12 bg-gray-200 rounded overflow-hidden">
                  {item.product.images[0] && (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-gray-600">{t("quantity")}: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Update Form */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">{t("updateStatus")}</h4>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="status">{t("newStatus")}</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedStatus === "shipped" && (
              <div>
                <Label htmlFor="tracking">{t("trackingNumber")}</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackingNumber(e.target.value)}
                  placeholder={t("trackingNumberPlaceholder")}
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">{t("additionalNotes")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={3}
              />
            </div>

            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? t("updating") : t("updateButton")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}