"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const orderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

type OrderStatusFormValues = z.infer<typeof orderStatusSchema>;

interface OrderStatusUpdateFormProps {
  orderId: string;
  currentStatus: string;
  onSuccess?: () => void;
}

export function OrderStatusUpdateForm({ 
  orderId, 
  currentStatus,
  onSuccess 
}: OrderStatusUpdateFormProps) {
  const t = useTranslations("vendor.orders");
  const queryClient = useQueryClient();
  
  const form = useForm<OrderStatusFormValues>({
    resolver: zodResolver(orderStatusSchema),
    defaultValues: {
      status: currentStatus as any,
      trackingNumber: "",
      notes: "",
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (values: OrderStatusFormValues) => {
      const { updateOrderStatus } = await import("@/lib/actions/orders");
      return updateOrderStatus(orderId, values.status, values.notes);
    },
    onSuccess: (result) => {
      if (result) {
        toast.success(t("statusUpdated"));
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        onSuccess?.();
      } else {
        toast.error(t("updateError"));
      }
    },
    onError: () => {
      toast.error(t("updateError"));
    },
  });

  const onSubmit = (values: OrderStatusFormValues) => {
    updateStatusMutation.mutate(values);
  };

  const statusOptions = [
    { value: "pending", label: t("status.pending") },
    { value: "processing", label: t("status.processing") },
    { value: "shipped", label: t("status.shipped") },
    { value: "delivered", label: t("status.delivered") },
    { value: "cancelled", label: t("status.cancelled") },
  ];

  // Determine which statuses can be selected based on current status
  const getAvailableStatuses = () => {
    switch (currentStatus) {
      case "pending":
        return ["pending", "processing", "cancelled"];
      case "processing":
        return ["processing", "shipped", "cancelled"];
      case "shipped":
        return ["shipped", "delivered"];
      case "delivered":
      case "cancelled":
        return [currentStatus]; // No changes allowed
      default:
        return statusOptions.map(opt => opt.value);
    }
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("status.label")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={updateStatusMutation.isPending || availableStatuses.length === 1}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("status.select")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions
                    .filter(opt => availableStatuses.includes(opt.value))
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("status") === "shipped" && (
          <FormField
            control={form.control}
            name="trackingNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("trackingNumber")}</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    type="text"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={t("trackingNumberPlaceholder")}
                    disabled={updateStatusMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("notes")}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t("notesPlaceholder")}
                  disabled={updateStatusMutation.isPending}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {availableStatuses.length > 1 && (
          <Button 
            type="submit" 
            disabled={updateStatusMutation.isPending}
            className="w-full"
          >
            {updateStatusMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("updateStatus")}
          </Button>
        )}
      </form>
    </Form>
  );
}