'use server';

import { db } from "@/db";
import { products, vendors, vendorShippingRates, shippingMethods, shippingZones } from "@/db/schema";
import { eq, and, gte, lte, or, sql } from "drizzle-orm";
import {
  getChargeableWeight,
  calculateShippingCost,
  getStateFromPostalCode,
  validatePostalCode,
  getZoneFromState,
  getEstimatedDeliveryDate,
  SHIPPING_CARRIERS
} from "@/lib/utils/shipping-zones";

export interface ShippingOption {
  id: string;
  carrier: string;
  service: string;
  name: string;
  cost: number;
  estimatedDays: string;
  estimatedDelivery: {
    minDate: Date;
    maxDate: Date;
  };
}

export interface ShippingCalculationInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  destinationPostalCode: string;
  vendorId: string;
}

export async function calculateShipping(input: ShippingCalculationInput) {
  try {
    // Validate postal code
    if (!validatePostalCode(input.destinationPostalCode)) {
      return {
        success: false,
        error: 'Código postal inválido'
      };
    }

    // Get destination state from postal code
    const destinationState = getStateFromPostalCode(input.destinationPostalCode);
    if (!destinationState) {
      return {
        success: false,
        error: 'No se pudo determinar el estado del código postal'
      };
    }

    // Get vendor information including origin state
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.id, input.vendorId),
      columns: {
        shippingOriginState: true,
        freeShippingThreshold: true,
        shippingSettings: true
      }
    });

    if (!vendor || !vendor.shippingOriginState) {
      return {
        success: false,
        error: 'Información de envío del vendedor no disponible'
      };
    }

    // Calculate total weight and dimensions
    let totalWeight = 0;
    let totalVolume = 0;
    let subtotal = 0;

    for (const item of input.items) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, item.productId),
        columns: {
          weight: true,
          length: true,
          width: true,
          height: true,
          price: true,
          shippingClass: true
        }
      });

      if (!product) continue;

      const itemWeight = (product.weight || 500) * item.quantity; // Default 500g if not specified
      totalWeight += itemWeight;

      // Calculate volume for dimensional weight
      if (product.length && product.width && product.height) {
        totalVolume += (product.length * product.width * product.height) * item.quantity;
      }

      subtotal += parseFloat(product.price) * item.quantity;
    }

    // Check if free shipping applies
    const freeShippingThreshold = vendor.freeShippingThreshold
      ? parseFloat(vendor.freeShippingThreshold)
      : null;

    if (freeShippingThreshold && subtotal >= freeShippingThreshold) {
      return {
        success: true,
        freeShipping: true,
        freeShippingThreshold,
        subtotal,
        options: [{
          id: 'free',
          carrier: 'free',
          service: 'standard',
          name: 'Envío Gratis',
          cost: 0,
          estimatedDays: '3-5 días hábiles',
          estimatedDelivery: getEstimatedDeliveryDate('standard', 'estafeta')
        }]
      };
    }

    // Get available shipping options
    const destinationZone = getZoneFromState(destinationState);
    const shippingOptions: ShippingOption[] = [];

    // Calculate standard shipping (always available)
    const standardCost = calculateShippingCost(
      totalWeight,
      'standard',
      vendor.shippingOriginState,
      destinationState
    );

    shippingOptions.push({
      id: 'standard',
      carrier: 'estafeta',
      service: 'standard',
      name: 'Envío Estándar (3-5 días)',
      cost: standardCost,
      estimatedDays: '3-5 días hábiles',
      estimatedDelivery: getEstimatedDeliveryDate('standard', 'estafeta')
    });

    // Calculate express shipping
    const expressCost = calculateShippingCost(
      totalWeight,
      'express',
      vendor.shippingOriginState,
      destinationState
    );

    shippingOptions.push({
      id: 'express',
      carrier: 'dhl',
      service: 'express',
      name: 'Envío Express (1-2 días)',
      cost: expressCost,
      estimatedDays: '1-2 días hábiles',
      estimatedDelivery: getEstimatedDeliveryDate('express', 'dhl')
    });

    // Add overnight if destination is in same zone or adjacent
    if (destinationZone === getZoneFromState(vendor.shippingOriginState)) {
      const overnightCost = calculateShippingCost(
        totalWeight,
        'overnight',
        vendor.shippingOriginState,
        destinationState
      );

      shippingOptions.push({
        id: 'overnight',
        carrier: 'fedex',
        service: 'overnight',
        name: 'Entrega al Día Siguiente',
        cost: overnightCost,
        estimatedDays: '1 día hábil',
        estimatedDelivery: getEstimatedDeliveryDate('overnight', 'fedex')
      });
    }

    // Sort by cost
    shippingOptions.sort((a, b) => a.cost - b.cost);

    return {
      success: true,
      freeShipping: false,
      freeShippingThreshold,
      subtotal,
      remainingForFreeShipping: freeShippingThreshold
        ? Math.max(0, freeShippingThreshold - subtotal)
        : null,
      options: shippingOptions,
      destination: {
        postalCode: input.destinationPostalCode,
        state: destinationState,
        zone: destinationZone
      },
      weight: {
        actual: totalWeight,
        formatted: totalWeight >= 1000
          ? `${(totalWeight / 1000).toFixed(1)} kg`
          : `${totalWeight} g`
      }
    };

  } catch (error) {
    console.error('Error calculating shipping:', error);
    return {
      success: false,
      error: 'Error al calcular el envío'
    };
  }
}

