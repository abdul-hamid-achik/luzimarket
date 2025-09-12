"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Tag, X, Check } from "lucide-react";
import { validateCoupon } from "@/lib/actions/coupons";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  categoryId?: string;
  vendorId?: string;
}

interface CouponInputProps {
  cartItems: CartItem[];
  userId?: string;
  userEmail?: string;
  onCouponApplied?: (coupon: any, discount: number) => void;
  onCouponRemoved?: () => void;
  appliedCoupon?: {
    code: string;
    discount: number;
  };
}

export function CouponInput({
  cartItems,
  userId,
  userEmail,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon
}: CouponInputProps) {
  const t = useTranslations("Checkout");
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!code.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setIsValidating(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await validateCoupon(code, cartItems, userId, userEmail);

      if (result.isValid && result.coupon && result.discount !== undefined) {
        setSuccess(`Coupon applied! You save $${result.discount.toFixed(2)}`);
        setCode("");
        onCouponApplied?.(result.coupon, result.discount);
      } else {
        setError(result.error || "Invalid coupon code");
      }
    } catch (err) {
      setError("Failed to validate coupon. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setSuccess(null);
    setError(null);
    setCode("");
    onCouponRemoved?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isValidating) {
      handleApplyCoupon();
    }
  };

  return (
    <div className="space-y-4">
      {!appliedCoupon ? (
        <>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="coupon-code" className="text-sm font-univers">
                Coupon Code
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="coupon-code"
                  type="text"
                  placeholder="Enter coupon code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  disabled={isValidating}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={isValidating || !code.trim()}
                  className="px-4"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Applying
                    </>
                  ) : (
                    <>
                      <Tag className="h-4 w-4 mr-2" />
                      Apply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <Tag className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-900 font-univers">
                  Coupon Applied: {appliedCoupon.code}
                </p>
                <p className="text-sm text-green-700 font-univers">
                  You save ${appliedCoupon.discount.toFixed(2)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              className="text-green-700 hover:text-green-900 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}