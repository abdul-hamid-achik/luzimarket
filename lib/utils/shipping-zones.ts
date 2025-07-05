// All Mexican states
export const MEXICO_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas"
];

// Mexican states grouped by shipping zones
export const MEXICO_SHIPPING_ZONES = {
  central: {
    name: "Zona Central",
    code: "central",
    states: [
      "Ciudad de México",
      "Estado de México", 
      "Morelos",
      "Hidalgo",
      "Tlaxcala",
      "Puebla"
    ],
    baseRateMultiplier: 1.0
  },
  north: {
    name: "Zona Norte",
    code: "north",
    states: [
      "Baja California",
      "Baja California Sur",
      "Sonora", 
      "Chihuahua",
      "Coahuila",
      "Nuevo León",
      "Tamaulipas",
      "Sinaloa",
      "Durango"
    ],
    baseRateMultiplier: 1.3
  },
  south: {
    name: "Zona Sur",
    code: "south",
    states: [
      "Guerrero",
      "Oaxaca",
      "Chiapas",
      "Tabasco",
      "Campeche"
    ],
    baseRateMultiplier: 1.2
  },
  southeast: {
    name: "Zona Sureste",
    code: "southeast",
    states: [
      "Yucatán",
      "Quintana Roo",
      "Veracruz"
    ],
    baseRateMultiplier: 1.25
  },
  west: {
    name: "Zona Oeste",
    code: "west",
    states: [
      "Jalisco",
      "Nayarit",
      "Colima",
      "Michoacán",
      "Guanajuato",
      "Aguascalientes",
      "Zacatecas",
      "San Luis Potosí",
      "Querétaro"
    ],
    baseRateMultiplier: 1.1
  }
};

// Get zone code from state name
export function getZoneFromState(state: string): string {
  for (const [zoneCode, zone] of Object.entries(MEXICO_SHIPPING_ZONES)) {
    if (zone.states.includes(state)) {
      return zoneCode;
    }
  }
  // Default to central zone if state not found
  return 'central';
}

// Calculate zone multiplier between two states
export function getZoneMultiplier(originState: string, destinationState: string): number {
  const originZone = getZoneFromState(originState);
  const destZone = getZoneFromState(destinationState);
  
  // Same zone = no extra charge
  if (originZone === destZone) {
    return 1.0;
  }
  
  // Different zone = use destination zone multiplier
  const zone = MEXICO_SHIPPING_ZONES[destZone as keyof typeof MEXICO_SHIPPING_ZONES];
  return zone?.baseRateMultiplier || 1.0;
}

// Weight ranges for shipping calculations (in grams)
export const WEIGHT_RANGES = [
  { min: 0, max: 1000, label: "0-1 kg" },
  { min: 1000, max: 5000, label: "1-5 kg" },
  { min: 5000, max: 10000, label: "5-10 kg" },
  { min: 10000, max: 20000, label: "10-20 kg" },
  { min: 20000, max: Infinity, label: "20+ kg" }
];

// Get weight range for a given weight
export function getWeightRange(weightInGrams: number) {
  return WEIGHT_RANGES.find(range => 
    weightInGrams >= range.min && weightInGrams < range.max
  ) || WEIGHT_RANGES[WEIGHT_RANGES.length - 1];
}

// Calculate dimensional weight (volumetric weight)
// Used when package is large but light
export function calculateDimensionalWeight(
  length: number, // cm
  width: number,  // cm
  height: number  // cm
): number {
  // Standard dimensional weight divisor for Mexico is 5000
  const divisor = 5000;
  const volumetricWeight = (length * width * height) / divisor;
  // Return in grams
  return volumetricWeight * 1000;
}

// Get chargeable weight (greater of actual or dimensional weight)
export function getChargeableWeight(
  actualWeight: number,
  length: number,
  width: number,
  height: number
): number {
  const dimensionalWeight = calculateDimensionalWeight(length, width, height);
  return Math.max(actualWeight, dimensionalWeight);
}