// Get shipping method details
export async function getShippingMethodDetails(methodId: string) {
  try {
    if (methodId === 'free') {
      return {
        success: true,
        method: {
          id: 'free',
          name: 'Envío Gratis',
          carrier: 'various',
          cost: 0,
          estimatedDays: '3-5 días hábiles'
        }
      };
    }

    // For now, return based on the ID
    const carriers = {
      standard: {
        id: 'standard',
        name: 'Envío Estándar',
        carrier: 'estafeta',
        estimatedDays: '3-5 días hábiles'
      },
      express: {
        id: 'express',
        name: 'Envío Express',
        carrier: 'dhl',
        estimatedDays: '1-2 días hábiles'
      },
      overnight: {
        id: 'overnight',
        name: 'Entrega al Día Siguiente',
        carrier: 'fedex',
        estimatedDays: '1 día hábil'
      }
    };

    const method = carriers[methodId as keyof typeof carriers];
    if (!method) {
      return {
        success: false,
        error: 'Método de envío no encontrado'
      };
    }

    return {
      success: true,
      method
    };
  } catch (error) {
    console.error('Error getting shipping method:', error);
    return {
      success: false,
      error: 'Error al obtener método de envío'
    };
  }
}

// Initialize shipping data (for seeding)
export async function initializeShippingData() {
  try {
    // Check if shipping zones exist
    const existingZones = await db.query.shippingZones.findFirst();
    if (existingZones) {
      return { success: true, message: 'Shipping data already initialized' };
    }

    // Insert shipping zones
    const zones = [
      {
        name: 'Zona Central',
        code: 'central',
        description: 'Ciudad de México y estados circundantes',
        states: ['Ciudad de México', 'Estado de México', 'Morelos', 'Hidalgo', 'Tlaxcala', 'Puebla'],
        baseRateMultiplier: '1.0'
      },
      {
        name: 'Zona Norte',
        code: 'north',
        description: 'Estados del norte de México',
        states: ['Baja California', 'Baja California Sur', 'Sonora', 'Chihuahua', 'Coahuila', 'Nuevo León', 'Tamaulipas', 'Sinaloa', 'Durango'],
        baseRateMultiplier: '1.3'
      },
      {
        name: 'Zona Sur',
        code: 'south',
        description: 'Estados del sur de México',
        states: ['Guerrero', 'Oaxaca', 'Chiapas', 'Tabasco', 'Campeche'],
        baseRateMultiplier: '1.2'
      },
      {
        name: 'Zona Sureste',
        code: 'southeast',
        description: 'Península de Yucatán y Veracruz',
        states: ['Yucatán', 'Quintana Roo', 'Veracruz'],
        baseRateMultiplier: '1.25'
      },
      {
        name: 'Zona Oeste',
        code: 'west',
        description: 'Estados del occidente de México',
        states: ['Jalisco', 'Nayarit', 'Colima', 'Michoacán', 'Guanajuato', 'Aguascalientes', 'Zacatecas', 'San Luis Potosí', 'Querétaro'],
        baseRateMultiplier: '1.1'
      }
    ];

    await db.insert(shippingZones).values(zones);

    // Insert shipping methods
    const methods = [
      {
        carrier: 'Estafeta',
        serviceType: 'standard',
        name: 'Estafeta Terrestre',
        code: 'estafeta-standard',
        description: 'Servicio terrestre económico',
        minDeliveryDays: 3,
        maxDeliveryDays: 5,
        trackingUrlPattern: 'https://www.estafeta.com/Tracking/searchByGet?wayBill={tracking}'
      },
      {
        carrier: 'Estafeta',
        serviceType: 'express',
        name: 'Estafeta Día Siguiente',
        code: 'estafeta-express',
        description: 'Entrega al día siguiente',
        minDeliveryDays: 1,
        maxDeliveryDays: 2,
        trackingUrlPattern: 'https://www.estafeta.com/Tracking/searchByGet?wayBill={tracking}'
      },
      {
        carrier: 'DHL',
        serviceType: 'express',
        name: 'DHL Express',
        code: 'dhl-express',
        description: 'Servicio express internacional',
        minDeliveryDays: 1,
        maxDeliveryDays: 2,
        trackingUrlPattern: 'https://www.dhl.com/mx-es/home/tracking.html?tracking-id={tracking}'
      },
      {
        carrier: 'FedEx',
        serviceType: 'overnight',
        name: 'FedEx Overnight',
        code: 'fedex-overnight',
        description: 'Entrega garantizada al día siguiente',
        minDeliveryDays: 1,
        maxDeliveryDays: 1,
        trackingUrlPattern: 'https://www.fedex.com/fedextrack/?trknbr={tracking}'
      },
      {
        carrier: 'Correos de México',
        serviceType: 'standard',
        name: 'Correos Ordinario',
        code: 'correos-standard',
        description: 'Servicio postal ordinario',
        minDeliveryDays: 5,
        maxDeliveryDays: 10,
        trackingUrlPattern: 'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/Tracking/Tracking.aspx?guia={tracking}'
      }
    ];

    await db.insert(shippingMethods).values(methods);

    return {
      success: true,
      message: 'Shipping zones and methods initialized successfully'
    };
  } catch (error) {
    console.error('Error initializing shipping data:', error);
    return {
      success: false,
      error: 'Failed to initialize shipping data'
    };
  }
}

