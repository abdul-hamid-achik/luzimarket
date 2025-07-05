"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Truck, MapPin, Package, DollarSign } from "lucide-react";
import { getShippingZones, getShippingMethods, saveVendorShippingRates, updateVendorShippingSettings } from "@/lib/actions/shipping";
import { MEXICO_STATES } from "@/lib/utils/shipping-zones";
import { toast } from "@/hooks/use-toast";

interface ShippingZone {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

interface ShippingMethod {
  id: number;
  carrier: string;
  serviceType: string;
  name: string;
  code: string;
}

interface ShippingRate {
  methodId: number;
  zoneId: number;
  minWeight: number;
  maxWeight: number;
  baseRate: string;
  perKgRate: string;
}

export default function VendorShippingSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [originState, setOriginState] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");
  const [defaultMethodId, setDefaultMethodId] = useState("");
  
  // Data
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  
  // Weight ranges
  const weightRanges = [
    { min: 0, max: 1000, label: "0-1 kg" },
    { min: 1001, max: 5000, label: "1-5 kg" },
    { min: 5001, max: 10000, label: "5-10 kg" },
    { min: 10001, max: 20000, label: "10-20 kg" },
    { min: 20001, max: 999999, label: "20+ kg" },
  ];

  useEffect(() => {
    if (!session?.user?.vendor) {
      router.push("/vendor/login");
      return;
    }
    
    loadData();
  }, [session, router]);

  const loadData = async () => {
    try {
      const [zonesResult, methodsResult] = await Promise.all([
        getShippingZones(),
        getShippingMethods(),
      ]);
      
      if (zonesResult.success && zonesResult.zones) {
        setZones(zonesResult.zones);
      }
      
      if (methodsResult.success && methodsResult.methods) {
        setMethods(methodsResult.methods);
      }
      
      // Initialize default rates for all combinations
      const defaultRates: ShippingRate[] = [];
      if (methodsResult.success && methodsResult.methods && zonesResult.success && zonesResult.zones) {
        methodsResult.methods.forEach(method => {
            zonesResult.zones.forEach(zone => {
              weightRanges.forEach(range => {
                defaultRates.push({
                  methodId: method.id,
                  zoneId: zone.id,
                  minWeight: range.min,
                  maxWeight: range.max,
                  baseRate: "0",
                  perKgRate: "0",
                });
              });
            });
          });
        }
      
      setRates(defaultRates);
    } catch (error) {
      console.error("Error loading shipping data:", error);
      toast.error("No se pudieron cargar los datos de envío");
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (methodId: number, zoneId: number, minWeight: number, field: 'baseRate' | 'perKgRate', value: string) => {
    setRates(prev => prev.map(rate => {
      if (rate.methodId === methodId && rate.zoneId === zoneId && rate.minWeight === minWeight) {
        return { ...rate, [field]: value };
      }
      return rate;
    }));
  };

  const handleSave = async () => {
    if (!session?.user?.vendor?.id) return;
    
    setSaving(true);
    try {
      // Save shipping settings
      await updateVendorShippingSettings(session.user.vendor.id, {
        shippingOriginState: originState,
        freeShippingThreshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : undefined,
        defaultShippingMethodId: defaultMethodId ? parseInt(defaultMethodId) : undefined,
      });
      
      // Save shipping rates (only non-zero rates)
      const activeRates = rates.filter(rate => 
        parseFloat(rate.baseRate) > 0 || parseFloat(rate.perKgRate) > 0
      );
      
      await saveVendorShippingRates(session.user.vendor.id, activeRates.map(rate => ({
        shippingMethodId: rate.methodId,
        zoneId: rate.zoneId,
        minWeight: rate.minWeight,
        maxWeight: rate.maxWeight,
        baseRate: rate.baseRate,
        perKgRate: rate.perKgRate,
      })));
      
      toast.success("Tu configuración de envíos ha sido actualizada");
    } catch (error) {
      console.error("Error saving shipping settings:", error);
      toast.error("No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-times-now mb-2">Configuración de Envíos</h1>
        <p className="text-gray-600 font-univers">
          Configura las tarifas y opciones de envío para tu tienda
        </p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Configuración General
            </CardTitle>
            <CardDescription>
              Información básica para calcular los envíos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="originState">Estado de Origen</Label>
                <Select value={originState} onValueChange={setOriginState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(MEXICO_STATES).sort().map(state => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">
                  Desde dónde envías tus productos
                </p>
              </div>
              
              <div>
                <Label htmlFor="freeShippingThreshold">Envío Gratis desde</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-gray-100 rounded-l-md">$</span>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    placeholder="1000"
                    className="rounded-l-none"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Monto mínimo para envío gratis (dejar vacío para desactivar)
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="defaultMethod">Método de Envío Predeterminado</Label>
              <Select value={defaultMethodId} onValueChange={setDefaultMethodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un método" />
                </SelectTrigger>
                <SelectContent>
                  {methods.map(method => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Tarifas de Envío
            </CardTitle>
            <CardDescription>
              Configura las tarifas por zona, peso y tipo de servicio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={methods[0]?.id.toString()}>
              <TabsList className="grid grid-cols-3 w-full">
                {methods.map(method => (
                  <TabsTrigger key={method.id} value={method.id.toString()}>
                    {method.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {methods.map(method => (
                <TabsContent key={method.id} value={method.id.toString()} className="space-y-4">
                  {zones.map(zone => (
                    <div key={zone.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{zone.name}</h4>
                      <div className="space-y-2">
                        {weightRanges.map(range => {
                          const rate = rates.find(r => 
                            r.methodId === method.id && 
                            r.zoneId === zone.id && 
                            r.minWeight === range.min
                          );
                          
                          return (
                            <div key={range.min} className="grid grid-cols-3 gap-2 items-center">
                              <span className="text-sm font-univers">{range.label}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-sm">$</span>
                                <Input
                                  type="number"
                                  value={rate?.baseRate || "0"}
                                  onChange={(e) => handleRateChange(method.id, zone.id, range.min, 'baseRate', e.target.value)}
                                  placeholder="0"
                                  className="h-8"
                                />
                                <span className="text-sm">base</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm">$</span>
                                <Input
                                  type="number"
                                  value={rate?.perKgRate || "0"}
                                  onChange={(e) => handleRateChange(method.id, zone.id, range.min, 'perKgRate', e.target.value)}
                                  placeholder="0"
                                  className="h-8"
                                />
                                <span className="text-sm">/kg</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !originState}
            className="bg-black text-white hover:bg-gray-800"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}