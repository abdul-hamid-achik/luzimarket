"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTaxRateLabel, isBorderState } from "@/lib/utils/tax-rates";
import { Info } from "lucide-react";

interface TaxBreakdownProps {
    vendors: Array<{
        id: string;
        name: string;
        state: string | null;
        subtotal: number;
        tax: number;
    }>;
}

export function TaxBreakdown({ vendors }: TaxBreakdownProps) {
    const totalTax = vendors.reduce((sum, v) => sum + v.tax, 0);
    const hasMixedRates = vendors.some(v => isBorderState(v.state)) &&
        vendors.some(v => !isBorderState(v.state));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Desglose de IVA por Vendedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {vendors.map(vendor => (
                    <div key={vendor.id} className="flex justify-between text-sm">
                        <div className="flex-1">
                            <p className="font-medium">{vendor.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {vendor.state || 'N/A'} • {getTaxRateLabel(vendor.state)} IVA
                            </p>
                        </div>
                        <span className="font-medium">
                            ${vendor.tax.toFixed(2)} MXN
                        </span>
                    </div>
                ))}

                {hasMixedRates && (
                    <div className="flex items-start gap-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>
                            Se aplican diferentes tasas de IVA según la ubicación del vendedor.
                            Estados fronterizos pagan 8%, resto de México 16%.
                        </p>
                    </div>
                )}

                <div className="pt-2 border-t flex justify-between font-medium">
                    <span>IVA Total</span>
                    <span>${totalTax.toFixed(2)} MXN</span>
                </div>
            </CardContent>
        </Card>
    );
}

