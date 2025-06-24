"use client";

import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-times-now mb-2">Checkout cancelado</h1>
            <p className="text-gray-600 font-univers mb-6">
              Tu pago fue cancelado. No se ha realizado ningún cargo.
            </p>
            <div className="space-y-3">
              <Link href="/checkout">
                <Button className="w-full">Volver al checkout</Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="w-full">
                  Continuar comprando
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}