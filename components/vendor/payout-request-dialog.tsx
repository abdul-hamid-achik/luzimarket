"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, AlertCircle, Loader2 } from "lucide-react";
import { requestPayout, getMinimumPayoutAmount } from "@/lib/actions/payout";
import { toast } from "sonner";

interface PayoutRequestDialogProps {
  vendorId: string;
  availableBalance: number;
  onSuccess?: () => void;
}

export function PayoutRequestDialog({
  vendorId,
  availableBalance,
  onSuccess,
}: PayoutRequestDialogProps) {
  const t = useTranslations("Vendor.payouts");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minimumAmount = 10; // 10 MXN minimum

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const requestAmount = parseFloat(amount);

    if (isNaN(requestAmount) || requestAmount <= 0) {
      setError(t("errors.invalidAmount"));
      return;
    }

    if (requestAmount < minimumAmount) {
      setError(t("errors.minimumAmount", { amount: formatCurrency(minimumAmount) }));
      return;
    }

    if (requestAmount > availableBalance) {
      setError(t("errors.insufficientBalance"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await requestPayout({
        vendorId,
        amount: requestAmount,
      });

      if (result.success) {
        toast.success(t("success"));
        setOpen(false);
        setAmount("");
        router.refresh();
        onSuccess?.();
      } else {
        setError(result.error || t("errors.requestFailed"));
      }
    } catch (error) {
      setError(t("errors.requestFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = availableBalance * percentage;
    setAmount(quickAmount.toFixed(2));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <DollarSign className="h-4 w-4 mr-2" />
          {t("requestPayout")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { balance: formatCurrency(availableBalance) })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t("amount")}</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={minimumAmount}
                max={availableBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("minimumNote", { amount: formatCurrency(minimumAmount) })}
            </p>
          </div>

          {/* Quick amount buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(0.25)}
              disabled={isLoading}
            >
              25%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(0.5)}
              disabled={isLoading}
            >
              50%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(0.75)}
              disabled={isLoading}
            >
              75%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(1)}
              disabled={isLoading}
            >
              100%
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading || !amount}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("confirm")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}