// Get all shipping zones
export async function getShippingZones() {
  try {
    const zones = await db.query.shippingZones.findMany({
      orderBy: (zones, { asc }) => [asc(zones.name)]
    });

    return {
      success: true,
      zones
    };
  } catch (error) {
    console.error('Error getting shipping zones:', error);
    return {
      success: false,
      error: 'Failed to get shipping zones'
    };
  }
}

// Get all shipping methods
export async function getShippingMethods() {
  try {
    const methods = await db.query.shippingMethods.findMany({
      orderBy: (methods, { asc }) => [asc(methods.carrier), asc(methods.name)]
    });

    return {
      success: true,
      methods
    };
  } catch (error) {
    console.error('Error getting shipping methods:', error);
    return {
      success: false,
      error: 'Failed to get shipping methods'
    };
  }
}

// Update vendor shipping settings
export async function updateVendorShippingSettings(vendorId: string, settings: any) {
  try {
    const fieldsToUpdate: Partial<typeof vendors.$inferInsert> = {};

    if (typeof settings?.shippingOriginState === 'string') {
      (fieldsToUpdate as any).shippingOriginState = settings.shippingOriginState;
    }

    if (typeof settings?.freeShippingThreshold === 'number') {
      (fieldsToUpdate as any).freeShippingThreshold = settings.freeShippingThreshold;
    }

    if (typeof settings?.defaultShippingMethodId === 'number') {
      (fieldsToUpdate as any).defaultShippingMethodId = settings.defaultShippingMethodId;
    }

    // Optionally merge JSON settings
    if (settings?.shippingSettings && typeof settings.shippingSettings === 'object') {
      // Read current settings to merge
      const current = await db.query.vendors.findFirst({
        where: eq(vendors.id, vendorId),
        columns: { shippingSettings: true }
      });

      const merged = {
        ...(current?.shippingSettings || {}),
        ...settings.shippingSettings,
      } as any;

      (fieldsToUpdate as any).shippingSettings = merged;
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await db
        .update(vendors)
        .set({
          ...(fieldsToUpdate as any),
          updatedAt: new Date(),
        })
        .where(eq(vendors.id, vendorId));
    }

    return {
      success: true,
      message: 'Shipping settings updated successfully'
    };
  } catch (error) {
    console.error('Error updating vendor shipping settings:', error);
    return {
      success: false,
      error: 'Failed to update shipping settings'
    };
  }
}

// Save vendor shipping rates
export async function saveVendorShippingRates(vendorId: string, rates: any[]) {
  try {
    // Delete existing rates
    await db.delete(vendorShippingRates).where(eq(vendorShippingRates.vendorId, vendorId));

    // Insert new rates
    if (rates.length > 0) {
      await db.insert(vendorShippingRates).values(
        rates.map(rate => ({
          ...rate,
          vendorId
        }))
      );
    }

    return {
      success: true,
      message: 'Shipping rates saved successfully'
    };
  } catch (error) {
    console.error('Error saving vendor shipping rates:', error);
    return {
      success: false,
      error: 'Failed to save shipping rates'
    };
  }
}

// Fetch vendor shipping settings (simple helper)
export async function getVendorShippingSettings(vendorId: string) {
  try {
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.id, vendorId),
      columns: {
        shippingOriginState: true,
        freeShippingThreshold: true,
        defaultShippingMethodId: true,
        shippingSettings: true,
      },
    });

    return { success: true, vendor };
  } catch (error) {
    console.error('Error fetching vendor shipping settings:', error);
    return { success: false, error: 'Failed to fetch vendor shipping settings' };
  }
}

// Fetch vendor shipping rates
export async function getVendorShippingRates(vendorId: string) {
  try {
    const rates = await db.query.vendorShippingRates.findMany({
      where: eq(vendorShippingRates.vendorId, vendorId),
      orderBy: (t, { asc }) => [asc(t.zoneId), asc(t.shippingMethodId), asc(t.minWeight)],
    });

    return { success: true, rates };
  } catch (error) {
    console.error('Error fetching vendor shipping rates:', error);
    return { success: false, error: 'Failed to fetch vendor shipping rates' };
  }
}