// Default shipping carriers in Mexico
export const SHIPPING_CARRIERS = {
  estafeta: {
    name: "Estafeta",
    code: "estafeta",
    trackingUrlPattern: "https://www.estafeta.com/Tracking/searchByGet?wayBill={tracking}",
    services: [
      { code: "standard", name: "Terrestre", minDays: 3, maxDays: 5 },
      { code: "express", name: "Día Siguiente", minDays: 1, maxDays: 2 }
    ]
  },
  dhl: {
    name: "DHL Express",
    code: "dhl",
    trackingUrlPattern: "https://www.dhl.com/mx-es/home/tracking.html?tracking-id={tracking}",
    services: [
      { code: "express", name: "Express", minDays: 1, maxDays: 2 },
      { code: "economy", name: "Economy Select", minDays: 2, maxDays: 4 }
    ]
  },
  fedex: {
    name: "FedEx",
    code: "fedex", 
    trackingUrlPattern: "https://www.fedex.com/fedextrack/?trknbr={tracking}",
    services: [
      { code: "overnight", name: "Overnight", minDays: 1, maxDays: 1 },
      { code: "express", name: "Express", minDays: 1, maxDays: 2 },
      { code: "ground", name: "Ground", minDays: 3, maxDays: 5 }
    ]
  },
  correos: {
    name: "Correos de México",
    code: "correos",
    trackingUrlPattern: "https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/Tracking/Tracking.aspx?guia={tracking}",
    services: [
      { code: "standard", name: "Ordinario", minDays: 5, maxDays: 10 },
      { code: "registered", name: "Registrado", minDays: 3, maxDays: 7 }
    ]
  }
};

// Base shipping rates (MXN) - these would typically come from the database
export const BASE_SHIPPING_RATES = {
  standard: {
    baseRate: 89,    // Base rate for 0-1kg
    perKgRate: 15    // Additional cost per kg after 1kg
  },
  express: {
    baseRate: 149,
    perKgRate: 25
  },
  overnight: {
    baseRate: 249,
    perKgRate: 35
  }
};

// Calculate shipping cost
export function calculateShippingCost(
  weightInGrams: number,
  serviceType: 'standard' | 'express' | 'overnight',
  originState: string,
  destinationState: string
): number {
  const weightInKg = weightInGrams / 1000;
  const zoneMultiplier = getZoneMultiplier(originState, destinationState);
  const rates = BASE_SHIPPING_RATES[serviceType];
  
  // Base rate for first kg
  let cost = rates.baseRate;
  
  // Add cost for additional weight
  if (weightInKg > 1) {
    cost += (weightInKg - 1) * rates.perKgRate;
  }
  
  // Apply zone multiplier
  cost *= zoneMultiplier;
  
  // Round to nearest peso
  return Math.round(cost);
}

// Format tracking URL
export function formatTrackingUrl(carrier: string, trackingNumber: string): string {
  const carrierInfo = SHIPPING_CARRIERS[carrier as keyof typeof SHIPPING_CARRIERS];
  if (!carrierInfo) return '';
  
  return carrierInfo.trackingUrlPattern.replace('{tracking}', trackingNumber);
}

