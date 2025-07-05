'use client';

import { useState, useEffect } from 'react';
import { calculateShipping, type ShippingOption } from '@/lib/actions/shipping';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, Truck, Clock, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { validatePostalCode } from '@/lib/utils/shipping-zones';

interface ShippingCalculatorProps {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  vendorId: string;
  onShippingChange: (option: ShippingOption | null, postalCode: string) => void;
  initialPostalCode?: string;
}

export function ShippingCalculator({ 
  items, 
  vendorId, 
  onShippingChange,
  initialPostalCode = ''
}: ShippingCalculatorProps) {
  const [postalCode, setPostalCode] = useState(initialPostalCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingData, setShippingData] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');

  // Update postal code when initialPostalCode changes (but prevent loops)
  useEffect(() => {
    if (initialPostalCode && initialPostalCode !== postalCode) {
      setPostalCode(initialPostalCode);
    }
  }, [initialPostalCode, postalCode]);

  // Debounce postal code changes
  useEffect(() => {
    if (!postalCode || postalCode.length !== 5) {
      setShippingData(null);
      setSelectedOption('');
      onShippingChange(null, postalCode);
      return;
    }

    const timer = setTimeout(async () => {
      await fetchShippingOptions();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode]);

  const fetchShippingOptions = async () => {
    if (!validatePostalCode(postalCode)) {
      setError('Por favor ingresa un código postal válido de 5 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await calculateShipping({
        items,
        vendorId,
        destinationPostalCode: postalCode
      });

      if (!result.success) {
        setError(result.error || 'Error al calcular el envío');
        setShippingData(null);
        return;
      }

      setShippingData(result);
      
      // Auto-select first option
      if (result.options && result.options.length > 0) {
        const firstOption = result.options[0];
        setSelectedOption(firstOption.id);
        onShippingChange(firstOption, postalCode);
      }
    } catch (err) {
      setError('Error al conectar con el servicio de envío');
      setShippingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (optionId: string) => {
    setSelectedOption(optionId);
    const option = shippingData?.options?.find((opt: ShippingOption) => opt.id === optionId);
    if (option) {
      onShippingChange(option, postalCode);
    }
  };

  const formatDeliveryDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Opciones de Envío
        </CardTitle>
        <CardDescription>
          Ingresa tu código postal para calcular el costo de envío
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Postal Code Input */}
        <div className="space-y-2">
          <Label htmlFor="postalCode">Código Postal</Label>
          <Input
            id="postalCode"
            type="text"
            placeholder="12345"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            maxLength={5}
            className="max-w-[200px]"
          />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Calculando opciones de envío...</span>
          </div>
        )}

        {/* Free Shipping Alert */}
        {shippingData?.freeShipping && (
          <Alert className="bg-green-50 border-green-200">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              ¡Felicidades! Tu orden califica para envío gratis.
            </AlertDescription>
          </Alert>
        )}

        {/* Remaining for Free Shipping */}
        {shippingData?.remainingForFreeShipping && shippingData.remainingForFreeShipping > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Agrega {formatCurrency(shippingData.remainingForFreeShipping)} más a tu carrito para obtener envío gratis
            </AlertDescription>
          </Alert>
        )}

        {/* Shipping Options */}
        {shippingData?.options && shippingData.options.length > 0 && (
          <RadioGroup value={selectedOption} onValueChange={handleOptionChange}>
            <div className="space-y-3">
              {shippingData.options.map((option: ShippingOption) => (
                <label
                  key={option.id}
                  htmlFor={option.id}
                  className={`
                    flex items-start space-x-3 rounded-lg border p-4 cursor-pointer
                    transition-colors hover:bg-muted/50
                    ${selectedOption === option.id ? 'border-primary bg-primary/5' : 'border-muted'}
                  `}
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{option.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {option.estimatedDays}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {option.cost === 0 ? 'Gratis' : formatCurrency(option.cost)}
                        </p>
                      </div>
                    </div>
                    {option.estimatedDelivery && (
                      <p className="text-xs text-muted-foreground">
                        Entrega estimada: {formatDeliveryDate(option.estimatedDelivery.minDate)}
                        {option.estimatedDelivery.maxDate !== option.estimatedDelivery.minDate && 
                          ` - ${formatDeliveryDate(option.estimatedDelivery.maxDate)}`
                        }
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        )}

        {/* Destination Info */}
        {shippingData?.destination && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>
                Envío a {shippingData.destination.state} 
                {shippingData.weight && ` • ${shippingData.weight.formatted}`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}