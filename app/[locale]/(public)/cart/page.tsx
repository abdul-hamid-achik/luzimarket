"use client";

import { useCart } from "@/contexts/cart-context";
import { useCurrency } from "@/contexts/currency-context";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, MapPin } from "lucide-react";
import { ProgressSteps, MobileProgressSteps } from "@/components/ui/progress-steps";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { getStateFromPostalCode } from "@/lib/utils/shipping-zones";
import { useTranslations } from "next-intl";

// Note: Tax rate is handled server-side for security
// Client-side calculations are for display only
const TAX_RATE = 0.16; // This should match server config
const DEFAULT_SHIPPING = 99;
const FREE_SHIPPING_THRESHOLD = 1000;

export default function CartPage() {
  const { state, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const { formatPrice } = useCurrency();
  const [postalCode, setPostalCode] = useState("");
  const [estimatedShipping, setEstimatedShipping] = useState<number | null>(null);
  const t = useTranslations("Cart");

  const cartSteps = [
    { id: "cart", title: t("steps.cart.title"), description: t("steps.cart.description") },
    { id: "info", title: t("steps.info.title"), description: t("steps.info.description") },
    { id: "payment", title: t("steps.payment.title"), description: t("steps.payment.description") },
  ];

  const subtotal = getTotalPrice();
  const tax = subtotal * TAX_RATE; // Uses server config rate

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-times-now mb-4">{t("empty")}</h1>
          <p className="text-gray-600 font-univers mb-8">
            {t("emptyDescription")}
          </p>
          <Link href="/products">
            <Button className="bg-black text-white hover:bg-gray-800">
              {t("exploreProducts")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Basic shipping estimate based on subtotal
  const getShippingEstimate = () => {
    if (subtotal > 1000) return 0;
    if (!postalCode || postalCode.length !== 5) return 99;
    
    const state = getStateFromPostalCode(postalCode);
    if (!state) return 99;
    
    // Basic estimate based on zone
    const zone = state === 'Ciudad de México' || state === 'Estado de México' ? 'central' : 'other';
    return zone === 'central' ? 99 : 149;
  };
  
  const shipping = estimatedShipping !== null ? estimatedShipping : getShippingEstimate();
  const total = subtotal + tax + shipping;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-times-now mb-8">{t("pageTitle")}</h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="hidden md:block">
            <ProgressSteps steps={cartSteps} currentStep={0} />
          </div>
          <div className="md:hidden">
            <MobileProgressSteps steps={cartSteps} currentStep={0} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              {state.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-6 border-b last:border-0"
                >
                  {/* Product Image */}
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <div>
                        <h3 className="font-univers font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600 font-univers">
                          {t("by")} {item.vendorName}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-univers">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <p className="font-univers font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-univers mb-4">{t("orderSummary")}</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm font-univers">
                  <span>{t("subtotal")}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-univers">
                  <span>{t("tax")}</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-sm font-univers">
                  <span>{t("shipping")}</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600">{t("freeShipping")}</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>
              </div>

              {/* Postal Code for Shipping Estimate */}
              <div className="mb-4 space-y-2">
                <label className="text-sm font-univers text-gray-600 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {t("calculateShipping")}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={t("postalCode")}
                    value={postalCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setPostalCode(value);
                      if (value.length === 5) {
                        setEstimatedShipping(getShippingEstimate());
                      }
                    }}
                    className="flex-1"
                    maxLength={5}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEstimatedShipping(getShippingEstimate())}
                    disabled={postalCode.length !== 5}
                  >
                    {t("calculate")}
                  </Button>
                </div>
                {postalCode.length === 5 && !getStateFromPostalCode(postalCode) && (
                  <p className="text-xs text-red-600">{t("invalidPostalCode")}</p>
                )}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-univers">
                  <span className="font-medium">{t("total")}</span>
                  <span className="font-medium text-lg">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <Link href="/checkout" className="block">
                <Button className="w-full bg-black text-white hover:bg-gray-800">
                  {t("checkout")}
                </Button>
              </Link>

              <p className="text-xs text-center text-gray-500 font-univers mt-4">
                {t("freeShippingThreshold", { amount: formatPrice(1000) })}
              </p>
            </div>

            {/* Security Info */}
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-xs font-univers text-gray-600 text-center">
                {t("securePayment")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}