// Get estimated delivery date
export function getEstimatedDeliveryDate(
  serviceType: string,
  carrier: string
): { minDate: Date; maxDate: Date } {
  const carrierInfo = SHIPPING_CARRIERS[carrier as keyof typeof SHIPPING_CARRIERS];
  if (!carrierInfo) {
    // Default estimates
    return {
      minDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      maxDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  }
  
  const service = carrierInfo.services.find(s => s.code === serviceType);
  if (!service) {
    return {
      minDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      maxDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  }
  
  // Skip weekends in delivery estimates
  const minDate = addBusinessDays(new Date(), service.minDays);
  const maxDate = addBusinessDays(new Date(), service.maxDays);
  
  return { minDate, maxDate };
}

// Helper to add business days
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

// Validate Mexican postal code
export function validatePostalCode(postalCode: string): boolean {
  // Mexican postal codes are 5 digits
  return /^\d{5}$/.test(postalCode);
}

// Map postal code to state (simplified - in production use a complete mapping)
export function getStateFromPostalCode(postalCode: string): string | null {
  if (!validatePostalCode(postalCode)) return null;
  
  const prefix = postalCode.substring(0, 2);
  
  // Simplified mapping of postal code prefixes to states
  const postalCodeMap: Record<string, string> = {
    '01': 'Ciudad de México',
    '02': 'Ciudad de México',
    '03': 'Ciudad de México',
    '04': 'Ciudad de México',
    '05': 'Ciudad de México',
    '06': 'Ciudad de México',
    '07': 'Ciudad de México',
    '08': 'Ciudad de México',
    '09': 'Ciudad de México',
    '10': 'Ciudad de México',
    '11': 'Ciudad de México',
    '12': 'Ciudad de México',
    '13': 'Ciudad de México',
    '14': 'Ciudad de México',
    '15': 'Ciudad de México',
    '16': 'Ciudad de México',
    '20': 'Aguascalientes',
    '21': 'Baja California',
    '22': 'Baja California',
    '23': 'Baja California Sur',
    '24': 'Campeche',
    '25': 'Coahuila',
    '26': 'Coahuila',
    '27': 'Coahuila',
    '28': 'Colima',
    '29': 'Chiapas',
    '30': 'Chiapas',
    '31': 'Chihuahua',
    '32': 'Chihuahua',
    '33': 'Chihuahua',
    '34': 'Durango',
    '35': 'Durango',
    '36': 'Guanajuato',
    '37': 'Guanajuato',
    '38': 'Guanajuato',
    '39': 'Guerrero',
    '40': 'Guerrero',
    '41': 'Guerrero',
    '42': 'Hidalgo',
    '43': 'Hidalgo',
    '44': 'Jalisco',
    '45': 'Jalisco',
    '46': 'Jalisco',
    '47': 'Jalisco',
    '48': 'Jalisco',
    '49': 'Jalisco',
    '50': 'Estado de México',
    '51': 'Estado de México',
    '52': 'Estado de México',
    '53': 'Estado de México',
    '54': 'Estado de México',
    '55': 'Estado de México',
    '56': 'Estado de México',
    '57': 'Estado de México',
    '58': 'Michoacán',
    '59': 'Michoacán',
    '60': 'Michoacán',
    '61': 'Michoacán',
    '62': 'Morelos',
    '63': 'Nayarit',
    '64': 'Nuevo León',
    '65': 'Nuevo León',
    '66': 'Nuevo León',
    '67': 'Nuevo León',
    '68': 'Oaxaca',
    '69': 'Oaxaca',
    '70': 'Oaxaca',
    '71': 'Oaxaca',
    '72': 'Puebla',
    '73': 'Puebla',
    '74': 'Puebla',
    '75': 'Puebla',
    '76': 'Querétaro',
    '77': 'Quintana Roo',
    '78': 'San Luis Potosí',
    '79': 'San Luis Potosí',
    '80': 'Sinaloa',
    '81': 'Sinaloa',
    '82': 'Sinaloa',
    '83': 'Sonora',
    '84': 'Sonora',
    '85': 'Sonora',
    '86': 'Tabasco',
    '87': 'Tamaulipas',
    '88': 'Tamaulipas',
    '89': 'Tamaulipas',
    '90': 'Tlaxcala',
    '91': 'Veracruz',
    '92': 'Veracruz',
    '93': 'Veracruz',
    '94': 'Veracruz',
    '95': 'Veracruz',
    '96': 'Veracruz',
    '97': 'Yucatán',
    '98': 'Zacatecas',
    '99': 'Zacatecas'
  };
  
  return postalCodeMap[prefix] || null;
}